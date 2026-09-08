#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════
#  db/RLS_ON.sql 을 진짜 Postgres 에 돌려 보는 검사
#
#  왜 필요한가
#    RLS 는 사이트에서 제일 위험한 부분인데, SQL 은 눈으로 봐서는
#    맞는지 알 수 없습니다. 실제로 이 검사가 잡아낸 것들:
#      · chat_rooms 에 buyer_id 컬럼이 없음 (진짜 이름은 buyer_user_id)
#      · phase7 이 admins.user_id 를 참조 — phase4 는 email 키라 없는 컬럼
#        → 관리자가 신고·문의를 아예 못 보는 상태였습니다
#
#  쓰는 법 (postgresql-16 이 설치돼 있어야 합니다)
#    bash test/rls-test.sh
#
#  실제 Supabase 에는 접속하지 않습니다. 임시 DB 를 만들어 쓰고 지웁니다.
# ════════════════════════════════════════════════════════════════════
set -uo pipefail
BIN=$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | head -1)
[ -z "$BIN" ] && { echo "postgresql 이 없습니다 (apt install postgresql)"; exit 2; }
D=${RLS_TEST_DIR:-/var/tmp/gori-rls-test}
PORT=${RLS_TEST_PORT:-55432}
U=${RLS_TEST_USER:-pgtest}
id "$U" >/dev/null 2>&1 || useradd -M -s /bin/false "$U" 2>/dev/null

cleanup(){ su "$U" -s /bin/bash -c "$BIN/pg_ctl -D $D/data stop -m immediate" >/dev/null 2>&1; }
trap cleanup EXIT

rm -rf "$D"; mkdir -p "$D"; chown "$U:$U" "$D"; chmod 700 "$D"
su "$U" -s /bin/bash -c "$BIN/initdb -D $D/data -U postgres --auth=trust" >/dev/null 2>&1 || { echo "initdb 실패"; exit 2; }
su "$U" -s /bin/bash -c "$BIN/pg_ctl -D $D/data -o '-p $PORT -k $D -c listen_addresses=\"\"' -l $D/log start" >/dev/null 2>&1
sleep 3
P="psql -h $D -p $PORT -U postgres -d postgres -tA"
$P -c "select 1" >/dev/null 2>&1 || { echo "postgres 기동 실패 — $D/log 를 보세요"; exit 2; }

# Supabase 흉내: auth 스키마·역할·레거시 표
$P -q <<'SQL' >/dev/null
create schema if not exists auth;
create extension if not exists pgcrypto;
create or replace function auth.uid()   returns uuid language sql stable as $$ select null::uuid $$;
create or replace function auth.email() returns text language sql stable as $$ select null::text $$;
create or replace function auth.role()  returns text language sql stable as $$ select 'anon'::text $$;
create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text);
create role anon nologin; create role authenticated nologin; create role service_role nologin;
create table public.purchase_requests (id uuid primary key default gen_random_uuid(), created_at timestamptz default now(), status text, region text, description text, buyer_name text, buyer_phone text, quote_count int default 0, category text, request_number text);
create table public.suppliers (id uuid primary key default gen_random_uuid(), created_at timestamptz default now(), name text, region text, categories text[], contact text, rating numeric, is_verified boolean);
create table public.jobs (id uuid primary key default gen_random_uuid(), created_at timestamptz default now(), status text, kind text, job_role text, pay text, location text, company text, contact text);
SQL

fail=0
for f in db/phase2_schema.sql db/phase3_schema.sql db/phase4_admin.sql db/phase7_report.sql; do
  err=$(psql -h "$D" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -f "$f" 2>&1 | grep -iE "^psql.*ERROR" | head -2)
  if [ -n "$err" ]; then echo "  ❌ $f"; echo "$err" | sed 's/^/      /'; fail=$((fail+1)); else echo "  ✅ $f"; fi
done

echo "  ── RLS_ON.sql"
err=$(psql -h "$D" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -f db/RLS_ON.sql 2>&1 | grep -iE "^psql.*ERROR|^ERROR" | head -3)
if [ -n "$err" ]; then echo "  ❌ 실행 실패"; echo "$err" | sed 's/^/      /'; fail=$((fail+1)); else echo "  ✅ 오류 없이 실행"; fi

# 정책 없이 켜진 표 = 아무도 못 읽는 표
bare=$($P -c "select string_agg(t,', ') from (select c.relname t from pg_class c
  join pg_namespace n on n.oid=c.relnamespace and n.nspname='public'
  left join pg_policy p on p.polrelid=c.oid where c.relkind='r'
  group by c.relname,c.relrowsecurity having c.relrowsecurity and count(p.polname)=0) x;")
off=$($P -c "select string_agg(c.relname,', ') from pg_class c
  join pg_namespace n on n.oid=c.relnamespace and n.nspname='public'
  where c.relkind='r' and not c.relrowsecurity;")
[ -n "$off" ]  && { echo "  ❌ RLS 꺼진 표: $off"; fail=$((fail+1)); } || echo "  ✅ 19개 표 전부 RLS 켜짐"
[ -n "$bare" ] && { echo "  ❌ 정책 없는 표(아무도 못 읽음): $bare"; fail=$((fail+1)); } || echo "  ✅ 정책 없는 표 없음"

# Supabase 기본 권한 — RLS 만이 유일한 보호막인 상태를 재현
$P -q -c "grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;" >/dev/null
$P -q -c "insert into public.purchase_requests (id,status,description,user_id)
  values ('11111111-1111-1111-1111-111111111111','견적대기','남의 요청','22222222-2222-2222-2222-222222222222');" >/dev/null

chk(){ # 이름 · 기대(ok|deny) · SQL
  local nm="$1" want="$2" sql="$3"
  local out; out=$(psql -h "$D" -p "$PORT" -U postgres -d postgres -tA -c "set role anon; $sql" 2>&1)
  local blocked=0
  echo "$out" | grep -qiE "violates row-level security|permission denied" && blocked=1
  echo "$out" | grep -qE "(UPDATE|DELETE|INSERT) 0$" && blocked=1
  if [ "$want" = ok ]; then
    [ $blocked -eq 0 ] && echo "  ✅ $nm" || { echo "  ❌ $nm — 막혔습니다(열려 있어야 함)"; fail=$((fail+1)); }
  else
    [ $blocked -eq 1 ] && echo "  ✅ $nm" || { echo "  ❌ $nm — 뚫렸습니다"; fail=$((fail+1)); }
  fi
}
echo "  ── anon 으로 실제 시도"
chk "요청 목록 읽기 (열려야)"   ok   "select count(*) from public.purchase_requests;"
chk "비로그인 요청 등록 (열려야)" ok  "insert into public.purchase_requests (status,description) values ('견적대기','손님') returning 1;"
chk "남의 요청 수정 (막혀야)"   deny "update public.purchase_requests set description='해킹' where id='11111111-1111-1111-1111-111111111111';"
chk "남의 요청 삭제 (막혀야)"   deny "delete from public.purchase_requests where id='11111111-1111-1111-1111-111111111111';"
chk "업체 전체 삭제 (막혀야)"   deny "delete from public.suppliers;"
chk "가짜 시세 넣기 (막혀야)"   deny "insert into public.market_prices (item,price) values ('가짜',1);"

echo
[ $fail -eq 0 ] && echo "✅ 전체 통과" || echo "❌ $fail건 실패"
exit $fail
