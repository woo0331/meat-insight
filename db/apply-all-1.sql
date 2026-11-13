/* ==================================================================
   0001 ~ 0024 를 한 번에 —
   Supabase SQL 편집기에 **이 파일을 통째로** 붙여 넣고 Run 하세요.
   ==================================================================
   WARN 빌드가 만드는 파일입니다 — 손으로 고치지 마세요.
   db/migrations 의 24개를 번호 차례로 이어 붙인 것이고
   한 글자도 바꾸지 않았습니다. (node tools/make-apply.js)

   조각 파일입니다 — 바로 앞 조각까지 끝낸 DB 에만 쓰세요.
   어디까지 됐는지는 db/resume.sql 이 말해 줍니다
   (select max(n) from schema_version).

   돌린 뒤에는 db/verify.sql 을 붙여 넣어 보세요. 중간에서 멈추면 그
   파일 하나만 따로 돌리고 그 다음부터 이어 가시면 됩니다 — 번호를
   다시 쓰지 않습니다.

   WARN 통째로 begin/commit 으로 감싸지 마세요 — 파일마다 제
   트랜잭션이 있고 0015 는 일부러 감싸지 않았습니다. */

/* ---------------------------- 0001_init.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0001_init — 수익형 플랫폼의 첫 스키마 (지시서 §5 ~ §12)
--
-- ⚠️⚠️ **값(enum)을 js/data/deal.js · js/data/fee.js 와 똑같이 적습니다.**
--   둘이 어긋나면 화면이 보낸 상태를 DB 가 거절하거나, 더 나쁘게는
--   DB 에 저장된 상태를 화면이 못 읽습니다. 에러가 늦게 터지는 종류라
--   `build-pages.js` 의 checkDealSql() 이 **빌드마다 두 파일을 맞춰
--   보고 다르면 멈춥니다.** 한쪽만 고치지 마세요.
--
-- ⚠️ 돈은 전부 **bigint(원 단위 정수)** 입니다. numeric/float 로 두면
--   반올림이 조금씩 어긋나고 그 차이가 정산서에서 드러납니다.
--   요율만 numeric(7,4) 입니다 (퍼센트. 3 = 3%).
--
-- ⚠️⚠️ **기존 업체 id 는 문자열(slug)입니다.** `/p/ganada-interior` 같은
--   주소가 이미 색인되어 있어서 uuid 로 바꾸면 그 주소가 전부 깨집니다
--   (2026-10-08 지시 "기존 URL은 절대 변경하지 마세요"). 그래서
--   provider.id 와 offer.id 는 text 입니다.
--
-- 되돌리기: 0001_init_down.sql
-- ════════════════════════════════════════════════════════════════════

-- ── 상태값 ───────────────────────────────────────────────────────────
-- ⚠️ 차례가 js/data/deal.js 의 AM_DEAL_ST 와 같습니다 (§8).
-- ⚠️⚠️ 2026-10-09 §8-3 로 **'hold'(보류)** 가 들어왔습니다 — 열두→열셋.
--    이 파일을 고친 까닭은 **아직 어느 DB 에도 안 돌렸기** 때문입니다.
--    ⚠️ 혹시 이미 돌리셨다면 `0006_hold_state.sql` 이 따라잡습니다
--    (add value if not exists · on conflict do nothing 으로 두 번 돌아도 안전).
create type deal_state as enum (
  'new', 'check', 'assigned', 'accepted', 'consult', 'quoted',
  'nego', 'signed', 'done', 'lost', 'hold', 'fee_wait', 'fee_done'
);

-- ⚠️ js/data/deal.js 의 AM_ROLES
create type app_role as enum ('customer', 'provider', 'staff', 'admin');

-- ⚠️ js/data/fee.js 의 AM_FEE_TYPE (§9 수익모델 여섯)
create type fee_type as enum (
  'lead', 'close', 'rate', 'base_rate', 'margin', 'sub'
);

-- ⚠️ js/data/fee.js 의 AM_FEE_VAT · AM_FEE_WHEN · AM_FEE_CYCLE
create type fee_vat   as enum ('add', 'incl', 'free');
create type fee_when  as enum ('lead_ok', 'signed', 'done', 'paid');
create type fee_cycle as enum ('now', 'monthly', 'half');

-- §5 "실제 제휴사가 확보되지 않은 상품은 신청 가능 상품처럼 오인시키지
--     말고 '서비스 준비 중' 또는 일반 정보 페이지로 처리한다"
--   info = 정보 화면만 (신청 단추를 내지 않습니다)
--   live = 실제 신청 가능
--   off  = 내려놓음
create type offer_status as enum ('info', 'live', 'off');


-- ── 누가 쓰는가 ──────────────────────────────────────────────────────
-- Supabase 의 auth.users 가 비밀번호와 세션을 들고 있습니다. 우리는
-- **역할만** 들고 갑니다 — 비밀번호를 직접 보관하지 않는 쪽입니다.
create table account (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        app_role not null default 'customer',
  provider_id text,                     -- role='provider' 일 때만
  name        text,
  created_at  timestamptz not null default now()
);

-- ⚠️⚠️ 역할을 함수로 한 번만 읽습니다. 아래 모든 RLS 규칙이 이것을
-- 씁니다 — 규칙마다 따로 적으면 한 곳만 고치는 사고가 납니다.
-- security definer 라야 RLS 에 걸리지 않고 자기 역할을 읽습니다.
create or replace function my_role() returns app_role
  language sql stable security definer set search_path = public as $$
  select role from account where id = auth.uid()
$$;

create or replace function my_provider() returns text
  language sql stable security definer set search_path = public as $$
  select provider_id from account where id = auth.uid()
$$;


-- ── 업체 (§7) ────────────────────────────────────────────────────────
-- ⚠️ 칸 이름을 js/data/providers.js 와 같게 두었습니다. 파일에 있던
-- 업체를 그대로 옮겨 적을 수 있어야 합니다 (기존 데이터 호환).
-- ⚠️⚠️ **평점 · 후기 수 · 작업 수 칸이 없습니다.** 실제 후기에서 세는
-- 값입니다 (절대 규칙 1) — 칸으로 두면 누군가 4.9 를 적어 넣습니다.
create table provider (
  id            text primary key,            -- slug. /p/:id 가 됩니다
  name          text not null,
  intro         text,
  regions       text[] not null default '{}', -- regions.js key
  gu            text[] not null default '{}', -- 시·군·구
  industries    text[] not null default '{}', -- industries.js key
  subs          text[] not null default '{}', -- ⚠️ catalog.js 의 **하위** key
  since         int,
  consult_hours text,
  -- §7 "사업자정보 및 검증 상태" — ⚠️ 플랫폼이 **실제로 확인한 것만**
  -- true 입니다 (js/data/providers.js 의 AM_VERIFY 여섯)
  verified      jsonb not null default '{}',
  listed        boolean not null default false, -- 공개 목록에 낼 것인가
  created_at    timestamptz not null default now()
);
alter table account
  add constraint account_provider_fk
  foreign key (provider_id) references provider(id) on delete set null;


-- ── 수익상품 (§5) ────────────────────────────────────────────────────
create table offer (
  id            text primary key,            -- slug
  name          text not null,
  lead          text,
  cats          text[] not null default '{}', -- catalog.js 분류 key
  industries    text[] not null default '{}',
  regions       text[] not null default '{}',
  apply_type    text,                        -- §5 신청 유형
  needs_consult boolean not null default true,
  cost_note     text,                        -- §5 "예상 비용 안내 방식"
  status        offer_status not null default 'info',
  created_at    timestamptz not null default now()
);


-- ── 신청 (§6) ────────────────────────────────────────────────────────
-- ⚠️⚠️ **여기에 개인정보가 처음으로 '보관'됩니다.** 지금까지 이 사이트는
-- 받아서 슬랙으로 흘려보내고 아무것도 남기지 않았습니다. 이 표가
-- 생기는 순간 개인정보보호법 제21조(파기) · 제29조(안전조치)가
-- 따라옵니다 — 방침 제3조의 보유기간(견적 처리 완료 후 1년)대로
-- 지우는 일을 **반드시 돌려야** 합니다 (아래 주석 참고).
create table request (
  id          uuid primary key default gen_random_uuid(),
  -- §6 "모든 신청에 고유 신청번호를 발급한다"
  -- ⚠️⚠️ 순번으로 만들지 마세요 — 남의 신청번호를 세어 볼 수 있습니다.
  no          text not null unique,
  user_id     uuid references auth.users(id) on delete set null,
  side        text not null,               -- start | ops | transfer | close
  industry    text,
  cat         text,
  offer_id    text references offer(id) on delete set null,
  region      text,
  gu          text,
  budget_min  bigint,
  budget_max  bigint,                      -- §6 "예상 예산 범위" (확정 아님)
  want_at     text,
  body        text,
  detail      jsonb not null default '{}',  -- §6 서비스마다 다른 답
  -- 개인정보 ─────────────────────────────────────────────
  name        text not null,
  tel         text not null,
  email       text,
  -- ⚠️⚠️ 동의를 **시각으로** 남깁니다. boolean 으로 두면 "언제 받았나" 를
  -- 못 대고, 그게 분쟁에서 받지 않은 것과 같아집니다.
  agree_at    timestamptz not null,         -- 수집·이용 (제15조)
  -- ⚠️⚠️ 제3자 제공 재동의 (제17조 제2항). 접수 시점에는 **반드시
  -- null** 입니다 — 어느 업체에 줄지 정해지지 않았으니까요. 방침
  -- 제4조 제3항이 그렇게 적혀 있습니다.
  agree3rd_at timestamptz,
  state       deal_state not null default 'new',
  created_at  timestamptz not null default now()
);
create index request_state_idx on request (state, created_at desc);
create index request_user_idx  on request (user_id);
-- §6 "중복 신청과 스팸을 방지" — 같은 번호로 같은 상품을 10분 안에
-- 또 넣는 것을 막는 바탕입니다 (판단은 함수에서, 여기는 찾기만)
create index request_tel_idx on request (tel, created_at desc);


-- ── 배정 (§7) ────────────────────────────────────────────────────────
create table assignment (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references request(id) on delete cascade,
  provider_id text not null references provider(id) on delete cascade,
  state       text not null default 'sent',  -- sent | accepted | declined
  -- ⚠️⚠️ 이 줄이 제17조입니다. 재동의 시각 없이 배정하면 그 자리에서
  -- 법 위반이라 **not null** 입니다.
  agree3rd_at timestamptz not null,
  by_user     uuid references auth.users(id) on delete set null,
  why         text,
  created_at  timestamptz not null default now(),
  unique (request_id, provider_id)
);


-- ── 수수료 정책 (§9) ─────────────────────────────────────────────────
-- ⚠️⚠️ **칸 이름이 js/data/fee.js 와 셋 다릅니다.** SQL 에서 when 은
-- 예약어에 가깝고 min·max 는 함수 이름이라 바꿨습니다. 3차에서 화면과
-- DB 를 잇는 자리에서 **이 표대로** 옮기세요 — 한 글자 틀리면 그 칸이
-- 에러 없이 조용히 사라집니다 (업체 subs · 사진 키에서 겪은 자리).
--
--     js/data/fee.js        0001_init.sql
--     ───────────────────   ──────────────
--     when                  confirm_when
--     min                   min_fee
--     max                   max_fee
--     from / to             from_date / to_date
--
-- ⚠️ 나머지(type · flat · rate · vat · cycle)는 이름이 같습니다.
create table fee_policy (
  id          uuid primary key default gen_random_uuid(),
  provider_id text not null references provider(id) on delete cascade,
  offer_id    text references offer(id) on delete set null,
  type        fee_type  not null,
  flat        bigint,                        -- 정액 (원)
  rate        numeric(7,4),                  -- 퍼센트. 3 = 3%
  min_fee     bigint,
  max_fee     bigint,
  vat         fee_vat   not null default 'add',
  confirm_when fee_when not null default 'done',
  cycle       fee_cycle not null default 'monthly',
  refund_rule text,                          -- §9 취소·환불·환수 조건
  from_date   date,
  to_date     date,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  -- ⚠️ js/data/fee.js 의 amFeeBadPolicy() 와 **같은 규칙**입니다.
  -- 화면에서 막고 DB 에서 한 번 더 막습니다 (접수 동의와 같은 방식).
  constraint fee_rate_range check (rate is null or (rate > 0 and rate <= 100)),
  constraint fee_flat_sign  check (flat is null or flat >= 0),
  constraint fee_minmax     check (min_fee is null or max_fee is null or min_fee <= max_fee),
  constraint fee_dates      check (from_date is null or to_date is null or from_date <= to_date)
);


-- ── 계약 (§8 · §9) ───────────────────────────────────────────────────
create table deal (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references request(id) on delete cascade,
  provider_id text not null references provider(id) on delete cascade,
  -- ⚠️⚠️ §9 "계약금액, 수수료율, 수수료 확정액, 실제 입금액을 **각각
  -- 구분해 저장**한다" — 네 칸입니다. 하나로 합치면 "얼마를 확정했다가
  -- 얼마를 받았는가" 가 기록에서 사라집니다.
  amount      bigint,                        -- ① 계약금액 (상담 후 입력)
  -- ② ③ 적용된 정책과 그 요율 — **사본**입니다 (§9 "기존 계약에 적용된
  -- 수수료 정책은 추후 정책이 변경되더라도 유지되어야 한다").
  -- ⚠️⚠️ fee_policy 를 가리키게만 두면 요율을 고친 날 **지난 계약의
  -- 수수료가 같이 바뀝니다.** 그래서 jsonb 사본을 박아 둡니다.
  fee_snap    jsonb,
  fee         bigint,                        -- ③ 수수료 확정액 (공급가)
  fee_vat     bigint,
  fee_total   bigint,
  paid        bigint,                        -- ④ 실제 입금액
  paid_at     timestamptz,
  -- §9 "계약 완료 증빙 확인" — ⚠️ 최소 수집 · 보관 정책 (§13)
  proof       jsonb,
  signed_at   timestamptz,
  done_at     timestamptz,
  -- 관리자 최종 승인 (§9) — ⚠️ 이것 없이 fee 가 채워지면 안 됩니다
  fee_by      uuid references auth.users(id) on delete set null,
  fee_at      timestamptz,
  created_at  timestamptz not null default now(),
  constraint deal_amount_sign check (amount is null or amount >= 0),
  constraint deal_paid_sign   check (paid is null or paid >= 0),
  -- ⚠️⚠️ §13 "계약이 성사되지 않았는데 수수료가 확정된 것처럼 처리하지
  -- 않음" — 수수료가 적혔으면 **누가 언제 승인했는지**가 반드시 같이
  -- 있어야 합니다. DB 가 그것을 강제합니다.
  constraint deal_fee_needs_approval
    check (fee is null or (fee_by is not null and fee_at is not null)),
  -- ⚠️⚠️ §13 가짜 정산 완료 금지 — 입금액이 적혔으면 수수료가 먼저
  -- 확정되어 있어야 합니다.
  constraint deal_paid_needs_fee
    check (paid is null or fee is not null)
);
create index deal_provider_idx on deal (provider_id, created_at desc);


-- ── 정산 (§9 · §12) ──────────────────────────────────────────────────
create table settlement (
  id          uuid primary key default gen_random_uuid(),
  provider_id text not null references provider(id) on delete cascade,
  from_date   date not null,
  to_date     date not null,
  total       bigint not null default 0,
  state       text   not null default 'wait', -- wait | paid | hold
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  paid_at     timestamptz,
  created_at  timestamptz not null default now(),
  constraint settlement_dates check (from_date <= to_date)
);


-- ── 감사 기록 (§8 · §12) ─────────────────────────────────────────────
-- §8 "모든 중요한 상태 변경에는 변경자, 변경일시, 사유를 기록한다"
-- ⚠️⚠️ **고치거나 지울 수 없습니다** (아래 RLS). 고칠 수 있는 기록은
-- 기록이 아닙니다.
create table audit_log (
  id         bigserial primary key,
  at         timestamptz not null default now(),
  by_user    uuid references auth.users(id) on delete set null,
  by_role    app_role,
  obj        text not null,                  -- request | deal | settlement …
  obj_id     text not null,
  from_state text,
  to_state   text,
  why        text,
  data       jsonb
);
create index audit_obj_idx on audit_log (obj, obj_id, at desc);


-- ════════════════════════════════════════════════════════════════════
-- RLS — §8 "자신의 권한에 맞는 상태만 조회하거나 변경할 수 있다"
--
-- ⚠️⚠️ **여기가 이 설계의 핵심입니다.** 권한을 화면 코드에서만 막으면
-- 코드에 버그가 하나 생기는 날 남의 연락처와 계약금액이 새어 나갑니다.
-- DB 가 막으면 화면이 틀려도 안 새어 나갑니다.
-- ════════════════════════════════════════════════════════════════════
alter table account    enable row level security;
alter table provider   enable row level security;
alter table offer      enable row level security;
alter table request    enable row level security;
alter table assignment enable row level security;
alter table fee_policy enable row level security;
alter table deal       enable row level security;
alter table settlement enable row level security;
alter table audit_log  enable row level security;

-- 내 계정만 본다 (역할은 관리자만 바꿉니다)
create policy account_self on account for select using (id = auth.uid());
create policy account_admin on account for all
  using (my_role() = 'admin') with check (my_role() = 'admin');

-- 업체 · 상품은 **공개 목록만** 누구나 봅니다
create policy provider_public on provider for select
  using (listed = true or my_role() in ('staff','admin') or id = my_provider());
create policy provider_admin on provider for all
  using (my_role() = 'admin') with check (my_role() = 'admin');
-- ⚠️ 업체는 자기 정보를 고칠 수 있지만 `listed` 와 `verified` 는 못 바꿉니다
-- (확인 배지를 스스로 켜면 그건 지어낸 신뢰입니다 — 절대 규칙 1).
-- 그 둘은 아래 트리거가 막습니다.
create policy provider_self on provider for update
  using (id = my_provider()) with check (id = my_provider());

create policy offer_public on offer for select
  using (status <> 'off' or my_role() in ('staff','admin'));
create policy offer_admin on offer for all
  using (my_role() = 'admin') with check (my_role() = 'admin');

-- ── 신청 ──
-- 고객은 **자기 것만**
create policy request_mine on request for select using (user_id = auth.uid());
-- 업체는 **자기에게 배정된 것만** (배정 전에는 못 봅니다)
create policy request_assigned on request for select using (
  exists (select 1 from assignment a
          where a.request_id = request.id and a.provider_id = my_provider())
);
create policy request_staff on request for select using (my_role() in ('staff','admin'));
create policy request_staff_w on request for update
  using (my_role() in ('staff','admin')) with check (my_role() in ('staff','admin'));
-- 접수는 로그인 없이도 들어옵니다 (서버 함수가 넣습니다)

create policy assign_mine on assignment for select
  using (provider_id = my_provider() or my_role() in ('staff','admin'));
create policy assign_staff on assignment for all
  using (my_role() in ('staff','admin')) with check (my_role() in ('staff','admin'));
-- 업체는 수락 · 거절만
create policy assign_self_w on assignment for update
  using (provider_id = my_provider()) with check (provider_id = my_provider());

-- ── 돈 ──
-- ⚠️⚠️ **고객은 수수료 표를 아예 못 봅니다.** 우리와 업체 사이의 일인데
-- 보여 주면 자기가 내는 돈으로 읽힙니다.
create policy fee_mine on fee_policy for select
  using (provider_id = my_provider() or my_role() = 'admin');
create policy fee_admin on fee_policy for all
  using (my_role() = 'admin') with check (my_role() = 'admin');

create policy deal_mine on deal for select
  using (provider_id = my_provider() or my_role() = 'admin');
-- ⚠️ 직원은 계약을 **볼 수는** 있지만 수수료를 확정하지 못합니다.
-- 확정은 아래 트리거가 관리자로 묶습니다.
create policy deal_staff on deal for select using (my_role() in ('staff','admin'));
create policy deal_admin on deal for all
  using (my_role() = 'admin') with check (my_role() = 'admin');
-- 업체는 계약금액과 이행 완료만 적습니다
create policy deal_self_w on deal for update
  using (provider_id = my_provider()) with check (provider_id = my_provider());

create policy settle_mine on settlement for select
  using (provider_id = my_provider() or my_role() = 'admin');
create policy settle_admin on settlement for all
  using (my_role() = 'admin') with check (my_role() = 'admin');

-- ── 감사 기록 ──
-- ⚠️⚠️ **아무도 고치거나 지울 수 없습니다.** update · delete 정책을
-- 일부러 만들지 않았습니다 — RLS 는 정책이 없으면 막습니다.
create policy audit_read on audit_log for select
  using (my_role() = 'admin'
         or (by_user = auth.uid())
         or exists (select 1 from deal d
                    where d.id::text = audit_log.obj_id
                      and d.provider_id = my_provider()));


-- ════════════════════════════════════════════════════════════════════
-- 업체가 스스로 켤 수 없는 것 (절대 규칙 1)
-- ⚠️⚠️ 확인 배지와 공개 여부는 **플랫폼이 서류를 보고** 켭니다.
-- RLS 는 행 단위라 칸을 막지 못해서 트리거로 막습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function provider_guard() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if my_role() = 'admin' then return new; end if;
  if new.verified is distinct from old.verified then
    raise exception '확인 배지는 플랫폼이 서류를 확인한 뒤에만 켜집니다';
  end if;
  if new.listed is distinct from old.listed then
    raise exception '공개 여부는 관리자가 정합니다';
  end if;
  if new.id is distinct from old.id then
    raise exception '업체 주소(id)는 바꿀 수 없습니다 — 이미 색인된 주소입니다';
  end if;
  return new;
end $$;
create trigger provider_guard_t before update on provider
  for each row execute function provider_guard();

-- ⚠️⚠️ **수수료 확정은 관리자만** (§8 · §13 · js/data/deal.js 와 같은 규칙).
-- 화면에서 막고, 여기서 한 번 더 막습니다 — 화면만 믿으면 API 를 직접
-- 두드리는 것을 못 막습니다 (접수 동의를 이중으로 막는 것과 같은 까닭).
create or replace function deal_money_guard() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if my_role() = 'admin' then return new; end if;
  if new.fee is distinct from old.fee
     or new.fee_total is distinct from old.fee_total
     or new.fee_snap is distinct from old.fee_snap
     or new.paid    is distinct from old.paid then
    raise exception '수수료와 입금액은 관리자만 적을 수 있습니다';
  end if;
  return new;
end $$;
create trigger deal_money_guard_t before update on deal
  for each row execute function deal_money_guard();

-- ════════════════════════════════════════════════════════════════════
-- 권한 (GRANT) — ⚠️⚠️ **암묵적인 기본 설정에 기대지 않습니다**
--
-- Supabase 는 public 스키마의 새 표에 anon · authenticated ·
-- service_role 권한을 **알아서** 붙여 줍니다. 돌려 보니 이 파일은
-- GRANT 를 한 줄도 안 하고 있었고, 그러니까 **그 기본 설정에
-- 조용히 기대고 있었습니다.** Supabase 가 그 기본값을 바꾸거나
-- 다른 Postgres 에 세우면 그날 전부 안 됩니다 — 에러도 늦게
-- 터지는 종류입니다. 그래서 명시합니다.
--
-- ⚠️⚠️ **RLS 와 GRANT 는 다른 자물쇠입니다.** GRANT 는 "그 표를
-- 건드릴 수 있나", RLS 는 "그 표의 어느 줄을 건드릴 수 있나".
-- 둘 다 걸어야 합니다 — GRANT 만 주고 RLS 를 안 켜면 전부 보이고,
-- RLS 만 켜고 GRANT 를 안 주면 아무것도 안 됩니다.
--
-- ⚠️ anon(로그인 안 한 사람)에게는 **아무 권한도 주지 않습니다.**
-- 공개 목록(업체 · 매물 · 글)은 빌드가 미리 만든 HTML 이 내보냅니다 —
-- 로그인 전에 DB 를 볼 이유가 없습니다.
-- ════════════════════════════════════════════════════════════════════
grant usage on schema public to anon, authenticated, service_role;

-- 로그인한 사람 — ⚠️ **읽기는 RLS 가 줄 단위로 좁힙니다**
grant select on account, provider, offer, request, assignment,
                deal, fee_policy, settlement, audit_log
  to authenticated;

-- ⚠️⚠️ **쓰기는 칸 단위로 줍니다.** 표째로 주면 업체가 자기 계약의
-- `request_id` 를 다른 건으로 바꿔 끼울 수 있습니다 — RLS 는 줄은
-- 막아도 **어느 칸을 고치는지는 못 막습니다.**
grant update (state, why) on assignment to authenticated;
grant update (amount, signed_at, done_at) on deal to authenticated;
grant update (name, intro, regions, gu, industries, subs, since, consult_hours)
  on provider to authenticated;
-- ⚠️⚠️ deal 의 fee · fee_total · fee_snap · paid 는 **위에 없습니다.**
-- 수수료와 입금액은 관리자만입니다 (§8 · §13). 트리거가 한 번 더
-- 막지만, 애초에 권한을 주지 않는 것이 첫 번째 자물쇠입니다.
-- ⚠️⚠️ provider 의 verified · listed · id 도 **위에 없습니다.**
-- 업체가 확인 배지를 스스로 켜면 그건 지어낸 신뢰입니다 (절대 규칙 1).

-- 서버 함수 (api/_db.js) — ⚠️⚠️ 이 키는 RLS 를 통째로 지나갑니다.
-- 화면에 절대 내려보내지 마세요 (db/README.md).
grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;

/* ---------------------------- 0002_schema_version.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0002 — 스키마 판 번호 (지시서 §1 "DB 변경 전 마이그레이션 계획")
--
-- ⚠️⚠️ **이것이 없으면 "지금 DB 가 몇 번째 판인가" 를 알 수 없습니다.**
-- 같은 마이그레이션을 두 번 돌리거나, 안 돌린 것을 돌렸다고 믿게
-- 됩니다 — 둘 다 조용히 깨지는 종류입니다.
--
-- ⚠️ 마이그레이션을 **손으로 돌리실 때마다** 아래 insert 를 같이
-- 돌려 주세요. db/README.md 에 차례가 적혀 있습니다.
-- ════════════════════════════════════════════════════════════════════
create table if not exists schema_version (
  n          int primary key,
  name       text not null,
  applied_at timestamptz not null default now(),
  by_note    text
);
alter table schema_version enable row level security;
create policy sv_admin on schema_version for select using (my_role() = 'admin');

insert into schema_version (n, name) values
  (1, '0001_init'),
  (2, '0002_schema_version')
on conflict (n) do nothing;

/* ---------------------------- 0003_confirm_fee.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0003 — 수수료를 확정하는 **문 하나** (§8 · §9 · §13)
--
-- ⚠️⚠️ **왜 이 파일이 생겼나** — 0001 을 실제로 돌려 보다가 알았습니다.
--   `deal.fee` 칸에 authenticated 권한을 안 줬으니 관리자도 화면에서
--   수수료를 못 적고, 서버가 service key 로 붙으면 `auth.uid()` 가
--   비어서 `my_role()` 이 'admin' 이 아니라 **트리거가 막습니다.**
--   즉 아무도 수수료를 확정할 수 없는 상태였습니다. 돌려 보지 않았으면
--   4차에서야 알았을 자리입니다.
--
-- 고치는 길이 둘이었습니다 —
--   ① deal 의 돈 칸에 권한을 열고 RLS·트리거로만 막기
--   ② **문을 하나 만들고 그 문만 열기**  ← 이쪽입니다
--
-- ②를 고른 까닭 — §8 이 "모든 중요한 상태 변경에는 변경자, 변경일시,
--   사유를 기록한다" 고 적었습니다. 문이 하나면 **기록 없이 지나갈
--   길이 없습니다.** 칸을 열어 두면 기록하는 코드를 잊은 길이 하나
--   생기는 날 기록이 비고, 그때는 아무도 모릅니다.
--
-- ⚠️⚠️ 그래서 이 함수들은 **감사 기록을 같이 남깁니다.** 한 트랜잭션
--   이라, 기록이 실패하면 수수료도 안 적힙니다.
-- ════════════════════════════════════════════════════════════════════

-- ── 수수료 확정 (§9 "관리자의 최종 승인") ───────────────────────────
-- ⚠️⚠️ 관리자만. 그리고 **서비스 완료(done) 상태에서만** 됩니다 —
-- 업체가 계약 완료를 신고한 것만으로는 안 됩니다 (§8 마지막 문장).
create or replace function confirm_fee(
  p_deal  uuid,
  p_fee   bigint,
  p_vat   bigint,
  p_total bigint,
  p_snap  jsonb,
  p_proof jsonb,
  p_why   text default null
) returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_req   uuid;
  v_state deal_state;
  v_me    uuid := auth.uid();
begin
  if my_role() <> 'admin' then
    raise exception '수수료 확정은 관리자만 할 수 있습니다';
  end if;
  -- ⚠️ security definer 라 RLS 를 지나가므로, 누구인지 **여기서**
  -- 확인합니다. auth.uid() 가 비어 있으면 기록에 변경자를 못 적습니다.
  if v_me is null then
    raise exception '변경자를 알 수 없습니다 — 관리자로 로그인한 세션에서만 됩니다';
  end if;

  select request_id into v_req from deal where id = p_deal;
  if v_req is null then raise exception '없는 계약입니다'; end if;
  select state into v_state from request where id = v_req;

  -- ⚠️⚠️ js/data/deal.js 의 길(done → fee_wait)과 **같은 규칙**입니다.
  if v_state <> 'done' then
    raise exception '서비스 완료 상태에서만 수수료를 확정할 수 있습니다 (지금: %)', v_state;
  end if;

  -- §9 "계약 완료 증빙 확인"
  if p_proof is null then raise exception '계약 완료 증빙이 없습니다'; end if;
  -- §9 "기존 계약에 적용된 수수료 정책은 추후 정책이 변경되더라도 유지"
  if p_snap is null then raise exception '적용할 수수료 정책 사본이 없습니다'; end if;
  if p_fee is null or p_fee < 0 then raise exception '수수료가 없거나 음수입니다'; end if;

  update deal set
    fee = p_fee, fee_vat = p_vat, fee_total = p_total,
    fee_snap = p_snap, proof = p_proof,
    fee_by = v_me, fee_at = now()
  where id = p_deal;

  update request set state = 'fee_wait' where id = v_req;

  -- ⚠️⚠️ 같은 트랜잭션입니다 — 기록이 실패하면 수수료도 안 적힙니다
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, 'admin', 'deal', p_deal::text, 'done', 'fee_wait', p_why,
          jsonb_build_object('fee', p_fee, 'vat', p_vat, 'total', p_total));
end $$;

-- ── 입금 확인 (§9 "실제 입금 확인 후 정산 완료") ────────────────────
-- ⚠️⚠️ §13 "실제 정산 시스템 구축 전 가짜 결제·정산 완료 상태 생성 금지"
create or replace function mark_paid(
  p_deal uuid,
  p_paid bigint,
  p_why  text default null
) returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_req uuid; v_state deal_state; v_fee bigint; v_me uuid := auth.uid();
begin
  if my_role() <> 'admin' then
    raise exception '정산 완료는 관리자만 할 수 있습니다';
  end if;
  if v_me is null then
    raise exception '변경자를 알 수 없습니다';
  end if;
  -- ⚠️ 0 은 값입니다 (부분환불 뒤 0원) — `is null` 로만 봅니다
  if p_paid is null then raise exception '실제 입금액이 없습니다'; end if;
  if p_paid < 0 then raise exception '입금액이 음수입니다'; end if;

  select request_id, fee into v_req, v_fee from deal where id = p_deal;
  if v_req is null then raise exception '없는 계약입니다'; end if;
  -- ⚠️⚠️ 수수료가 확정되지 않았는데 입금을 적으면 그게 가짜 정산입니다
  if v_fee is null then raise exception '수수료가 아직 확정되지 않았습니다'; end if;
  select state into v_state from request where id = v_req;
  if v_state <> 'fee_wait' then
    raise exception '정산 대기 상태에서만 입금을 확인할 수 있습니다 (지금: %)', v_state;
  end if;

  update deal set paid = p_paid, paid_at = now() where id = p_deal;
  update request set state = 'fee_done' where id = v_req;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, 'admin', 'deal', p_deal::text, 'fee_wait', 'fee_done', p_why,
          jsonb_build_object('paid', p_paid));
end $$;

-- ── 환수 · 부분환불 (§9 "취소·환불·환수 조건") ──────────────────────
-- ⚠️⚠️ **확정했던 액을 갈아 치우지 않습니다.** 차액을 기록으로 남깁니다 —
-- 갈아 치우면 "얼마를 확정했다가 얼마를 돌려받았는가" 가 사라집니다.
create or replace function clawback_fee(
  p_deal uuid, p_new_fee bigint, p_why text
) returns bigint
  language plpgsql security definer set search_path = public as $$
declare v_was bigint; v_me uuid := auth.uid();
begin
  if my_role() <> 'admin' then raise exception '환수는 관리자만 할 수 있습니다'; end if;
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if p_why is null or btrim(p_why) = '' then raise exception '환수 사유가 필요합니다'; end if;

  select fee into v_was from deal where id = p_deal;
  if v_was is null then raise exception '확정된 수수료가 없습니다'; end if;

  insert into audit_log (by_user, by_role, obj, obj_id, why, data)
  values (v_me, 'admin', 'deal', p_deal::text, p_why,
          jsonb_build_object('was', v_was, 'now', p_new_fee, 'back', v_was - p_new_fee));

  update deal set fee = p_new_fee where id = p_deal;
  return v_was - p_new_fee;
end $$;

-- ⚠️⚠️ **문을 이 셋만 열어 둡니다.** deal 의 돈 칸에는 authenticated
-- 권한이 없으므로(0001 의 GRANT), 수수료를 적는 길이 이 함수들뿐입니다.
revoke all on function confirm_fee(uuid,bigint,bigint,bigint,jsonb,jsonb,text) from public;
revoke all on function mark_paid(uuid,bigint,text)                            from public;
revoke all on function clawback_fee(uuid,bigint,text)                         from public;
grant execute on function confirm_fee(uuid,bigint,bigint,bigint,jsonb,jsonb,text) to authenticated;
grant execute on function mark_paid(uuid,bigint,text)                            to authenticated;
grant execute on function clawback_fee(uuid,bigint,text)                         to authenticated;

insert into schema_version (n, name) values (3, '0003_confirm_fee')
on conflict (n) do nothing;

/* ---------------------------- 0004_move_state.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0004 — 상태를 바꾸는 **문 하나** (§8)
--
-- ⚠️⚠️ **왜 이 파일이 생겼나** — 0003 이 돈 쪽(confirm_fee · mark_paid ·
--   clawback_fee)에 문을 하나씩 만들어 기록을 강제했는데, **나머지 열
--   상태는 그대로 뚫려 있었습니다.** `request` 에 로그인 사용자 쓰기
--   권한이 없으니 서버(service key)만 바꿀 수 있고, 그 길에는
--   **감사 기록을 남기라는 강제가 없습니다.** §8 은 "모든 중요한 상태
--   변경" 이라고 적었지 "돈 관련 변경" 이라고 적지 않았습니다.
--
-- ⚠️⚠️ **길을 plpgsql 에 손으로 적지 않았습니다.** `js/data/deal.js` 의
--   AM_DEAL_MOVE 를 **표로 옮겨** 두고 함수가 그 표를 읽습니다. 그리고
--   `build-pages.js` 의 checkDealSql() 이 **표의 줄과 화면의 길을
--   하나씩 맞춰 봅니다** — 한쪽만 고치면 빌드가 멈춥니다. 이 저장소가
--   "같은 규칙을 두 곳에 적어 어긋난" 사고를 여러 번 겪은 자리입니다
--   (amCatTo/catTo · 랜딩 아이콘 · 도구 아이콘 표).
--
-- ⚠️ 돈이 걸린 상태로는 이 문으로 **못 갑니다** — 0003 의 함수들이
--   증빙 · 정책 사본 · 입금액을 더 받아야 하기 때문입니다. 여기서
--   막고 어느 함수로 가라고 말해 줍니다.
-- ════════════════════════════════════════════════════════════════════

-- ── 갈 수 있는 길 (js/data/deal.js 의 AM_DEAL_MOVE 그대로) ───────────
-- ⚠️ 이 표를 손으로 고치지 마세요. deal.js 를 고치고 빌드를 돌리면
--    checkDealSql() 이 어긋난 줄을 이름까지 적어 멈춥니다.
create table deal_move (
  from_state deal_state not null,
  to_state   deal_state not null,
  role       app_role   not null,
  needs      text[]     not null default '{}',
  primary key (from_state, to_state, role)
);
alter table deal_move enable row level security;
-- 길은 비밀이 아닙니다 — 로그인한 사람은 자기가 무엇을 할 수 있는지
-- 알아야 화면에 단추를 낼 수 있습니다.
create policy move_read on deal_move for select to authenticated using (true);
grant select on deal_move to authenticated;

insert into deal_move (from_state, to_state, role, needs) values
  ('new','check','staff','{}'::text[]),
  ('new','check','admin','{}'::text[]),
  ('new','lost','staff',array['why']::text[]),
  ('new','lost','admin',array['why']::text[]),
  ('new','lost','customer',array['why']::text[]),
  ('check','assigned','staff',array['providerId','agree3rd']::text[]),
  ('check','assigned','admin',array['providerId','agree3rd']::text[]),
  ('check','lost','staff',array['why']::text[]),
  ('check','lost','admin',array['why']::text[]),
  ('check','lost','customer',array['why']::text[]),
  ('assigned','accepted','provider','{}'::text[]),
  ('assigned','check','provider',array['why']::text[]),
  ('assigned','check','staff',array['why']::text[]),
  ('assigned','check','admin',array['why']::text[]),
  ('assigned','lost','staff',array['why']::text[]),
  ('assigned','lost','admin',array['why']::text[]),
  ('assigned','lost','customer',array['why']::text[]),
  ('accepted','consult','provider','{}'::text[]),
  ('accepted','lost','staff',array['why']::text[]),
  ('accepted','lost','admin',array['why']::text[]),
  ('accepted','lost','customer',array['why']::text[]),
  ('consult','quoted','provider','{}'::text[]),
  ('consult','lost','staff',array['why']::text[]),
  ('consult','lost','admin',array['why']::text[]),
  ('consult','lost','customer',array['why']::text[]),
  ('quoted','nego','provider','{}'::text[]),
  ('quoted','nego','customer','{}'::text[]),
  ('quoted','lost','staff',array['why']::text[]),
  ('quoted','lost','admin',array['why']::text[]),
  ('quoted','lost','customer',array['why']::text[]),
  ('nego','signed','provider',array['amount']::text[]),
  ('nego','signed','staff',array['amount']::text[]),
  ('nego','signed','admin',array['amount']::text[]),
  ('nego','lost','staff',array['why']::text[]),
  ('nego','lost','admin',array['why']::text[]),
  ('nego','lost','customer',array['why']::text[]),
  ('signed','done','provider','{}'::text[]),
  ('signed','done','staff','{}'::text[]),
  ('signed','done','admin','{}'::text[]),
  ('signed','lost','admin',array['why']::text[]),
  ('done','fee_wait','admin',array['proof','feeId']::text[]),
  ('done','lost','admin',array['why']::text[]),
  ('fee_wait','fee_done','admin',array['paid']::text[]),
  ('fee_wait','lost','admin',array['why']::text[]),
  -- ══ 보류 (2026-10-09 §8-3) — ⚠️ 계약 전까지만. signed 부터는
  --    돈이 얽혀 있어 멈추는 것이 아니라 취소 · 환수입니다.
  ('new','hold','staff',array['why']::text[]),
  ('new','hold','admin',array['why']::text[]),
  ('new','hold','customer',array['why']::text[]),
  ('check','hold','staff',array['why']::text[]),
  ('check','hold','admin',array['why']::text[]),
  ('check','hold','customer',array['why']::text[]),
  ('assigned','hold','staff',array['why']::text[]),
  ('assigned','hold','admin',array['why']::text[]),
  ('assigned','hold','customer',array['why']::text[]),
  ('accepted','hold','staff',array['why']::text[]),
  ('accepted','hold','admin',array['why']::text[]),
  ('accepted','hold','customer',array['why']::text[]),
  ('consult','hold','staff',array['why']::text[]),
  ('consult','hold','admin',array['why']::text[]),
  ('consult','hold','customer',array['why']::text[]),
  ('quoted','hold','staff',array['why']::text[]),
  ('quoted','hold','admin',array['why']::text[]),
  ('quoted','hold','customer',array['why']::text[]),
  ('nego','hold','staff',array['why']::text[]),
  ('nego','hold','admin',array['why']::text[]),
  ('nego','hold','customer',array['why']::text[]),
  -- 나가는 길은 둘 — 다시 확인하거나 접거나.
  -- ⚠️ 보류에서 돈 상태로 가는 길은 **없습니다.**
  ('hold','check','staff','{}'::text[]),
  ('hold','check','admin','{}'::text[]),
  ('hold','lost','staff',array['why']::text[]),
  ('hold','lost','admin',array['why']::text[]),
  ('hold','lost','customer',array['why']::text[]);

-- ── 문 ───────────────────────────────────────────────────────────────
-- ctx 에 담는 것 : {"why":"…","providerId":"pv-one","agree3rd":true}
--
-- ⚠️⚠️ **감사 기록과 상태 변경이 한 트랜잭션입니다** — 기록이 실패하면
-- 상태도 안 바뀝니다. 기록 없이 지나갈 길이 없습니다 (§8).
create or replace function move_state(
  p_request uuid,
  p_to      deal_state,
  p_ctx     jsonb default '{}'::jsonb
) returns deal_state
  language plpgsql security definer set search_path = public as $$
declare
  v_from  deal_state;
  v_role  app_role := my_role();
  v_me    uuid      := auth.uid();
  v_needs text[];
  v_miss  text[]    := '{}';
  v_k     text;
  v_why   text      := nullif(btrim(coalesce(p_ctx->>'why','')), '');
  v_money boolean;
begin
  if v_me is null then
    raise exception '변경자를 알 수 없습니다 — 로그인한 세션에서만 됩니다';
  end if;
  if v_role is null then
    raise exception '역할이 없습니다';
  end if;

  select state into v_from from request where id = p_request;
  if v_from is null then raise exception '없는 신청입니다'; end if;
  if v_from = p_to  then raise exception '같은 상태입니다'; end if;

  -- ⚠️⚠️ 돈이 걸린 상태는 이 문으로 안 갑니다 (§9 가 증빙과 정책
  -- 사본을 더 받으라고 적었습니다)
  select money into v_money from (
    select true as money where p_to in ('fee_wait','fee_done')
  ) t;
  if coalesce(v_money, false) then
    raise exception '수수료·정산 상태는 confirm_fee() · mark_paid() 로만 바꿉니다';
  end if;

  -- 갈 수 있는 길인가 · 이 역할이 갈 수 있는가
  select needs into v_needs from deal_move
   where from_state = v_from and to_state = p_to and role = v_role;
  if not found then
    -- 길 자체가 없는 것과 역할이 모자란 것을 갈라서 말해 줍니다
    if exists (select 1 from deal_move where from_state = v_from and to_state = p_to) then
      raise exception '이 변경은 %(으)로는 할 수 없습니다', v_role;
    end if;
    raise exception '갈 수 없는 길입니다 — % → %', v_from, p_to;
  end if;

  -- 같이 적어야 하는 것
  -- ⚠️ `0` 과 `false` 는 값입니다 — 있는지만 봅니다 (키가 있고 null 이
  --    아니면 적은 것). 권리금 "무권리" 에서 겪은 자리입니다.
  foreach v_k in array v_needs loop
    if p_ctx->v_k is null or jsonb_typeof(p_ctx->v_k) = 'null'
       or (jsonb_typeof(p_ctx->v_k) = 'string' and btrim(p_ctx->>v_k) = '')
    then v_miss := v_miss || v_k; end if;
  end loop;
  if array_length(v_miss, 1) is not null then
    raise exception '같이 적어야 하는 것이 빠졌습니다 — %', array_to_string(v_miss, ' · ');
  end if;

  -- ⚠️⚠️ 배정은 **제3자 제공**입니다 (개인정보보호법 제17조 제2항).
  -- 접수 단계의 동의에는 포함되지 않습니다 — 방침 제4조 제3항.
  if p_to = 'assigned' then
    if (p_ctx->>'agree3rd') is distinct from 'true' then
      raise exception '업체에 연락처를 전달하는 별도 동의를 받지 못했습니다';
    end if;
    if not exists (select 1 from provider where id = p_ctx->>'providerId') then
      raise exception '없는 업체입니다 — %', p_ctx->>'providerId';
    end if;
    -- 배정 줄을 같이 만듭니다. ⚠️ agree3rd_at 이 not null 이라
    -- 동의 시각 없이는 여기서 막힙니다 (한 번 더).
    insert into assignment (request_id, provider_id, agree3rd_at, by_user, why)
    values (p_request, p_ctx->>'providerId', now(), v_me, v_why)
    on conflict (request_id, provider_id) do update
      set state = 'sent', agree3rd_at = now(), by_user = v_me;
    -- 제3자 제공 시각을 신청에도 남깁니다 (언제 동의받았나)
    update request set agree3rd_at = now() where id = p_request;
  end if;

  update request set state = p_to where id = p_request;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, v_role, 'request', p_request::text, v_from, p_to, v_why,
          p_ctx - 'why');

  return p_to;
end $$;

-- ⚠️ 업체가 자기 배정을 수락 · 거절하는 자리입니다. 상태는 move_state
-- 가 바꾸고, 여기서는 **자기 것인지**만 더 봅니다.
create or replace function answer_assignment(
  p_request uuid, p_yes boolean, p_why text default null
) returns deal_state
  language plpgsql security definer set search_path = public as $$
declare v_pv text := my_provider();
begin
  if my_role() <> 'provider' or v_pv is null then
    raise exception '배정받은 업체만 답할 수 있습니다';
  end if;
  if not exists (select 1 from assignment
                  where request_id = p_request and provider_id = v_pv) then
    raise exception '이 업체에 배정된 신청이 아닙니다';
  end if;

  update assignment set state = case when p_yes then 'accepted' else 'declined' end,
                        why = p_why
   where request_id = p_request and provider_id = v_pv;

  -- ⚠️ 거절은 **실패가 아니라 다시 확인**입니다 — 손님 쪽에서 보면
  -- 아직 진행 중인 건입니다 (deal.js 의 길과 같습니다).
  return move_state(p_request,
    case when p_yes then 'accepted'::deal_state else 'check'::deal_state end,
    jsonb_build_object('why', coalesce(p_why, case when p_yes then '' else '업체 거절' end)));
end $$;

revoke all on function move_state(uuid, deal_state, jsonb)      from public;
revoke all on function answer_assignment(uuid, boolean, text)   from public;
grant execute on function move_state(uuid, deal_state, jsonb)    to authenticated;
grant execute on function answer_assignment(uuid, boolean, text) to authenticated;

insert into schema_version (n, name) values (4, '0004_move_state')
on conflict (n) do nothing;

/* ---------------------------- 0005_account_claim.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0005 — 로그인한 사람 줄 만들기 + 로그인 전에 넣은 신청 가져오기
--        (지시서 §10 고객 마이페이지)
--
-- 0001~0004 가 상태와 돈의 뼈대였습니다. 여기서 막힌 두 자리를
-- 엽니다 — 둘 다 **실제로 눌러 보려다 발견한 것**입니다.
--
--   ① 로그인해도 account 줄이 없어서 역할이 없었습니다.
--      my_role() 이 null 이면 RLS 가 전부 막아서, 가입한 사람이
--      **자기 신청조차** 못 봅니다.
--
--   ② ⚠️⚠️ **고객이 자기 배정을 못 봤습니다.** assignment 의 select
--      정책이 업체와 직원 · 관리자뿐이라, "어느 업체에 연결되었나" 가
--      신청하신 분에게 안 보였습니다. 그런데 제17조 재동의는 **상호를
--      알려 드리고** 받는 것이라, 상호를 못 보는 마이페이지는 §10 을
--      지킬 수가 없습니다. 0001 을 고치지 않고 정책을 **더합니다**
--      (돌린 파일은 고치지 않는다 — db/README.md).
-- ════════════════════════════════════════════════════════════════════

-- ── ① 가입하면 account 줄이 생깁니다 ────────────────────────────────
-- ⚠️⚠️ **역할을 'customer' 로 박아 둡니다.** 가입하는 쪽에서 역할을
-- 고를 수 있으면 누구나 관리자가 됩니다. 역할 올리기는 SQL 로만 합니다
-- (CLAUDE.md — "관리자를 화면에서 만들 수 있게 하지 마세요").
-- ⚠️ provider_id 도 여기서 채우지 않습니다. 업체와 사람을 잇는 것은
-- 서류를 보고 사람이 하는 일입니다.
create or replace function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into account (id, role, name)
    values (new.id, 'customer',
            nullif(trim(coalesce(new.raw_user_meta_data->>'name', '')), ''))
    on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 이미 가입한 사람이 있으면 메꿉니다 (두 번 돌려도 안전합니다)
insert into account (id, role)
  select u.id, 'customer' from auth.users u
  where not exists (select 1 from account a where a.id = u.id);


-- ── ② 신청하신 분이 자기 배정을 봅니다 ──────────────────────────────
-- ⚠️ 돈이 없는 표입니다 (state · 동의시각 · 사유). 수수료 표는 그대로
-- 고객에게 안 보입니다 — fee_policy · deal 정책은 건드리지 않습니다.
--
-- ⚠️⚠️ **정책 안에서 request 를 바로 읽으면 무한 재귀입니다.** request 의
-- request_assigned 정책이 assignment 를 읽고, assignment 의 이 정책이
-- 다시 request 를 읽습니다 — Postgres 가
-- "infinite recursion detected in policy for relation request" 로
-- 멈춥니다. **실제로 돌려 보고 알았습니다** (0001 을 돌려 보지 않아
-- GRANT 가 빠진 것을 뒤늦게 찾은 그 자리입니다).
-- 그래서 my_role() · my_provider() 와 같은 방식으로 **security definer
-- 함수**로 끊습니다 — 함수 안의 읽기는 RLS 를 거치지 않습니다.
-- ⚠️ 이 함수는 `user_id = auth.uid()` 인 줄에만 true 를 돌려줍니다 —
-- 남의 신청에 대해서는 무엇도 알려 주지 않습니다.
create or replace function is_my_request(rid uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from request
                  where id = rid and user_id = auth.uid())
$$;
revoke all on function is_my_request(uuid) from public;
grant execute on function is_my_request(uuid) to authenticated;

drop policy if exists assign_requester on assignment;
create policy assign_requester on assignment for select
  using (is_my_request(request_id));


-- ── ③ 로그인 전에 넣은 신청을 내 것으로 (§10) ───────────────────────
-- 접수는 로그인 없이 들어옵니다 (그게 맞습니다 — 견적 하나 받으려고
-- 가입하게 만들면 거기서 닫습니다). 그래서 request.user_id 가 비어
-- 있고, 나중에 가입하신 분이 **신청번호와 연락처로** 가져갑니다.
--
-- ⚠️⚠️ **번호만으로는 안 됩니다.** 번호 하나로 열어 주면 그 번호를
-- 손에 넣은 사람이 남의 성함 · 연락처 · 요청 내용을 다 봅니다.
-- 번호(40비트 난수)와 연락처가 **둘 다** 맞아야 합니다.
--
-- ⚠️⚠️ **틀린 까닭을 갈라서 말하지 않습니다.** "그런 번호는 없습니다" 와
-- "연락처가 다릅니다" 를 갈라 주면 번호가 있는지를 확인해 가며 긁을 수
-- 있습니다 — 한 가지 말로만 거절합니다.
create or replace function claim_request(p_no text, p_tel text)
  returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_uid  uuid := auth.uid();
  v_no   text;
  v_tel  text;
  v_id   uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;

  -- 번호를 씻습니다 — api/_intake.js 의 reqNoClean() 과 같은 규칙입니다
  -- (소문자 · 줄표 없음 · 띄어쓰기를 다 알아봅니다).
  v_no := upper(regexp_replace(coalesce(p_no, ''), '[^0-9A-Za-z]', '', 'g'));
  -- ⚠️ `SW` 머리까지 **그대로 있어야** 합니다. 머리를 떼고 받아 주면
  -- 몸통이 `SW…` 로 시작하는 번호와 갈릴 수가 없습니다 (몸통에도 S 와
  -- W 가 들어갑니다) — reqNoClean() 이 `SW` + 여덟 글자만 받는 까닭입니다.
  -- ⚠️ 뺀 글자(I·L·O·U)가 섞이면 받지 않습니다 — 받아 주면 0/O 를
  -- 헷갈려 적은 번호가 **남의 번호에 맞을** 수 있습니다.
  if v_no !~ '^SW[0-9A-HJKMNP-TV-Z]{8}$' then
    raise exception '신청번호와 연락처가 맞지 않습니다';
  end if;
  v_no := 'SW-' || substring(v_no from 3 for 4) || '-' || substring(v_no from 7 for 4);

  -- ⚠️ 전화번호는 **숫자만 남겨** 견줍니다 (031-000-0000 과
  -- 0310000000 은 같은 번호입니다 — /admin 영업 작업대와 같은 규칙).
  v_tel := regexp_replace(coalesce(p_tel, ''), '[^0-9]', '', 'g');
  if length(v_tel) < 9 then
    raise exception '신청번호와 연락처가 맞지 않습니다';
  end if;

  select id into v_id from request
   where no = v_no
     and regexp_replace(tel, '[^0-9]', '', 'g') = v_tel
     and (user_id is null or user_id = v_uid)
   limit 1;

  if v_id is null then
    raise exception '신청번호와 연락처가 맞지 않습니다';
  end if;

  update request set user_id = v_uid where id = v_id and user_id is null;

  -- §8 — 중요한 변경은 **누가 언제** 를 같이 적습니다. 같은
  -- 트랜잭션이라 기록이 실패하면 잇는 것도 안 됩니다.
  insert into audit_log (by_user, by_role, obj, obj_id, why)
    values (v_uid, my_role(), 'request', v_id::text, '신청번호로 내 것으로 연결');

  return v_id;
end $$;

-- ⚠️ 로그인한 사람만. anon 에게 주면 번호를 긁는 길이 열립니다.
revoke all on function claim_request(text, text) from public;
grant execute on function claim_request(text, text) to authenticated;

insert into schema_version (n, name) values (5, '0005_account_claim')
on conflict (n) do nothing;

/* ---------------------------- 0006_hold_state.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
--  0006 — 보류(hold) 상태        2026-10-09 최종 통합 지시서 §8-3
-- ════════════════════════════════════════════════════════════════════
--  > "취소 · 실패 · 보류 상태를 별도로 관리한다."
--
--  ⚠️⚠️ **이 파일은 따라잡기(catch-up)용입니다.**
--  `0001_init.sql` 과 `0004_move_state.sql` 에 보류가 이미 들어가 있어,
--  **새로 세우는 DB 는 이 파일이 없어도 됩니다.** 두 파일을 고친 까닭은
--  아직 어느 DB 에도 안 돌렸기 때문이고(저장소 기준), 혹시 이미
--  돌리셨다면 이 파일이 그 DB 를 같은 자리로 데려옵니다.
--
--  ⚠️ **두 번 돌려도 안전합니다** — add value if not exists ·
--  on conflict do nothing. 그래서 새 DB 에 돌려도 아무 일이 안 납니다.
--
--  ⚠️⚠️ **트랜잭션으로 감싸지 마세요.** `alter type … add value` 로 더한
--  값은 **같은 트랜잭션 안에서 쓸 수 없습니다** — 아래 insert 가 그 값을
--  바로 쓰기 때문에 BEGIN 으로 묶으면 "unsafe use of new value" 로
--  터집니다. psql 기본(문장마다 자동 커밋)으로 돌리세요.
-- ════════════════════════════════════════════════════════════════════

alter type deal_state add value if not exists 'hold' after 'lost';

-- ── 보류로 들어가는 길 ───────────────────────────────────────────────
-- ⚠️⚠️ **계약 전까지만**입니다. signed · done · 정산 쌍은 돈이 얽혀 있어
--    멈추는 것이 아니라 취소 · 환수입니다 (§10-3).
-- ⚠️ 사유(why)를 반드시 받습니다 — 왜 멈췄는지가 안 남으면 다음 사람이
--    그 건을 어떻게 다루어야 할지 모릅니다 (§8 기록).
insert into deal_move (from_state, to_state, role, needs) values
  ('new','hold','staff',array['why']::text[]),
  ('new','hold','admin',array['why']::text[]),
  ('new','hold','customer',array['why']::text[]),
  ('check','hold','staff',array['why']::text[]),
  ('check','hold','admin',array['why']::text[]),
  ('check','hold','customer',array['why']::text[]),
  ('assigned','hold','staff',array['why']::text[]),
  ('assigned','hold','admin',array['why']::text[]),
  ('assigned','hold','customer',array['why']::text[]),
  ('accepted','hold','staff',array['why']::text[]),
  ('accepted','hold','admin',array['why']::text[]),
  ('accepted','hold','customer',array['why']::text[]),
  ('consult','hold','staff',array['why']::text[]),
  ('consult','hold','admin',array['why']::text[]),
  ('consult','hold','customer',array['why']::text[]),
  ('quoted','hold','staff',array['why']::text[]),
  ('quoted','hold','admin',array['why']::text[]),
  ('quoted','hold','customer',array['why']::text[]),
  ('nego','hold','staff',array['why']::text[]),
  ('nego','hold','admin',array['why']::text[]),
  ('nego','hold','customer',array['why']::text[]),
-- ── 보류에서 나가는 길 — 둘뿐입니다 ──────────────────────────────────
-- ⚠️⚠️ **멈췄던 자리로 돌아가지 않고 `check`(다시 확인)부터입니다.**
--    몇 달 전 조건으로 그대로 이어 붙이면 업체도 가격도 바뀌었을 수
--    있습니다 — 다시 확인하는 것이 맞습니다.
-- ⚠️⚠️ **보류에서 돈 상태로 가는 길은 없습니다.**
  ('hold','check','staff','{}'::text[]),
  ('hold','check','admin','{}'::text[]),
  ('hold','lost','staff',array['why']::text[]),
  ('hold','lost','admin',array['why']::text[]),
  ('hold','lost','customer',array['why']::text[])
on conflict (from_state, to_state, role) do nothing;

-- 판 번호 (db/README.md) — ⚠️ 칸 이름은 0002 의 것입니다 (n · name)
insert into schema_version (n, name) values (6, '0006_hold_state')
on conflict (n) do nothing;

/* ---------------------------- 0007_deal_provider_fee.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0007 — 2차 "수익을 기록한다" (전면 감사 §6 의 5 · 6 · 7)
--
-- ⚠️⚠️ **왜 이 파일이 생겼나 — 0003 이 만든 문에 길이 없었습니다.**
--   `confirm_fee(p_deal …)` 는 `deal` 한 줄을 받아야 하는데, **그 줄을
--   만드는 길이 어디에도 없었습니다.** 0004 의 move_state 는
--   `nego → signed` 에서 계약금액을 **감사 기록에만** 적고 지나갑니다.
--   그래서 상태는 "계약 완료" 인데 `deal` 표는 비어 있고, 관리자가
--   수수료를 확정하려 해도 **확정할 대상이 없었습니다.**
--   1차에서 "`api/deal.js` 를 아무 화면도 안 불렀다" 로 겪은 것과
--   같은 자리이고, 이번에는 **DB 안쪽**이었습니다.
--
-- ⚠️⚠️ **등록 · 승인 · 정책도 길이 없었습니다.** 0001 의 GRANT 는
--   `authenticated` 에게 **insert 를 한 줄도 주지 않습니다** (읽기는
--   select, 쓰기는 정해진 칸의 update 뿐). RLS 에 `provider_admin` ·
--   `fee_admin` 이 `for all` 로 있어도 **GRANT 가 없으면 아무것도 안
--   됩니다** — 이 저장소가 "GRANT 와 RLS 는 다른 자물쇠" 로 적어 둔
--   그대로입니다. 그래서 여기서도 **표를 열지 않고 문을 만듭니다.**
--
--   ① deal 줄 만들기      move_state 안에서 (계약 · 완료 시각)
--   ② 업체 등록 · 수정    save_provider()     직원 · 관리자
--   ③ 업체 공개 · 확인    approve_provider()  ⚠️ 관리자만
--   ④ 수수료 정책 등록    save_fee_policy()   ⚠️ 관리자만
--   ⑤ 정책 끄기           set_fee_policy_active()  ⚠️ 관리자만
--
-- ⚠️ 두 번 돌려도 안전합니다 (create or replace · on conflict).
-- ⚠️⚠️ 0004 를 **고치지 않았습니다** — 돌린 파일은 그대로 두고 여기서
--   `create or replace` 합니다 (db/README.md 의 규칙).
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 계약(deal) 줄은 **상태가 계약 완료로 갈 때** 생깁니다
--
-- ⚠️⚠️ **따로 만드는 함수를 두지 않았습니다.** 두면 "상태는 signed 인데
--   deal 이 없는" 또는 "deal 은 있는데 상태가 nego 인" 짝이 생깁니다 —
--   §8 이 막으라고 한 것이 바로 그런 어긋남입니다. 한 트랜잭션 안에서
--   같이 움직이게 둡니다.
-- ⚠️ 어느 업체와의 계약인가 — **수락한 업체**입니다. 여러 곳에 보냈어도
--   계약은 한 곳과 합니다. 못 고르면 **지어내지 않고 거절**합니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function move_state(
  p_request uuid,
  p_to      deal_state,
  p_ctx     jsonb default '{}'::jsonb
) returns deal_state
  language plpgsql security definer set search_path = public as $$
declare
  v_from  deal_state;
  v_role  app_role := my_role();
  v_me    uuid      := auth.uid();
  v_needs text[];
  v_miss  text[]    := '{}';
  v_k     text;
  v_why   text      := nullif(btrim(coalesce(p_ctx->>'why','')), '');
  v_money boolean;
  v_pv    text;
  v_n     int;
begin
  if v_me is null then
    raise exception '변경자를 알 수 없습니다 — 로그인한 세션에서만 됩니다';
  end if;
  if v_role is null then
    raise exception '역할이 없습니다';
  end if;

  select state into v_from from request where id = p_request;
  if v_from is null then raise exception '없는 신청입니다'; end if;
  if v_from = p_to  then raise exception '같은 상태입니다'; end if;

  -- ⚠️⚠️ 돈이 걸린 상태는 이 문으로 안 갑니다 (§9 가 증빙과 정책
  -- 사본을 더 받으라고 적었습니다)
  select money into v_money from (
    select true as money where p_to in ('fee_wait','fee_done')
  ) t;
  if coalesce(v_money, false) then
    raise exception '수수료·정산 상태는 confirm_fee() · mark_paid() 로만 바꿉니다';
  end if;

  -- 갈 수 있는 길인가 · 이 역할이 갈 수 있는가
  select needs into v_needs from deal_move
   where from_state = v_from and to_state = p_to and role = v_role;
  if not found then
    -- 길 자체가 없는 것과 역할이 모자란 것을 갈라서 말해 줍니다
    if exists (select 1 from deal_move where from_state = v_from and to_state = p_to) then
      raise exception '이 변경은 %(으)로는 할 수 없습니다', v_role;
    end if;
    raise exception '갈 수 없는 길입니다 — % → %', v_from, p_to;
  end if;

  -- 같이 적어야 하는 것
  -- ⚠️ `0` 과 `false` 는 값입니다 — 있는지만 봅니다 (키가 있고 null 이
  --    아니면 적은 것). 권리금 "무권리" 에서 겪은 자리입니다.
  foreach v_k in array v_needs loop
    if p_ctx->v_k is null or jsonb_typeof(p_ctx->v_k) = 'null'
       or (jsonb_typeof(p_ctx->v_k) = 'string' and btrim(p_ctx->>v_k) = '')
    then v_miss := v_miss || v_k; end if;
  end loop;
  if array_length(v_miss, 1) is not null then
    raise exception '같이 적어야 하는 것이 빠졌습니다 — %', array_to_string(v_miss, ' · ');
  end if;

  -- ⚠️⚠️ 배정은 **제3자 제공**입니다 (개인정보보호법 제17조 제2항).
  -- 접수 단계의 동의에는 포함되지 않습니다 — 방침 제4조 제3항.
  if p_to = 'assigned' then
    if (p_ctx->>'agree3rd') is distinct from 'true' then
      raise exception '업체에 연락처를 전달하는 별도 동의를 받지 못했습니다';
    end if;
    if not exists (select 1 from provider where id = p_ctx->>'providerId') then
      raise exception '없는 업체입니다 — %', p_ctx->>'providerId';
    end if;
    -- 배정 줄을 같이 만듭니다. ⚠️ agree3rd_at 이 not null 이라
    -- 동의 시각 없이는 여기서 막힙니다 (한 번 더).
    insert into assignment (request_id, provider_id, agree3rd_at, by_user, why)
    values (p_request, p_ctx->>'providerId', now(), v_me, v_why)
    on conflict (request_id, provider_id) do update
      set state = 'sent', agree3rd_at = now(), by_user = v_me;
    -- 제3자 제공 시각을 신청에도 남깁니다 (언제 동의받았나)
    update request set agree3rd_at = now() where id = p_request;
  end if;

  -- ══ 2026-10-11 2차 — 계약(deal) 줄 ════════════════════════════════
  -- ⚠️⚠️ 여기가 없어서 `confirm_fee()` 가 **확정할 대상이 없었습니다.**
  if p_to = 'signed' then
    -- 어느 업체와의 계약인가 — ① ctx 에 적어 주셨으면 그것,
    -- ② 아니면 **수락한 업체**, ③ 그것도 없으면 배정이 하나뿐일 때 그곳.
    -- ⚠️⚠️ 못 고르면 **지어내지 않고 거절**합니다 (절대 규칙 1).
    v_pv := nullif(btrim(coalesce(p_ctx->>'providerId','')), '');
    if v_pv is not null then
      if not exists (select 1 from assignment
                      where request_id = p_request and provider_id = v_pv) then
        raise exception '이 신청에 배정되지 않은 업체입니다 — %', v_pv;
      end if;
    else
      select count(*) into v_n from assignment
       where request_id = p_request and state = 'accepted';
      if v_n = 1 then
        select provider_id into v_pv from assignment
         where request_id = p_request and state = 'accepted';
      else
        select count(*) into v_n from assignment where request_id = p_request;
        if v_n = 1 then
          select provider_id into v_pv from assignment where request_id = p_request;
        elsif v_n = 0 then
          raise exception '배정된 업체가 없어 계약을 만들 수 없습니다';
        else
          raise exception '어느 업체와의 계약인지 골라 주세요 (배정 %건)', v_n;
        end if;
      end if;
    end if;

    -- ⚠️ `amount` 는 길 표가 이미 받아 두었습니다 (needs = {amount}).
    -- ⚠️⚠️ 한 신청에 계약은 하나입니다 — 두 번 눌러도 덮어씁니다
    --    (새 줄을 만들면 수수료를 어느 줄에 확정할지 갈립니다).
    insert into deal (request_id, provider_id, amount, signed_at)
    values (p_request, v_pv, (p_ctx->>'amount')::bigint, now())
    on conflict (request_id) do update
      set provider_id = excluded.provider_id,
          amount      = excluded.amount,
          signed_at   = now();
  end if;

  -- 서비스 완료 시각 — ⚠️ 수수료 확정이 "done 에서만" 되므로 이 시각이
  -- 곧 청구가 열린 날입니다 (§9 정산 주기의 기준).
  if p_to = 'done' then
    update deal set done_at = now() where request_id = p_request;
  end if;

  update request set state = p_to where id = p_request;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, v_role, 'request', p_request::text, v_from, p_to, v_why,
          p_ctx - 'why');

  return p_to;
end $$;

-- ⚠️⚠️ 한 신청에 계약 하나 — 위 `on conflict (request_id)` 가 기댈
-- 제약입니다. 없으면 `on conflict` 자체가 터집니다.
-- ⚠️ 이미 두 줄이 있는 DB 에서는 유일 제약이 안 걸립니다 — 그때는
--    사람이 보고 지워야 합니다 (조용히 지우지 않습니다).
create unique index if not exists deal_request_uniq on deal (request_id);


-- ════════════════════════════════════════════════════════════════════
-- ② 업체 등록 · 수정 (§6 "제휴업체 등록")
--
-- ⚠️⚠️ **`verified` 와 `listed` 를 받지 않습니다.** 확인 배지는 저희가
--   서류를 실제로 본 것만 켜고, 공개 여부는 관리자가 따로 켭니다 —
--   등록 화면에서 같이 받으면 "등록하면 저절로 다 켜지는구나" 가 되고
--   그건 지어낸 신뢰입니다 (절대 규칙 1). ③ 이 그 문입니다.
-- ⚠️ 평점 · 후기 수 · 작업 수를 받는 칸이 **없습니다** — 배열에서
--   셉니다 (값으로 저장하면 누가 4.9 를 적어 넣습니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function save_provider(
  p_id    text,
  p_name  text,
  p_data  jsonb default '{}'::jsonb,   -- intro · regions · gu · industries · subs · since · consultHours
  p_why   text default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_role app_role := my_role();
  v_new  boolean;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then
    raise exception '업체 등록은 직원 · 관리자만 할 수 있습니다';
  end if;

  -- ⚠️⚠️ id 는 **주소가 됩니다** (`/p/<id>`). 한글을 넣으면 주소가
  -- 퍼센트 인코딩으로 길어지고 공유할 때 깨집니다.
  if p_id is null or p_id !~ '^[a-z0-9][a-z0-9-]*$' then
    raise exception '주소가 될 값은 영문 소문자 · 숫자 · 붙임표만 됩니다 — %', coalesce(p_id,'(없음)');
  end if;
  if p_name is null or btrim(p_name) = '' then
    raise exception '업체명이 없습니다';
  end if;
  -- ⚠️⚠️ `subs`(하는 일)가 비면 **아무 분류에도 안 걸립니다.** 지역과
  -- 업종은 안 적으면 "전국 · 전업종" 으로 읽는 게 말이 되지만, 하는
  -- 일을 안 적은 것을 "전부 다 합니다" 로 읽으면 인테리어 업체가
  -- 세무 화면에 앉습니다.
  if coalesce(jsonb_array_length(coalesce(p_data->'subs','[]'::jsonb)), 0) = 0 then
    raise exception '하는 일(하위 분야)이 비어 있습니다 — 비면 아무 분류에도 안 걸립니다';
  end if;

  v_new := not exists (select 1 from provider where id = p_id);

  insert into provider (id, name, intro, regions, gu, industries, subs,
                        since, consult_hours)
  values (
    p_id,
    btrim(p_name),
    nullif(btrim(coalesce(p_data->>'intro','')), ''),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'regions','[]'::jsonb)) x), '{}'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'gu','[]'::jsonb)) x), '{}'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'industries','[]'::jsonb)) x), '{}'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'subs','[]'::jsonb)) x), '{}'),
    nullif(p_data->>'since','')::int,
    nullif(btrim(coalesce(p_data->>'consultHours','')), '')
  )
  on conflict (id) do update set
    name = excluded.name, intro = excluded.intro,
    regions = excluded.regions, gu = excluded.gu,
    industries = excluded.industries, subs = excluded.subs,
    since = excluded.since, consult_hours = excluded.consult_hours;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', p_id,
          case when v_new then 'created' else 'updated' end, p_why, p_data);

  return p_id;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ③ 업체 공개 · 확인 배지 — ⚠️⚠️ **관리자만** (§7 "관리자 승인")
--
-- ⚠️⚠️ 확인 배지는 **플랫폼이 서류를 실제로 본 것만** 켭니다. 업체가
--   "확인했다" 고 말했다고 켜면 그건 지어낸 신뢰이고 표시 · 광고의
--   공정화에 관한 법률 제3조입니다. 그래서 ② 와 **다른 문**이고 역할도
--   다릅니다 — 한 사람이 등록하고 자기가 승인하면 교차 확인이 없습니다
--   (계약을 따는 사람과 수수료를 확정하는 사람을 가른 것과 같은 까닭).
-- ════════════════════════════════════════════════════════════════════
create or replace function approve_provider(
  p_id       text,
  p_listed   boolean default null,
  p_verified jsonb   default null,
  p_why      text    default null
) returns void
  language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_was boolean;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if my_role() <> 'admin' then
    raise exception '업체 공개 · 확인 배지는 관리자만 켤 수 있습니다';
  end if;
  select listed into v_was from provider where id = p_id;
  if not found then raise exception '없는 업체입니다 — %', p_id; end if;

  -- ⚠️ null 은 "안 건드림" 입니다 — false 와 갈라 봅니다 (0 과 빈 칸을
  --    가르는 것과 같은 규칙).
  update provider set
    listed   = coalesce(p_listed, listed),
    verified = coalesce(p_verified, verified)
  where id = p_id;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, 'admin', 'provider', p_id,
          case when v_was then 'listed' else 'hidden' end,
          case when coalesce(p_listed, v_was) then 'listed' else 'hidden' end,
          p_why, jsonb_build_object('verified', p_verified));
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ④ 수수료 정책 등록 (§6 "수수료 정책 등록" · §9)
--
-- ⚠️⚠️ **정책을 고쳐도 지난 계약은 안 바뀝니다.** 계약에는 `fee_snap`
--   으로 **사본**이 박히기 때문입니다 (0001 의 주석). 그래서 여기서는
--   마음 놓고 고칠 수 있고, 그것이 §9 가 요구한 것입니다.
-- ⚠️ 제약(요율 0 초과 100 이하 · 최소 ≤ 최대 · 날짜 순서)은 0001 의
--   `fee_rate_range` 들이 이미 들고 있습니다 — 여기서 또 적지 않습니다.
--   두 곳에 적으면 어긋나는 날이 옵니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function save_fee_policy(
  p_provider text,
  p_data     jsonb,
  p_id       uuid default null,
  p_why      text default null
) returns uuid
  language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_id uuid;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if my_role() <> 'admin' then
    raise exception '수수료 정책은 관리자만 등록할 수 있습니다';
  end if;
  if not exists (select 1 from provider where id = p_provider) then
    raise exception '없는 업체입니다 — %', p_provider;
  end if;
  if p_data->>'type' is null then raise exception '수익모델이 없습니다'; end if;

  if p_id is null then
    insert into fee_policy (provider_id, offer_id, type, flat, rate,
                            min_fee, max_fee, vat, confirm_when, cycle,
                            refund_rule, from_date, to_date)
    values (p_provider,
            nullif(btrim(coalesce(p_data->>'offerId','')), ''),
            (p_data->>'type')::fee_type,
            nullif(p_data->>'flat','')::bigint,
            nullif(p_data->>'rate','')::numeric,
            nullif(p_data->>'minFee','')::bigint,
            nullif(p_data->>'maxFee','')::bigint,
            coalesce(nullif(p_data->>'vat','')::fee_vat, 'add'),
            coalesce(nullif(p_data->>'confirmWhen','')::fee_when, 'done'),
            coalesce(nullif(p_data->>'cycle','')::fee_cycle, 'monthly'),
            nullif(btrim(coalesce(p_data->>'refundRule','')), ''),
            nullif(p_data->>'fromDate','')::date,
            nullif(p_data->>'toDate','')::date)
    returning id into v_id;
  else
    update fee_policy set
      offer_id     = nullif(btrim(coalesce(p_data->>'offerId','')), ''),
      type         = (p_data->>'type')::fee_type,
      flat         = nullif(p_data->>'flat','')::bigint,
      rate         = nullif(p_data->>'rate','')::numeric,
      min_fee      = nullif(p_data->>'minFee','')::bigint,
      max_fee      = nullif(p_data->>'maxFee','')::bigint,
      vat          = coalesce(nullif(p_data->>'vat','')::fee_vat, 'add'),
      confirm_when = coalesce(nullif(p_data->>'confirmWhen','')::fee_when, 'done'),
      cycle        = coalesce(nullif(p_data->>'cycle','')::fee_cycle, 'monthly'),
      refund_rule  = nullif(btrim(coalesce(p_data->>'refundRule','')), ''),
      from_date    = nullif(p_data->>'fromDate','')::date,
      to_date      = nullif(p_data->>'toDate','')::date
    where id = p_id and provider_id = p_provider
    returning id into v_id;
    if v_id is null then raise exception '없는 정책입니다'; end if;
  end if;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, 'admin', 'fee_policy', v_id::text,
          case when p_id is null then 'created' else 'updated' end, p_why, p_data);
  return v_id;
end $$;

-- 정책 끄기 · 켜기 — ⚠️ **지우지 않습니다.** 지난 계약이 그 정책의
-- 사본을 들고 있고, 기록에서 "그때 무엇을 썼는가" 가 사라지면 안 됩니다.
create or replace function set_fee_policy_active(
  p_id uuid, p_active boolean, p_why text default null
) returns void
  language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_was boolean;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if my_role() <> 'admin' then
    raise exception '수수료 정책은 관리자만 바꿀 수 있습니다';
  end if;
  if p_active is null then raise exception '켤지 끌지가 없습니다'; end if;
  select active into v_was from fee_policy where id = p_id;
  if not found then raise exception '없는 정책입니다'; end if;

  update fee_policy set active = p_active where id = p_id;
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (v_me, 'admin', 'fee_policy', p_id::text,
          case when v_was then 'active' else 'off' end,
          case when p_active then 'active' else 'off' end, p_why);
end $$;


-- ⚠️⚠️ **문만 엽니다.** 표에 insert 권한을 주지 않습니다 — 주면
-- 기록 없이 지나가는 길이 하나 생깁니다 (§8).
revoke all on function move_state(uuid, deal_state, jsonb)          from public;
revoke all on function save_provider(text, text, jsonb, text)       from public;
revoke all on function approve_provider(text, boolean, jsonb, text) from public;
revoke all on function save_fee_policy(text, jsonb, uuid, text)     from public;
revoke all on function set_fee_policy_active(uuid, boolean, text)   from public;
grant execute on function move_state(uuid, deal_state, jsonb)          to authenticated;
grant execute on function save_provider(text, text, jsonb, text)       to authenticated;
grant execute on function approve_provider(text, boolean, jsonb, text) to authenticated;
grant execute on function save_fee_policy(text, jsonb, uuid, text)     to authenticated;
grant execute on function set_fee_policy_active(uuid, boolean, text)   to authenticated;

-- 판 번호 (db/README.md) — ⚠️ 칸 이름은 0002 의 것입니다 (n · name)
insert into schema_version (n, name) values (7, '0007_deal_provider_fee')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0008_quote.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0008 — 업체 견적 제출 · 수정 · 철회 + 고객의 견적 비교
--        (최종 통합 지시서 §4 · §6 · docs/PHASE1_SYSTEM_AUDIT.md §3 의 ⑤)
--
-- ⚠️⚠️ **왜 이 파일이 생겼나 — 이름이 겹쳐서 "이미 있다" 로 읽혔습니다.**
--   지금 `/compare` 는 **업체**를 나란히 놓는 화면입니다 (분야 · 지역 ·
--   배지). 지시서 §6 이 적은 것은 **제출된 견적**을 나란히 놓는
--   화면입니다 (금액 · 범위 · 기간 · A/S) — 둘은 다른 화면이고,
--   뒤엣것은 담을 표가 없어서 **아예 없었습니다.**
--
--   상태 열셋에는 `quoted`(견적 전달)가 처음부터 있었고 길도
--   `consult → quoted`(업체)로 열려 있었습니다. 그러니까 **"견적을
--   냈다" 는 사실만 적히고 견적 내용은 아무 데도 안 남는** 꼴이었고,
--   고객은 전화로 들은 금액을 기억해야 했습니다.
--
-- ⚠️⚠️ **표를 열지 않고 문을 만듭니다** (0007 과 같은 규칙).
--   0001 의 GRANT 는 `authenticated` 에게 insert 를 한 줄도 주지
--   않습니다 — 표를 열면 기록 없이 지나가는 길이 하나 생깁니다 (§8
--   "모든 중요한 상태 변경에는 변경자, 변경일시, 사유를 기록한다").
--
--     ① submit_quote    업체가 견적을 냅니다 · 고칩니다  ⚠️ 업체만
--     ② withdraw_quote  업체가 거둡니다                  ⚠️ 업체만
--     ③ choose_quote    고객이 고릅니다                  고객 · 직원 · 관리자
--
-- ⚠️ 두 번 돌려도 안전합니다 (if not exists · create or replace).
-- ⚠️⚠️ 돌린 파일(0001 · 0004 · 0007)을 **고치지 않았습니다** —
--   db/README.md 의 규칙대로 다음 번호로 새로 만듭니다.
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 견적 (quote)
--
-- ⚠️⚠️ **한 신청 × 한 업체 = 한 줄입니다.** 고치면 그 줄을 덮어씁니다 —
--   새 줄을 쌓으면 "어느 것이 지금 견적인가" 가 갈리고, 고객 화면은
--   같은 업체가 금액만 다르게 셋 보입니다.
-- ⚠️ 그 대신 **고친 기록은 남습니다** (audit_log · 문이 하나라서).
--
-- ⚠️⚠️ **금액 칸은 업체만 적습니다.** 고객에게는 select 권한만 있고
--   (아래 GRANT), 그마저도 RLS 가 자기 신청의 것으로 좁힙니다.
-- ⚠️ `0` 은 값입니다 — "무상 · 서비스" 를 0 으로 적을 수 있습니다
--   (권리금 "무권리" 에서 겪은 자리). **안 적은 것**은 거절합니다.
-- ⚠️⚠️ 평점 · 응답속도 · 순위를 적는 칸이 **없습니다.** 재는 장치가
--   없는 값으로 줄을 세우면 그 순간 지어낸 기준입니다 (절대 규칙 1).
-- ════════════════════════════════════════════════════════════════════
create table if not exists quote (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references request(id) on delete cascade,
  provider_id text not null references provider(id) on delete cascade,

  -- 돈은 원 단위 정수입니다 (fee 쪽과 같은 규칙)
  amount      bigint not null check (amount >= 0),
  -- 부가세 처리 — ⚠️ 0001 의 `fee_vat` 를 **그대로** 씁니다 (별도 ·
  -- 포함 · 면세). 새 enum 을 만들면 화면이 둘을 따로 알아야 합니다.
  vat         fee_vat not null default 'add',

  -- 무엇이 포함되는가 — ⚠️⚠️ **범위 없는 견적은 금액만 적힌 종이입니다.**
  -- 고객이 둘을 견주려면 "이 금액에 무엇이 들어 있나" 가 있어야 합니다.
  scope       text not null,
  excludes    text,                       -- 포함되지 않는 것 (별도 비용)
  days        int check (days is null or days > 0),   -- 예상 소요일
  start_on    date,                       -- 시작 가능일
  warranty    text,                       -- A/S · 보증 (§6 비교 칸)
  valid_to    date,                       -- 이 견적이 유효한 날까지
  note        text,

  -- ⚠️ 상태는 네 가지입니다 — js/data/deal.js 의 AM_QUOTE_ST 와 같아야
  -- 하고 `build-pages.js` 의 checkQuoteSql() 이 빌드마다 맞춰 봅니다.
  --   state text -- open | withdrawn | chosen | passed
  state       text not null default 'open'
              check (state in ('open','withdrawn','chosen','passed')),
  chosen_at   timestamptz,
  by_user     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (request_id, provider_id)
);

-- 고객 화면이 "내 신청의 견적 전부" 를 한 번에 가져옵니다
create index if not exists quote_request_idx  on quote (request_id, created_at desc);
create index if not exists quote_provider_idx on quote (provider_id, created_at desc);

alter table quote enable row level security;

-- ── 누가 어느 줄을 보는가 ────────────────────────────────────────────
-- ⚠️⚠️ **정책 안에서 `request` 를 바로 읽으면 무한 재귀입니다.**
--   `request_assigned` 가 `assignment` 를 읽고, 거기서 다시 `request` 를
--   읽으면 Postgres 가 *"infinite recursion detected in policy"* 로
--   멈춥니다 — 0005 에서 **실제로 돌려 보고** 알았습니다. 그래서
--   `is_my_request()`(security definer)로 끊습니다.
drop policy if exists quote_mine on quote;
create policy quote_mine on quote for select
  using (provider_id = my_provider());

-- ⚠️⚠️ **거둔 견적은 고객에게 안 보입니다.** 업체가 거둔 금액이 비교
--   화면에 남아 있으면 고객은 그 금액으로 기대를 하고, 그건 업체가
--   하지 않은 약속입니다 (절대 규칙 5). 고른 뒤의 `passed` 는
--   보입니다 — "무엇을 고르지 않았나" 가 기록이기 때문입니다.
drop policy if exists quote_requester on quote;
create policy quote_requester on quote for select
  using (is_my_request(request_id) and state <> 'withdrawn');

drop policy if exists quote_staff on quote;
create policy quote_staff on quote for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️ **insert · update · delete 정책을 일부러 만들지 않았습니다.**
--   RLS 는 정책이 없으면 막습니다. 쓰는 길은 아래 문 셋뿐입니다.


-- ════════════════════════════════════════════════════════════════════
-- ② 업체가 견적을 냅니다 · 고칩니다 (§4)
--
-- ⚠️⚠️ **상태는 여기서 손으로 바꾸지 않습니다.** 상태의 문은
--   `move_state()` 하나이고(0004 · §8), 여기서 또 적으면 감사 기록이
--   한쪽에만 남습니다. 상담 중이면 `move_state(…, 'quoted')` 를
--   **불러서** 넘깁니다 — 한 트랜잭션이라 견적과 상태가 같이 움직이고,
--   기록도 move_state 가 남깁니다.
-- ⚠️ 그래서 `consult → quoted` 길이 없어지면 여기도 같이 막힙니다
--   (그게 맞습니다 — 길 표가 하나뿐인 까닭입니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function submit_quote(
  p_request uuid,
  p_data    jsonb default '{}'::jsonb,
  p_why     text default null
) returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid   := auth.uid();
  v_pv    text   := my_provider();
  v_role  app_role := my_role();
  v_st    deal_state;
  v_as    text;
  v_was   text;
  v_id    uuid;
  v_amt   bigint;
  v_scope text   := nullif(btrim(coalesce(p_data->>'scope','')), '');
  v_vat   text   := coalesce(nullif(p_data->>'vat',''), 'add');
  v_days  int;
  v_start date;
  v_valid date;
begin
  if v_me is null then
    raise exception '변경자를 알 수 없습니다 — 로그인한 세션에서만 됩니다';
  end if;
  -- ⚠️ 업체만입니다. 직원이 대신 넣어 주면 "업체가 적은 금액" 이
  -- 아니게 되고, 그 금액으로 계약이 되면 누가 적었는지가 사라집니다.
  if v_role <> 'provider' or v_pv is null then
    raise exception '견적은 배정받은 업체만 낼 수 있습니다';
  end if;

  select state into v_st from request where id = p_request;
  if v_st is null then raise exception '없는 신청입니다'; end if;

  -- 배정을 받고 **수락한** 곳만입니다 (거절한 곳 · 안 받은 곳은 아예
  -- 그 신청을 볼 수도 없습니다 — request_assigned 정책)
  select state into v_as from assignment
   where request_id = p_request and provider_id = v_pv;
  if v_as is null then
    raise exception '이 신청에 배정되지 않았습니다';
  end if;
  if v_as <> 'accepted' then
    raise exception '배정을 먼저 수락해 주세요';
  end if;

  -- ⚠️⚠️ 계약 뒤에는 못 냅니다. 계약금액이 이미 기록에 적혔는데
  -- 견적을 고치면 "무엇을 보고 계약했나" 가 어긋납니다 (§9).
  if v_st not in ('accepted','consult','quoted','nego') then
    raise exception '지금 상태(%)에서는 견적을 낼 수 없습니다', v_st;
  end if;
  -- ⚠️ 상담 전이면 상담으로 먼저 넘겨야 합니다 (길 표가 그 차례입니다)
  if v_st = 'accepted' then
    raise exception '상담을 시작한 뒤에 견적을 내 주세요';
  end if;

  -- ⚠️⚠️ **금액이 없으면 0원을 적어 두지 않고 거절합니다.** 0 은 값이고
  -- (무상 · 서비스), 안 적은 것은 견적이 아닙니다 — 이 저장소가 손익분기
  -- 85조원 · 권리금 25,000년에서 배운 자리입니다.
  if p_data->'amount' is null or jsonb_typeof(p_data->'amount') = 'null' then
    raise exception '견적 금액을 적어 주세요';
  end if;
  begin
    v_amt := (p_data->>'amount')::bigint;
  exception when others then
    raise exception '견적 금액을 숫자로 적어 주세요';
  end;
  if v_amt < 0 then raise exception '견적 금액이 음수입니다'; end if;
  if v_scope is null then
    raise exception '이 금액에 무엇이 포함되는지 적어 주세요';
  end if;

  /* ⚠️⚠️ **거절하는 말이 사람 말이라야 합니다.** 그냥 형변환에 맡기면
     `invalid input value for enum fee_vat: "x"` 가 **그대로 손님에게**
     갑니다 (`api/deal.js` 가 DB 의 거절 글을 그대로 보여 주기 때문에
     그렇게 설계한 것인데, 그 글이 사람 말일 때만 맞는 설계입니다).
     ⚠️ 날짜 · 소요일도 같은 까닭으로 감쌉니다. */
  if v_vat not in ('add','incl','free') then
    raise exception '부가세 처리를 별도 · 포함 · 면세 중에서 골라 주세요';
  end if;
  begin
    v_days  := nullif(p_data->>'days','')::int;
    v_start := nullif(p_data->>'startOn','')::date;
    v_valid := nullif(p_data->>'validTo','')::date;
  exception when others then
    raise exception '소요일과 날짜를 다시 확인해 주세요';
  end;
  if v_days is not null and v_days <= 0 then
    raise exception '예상 소요일은 하루 이상으로 적어 주세요';
  end if;

  -- ⚠️⚠️ 고객이 고른 견적은 못 고칩니다. 고치면 고객이 고른 것과 다른
  -- 금액이 되고, 그건 조용히 말을 바꾸는 일입니다 — 바꿀 일이 있으면
  -- 사람이 보고 보류 · 취소로 넘깁니다.
  select state into v_was from quote
   where request_id = p_request and provider_id = v_pv;
  if v_was = 'chosen' then
    raise exception '고객이 고른 견적은 고칠 수 없습니다 — 담당자에게 알려 주세요';
  end if;

  insert into quote (request_id, provider_id, amount, vat, scope, excludes,
                     days, start_on, warranty, valid_to, note, state, by_user)
  values (p_request, v_pv, v_amt, v_vat::fee_vat, v_scope,
          nullif(btrim(coalesce(p_data->>'excludes','')), ''),
          v_days, v_start,
          nullif(btrim(coalesce(p_data->>'warranty','')), ''),
          v_valid,
          nullif(btrim(coalesce(p_data->>'note','')), ''),
          'open', v_me)
  on conflict (request_id, provider_id) do update
    set amount = excluded.amount, vat = excluded.vat, scope = excluded.scope,
        excludes = excluded.excludes, days = excluded.days,
        start_on = excluded.start_on, warranty = excluded.warranty,
        valid_to = excluded.valid_to, note = excluded.note,
        /* 거둔 뒤 다시 내면 되살아납니다 — 그게 "다시 냈다" 입니다 */
        state = 'open', chosen_at = null, by_user = v_me, updated_at = now()
  returning id into v_id;

  -- 상담 중이었으면 **상태의 문**으로 넘깁니다 (여기서 직접 안 씁니다)
  if v_st = 'consult' then
    perform move_state(p_request, 'quoted'::deal_state,
                       jsonb_build_object('quoteId', v_id::text));
  end if;

  -- ⚠️⚠️ 금액을 기록에 싣지 않습니다. `audit_log` 는 관리자와 그 업체가
  -- 보는 자리이고(0001 audit_read), 금액은 `quote` 한 곳에만 둡니다 —
  -- 두 곳에 두면 고친 뒤 어느 쪽이 맞는지 아무도 모릅니다.
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (v_me, v_role, 'quote', v_id::text,
          coalesce(v_was, 'none'), 'open', p_why);
  return v_id;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ③ 업체가 견적을 거둡니다
