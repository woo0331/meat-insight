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
create type deal_state as enum (
  'new', 'check', 'assigned', 'accepted', 'consult', 'quoted',
  'nego', 'signed', 'done', 'lost', 'fee_wait', 'fee_done'
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
