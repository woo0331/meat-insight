-- ════════════════════════════════════════════════════════════════════
-- 0033 — 매각 지표 (2차 지시서 §9)
-- ════════════════════════════════════════════════════════════════════
-- 지시서 §9 가 적은 것은 셋입니다 — **MAU · 유효 상담 비율 ·
-- 거래액과 순매출의 분리.** 이 파일은 그것을 **세는 식 한 곳**입니다.
--
-- ⚠️⚠️⚠️ **이 숫자는 사업의 값을 매기는 데 쓰입니다.** 틀리면 손님이
--   불편한 것이 아니라 **투자자에게 거짓을 말한 것**이 됩니다. 그래서
--   이 파일은 다른 어떤 파일보다 **덜 세는 쪽으로** 기웁니다 —
--   애매하면 빼고, 뺀 것을 **따로 세어 같이 내놓습니다.**
--
-- ⚠️⚠️ **검사용 업체를 뺍니다** (0030 의 `is_test`). 섞이면 그 순간
--   없는 거래가 지표에 들어갑니다. 업체가 붙는 숫자는 전부 걸렀고,
--   `request` 에는 검사용 표시가 없어서 **검사용 업체에만 넘어간
--   요청**을 빼고 그 수를 `req_test` 로 따로 냅니다 (조용히 빼지
--   않습니다 — 빠진 것이 보여야 합니다).
--
-- ⚠️⚠️ **거래액과 순매출을 한 칸에 담지 않습니다.** 거래액은 손님이
--   업체에 낸 돈이고 **우리 돈이 아닙니다.** 두 값을 더해 "매출" 로
--   적는 순간 그건 과장입니다 (§9 가 "분리" 라고 적은 까닭).
--   ⚠️ 그리고 **플랫폼이 버는 돈 안에서도** 다시 가릅니다 —
--     · `fee_paid`  실제 입금 기록이 있는 유일한 돈 (`deal.paid`)
--     · `fee_set`   확정만 된 것 (`deal.fee_total`)
--     · `ad` · `mship`  **청구 · 입금 장치가 아직 없습니다.** 금액이
--       적혀 있을 뿐입니다. 합쳐서 "매출" 로 내면 받은 적 없는 돈을
--       받았다고 하는 것입니다 (절대 규칙 5 · 지시서 §13 가짜 정산 금지).
--   그래서 **하나로 더한 값을 일부러 내놓지 않습니다.** 더하는 것은
--   보는 사람이 뜻을 알고 할 일입니다.
--
-- ⚠️⚠️ **MAU 를 낼 수 없습니다.** 방문자를 세는 장치가 없습니다
--   (분석 도구를 안 붙였습니다). 없는 것을 추정해서 내면 그게 지어낸
--   숫자입니다 — 대신 **로그인해서 실제로 뭔가를 한 회원 수**를 내고
--   이름도 `users`(활동 회원)로 둡니다. 화면이 "방문자가 아니다" 라고
--   같이 적습니다.
--   ⚠️ 방문자 MAU 를 재시려면 분석 도구를 붙이셔야 하고, **붙이는 날
--   개인정보 처리방침에 수탁자를 같은 날 적어야 합니다** (개인정보
--   보호법 제26조 · 미국 회사면 국가도 — 제28조의8).
--
-- ⚠️⚠️ **달은 한국 시각으로 가릅니다.** Supabase 는 UTC 입니다 —
--   그냥 자르면 한국 시각 12월 1일 0시 30분에 들어온 요청이 **11월**로
--   잡힙니다. 날짜로 번호를 만들 때 겪은 것과 같은 자리입니다.
--
-- ⚠️⚠️⚠️ **앞 사업(중고폰)의 자료를 섞지 않습니다.** 1차 지시서가
--   "기존 창업 · 폐업 관련 데이터를 새로운 사업에 활용하지 않는다" 고
--   적었고, 섞으면 **골프올인원이 하지 않은 거래가 골프올인원의 실적**이
--   됩니다 — 사는 쪽에서 보면 그게 가장 큰 거짓말입니다.
--   같은 표(`request` · `deal` · `quote`)에 옛 자료가 **그대로 남아
--   있습니다** (지우지 않는 것이 맞습니다 — 손님 기록입니다). 그래서
--   세는 자리마다 `request.side = 'golf'` 로 좁힙니다.
--   ⚠️ 활동 회원도 같습니다 — **골프 요청을 한 적이 있는 회원**만 셉니다.
--     앞 사업만 쓰신 분이 골프의 MAU 로 잡히면 안 됩니다.
--
-- ⚠️ 운영자만 부릅니다. 지표에는 손님 성함 · 연락처가 없지만, 거래액과
--   수수료는 **밖에 나가면 안 되는 숫자**입니다.
-- ════════════════════════════════════════════════════════════════════
begin;