--
-- ⚠️ **지우지 않습니다.** 냈던 사실과 금액은 기록이고, 지우면 "그때
--   무엇을 냈는가" 가 사라집니다 (정책을 끄되 지우지 않는 것과 같은
--   까닭 · 0007 ⑤).
-- ⚠️⚠️ **상태를 되돌리지 않습니다.** 신청이 `quoted` 인데 견적이 하나도
--   없게 될 수 있는데, 그걸 여기서 `consult` 로 되돌리면 길 표에 없는
--   길을 이 문이 몰래 내는 셈입니다 — 사람이 보고 보류 · 취소로
--   넘깁니다 (화면이 그 줄을 냅니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function withdraw_quote(
  p_request uuid,
  p_why     text default null
) returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_me  uuid := auth.uid();
  v_pv  text := my_provider();
  v_was text;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if my_role() <> 'provider' or v_pv is null then
    raise exception '견적은 낸 업체만 거둘 수 있습니다';
  end if;
  select state into v_was from quote
   where request_id = p_request and provider_id = v_pv;
  if v_was is null then raise exception '낸 견적이 없습니다'; end if;
  if v_was = 'chosen' then
    raise exception '고객이 고른 견적은 거둘 수 없습니다 — 담당자에게 알려 주세요';
  end if;
  if v_was = 'withdrawn' then raise exception '이미 거둔 견적입니다'; end if;

  update quote set state = 'withdrawn', updated_at = now(), by_user = v_me
   where request_id = p_request and provider_id = v_pv;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  select v_me, 'provider', 'quote', q.id::text, v_was, 'withdrawn', p_why
    from quote q where q.request_id = p_request and q.provider_id = v_pv;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ④ 고객이 견적을 고릅니다 (§6)
--
-- ⚠️⚠️ **고르는 것과 계약하는 것은 다릅니다.** 여기서 상태를 `nego` 로
--   넘기지 않습니다 — 조건을 더 맞춰 봐야 하는 일이고, 상태는
--   `move_state()` 가 길 표를 보고 넘깁니다 (화면이 그 단추를 따로
--   냅니다). 여기가 하는 일은 **골랐다는 사실을 남기는 것**까지입니다.
-- ⚠️ 직원 · 관리자도 고를 수 있습니다 — 전화로 들은 선택을 대신 적는
--   자리입니다. **누가 골랐는지가 기록에 남습니다** (by_role).
-- ════════════════════════════════════════════════════════════════════
create or replace function choose_quote(
  p_request  uuid,
  p_provider text,
  p_why      text default null
) returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_id   uuid;
  v_st   text;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role is null then raise exception '역할이 없습니다'; end if;
  -- 내 신청이거나, 직원 · 관리자여야 합니다
  if not (is_my_request(p_request) or v_role in ('staff','admin')) then
    raise exception '이 신청의 견적을 고를 수 없습니다';
  end if;
  if p_provider is null or btrim(p_provider) = '' then
    raise exception '어느 업체의 견적인지 골라 주세요';
  end if;

  select id, state into v_id, v_st from quote
   where request_id = p_request and provider_id = p_provider;
  if v_id is null then raise exception '그 업체의 견적이 없습니다'; end if;
  if v_st = 'withdrawn' then raise exception '업체가 거둔 견적입니다'; end if;
  if v_st = 'chosen' then return v_id; end if;   -- 두 번 눌러도 터지지 않습니다

  -- ⚠️ 고른 것 하나만 `chosen`, 나머지 **살아 있는 것**은 `passed`.
  -- 거둔 것(withdrawn)은 그대로 둡니다 — 고객이 고르지 않은 것이
  -- 아니라 업체가 거둔 것이라, 둘을 같은 말로 덮으면 기록이 틀립니다.
  update quote set state = 'passed', updated_at = now()
   where request_id = p_request and provider_id <> p_provider and state = 'open';
  update quote set state = 'chosen', chosen_at = now(), updated_at = now()
   where id = v_id;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (v_me, v_role, 'quote', v_id::text, v_st, 'chosen', p_why);
  return v_id;
end $$;


-- 읽기는 RLS 가 줄 단위로 좁힙니다. ⚠️⚠️ **쓰기 권한은 주지 않습니다** —
-- 문 셋만 엽니다 (0001 · 0007 과 같은 규칙).
grant select on quote to authenticated;

revoke all on function submit_quote(uuid, jsonb, text)   from public;
revoke all on function withdraw_quote(uuid, text)        from public;
revoke all on function choose_quote(uuid, text, text)    from public;
grant execute on function submit_quote(uuid, jsonb, text) to authenticated;
grant execute on function withdraw_quote(uuid, text)      to authenticated;
grant execute on function choose_quote(uuid, text, text)   to authenticated;

-- 판 번호 (db/README.md) — ⚠️ 칸 이름은 0002 의 것입니다 (n · name)
insert into schema_version (n, name) values (8, '0008_quote')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0009_request_item.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0009 — 신청 하나에 서비스 여러 개 (QuoteRequest ↔ QuoteRequestItem)
--        2026-10-17 "창업 준비 전문관" 지시서 §6 · §7
--
-- ⚠️⚠️ **왜 이 파일이 생겼나 — 서비스별 배정이 불가능했습니다.**
--   `request` 는 `cat` 한 칸 · `offer_id` 한 칸이고 `assignment` 는
--   **신청 단위**입니다. 그래서 "인테리어 → A업체 · 주방설비 → B업체"
--   를 적을 자리가 아예 없었습니다. 화면에서는 2026-10-09 부터 상품을
--   여러 개 고를 수 있었는데, 접수에는 **이름이 이어 붙은 한 줄**로만
--   들어와서 기계가 항목으로 다루지 못했습니다.
--
-- ⚠️⚠️ **기존 칸을 지우지 않았습니다** (지시서 §1 "기존 회원정보,
--   서비스, 신청 내역, 업체 데이터, 관리자 기능은 보존한다").
--   `request.cat` · `request.offer_id` 는 그대로 있고, 항목이 있는
--   신청에서는 `cat` 이 **첫 항목**을 가리킵니다 — 옛 화면 · 옛 질의가
--   그대로 돕니다.
--
-- ⚠️⚠️ **백필이 없습니다.** 손님 데이터가 아직 0건입니다 (DB 는 섰고
--   Vercel 환경변수 대기). 그래서 표를 더하는 것이 안전합니다 —
--   쌓인 뒤였다면 `cat` 하나를 항목 한 줄로 옮기는 백필이 먼저입니다.
--
--     ① request_item      신청의 서비스 항목 (항목마다 제 상태)
--     ② assignment.item_id 배정이 **항목 하나**를 가리킵니다 (null 허용)
--     ③ save_request_items 접수가 항목을 통째로 적습니다 (트랜잭션)
--     ④ assign_item       항목 하나를 업체에 배정 (제17조 재동의 필수)
--     ⑤ move_item_state   항목 하나의 상태 (길 표를 그대로 봅니다)
--
-- ⚠️ 두 번 돌려도 안전합니다 (if not exists · create or replace).
-- ⚠️⚠️ 돌린 파일(0001 · 0004 · 0007 · 0008)을 **고치지 않았습니다** —
--   db/README.md 의 규칙대로 다음 번호로 새로 만듭니다.
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ⓪ 멱등 열쇠 (§8 "재시도 요청의 중복 접수를 방지")
--
-- ⚠️⚠️ **화면이 신청서 하나에 열쇠 하나**를 만들어 보냅니다. 끊겨서
--   다시 누르시면 같은 열쇠가 오고, 서버가 그걸 보고 "새 신청이
--   아니라 재시도" 로 알아봅니다 — 전에는 **같은 분류 · 10분 안**으로만
--   봐서, 서비스를 여러 개 고르셨거나 10분이 지난 재시도는 **두 번
--   접수**됐습니다.
-- ⚠️ `null` 을 허용합니다 — 옛 화면과 `/sell` · `/closure` 는 아직
--   열쇠를 안 보냅니다. 그쪽은 전과 똑같이 분류 · 시각으로 봅니다.
-- ⚠️⚠️ **부분 unique 입니다** (null 은 안 걸립니다). 두 번째 요청이
--   틈새로 지나가도 여기서 멈춥니다 — 조회로 거르는 것이 첫째이고
--   이것이 **둘째 자물쇠**입니다.
alter table request add column if not exists idem text;
create unique index if not exists request_idem_once
  on request (idem) where idem is not null;


-- ════════════════════════════════════════════════════════════════════
-- ① 신청 서비스 항목
--
-- ⚠️⚠️ **`service_id` 는 `js/data/catalog.js` 의 분류 key 입니다**
--   (`interior` · `equip` · `admin` …). 지시서 §6 이 "서비스 ID는 기존
--   서비스 데이터의 고유 ID를 사용한다 · 서비스명을 문자열로만 저장하여
--   이름 변경 시 데이터 관계가 깨지는 설계는 피한다" 고 직접 적은
--   자리입니다 — 이름은 화면이 그때그때 읽습니다.
-- ⚠️ `text` 인 까닭은 업체 id · 상품 id 와 같습니다 — 그 key 들이
--   이미 주소(`/providers/interior`)로 색인되어 있어 uuid 로 바꿀 수가
--   없습니다.
-- ⚠️⚠️ **분류가 내려가도 지난 항목은 남습니다** (§12 "서비스가
--   비활성화되어도 과거 신청 기록은 보존한다"). 그래서 외래키를 걸지
--   않습니다 — 분류는 DB 가 아니라 코드에 있는 목록입니다.
-- ⚠️ `state` 가 항목마다 따로입니다 (§7 "상태를 하나의 신청서 전체에만
--   적용하지 말고 필요한 경우 서비스 항목별 상태를 관리한다").
create table if not exists request_item (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references request(id) on delete cascade,
  service_id  text not null,
  -- §5-3 그 서비스에서만 묻는 답 (공통 칸은 request.detail 입니다)
  detail      jsonb not null default '{}',
  state       deal_state not null default 'new',
  created_at  timestamptz not null default now(),
  -- ⚠️⚠️ **같은 서비스를 두 번 담지 않습니다** (§3-2 중복 선택 방지).
  --   화면에서도 막지만, 두 번 눌린 요청이 들어오면 여기서 멈춥니다.
  constraint request_item_once unique (request_id, service_id),
  constraint request_item_svc check (service_id <> '' and length(service_id) <= 60)
);
create index if not exists request_item_req_idx on request_item (request_id);
create index if not exists request_item_state_idx on request_item (state, created_at desc);

alter table request_item enable row level security;

-- ⚠️⚠️ **이 블록이 정책보다 먼저여야 합니다.** 아래 `is_my_item()` 이
--   `assignment.item_id` 를 읽는데, 칸을 나중에 더하면
--   *"column a.item_id does not exist"* 로 **파일이 통째로 멈춥니다** —
--   실제 Postgres 에서 돌려 보고 알았습니다 (SQL 만 읽어서는 멀쩡해
--   보입니다). 이 저장소가 0001 을 414줄 써 놓고 한 번도 안 돌려 봤다가
--   둘이 깨져 있던 그 자리입니다.

-- ════════════════════════════════════════════════════════════════════
-- ② 배정이 **항목 하나**를 가리킵니다 (§7)
--
-- ⚠️⚠️ **null 을 허용합니다.** 지금까지의 배정은 신청 전체를 가리키고
--   있고, not null 로 두면 그 줄들이 전부 깨집니다 (지금은 0건이지만
--   규칙이 그렇습니다). 항목이 있는 신청은 항목을 가리키고, 없는
--   신청은 전과 똑같이 신청 전체를 가리킵니다.
alter table assignment add column if not exists item_id uuid
  references request_item(id) on delete cascade;
create index if not exists assign_item_idx on assignment (item_id);

-- ⚠️⚠️ **한 항목 × 한 업체 = 한 줄입니다.** 같은 업체를 같은 항목에
--   두 번 배정하면 안내가 두 번 가고 수수료가 두 번 잡힙니다.
--   ⚠️ 부분 인덱스입니다 — `item_id` 가 null 인 옛 줄은 안 걸립니다
--   (0001 의 `unique (request_id, provider_id)` 가 그쪽을 지킵니다).
create unique index if not exists assign_item_once
  on assignment (item_id, provider_id) where item_id is not null;


-- 볼 수 있는 사람은 **그 신청을 볼 수 있는 사람**과 같습니다.
-- ⚠️⚠️ 정책 안에서 `request` 를 바로 읽으면 **무한 재귀**입니다
--   (`request_assigned` 가 `assignment` 를 읽고 그쪽이 다시 request 를
--   읽습니다 — 0005 에서 실제로 겪었습니다). security definer 함수로
--   끊습니다.
drop policy if exists item_mine on request_item;
create policy item_mine on request_item for select
  using (is_my_request(request_id));

drop policy if exists item_staff on request_item;
create policy item_staff on request_item for select
  using (my_role() in ('staff','admin'));

-- 업체는 **자기에게 배정된 항목만** 봅니다.
-- ⚠️⚠️ 배정되지 않은 항목까지 보이면, 한 신청서에 같이 담긴 다른
--   서비스의 내용을 그 업체가 읽습니다 — 배정이 곧 제3자 제공이라
--   배정된 것만입니다 (제17조).
create or replace function is_my_item(iid uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from assignment a
                  where a.item_id = iid and a.provider_id = my_provider())
$$;
revoke all on function is_my_item(uuid) from public;
grant execute on function is_my_item(uuid) to authenticated;

drop policy if exists item_provider on request_item;
create policy item_provider on request_item for select
  using (my_provider() is not null and is_my_item(id));

-- ⚠️⚠️ **읽기만 줍니다.** 쓰기를 주면 기록 없이 지나가는 길이 하나
--   생깁니다 (§8) — 아래 문 셋으로만 바뀝니다.
-- ⚠️ `anon`(로그인 안 한 사람)에게는 아무 권한도 주지 않습니다.
grant select on request_item to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ③ 접수가 항목을 적습니다 — 한 트랜잭션 (§8)
--
-- ⚠️⚠️ **신청서와 항목이 같이 적히거나 같이 안 적힙니다.** §8 이
--   "신청서 저장과 서비스 항목 저장이 중간에 실패하여 불완전한 신청이
--   생성되지 않도록 트랜잭션을 적용한다" 고 적은 자리입니다 — 함수
--   하나가 둘을 다 적으면 plpgsql 이 알아서 한 트랜잭션입니다.
-- ⚠️ 서버(service key)가 부릅니다. 로그인 없이 들어오는 접수라
--   `auth.uid()` 가 비어 있고, 그래서 **상태를 바꾸지 않습니다** —
--   새로 만들기만 합니다 (기록이 필요한 변경이 아닙니다).
-- ⚠️⚠️ 같은 신청에 두 번 불려도 **줄이 안 늘어납니다**
--   (`on conflict do nothing`) — 멱등입니다 (§8).
create or replace function save_request_items(p_request uuid, p_items jsonb)
  returns int
  language plpgsql security definer set search_path = public as $$
declare
  n int := 0;
  it jsonb;
  sid text;
begin
  if p_request is null then
    raise exception '신청을 찾을 수 없습니다';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    return 0;
  end if;

  for it in select * from jsonb_array_elements(p_items) loop
    sid := nullif(btrim(coalesce(it->>'id', '')), '');
    -- ⚠️ 빈 id 는 **조용히 건너뜁니다**. 여기서 터뜨리면 멀쩡한 나머지
    --    항목까지 같이 잃습니다 — 접수를 잃는 쪽이 더 나쁩니다.
    continue when sid is null;
    insert into request_item (request_id, service_id, detail)
    values (p_request, sid,
            coalesce(case when jsonb_typeof(it->'detail') = 'object'
                          then it->'detail' else null end, '{}'::jsonb))
    on conflict (request_id, service_id) do nothing;
    if found then n := n + 1; end if;
  end loop;
  return n;
end $$;
revoke all on function save_request_items(uuid, jsonb) from public;


-- ════════════════════════════════════════════════════════════════════
-- ④ 항목 하나를 업체에 배정 (§7)
--
-- ⚠️⚠️ **배정이 곧 제3자 제공입니다** (개인정보보호법 제17조 제2항).
--   `p_agree3rd` 가 true 가 아니면 거절합니다 — 0004 의 `move_state()`
--   와 **같은 규칙**이고, 방침 제4조 제3항이 "접수 단계의 동의에는
--   제3자 제공이 포함되지 않습니다" 라고 적고 있습니다.
-- ⚠️ 동의를 **시각으로** 남깁니다. boolean 으로 두면 "언제 받았나" 를
--   못 대고, 그게 분쟁에서 받지 않은 것과 같아집니다.
create or replace function assign_item(
  p_item uuid, p_provider text, p_agree3rd boolean, p_why text default null)
  returns void
  language plpgsql security definer set search_path = public as $$
declare
  r   request_item%rowtype;
  rol app_role := my_role();
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception '변경자를 알 수 없습니다 — 로그인 후 다시 시도해 주세요';
  end if;
  if rol not in ('staff','admin') then
    raise exception '배정은 직원 · 관리자만 할 수 있습니다';
  end if;

  select * into r from request_item where id = p_item;
  if not found then raise exception '항목을 찾을 수 없습니다'; end if;

  if p_agree3rd is not true then
    raise exception '제3자 제공 동의를 먼저 받아야 합니다 (개인정보보호법 제17조 제2항)';
  end if;
  if not exists (select 1 from provider where id = p_provider) then
    raise exception '등록된 업체가 아닙니다 — %', p_provider;
  end if;

  insert into assignment (request_id, provider_id, item_id, state,
                          agree3rd_at, by_user, why)
  values (r.request_id, p_provider, p_item, 'sent', now(), uid, p_why)
  -- ⚠️⚠️ **부분 인덱스라 `where` 를 같이 적어야 합니다.** 안 적으면
  --   Postgres 가 *"there is no unique or exclusion constraint matching
  --   the ON CONFLICT specification"* 로 거절합니다 — 실제로 돌려 보고
  --   알았습니다 (SQL 만 읽어서는 멀쩡해 보입니다).
  on conflict (item_id, provider_id) where item_id is not null do nothing;

  -- ⚠️ 신청 쪽 동의 시각도 같이 남깁니다 — 둘 중 하나만 있으면
  --    "언제 받았나" 를 한쪽에서만 댈 수 있습니다.
  update request set agree3rd_at = coalesce(agree3rd_at, now())
   where id = r.request_id;

  update request_item set state = 'assigned' where id = p_item;

  -- ⚠️⚠️ 기록과 변경이 **한 트랜잭션**입니다 — 기록이 실패하면
  --    배정도 안 됩니다. 기록 없이 지나갈 길이 없습니다 (§8).
  insert into audit_log (by_user, by_role, obj, obj_id,
                         from_state, to_state, why, data)
  values (uid, rol, 'request_item', p_item::text,
          r.state::text, 'assigned', p_why,
          jsonb_build_object('provider_id', p_provider,
                             'service_id',  r.service_id,
                             'request_id',  r.request_id));
end $$;
revoke all on function assign_item(uuid, text, boolean, text) from public;
grant execute on function assign_item(uuid, text, boolean, text) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ⑤ 항목 하나의 상태 (§7)
--
-- ⚠️⚠️ **길 표(`deal_move`)를 그대로 봅니다.** 0004 가 만든 그 표이고,
--   `js/data/deal.js` 의 `AM_DEAL_MOVE` 에서 나온 것입니다 — 항목용
--   길을 따로 적으면 두 곳이 어긋나고, 화면이 안 내는 길로 DB 가
--   통과시키는 날이 옵니다.
-- ⚠️⚠️ **돈이 걸린 상태로는 여기서 못 갑니다.** 수수료는 계약(`deal`)
--   단위이고 `confirm_fee()` · `mark_paid()` 로만 갑니다 (§13 가짜
--   정산 금지) — 0004 와 같은 규칙입니다.
-- ⚠️ 배정은 ④ 로 갑니다 — 제17조 동의를 받는 자리가 거기 하나라야
--   합니다.
create or replace function move_item_state(
  p_item uuid, p_to deal_state, p_why text default null)
  returns void
  language plpgsql security definer set search_path = public as $$
declare
  r   request_item%rowtype;
  rol app_role := my_role();
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception '변경자를 알 수 없습니다 — 로그인 후 다시 시도해 주세요';
  end if;

  select * into r from request_item where id = p_item;
  if not found then raise exception '항목을 찾을 수 없습니다'; end if;

  if p_to in ('fee_wait','fee_done') then
    raise exception '수수료는 계약에서 확정합니다 — confirm_fee() · mark_paid() 로 가세요';
  end if;
  if p_to = 'assigned' then
    raise exception '배정은 assign_item() 으로 하세요 (제3자 제공 동의가 필요합니다)';
  end if;

  -- ⚠️ 갈 수 없는 길인지와 역할이 모자란지를 **갈라서** 말해 줍니다 —
  --    화면이 다른 안내를 해야 합니다 (0004 와 같은 규칙).
  if not exists (select 1 from deal_move m
                  where m.from_state = r.state and m.to_state = p_to) then
    raise exception '갈 수 없는 길입니다 — % → %', r.state, p_to;
  end if;
  if not exists (select 1 from deal_move m
                  where m.from_state = r.state and m.to_state = p_to
                    and m.role = rol) then
    raise exception '이 상태로 바꿀 권한이 없습니다 — %', rol;
  end if;

  update request_item set state = p_to where id = p_item;

  insert into audit_log (by_user, by_role, obj, obj_id,
                         from_state, to_state, why, data)
  values (uid, rol, 'request_item', p_item::text,
          r.state::text, p_to::text, p_why,
          jsonb_build_object('service_id', r.service_id,
                             'request_id', r.request_id));
end $$;
revoke all on function move_item_state(uuid, deal_state, text) from public;
grant execute on function move_item_state(uuid, deal_state, text) to authenticated;


-- 판 번호 (db/README.md) — ⚠️ 칸 이름은 0002 의 것입니다 (n · name)
insert into schema_version (n, name) values (9, '0009_request_item')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0010_user_state.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0010 — 회원 계정에 남는 임시저장 · 체크리스트
--        2026-10-18 "매장 운영 전문관 2차" §6-2 · §9
--
-- ⚠️⚠️ **왜 이 파일이 생겼나 — 저장이 브라우저 안에만 있었습니다.**
--   §6-2 는 "회원이면 서버에 임시저장한다", §9 는 "로그인한 회원은
--   체크 상태를 계정에 저장한다" 였는데, 둘 다 `localStorage` 뿐이라
--   ① 폰에서 고르고 PC 에서 이으실 수가 없고 ② 가게 컴퓨터를 바꾸면
--   사라지고 ③ 사파리 비공개 모드에서는 애초에 안 남았습니다.
--
-- ⚠️⚠️ **브라우저 저장을 없앤 것이 아닙니다.** 로그인하지 않은 분이
--   여전히 더 많고(지금은 전부), 로그인이 꺼져 있는 동안 화면은
--   **오늘과 글자 하나 다르지 않게** 돕니다. 이 표는 **로그인한
--   분에게만** 한 겹 더 붙는 것이고, 어느 쪽이 이기는지는
--   `js/state.js` 머리말에 적혀 있습니다.
--
-- ⚠️⚠️ **새 표가 하나입니다** (§8 "기존 스키마가 있으면 새 테이블을
--   중복 생성하지 않는다"). 담는 것 셋이 전부 **그 사람의 메모장**이고
--   줄 수명이 같아서, 셋을 따로 두면 표 셋에 같은 열쇠를 세 번 적는
--   꼴입니다.
--
-- ⚠️⚠️ **감사 기록(audit_log)을 남기지 않습니다.** §8 의 "모든 중요한
--   상태 변경" 은 신청 · 계약 · 돈의 상태를 말합니다. 여기는 그 사람이
--   자기 메모를 고치는 일이고 자동저장이라, 기록을 남기면 체크 한 번에
--   줄 하나씩 쌓여 **정작 돈 기록이 그 더미에 묻힙니다.**
--
--     ① user_state        계정 하나에 한 줄 (고른 서비스 · 조건 · 체크)
--     ② user_state_guard  ⚠️ 담을 수 있는 칸을 **DB 가** 정합니다
--     ③ save_user_state   저장하는 유일한 길 (표에는 쓰기 권한이 없습니다)
--     ④ clear_user_state   지우는 길 — 되돌릴 수 없으므로 화면이 한 번 묻습니다
--
-- ⚠️ 두 번 돌려도 안전합니다 (if not exists · create or replace).
-- ⚠️⚠️ 돌린 파일(0001~0009)을 **고치지 않았습니다**.
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 계정 하나에 한 줄
--
-- ⚠️⚠️ **성함 · 연락처를 담는 칸이 없습니다.** 담는 것은 §6-1 이
--   정한 조건 여덟 칸(상황 · 필요한 일 · 업종 · 지역 · 시군구 · 평수 ·
--   예산 · 일정)과 고르신 서비스 id · 체크해 두신 항목 key 까지입니다 —
--   성함과 연락처는 이미 `auth.users` 와 접수 줄에 있고, 메모장에 또
--   두면 그 순간 지우기 어려운 사본이 하나 늘어납니다 (최소 수집).
-- ⚠️ `account_id` 가 곧 기본키입니다 — 한 사람에 한 줄이라 쌓이지
--   않습니다. 계정이 지워지면 같이 지워집니다 (on delete cascade).
-- ⚠️⚠️ **값의 꼴과 개수를 여기서도 봅니다.** 문(③)이 먼저 거르지만,
--   표에 자물쇠가 없으면 나중에 다른 길이 하나 생기는 날 아무도
--   모릅니다 (이 저장소가 GRANT 와 RLS 를 **둘 다** 거는 까닭).
--   ⚠️ 칸 이름 허용 목록은 CHECK 에 못 담습니다 (하위 질의가 됩니다) —
--   그건 ② 트리거가 봅니다.
create table if not exists user_state (
  account_id  uuid primary key references account(id) on delete cascade,
  -- 고르신 서비스 id — `catalog.js` 의 분류 key 또는 `분류/하위`
  pick        jsonb not null default '[]',
  -- 적어 두신 조건 여덟 칸 (§6-1)
  draft       jsonb not null default '{}',
  -- 체크해 두신 운영 항목 key (`opscheck.js`)
  checks      jsonb not null default '[]',
  updated_at  timestamptz not null default now(),
  constraint user_state_pick_arr   check (jsonb_typeof(pick)   = 'array'),
  constraint user_state_checks_arr check (jsonb_typeof(checks) = 'array'),
  constraint user_state_draft_obj  check (jsonb_typeof(draft)  = 'object'),
  -- ⚠️ 상한이 있는 까닭 — 이 줄은 **자동저장**으로 들어옵니다. 상한이
  --    없으면 한 계정이 메가바이트짜리 jsonb 를 밀어 넣을 수 있습니다
  --    (§15 "악용 방어").
  constraint user_state_pick_cap   check (jsonb_array_length(pick)   <= 60),
  constraint user_state_checks_cap check (jsonb_array_length(checks) <= 100)
);

alter table user_state enable row level security;

-- ⚠️⚠️ **자기 줄만 읽습니다.** 직원 · 관리자에게도 열지 않았습니다 —
--   남의 메모장을 보는 것은 운영에 필요한 일이 아니고, 열어 두면
--   목록 하나가 곧 "이 사람이 무엇을 알아보고 있는가" 입니다.
drop policy if exists state_mine on user_state;
create policy state_mine on user_state for select
  using (account_id = auth.uid());

-- ⚠️⚠️ **읽기만 줍니다.** insert · update · delete 를 주면 아래 문을
--   거치지 않는 길이 하나 생기고, 그러면 ② 트리거만 남습니다 (§8).
-- ⚠️ `anon`(로그인 안 한 사람)에게는 아무 권한도 주지 않습니다.
grant select on user_state to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ② ⚠️⚠️ 담을 수 있는 칸을 **DB 가** 정합니다
--
-- 화면이 보내는 것만 담기면 될 일이지만, **화면을 믿지 않습니다** —
-- 이 저장소의 규칙 그대로입니다 (역할을 요청에서 안 읽는 것과 같은
-- 까닭). 여기서 막으면 나중에 화면 버그로 성함 · 연락처가 섞여
-- 들어와도 **표에 안 들어갑니다.**
--
-- ⚠️⚠️ **조용히 걷어내지 않고 거절합니다.** 걷어내면 그 버그를
--   아무도 모르는 채 몇 달이 갑니다. 거절하면 §15 대로 화면이
--   "저장하지 못했습니다" 를 그대로 말합니다 (성공 메시지 금지).
-- ⚠️ 거절하는 말에 **값을 싣지 않습니다** — 성함이 섞여 들어온
--   경우에 그 성함이 에러 글과 로그에 남으면 안 됩니다. 칸 이름까지만.
create or replace function user_state_guard() returns trigger
  language plpgsql as $$
declare
  k text;
  v jsonb;
begin
  -- 조건 여덟 칸 (§6-1) — 이 목록 밖은 못 담습니다
  for k in select jsonb_object_keys(new.draft) loop
    if k not in ('q-side','q-what','q-ind','q-reg','q-gu',
                 'q-py','q-bud','q-when') then
      raise exception '저장할 수 없는 칸입니다 — %', k;
    end if;
    if jsonb_typeof(new.draft->k) <> 'string' then
      raise exception '저장할 수 없는 값입니다 — %', k;
    end if;
    if length(new.draft->>k) > 120 then
      raise exception '값이 너무 깁니다 — %', k;
    end if;
  end loop;

  -- 고른 서비스 · 체크 항목은 **글자 배열**입니다
  for v in select * from jsonb_array_elements(new.pick) loop
    if jsonb_typeof(v) <> 'string' or length(v #>> '{}') > 60
       or btrim(v #>> '{}') = '' then
      raise exception '서비스 id 를 읽을 수 없습니다';
    end if;
  end loop;
  for v in select * from jsonb_array_elements(new.checks) loop
    if jsonb_typeof(v) <> 'string' or length(v #>> '{}') > 60
       or btrim(v #>> '{}') = '' then
      raise exception '체크 항목을 읽을 수 없습니다';
    end if;
  end loop;

  new.updated_at := now();
  return new;
end $$;

drop trigger if exists user_state_guard_t on user_state;
create trigger user_state_guard_t before insert or update on user_state
  for each row execute function user_state_guard();


-- ════════════════════════════════════════════════════════════════════
-- ③ 저장하는 유일한 길
--
-- ⚠️⚠️ **`auth.uid()` 에만 씁니다.** 인자로 계정을 받지 않습니다 —
--   받으면 로그인한 누구나 남의 메모장을 덮어씁니다. 이 저장소가
--   "변경자는 토큰에서만 옵니다" 로 못박아 둔 그 선입니다.
-- ⚠️ `null` 로 보낸 칸은 **그대로 둡니다** (coalesce). 화면이 셋 중
--   하나만 바뀌었을 때 나머지를 지우지 않으려고요 — 전부 보내게
--   하면 한쪽 화면의 자동저장이 다른 쪽을 쓸어 버립니다.
--   ⚠️⚠️ **비우는 것은 `[]` · `{}` 로 보냅니다** (null 과 다릅니다).
create or replace function save_user_state(
    p_pick jsonb default null, p_draft jsonb default null,
    p_checks jsonb default null)
  returns timestamptz
  language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  t   timestamptz;
begin
  if uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  -- ⚠️ 계정 줄이 없으면 저장할 데가 없습니다 (가입 트리거가 만듭니다).
  --    없는데 만들어 주면 역할이 없는 유령 계정이 생깁니다.
  if not exists (select 1 from account where id = uid) then
    raise exception '계정을 찾을 수 없습니다';
  end if;

  insert into user_state (account_id, pick, draft, checks)
  values (uid, coalesce(p_pick, '[]'::jsonb),
               coalesce(p_draft, '{}'::jsonb),
               coalesce(p_checks, '[]'::jsonb))
  on conflict (account_id) do update
     set pick   = coalesce(p_pick,   user_state.pick),
         draft  = coalesce(p_draft,  user_state.draft),
         checks = coalesce(p_checks, user_state.checks)
  returning updated_at into t;
  return t;
end $$;
revoke all on function save_user_state(jsonb, jsonb, jsonb) from public;
grant execute on function save_user_state(jsonb, jsonb, jsonb) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ④ 지우는 길
--
-- ⚠️ 이 저장소는 저장하는 자리마다 **지우는 단추를 같이** 냅니다 —
--   되돌릴 수 없으므로 화면이 한 번 묻습니다 (브라우저 저장과 같은 선).
create or replace function clear_user_state() returns void
  language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  delete from user_state where account_id = uid;
end $$;
revoke all on function clear_user_state() from public;
grant execute on function clear_user_state() to authenticated;


-- 판 번호 (db/README.md) — ⚠️ 칸 이름은 0002 의 것입니다 (n · name)
insert into schema_version (n, name) values (10, '0010_user_state')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0011_request_photo.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0011 — 신청에 붙는 사진 · 서류
--        2026-10-18 "매장 운영 전문관 2차" §7-3 · §15
--
-- ⚠️⚠️ **왜 이 파일이 생겼나 — 올릴 데가 없었습니다.**
--   §7-3 은 "사진 첨부" 를 적었는데 받아 둘 저장소가 없어서, 지금까지는
--   **사진 주소를 적는 칸**으로 대신했습니다 (링크를 가진 분만 쓸 수
--   있는 길입니다). 냉장고가 어떻게 고장났는지 · 어느 벽을 뜯는지는
--   글로 적기 어려워서, 업체가 그것 없이 낸 금액은 현장에서 또 바뀝니다.
--
-- ⚠️⚠️ **사진은 접수한 뒤에 올립니다.** 접수 전에 올리게 하면
--   **아무나 올리는 길**이 하나 생깁니다 (로그인 없이 들어오는
--   접수라 변경자를 모릅니다) — §15 가 "악용 방어" 를 적은 자리입니다.
--   지금 길은 이렇습니다 —
--
--     ① 접수한다            → 접수번호(SW-XXXX-XXXX)를 받습니다
--     ② 번호 + 연락처로 확인 → 자리 하나를 내줍니다 (아래 문)
--     ③ 그 자리에만 올린다   → 버킷의 정해진 경로 하나
--
--   그래서 사진을 올리려면 **먼저 실제 접수가 있어야** 하고, 접수는
--   이미 중복 · 스팸 판정을 거칩니다 (`api/_intake.js`).
--
-- ⚠️⚠️ **파일 자체는 여기 안 들어옵니다.** Postgres 에 바이트를 담으면
--   덤프가 몇 기가가 되고, 이 저장소는 덤프를 다루지 않는 것이 규칙
--   입니다. 담는 것은 **버킷 안의 경로**까지입니다.
--
-- ⚠️⚠️ **버킷은 비공개라야 합니다.** 올리신 사진은 사장님 것이고,
--   공개 버킷이면 경로를 아는 누구나 봅니다. 보는 길은 아래 RLS 를
--   거치는 `/api/upload` 하나입니다 (서명된 주소를 그때그때 만듭니다).
-- ⚠️⚠️ **버킷을 만드실 때 크기 상한과 허용 형식을 거기서도 걸어
--   주세요.** 서명된 올리기 주소는 그 자체로 크기와 형식을 막지
--   않습니다 — 여기서 받는 값은 "적어 보낸 값" 이고, 실제로 막는 것은
--   **버킷 설정**입니다 (db/README.md 에 적어 두었습니다).
--
--     ① request_photo      신청에 붙는 사진 한 줄 (경로 · 형식 · 크기)
--     ② claim_photo_slot   번호 + 연락처로 자리 하나 (service key 전용)
--     ③ drop_photo         올리신 분 · 직원 · 관리자가 뺍니다
--
-- ⚠️ 두 번 돌려도 안전합니다 (if not exists · create or replace).
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 신청에 붙는 사진
--
-- ⚠️ `path` 가 유일합니다 — 같은 경로를 두 줄로 두면 하나를 빼도
--   다른 줄이 남아 지워진 파일을 가리킵니다.
-- ⚠️⚠️ **원래 파일 이름을 담지 않습니다.** 손님이 올리시는 파일 이름에
--   성함 · 가게 이름이 들어 있는 경우가 흔합니다 ("김사장_주방.jpg") —
--   담으면 그게 또 하나의 개인정보 사본입니다. 담는 것은 경로 ·
--   형식 · 크기까지입니다 (최소 수집).
create table if not exists request_photo (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references request(id) on delete cascade,
  -- 버킷 안의 경로 (파일 자체는 Supabase Storage 에 있습니다)
  path        text not null unique,
  mime        text not null,
  bytes       bigint not null,
  created_at  timestamptz not null default now(),
  constraint photo_path_ok check (path <> '' and length(path) <= 300),
  -- ⚠️⚠️ 받는 형식을 **DB 가** 정합니다. 화면과 서버가 먼저 거르지만,
  --   둘 다 지나간 뒤 마지막으로 여기서 막습니다 (자물쇠 셋).
  constraint photo_mime_ok check (mime in
    ('image/jpeg','image/png','image/webp','application/pdf')),
  -- ⚠️ 8MB. 폰으로 찍은 사진이 보통 2~5MB 입니다.
  constraint photo_bytes_ok check (bytes > 0 and bytes <= 8388608)
);
create index if not exists photo_req_idx on request_photo (request_id);

alter table request_photo enable row level security;

-- 볼 수 있는 사람은 **그 신청을 볼 수 있는 사람**과 같습니다.
-- ⚠️⚠️ 정책 안에서 `request` 를 바로 읽으면 무한 재귀입니다 — 0005 ·
--   0009 에서 겪은 자리라 security definer 함수로 끊습니다.
drop policy if exists photo_mine on request_photo;
create policy photo_mine on request_photo for select
  using (is_my_request(request_id));

drop policy if exists photo_staff on request_photo;
create policy photo_staff on request_photo for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️ **업체는 배정된 건의 사진만 봅니다** (제17조). 배정되지 않은
--   건의 사진이 보이면, 그건 남의 가게 내부 사진입니다.
drop policy if exists photo_provider on request_photo;
create policy photo_provider on request_photo for select
  using (my_provider() is not null and exists (
    select 1 from assignment a
     where a.request_id = request_photo.request_id
       and a.provider_id = my_provider()));

-- ⚠️⚠️ **읽기만 줍니다.** 쓰기를 주면 기록 없이 지나가는 길이 하나
--   생깁니다 (§8) — 아래 문 둘로만 바뀝니다.
grant select on request_photo to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ② 번호 + 연락처로 자리 하나
--
-- ⚠️⚠️ **번호만으로는 안 됩니다.** 번호를 손에 넣은 사람이 남의 신청에
--   사진을 꽂아 넣을 수 있습니다 — `claim_request` 와 **같은 규칙**이고,
--   **틀린 까닭을 갈라서 말하지 않습니다** (갈라 주면 번호가 있는지를
--   확인해 가며 긁을 수 있습니다).
-- ⚠️⚠️ **service key 로만 부릅니다.** 올리시는 분은 로그인하지 않은
--   상태라 `auth.uid()` 가 비어 있습니다 — 그래서 `authenticated` 에게
--   권한을 주지 않습니다 (주면 로그인한 누구나 남의 신청에 꽂습니다).
-- ⚠️ 경로를 **여기서** 만듭니다. 화면이 보낸 이름을 쓰면 `../` 같은
--   것이 섞여 들어오고, 원래 파일 이름에는 성함이 들어 있기도 합니다.
create or replace function claim_photo_slot(
    p_no text, p_tel text, p_mime text, p_bytes bigint)
  returns jsonb
  language plpgsql security definer set search_path = public as $$
declare
  r      record;
  n      int;
  ext    text;
  newp   text;
begin
  if p_no is null or p_tel is null then
    raise exception '신청번호와 연락처를 확인해 주세요';
  end if;
  -- ⚠️ 숫자만 남겨 견줍니다 (031-000-0000 과 0310000000 은 같은 번호)
  select * into r from request
   where no = upper(btrim(p_no))
     and regexp_replace(coalesce(tel,''), '[^0-9]', '', 'g')
       = regexp_replace(p_tel, '[^0-9]', '', 'g');
  -- ⚠️⚠️ **한 가지 말로만 거절합니다** (claim_request 와 같은 규칙)
  if not found then
    raise exception '신청번호와 연락처를 확인해 주세요';
  end if;

  -- ⚠️ 다섯까지입니다. 상한이 없으면 접수 하나로 버킷을 채웁니다 (§15).
  select count(*) into n from request_photo where request_id = r.id;
  if n >= 5 then
    raise exception '사진은 다섯 장까지 올리실 수 있습니다';
  end if;

  ext := case p_mime
           when 'image/jpeg' then 'jpg'
           when 'image/png'  then 'png'
           when 'image/webp' then 'webp'
           when 'application/pdf' then 'pdf'
           else null end;
  if ext is null then
    raise exception '사진은 JPG · PNG · WEBP, 서류는 PDF 만 올리실 수 있습니다';
  end if;
  if p_bytes is null or p_bytes <= 0 or p_bytes > 8388608 then
    raise exception '한 장에 8MB 까지 올리실 수 있습니다';
  end if;

  -- ⚠️⚠️ 경로에 **번호 · 연락처를 넣지 않습니다.** 경로가 새면 그
  --   글자도 같이 새고, 버킷 목록에 그대로 보입니다.
  -- ⚠️⚠️ **`gen_random_bytes()` 를 쓰지 마세요** — pgcrypto 확장에만
  --   있습니다. Supabase 가 그걸 켜 두는 것에 **조용히 기대면** 확장을
  --   끄거나 다른 Postgres 에 세우는 날 이 함수가 통째로 터집니다
  --   (0001 이 GRANT 를 Supabase 기본값에 기대고 있었던 그 자리).
  --   `gen_random_uuid()` 는 **Postgres 13 부터 기본**입니다.
  newp := 'req/' || r.id::text || '/' ||
          replace(gen_random_uuid()::text, '-', '') || '.' || ext;

  insert into request_photo (request_id, path, mime, bytes)
  values (r.id, newp, p_mime, p_bytes);

  -- §8 — 신청 내용이 바뀌는 일이라 기록을 남깁니다 (한 트랜잭션).
  -- ⚠️ 번호 · 연락처 · 경로를 기록에 싣지 않습니다 — 형식과 크기까지.
  insert into audit_log (by_role, obj, obj_id, why, data)
  values ('customer', 'request', r.id::text, '사진을 올렸습니다',
          jsonb_build_object('mime', p_mime, 'bytes', p_bytes, 'n', n + 1));

  return jsonb_build_object('path', newp, 'request', r.id);
end $$;
revoke all on function claim_photo_slot(text, text, text, bigint) from public;


-- ════════════════════════════════════════════════════════════════════
-- ③ 빼기
--
-- ⚠️ 잘못 올리신 사진을 뺄 길이 없으면, 그 사진은 영영 남습니다.
-- ⚠️⚠️ **파일은 서버가 지웁니다.** 이 문은 줄만 지웁니다 — 둘을 한
--   트랜잭션에 묶을 수가 없어서(버킷은 다른 서비스입니다), 줄을 먼저
--   지우고 파일을 그 다음에 지웁니다. 거꾸로 하면 파일은 없는데 줄이
--   남아 **안 열리는 사진**이 보입니다.
create or replace function drop_photo(p_photo uuid) returns void
  language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  rol app_role := my_role();
  p   record;
begin
  if uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  select * into p from request_photo where id = p_photo;
  if not found then raise exception '사진을 찾을 수 없습니다'; end if;
  -- ⚠️⚠️ 올리신 분(계정에 이어 둔 경우) · 직원 · 관리자까지입니다.
  --   **업체는 뺄 수 없습니다** — 남이 올린 자료를 지우는 일입니다.
  if not (is_my_request(p.request_id) or rol in ('staff','admin')) then
    raise exception '이 사진을 뺄 권한이 없습니다';
  end if;

  delete from request_photo where id = p_photo;

  insert into audit_log (by_user, by_role, obj, obj_id, why, data)
  values (uid, rol, 'request', p.request_id::text, '사진을 뺐습니다',
          jsonb_build_object('mime', p.mime, 'bytes', p.bytes));
end $$;
revoke all on function drop_photo(uuid) from public;
grant execute on function drop_photo(uuid) to authenticated;


-- 판 번호 (db/README.md) — ⚠️ 칸 이름은 0002 의 것입니다 (n · name)
insert into schema_version (n, name) values (11, '0011_request_photo')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0012_owner_assignable_offer.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
--  0012 — 담당자 · 배정 가능 여부 · 열람 이력 · 수익상품
--  2026-10-22 "오픈 전 기능 전수검사" 보고서의 P0 ③④⑤⑦
--
--  ⚠️⚠️ **돌린 파일을 고치지 않았습니다.** 0001~0011 은 사장님이 이미
--  돌리셨으므로 그대로 두고, 바뀌는 것을 여기에 덧붙입니다
--  (db/README.md — 번호를 다시 쓰지 않습니다).
--
--  ① request.owner_id  — 이 건을 **누가 맡았는가** (지시서 §1 담당자 배정)
--  ② provider.assignable — **배정해도 되는 업체인가** (listed 와 다릅니다)
--  ③ note_request_open() — 관리자가 **연락처를 열어 본 이력**
--  ④ offer 27줄        — 수익상품이 DB 에 없어서 상품별 수수료 정책을
--                        못 만들고 있었습니다
--
--  ⚠️ 두 번 돌려도 안전합니다 (add column if not exists ·
--  on conflict do nothing · create or replace).
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 담당자 — 이 건은 누구 것인가
--
-- ⚠️⚠️ **`audit_log.by_user` 와 다른 것입니다.** 그쪽은 "누가 바꿨나"
--   (지난 일의 기록)이고, 이것은 "지금 누가 맡고 있나" 입니다. 둘을
--   하나로 쓰면 직원이 둘이 되는 날 **같은 건에 두 사람이 전화**합니다.
-- ⚠️ 비울 수 있습니다 (null = 아직 아무도) — 담당자를 **반드시** 정해야
--   다음 걸음으로 갈 수 있게 만들지 않았습니다. 급한 건을 먼저 받고
--   담당을 나중에 정하는 것이 실제 일하는 차례입니다.
-- ════════════════════════════════════════════════════════════════════
alter table request
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

-- ⚠️⚠️ **직원이 직원 목록을 볼 수 없었습니다.** `account` 의 정책이
--   `account_self`(내 줄)와 `account_admin`(관리자 전부) 둘뿐이라,
--   직원은 담당자 고르개에 **아무것도 못 채웁니다** (uuid 만 보입니다).
-- ⚠️ 그래서 **직원 · 관리자 줄만** 엽니다 — 고객 계정의 성함은 그대로
--   안 보입니다 (role 조건이 그 자리입니다).
drop policy if exists account_staff on account;
create policy account_staff on account for select
  using (my_role() in ('staff','admin') and role in ('staff','admin'));

-- ⚠️⚠️ **표에 update 권한을 주지 않습니다** — 문으로만 바꿉니다 (§8).
--   권한을 주면 기록 없이 지나가는 길이 하나 생깁니다.
create or replace function set_owner(
  p_request uuid, p_owner uuid default null, p_why text default null)
  returns void
  language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  rol app_role := my_role();
  was uuid;
  nm  text;
begin
  if uid is null then
    raise exception '변경자를 알 수 없습니다 — 로그인 후 다시 시도해 주세요';
  end if;
  if rol not in ('staff','admin') then
    raise exception '담당자 배정은 직원 · 관리자만 할 수 있습니다';
  end if;

  select owner_id into was from request where id = p_request;
  if not found then raise exception '신청을 찾을 수 없습니다'; end if;

  -- ⚠️⚠️ **아무 계정이나 담당자로 둘 수 없습니다.** 고객 계정을 담당자로
  --   꽂으면 그 사람이 "내 건" 으로 세어지고, 더 나쁘게는 그걸 보고
  --   연락처를 열어도 되는 사람으로 읽힙니다.
  if p_owner is not null then
    select name into nm from account where id = p_owner and role in ('staff','admin');
    if not found then raise exception '직원 · 관리자 계정이 아닙니다'; end if;
  end if;

  update request set owner_id = p_owner where id = p_request;

  -- ⚠️ 기록과 변경이 **한 트랜잭션**입니다 (§8)
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (uid, rol, 'request', p_request::text,
          case when was is null then 'owner:none' else 'owner:set' end,
          case when p_owner is null then 'owner:none' else 'owner:set' end,
          p_why,
          -- ⚠️ 담당자 **성함은 안 적습니다** — 기록은 못 지우는 것이라
          --    이름이 박히면 영영 남습니다. id 로 충분합니다.
          jsonb_build_object('owner_id', p_owner, 'was', was));
end $$;

-- ════════════════════════════════════════════════════════════════════
-- ② 배정해도 되는 업체인가 — ⚠️⚠️ `listed` 와 **다른 것**입니다
--
--   listed      공개 목록(/providers)에 낼 것인가 — 손님에게 보이는가
--   assignable  신청을 **넘겨도 되는가** — 계약이 되어 있는가
--
-- ⚠️⚠️ **구두 제휴 합의 단계에서 이게 없으면 위험합니다.** 계약서를 쓰기
--   전에 배정되면 그 순간 손님의 성함 · 연락처가 그 업체로 넘어갑니다
--   (개인정보보호법 제17조 제3자 제공). `assign_item()` 과
--   `move_state()` 는 **업체가 있는지만** 보고 있었습니다.
-- ⚠️ 기본값은 **false** 입니다 — 등록해도 켜기 전에는 배정되지 않습니다
--   (fail-closed). 켜는 것은 관리자만입니다.
-- ════════════════════════════════════════════════════════════════════
alter table provider
  add column if not exists assignable boolean not null default false;

-- ⚠️⚠️ **트리거로 막습니다 — 함수마다 적지 않습니다.** 지금 배정이
--   생기는 길이 둘이고(`move_state` 의 배정 · `assign_item`), 앞으로
--   길이 하나 늘 때마다 같은 확인을 또 적으면 **한 곳을 잊는 날**이
--   옵니다. 줄이 만들어지는 자리가 하나라 여기서 봅니다.
-- ⚠️ 관리자도 예외가 아닙니다 — 그게 이 플래그의 뜻입니다.
create or replace function assignment_assignable() returns trigger
  language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  select assignable into ok from provider where id = new.provider_id;
  if not found then
    raise exception '등록된 업체가 아닙니다 — %', new.provider_id;
  end if;
  if not ok then
    raise exception '아직 배정할 수 없는 업체입니다 — % (제휴 계약을 확인하고 /admin 에서 배정 가능으로 켜 주세요)',
      new.provider_id;
  end if;
  return new;
end $$;

drop trigger if exists assignment_assignable_guard on assignment;
create trigger assignment_assignable_guard
  before insert on assignment
  for each row execute function assignment_assignable();

-- 공개 · 확인 배지 · **배정 가능**을 켜는 문 (0007 의 것을 늘립니다)
-- ⚠️⚠️ **인자를 늘리면 덮어쓰기가 아니라 겹치기(overload)입니다.** 옛
--   서명을 먼저 지워야 같은 이름의 함수가 둘이 되지 않습니다 — 둘이
--   되면 어느 쪽이 불리는지가 인자 수에 따라 갈려 조용히 엉뚱한 쪽이
--   돕니다.
drop function if exists approve_provider(text, boolean, jsonb, text);
-- ⚠️⚠️ **새 인자를 맨 뒤에 둡니다.** 가운데 끼우면 자리로 부르던 쪽
--   (SQL 에서 approve_provider(id, listed, verified, why) 로 쓰던 자리)이
--   네 번째를 boolean 으로 읽어 **"invalid input syntax for type boolean"**
--   으로 터집니다 — tools/test-sql.js 에서 실제로 넷이 걸렸습니다.
create or replace function approve_provider(
  p_id         text,
  p_listed     boolean default null,
  p_verified   jsonb   default null,
  p_why        text    default null,
  p_assignable boolean default null
) returns void
  language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_was boolean; v_wasa boolean;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if my_role() <> 'admin' then
    raise exception '업체 공개 · 확인 배지 · 배정 가능은 관리자만 켤 수 있습니다';
  end if;
  select listed, assignable into v_was, v_wasa from provider where id = p_id;
  if not found then raise exception '없는 업체입니다 — %', p_id; end if;

  -- ⚠️ null 은 "안 건드림" 입니다 — false 와 갈라 봅니다
  update provider set
    listed     = coalesce(p_listed, listed),
    verified   = coalesce(p_verified, verified),
    assignable = coalesce(p_assignable, assignable)
  where id = p_id;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, 'admin', 'provider', p_id,
          case when v_was then 'listed' else 'hidden' end,
          case when coalesce(p_listed, v_was) then 'listed' else 'hidden' end,
          p_why,
          jsonb_build_object('verified', p_verified,
                             'assignable', coalesce(p_assignable, v_wasa),
                             'assignable_was', v_wasa));
end $$;

-- ════════════════════════════════════════════════════════════════════
-- ③ 연락처를 열어 본 이력 (개인정보보호법 제29조 — 접속기록)
--
-- ⚠️⚠️ **목록에는 성함 · 연락처가 없습니다** (api/me.js 의 PICK.staff).
--   그런데 **여는 길도 없어서** 관리자가 슬랙을 보고 전화하고 있었습니다.
--   이제 건 하나를 열면 가져오고, **열어 본 것을 기록합니다** — 기록이
--   남으면 "필요할 때만 여는" 것이 지켜집니다.
-- ⚠️ `audit_log` 에 insert 권한을 주지 않았으므로(0001) 문이 필요합니다.
-- ⚠️⚠️ **성함도 번호도 기록에 안 적습니다** — 기록은 못 지우는 것이라,
--   열어 본 이력에 연락처를 박으면 그 자체가 또 하나의 보관입니다.
--   남기는 것은 "누가 · 언제 · 어느 건을" 까지입니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function note_request_open(
  p_request uuid, p_why text default null)
  returns void
  language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); rol app_role := my_role();
begin
  if uid is null then
    raise exception '변경자를 알 수 없습니다 — 로그인 후 다시 시도해 주세요';
  end if;
  if rol not in ('staff','admin') then
    raise exception '연락처 열람 기록은 직원 · 관리자만 남깁니다';
  end if;
  if not exists (select 1 from request where id = p_request) then
    raise exception '신청을 찾을 수 없습니다';
  end if;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (uid, rol, 'request', p_request::text, 'contact:open', p_why);
end $$;

-- ⚠️⚠️ **문만 엽니다** — 표 권한은 안 줍니다 (0007 과 같은 선)
revoke all on function set_owner(uuid, uuid, text)                              from public;
revoke all on function note_request_open(uuid, text)                            from public;
revoke all on function approve_provider(text, boolean, jsonb, text, boolean)    from public;
grant execute on function set_owner(uuid, uuid, text)                           to authenticated;
grant execute on function note_request_open(uuid, text)                         to authenticated;
grant execute on function approve_provider(text, boolean, jsonb, text, boolean) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ④ 수익상품 — ⚠️⚠️ `offer` 표가 **비어 있었습니다**
--
--   js/data/offers.js 에 상품이 있는데 DB 에는 한 줄도 넣는 코드가
--   없었습니다. 그래서 —
--     · `fee_policy.offer_id` 가 offer(id) 를 가리켜서 **상품별 요율을
--       못 걸고** 업체 전체 정책만 걸렸습니다.
--     · `request.offer_id` 도 같은 FK 라, 화면이 offerId 를 보내기
--       시작하는 날 **그 접수의 저장이 통째로 실패**합니다 (접수번호가
--       안 나오고 슬랙으로만 갑니다).
--
-- ⚠️⚠️ **손으로 적은 줄이 아닙니다.** js/data/offers.js 에서 뽑았고,
--   `build-pages.js` 의 `checkOfferSql()` 이 **양쪽을 맞춰 봅니다** —
--   한쪽만 고치면 빌드가 멈춥니다 (이 저장소가 `deal.js` ↔ `deal_move`
--   로 지키는 것과 같은 방식).
-- ⚠️ `status` 는 **전부 `info`** 입니다 — 제휴사가 0곳인데 `live` 로
--   두면 "신청 가능" 으로 읽힙니다 (절대 규칙 5 · checkOffers 가 막습니다).
-- ⚠️ 업종 · 지역을 비워 둡니다 — `{}` 는 "전업종 · 전국" 입니다.
--
-- ⚠️⚠️ **2026-11-01 — 창업 · 폐업 상품 스물일곱을 중고폰 열일곱으로
--   갈았습니다.** 이 파일은 운영 DB 에 **아직 안 돌아갔습니다**
--   (`APPLY_FROM = 8` · 사장님이 0007 까지 돌리셨습니다) — 그래서
--   새 번호를 만들지 않고 여기를 고쳤습니다 (0006 의 enum 과 같은
--   판단입니다). ⚠️ **이미 돌리신 뒤라면 이 파일을 고치지 말고 다음
--   번호로 새로 만드세요.**
-- ⚠️ `apply_type` 도 중고폰 꼴 넷입니다 — sell · quote · buy · bulk
--   (`install` · `rental` 은 창업 · 폐업 것이었습니다). 표의 그 칸은
--   제약 없는 text 라 값만 바뀌면 됩니다.
-- ════════════════════════════════════════════════════════════════════
insert into offer (id, name, lead, cats, industries, regions,
                   apply_type, needs_consult, cost_note, status) values
  ('ph-buyin', '스마트폰 직접 매입', '등급과 용량이 값을 가릅니다. 기준가가 없으면 예상 금액을 내지 않습니다.', array['buyin'], '{}', '{}', 'sell', false, 'quote', 'info'::offer_status),
  ('tab-buyin', '태블릿 · 워치 · 이어폰 매입', '스마트폰보다 기종이 적어 등급표가 단순합니다.', array['buyin'], '{}', '{}', 'sell', false, 'quote', 'info'::offer_status),
  ('self-buyin', '자급제 · 공기계 매입', '약정이 없는 기기라 명의와 잠금만 확인하면 됩니다.', array['buyin'], '{}', '{}', 'sell', false, 'quote', 'info'::offer_status),
  ('bid-match', '매입업체 경쟁입찰 중개', '저희가 사는 것이 아니라 제휴 매입업체가 입찰합니다 — 중개입니다.', array['buyin'], '{}', '{}', 'quote', false, 'quote', 'info'::offer_status),
  ('broken-buyin', '고장 · 파손폰 매입', '켜지지 않아도 값이 붙습니다. 무엇이 고장인지만 적으시면 됩니다.', array['broken'], '{}', '{}', 'sell', false, 'quote', 'info'::offer_status),
  ('part-lot', '부품용 단말기 매입', '살릴 수 없는 기기도 모듈 단위로는 거래됩니다.', array['broken'], '{}', '{}', 'sell', false, 'quote', 'info'::offer_status),
  ('fix-match', '수리 업체 연결', '기종과 증상으로 갈립니다. 부품을 구할 수 있는지가 먼저입니다.', array['fix'], '{}', '{}', 'quote', false, 'quote', 'info'::offer_status),
  ('fix-data', '데이터 복구 연결', '침수 · 액정 고장과 다른 일입니다. 복구율을 약속하지 않습니다.', array['fix'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('shop-sale', '검수 중고폰 판매', '검수를 마친 기기만 올립니다. 등급과 배터리 상태를 같이 냅니다.', array['shop'], '{}', '{}', 'buy', false, 'quote', 'info'::offer_status),
  ('lot-whole', '등급별 벌크 도매', '대수와 등급 구성으로 값이 갈립니다. 한 대씩 보는 거래가 아닙니다.', array['wholesale'], '{}', '{}', 'bulk', true, 'quote', 'info'::offer_status),
  ('auction-fee', 'B2B 경매 중개', '참여 업체끼리 값을 냅니다 — 저희는 자리를 열고 중개합니다.', array['wholesale'], '{}', '{}', 'bulk', true, 'quote', 'info'::offer_status),
  ('corp-buyin', '기업 · 법인 대량 매입', '자산 목록과 반출 절차가 먼저입니다. 대수가 많으면 사람이 갑니다.', array['corp'], '{}', '{}', 'bulk', true, 'quote', 'info'::offer_status),
  ('wipe-cert', '데이터 완전 삭제 증명', '업무용 단말기는 삭제를 증명해야 반출이 끝납니다.', array['corp'], '{}', '{}', 'bulk', true, 'quote', 'info'::offer_status),
  ('export-buyer', '해외 바이어 연결', '나라마다 받는 등급과 기종이 다릅니다. 통관이 따라옵니다.', array['export'], '{}', '{}', 'bulk', true, 'quote', 'info'::offer_status),
  ('inspect-fee', '검수 · 등급 판정', '외관과 기능을 갈라서 봅니다. 등급은 사람이 정하고 기준을 밝힙니다.', array['inspect'], '{}', '{}', 'quote', false, 'quote', 'info'::offer_status),
  ('pickup-post', '택배 · 방문 수거', '포장이 반입니다. 깨진 액정은 따로 싸야 더 깨지지 않습니다.', array['pickup'], '{}', '{}', 'sell', false, 'quote', 'info'::offer_status),
  ('access-sale', '액세서리 · 부자재', '기기와 같이 나가는 것들입니다. 케이스 · 충전기 · 포장재.', array['access'], '{}', '{}', 'buy', false, 'quote', 'info'::offer_status)
on conflict (id) do update set
  name = excluded.name, lead = excluded.lead, cats = excluded.cats,
  apply_type = excluded.apply_type, needs_consult = excluded.needs_consult,
  cost_note = excluded.cost_note;
-- ⚠️⚠️ `status` 를 덮어쓰지 않습니다 — 사장님이 제휴 계약을 하고
--   `live` 로 켜 두셨는데 다시 돌리면 `info` 로 **되돌아갑니다.**
--   (verified · listed 를 save_provider 가 안 건드리는 것과 같은 까닭.)

insert into schema_version (n, name) values (12, '0012_owner_assignable_offer')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0013_provider_contact_settlement.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0013 — 업체 담당자 + 기간별 정산 (2026-10-22 전수검사 P1-13 · P1-14)
--
-- 두 가지를 합니다.
--   ⑬ 업체 **담당자** (이름 · 직통 · 메일)   provider_contact 표 + 문 하나
--   ⑭ **기간별 정산**                      settlement 표를 쓰는 문 둘
--
-- ⚠️⚠️ **왜 담당자를 `provider` 에 안 넣었나** — 0001 의 GRANT 가
--   `grant select on provider to authenticated` 로 **표째**입니다.
--   `provider_public` 정책이 `listed = true` 인 줄을 누구나 읽게
--   열어 두었으니, 거기에 직통 번호를 넣으면 **로그인한 손님 전부가
--   업체 담당자 휴대폰을 봅니다.** RLS 는 줄은 막아도 **칸은 못
--   막습니다** — 이 저장소가 `api/me.js` 의 `PICK` 을 역할마다 손으로
--   적어 둔 까닭 그대로입니다. 그래서 **표를 갈랐습니다.**
--
-- ⚠️⚠️ **`settlement.state` 를 손으로 'paid' 로 만드는 문을 두지
--   않았습니다.** 입금의 진실은 건별 `mark_paid()` 이고, 여기서 또
--   두면 §13 이 금지한 "가짜 정산" 의 길이 하나 더 생깁니다 —
--   `build_settlement()` 이 **세어서** 정합니다.
--
-- ⚠️ 두 번 돌려도 안전합니다 (if not exists · create or replace ·
--   on conflict). 돌린 파일(0001 · 0007)은 **고치지 않았습니다.**
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ⑬ 업체 담당자 — 배정하고 **전화할 사람**
--
-- 지금은 배정해도 걸 곳이 업체 대표번호뿐입니다. 대표번호는 낮에
-- 사무실이 받고, 현장에 있는 담당자에게 닿는 데 하루가 갑니다.
-- ⚠️ 손님에게는 **한 글자도 안 나갑니다** (아래 RLS).
-- ════════════════════════════════════════════════════════════════════
create table if not exists provider_contact (
  provider_id text primary key references provider(id) on delete cascade,
  name        text,                      -- 담당자 이름
  tel         text,                      -- 직통 · 휴대폰
  email       text,
  memo        text,                      -- 언제 연락이 되는지 같은 것
  updated_by  uuid references auth.users(id) on delete set null,
  updated_at  timestamptz not null default now()
);

alter table provider_contact enable row level security;

-- ⚠️⚠️ 손님(customer)은 **정책이 없어서 한 줄도 못 봅니다.**
drop policy if exists provider_contact_staff on provider_contact;
create policy provider_contact_staff on provider_contact for select
  using (my_role() in ('staff','admin'));

-- 업체는 **자기 것만** 봅니다 (자기가 적어 준 담당자입니다)
drop policy if exists provider_contact_self on provider_contact;
create policy provider_contact_self on provider_contact for select
  using (provider_id = my_provider());

-- ⚠️⚠️ **읽기만 줍니다.** 쓰기를 주면 기록 없이 지나가는 길이 하나
--   생깁니다 (§8) — 0007 · 0008 과 같은 규칙입니다.
grant select on provider_contact to authenticated;

create or replace function save_provider_contact(
  p_provider text,
  p_data     jsonb default '{}'::jsonb,   -- name · tel · email · memo
  p_why      text  default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_name  text := nullif(btrim(coalesce(p_data->>'name','')), '');
  v_tel   text := nullif(btrim(coalesce(p_data->>'tel','')), '');
  v_mail  text := nullif(btrim(coalesce(p_data->>'email','')), '');
  v_memo  text := nullif(btrim(coalesce(p_data->>'memo','')), '');
  v_keys  text[] := '{}';
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then
    raise exception '업체 담당자 등록은 직원 · 관리자만 할 수 있습니다';
  end if;
  if not exists (select 1 from provider where id = p_provider) then
    raise exception '없는 업체입니다 — %', coalesce(p_provider,'(없음)');
  end if;
  -- ⚠️ 넷이 다 비면 **줄을 만들지 않습니다** (빈 줄을 안 남깁니다 ·
  --   절대 규칙 2). 지우실 때는 넷을 비워서 보내시면 됩니다.
  if v_name is null and v_tel is null and v_mail is null and v_memo is null then
    delete from provider_contact where provider_id = p_provider;
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
    values (v_me, v_role, 'provider_contact', p_provider, 'cleared', p_why);
    return p_provider;
  end if;
  if v_mail is not null and position('@' in v_mail) < 2 then
    raise exception '메일 주소가 이상합니다';
  end if;

  insert into provider_contact (provider_id, name, tel, email, memo, updated_by)
  values (p_provider, v_name, v_tel, v_mail, v_memo, v_me)
  on conflict (provider_id) do update set
    name = excluded.name, tel = excluded.tel, email = excluded.email,
    memo = excluded.memo, updated_by = excluded.updated_by,
    updated_at = now();

  -- ⚠️⚠️ **감사 기록에 연락처를 싣지 않습니다.** 감사 기록은 고칠 수도
  --   지울 수도 없는 것이라, 거기에 번호를 박으면 그 자체가 또 하나의
  --   보관입니다 (`note_request_open` 과 같은 규칙). 적는 것은 **어느
  --   칸이 채워졌는가**까지입니다.
  -- ⚠️ `v_keys || 'name'` 으로 적으면 **"malformed array literal"** 입니다
  --   (plpgsql 이 오른쪽을 배열로 캐스팅하려 듭니다). 실제 Postgres 에서
  --   돌려 보고 알았습니다 — `array_append()` 를 씁니다.
  if v_name is not null then v_keys := array_append(v_keys, 'name');  end if;
  if v_tel  is not null then v_keys := array_append(v_keys, 'tel');   end if;
  if v_mail is not null then v_keys := array_append(v_keys, 'email'); end if;
  if v_memo is not null then v_keys := array_append(v_keys, 'memo');  end if;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider_contact', p_provider, 'saved', p_why,
          jsonb_build_object('fields', to_jsonb(v_keys)));

  return p_provider;
end $$;

revoke all on function save_provider_contact(text, jsonb, text) from public;
grant execute on function save_provider_contact(text, jsonb, text) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ⑭ 기간별 정산 — **세는 값**입니다
--
-- `settlement` 표는 0001 부터 있었고 **아무 함수도 안 썼습니다.**
-- 업체마다 월 단위로 "이번 달 확정 수수료가 얼마고 얼마가 들어왔나"
-- 를 묶어 보는 자리입니다.
--
-- ⚠️⚠️ **`total` 은 그 시점의 사본**입니다 (정책 사본과 같은 까닭) —
--   나중에 요율이나 계약금액이 바뀌어도 이미 보낸 청구서가 따라
--   바뀌면 안 됩니다. 다시 세시려면 같은 기간으로 한 번 더 부르면
--   덮습니다.
-- ⚠️⚠️ **state 를 손으로 'paid' 로 만들 수 없습니다.** 건별
--   `mark_paid()` 가 진실이고, 이 함수는 그걸 **세어서** 정합니다.
-- ════════════════════════════════════════════════════════════════════
create unique index if not exists settlement_span_uniq
  on settlement (provider_id, from_date, to_date);

create or replace function build_settlement(
  p_provider text,
  p_from     date,
  p_to       date,
  p_why      text default null
) returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid     := auth.uid();
  v_role  app_role := my_role();
  v_total bigint;
  v_paid  bigint;
  v_n     int;
  v_state text;
  v_id    uuid;
  v_was   text;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  -- ⚠️⚠️ **관리자만**입니다 (§8 · 돈이 걸린 자리). 계약을 따는 사람과
  --   청구서를 만드는 사람이 같으면 아무도 교차 확인을 안 합니다.
  if v_role <> 'admin' then
    raise exception '정산은 관리자만 만들 수 있습니다';
  end if;
  if p_from is null or p_to is null then
    raise exception '기간이 없습니다';
  end if;
  if p_from > p_to then
    raise exception '기간이 거꾸로입니다 — % ~ %', p_from, p_to;
  end if;
  if not exists (select 1 from provider where id = p_provider) then
    raise exception '없는 업체입니다 — %', coalesce(p_provider,'(없음)');
  end if;

  -- ⚠️⚠️ **확정된 것만** 셉니다 (`fee_at` 이 있는 줄). 확정 전인 건을
  --   계약금액으로 섞으면 받을 돈이 열 배로 부풀려집니다 — 1,000만원
  --   계약의 수수료가 30만원인 그 자리입니다 (미수금에서 겪었습니다).
  select coalesce(sum(coalesce(d.fee_total, d.fee)), 0), count(*)
    into v_total, v_n
    from deal d
   where d.provider_id = p_provider
     and d.fee_at is not null
     and d.fee_at::date between p_from and p_to;

  -- 들어온 돈은 **입금한 날**로 셉니다 (확정한 날이 아닙니다)
  select coalesce(sum(coalesce(d.paid, 0)), 0)
    into v_paid
    from deal d
   where d.provider_id = p_provider
     and d.paid_at is not null
     and d.paid_at::date between p_from and p_to;

  -- ⚠️ 셀 것이 하나도 없으면 **줄을 만들지 않습니다** (절대 규칙 2).
  --   "0원 청구서" 는 청구서가 아닙니다.
  if v_n = 0 then
    raise exception '그 기간에 확정된 수수료가 없습니다 — % ~ %', p_from, p_to;
  end if;

  v_state := case when v_paid >= v_total then 'paid' else 'wait' end;

  -- ⚠️⚠️ **보류(hold)는 덮지 않습니다.** 사람이 세워 둔 것인데 다시
  --   세면서 풀어 버리면 왜 멈췄는지가 사라집니다.
  select id, state into v_id, v_was
    from settlement
   where provider_id = p_provider and from_date = p_from and to_date = p_to;
  if v_was = 'hold' then v_state := 'hold'; end if;

  -- ⚠️⚠️ **처음 만들 때도 입금일을 적습니다.** 전에는 `on conflict` 쪽에만
  --   적어 두어서, **첫 집계가 바로 'paid' 인 달**(확정과 입금이 같은
  --   기간에 다 끝난 달)은 상태가 입금인데 `paid_at` 이 비어 있었습니다 —
  --   화면이 "언제 들어왔나" 를 못 대는 꼴입니다. 실제 Postgres 로
  --   돌려 보고 잡았습니다.
  insert into settlement (provider_id, from_date, to_date, total, state,
                          approved_by, approved_at, paid_at)
  values (p_provider, p_from, p_to, v_total, v_state, v_me, now(),
          case when v_state = 'paid' then now() else null end)
  on conflict (provider_id, from_date, to_date) do update set
    total = excluded.total, state = excluded.state,
    approved_by = excluded.approved_by, approved_at = now(),
    paid_at = case when excluded.state = 'paid'
                   then coalesce(settlement.paid_at, now()) else null end
  returning id into v_id;

  -- ⚠️ 금액은 기록에 남겨도 됩니다 — 개인정보가 아니고, §8 이 "변경자 ·
  --   변경일시 · 사유" 와 함께 남기라고 한 바로 그 값입니다.
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, v_role, 'settlement', v_id::text, v_was, v_state, p_why,
          jsonb_build_object('provider', p_provider, 'from', p_from, 'to', p_to,
                             'total', v_total, 'paid', v_paid, 'deals', v_n));

  return v_id;
end $$;

revoke all on function build_settlement(text, date, date, text) from public;
grant execute on function build_settlement(text, date, date, text) to authenticated;


-- ⚠️⚠️ 보류 ↔ 대기만 바꿉니다. **'paid' 로 가는 길이 없습니다** —
--   입금은 건별 `mark_paid()` 가 진실이고 `build_settlement()` 이
--   세어서 정합니다 (§13 가짜 정산 금지).
create or replace function hold_settlement(
  p_id   uuid,
  p_hold boolean,
  p_why  text default null
) returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_was  text;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role <> 'admin' then
    raise exception '정산 보류는 관리자만 할 수 있습니다';
  end if;
  select state into v_was from settlement where id = p_id;
  if v_was is null then raise exception '없는 정산입니다'; end if;
  -- ⚠️⚠️ 들어온 돈을 보류로 덮지 않습니다 — 그건 기록을 거짓으로
  --   만드는 것입니다.
  if v_was = 'paid' then
    raise exception '이미 입금으로 집계된 정산입니다 — 보류로 바꿀 수 없습니다';
  end if;
  -- ⚠️ 사유 없는 보류는 다음 사람이 어떻게 다룰지 모릅니다 (§8)
  if p_hold and nullif(btrim(coalesce(p_why,'')), '') is null then
    raise exception '보류 사유를 적어 주세요';
  end if;

  update settlement set state = case when p_hold then 'hold' else 'wait' end
   where id = p_id;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (v_me, v_role, 'settlement', p_id::text, v_was,
          case when p_hold then 'hold' else 'wait' end, p_why);
end $$;

revoke all on function hold_settlement(uuid, boolean, text) from public;
grant execute on function hold_settlement(uuid, boolean, text) to authenticated;


insert into schema_version (n, name) values (13, '0013_provider_contact_settlement')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0014_provider_self_notify.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0014 — 업체가 스스로 고치는 길 + 고객 진행 안내 받기
--
-- 2026-10-22 오픈 전 전수검사 **P2 ⑳ ⑱** (docs/PRELAUNCH_AUDIT-2026-10-22.md §5)
--
--   ⑳ 업체가 **스스로 등록 · 수정**하는 화면
--      → 지금은 직원이 /admin 9번 칸에서 적습니다. 업체가 늘면
--        소개 한 줄을 고치는 일에도 직원을 거쳐야 합니다.
--   ⑱ 고객에게 **상태 변경 알림**
--      → 접수번호를 화면에서 한 번 보고 끝입니다. 배정 · 견적 도착을
--        알 길이 없습니다.
--
-- 두 문                                누가
--   save_provider_self()               업체 **자기 줄만**
--   save_provider_contact()            직원 · 관리자 + **업체 자기 줄** (넓힙니다)
-- 칸 둘
--   request.notify_ok / notify_at      진행 안내를 받으시겠다는 **선택** 동의
--
-- ⚠️⚠️ **돌린 파일(0001 ~ 0013)을 고치지 않았습니다.** 0013 의 함수는
--   `create or replace` 로 갈아 끼웁니다 (같은 인자 · 같은 이름).
-- ⚠️ 두 번 돌려도 안전합니다 (`if not exists` · `create or replace`).
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ⑳-1 업체가 스스로 고치는 길 — ⚠️⚠️ **표를 닫고 문으로만** 받습니다
--
-- 0001 이 `grant update (name, intro, regions, gu, industries, subs,
-- since, consult_hours) on provider to authenticated` 로 **칸 단위
-- 쓰기**를 열어 두었습니다. 그런데 —
--
--   ① **감사 기록이 안 남습니다.** PostgREST 로 바로 PATCH 하면
--      누가 언제 무엇을 고쳤는지가 어디에도 없습니다 (§8).
--   ② **`name` 과 `subs` 까지 열려 있었습니다.** 상호는 제휴 계약의
--      이름이고, `subs`(하는 일)는 **어느 분야 화면에 나오는가**를
--      정합니다 — 업체가 스스로 넓히면 철거만 하는 곳이 세무 화면에
--      앉습니다. 그건 `approve_provider()` 가 보는 일입니다.
--   ③ 그 권한을 **쓰는 코드가 한 줄도 없었습니다** — `api/_db.js` 에
--      update 를 보내는 함수 자체가 없습니다 (select · insert · rpc 뿐).
--
-- 그래서 권한을 걷고 **문 하나**로 모읍니다. 0003 이 돈 쪽에,
-- 0004 가 상태 쪽에 한 것과 같습니다 — **기록 없이 지나갈 길이
-- 없습니다.**
-- ════════════════════════════════════════════════════════════════════
revoke update on provider from authenticated;

-- ⚠️⚠️ **업체가 못 건드리는 것** — 상호 · 하는 일 · 확인 배지 · 공개 ·
--   배정 가능 · 주소(id). 앞의 둘은 여기서, 뒤의 넷은 애초에 이
--   함수가 안 씁니다 (+ `provider_guard()` 트리거가 한 번 더).
create or replace function save_provider_self(
  p_data jsonb default '{}'::jsonb,   -- intro · regions · gu · industries · since · consultHours
  p_why  text  default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_pv   text     := my_provider();
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  -- ⚠️⚠️ 역할을 요청에서 읽지 않습니다 — 토큰으로 `account` 를 보고
  --   거기 적힌 `provider_id` 만 고칩니다. 남의 업체는 애초에 못 집습니다.
  if v_role <> 'provider' or v_pv is null then
    raise exception '업체 계정으로 로그인하셔야 합니다';
  end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '연결된 업체를 찾을 수 없습니다';
  end if;

  update provider set
    intro = nullif(btrim(coalesce(p_data->>'intro','')), ''),
    regions = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'regions','[]'::jsonb)) x), '{}'),
    gu = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'gu','[]'::jsonb)) x), '{}'),
    industries = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'industries','[]'::jsonb)) x), '{}'),
    since = nullif(p_data->>'since','')::int,
    consult_hours = nullif(btrim(coalesce(p_data->>'consultHours','')), '')
  where id = v_pv;

  -- ⚠️ 같은 트랜잭션입니다 — 기록이 실패하면 수정도 안 됩니다 (§8).
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', v_pv, 'self-updated', p_why, p_data);

  return v_pv;
