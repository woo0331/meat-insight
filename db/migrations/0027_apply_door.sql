-- ════════════════════════════════════════════════════════════════════
-- 0027 — 입점 신청을 **넣는 문** (지시서 5번 A · 11번 5단계)
-- ════════════════════════════════════════════════════════════════════
-- 0016 이 provider_apply 표와 **상태를 바꾸는 문**은 만들어 두었는데
-- **넣는 문이 없습니다.** 앞 서비스는 서버가 service key 로 넣었습니다 —
-- 그 키는 RLS 를 통째로 지나가므로 쓰지 않습니다. 대신 검사를 다 거치는
-- 문 하나를 열고, 그 문으로만 들어오게 합니다.
--
-- ⚠️⚠️ **인자를 jsonb 하나로 받습니다.** 칸이 늘 때마다 인자를 더하면
--   부르는 쪽과 받는 쪽의 **자리**가 어긋나고, 그 어긋남은 "인자 개수가
--   다릅니다" 가 아니라 **엉뚱한 값이 엉뚱한 칸에 들어가는** 꼴로
--   납니다. 앞 서비스에서 그렇게 겪었습니다.
--
-- ⚠️⚠️ **로그인 없이 부를 수 있습니다** (anon). 입점하려는 사장님에게
--   먼저 회원가입을 시키면 그 자리에서 절반이 떠납니다. 대신 ——
--     · 넣기만 됩니다. 읽기는 운영자만입니다 (0016 의 RLS).
--     · 같은 번호로 10분 안에 또 넣으면 막습니다 (지시서 5번 A
--       "중복 · 허위 신청 방지").
--     · 빈 칸 · 말이 안 되는 번호 · 미래의 동의 시각을 막습니다.
--   ⚠️ 그래도 **스팸을 완전히 막지는 못합니다.** 초당 횟수 제한은 DB 가
--   아니라 앞단(Vercel · Cloudflare)에서 걸어야 합니다. 열어 둔 문이라는
--   것을 잊지 마세요.
--
-- ⚠️⚠️ **서비스 키(하위 분류)를 DB 가 검사하지 않습니다.** 그 목록은
--   js/data/catalog.js 에 있고, 두 곳에 적으면 한쪽만 고쳐서 조용히
--   어긋납니다. 대신 **빌드 가드**(tools/check-form.js)가 화면이 내는
--   값이 실제 하위 키인지 봅니다.
--
-- ⚠️ 신청번호는 **서울 날짜 + 일련번호**입니다. Supabase 는 UTC 라
--   그냥 now() 를 쓰면 밤 9시 이후 신청이 **다음 날 번호**를 답니다.
-- ════════════════════════════════════════════════════════════════════
begin;

create sequence if not exists apply_no_seq;

create or replace function make_apply(p jsonb)
  returns text language plpgsql security definer set search_path = public as $$
declare
  v_company  text := btrim(coalesce(p->>'company', ''));
  v_name     text := btrim(coalesce(p->>'name', ''));
  v_tel      text := btrim(coalesce(p->>'tel', ''));
  v_email    text := nullif(btrim(coalesce(p->>'email', '')), '');
  v_brn      text := nullif(btrim(coalesce(p->>'brn', '')), '');
  v_region   text := nullif(btrim(coalesce(p->>'region', '')), '');
  v_note     text := nullif(btrim(coalesce(p->>'note', '')), '');
  v_svc      text[] := coalesce(
                 (select array_agg(btrim(x)) from jsonb_array_elements_text(
                    case when jsonb_typeof(p->'services') = 'array'
                         then p->'services' else '[]'::jsonb end) as t(x)
                  where btrim(x) <> ''), '{}'::text[]);
  v_digits   text;
  v_no       text;
begin
  -- ⚠️ 자물쇠마다 **다른 말**로 거절합니다. 같은 말이면 하나를 빼 봐도
  --    다른 것이 먼저 막아 엉뚱한 까닭으로 통과합니다.
  if v_company = '' then raise exception '상호를 적어 주세요'; end if;
  if v_name    = '' then raise exception '담당자 성함을 적어 주세요'; end if;
  if v_tel     = '' then raise exception '연락처를 적어 주세요'; end if;

  if length(v_company) > 80  then raise exception '상호가 너무 깁니다'; end if;
  if length(v_name)    > 40  then raise exception '성함이 너무 깁니다'; end if;
  if v_note is not null and length(v_note) > 2000 then
    raise exception '남기신 말씀이 너무 깁니다';
  end if;

  v_digits := regexp_replace(v_tel, '[^0-9]', '', 'g');
  -- ⚠️ 경계값: 9자리(02-xxx-xxxx)부터 11자리(010-xxxx-xxxx)까지입니다.
  if length(v_digits) < 9 or length(v_digits) > 11 then
    raise exception '연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다';
  end if;

  if array_length(v_svc, 1) is null then
    raise exception '하시는 일을 하나 이상 골라 주세요';
  end if;
  if array_length(v_svc, 1) > 20 then
    raise exception '고르신 항목이 너무 많습니다';
  end if;

  -- ⚠️⚠️ 동의 시각은 **화면이 보낸 값**입니다. 미래이거나 너무 오래된
  --    것은 믿지 않습니다 (개인정보보호법 제15조 — 그 자리에서 받은
  --    동의여야 합니다).
  if (p->>'agree_at') is null then
    raise exception '수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes' then
    raise exception '동의 시각이 미래입니다';
  end if;
  if (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의가 오래되었습니다 — 다시 한 번 눌러 주세요';
  end if;

  -- 중복 · 허위 신청 막기 (지시서 5번 A)
  if exists (
    select 1 from provider_apply
     where regexp_replace(tel, '[^0-9]', '', 'g') = v_digits
       and state = 'new'
       and created_at > now() - interval '10 minutes')
  then
    raise exception '방금 같은 번호로 신청이 들어왔습니다 — 잠시 뒤에 다시 해 주세요';
  end if;

  v_no := 'GA' || to_char(now() at time zone 'Asia/Seoul', 'YYMMDD')
               || '-' || lpad(nextval('apply_no_seq')::text, 4, '0');

  insert into provider_apply
    (no, company, brn, name, tel, email, region, services, note, agree_at)
  values
    (v_no, v_company, v_brn, v_name, v_tel, v_email, v_region, v_svc, v_note,
     (p->>'agree_at')::timestamptz);

  -- ⚠️ 감사 기록에 **성함 · 연락처를 넣지 않습니다.** audit_log 는 오래
  --    남고 보는 사람도 넓습니다. 신청번호로 찾아가면 됩니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (auth.uid(), my_role(), 'provider_apply', v_no, 'new', '입점 신청 접수',
          jsonb_build_object('services', v_svc, 'region', v_region));

  return v_no;
end $$;

revoke all on function make_apply(jsonb) from public;
grant execute on function make_apply(jsonb) to anon, authenticated;

insert into schema_version (n, name) values (27, '0027_apply_door')
on conflict (n) do nothing;

commit;