-- ⚠️ 달 경계를 **한 함수**에 둡니다 — 여기저기 적으면 한쪽만 고쳐서
--   어떤 지표는 UTC 로, 어떤 지표는 KST 로 잘리는 날이 옵니다.
create or replace function kst_month(t timestamptz) returns text
  language sql immutable set search_path = public as $$
  select to_char(date_trunc('month', t at time zone 'Asia/Seoul'), 'YYYY-MM')
$$;

create or replace function kst_month(d date) returns text
  language sql immutable set search_path = public as $$
  select to_char(date_trunc('month', d::timestamp), 'YYYY-MM')
$$;

-- ════════════════════════════════════════════════════════════════════
-- 지표 — 달마다 한 줄
--
-- 인자는 `jsonb` 하나입니다 (⚠️ 자리가 어긋나면 엉뚱한 값이 엉뚱한
-- 칸에 들어갑니다 — 0027 · 0029 와 같은 규칙).
--     { "from": "2026-01", "to": "2026-12" }
-- 안 주시면 **이달까지 열두 달**입니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function biz_metrics(p jsonb default '{}'::jsonb)
  returns jsonb language plpgsql stable security definer
  set search_path = public as $$
declare
  v_to    text := nullif(btrim(coalesce(p->>'to', '')), '');
  v_from  text := nullif(btrim(coalesce(p->>'from', '')), '');
  d_to    date;
  d_from  date;
  v_rows  jsonb;