end $$;

revoke all on function save_provider_self(jsonb, text) from public;
grant execute on function save_provider_self(jsonb, text) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ⑳-2 담당자도 업체가 적을 수 있게 — ⚠️ **자기 줄만**
--
-- 0013 이 직원 · 관리자만으로 열어 두었습니다. 그런데 담당자 이름 ·
-- 직통은 **업체가 제일 잘 압니다** (사람이 바뀌면 그 자리에서 고칠
-- 수 있어야 합니다). 읽기는 0013 의 `provider_contact_self` 로 이미
-- 열려 있어서, 쓰기만 넓힙니다.
--
-- ⚠️⚠️ `p_provider` 를 **그대로 믿지 않습니다** — 업체 계정이면
--   `my_provider()` 와 같은지 보고 다르면 거절합니다. 안 보면 업체가
--   남의 업체 담당자를 덮어쓸 수 있습니다.
-- ⚠️⚠️ 이 문은 **`FN_SAY` 에 없습니다** (api/deal.js) — 알림에 담당자
--   이름 · 번호가 실리면 그 순간 새 수탁 범위입니다 (제26조).
-- ════════════════════════════════════════════════════════════════════
create or replace function save_provider_contact(
  p_provider text,
  p_data     jsonb default '{}'::jsonb,   -- name · tel · email · memo
  p_why      text  default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_name  text := nullif(btrim(coalesce(p_data->>'name','')), '');
  v_tel   text := nullif(btrim(coalesce(p_data->>'tel','')), '');
  v_mail  text := nullif(btrim(coalesce(p_data->>'email','')), '');
  v_memo  text := nullif(btrim(coalesce(p_data->>'memo','')), '');
  v_keys  text[] := '{}';
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role = 'provider' then
    -- ⚠️ 업체는 **자기 줄만** — 요청이 보낸 id 를 믿지 않습니다
    if my_provider() is null or p_provider is distinct from my_provider() then
      raise exception '내 업체의 담당자만 적을 수 있습니다';
    end if;
  elsif v_role not in ('staff','admin') then
    raise exception '업체 담당자 등록은 업체 · 직원 · 관리자만 할 수 있습니다';
  end if;
  if not exists (select 1 from provider where id = p_provider) then
    raise exception '없는 업체입니다 — %', coalesce(p_provider,'(없음)');
  end if;
  -- ⚠️ 넷이 다 비면 **줄을 만들지 않습니다** (빈 줄을 안 남깁니다 ·
  --   절대 규칙 2). 지우실 때는 넷을 비워서 보내시면 됩니다.
  if v_name is null and v_tel is null and v_mail is null and v_memo is null then
    delete from provider_contact where provider_id = p_provider;
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
    values (v_me, v_role, 'provider_contact', p_provider, 'cleared', p_why);
    return p_provider;
  end if;
  if v_mail is not null and position('@' in v_mail) < 2 then
    raise exception '메일 주소가 이상합니다';
  end if;

  insert into provider_contact (provider_id, name, tel, email, memo, updated_by)
  values (p_provider, v_name, v_tel, v_mail, v_memo, v_me)
  on conflict (provider_id) do update set
    name = excluded.name, tel = excluded.tel, email = excluded.email,
    memo = excluded.memo, updated_by = excluded.updated_by,
    updated_at = now();

  -- ⚠️⚠️ **감사 기록에 연락처를 싣지 않습니다** (0013 과 같은 까닭).
  if v_name is not null then v_keys := array_append(v_keys, 'name');  end if;
  if v_tel  is not null then v_keys := array_append(v_keys, 'tel');   end if;
  if v_mail is not null then v_keys := array_append(v_keys, 'email'); end if;
  if v_memo is not null then v_keys := array_append(v_keys, 'memo');  end if;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider_contact', p_provider, 'saved', p_why,
          jsonb_build_object('fields', to_jsonb(v_keys)));

  return p_provider;
end $$;

revoke all on function save_provider_contact(text, jsonb, text) from public;
grant execute on function save_provider_contact(text, jsonb, text) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ⑱ 고객 진행 안내 — ⚠️⚠️ **선택**이고 기본은 꺼짐입니다
--
-- 배정 · 견적 도착은 **거래 정보**라 정보통신망법 제50조의 광고성
-- 정보와 다른 건입니다 (접수 완료 안내를 동의 없이 보내는 것과 같은
-- 결). 그래도 **받으시겠다고 하신 분에게만** 보냅니다 —
--
--   ① 광고가 섞이기 쉬운 자리입니다. 한 줄만 권유를 넣으면 그때부터
--      광고이고 사전동의가 먼저입니다 — 동의를 먼저 받아 두면 그
--      선을 넘을 일이 줄어듭니다.
--   ② 끄는 길이 없는 채로 보내면 받기 싫은 분이 막을 수가 없습니다
--      (로그인 없이 들어오는 접수라 수신거부 토큰도 없습니다).
--
-- ⚠️⚠️ **boolean 하나로 두지 않습니다.** `notify_at`(언제 받았나)이
--   같이 있어야 분쟁에서 "받았다" 를 댈 수 있습니다 — `agree_at` ·
--   `agree3rd_at` 과 같은 규칙입니다.
-- ⚠️ 기본값 **false** 입니다 (fail-closed). 안 고르신 것을 "받겠다"
--   로 읽으면 그게 동의 없이 보내는 것입니다.
-- ════════════════════════════════════════════════════════════════════
alter table request add column if not exists notify_ok boolean not null default false;
alter table request add column if not exists notify_at timestamptz;