begin
  if my_role() not in ('staff','admin') then
    raise exception '지표는 직원 · 관리자만 볼 수 있습니다';
  end if;

  -- ⚠️ 오늘도 **한국 시각**입니다.
  d_to := date_trunc('month',
            coalesce(to_date(v_to, 'YYYY-MM'),
                     (now() at time zone 'Asia/Seoul')::date))::date;
  d_from := date_trunc('month',
              coalesce(to_date(v_from, 'YYYY-MM'),
                       d_to - interval '11 months'))::date;
  if d_from > d_to then
    raise exception '시작 달이 끝 달보다 뒤입니다';
  end if;
  -- ⚠️ 너무 넓게 열어 두면 한 번에 수십 년을 셉니다 — 다섯 해까지.
  if d_to > d_from + interval '5 years' then
    raise exception '한 번에 다섯 해까지만 셀 수 있습니다';
  end if;

  with
  months as (
    select to_char(m, 'YYYY-MM') as ym
      from generate_series(d_from, d_to, interval '1 month') as g(m)
  ),
  -- 검사용 업체에만 넘어간 요청 — ⚠️ **빼되 세어 둡니다**
  req_test as (
    select r.id
      from request r
     where exists (select 1 from assignment a join provider p on p.id = a.provider_id
                    where a.request_id = r.id and p.is_test)
       and not exists (select 1 from assignment a join provider p on p.id = a.provider_id
                        where a.request_id = r.id and not p.is_test)
  ),
  req as (
    select kst_month(r.created_at) as ym,
           count(*) filter (where t.id is null) as req,
           count(*) filter (where t.id is not null) as req_test
      from request r left join req_test t on t.id = r.id
     where r.side = 'golf'
     group by 1
  ),
  -- ⚠️ 배정 · 수락은 **배정 줄**이 아니라 **요청** 단위로 셉니다.
  --   한 요청을 업체 셋에 넘겼다고 유효 상담이 셋이 되면 안 됩니다.
  asg as (
    select kst_month(r.created_at) as ym,
           count(distinct a.request_id) as assigned,
           count(distinct a.request_id) filter (where a.state = 'accepted') as accepted
      from assignment a
      join provider p on p.id = a.provider_id and not p.is_test
      join request  r on r.id = a.request_id and r.side = 'golf'
     group by 1
  ),
  -- ⚠️ 거둔 견적도 셉니다 — "업체가 금액을 적어 냈다" 는 사실은 남습니다.
  qt as (
    select kst_month(r.created_at) as ym,
           count(distinct q.request_id) as quoted
      from quote q
      join provider p on p.id = q.provider_id and not p.is_test
      join request  r on r.id = q.request_id and r.side = 'golf'
     group by 1
  ),
  -- 계약 — ⚠️ **계약일 기준**입니다 (요청이 들어온 달이 아닙니다).
  --   ⚠️ 금액이 빈 계약은 거래액에 0 으로 더하지 않고 **따로 셉니다.**
  dl as (
    select kst_month(d.signed_at) as ym,
           count(*) as deals,
           coalesce(sum(d.amount), 0) as gmv,
           count(*) filter (where d.amount is null) as gmv_missing
      from deal d
      join provider p on p.id = d.provider_id and not p.is_test
      join request  r on r.id = d.request_id and r.side = 'golf'
     where d.signed_at is not null
     group by 1
  ),
  fee_set as (
    select kst_month(d.fee_at) as ym, coalesce(sum(d.fee_total), 0) as fee_set
      from deal d
      join provider p on p.id = d.provider_id and not p.is_test
      join request  r on r.id = d.request_id and r.side = 'golf'
     where d.fee_at is not null
     group by 1
  ),
  fee_paid as (
    select kst_month(d.paid_at) as ym, coalesce(sum(d.paid), 0) as fee_paid
      from deal d
      join provider p on p.id = d.provider_id and not p.is_test
      join request  r on r.id = d.request_id and r.side = 'golf'
     where d.paid_at is not null
     group by 1
  ),
  -- 광고 — ⚠️ **집행 시작 달**로 잡습니다. 기간이 여러 달에 걸쳐도
  --   쪼개지 않습니다 (쪼개면 받은 적 없는 돈을 달마다 나눠 적는 셈).
  --   ⚠️ `draft` 는 뺍니다 — 아직 집행이 아닙니다.
  ad as (
    select kst_month(a.starts_on) as ym, coalesce(sum(a.price), 0) as ad
      from ad_run a
      join provider p on p.id = a.provider_id and not p.is_test
     where a.state <> 'draft'
     group by 1
  ),
  -- 멤버십 — 그달에 **살아 있던** 것의 월정액 합
  mship as (
    select m.ym, coalesce(sum(pl.monthly), 0) as mship
      from months m
      join provider_membership pm on true
      join provider p  on p.id = pm.provider_id and not p.is_test
      join membership_plan pl on pl.id = pm.plan_id
     where kst_month(pm.starts_on) <= m.ym
       and (pm.ends_on is null or kst_month(pm.ends_on) >= m.ym)
     group by m.ym
  ),
  -- 활동 회원 — ⚠️⚠️ **일반 회원만** 셉니다.
  --   운영자를 넣으면 **우리가 누른 것이 MAU 가 됩니다.** 업체를 넣으면
  --   손님 수와 업체 수가 한 칸에 섞여, 손님이 늘지 않아도 업체를
  --   모집하면 숫자가 오릅니다 — 둘은 다른 뜻입니다.
  --   ⚠️ `not in ('staff','admin')` 이 아니라 `= 'customer'` 입니다.
  --     역할이 하나 더 생기는 날 조용히 섞이지 않게.
  --   ⚠️⚠️ 그리고 **골프 요청을 한 적이 있는 회원**만입니다 — 앞 사업만
  --     쓰신 분의 기록이 골프의 MAU 로 잡히면 안 됩니다 (머리말 참고).
  golf_user as (
    select distinct user_id from request
     where side = 'golf' and user_id is not null
  ),
  usr as (
    select kst_month(l.at) as ym, count(distinct l.by_user) as users
      from audit_log l
      join account ac on ac.id = l.by_user
      join golf_user g on g.user_id = l.by_user
     where l.by_user is not null
       and ac.role = 'customer'
     group by 1
  )
  select jsonb_agg(x order by x->>'month')
    into v_rows
    from (
      select jsonb_build_object(
        'month',       m.ym,
        'req',         coalesce(req.req, 0),
        'req_test',    coalesce(req.req_test, 0),
        'assigned',    coalesce(asg.assigned, 0),
        'accepted',    coalesce(asg.accepted, 0),
        -- ⚠️⚠️ **분모가 0 이면 비율을 내지 않습니다** ("0%" 는 비율이
        --   아닙니다). null 로 내고 화면이 "—" 를 찍습니다.
        'rate_valid',  case when coalesce(req.req, 0) = 0 then null
                            else round(coalesce(asg.accepted, 0) * 100.0
                                       / req.req, 1) end,
        'quoted',      coalesce(qt.quoted, 0),
        'deals',       coalesce(dl.deals, 0),
        'gmv',         coalesce(dl.gmv, 0),
        'gmv_missing', coalesce(dl.gmv_missing, 0),
        'fee_paid',    coalesce(fee_paid.fee_paid, 0),
        'fee_set',     coalesce(fee_set.fee_set, 0),
        -- ⚠️ 음수가 나올 수 있습니다 (지난달 확정분이 이달에 입금).
        --   0 으로 깎지 않습니다 — 깎으면 그 돈이 어디로 갔는지 사라집니다.
        'fee_due',     coalesce(fee_set.fee_set, 0) - coalesce(fee_paid.fee_paid, 0),
        'ad',          coalesce(ad.ad, 0),
        'mship',       coalesce(mship.mship, 0),
        'users',       coalesce(usr.users, 0)
      ) as x
      from months m
      left join req      on req.ym      = m.ym
      left join asg      on asg.ym      = m.ym
      left join qt       on qt.ym       = m.ym
      left join dl       on dl.ym       = m.ym
      left join fee_set  on fee_set.ym  = m.ym
      left join fee_paid on fee_paid.ym = m.ym
      left join ad       on ad.ym       = m.ym
      left join mship    on mship.ym    = m.ym
      left join usr      on usr.ym      = m.ym
    ) t;

  return jsonb_build_object(
    'from',   to_char(d_from, 'YYYY-MM'),
    'to',     to_char(d_to,   'YYYY-MM'),
    'months', coalesce(v_rows, '[]'::jsonb),
    -- ⚠️⚠️ **못 재는 것을 같이 내놓습니다.** 화면이 이것을 그대로
    --   찍어서, 숫자를 보는 사람이 **무엇이 빠졌는지** 같이 읽습니다.
    'cannot', jsonb_build_array(
      '방문자 기준 MAU — 방문을 세는 장치가 없습니다. ' ||
      '붙이시는 날 개인정보 처리방침에 수탁자를 같은 날 적어야 합니다.',
      '광고 · 멤버십의 입금 — 청구 · 입금 기록을 두는 표가 아직 없습니다. ' ||
      '금액은 적어 둔 값이고 받은 돈이 아닙니다.',
      '재방문 · 이탈 — 같은 사람이 다시 왔는지 알 길이 없습니다 (로그인 전 접수).'
    )
  );
end $$;

revoke all on function biz_metrics(jsonb) from public;
grant execute on function biz_metrics(jsonb) to authenticated;

insert into schema_version (n, name) values (33, '0033_biz_metrics')
on conflict (n) do nothing;

commit;