-- ⚠️⚠️ **동의했다면 시각이 있어야 합니다.** 화면 버그로 true 만 들어오면
--   "언제 받았나" 를 못 대고, 그건 받지 않은 것과 같습니다.
alter table request drop constraint if exists request_notify_at_ok;
alter table request add constraint request_notify_at_ok
  check (notify_ok = false or notify_at is not null);

-- ⚠️ 쓰기 권한을 주지 않습니다 — 접수는 service key 가 넣고(RLS·GRANT
--   를 지나갑니다), 끄는 것은 **메일의 안내대로 회신**입니다. 화면에
--   끄는 단추를 두려면 문을 하나 더 내야 하고(로그인이 필요합니다),
--   지금은 로그인한 고객이 0명이라 그게 작동하지 않는 버튼입니다.

insert into schema_version (n, name) values (14, '0014_provider_self_notify')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0015_retain_fee.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
--  0015 — 유지 수수료 (2026-10-25 진단 P1-6)
-- ════════════════════════════════════════════════════════════════════
--  통신 · 렌탈처럼 **유지되는 동안** 받는 구조를 담습니다.
--
--  왜 `sub` 로 안 되는가 —
--    `sub`      회차마다 **정액**        (월 5만원 집과 15만원 집이 같아집니다)
--    `mrr_rate` 월 **요금의 일정 비율**  × 회차
--
--  그리고 유지분은 **계약한 날이 아니라 유지된 것을 확인한 날** 확정
--  됩니다. `done`(이행 완료)으로 두면 설치한 날 전부를 확정하게 되고,
--  그건 아직 받지도 않은 달까지 청구하는 것입니다 — 그래서 확정 조건에
--  `kept`(약정 유지 확인 후)를 같이 늘립니다.
--
--  ⚠️⚠️ **트랜잭션으로 감싸지 마세요.** `alter type … add value` 로 더한
--  값은 같은 트랜잭션 안에서 쓸 수 없습니다 — psql 기본(문장마다 자동
--  커밋)으로 돌리세요. 0006 과 같은 까닭입니다.
--
--  ⚠️ **두 번 돌려도 안전합니다** (add value if not exists ·
--  on conflict do nothing).
--
--  ⚠️⚠️ **0001 을 고치지 않았습니다.** 그 파일은 이미 돌아갔고,
--  마이그레이션은 번호를 다시 쓰지 않습니다. 그래서 값을 늘리는 길은
--  이 `alter type` 뿐이고, `build-pages.js` 의 `checkDealSql()` 이
--  **0001 의 create type 과 뒤의 alter type 을 합쳐서** 화면의 key 와
--  맞춰 봅니다 (한쪽만 고치면 빌드가 멈춥니다).
-- ════════════════════════════════════════════════════════════════════

-- ── 수익모델 둘 (js/data/fee.js 의 AM_FEE_TYPE) ──────────────────────
alter type fee_type add value if not exists 'mrr_rate' after 'sub';
alter type fee_type add value if not exists 'retain'   after 'mrr_rate';

-- ── 확정 조건 하나 (js/data/fee.js 의 AM_FEE_WHEN) ───────────────────
alter type fee_when add value if not exists 'kept' after 'paid';

-- ⚠️ 표는 한 칸도 안 늘렸습니다. 월 요금 · 회차는 관리자 화면이
--    적어서 계산하고, 확정된 금액만 `deal.fee` 로 들어갑니다 —
--    `deal.amount` 에는 그 기간에 손님이 낸 요금 합(base)이 들어가서
--    "수수료가 계약금액보다 크다" 는 자물쇠가 그대로 돕니다.
-- ⚠️⚠️ `fee_rate_range` 제약(0 < rate ≤ 100)이 유지분에도 그대로
--    걸립니다 — 월 요금의 100% 를 넘게 받는 정책은 없습니다.

insert into schema_version (n, name) values (15, '0015_retain_fee')
  on conflict (n) do nothing;

/* ---------------------------- 0016_provider_apply.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
--  0016 — 업체 입점 신청을 담습니다 (2026-10-25 진단 P1-7)
-- ════════════════════════════════════════════════════════════════════
--  `/join` 으로 들어온 입점 신청이 **슬랙으로만** 가고 있었습니다.
--  채널 글이 묻히면 그 업체는 사라지고, 직원은 전화하려고 그 글을
--  찾아 **업체명 · 번호 · 하는 일을 다시 손으로 칩니다** — 그러다
--  하나라도 틀리면 `/admin` 9번 칸이 만드는 등록 줄이 어긋납니다.
--
--  ⚠️⚠️ **`provider` 에 바로 넣지 않습니다.** 신청은 아직 **업체가
--  아닙니다** — 통화도 안 해 봤고 계약도 없습니다. `provider` 에
--  꽂으면 배정 고르개에 바로 뜨고, 거기 배정되면 그 순간 손님 성함 ·
--  연락처가 **아무 합의도 없는 회사로** 넘어갑니다 (개인정보보호법
--  제17조 제2항 · 0012 의 `assignable` 을 둔 까닭 그대로).
--  통화해서 합의가 되면 **`/admin` 9번 칸**이 `provider` 줄을 만들고,
--  그때 이 신청의 `provider_id` 가 그 업체를 가리킵니다.
--
--  ⚠️⚠️ **손님에게는 한 글자도 안 나갑니다.** 아래 RLS 에 고객 정책이
--  **아예 없습니다** — 업체 담당자 표(0013)와 같은 선입니다.
--
--  ⚠️ 두 번 돌려도 안전합니다 (if not exists · create or replace ·
--  on conflict). 돌린 파일(0001)은 **고치지 않았습니다.**
-- ════════════════════════════════════════════════════════════════════

begin;

-- ── 신청 상태 넷 (js/data/deal.js 의 AM_APPLY_ST) ────────────────────
--  ⚠️⚠️ **화면의 key 와 여기가 같아야 합니다.** 어긋나면 화면이 모르는
--  값이 와서 딱지가 **조용히 빈 칸**이 됩니다 (이 저장소가 `gyeonggi` ·
--  `espresso` 로 겪은 자리) — `build-pages.js` 의 `checkDealSql()` 이
--  빌드마다 맞춰 봅니다.
--  ⚠️ `done` 은 "등록까지 끝" 이고 `drop` 은 "진행 안 함" 입니다.
--  돌아올 수 없는 것이 아니라, 다시 `called` 로 되돌릴 수 있습니다 —
--  "다음 달에 다시 연락 주세요" 를 실패로 닫지 않는 것과 같은 까닭
--  (보류에 `end:true` 를 안 붙인 그 자리).
do $$ begin
  if not exists (select 1 from pg_type where typname = 'apply_state') then
    create type apply_state as enum ('new', 'called', 'done', 'drop');
  end if;
end $$;

create table if not exists provider_apply (
  id          uuid primary key default gen_random_uuid(),
  -- 접수번호 — ⚠️ 손님(업체)에게 돌려주는 값이라 **저장된 뒤에만** 나갑니다
  no          text not null unique,
  company     text not null,
  brn         text,                        -- 사업자등록번호 (적으시면)
  name        text not null,               -- 담당자 성함
  tel         text not null,
  email       text,
  region      text,                        -- 시 · 도 이름 (화면이 보낸 글 그대로)
  industry    text,                        -- 주로 하시는 업종
  -- ⚠️ 하시는 일은 **이름 글자**입니다 (분류 key 가 아닙니다). `/join` 의
  --   칸이 자유 입력이라 key 로 바꿀 수가 없고, 바꿔 적으면 틀립니다 —
  --   등록 줄은 사람이 `/admin` 9번 칸에서 **골라서** 만듭니다.
  services    text[] not null default '{}',
  note        text,                        -- 더 하신 말씀
  -- ⚠️⚠️ 동의를 **시각으로** 남깁니다 (제15조). boolean 으로 두면
  --   "언제 받았나" 를 못 대고, 그게 분쟁에서 받지 않은 것과 같아집니다.
  agree_at    timestamptz not null,
  state       apply_state not null default 'new',
  -- 등록까지 끝난 신청이 가리키는 업체 — ⚠️ 업체를 내려도 신청은 남습니다
  provider_id text references provider(id) on delete set null,
  memo        text,                        -- 마지막으로 적은 사유 (통화 결과 등)
  moved_by    uuid references auth.users(id) on delete set null,
  moved_at    timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists provider_apply_new_idx
  on provider_apply (state, created_at desc);

alter table provider_apply enable row level security;

-- ⚠️⚠️ **고객 · 업체 정책이 없습니다 — 한 줄도 못 봅니다.** 다른 회사의
--   입점 신청이 보이면 그 자체가 유출입니다 (상호 · 담당자 · 번호).
drop policy if exists provider_apply_staff on provider_apply;
create policy provider_apply_staff on provider_apply for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️ **읽기만 줍니다.** 쓰기를 주면 기록 없이 지나가는 길이 하나
--   생깁니다 (§8) — 0007 · 0008 · 0013 과 같은 규칙입니다. 넣는 것은
--   접수(service key)가, 상태를 바꾸는 것은 아래 문이 합니다.
-- ⚠️ `anon`(로그인 안 한 사람)에게는 아무 권한도 주지 않습니다.
grant select on provider_apply to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- 상태를 바꾸는 문 하나 (§8 "변경자 · 변경일시 · 사유를 기록한다")
-- ════════════════════════════════════════════════════════════════════
create or replace function set_apply_state(
  p_apply    uuid,
  p_to       text,                       -- new | called | done | drop
  p_provider text default null,          -- 'done' 일 때 등록된 업체
  p_why      text default null
) returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_was  apply_state;
  v_to   apply_state;
  v_pv   text;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then
    raise exception '입점 신청 처리는 직원 · 관리자만 할 수 있습니다';
  end if;

  select state, provider_id into v_was, v_pv
    from provider_apply where id = p_apply;
  if v_was is null then raise exception '없는 입점 신청입니다'; end if;

  -- ⚠️⚠️ **형변환에 맡기지 마세요.** 그대로 두면 손님 화면에
  --   `invalid input value for enum apply_state: "x"` 가 그대로 나갑니다 —
  --   0008 에서 겪은 자리입니다. 사람 말로 거절합니다.
  if p_to is null or p_to not in ('new','called','done','drop') then
    raise exception '바꿀 상태를 골라 주세요 (새 신청 · 통화함 · 등록 완료 · 진행 안 함)';
  end if;
  v_to := p_to::apply_state;

  -- ⚠️⚠️ **등록 완료는 그 업체를 가리켜야 합니다.** 안 가리키면
  --   "등록했다" 는 말만 남고 어느 업체인지가 사라져서, 나중에 이
  --   신청과 그 업체를 이을 길이 없습니다 (절대 규칙 5).
  if v_to = 'done' then
    v_pv := coalesce(nullif(btrim(coalesce(p_provider,'')), ''), v_pv);
    if v_pv is null then
      raise exception '등록 완료로 두려면 등록한 업체를 골라 주세요';
    end if;
    if not exists (select 1 from provider where id = v_pv) then
      raise exception '없는 업체입니다 — % (먼저 관리자 설정 9번 칸에서 등록하세요)', v_pv;
    end if;
  end if;

  -- ⚠️ 진행 안 함은 **사유를 받습니다** (§8). 왜 안 하기로 했는지가
  --   안 남으면 다음 사람이 그 업체에 또 전화합니다.
  if v_to = 'drop' and nullif(btrim(coalesce(p_why,'')), '') is null then
    raise exception '진행하지 않는 까닭을 적어 주세요';
  end if;

  update provider_apply
     set state = v_to,
         provider_id = case when v_to = 'done' then v_pv else provider_id end,
         -- ⚠️ 적어 주신 사유를 줄에도 남깁니다 — 목록에서 "통화했는데
         --   다음 주에 다시" 를 보려면 감사 기록을 또 묻지 않아야 합니다
         memo = coalesce(nullif(btrim(coalesce(p_why,'')), ''), memo),
         moved_by = v_me, moved_at = now()
   where id = p_apply;

  -- ⚠️⚠️ **기록과 상태 변경이 한 트랜잭션입니다** — 기록이 실패하면
  --   상태도 안 바뀝니다. 기록 없이 지나갈 길이 없습니다 (§8).
  -- ⚠️⚠️ **상호 · 성함 · 번호를 기록에 싣지 않습니다.** 감사 기록은
  --   고칠 수도 지울 수도 없는 것이라, 거기 연락처를 박으면 그 자체가
  --   또 하나의 보관입니다 (`save_provider_contact` 와 같은 규칙).
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, v_role, 'provider_apply', p_apply::text,
          v_was::text, v_to::text, p_why,
          case when v_to = 'done'
               then jsonb_build_object('provider', v_pv) else '{}'::jsonb end);

  return p_apply;
end $$;

revoke all on function set_apply_state(uuid, text, text, text) from public;
grant execute on function set_apply_state(uuid, text, text, text) to authenticated;


insert into schema_version (n, name) values (16, '0016_provider_apply')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0017_tel_key.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0017 — 전화번호를 **숫자만 남긴 칸** (2026-10-25 P0 · 지시서 §3)
--
-- ⚠️⚠️ **왜 필요한가 — 중복 검사가 통째로 무효였습니다.**
-- `api/quote.js` 가 최근 신청을 찾을 때 `?tel=eq.<숫자만>` 으로
-- 물었는데, 표에는 손님이 적으신 그대로 들어갑니다 —
--
--     저장되는 값   request.tel = '010-1234-5678'
--     찾는 질의     ?tel=eq.01012345678
--                 → 한 줄도 안 걸립니다
--
-- 그 조회가 0건이면 **그 안에서 하는 멱등 비교와 스팸 판정도 같이
-- 안 돕니다.** 유실은 `0009` 의 `request_idem_once` 가 막았지만,
-- 슬랙에 2건이 가고 다시 누른 손님은 접수번호를 못 받았습니다.
--
-- ⚠️ 고치는 길이 둘이었습니다 —
--   ① 두 꼴을 `or` 로 묻기            → 질의가 길어지고 인덱스를 못 씁니다
--   ② **숫자만 남긴 칸을 두고 거기에 인덱스** ← 이쪽입니다
--
-- ⚠️⚠️ **생성 칸(generated)입니다 — 손으로 넣지 않습니다.** 코드가 두
-- 곳에서 각자 정규화하면 어긋나는 날이 옵니다 (이 저장소가 같은 규칙을
-- 두 곳에 적어 여러 번 겪은 자리입니다). DB 가 `tel` 에서 만듭니다.
--
-- ⚠️ 새 개인정보가 아닙니다 — `tel` 과 **같은 값**이고, 0001 이 이미
-- `grant select on request to authenticated` 를 표째로 주고 RLS 가 줄을
-- 좁힙니다. 볼 수 있는 사람이 늘지 않습니다.
--
-- ⚠️⚠️ **운영 DB 에 자동으로 돌리지 않습니다.** 대표님이 Supabase SQL
-- Editor 에 붙여 넣으십니다 (db/README.md · docs/GO-LIVE.md).
-- ⚠️ `request` 가 비어 있지 않아도 안전합니다 — 생성 칸이라 있는 줄도
-- 그 자리에서 채워집니다 (표를 한 번 훑습니다).
-- ════════════════════════════════════════════════════════════════════

begin;

-- ── ① 숫자만 남긴 칸 ────────────────────────────────────────────────
-- ⚠️ `stored` 입니다 — `virtual` 은 PG17 부터이고 인덱스를 못 겁니다.
alter table request
  add column if not exists tel_key text
  generated always as (regexp_replace(coalesce(tel, ''), '[^0-9]', '', 'g')) stored;

-- ⚠️⚠️ 인덱스가 없으면 신청이 쌓일수록 접수마다 표를 통째로 훑습니다
-- (접수는 손님이 기다리는 자리입니다 · 화면 제한 20초).
create index if not exists request_tel_key_at
  on request (tel_key, created_at desc);

-- ── ② 멱등 열쇠로 바로 찾는 길 ──────────────────────────────────────
-- ⚠️ `0009` 의 `request_idem_once` 는 **unique 이지만 부분**입니다
-- (`where idem is not null`). 조회에도 그 인덱스가 쓰이는데, 질의에
-- `idem=eq.…` 만 있으면 플래너가 부분 조건을 못 알아보는 경우가 있어
-- 명시적으로 한 줄 더 두지 않습니다 — unique 인덱스로 충분합니다.
-- 이 주석은 "왜 인덱스를 또 안 만들었나" 에 대한 답입니다.

-- ── ③ 판 번호 ──────────────────────────────────────────────────────
insert into schema_version (n, name) values (17, '0017_tel_key')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0018_provider_account_link.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0018 — 업체 **계정 연결**이 없으면 배정 가능으로 켜지지 않습니다
--        (2026-10-25 최종 지시서 §5)
--
-- ⚠️⚠️ **왜 필요한가 — 첫 고객의 건이 `배정` 에서 멈추는 자리입니다.**
-- 길 표(`deal_move`)에서 **네 걸음이 업체(provider) 전용**입니다 —
--
--     assigned → accepted    provider
--     accepted → consult     provider
--     consult  → quoted      provider
--     quoted   → nego        provider / customer
--
-- 직원도 관리자도 그 길로 못 갑니다 (일부러 그렇습니다 — 업체가
-- 수락했다는 기록을 직원이 대신 적으면 그 기록의 뜻이 달라집니다).
-- 그래서 **업체 계정이 그 업체에 이어져 있지 않으면** 배정해 놓고
-- 아무도 다음 걸음을 못 밟습니다. 그 연결은 SQL 한 줄이고 화면이
-- 없어서(일부러 — 화면에서 역할을 올릴 수 있으면 그게 가장 큰
-- 구멍입니다) **빠뜨리기 쉬운 자리**입니다.
--
--     update account set role = 'provider', provider_id = '<업체 id>'
--      where id = '<그 담당자의 User UID>';
--
-- 그래서 **배정 가능(`assignable`)을 켜는 자리에서 막습니다.** 켜지지
-- 않으면 배정도 안 되므로(0012 의 `assignment_assignable_guard`),
-- "배정은 됐는데 진행이 안 되는" 건이 생길 수가 없습니다.
--
-- ⚠️ 자물쇠가 **셋**입니다 —
--     ① `approve_provider()`      관리자가 켜는 **문** (사람 말로 거절)
--     ② `provider_link_guard`     표를 직접 고치는 길 (service key 포함)
--     ③ `assignment_assignable()` 배정하는 순간 (연결이 **풀린** 경우)
--   ②는 ①을 지나지 않는 길을 막고, ③은 켜 둔 뒤에 연결이 끊긴
--   경우를 막습니다. 셋이 **다른 말로** 거절합니다 — 같은 말로 거절하면
--   어느 자물쇠가 걸렸는지 모릅니다 (이 저장소가 0003 에서 겪은 자리).
--
-- ⚠️⚠️ **운영 DB 에 자동으로 돌리지 않습니다.** 대표님이 Supabase SQL
-- Editor 에 붙여 넣으십니다.
-- ════════════════════════════════════════════════════════════════════

begin;

-- ── ① 그 업체에 이어진 계정이 있는가 ────────────────────────────────
-- ⚠️ security definer 입니다 — `account` 는 RLS 가 자기 줄만 열어 주는
-- 표라, 관리자가 아닌 사람이 부르면 늘 "없다" 가 됩니다 (그러면 이
-- 자물쇠가 엉뚱하게 걸립니다). `my_role()` 과 같은 방식입니다.
create or replace function provider_linked(p_id text) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from account
     where provider_id = p_id and role = 'provider'
  )
$$;
revoke all on function provider_linked(text) from public;
grant execute on function provider_linked(text) to authenticated;

-- ── ② 표를 직접 고치는 길 ───────────────────────────────────────────
-- ⚠️⚠️ **insert 에도 걸립니다.** `/admin` 9번 칸이 만드는 줄에는
-- `assignable` 이 없어서(기본 꺼짐) 지금 코드로는 안 걸리지만, 손으로
-- SQL 을 쓰실 때 `assignable` 을 같이 넣으면 ①을 지나지 않습니다.
create or replace function provider_link_check() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if new.assignable
     and (tg_op = 'INSERT' or coalesce(old.assignable, false) = false)
     and not provider_linked(new.id) then
    raise exception
      '업체 계정이 이어져 있지 않습니다 — 배정 가능으로 켤 수 없습니다 (%). '
      '그 업체 담당자가 먼저 로그인하신 뒤 '
      'update account set role=''provider'', provider_id=''%'' where id=''<User UID>''; '
      '를 돌려 주세요 (db/README.md)', new.id, new.id;
  end if;
  return new;
end $$;

drop trigger if exists provider_link_guard on provider;
create trigger provider_link_guard
  before insert or update of assignable on provider
  for each row execute function provider_link_check();

-- ── ③ 켜는 문 — 사람 말로 거절합니다 ────────────────────────────────
-- ⚠️⚠️ 인자와 서명은 0012 것 **그대로**입니다 (늘리지 않습니다) —
-- 자리로 부르던 쪽이 안 깨집니다.
create or replace function approve_provider(
  p_id         text,
  p_listed     boolean default null,
  p_verified   jsonb   default null,
  p_why        text    default null,
  p_assignable boolean default null
) returns void
  language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_was boolean; v_wasa boolean;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if my_role() <> 'admin' then
    raise exception '업체 공개 · 확인 배지 · 배정 가능은 관리자만 켤 수 있습니다';
  end if;
  select listed, assignable into v_was, v_wasa from provider where id = p_id;
  if not found then raise exception '없는 업체입니다 — %', p_id; end if;

  -- ⚠️⚠️ 2026-10-25 §5 — **계정 연결이 먼저입니다.** 트리거(②)도 막지만
  -- 여기서 먼저 **사람 말로** 거절해야 관리자가 무엇을 해야 하는지
  -- 압니다 (화면이 이 글을 그대로 보여 줍니다).
  if coalesce(p_assignable, false) and not coalesce(v_wasa, false)
     and not provider_linked(p_id) then
    raise exception '업체 계정이 이어져 있지 않아 배정 가능으로 켤 수 없습니다. '
      '그 업체 담당자가 먼저 로그인하신 뒤 관리자가 SQL 로 계정을 이어 주세요 '
      '(update account set role=''provider'', provider_id=''%'' where id=''<User UID>'')', p_id;
  end if;

  -- ⚠️ null 은 "안 건드림" 입니다 — false 와 갈라 봅니다
  update provider set
    listed     = coalesce(p_listed, listed),
    verified   = coalesce(p_verified, verified),
    assignable = coalesce(p_assignable, assignable)
  where id = p_id;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, 'admin', 'provider', p_id,
          case when v_was then 'listed' else 'hidden' end,
          case when coalesce(p_listed, v_was) then 'listed' else 'hidden' end,
          p_why,
          jsonb_build_object('verified', p_verified,
                             'assignable', coalesce(p_assignable, v_wasa),
                             'linked', provider_linked(p_id)));
end $$;

revoke all on function approve_provider(text, boolean, jsonb, text, boolean)    from public;
grant execute on function approve_provider(text, boolean, jsonb, text, boolean) to authenticated;

-- ── ④ 배정하는 순간 — 연결이 **풀린** 경우 ──────────────────────────
-- ⚠️ 켜 둔 뒤에 `update account set provider_id = null` 이 되면 ① ②를
-- 지나지 않습니다. 그때는 배정해도 업체가 수락할 수 없으니 여기서
-- 막습니다 — ⚠️⚠️ **다른 말로** 거절합니다 (어느 자물쇠인지 알아야
-- 합니다).
-- ⚠️⚠️ **앞의 두 거절 문구는 0012 것 글자까지 그대로입니다.** 바꾸면
-- 그 말을 기다리는 검사가 떨어지고, 더 나쁘게는 화면이 그 글을 그대로
-- 보여 주는 자리가 있어서 안내가 조용히 달라집니다. 늘린 것은 **셋째**
-- 하나입니다.
create or replace function assignment_assignable() returns trigger
  language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  select assignable into ok from provider where id = new.provider_id;
  if not found then
    raise exception '등록된 업체가 아닙니다 — %', new.provider_id;
  end if;
  if not ok then
    raise exception '아직 배정할 수 없는 업체입니다 — % (제휴 계약을 확인하고 /admin 에서 배정 가능으로 켜 주세요)',
      new.provider_id;
  end if;
  if not provider_linked(new.provider_id) then
    raise exception '업체 계정이 이어져 있지 않습니다 — % (배정해도 업체가 '
      '수락 · 상담 · 견적으로 넘길 수 없습니다. 담당자 로그인 뒤 계정을 '
      '이어 주세요)', new.provider_id;
  end if;
  return new;
end $$;

drop trigger if exists assignment_assignable_guard on assignment;
create trigger assignment_assignable_guard
  before insert on assignment
  for each row execute function assignment_assignable();

-- ── ⑤ 어느 업체에 계정이 이어져 있는가 (화면이 보여 주려고) ────────
-- ⚠️⚠️ **왜 함수인가.** 직원은 `account` 에서 **직원 · 관리자 줄만**
-- 볼 수 있습니다 (0012 의 `account_staff` — 고객 성함이 보이면 안 되니
-- 맞는 설계입니다). 그래서 업체 계정을 PostgREST 로는 못 읽습니다 —
-- 화면이 "이 업체는 계정이 안 이어졌습니다" 를 보여 줄 길이 없었습니다.
-- ⚠️ 돌려주는 것은 **업체 id 뿐**입니다 (사람 정보가 아닙니다).
-- ⚠️ 직원 · 관리자만 부를 수 있습니다.
create or replace function linked_providers() returns setof text
  language plpgsql stable security definer set search_path = public as $$
begin
  if my_role() not in ('staff','admin') then
    raise exception '업체 계정 연결 여부는 직원 · 관리자만 볼 수 있습니다';
  end if;
  return query select distinct provider_id from account
                where provider_id is not null and role = 'provider';
end $$;
revoke all on function linked_providers()    from public;
grant execute on function linked_providers() to authenticated;

-- ── ⑥ 판 번호 ──────────────────────────────────────────────────────
insert into schema_version (n, name) values (18, '0018_provider_account_link')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0019_request_scope.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0019 — **남의 건을 밀 수 없습니다** (2026-10-25 최종 지시서 §6 · §7)
--
-- ⚠️⚠️ **무엇이 뚫려 있었나.** `move_state()` 는 길 표(`deal_move`)에서
-- **역할만** 봅니다 — "이 상태에서 이 상태로, provider 가 갈 수 있는가".
-- 그런데 **어느 업체의 건인가**를 아무 데서도 안 봤습니다. 그래서 —
--
--     pv-two 계정으로 로그인해서
--     select move_state('<pv-one 에게 배정된 신청>','accepted','{}')
--
-- 가 **그대로 통과했습니다.** 길 표의 업체 전용 네 걸음
-- (assigned→accepted · accepted→consult · consult→quoted · quoted→nego)
-- 과 nego→signed · signed→done 이 전부 그랬습니다.
--
-- ⚠️ RLS 는 안 뚫립니다 — 그 업체는 그 신청을 **읽지는** 못합니다
-- (`request_assigned`). 하지만 `move_state` 는 security definer 라
-- RLS 를 지나가고, **쓰는 것**은 막히지 않았습니다. "읽기만 막아 두면
-- 된다" 가 아닌 자리입니다.
--
-- 무엇이 나빠지나 —
--   · 감사 기록에 **남이 수락한 것**으로 남습니다 (§8 의 뜻이 사라집니다).
--   · 경쟁 업체가 남의 건을 협의 · 계약까지 밀 수 있습니다.
--   · 고객 쪽도 같습니다 — 고객 역할은 `lost`(취소) · `hold`(보류)를
--     갈 수 있는데 **자기 신청인지**를 안 봐서, 남의 접수를 취소할 수
--     있었습니다.
--
-- ⚠️⚠️ **함수를 다시 쓰지 않았습니다.** `move_state` 는 0004 에서
-- 만들고 0007 이 다시 썼습니다 (signed 토막). 또 베껴 쓰면 **세 벌**이
-- 되고, 이 저장소는 같은 규칙을 두 곳에 적어 어긋난 사고를 여러 번
-- 겪었습니다. 그래서 **트리거**로 얹습니다 — 0018 의
-- `provider_link_guard` 와 같은 방식이고, 함수를 어떻게 고치든
-- 그 길로는 못 지나갑니다.
--
-- ⚠️ service key 로 부르는 길(접수)은 그대로 지납니다 — 그때는
-- `auth.uid()` 가 비어서 `my_role()` 이 null 이고, 이 트리거는
-- **역할이 있는 사람만** 봅니다 (접수는 로그인 없이 들어오는 것이
-- 맞습니다).
--
-- ⚠️⚠️ **운영 DB 에 자동으로 돌리지 않습니다.** 대표님이 Supabase SQL
-- Editor 에 붙여 넣으십니다.
-- ════════════════════════════════════════════════════════════════════

begin;

create or replace function request_scope_check() returns trigger
  language plpgsql security definer set search_path = public as $$
declare v_role app_role := my_role(); v_pv text;
begin
  -- 상태가 안 바뀌면 볼 것이 없습니다 (담당자 · 메모만 고친 경우)
  if new.state is not distinct from old.state then return new; end if;

  -- ⚠️ 역할이 없으면 서버(service key)입니다 — 접수가 그 길입니다
  if v_role is null then return new; end if;
  -- 직원 · 관리자는 전부 봅니다 (그게 일입니다)
  if v_role in ('staff','admin') then return new; end if;

  if v_role = 'provider' then
    v_pv := my_provider();
    if v_pv is null then
      raise exception '업체 계정에 업체가 이어져 있지 않습니다 — 관리자에게 알려 주세요';
    end if;
    -- ⚠️⚠️ **배정된 업체만**입니다. 남의 건을 수락 · 상담 · 견적 ·
    --   협의로 밀면 그 기록이 거짓이 됩니다 (§8).
    if not exists (select 1 from assignment
                    where request_id = new.id and provider_id = v_pv) then
      raise exception '이 신청에 배정된 업체가 아닙니다 — 남의 건은 진행할 수 없습니다';
    end if;
    return new;
  end if;

  if v_role = 'customer' then
    -- ⚠️⚠️ **자기 신청만**입니다. 고객 역할이 갈 수 있는 길은 취소와
    --   보류뿐인데, 남의 접수를 취소할 수 있으면 그것만으로 사고입니다.
    -- ⚠️ 아직 아무에게도 안 붙은 접수(user_id null)는 고객 역할로
    --   건드릴 수 없습니다 — 번호 + 연락처로 가져가신 뒤입니다
    --   (`claim_request`).
    if new.user_id is null or new.user_id <> auth.uid() then
      raise exception '내 신청이 아닙니다 — 신청번호와 연락처로 먼저 가져와 주세요';
    end if;
    return new;
  end if;

  raise exception '이 신청을 바꿀 수 있는 역할이 아닙니다';
end $$;

drop trigger if exists request_scope_guard on request;
create trigger request_scope_guard
  before update of state on request
  for each row execute function request_scope_check();

-- ── 판 번호 ──────────────────────────────────────────────────────────
insert into schema_version (n, name) values (19, '0019_request_scope')
  on conflict (n) do nothing;

commit;

/* ---------------------------- 0020_device.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0020 · 직접 매입 재고 — 검수 · 원가 · 판매가 · 비용 · 수익
--   2026-10-29 ⑥
--
-- ⚠️⚠️ **중개 장부(deal)와 섞지 않습니다.** 그쪽은 "업체가 계약하고
-- 저희가 수수료를 받는" 기록이고, 이쪽은 "저희가 기기를 사서 파는"
-- 기록입니다. 한 표에 합치면 수수료 수익과 판매 마진이 한 숫자로
-- 섞여 **어느 쪽이 남는 장사인지** 영영 모릅니다.
--
-- ⚠️⚠️ **수익을 칸으로 두지 않습니다.** 원가 · 비용 · 판매가에서 셉니다
-- (뷰 v_device_pl). 숫자로 들고 있으면 누군가 손으로 고칠 수 있고
-- 원장과 어긋나기 시작합니다 — 업체 평점을 값으로 저장하지 않는 것과
-- 같은 까닭입니다.
--
-- ⚠️⚠️ **표에 쓰기 권한을 주지 않습니다.** 문 넷으로만 바뀌고, 문마다
-- 감사 기록을 **같은 트랜잭션에서** 남깁니다 (§8 — 기록 없이 지나갈
-- 길이 없습니다). 0003 · 0004 · 0007 과 같은 규칙입니다.
--
-- ⚠️ 고객은 **자기가 보낸 기기**만 봅니다. 업체는 **한 줄도** 못 봅니다 —
-- 직접 매입은 업체와 무관하고, 재고 · 원가가 보이면 그것이 곧 경쟁
-- 정보입니다 (지시서 §10 inhouse 분리와 같은 결입니다).
-- ════════════════════════════════════════════════════════════════════
begin;

-- ── 상태 아홉 ──────────────────────────────────────────────────────
-- ⚠️ js/data/stock.js 의 AM_DEV_ST 와 **같아야 합니다**
--    (checkStockSql() 이 빌드마다 맞춰 봅니다)
do $$ begin
  create type device_state as enum (
    'waiting','arrived','checking','regrade','checked',
    'listed','sold','returning','scrapped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type device_cost_kind as enum (
    'inbound','repair','clean','outbound','fee','etc');
exception when duplicate_object then null; end $$;

-- ── 기기 한 대 ─────────────────────────────────────────────────────
create table if not exists device (
  id          uuid primary key default gen_random_uuid(),
  -- ⚠️ 접수에서 온 기기는 그 신청을 가리킵니다. 직접 사들인 기기는
  --    null 입니다 — 도매로 들여오는 길이 생겨도 이 표가 그대로 받습니다.
  request_id  uuid references request(id) on delete set null,
  state       device_state not null default 'waiting',

  -- 적어 주신 것 (접수 때) — ⚠️ **검수 결과와 갈라 둡니다.**
  -- 합치면 "무엇이 달랐나" 가 기록에서 사라지고, 재협의의 근거가
  -- 없어집니다 (중고폰 분쟁의 1번 원인).
  said_model  text not null,
  said_cap    int,
  said_grade  text,

  -- 검수 결과 — 확정된 것
  model       text,
  cap         int,
  grade       text,
  color       text,
  batt        int,
  imei_tail   text,              -- ⚠️ **뒤 네 자리만** (아래 제약)

  -- 돈 — ⚠️⚠️ 원 단위 정수. 문으로만 채워집니다.
  cost        bigint,            -- 매입원가 (고객에게 드린 금액)
  price       bigint,            -- 판매 희망가
  sold_price  bigint,            -- 실제 판매가
  sold_at     timestamptz,
  listed_at   timestamptz,
  checked_at  timestamptz,
  checked_by  uuid references auth.users(id) on delete set null,
  note        text,
  created_at  timestamptz not null default now(),

  constraint device_cost_sign  check (cost       is null or cost       >= 0),
  constraint device_price_sign check (price      is null or price      >= 0),
  constraint device_sold_sign  check (sold_price is null or sold_price >= 0),
  constraint device_batt_ok    check (batt is null or (batt > 0 and batt <= 100)),
  -- ⚠️⚠️ **IMEI 를 통째로 담지 마세요.** 기기 하나를 특정하는 값이라
  -- 그 자체가 개인정보에 가깝고, 새면 분실 신고 · 명의와 엮입니다.
  -- 같은 기종이 여러 대일 때 **가르는 데만** 쓰므로 뒤 네 자리면 됩니다.
  constraint device_imei_tail  check (imei_tail is null or imei_tail ~ '^[0-9]{4}$'),
  -- ⚠️⚠️ **검수 전에 원가가 적히면 안 됩니다** (§13 가짜 정산과 같은 결).
  constraint device_cost_needs_check
    check (cost is null or (checked_by is not null and checked_at is not null)),
  -- ⚠️⚠️ **판매 완료인데 판매가가 없으면 안 됩니다.**
  constraint device_sold_needs_price
    check (state <> 'sold' or (sold_price is not null and sold_at is not null))
);
create index if not exists device_state_idx on device(state);
create index if not exists device_req_idx   on device(request_id);

-- ── 검수 기록 ──────────────────────────────────────────────────────
-- ⚠️ 항목마다 한 줄입니다. 한 칸에 몰아 적으면 "무엇을 확인했는지" 가
--    글이 되어 기계가 못 셉니다 — 상품 상세의 "검수한 것" 이 이것입니다.
create table if not exists device_check (
  id        uuid primary key default gen_random_uuid(),
  device_id uuid not null references device(id) on delete cascade,
  item      text not null,                 -- 전원 · 액정 · 배터리 …
  result    text not null,                 -- ok | bad | na
  memo      text,
  by_user   uuid references auth.users(id) on delete set null,
  at        timestamptz not null default now(),
  constraint device_check_result check (result in ('ok','bad','na'))
);
create index if not exists device_check_dev_idx on device_check(device_id);

-- ── 비용 ───────────────────────────────────────────────────────────
-- ⚠️⚠️ **매입원가는 여기 없습니다** (device.cost 한 칸). 섞으면 줄
--    하나를 잘못 지울 때 원가가 바뀝니다.
create table if not exists device_cost (
  id        uuid primary key default gen_random_uuid(),
  device_id uuid not null references device(id) on delete cascade,
  kind      device_cost_kind not null,
  amount    bigint not null,
  memo      text,
  by_user   uuid references auth.users(id) on delete set null,
  at        timestamptz not null default now(),
  -- ⚠️ 음수를 허용합니다 — 환불 · 취소된 비용을 **지우지 않고** 차액으로
  --    적습니다 (환수를 갈아 치우지 않는 것과 같은 규칙).
  constraint device_cost_amount check (amount <> 0)
);
create index if not exists device_cost_dev_idx on device_cost(device_id);

-- ── 갈 수 있는 길 ──────────────────────────────────────────────────
-- ⚠️⚠️ plpgsql 에 손으로 적지 않습니다 — 표로 두고 함수가 읽습니다
--    (0004 의 deal_move 와 같은 방식). checkStockSql() 이 화면의
--    AM_DEV_MOVE 와 맞춰 봅니다.
create table if not exists device_move (
  from_st device_state not null,
  to_st   device_state not null,
  role    app_role    not null,
  primary key (from_st, to_st, role)
);
insert into device_move (from_st, to_st, role) values
  ('waiting','arrived','staff'),   ('waiting','arrived','admin'),
  ('waiting','returning','staff'), ('waiting','returning','admin'),
  ('arrived','checking','staff'),  ('arrived','checking','admin'),
  ('arrived','returning','staff'), ('arrived','returning','admin'),
  ('checking','checked','staff'),  ('checking','checked','admin'),
  ('checking','regrade','staff'),  ('checking','regrade','admin'),
  ('checking','returning','staff'),('checking','returning','admin'),
  ('regrade','checked','staff'),   ('regrade','checked','admin'),
  ('regrade','returning','staff'), ('regrade','returning','admin'),
  ('checked','listed','staff'),    ('checked','listed','admin'),
  ('checked','scrapped','admin'),
  ('listed','sold','staff'),       ('listed','sold','admin'),
  ('listed','checked','staff'),    ('listed','checked','admin'),
  ('listed','scrapped','admin')
on conflict do nothing;

-- ── 손익 — ⚠️⚠️ **세는 값입니다 (칸이 아닙니다)** ──────────────────
create or replace view v_device_pl as
select d.id, d.state, d.model, d.grade,
       coalesce(d.cost, 0)                                   as cost,
       coalesce((select sum(c.amount) from device_cost c
                  where c.device_id = d.id), 0)              as extra,
       coalesce(d.cost, 0) +
       coalesce((select sum(c.amount) from device_cost c
                  where c.device_id = d.id), 0)              as spent,
       d.price, d.sold_price,
       -- 예상 — ⚠️ 판매가를 정해 둔 기기에만
       case when d.price is null then null
            else d.price - (coalesce(d.cost,0) +
                 coalesce((select sum(c.amount) from device_cost c
                            where c.device_id = d.id),0)) end as est_profit,
       -- 실제 — ⚠️⚠️ **팔린 기기에만.** 안 팔린 기기의 예상을 실제에
       -- 섞으면 장부가 거짓말이 됩니다.
       case when d.state <> 'sold' or d.sold_price is null then null
            else d.sold_price - (coalesce(d.cost,0) +
                 coalesce((select sum(c.amount) from device_cost c
                            where c.device_id = d.id),0)) end as real_profit
  from device d;

-- ── RLS ────────────────────────────────────────────────────────────
alter table device       enable row level security;
alter table device_check enable row level security;
alter table device_cost  enable row level security;
alter table device_move  enable row level security;

-- ⚠️⚠️ 고객은 **자기가 보낸 기기**만, 그리고 **돈 칸은 안 줍니다**
--    (아래 GRANT 가 칸을 가릅니다 — RLS 는 줄은 막아도 칸은 못 막습니다).
create policy device_mine on device for select to authenticated
  using (request_id is not null and is_my_request(request_id));
create policy device_staff on device for select to authenticated
  using (my_role() in ('staff','admin'));
create policy device_check_staff on device_check for select to authenticated
  using (my_role() in ('staff','admin'));
-- ⚠️ 검수 결과는 고객도 봅니다 — "무엇을 확인했는지" 를 못 보면
--    재협의 금액을 받아들일 근거가 없습니다.
create policy device_check_mine on device_check for select to authenticated
  using (exists (select 1 from device d
                  where d.id = device_check.device_id
                    and d.request_id is not null
                    and is_my_request(d.request_id)));
-- ⚠️⚠️ **비용은 직원 · 관리자만.** 고객에게 보이면 "원가가 이만큼인데
--    왜 이 값에 샀나" 가 되고, 업체에게 보이면 경쟁 정보입니다.
create policy device_cost_staff on device_cost for select to authenticated
  using (my_role() in ('staff','admin'));
create policy device_move_read on device_move for select to authenticated
  using (true);

-- ── GRANT — ⚠️⚠️ 읽기만. 쓰기는 문으로만 ──────────────────────────
-- ⚠️ anon 에게는 아무것도 주지 않습니다.
grant select (id, request_id, state, said_model, said_cap, said_grade,
              model, cap, grade, color, batt, checked_at, note, created_at,
              price, sold_at, listed_at)
  on device to authenticated;
-- ⚠️⚠️ `cost` · `sold_price` · `imei_tail` · `checked_by` 는 **안 줍니다** —
--    고객에게 원가가 보이면 안 되고, 직원 화면은 아래 함수로 받습니다.
grant select on device_check to authenticated;
grant select on device_cost  to authenticated;
grant select on device_move  to authenticated;

-- ════════ 문 넷 — 기록 없이 지나갈 길이 없습니다 ═══════════════════

-- ① 상태 옮기기
create or replace function move_device(
  p_device uuid, p_to device_state, p_data jsonb default '{}'::jsonb)
returns device language plpgsql security definer set search_path = public as $$
declare v_d device; v_role app_role; v_need text[]; v_k text;
        v_from device_state;
begin
  v_role := my_role();
  -- ⚠️⚠️ 변경자를 못 적는 기록은 기록이 아닙니다 (§8)
  if auth.uid() is null then raise exception '누가 바꾸는지 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then raise exception '권한이 없습니다'; end if;

  select * into v_d from device where id = p_device for update;
  if not found then raise exception '없는 기기입니다'; end if;
  v_from := v_d.state;

  -- ⚠️ 길 표에 없으면 거절 — 역할이 모자란 것과 **갈라서** 말합니다
  --    (화면이 다른 안내를 해야 합니다 · 0004 와 같은 규칙).
  if not exists (select 1 from device_move
                  where from_st = v_d.state and to_st = p_to) then
    raise exception '갈 수 없는 길입니다 — % → %', v_d.state, p_to;
  end if;
  if not exists (select 1 from device_move
                  where from_st = v_d.state and to_st = p_to and role = v_role) then
    raise exception '그 상태로 옮길 권한이 없습니다 — %', p_to;
  end if;

  -- ⚠️ 같이 적어야 하는 것 — `0` 과 `false` 는 값입니다 (있는지만 봅니다)
  v_need := case p_to
    when 'checked'   then array['grade','cost']
    when 'regrade'   then array['why']
    when 'listed'    then array['price']
    when 'sold'      then array['soldPrice']
    when 'returning' then array['why']
    when 'scrapped'  then array['why']
    else array[]::text[] end;
  foreach v_k in array v_need loop
    if p_data->v_k is null or p_data->>v_k = '' then
      raise exception '%', v_k;
    end if;
  end loop;

  if p_to = 'checked' then
    update device set state = p_to,
      grade = p_data->>'grade',
      model = coalesce(p_data->>'model', model),
      cap   = coalesce((p_data->>'cap')::int, cap),
      color = coalesce(p_data->>'color', color),
      batt  = coalesce((p_data->>'batt')::int, batt),
      imei_tail = coalesce(p_data->>'imeiTail', imei_tail),
      cost  = (p_data->>'cost')::bigint,
      checked_by = auth.uid(), checked_at = now()
     where id = p_device returning * into v_d;
  elsif p_to = 'listed' then
    update device set state = p_to, price = (p_data->>'price')::bigint,
      listed_at = now() where id = p_device returning * into v_d;
  elsif p_to = 'sold' then
    update device set state = p_to, sold_price = (p_data->>'soldPrice')::bigint,
      sold_at = now() where id = p_device returning * into v_d;
  else
    update device set state = p_to,
      note = coalesce(p_data->>'why', note)
     where id = p_device returning * into v_d;
  end if;

  -- ⚠️⚠️ 기록과 상태 변경이 **한 트랜잭션**입니다 — 기록이 실패하면
  --    상태도 안 바뀝니다.
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (auth.uid(), v_role, 'device', p_device::text,
          v_from::text, p_to::text, nullif(p_data->>'why',''));
  return v_d;
end $$;

-- ② 검수 항목 적기
create or replace function add_device_check(
  p_device uuid, p_item text, p_result text, p_memo text default null)
returns device_check language plpgsql security definer set search_path = public as $$
declare v_r device_check; v_role app_role;
begin
  v_role := my_role();
  if auth.uid() is null then raise exception '누가 적는지 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then raise exception '권한이 없습니다'; end if;
  if coalesce(trim(p_item),'') = '' then raise exception '검수 항목이 비었습니다'; end if;
  if p_result not in ('ok','bad','na') then raise exception '검수 결과를 확인해 주세요'; end if;
  insert into device_check (device_id, item, result, memo, by_user)
  values (p_device, trim(p_item), p_result, nullif(trim(coalesce(p_memo,'')),''), auth.uid())
  returning * into v_r;
  return v_r;
end $$;

-- ③ 비용 적기
create or replace function add_device_cost(
  p_device uuid, p_kind device_cost_kind, p_amount bigint, p_memo text default null)
returns device_cost language plpgsql security definer set search_path = public as $$
declare v_r device_cost; v_role app_role;
begin
  v_role := my_role();
  if auth.uid() is null then raise exception '누가 적는지 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then raise exception '권한이 없습니다'; end if;
  -- ⚠️⚠️ **0 원 비용을 적지 않습니다** — 0 은 비용이 아니라 "없음" 이고,
  --    줄이 쌓이면 원장을 읽기만 어려워집니다.
  if p_amount is null or p_amount = 0 then raise exception '비용이 0 원입니다'; end if;
  insert into device_cost (device_id, kind, amount, memo, by_user)
  values (p_device, p_kind, p_amount, nullif(trim(coalesce(p_memo,'')),''), auth.uid())
  returning * into v_r;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (auth.uid(), v_role, 'device_cost', p_device::text,
          p_kind::text, nullif(trim(coalesce(p_memo,'')),''));
  return v_r;
end $$;

-- ④ 기기 만들기 (접수에서 또는 직접)
create or replace function make_device(
  p_request uuid, p_model text, p_cap int default null, p_grade text default null)
returns device language plpgsql security definer set search_path = public as $$
declare v_d device; v_role app_role;
begin
  v_role := my_role();
  if auth.uid() is null then raise exception '누가 만드는지 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then raise exception '권한이 없습니다'; end if;
  if coalesce(trim(p_model),'') = '' then raise exception '기종이 비었습니다'; end if;
  insert into device (request_id, said_model, said_cap, said_grade)
  values (p_request, trim(p_model), p_cap, nullif(trim(coalesce(p_grade,'')),''))
  returning * into v_d;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state)
  values (auth.uid(), v_role, 'device', v_d.id::text, 'waiting');
  return v_d;
end $$;

revoke all on function move_device(uuid, device_state, jsonb) from public;
revoke all on function add_device_check(uuid, text, text, text) from public;
revoke all on function add_device_cost(uuid, device_cost_kind, bigint, text) from public;
revoke all on function make_device(uuid, text, int, text) from public;
grant execute on function move_device(uuid, device_state, jsonb) to authenticated;
grant execute on function add_device_check(uuid, text, text, text) to authenticated;
grant execute on function add_device_cost(uuid, device_cost_kind, bigint, text) to authenticated;
grant execute on function make_device(uuid, text, int, text) to authenticated;

insert into schema_version (n, name) values (20, '0020_device')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0021_inhouse.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0021 · 자체 매입 부서를 **경쟁 입찰에서 갈라 둡니다** (PHONEWAY §10)
--   2026-10-30 ⑤ 경쟁입찰
--
-- > §10 — "폰웨이 자체 매입 부서가 경쟁업체의 **비공개 입찰정보를
-- >        이용해** 부당하게 유리한 견적을 제시하지 못하도록"
--
-- ⚠️⚠️ **봉인은 이미 되어 있었습니다 — 구멍은 한 자리였습니다.**
--   재 보니 0008 의 정책이 이미 봉인 입찰입니다 —
--     · `quote_mine`   업체는 **자기 입찰만** 봅니다
--     · `assign_mine`  업체는 **자기 배정 줄만** 봅니다
--       (그래서 **누가 같이 입찰하는지도** 모릅니다)
--     · `quote_staff`  직원 · 관리자는 **전부** 봅니다 (운영자니까요)
--
--   그런데 `account` 는 `role` 과 `provider_id` 를 **둘 다** 들 수
--   있습니다. `update account set role='staff', provider_id='폰웨이'`
--   **한 줄**이면 같은 계정이
--     ① `quote_staff` 로 **경쟁 업체의 금액을 전부 보고**
--     ② `my_provider()` 로 **자기 입찰을 냅니다**
--   §10 이 막으라고 한 것이 정확히 그것이고, 오늘 **실제로 됩니다.**
--
-- ⚠️⚠️ **역할을 하나 더 만들지 않았습니다.** `inhouse` 를 app_role 에
--   더하면 `my_role()` 을 보는 자리가 **스물 몇 군데** 전부 그 값을
--   알아야 하고(길 표 · RLS · api/me.js 의 PICK · 화면), 한 곳만
--   놓치면 거기서 **아무 권한도 없는 유령**이 됩니다. 자체 매입
--   부서는 **업체 계정 그대로**입니다 — 남과 똑같이 자기 것만 봅니다.
--   달라지는 것은 **딱지 하나**(`provider.inhouse`)이고, 그건 권한이
--   아니라 **손님에게 누구인지 밝히는 표시**입니다.
--
--     ① provider.inhouse        폰웨이 자신의 매입 부서인가 (표시)
--     ② account_role_guard      업체에 이어진 계정은 직원 · 관리자가
--                               될 수 없습니다  ← **§10 의 자물쇠**
--     ③ set_provider_inhouse    그 딱지를 켜고 끄는 문 (관리자만)
--
-- ⚠️ 두 번 돌려도 안전합니다 (if not exists · create or replace).
-- ⚠️⚠️ 돌린 파일을 **고치지 않았습니다** — 다음 번호로 새로 만듭니다.
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 자체 매입 딱지
--
-- ⚠️⚠️ **권한이 아니라 표시입니다.** 이 칸이 참이어도 보는 것 · 내는
--   것이 한 글자도 안 달라집니다 — 달라지는 것은 **손님 화면**입니다.
--   입찰을 나란히 놓을 때 "폰웨이 직접 매입" 과 "제휴 매입업체" 가
--   구분이 없으면, 손님은 누구와 거래하는지 모르는 채로 고릅니다.
--   그 자체가 §10 이 막으려는 오인입니다 (전자상거래법 제20조 제1항의
--   중개자 고지와 같은 결입니다 — 어느 건에서 우리가 **당사자**인지).
-- ⚠️ 기본값은 거짓입니다. 모르는 것을 "우리 것" 으로 두면 안 됩니다.
-- ════════════════════════════════════════════════════════════════════
alter table provider add column if not exists inhouse boolean not null default false;

comment on column provider.inhouse is
  '폰웨이 자신의 매입 부서인가 — 권한이 아니라 손님에게 밝히는 표시 (§10)';

-- 손님 화면이 "제휴 매입업체" 만 따로 세는 자리가 생깁니다
create index if not exists provider_inhouse_idx on provider (inhouse) where inhouse;


-- ════════════════════════════════════════════════════════════════════
-- ② ⚠️⚠️ **§10 의 자물쇠** — 업체에 이어진 계정은 운영자가 될 수 없습니다
--
--   입찰을 **내는 사람**과 입찰을 **다 보는 사람**이 같은 계정일 수
--   없게 합니다. 이 한 줄이 §10 입니다.
--
-- ⚠️⚠️ **반대쪽도 막습니다** — 직원 · 관리자 계정에 `provider_id` 를
--   나중에 붙이는 길도 같은 줄이 막습니다 (둘 다 update 입니다).
--
-- ⚠️ **거절하는 말이 사람 말이라야 합니다** — `api/deal.js` 가 DB 의
--   거절 글을 그대로 보여 줍니다 (0008 에서 겪은 자리).
--
-- ⚠️⚠️ **이 트리거가 막지 못하는 것** — 운영자가 **다른 메일로** 업체
--   계정을 따로 만들어 두고, 운영자 계정으로 본 금액을 그쪽에 옮겨
--   적는 것. 그건 코드가 아니라 사람의 일입니다. 여기서 하는 일은
--   **한 계정이 둘 다 할 수 없게** 하는 것까지이고, 누가 무엇을
--   바꿨는지는 `audit_log` 가 들고 있습니다 (§8).
-- ════════════════════════════════════════════════════════════════════
create or replace function account_role_guard() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if new.provider_id is not null and new.role in ('staff','admin') then
    raise exception
      '업체에 이어진 계정은 직원 · 관리자가 될 수 없습니다 — 입찰을 내는 쪽과 입찰을 다 보는 쪽은 같은 계정일 수 없습니다 (§10)';
  end if;
  return new;
end $$;

drop trigger if exists account_role_guard_t on account;
create trigger account_role_guard_t before insert or update on account
  for each row execute function account_role_guard();

-- ⚠️⚠️ **이미 그런 줄이 있으면 여기서 멈춥니다.** 트리거는 앞으로만
--   막습니다 — 이미 있는 줄은 그대로 §10 구멍이고, 조용히 두면
--   "막았습니다" 가 거짓이 됩니다. 멈추고 어느 계정인지 말합니다.
do $$
declare v_n int; v_who text;
begin
  select count(*), coalesce(string_agg(id::text, ', '), '')
    into v_n, v_who
    from account where provider_id is not null and role in ('staff','admin');
  if v_n > 0 then
    raise exception
      '업체에 이어진 계정이 직원 · 관리자입니다 (%건: %) — 역할을 provider 로 내리거나 provider_id 를 비운 뒤 다시 돌려 주세요 (§10)',
      v_n, v_who;
  end if;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ③ 자체 매입 딱지를 켜고 끄는 문 — **관리자만**
--
-- ⚠️⚠️ **업체가 스스로 못 켭니다.** `provider_guard()` 가 한 번 더
--   막습니다 (아래) — 확인 배지 · 공개 여부와 같은 규칙입니다.
--   누가 "폰웨이 직접 매입" 딱지를 달 수 있으면 그 순간 손님이
--   누구와 거래하는지가 거짓이 됩니다 (절대 규칙 1).
-- ⚠️ `approve_provider` 에 인자를 더하지 않았습니다 — 그러면 그
--   함수의 **세 번째 사본**이 생깁니다 (0007 · 0012). 한 가지 일을
--   하는 작은 문이 낫습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function set_provider_inhouse(
  p_id  text,
  p_on  boolean,
  p_why text default null
) returns provider
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_pv   provider;
begin
  if v_me is null then
    raise exception '변경자를 알 수 없습니다 — 로그인한 세션에서만 됩니다';
  end if;
  if v_role <> 'admin' then
    raise exception '자체 매입 표시는 관리자만 켜고 끌 수 있습니다';
  end if;

  update provider set inhouse = coalesce(p_on, false)
   where id = p_id
   returning * into v_pv;
  if v_pv.id is null then raise exception '없는 업체입니다'; end if;

  -- ⚠️ 같은 트랜잭션입니다 — 기록이 실패하면 딱지도 안 바뀝니다 (§8)
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (v_me, v_role, 'provider', p_id,
          case when coalesce(p_on,false) then 'inhouse:on' else 'inhouse:off' end,
          nullif(btrim(coalesce(p_why,'')), ''));
  return v_pv;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ④ 업체가 스스로 못 건드리는 칸에 `inhouse` 를 더합니다
--
-- ⚠️⚠️ 0001 의 `provider_guard()` 를 **다시 씁니다** — 트리거는 그대로
--   두고 함수 본문만 갈아 끼웁니다 (0007 이 `move_state` 를 그렇게
--   했습니다). 새 트리거를 하나 더 달면 같은 규칙이 두 곳에 적힙니다.
-- ⚠️ 0001 의 세 줄(verified · listed · id)을 **글자까지 그대로** 둡니다 —
--   화면이 그 거절 글을 그대로 보여 줍니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function provider_guard() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if my_role() = 'admin' then return new; end if;
  if new.verified is distinct from old.verified then
    raise exception '확인 배지는 플랫폼이 서류를 확인한 뒤에만 켜집니다';
  end if;
  if new.listed is distinct from old.listed then
    raise exception '공개 여부는 관리자가 정합니다';
  end if;
  if new.id is distinct from old.id then
    raise exception '업체 주소(id)는 바꿀 수 없습니다 — 이미 색인된 주소입니다';
  end if;
  if new.inhouse is distinct from old.inhouse then
    raise exception '자체 매입 표시는 관리자가 정합니다';
  end if;
  return new;
end $$;


revoke all on function set_provider_inhouse(text, boolean, text) from public;
grant execute on function set_provider_inhouse(text, boolean, text) to authenticated;

-- ⚠️⚠️ `inhouse` 에 **쓰기 권한을 주지 않습니다.** 0001 의 GRANT 가
--   칸 단위라, 안 더하면 그대로 닫혀 있습니다 — 바꾸는 길은 위 문
--   하나뿐입니다 (`verified` · `listed` 와 같은 선).

insert into schema_version (n, name) values (21, '0021_inhouse')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0022_legacy_archive.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0022 · 앞 서비스(창업 · 폐업) 접수를 **보관 표시**로 내려놓습니다
--   2026-11-02 · 전환 지시서 §6 — "삭제 작업은 가능한 경우 복구 가능한
--   마이그레이션으로 관리한다"
--
-- 지우는 것이 **한 줄도 없습니다.** 칸도 · 줄도 · 기록도 그대로 두고,
-- `request` 에 표시 두 칸을 더해 **목록에서만 내려놓습니다.**
--
-- ⚠️⚠️ **왜 "보관 표로 옮기기" 가 아닌가 — 재서 바꿨습니다.**
--   처음 적어 둔 계획은 옛 접수를 보관 표로 **옮기는** 것이었습니다.
--   그런데 `request(id)` 를 가리키는 외래키가 **여섯**이고 다섯이
--   `on delete cascade` 입니다 —
--
--     assignment · deal · quote · request_item · request_photo  (cascade)
--     device                                                   (set null)
--
--   줄을 옮긴다는 것은 `request` 에서 지운다는 뜻이고, 그러면 그 건의
--   **배정 · 계약 · 수수료 · 입찰 · 사진이 같이 사라집니다.** §8 이
--   "모든 중요한 상태 변경을 기록한다" 고 적어 둔 그 기록이 통째로
--   없어지는 것이라, 복구 가능한 마이그레이션이 아니라 **제일 비싼
--   파괴**였습니다. 그래서 **옮기지 않고 표시합니다.**
--
-- ⚠️⚠️ **스냅샷 보관 표도 만들지 않았습니다.** 옛 줄을 통째로 베껴
--   두면 성함 · 연락처가 **두 번 보관**됩니다 — 이 저장소가 감사 기록과
--   `note_request_open` 에서 "기록은 못 지우는 것이라 그 자체가 또
--   하나의 보관입니다" 로 두 번 적어 둔 자리입니다. 원본 줄이 그대로
--   남아 있으니 베낄 까닭도 없습니다.
--
-- ⚠️⚠️ **`request.industry` 는 한 글자도 안 건드립니다.** 그 칸은
--   버려진 것이 아니라 **뜻이 바뀐** 칸입니다 — 2026-10-31 로 중고폰
--   **기기 종류**를 담고 `api/me.js` 의 역할 넷이 전부 가져갑니다
--   (`/my` 의 `myCond()` · `/admin` 의 거르개 · 업체 칸의 "취급 기기").
--   지우면 PostgREST 가 없는 칸을 달라고 해서 `/my` 와 `/admin` 접수
--   목록이 **통째로 안 그려집니다.**
--
-- 되돌리는 법 ───────────────────────────────────────────────────────
--   한 건      select restore_legacy_request('SW-XXXX-XXXX', '까닭');
--   전부       update request set archived_at = null, archived_why = null;
--   칸까지     alter table request drop column archived_at, drop column archived_why;
--
-- ⚠️ 두 번 돌려도 안전합니다 (add column if not exists · create or replace).
-- ⚠️⚠️ 돌린 파일을 **고치지 않았습니다** — 다음 번호로 새로 만듭니다.
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 보관 표시 두 칸
--
-- ⚠️⚠️ **사유 없는 보관은 기록이 아닙니다** (§8). 시각만 찍히고 왜
--   내려놓았는지가 없으면, 반 년 뒤에 그 건을 보는 사람이 "이게 왜
--   목록에 없지" 를 아무 데서도 못 읽습니다 — 0014 의
--   `request_notify_at_ok`(동의했다면 시각이 있어야 한다)와 같은 선입니다.
-- ════════════════════════════════════════════════════════════════════
alter table request add column if not exists archived_at  timestamptz;
alter table request add column if not exists archived_why text;

alter table request drop constraint if exists request_archived_why_ok;
alter table request add constraint request_archived_why_ok
  check (archived_at is null or btrim(coalesce(archived_why, '')) <> '');

-- ⚠️⚠️ **쓰기 권한을 주지 않습니다.** 0001 의 GRANT 가 칸 단위라, 안
--   더하면 그대로 닫혀 있습니다 — 바꾸는 길은 아래 문 둘뿐입니다
--   (`verified` · `listed` · `inhouse` 와 같은 선).


-- ════════════════════════════════════════════════════════════════════
-- ② 보관하는 문 — 관리자만 (`archive_legacy_side`)
--
-- 앞 서비스의 `side` 넷(start · ops · transfer · close)을 가진 접수를
-- 한 번에 내려놓습니다. 중고폰 쪽 값(buyin · bid · export · repair)은
-- **건드리지 않습니다.**
--
-- ⚠️⚠️ **돈이 안 끝난 건은 두고 갑니다.** 수수료를 확정해 두고 아직
--   입금이 안 된 건을 목록에서 내리면 **미수금이 화면에서 사라집니다** —
--   이 저장소가 "미수금은 확정된 건만 센다" 로 겪은 자리의 반대쪽이고,
--   §13 이 금지한 가짜 정산과 결이 같습니다. 그런 건은 세어서
--   돌려주고 사람이 먼저 정산하게 둡니다.
-- ⚠️ 돌려주는 값이 **둘**입니다 — 내려놓은 수와 **두고 온 수**. 두고 온
--   것을 안 세면 "다 됐다" 로 읽히고, 남은 건은 아무도 안 봅니다.
-- ⚠️⚠️ 기록과 표시가 **한 트랜잭션**입니다 — 기록이 실패하면 표시도
--   안 붙습니다 (§8 · 0003 · 0004 와 같은 규칙).
-- ════════════════════════════════════════════════════════════════════
create or replace function archive_legacy_side(p_why text)
  returns jsonb
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_why  text     := nullif(btrim(coalesce(p_why, '')), '');
  v_done int      := 0;
  v_kept int      := 0;
begin
  if v_me is null then
    raise exception '변경자를 알 수 없습니다 — 로그인한 세션에서만 됩니다';
  end if;
  if v_role <> 'admin' then
    raise exception '보관은 관리자만 할 수 있습니다';
  end if;
  if v_why is null then
    raise exception '보관 사유를 적어 주세요 — 사유 없는 보관은 기록이 아닙니다';
  end if;

  /* 돈이 안 끝난 건 — 세어만 두고 지나갑니다 */
  select count(*) into v_kept
    from request r
   where r.side in ('start', 'ops', 'transfer', 'close')
     and r.archived_at is null
     and exists (select 1 from deal d
                  where d.request_id = r.id
                    and d.fee_at is not null
                    and d.paid_at is null);

  with moved as (
    update request r
       set archived_at = now(), archived_why = v_why
     where r.side in ('start', 'ops', 'transfer', 'close')
       and r.archived_at is null
       and not exists (select 1 from deal d
                        where d.request_id = r.id
                          and d.fee_at is not null
                          and d.paid_at is null)
    returning r.id, r.state
  ), logged as (
    /* ⚠️ 기록에 성함 · 연락처를 안 적습니다 — 감사 기록은 못 지우는
       것이라 거기 번호를 박으면 그 자체가 또 하나의 보관입니다
       (`note_request_open` · `save_provider_contact` 와 같은 규칙). */
    insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
    select v_me, v_role, 'request', m.id::text, m.state::text, 'archived', v_why
      from moved m
    returning 1
  )
  select count(*)::int into v_done from logged;

  return jsonb_build_object('archived', v_done, 'kept', v_kept);
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ③ 되돌리는 문 — 관리자만 (`restore_legacy_request`)
--
-- ⚠️⚠️ **한 건씩입니다.** 통째로 되돌리는 문을 만들면 잘못 누른 날
--   손볼 자리가 없습니다 — 전부 되돌리시려면 머리말의 `update` 한 줄을
--   쓰시면 되고, 그건 사람이 한 번 더 생각하고 치는 길입니다.
-- ⚠️ 신청번호(`no`)로 받습니다 — 관리자가 손에 들고 있는 값은 uuid 가
--   아니라 접수번호입니다 (`claim_request` 와 같은 선).
-- ════════════════════════════════════════════════════════════════════
create or replace function restore_legacy_request(p_no text, p_why text)
  returns request
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_why  text     := nullif(btrim(coalesce(p_why, '')), '');
  v_rq   request;
begin
  if v_me is null then
    raise exception '변경자를 알 수 없습니다 — 로그인한 세션에서만 됩니다';
  end if;
  if v_role <> 'admin' then
    raise exception '보관을 되돌리는 것은 관리자만 할 수 있습니다';
  end if;
  if v_why is null then
    raise exception '되돌리는 사유를 적어 주세요';
  end if;

  update request
     set archived_at = null, archived_why = null
   where no = btrim(coalesce(p_no, ''))
     and archived_at is not null
   returning * into v_rq;

  /* ⚠️ 없는 번호와 **이미 안 보관된 번호**를 가르지 않습니다 — 한 가지
     말로만 거절합니다 (0005 의 `claim_request` 와 같은 까닭: 갈라 주면
     번호가 있는지를 확인해 가며 긁을 수 있습니다). */
  if v_rq.id is null then
    raise exception '보관된 신청을 찾지 못했습니다 — 신청번호를 확인해 주세요';
  end if;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (v_me, v_role, 'request', v_rq.id::text, 'archived', v_rq.state::text, v_why);

  return v_rq;
end $$;


revoke all on function archive_legacy_side(text) from public;
revoke all on function restore_legacy_request(text, text) from public;
grant execute on function archive_legacy_side(text) to authenticated;
grant execute on function restore_legacy_request(text, text) to authenticated;


insert into schema_version (n, name) values (22, '0022_legacy_archive')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0023_provider_axes.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0023 · 업체 분류 축 — **취급 브랜드 · 거래 규모** 두 칸
--   2026-11-02 · 더하기만 합니다 (지우는 것도 · 고치는 것도 없습니다)
--
-- ⚠️⚠️ **셋을 받아 둘만 칸으로 만들었습니다.**
--   "수리 가능 여부" 는 `provider.subs` 가 **이미** 답합니다 —
--   `catalog.js` 의 `fix`(수리 서비스) 분류에 든 하위를 하나라도 적었으면
--   수리하는 곳입니다. 거기에 boolean 을 더하면 **같은 규칙이 두 곳**이
--   되고, 이 저장소는 그렇게 어긋난 사고를 여러 번 겪었습니다
--   (`amCatTo`/`catTo` · 손으로 적어 둔 아이콘 표 둘 · `deal.js` ↔
--   `deal_move`). 화면은 `amProviderCanFix()` 로 **셉니다** — 평점과
--   포트폴리오 건수를 값으로 저장하지 않는 것과 같은 까닭입니다.
--
--     brands text[]   취급 브랜드   amShopMakers() 의 일곱 key
--     scale  text     거래 규모     small · mid · large  ⚠️ 한 칸
--
-- ⚠️⚠️ **`scale` 은 업체가 적은 값입니다** — 우리가 재 본 적이 없습니다
--   (`as` · `faq` 와 같은 결). 화면이 그 줄을 같이 냅니다. 재 본 값인
--   것처럼 쓰면 그게 지어낸 신뢰입니다 (절대 규칙 1).
-- ⚠️⚠️ **안 적은 것을 "안 한다" 로 읽지 않습니다.** 빈 `brands` 는
--   "전 브랜드" 이고 빈 `scale` 은 "모름" 입니다 — 지역 · 취급 기기를
--   그렇게 읽는 것과 같은 규칙입니다 (`subs` 만 예외: 하는 일을 안 적은
--   것을 "전부 다 합니다" 로 읽으면 안 됩니다).
--
-- ⚠️ 쓰기 권한을 **표에 주지 않습니다** — 0014 가 `revoke update on
--   provider from authenticated` 로 닫아 두었고, 바꾸는 길은 아래 문
--   둘뿐입니다 (`save_provider` · `save_provider_self`). 그래야 감사
--   기록 없이 지나갈 길이 안 생깁니다 (§8).
-- ⚠️⚠️ 승인 칸이 아닙니다 — `verified` · `listed` · `assignable` ·
--   `inhouse` 와 달리 **업체가 스스로 적는** 값이라 `provider_guard()`
--   를 안 건드립니다 (거기 넣으면 업체가 못 고칩니다).
--
-- 되돌리는 법 ───────────────────────────────────────────────────────
--   alter table provider drop column brands, drop column scale;
--   (문 둘은 0007(save_provider) · 0014(save_provider_self) 의 정의를
--    다시 돌리면 그대로 돌아옵니다 — ⚠️ 0013 이 아닙니다. 그 번호는
--    담당자 표(save_provider_contact)입니다)
--
-- ⚠️ 두 번 돌려도 안전합니다 (add column if not exists · create or replace).
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 칸 둘
-- ════════════════════════════════════════════════════════════════════
alter table provider add column if not exists brands text[] not null default '{}';
alter table provider add column if not exists scale  text;

-- ⚠️⚠️ **값을 못박아 둡니다.** 화면의 `AM_PROVIDER_SCALE` 과 어긋나면
--   화면이 "중형" 으로 보내는데 DB 가 거절하거나, 더 나쁘게 **화면이
--   모르는 값이 DB 에 들어가** 그 업체만 규모 줄이 빕니다.
--   `build-pages.js` 의 `checkProviderAxes()` 가 **양쪽을 맞춰 봅니다** —
--   한쪽만 고치면 빌드가 멈춥니다 (`deal.js` ↔ `deal_move` 와 같은 선).
-- ⚠️ enum 을 안 쓴 까닭 — 값을 늘릴 때 `alter type` 이 필요하고 그건
--   0006 · 0015 에서 트랜잭션 때문에 걸린 자리입니다. check 제약은
--   그냥 다시 적으면 됩니다.
alter table provider drop constraint if exists provider_scale_ok;
alter table provider add constraint provider_scale_ok
  check (scale is null or scale in ('small', 'mid', 'large'));


-- ════════════════════════════════════════════════════════════════════
-- ② 직원 · 관리자가 적는 문 (0007 의 `save_provider` 를 다시 씁니다)
--
-- ⚠️⚠️ **인자를 안 늘렸습니다** — 둘 다 `p_data` 안으로 들어갑니다.
--   `approve_provider` 에 인자를 **가운데** 끼웠다가 자리로 부르던
--   쪽이 네 번째를 boolean 으로 읽어 터진 적이 있습니다 (0012).
--   `p_data` 로 받으면 `OK_ARG`(api/deal.js)도 안 바뀝니다.
-- ⚠️ 나머지 본문은 0007 그대로입니다 — 거절하는 글자까지 같습니다
--   (화면이 그 글을 그대로 보여 줍니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function save_provider(
  p_id    text,
  p_name  text,
  p_data  jsonb default '{}'::jsonb,   -- intro · regions · gu · industries · subs · since · consultHours · brands · scale
  p_why   text default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_role app_role := my_role();
  v_new  boolean;
  v_scale text := nullif(btrim(coalesce(p_data->>'scale','')), '');
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then
    raise exception '업체 등록은 직원 · 관리자만 할 수 있습니다';
  end if;

  -- ⚠️⚠️ id 는 **주소가 됩니다** (`/p/<id>`). 한글을 넣으면 주소가
  -- 퍼센트 인코딩으로 길어지고 공유할 때 깨집니다.
  if p_id is null or p_id !~ '^[a-z0-9][a-z0-9-]*$' then
    raise exception '주소가 될 값은 영문 소문자 · 숫자 · 붙임표만 됩니다 — %', coalesce(p_id,'(없음)');
  end if;
  if p_name is null or btrim(p_name) = '' then
    raise exception '업체명이 없습니다';
  end if;
  -- ⚠️⚠️ `subs`(하는 일)가 비면 **아무 분류에도 안 걸립니다.** 지역과
  -- 취급 기기는 안 적으면 "전국 · 전기종" 으로 읽는 게 말이 되지만, 하는
  -- 일을 안 적은 것을 "전부 다 합니다" 로 읽으면 수거만 하는 곳이
  -- 수리 화면에 앉습니다.
  if coalesce(jsonb_array_length(coalesce(p_data->'subs','[]'::jsonb)), 0) = 0 then
    raise exception '하는 일(하위 분야)이 비어 있습니다 — 비면 아무 분류에도 안 걸립니다';
  end if;
  -- ⚠️ 모르는 규모를 **조용히 비우지 않습니다** — 화면이 오타를 보내면
  --   그 업체만 규모 줄이 빈 채로 몇 주 갑니다.
  if v_scale is not null and v_scale not in ('small','mid','large') then
    raise exception '거래 규모는 small · mid · large 중 하나입니다 — %', v_scale;
  end if;

  v_new := not exists (select 1 from provider where id = p_id);

  insert into provider (id, name, intro, regions, gu, industries, subs,
                        since, consult_hours, brands, scale)
  values (
    p_id,
    btrim(p_name),
    nullif(btrim(coalesce(p_data->>'intro','')), ''),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'regions','[]'::jsonb)) x), '{}'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'gu','[]'::jsonb)) x), '{}'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'industries','[]'::jsonb)) x), '{}'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'subs','[]'::jsonb)) x), '{}'),
    nullif(p_data->>'since','')::int,
    nullif(btrim(coalesce(p_data->>'consultHours','')), ''),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'brands','[]'::jsonb)) x), '{}'),
    v_scale
  )
  on conflict (id) do update set
    name = excluded.name, intro = excluded.intro,
    regions = excluded.regions, gu = excluded.gu,
    industries = excluded.industries, subs = excluded.subs,
    since = excluded.since, consult_hours = excluded.consult_hours,
    brands = excluded.brands, scale = excluded.scale;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', p_id,
          case when v_new then 'created' else 'updated' end, p_why, p_data);

  return p_id;
end $$;

revoke all on function save_provider(text, text, jsonb, text) from public;
grant execute on function save_provider(text, text, jsonb, text) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ③ 업체가 **자기 줄만** 고치는 문 (0014 의 `save_provider_self`)
--
-- ⚠️⚠️ 업체가 못 건드리는 것은 그대로입니다 — 상호 · 하는 일(`subs`) ·
--   확인 배지 · 공개 · 배정 가능 · 자체 매입 · 주소(id). 하는 일을 스스로
--   넓히면 수거만 하는 곳이 수리 화면에 앉습니다.
-- ⚠️ **취급 브랜드와 거래 규모는 업체가 적습니다** — 사람이 바뀌거나
--   물량이 달라지면 그 자리에서 고칠 수 있어야 하고, 둘 다 우리가
--   확인해 주는 값이 아니라 **업체가 말하는 값**입니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function save_provider_self(
  p_data jsonb default '{}'::jsonb,   -- intro · regions · gu · industries · since · consultHours · brands · scale
  p_why  text  default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_pv   text     := my_provider();
  v_scale text    := nullif(btrim(coalesce(p_data->>'scale','')), '');
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  -- ⚠️⚠️ 역할을 요청에서 읽지 않습니다 — 토큰으로 `account` 를 보고
  --   거기 적힌 `provider_id` 만 고칩니다. 남의 업체는 애초에 못 집습니다.
  if v_role <> 'provider' or v_pv is null then
    raise exception '업체 계정으로 로그인하셔야 합니다';
  end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '연결된 업체를 찾을 수 없습니다';
  end if;
  if v_scale is not null and v_scale not in ('small','mid','large') then
    raise exception '거래 규모는 small · mid · large 중 하나입니다 — %', v_scale;
  end if;

  update provider set
    intro = nullif(btrim(coalesce(p_data->>'intro','')), ''),
    regions = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'regions','[]'::jsonb)) x), '{}'),
    gu = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'gu','[]'::jsonb)) x), '{}'),
    industries = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'industries','[]'::jsonb)) x), '{}'),
    since = nullif(p_data->>'since','')::int,
    consult_hours = nullif(btrim(coalesce(p_data->>'consultHours','')), ''),
    brands = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'brands','[]'::jsonb)) x), '{}'),
    scale = v_scale
  where id = v_pv;

  -- ⚠️ 같은 트랜잭션입니다 — 기록이 실패하면 수정도 안 됩니다 (§8).
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', v_pv, 'self-updated', p_why, p_data);

  return v_pv;
end $$;

revoke all on function save_provider_self(jsonb, text) from public;
grant execute on function save_provider_self(jsonb, text) to authenticated;


insert into schema_version (n, name) values (23, '0023_provider_axes')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0024_golf_reset.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0024 — 중고폰 찌꺼기를 걷어냅니다 (골프올인원 전환)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **운영 DB 에는 돌릴 것이 거의 없습니다.** 운영에는 0001~0007 만
--   돌아가 있고, 여기서 지우는 것들(0012 의 수익상품 씨앗 · 0020 의 기기
--   재고 · 0021 의 자체 매입 표시)은 **운영에서 한 번도 안 돈 파일**이
--   만든 것입니다. 그래서 전부 if exists 로 적었습니다 — 없으면 조용히
--   지나갑니다.
--
-- ⚠️⚠️ **번호를 다시 쓰지 않습니다.** 0012 · 0020 · 0021 파일은 그대로
--   둡니다 (돌린 기록입니다). 지우는 일은 여기 새 번호로 적습니다.
--
-- ⚠️⚠️ **provider_guard() 를 여기서 다시 씁니다.** 0021 판이 new.inhouse
--   를 보는데 그 칸을 지우기 때문입니다. 그래서 **0021 을 다시 붙여
--   넣으면 이 파일이 한 일이 통째로 되돌아갑니다** (칸도 함수도 돌아
--   옵니다). create or replace 는 에러를 안 냅니다 — 조용히 내려갑니다.
--   되돌아갔는지는 이렇게 봅니다:
--     select prosrc like '%inhouse%' from pg_proc where proname='provider_guard';
--   true 면 0021 판입니다. 이 파일을 다시 올리세요.
--
-- 지우는 것
--   ① 0012 가 심은 중고폰 수익상품 열일곱 줄 (offer)
--   ② 0020 의 기기 재고 — device · device_check · device_cost · device_move
--      와 그 문 넷, 종류 둘
--   ③ 0021 의 provider.inhouse 와 set_provider_inhouse()
-- 남기는 것 (업종과 무관합니다 — 지우면 안 됩니다)
--   · account_role_guard()  역할 올리기를 막는 자물쇠 (0021)
--   · provider_guard()      확인 배지 · 공개 여부 · 주소를 지키는 자물쇠
-- ════════════════════════════════════════════════════════════════════
begin;

-- ① 중고폰 수익상품 ------------------------------------------------
-- ⚠️ id 를 적어서 지웁니다. cats 로 지우면 나중에 같은 이름의 골프
--    분류가 생겼을 때 엉뚱한 줄이 같이 사라집니다.
delete from offer where id in (
  'ph-buyin','tab-buyin','self-buyin','bid-match','broken-buyin','part-lot',
  'fix-match','fix-data','shop-sale','lot-whole','auction-fee','corp-buyin',
  'wipe-cert','export-buyer','inspect-fee','pickup-post','access-sale'
);

-- ② 기기 재고 ------------------------------------------------------
-- ⚠️ 인자를 적지 않습니다. 손으로 적으면 **한 글자만 달라도 조용히
--    안 지워집니다** (여기서 int 와 bigint 를 틀려 겪었습니다).
--    이름이 하나뿐이라 Postgres 10 이상에서는 이름만으로 됩니다.
drop function if exists make_device;
drop function if exists add_device_cost;
drop function if exists add_device_check;
drop function if exists move_device;
-- ⚠️ 보기(view)를 먼저 지웁니다 — 표를 보고 있어서 cascade 없이는
--    안 지워집니다. cascade 를 쓰면 딸려 나가는 것이 더 있어도 조용히
--    같이 사라져서, 무엇이 지워졌는지 알 수 없습니다.
drop view if exists v_device_pl;
drop table if exists device_cost;
drop table if exists device_check;
drop table if exists device_move;
drop table if exists device;
drop type if exists device_cost_kind;
drop type if exists device_state;

-- ③ 자체 매입 표시 --------------------------------------------------
drop function if exists set_provider_inhouse;

-- ⚠️ 칸을 지우기 전에 그 칸을 보는 자물쇠를 먼저 다시 씁니다.
--    순서를 바꾸면 트리거가 없는 칸을 보고 업체 수정이 통째로 막힙니다.
create or replace function provider_guard() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if my_role() = 'admin' then return new; end if;
  if new.verified is distinct from old.verified then
    raise exception '확인 배지는 플랫폼이 서류를 확인한 뒤에만 켜집니다';
  end if;
  if new.listed is distinct from old.listed then
    raise exception '공개 여부는 관리자가 정합니다';
  end if;
  if new.id is distinct from old.id then
    raise exception '업체 주소(id)는 바꿀 수 없습니다 — 이미 색인된 주소입니다';
  end if;
  return new;
end $$;

drop index if exists provider_inhouse_idx;
alter table provider drop column if exists inhouse;

insert into schema_version (n, name) values (24, '0024_golf_reset')
on conflict (n) do nothing;

commit;
