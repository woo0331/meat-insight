/* ════════════════════════════════════════════════════════════════════
   수수료 정책 · 광고 · 멤버십 관리 — /admin 의 한 자리 (2차 지시서 §7)

   ⚠️⚠️ **표를 직접 고치지 않습니다.** 쓰는 길은 DB 의 문뿐입니다 —
     save_fee_policy · set_fee_policy_active   (0007)
     save_plan · set_ad_state                  (0026)
     save_ad · set_membership                  (0036)
   문마다 **까닭을 받고** 감사 기록과 한 트랜잭션입니다 (§8).

   ⚠️⚠️⚠️ **돈이 오갔다고 말하지 않습니다.** 광고 금액과 멤버십
   월정액은 **적어 둔 값**이고 청구 · 입금 기록이 아닙니다 — 그래서
   화면이 그 옆에 그렇게 적습니다. 매각 지표(0033)도 같은 말로 갈라
   놓았습니다. 둘이 다른 말을 하면 그게 거짓이 됩니다.

   ⚠️ 요금제가 0건이면 **0건이라고 말합니다** (절대 규칙 1). 흔히
   보이는 요금제를 미리 넣어 두지 않습니다 — 넣는 순간 정하지 않은
   값이 손님 쪽으로 갈 길이 생깁니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("bizbox");
  if(!box || !window.amAuthAsk) return;

  var A = null;
  var TAB = "fee";       /* fee · ad · plan */

  function why(err){
    var w = String((err && err.message) || "");
    try{ w = JSON.parse(w).message || w; }catch(_){}
    return w || "하지 못했습니다.";
  }
  function rpc(name, args){
    return fetch(A.conf.url + "/rest/v1/rpc/" + name, {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json",
                               apikey: A.conf.anonKey }, window.amAuthHeaders()),
      body: JSON.stringify(args || {})
    }).then(function(r){
      if(!r.ok) return r.text().then(function(t){ throw new Error(t || ("HTTP " + r.status)); });
      return r.text().then(function(t){ try{ return JSON.parse(t); }catch(_){ return t; } });
    });
  }
  function get(q){
    return fetch(A.conf.url + "/rest/v1/" + q, {
      headers: Object.assign({ apikey: A.conf.anonKey }, window.amAuthHeaders())
    }).then(function(r){ return r.ok ? r.json().catch(function(){ return null; }) : null; })
      .catch(function(){ return null; });
  }

  /* ⚠️⚠️⚠️ **자리 넷은 `js/data/deal.js` 한 곳입니다** (2026-11-06) —
     전에는 여기만 들고 있었는데, 손님 화면에 광고를 그리는
     `js/adslot.js` 가 생기면서 **같은 키를 두 곳이** 들게 됐습니다.
     한쪽만 고치는 날 운영자가 고른 자리와 손님 화면이 찾는 자리가
     어긋나고, 그러면 광고가 **에러 없이 조용히 안 보입니다**. */
  var AD_PLACE = window.AM_AD_PLACE || [];
  /* ⚠️⚠️⚠️ **상태 다섯 가운데 둘이 DB 에 없는 값이었습니다** (2026-11-06) —
     여기 `paused` · `void` 가 적혀 있었는데 0026 의 `ad_state` enum 은
     `draft · live · done · stopped` 넷입니다. 그래서 그 두 단추는
     **누르면 DB 가 거절**했고(단추는 보이고 DB 가 거절하는 그 자리),
     정작 **멈추는 값(`stopped`)은 단추가 없었습니다** — 집행 중인 광고를
     멈출 길이 화면에 없었습니다. 지금은 `check-deal` 이 enum 과 맞춰
     봅니다. */
  var AD_ST = window.AM_AD_STATE || [];
  function pick(list, k){
    for(var i = 0; i < list.length; i++) if(list[i].key === k) return list[i];
    return null;
  }
  function placeName(k){ var x = pick(AD_PLACE, k); return x ? x.name : String(k || ""); }
  /* ⚠️ 모르는 키는 키 그대로 — 잘못 들어간 값이 눈에 보이게 */
  function catName(k){
    var c = window.amCat ? window.amCat(k) : null;
    return (c && c.name) ? c.name : String(k || "");
  }
  function rgName(k){
    var r = window.amRegion ? window.amRegion(k) : null;
    return (r && r.name) ? r.name : String(k || "");
  }
  function adSt(k){ return pick(AD_ST, k) || { name:String(k || ""), tone:"ink" }; }

  function load(){
    return Promise.all([
      get("provider?select=id,name,is_test&order=name.asc&limit=200"),
      get("fee_policy?select=id,provider_id,type,flat,rate,min_fee,max_fee,vat," +
          "confirm_when,cycle,refund_rule,from_date,to_date,active&limit=200"),
      /* ⚠️⚠️⚠️ **보기로 읽습니다** (`v_ad_board` · 0064) — 전에는 `ad_run`
         표를 바로 읽었습니다. 보기가 **계약액 · 청구 · 수납 · 환불 ·
         실매출 · 노출 · 클릭**을 한 줄로 내주므로, 화면이 다시 셈하지
         않습니다 (두 곳에서 세면 어긋나고, 어긋나면 어느 쪽이 참인지 알
         수 없습니다). ⚠️ 그 보기의 `where` 절이 **자물쇠 그 자체**라
         운영자가 아니면 0줄입니다 (보기는 RLS 를 지나지 않습니다). */
      get("v_ad_board?select=id,provider_id,provider_name,advertiser,place," +
          "cat_key,region,starts_on,ends_on,price,state,note,click_url," +
          "img_pc,img_mo,img_alt,billed,paid,refunded,net,views,clicks" +
          "&order=starts_on.desc&limit=100"),
      get("membership_plan?select=id,name,monthly,listed,ord&order=ord.asc&limit=50"),
      get("provider_membership?select=provider_id,plan_id,starts_on,ends_on&limit=200"),
      /* 후기 (0037) — ⚠️ 운영자는 **가려진 것까지** 봅니다 (rv_staff).
         ⚠️⚠️ **작성자 성함 · by_user 를 청하지 않습니다.** 가릴지 말지는
         글을 보고 정하는 일이고, 누가 썼는지는 그 판단에 필요하지
         않습니다 — 청하면 그 화면을 보는 사람 모두가 보게 됩니다. */
      get("review?select=id,provider_id,rating,body,created_at,updated_at," +
          "reply,reply_at,hidden_at,hidden_why&order=created_at.desc&limit=200"),
      /* ⚠️ 0064 — 돈 기록 줄. ⚠️⚠️ **합계는 안 받습니다** — 합계는 위
         보기가 셉니다. 여기 줄은 "언제 얼마가 어떻게" 를 보여 주고
         잘못 적은 줄을 뺄 수 있게 하려고 받습니다. */
      get("ad_bill?select=id,ad_id,kind,amount,on_day,memo&order=on_day.desc&limit=300")
    ]);
  }

  function tabs(){
    return '<div class="bz-tabs" role="tablist">' +
      [["fee","수수료 정책"],["ad","광고 집행"],["plan","멤버십"],
       ["rv","후기"]].map(function(t){
        return '<button type="button" class="btn btn-sm ' +
          (TAB === t[0] ? "btn-pri" : "btn-line") + '" data-tab="' + t[0] + '" ' +
          'role="tab" aria-selected="' + (TAB === t[0] ? "true" : "false") + '">' +
          esc(t[1]) + '</button>';
      }).join("") + '</div>';
  }

  function provOptions(provs, sel){
    return provs.map(function(p){
      return '<option value="' + esc(p.id) + '"' +
        (p.id === sel ? " selected" : "") + '>' + esc(p.name) +
        (p.is_test ? " — 검사용" : "") + '</option>';
    }).join("");
  }

  /* ── 수수료 정책 ─────────────────────────────────────────────── */
  function feeView(provs, pols){
    var byId = {};
    provs.forEach(function(p){ byId[p.id] = p; });
    return '<p class="myhint">⚠️ 수수료 정책은 <b>업체마다</b> 답니다. ' +
      '고치면 <b>지난 계약의 수수료는 안 바뀝니다</b> — 계약에 그때의 ' +
      '정책 사본이 박혀 있습니다 (0001).</p>' +
      (pols.length
        ? '<ul class="fe-p">' + pols.map(function(f){
            var p = byId[f.provider_id];
            return '<li><b>' + esc(p ? p.name : f.provider_id) + '</b>' +
              (f.active ? '' : ' <span class="as-t">꺼짐</span>') +
              '<p class="fe-r">' + esc(window.amFeeLine(f)) + '</p>' +
              (f.refund_rule ? '<p class="fe-r">' + esc(f.refund_rule) + '</p>' : "") +
              '<div class="dk-b"><button class="btn btn-sm btn-line" ' +
              'data-feetoggle="' + esc(f.id) + '" data-on="' + (f.active ? "1" : "0") +
              '">' + (f.active ? "끄기" : "켜기") + '</button></div></li>';
          }).join("") + '</ul>'
        /* ⚠️ 0건은 고장이 아닙니다 — 지어낸 값이 아니라고 말합니다 */
        : '<p class="myhint">아직 등록된 수수료 정책이 없습니다. ' +
          '지어낸 값이 아닙니다.</p>') +
      '<h3 class="rq-h">정책 더하기</h3>' +
      '<form class="jform bz-f" data-kind="fee">' +
        '<div class="jrow"><label for="bf-pv">업체 <b>*</b></label>' +
        '<select id="bf-pv" name="provider" required>' +
        '<option value="">고르십니다</option>' + provOptions(provs) + '</select></div>' +
        '<div class="jrow"><label for="bf-type">수익모델 <b>*</b></label>' +
        '<select id="bf-type" name="type">' +
          (window.AM_FEE_TYPE || []).map(function(x){
            return '<option value="' + esc(x.key) + '">' + esc(x.name) + '</option>';
          }).join("") + '</select></div>' +
        '<div class="jrow"><label for="bf-flat">정액 (원)</label>' +
        '<input id="bf-flat" name="flat" inputmode="numeric"></div>' +
        '<div class="jrow"><label for="bf-rate">요율 (%)</label>' +
        '<input id="bf-rate" name="rate" inputmode="decimal" placeholder="예: 8"></div>' +
        '<div class="jrow"><label for="bf-min">최저 수수료 (원)</label>' +
        '<input id="bf-min" name="min_fee" inputmode="numeric"></div>' +
        '<div class="jrow"><label for="bf-max">최고 수수료 (원)</label>' +
        '<input id="bf-max" name="max_fee" inputmode="numeric"></div>' +
        '<div class="jrow"><label for="bf-vat">부가세</label>' +
        '<select id="bf-vat" name="vat">' +
          (window.AM_VAT || []).map(function(x){
            return '<option value="' + esc(x.key) + '">' + esc(x.name) + '</option>';
          }).join("") + '</select></div>' +
        '<div class="jrow"><label for="bf-when">확정 시점</label>' +
        '<select id="bf-when" name="confirm_when">' +
          (window.AM_FEE_WHEN || []).map(function(x){
            return '<option value="' + esc(x.key) + '">' + esc(x.name) + '</option>';
          }).join("") + '</select></div>' +
        '<div class="jrow"><label for="bf-cycle">지급 주기</label>' +
        '<select id="bf-cycle" name="cycle">' +
          (window.AM_FEE_CYCLE || []).map(function(x){
            return '<option value="' + esc(x.key) + '">' + esc(x.name) + '</option>';
          }).join("") + '</select></div>' +
        '<div class="jrow jrow-full"><label for="bf-refund">취소 · 환수 조건</label>' +
        '<textarea id="bf-refund" name="refund_rule" rows="2" maxlength="500"></textarea></div>' +
        '<div class="jrow jrow-full"><label for="bf-why">까닭 <b>*</b></label>' +
        '<input id="bf-why" name="whyText" required maxlength="200" ' +
        'placeholder="기록에 남습니다"></div>' +
        '<button class="btn btn-pt" type="submit">정책 저장</button>' +
      '</form>';
  }

  /* ── 광고 집행 ───────────────────────────────────────────────── */
  /* ⚠️ 0064 — 광고 소재를 올릴 수 있는가 (공개 버킷이 설정됐나).
     ⚠️⚠️ **꺼져 있으면 그 칸을 아예 안 그립니다** — 그리면 눌러도
     거절되는 칸입니다 (절대 규칙 5 · `js/deskphoto.js` 와 같은 규칙). */
  var AD_IMG = false;
  var AD_MIME = ["image/jpeg", "image/png", "image/webp"];
  var AD_MAX  = 2097152;          /* ⚠️ 0064 의 `claim_ad_image` 와 같은 값 */

  function adBill(k){ return window.amAdBill ? window.amAdBill(k) : { name:k, tone:"ink" }; }

  /* 소재 미리보기 — ⚠️⚠️ **관리자 화면에서는 0건이면 점선 자리를 냅니다**
     (지시서 B — "관리자 미리보기에서는 점선 자리 표시"). 손님 화면은
     **반대로** 줄째 가립니다 (`js/adslot.js`) — 빈 액자를 손님에게
     보이면 미완성 사이트로 읽힙니다. 두 화면이 달라야 맞는 자리입니다. */
  function adShot(a, kind){
    var path = kind === "pc" ? a.img_pc : a.img_mo;
    var sz   = window.amAdSize ? window.amAdSize(a.place) : null;
    var want = sz ? (kind === "pc" ? sz.pc : sz.mo) : "";
    var head = '<b class="adm-k">' + esc(kind === "pc" ? "PC 소재" : "모바일 소재") +
      (want ? ' <i class="adm-sz">권장 ' + esc(want) + '</i>' : "") + '</b>';
    var body;
    if(path && A && A.conf && A.conf.pubBucket){
      body = '<img class="adm-im" src="' +
        esc(A.conf.url + "/storage/v1/object/public/" + A.conf.pubBucket + "/" + path) +
        '" alt="' + esc((a.advertiser || a.provider_name || "") + " " +
          (kind === "pc" ? "PC" : "모바일") + " 소재") + '" loading="lazy">' +
        '<button class="btn btn-sm btn-bad" data-addropimg="' + esc(kind) +
        '" data-ad="' + esc(a.id) + '">이 소재 빼기</button>';
    }else{
      body = '<p class="adm-none">아직 올린 소재가 없습니다.</p>';
    }
    /* ⚠️ 버킷이 꺼져 있으면 **올리는 칸을 안 냅니다** (위 머리말) */
    var up = AD_IMG
      ? '<label class="adm-up"><span class="btn btn-sm btn-line">' +
          (window.icon ? window.icon("camera", 16) : "") + ' 소재 올리기</span>' +
        '<input class="adm-f" type="file" accept="image/jpeg,image/png,image/webp" ' +
          'data-adup="' + esc(kind) + '" data-ad="' + esc(a.id) + '"></label>'
      : "";
    return '<div class="adm-shot' + (path ? " adm-on" : "") + '">' + head + body + up + '</div>';
  }

  /* 돈 한 줄 — ⚠️⚠️ **계약액과 실매출을 갈라서** 적습니다 (지시서 B).
     셈은 보기(`v_ad_board`)가 합니다 — 여기서 다시 세지 않습니다.
     ⚠️⚠️ **아직 아무 돈도 안 오갔으면 0원 줄 넷을 안 찍습니다** —
     찍어 보니 준비 상태인 광고에 "청구 0원 · 수납 0원 · 환불 0원 ·
     실매출 0원" 과 설명까지 붙어 **읽을 것이 없는데 자리만** 찼습니다
     (절대 규칙 2 — 값이 없는 항목은 줄째 뺍니다). 가로로 밀리지도 ·
     글자가 작지도 않아 어떤 검사도 안 잡습니다 — 찍어 보고 알았습니다.
     ⚠️ **계약액은 0원이어도 찍습니다** — 무상 광고라는 뜻이고, 안 적은
     것과 다릅니다. */
  function adMoney(a){
    var moved = (Number(a.billed) || 0) + (Number(a.paid) || 0) +
                (Number(a.refunded) || 0);
    if(!moved)
      return '<div class="adm-m"><dl class="adm-dl">' +
        '<dt>계약액</dt><dd>' + esc(won(a.price)) + '원</dd></dl>' +
        '<p class="myhint">아직 오간 돈이 없습니다 — 아래에서 ' +
        '<b>청구 · 수납 · 환불</b>을 한 줄씩 적으십니다.</p></div>';
    return '<div class="adm-m"><dl class="adm-dl">' +
      '<dt>계약액</dt><dd>' + esc(won(a.price)) + '원</dd>' +
      '<dt>청구</dt><dd>' + esc(won(a.billed)) + '원</dd>' +
      '<dt>수납</dt><dd>' + esc(won(a.paid)) + '원</dd>' +
      '<dt>환불</dt><dd>' + esc(won(a.refunded)) + '원</dd>' +
      '<dt class="adm-net">실매출</dt><dd class="adm-net">' +
        esc(won(a.net)) + '원</dd>' +
      '</dl><p class="myhint">⚠️ <b>계약액</b>은 적어 둔 값이고, ' +
      '<b>실매출</b>은 <b>수납 − 환불</b>입니다. 같지 않으면 아직 ' +
      '안 받은 돈이 있습니다.</p></div>';
  }

  /* 노출 · 클릭 — ⚠️⚠️⚠️ **브라우저가 보낸 것을 센 값**입니다.
     비로그인 손님도 세므로 봇 · 중복이 섞입니다 — 그 사실을 **그 자리에서**
     말하고 청구 근거로 쓰지 말라고 적습니다. 숨기고 "노출 수" 라고만
     적으면 그건 지어낸 숫자입니다 (절대 규칙 1).
     ⚠️⚠️ **0건이면 그 경고를 안 찍습니다** — 셀 것이 없는데 "봇이 섞입니다"
     를 적으면 그건 치우지 못하는 잔소리입니다 (절대 규칙 2). */
  function adStat(a){
    var v = Number(a.views) || 0, c = Number(a.clicks) || 0;
    if(!v && !c)
      return '<p class="adm-st adm-st0">아직 노출 · 클릭이 0건입니다.</p>';
    /* ⚠️ **분모가 0 이면 비율을 내지 않습니다** ("0%" 는 비율이 아닙니다) */
    var rate = v > 0 ? (Math.round(c / v * 1000) / 10) + "%" : "";
    return '<p class="adm-st">노출 <b>' + esc(won(v)) + '</b> · 클릭 <b>' +
      esc(won(c)) + '</b>' + (rate ? ' · 클릭률 <b>' + esc(rate) + '</b>' : "") +
      '</p><p class="myhint">⚠️ 이 수는 <b>브라우저가 보낸 것을 센 값</b>' +
      '입니다 — 비로그인 손님도 세므로 <b>봇 · 중복이 섞입니다</b>. ' +
      '<b>청구 근거로 쓰지 마세요.</b></p>';
  }

  function adView(provs, ads, bills){
    var byAd = {};
    (bills || []).forEach(function(b){
      (byAd[b.ad_id] = byAd[b.ad_id] || []).push(b);
    });
    return '<p class="myhint">⚠️ <b>계약액</b>은 적어 둔 값입니다 — ' +
      '실제로 오간 돈은 아래 <b>청구 · 수납 · 환불</b> 줄입니다 ' +
      '(매각 지표도 그렇게 갈라 놓았습니다). 새로 넣으면 <b>준비</b> ' +
      '상태입니다 (바로 안 뜹니다).</p>' +
      (AD_IMG ? "" : '<p class="myhint">⚠️ <b>PROVIDER_BUCKET</b> 이 아직 ' +
        '없어 소재를 올리는 칸을 내지 않았습니다 — 그 전까지 광고는 ' +
        '<b>광고주 이름만</b> 띄웁니다.</p>') +
      (ads.length
        ? '<ul class="fe-p adm-l">' + ads.map(function(a){
            var st = adSt(a.state);
            var L = byAd[a.id] || [];
            return '<li><b>' + esc(a.advertiser || a.provider_name || a.provider_id) +
              '</b> ' +
              '<span class="dk-st dk-' + esc(st.tone) + '">' + esc(st.name) + '</span>' +
              (a.advertiser
                ? '<p class="fe-r">업체 ' + esc(a.provider_name || a.provider_id) + '</p>'
                : "") +
              '<p class="fe-r">' + esc(placeName(a.place)) +
              /* ⚠️ 키가 아니라 **이름**으로 보여 줍니다 — 운영자가
                 `lesson` · `seoul` 을 보고 맞는지 가릴 수는 없습니다.
                 ⚠️ 모르는 키면 **키 그대로** 냅니다 (지어내지 않습니다 —
                 그래야 잘못 들어간 값이 눈에 보입니다). */
              (a.cat_key ? " · " + esc(catName(a.cat_key)) : "") +
              (a.region ? " · " + esc(rgName(a.region)) : "") +
              ' · ' + esc(a.starts_on + " ~ " + a.ends_on) + '</p>' +
              /* ⚠️⚠️ 클릭 주소를 **그대로 보여 줍니다** — 어디로 가는지
                 운영자가 눈으로 봐야 합니다. 링크로 걸지 않습니다
                 (운영자 화면에서 바깥으로 나가는 길을 만들지 않습니다). */
              (a.click_url
                ? '<p class="fe-r adm-u">클릭 → <code>' + esc(a.click_url) + '</code></p>'
                : '<p class="fe-r adm-u">클릭 → 업체 화면(<code>/pro/' +
                  esc(a.provider_id) + '</code>)</p>') +
              /* ⚠️⚠️ **상태 단추를 상태 딸지 바로 아래에** 둡니다 —
                 찍어 보니 돈 양식 뒤에 있어서, 광고 한 줄이 6,000px 일 때
                 집행을 멈추려면 **한 화면을 다 밀어 내려가야** 했습니다.
                 가로로 밀리지도 · 글자가 작지도 · 대비가 낮지도 않아 **어떤
                 검사도 안 잡습니다** — 찍어 보고 알았습니다. */
              '<div class="dk-b">' +
                /* ⚠️ 갈 수 있는 상태를 **목록에서** 끌어옵니다 — 여기
                   글자로 박아 두었다가 DB 에 없는 값을 두 개나 내고
                   있었습니다 (위 머리말). `draft` 는 되돌릴 자리가
                   아니므로 뺍니다(새로 넣으면 그 상태입니다). */
                AD_ST.map(function(x){ return x.key; })
                     .filter(function(k){ return k !== "draft"; })
                     .map(function(k){
                  /* ⚠️ 지금 상태로 가는 단추는 안 냅니다 (눌러도 아무
                     일이 안 나는 단추가 됩니다 — 절대 규칙 5). */
                  if(k === a.state) return "";
                  return '<button class="btn btn-sm btn-line" data-adto="' + esc(k) +
                    '" data-ad="' + esc(a.id) + '">' + esc(adSt(k).name) + '</button>';
                }).join("") +
              '</div>' +
              '<div class="adm-shots">' + adShot(a, "pc") + adShot(a, "mo") + '</div>' +
              adMoney(a) + adStat(a) +
              (L.length
                ? '<ul class="adm-bl">' + L.map(function(b){
                    var k = adBill(b.kind);
                    return '<li><span class="dk-st dk-' + esc(k.tone) + '">' +
                      esc(k.name) + '</span> ' + esc(won(b.amount)) + '원 · ' +
                      esc(b.on_day) + (b.memo ? ' · ' + esc(b.memo) : "") +
                      ' <button class="btn btn-sm btn-bad" data-adbilldrop="' +
                      esc(b.id) + '">빼기</button></li>';
                  }).join("") + '</ul>'
                /* ⚠️ **같은 말을 두 번 안 적습니다** — 아무 돈도 안 오갔으면
                   위의 돈 칸이 이미 "아직 오간 돈이 없습니다" 라고 말했습니다.
                   찍어 보니 "아직 …" 으로 시작하는 줄이 셋이 연달아 있었습니다. */
                : '') +
              /* ⚠️⚠️ **돈 양식은 눌러야 열립니다.** 광고마다 양식을 펼쳐
                 두었더니 광고 둘에 화면이 **5,970px** 이었습니다 — 스무 건이면
                 운영자가 목록을 훑을 수가 없습니다(폰 360px 에서 겪은
                 "밀면 보이는 것은 보이는 것이 아닙니다" 의 세로판입니다).
                 ⚠️ `<details>` 는 안 씁니다 — 접힌 글은 `check-screens` 의
                 12px · 대비 검사에서 빠져 아무도 안 재는 자리가 됩니다.
                 `hidden` 을 켜고 끄면 재는 쪽이 그대로 봅니다. */
              '<div class="dk-b"><button class="btn btn-sm btn-line" ' +
                'data-adbillopen="' + esc(a.id) + '">돈 기록 적기</button></div>' +
              '<form class="jform bz-f adm-bf" data-kind="adbill" ' +
                'data-adbillform="' + esc(a.id) + '" hidden>' +
                '<input type="hidden" name="adId" value="' + esc(a.id) + '">' +
                '<div class="jrow"><label for="bb-k-' + esc(a.id) + '">갈래 <b>*</b></label>' +
                '<select id="bb-k-' + esc(a.id) + '" name="billKind">' +
                  (window.AM_AD_BILL || []).map(function(x){
                    return '<option value="' + esc(x.key) + '">' + esc(x.name) + '</option>';
                  }).join("") + '</select></div>' +
                '<div class="jrow"><label for="bb-a-' + esc(a.id) + '">금액 (원) <b>*</b></label>' +
                '<input id="bb-a-' + esc(a.id) + '" name="amount" inputmode="numeric" required></div>' +
                '<div class="jrow"><label for="bb-d-' + esc(a.id) + '">날짜</label>' +
                '<input id="bb-d-' + esc(a.id) + '" name="onDay" type="date"></div>' +
                '<div class="jrow"><label for="bb-m-' + esc(a.id) + '">메모</label>' +
                '<input id="bb-m-' + esc(a.id) + '" name="memo" maxlength="200"></div>' +
                '<div class="jrow"><label for="bb-w-' + esc(a.id) + '">까닭 <b>*</b></label>' +
                '<input id="bb-w-' + esc(a.id) + '" name="whyText" required maxlength="200"></div>' +
                '<button class="btn btn-pt btn-sm" type="submit">돈 기록 더하기</button>' +
              '</form>' +
              '</li>';
          }).join("") + '</ul>'
        : '<p class="myhint">아직 집행한 광고가 없습니다.</p>') +
      '<h3 class="rq-h">광고 더하기</h3>' +
      '<form class="jform bz-f" data-kind="ad">' +
        '<div class="jrow"><label for="ba-pv">업체 <b>*</b></label>' +
        '<select id="ba-pv" name="provider" required>' +
        '<option value="">고르십니다</option>' + provOptions(provs) + '</select></div>' +
        /* ⚠️⚠️ **광고주 이름은 비울 수 있습니다** — 비우면 업체 상호를
           씁니다. 바깥 광고주를 상호로 적을 수는 없으므로 칸을 따로
           둡니다 (지시서 B 의 "광고주"). */
        '<div class="jrow"><label for="ba-adv">광고주 이름 (비우면 업체 상호)</label>' +
        '<input id="ba-adv" name="advertiser" maxlength="60"></div>' +
        '<div class="jrow"><label for="ba-place">자리 <b>*</b></label>' +
        '<select id="ba-place" name="place">' +
          AD_PLACE.map(function(x){
            var sz = window.amAdSize ? window.amAdSize(x.key) : null;
            return '<option value="' + esc(x.key) + '">' + esc(x.name) +
              (sz ? esc(" — PC " + sz.pc + " · 모바일 " + sz.mo) : "") + '</option>';
          }).join("") + '</select></div>' +
        /* ⚠️⚠️⚠️ **전에는 둘 다 빈 칸에 손으로 적게 두었습니다.**
           그런데 손님 화면은 **키**로 찾습니다 (`lesson` · `seoul`) —
           운영자가 보이는 이름('골프 레슨' · '서울')을 적으면 그 광고는
           **어느 화면에도 영원히 안 걸립니다.** 에러도 없고 /admin 에는
           '집행 중' 으로 보입니다. 돈을 받고 안 띄우는 꼴이라, 적게 두지
           않고 **고르게** 합니다 (화면이 보내는 열쇠와 받는 쪽이 달라
           거르개가 아무것도 안 걸렀던 그 자리입니다).
           ⚠️ 목록은 `AM_CATS` · `AM_REGIONS` 에서 끌어옵니다 — 여기 글자로
           박으면 분류 · 지역이 느는 날 두 곳이 어긋납니다. */
        '<div class="jrow"><label for="ba-cat">분류 (분류 상단일 때)</label>' +
        '<select id="ba-cat" name="cat_key"><option value="">고르지 않음</option>' +
          (window.AM_CATS || []).map(function(c){
            return '<option value="' + esc(c.key) + '">' + esc(c.name) + '</option>';
          }).join("") + '</select></div>' +
        '<div class="jrow"><label for="ba-region">지역 (지역 광고일 때)</label>' +
        '<select id="ba-region" name="region"><option value="">고르지 않음</option>' +
          (window.AM_REGIONS || []).map(function(r){
            return '<option value="' + esc(r.key) + '">' + esc(r.name) + '</option>';
          }).join("") + '</select></div>' +
        '<div class="jrow"><label for="ba-from">시작 <b>*</b></label>' +
        '<input id="ba-from" name="starts_on" type="date" required></div>' +
        '<div class="jrow"><label for="ba-to">끝 <b>*</b></label>' +
        '<input id="ba-to" name="ends_on" type="date" required></div>' +
        '<div class="jrow"><label for="ba-price">계약액 (원) <b>*</b></label>' +
        '<input id="ba-price" name="price" inputmode="numeric" required ' +
        'placeholder="무상이면 0"></div>' +
        /* ⚠️⚠️⚠️ **클릭 주소는 DB 가 가립니다** (0064 의 `ad_run_click_ck`) —
           `https://` 로 시작하는 주소나 우리 주소(`/` 하나로 시작)만
           들어갑니다. `javascript:` · `//` · `@` 는 거절됩니다. 여기서만
           가리면 꾸러미를 고쳐 지나갑니다. */
        '<div class="jrow jrow-full"><label for="ba-url">클릭 주소 (비우면 업체 화면)</label>' +
        '<input id="ba-url" name="click_url" maxlength="500" ' +
        'placeholder="https://… 또는 /cat/lesson"></div>' +
        '<div class="jrow jrow-full"><label for="ba-alt">소재 설명 (화면 읽는 기계용)</label>' +
        '<input id="ba-alt" name="img_alt" maxlength="120" ' +
        'placeholder="비우면 「광고주 이름 광고」 로 나갑니다"></div>' +
        '<div class="jrow"><label for="ba-why">까닭 <b>*</b></label>' +
        '<input id="ba-why" name="whyText" required maxlength="200"></div>' +
        '<button class="btn btn-pt" type="submit">광고 저장</button>' +
      '</form>' +
      '<p class="myhint">⚠️ 소재(PC · 모바일)는 <b>광고를 먼저 저장</b>한 뒤 ' +
      '위 목록의 그 광고 줄에서 올리십니다 — 경로에 광고 번호가 들어가서 ' +
      '저장 전에는 자리를 지을 수가 없습니다.</p>';
  }
  /* ── 멤버십 ──────────────────────────────────────────────────── */
  function planView(provs, plans, mships){
    var planOf = {};
    plans.forEach(function(x){ planOf[x.id] = x; });
    var byId = {};
    provs.forEach(function(p){ byId[p.id] = p; });
    return '<p class="myhint">⚠️ 월정액은 <b>적어 둔 값</b>이고 ' +
      '<b>청구 · 입금 장치가 아직 없습니다</b> — 받은 돈이라고 말하지 ' +
      '않습니다.</p>' +
      (plans.length
        ? '<ul class="fe-p">' + plans.map(function(x){
            return '<li><b>' + esc(x.name) + '</b> · ' + esc(won(x.monthly)) + '원/월' +
              (x.listed ? "" : ' <span class="as-t">숨김</span>') + '</li>';
          }).join("") + '</ul>'
        /* ⚠️ 0건은 고장이 아닙니다 — 정하지 않은 요금제를 지어내지 않습니다 */
        : '<p class="myhint">아직 정해진 요금제가 없습니다. ' +
          '지어낸 값이 아닙니다 — 요금제를 정하시면 여기에 뜹니다.</p>') +
      '<h3 class="rq-h">요금제 더하기</h3>' +
      '<form class="jform bz-f" data-kind="plan">' +
        '<div class="jrow"><label for="bp-id">키 <b>*</b></label>' +
        '<input id="bp-id" name="planId" required maxlength="30" placeholder="basic"></div>' +
        '<div class="jrow"><label for="bp-name">이름 <b>*</b></label>' +
        '<input id="bp-name" name="planName" required maxlength="40"></div>' +
        '<div class="jrow"><label for="bp-monthly">월정액 (원) <b>*</b></label>' +
        '<input id="bp-monthly" name="monthly" inputmode="numeric" required ' +
        'placeholder="무료면 0"></div>' +
        '<div class="jrow"><label for="bp-why">까닭 <b>*</b></label>' +
        '<input id="bp-why" name="whyText" required maxlength="200"></div>' +
        '<button class="btn btn-pt" type="submit">요금제 저장</button>' +
      '</form>' +
      '<h3 class="rq-h">업체에 요금제 달기</h3>' +
      (mships.length
        ? '<ul class="fe-p">' + mships.map(function(m){
            var p = byId[m.provider_id], pl = planOf[m.plan_id];
            return '<li><b>' + esc(p ? p.name : m.provider_id) + '</b> · ' +
              esc(pl ? pl.name : m.plan_id) +
              '<span class="fe-when">' + esc(m.starts_on + " ~ " + (m.ends_on || "계속")) +
              '</span></li>';
          }).join("") + '</ul>'
        : '<p class="myhint">아직 멤버십을 단 업체가 없습니다.</p>') +
      (plans.length
        ? '<form class="jform bz-f" data-kind="mship">' +
            '<div class="jrow"><label for="bm-pv">업체 <b>*</b></label>' +
            '<select id="bm-pv" name="provider" required>' +
            '<option value="">고르십니다</option>' + provOptions(provs) + '</select></div>' +
            '<div class="jrow"><label for="bm-plan">요금제</label>' +
            '<select id="bm-plan" name="plan">' +
            /* ⚠️ 비워 두면 **뗍니다** — 그 뜻을 글로 적습니다 */
            '<option value="">(비우면 뗍니다)</option>' +
            plans.map(function(x){
              return '<option value="' + esc(x.id) + '">' + esc(x.name) + '</option>';
            }).join("") + '</select></div>' +
            '<div class="jrow"><label for="bm-why">까닭 <b>*</b></label>' +
            '<input id="bm-why" name="whyText" required maxlength="200"></div>' +
            '<button class="btn btn-pt" type="submit">멤버십 저장</button>' +
          '</form>'
        /* ⚠️ 요금제가 없으면 **달 수 없습니다** — 양식을 내지 않습니다 */
        : '<p class="myhint">요금제를 먼저 만드셔야 업체에 달 수 있습니다.</p>');
  }

  /* ── 후기 가리기 (0037) ──────────────────────────────────────────
     ⚠️⚠️⚠️ **지우는 길이 없습니다 — 가립니다.** 지우면 업체가 "없는
     말을 지웠다" 고 다툴 때 아무 기록이 없습니다. 가린 까닭은
     반드시 받습니다 (DB 도 받습니다).
     ⚠️⚠️ **업체가 불평할 때마다 가려 주는 자리가 되면 후기가
     광고입니다.** 그래서 까닭이 기록에 남고, 다시 낼 수 있습니다.
     ⚠️ 별점 · 글을 운영자가 고치는 문은 **만들지 않았습니다.** */
  function rvView(provs, revs){
    var byId = {};
    provs.forEach(function(p){ byId[p.id] = p; });
    return '<p class="myhint">⚠️ 후기는 <b>지우지 않고 가립니다</b>. ' +
      '가린 까닭은 기록에 남고, 다시 낼 수 있습니다. ' +
      '별점과 글을 고치는 길은 <b>없습니다</b> — 손님이 쓴 말입니다.</p>' +
      (revs.length
        ? '<div class="rvs">' + revs.map(function(v){
            var p = byId[v.provider_id];
            return '<div class="rv-one">' +
              window.amRvRow(v, { who:"손님",
                                  pname: p ? p.name : v.provider_id,
                                  hidden:true }) +
              '<p class="dk-hint">' + esc(p ? p.name : v.provider_id) +
              (p && p.is_test ? " — 검사용" : "") + '</p>' +
              '<div class="dk-b"><button class="btn btn-sm btn-line" ' +
              'data-rvto="' + esc(v.hidden_at ? "show" : "hide") + '" ' +
              'data-rvid="' + esc(v.id) + '">' +
              (v.hidden_at ? "다시 내기" : "가리기") + '</button></div>' +
            '</div>';
          }).join("") + '</div>'
        /* ⚠️ 0건은 고장이 아닙니다 */
        : '<p class="myhint">아직 후기가 없습니다. ' +
          '견적을 고르신 손님이나 만나신 손님이 쓰시면 여기에 뜹니다.</p>');
  }

  function paint(){
    box.hidden = false; box.className = "deskbox";
    box.innerHTML = '<h2 class="adm-h">수수료 · 광고 · 멤버십</h2>' +
      '<p class="lmsg">읽는 중입니다…</p>';
    load().then(function(got){
      var provs = got[0], pols = got[1], ads = got[2], plans = got[3],
          mships = got[4], revs = got[5], bills = got[6];
      /* ⚠️⚠️ 하나라도 못 읽었으면 **0건이라고 말하지 않습니다.** */
      if(provs === null || pols === null || ads === null ||
         plans === null || mships === null || revs === null || bills === null){
        box.innerHTML = '<h2 class="adm-h">수수료 · 광고 · 멤버십</h2>' +
          '<p class="lmsg">읽지 못했습니다. ' +
          '<button class="btn btn-sm btn-line" data-do="again">다시 읽기</button></p>';
        return;
      }
      box.innerHTML = '<h2 class="adm-h">수수료 · 광고 · 멤버십</h2>' + tabs() +
        '<div class="bz-body">' +
        (TAB === "fee"  ? feeView(provs, pols)  :
         TAB === "ad"   ? adView(provs, ads, bills) :
         TAB === "rv"   ? rvView(provs, revs)   :
                          planView(provs, plans, mships)) +
        '</div><p class="dk-m lmsg" hidden></p>';
    });
  }

  function msg(){ return box.querySelector(".dk-m"); }
  function say(t){ var m = msg(); if(m){ m.hidden = false; m.textContent = t; } }

  box.addEventListener("click", function(e){
    var t = e.target.closest ? e.target.closest("button[data-tab]") : null;
    if(t){ TAB = t.getAttribute("data-tab"); return paint(); }
    var ag = e.target.closest ? e.target.closest("button[data-do='again']") : null;
    if(ag) return paint();

    var ft = e.target.closest ? e.target.closest("button[data-feetoggle]") : null;
    if(ft){
      var on = ft.getAttribute("data-on") === "1";
      var w1 = prompt((on ? "끄시는" : "켜시는") + " 까닭을 적어 주세요 (기록에 남습니다)");
      if(!(w1 && w1.trim())) return;
      ft.disabled = true; say("바꾸는 중입니다…");
      rpc("set_fee_policy_active", { p_id: ft.getAttribute("data-feetoggle"),
                                     p_active: !on, p_why: w1.trim() })
        .then(paint).catch(function(err){ ft.disabled = false; say(why(err)); });
      return;
    }
    /* 후기 가리기 · 다시 내기 (0037) */
    var rv = e.target.closest ? e.target.closest("button[data-rvto]") : null;
    if(rv){
      var to = rv.getAttribute("data-rvto");
      /* ⚠️⚠️ **가릴 때만 까닭을 받습니다** (DB 도 그렇습니다) — 다시 낼
         때 까닭을 또 받으면 사람이 아무 글자나 적습니다. */
      var w0 = null;
      if(to === "hide"){
        w0 = prompt("가리시는 까닭을 적어 주세요 (기록에 남습니다)");
        if(!(w0 && w0.trim())) return;
        w0 = w0.trim();
      }
      rv.disabled = true; say("바꾸는 중입니다…");
      window.amRvHide(rpc, rv.getAttribute("data-rvid"), to, w0)
        .then(paint).catch(function(err){ rv.disabled = false; say(why(err)); });
      return;
    }
    /* 광고 소재 빼기 (0064) — ⚠️ 되돌릴 수 없으니 한 번 여쭙습니다 */
    var di = e.target.closest ? e.target.closest("button[data-addropimg]") : null;
    if(di){
      if(!window.confirm("이 소재를 빼시겠습니까? 손님 화면에서 바로 사라집니다.")) return;
      di.disabled = true; say("빼는 중입니다…");
      rpc("drop_ad_image", { p: { ad: di.getAttribute("data-ad"),
                                  kind: di.getAttribute("data-addropimg") } })
        .then(paint).catch(function(err){ di.disabled = false; say(why(err)); });
      return;
    }
    /* 돈 양식 펼치기 (0064) — ⚠️ 한 번 열면 닫지 않습니다 (적다 말고
       닫히면 적은 것이 사라집니다). 다시 그리면 닫힙니다. */
    var bo = e.target.closest ? e.target.closest("button[data-adbillopen]") : null;
    if(bo){
      var f0 = box.querySelector('form[data-adbillform="' +
                 bo.getAttribute("data-adbillopen") + '"]');
      if(f0){ f0.hidden = false; bo.hidden = true;
              var i0 = f0.querySelector("select,input");
              if(i0 && i0.focus) i0.focus(); }
      return;
    }
    /* 돈 기록 한 줄 빼기 (0064) — ⚠️⚠️ **까닭이 반드시**입니다
       (돈 기록을 지우는 일이고, 뺀 일 자체가 감사 기록에 남습니다). */
    var db = e.target.closest ? e.target.closest("button[data-adbilldrop]") : null;
    if(db){
      var w3 = prompt("빼시는 까닭을 적어 주세요 (기록에 남습니다)");
      if(!(w3 && w3.trim())) return;
      db.disabled = true; say("빼는 중입니다…");
      rpc("drop_ad_bill", { p: { id: db.getAttribute("data-adbilldrop"),
                                 why: w3.trim() } })
        .then(paint).catch(function(err){ db.disabled = false; say(why(err)); });
      return;
    }
    var ad = e.target.closest ? e.target.closest("button[data-adto]") : null;
    if(ad){
      var w2 = prompt("바꾸시는 까닭을 적어 주세요 (기록에 남습니다)");
      if(!(w2 && w2.trim())) return;
      ad.disabled = true; say("바꾸는 중입니다…");
      rpc("set_ad_state", { p_ad: ad.getAttribute("data-ad"),
                            p_to: ad.getAttribute("data-adto"), p_why: w2.trim() })
        .then(paint).catch(function(err){ ad.disabled = false; say(why(err)); });
    }
  });

  /* ⚠️ 숫자 칸은 숫자만 보냅니다 — 쉼표 · 원 을 적으셔도 되게.
     ⚠️⚠️ **0 은 값입니다** (무상 광고 · 무료 요금제) — 여기서 `||` 를
     쓰면 0 이 "안 적음" 이 됩니다. */
  function num(v){
    v = String(v || "").replace(/[^0-9.]/g, "");
    return v === "" ? null : Number(v);
  }
  function str(v){ v = String(v || "").trim(); return v === "" ? null : v; }

  box.addEventListener("submit", function(e){
    var f = e.target.closest ? e.target.closest("form.bz-f") : null;
    if(!f) return;
    e.preventDefault();
    var kind = f.getAttribute("data-kind");
    var btn = f.querySelector('button[type="submit"]');
    var w = str(f.whyText.value);
    if(!w) return say("까닭을 적어 주세요.");
    btn.disabled = true; say("보내는 중입니다…");

    var call = null, args = null;
    if(kind === "fee"){
      call = "save_fee_policy";
      args = { p_provider: f.provider.value, p_why: w, p_data: {
        type: f.type.value, flat: num(f.flat.value), rate: num(f.rate.value),
        min_fee: num(f.min_fee.value), max_fee: num(f.max_fee.value),
        vat: f.vat.value, confirm_when: f.confirm_when.value, cycle: f.cycle.value,
        refund_rule: str(f.refund_rule.value)
      }};
    }else if(kind === "ad"){
      call = "save_ad";
      args = { p: { provider: f.provider.value, place: f.place.value,
        cat_key: str(f.cat_key.value), region: str(f.region.value),
        starts_on: f.starts_on.value, ends_on: f.ends_on.value,
        price: num(f.price.value),
        /* ⚠️ 0064 — 비우면 **null** 로 보냅니다 (빈 글자를 보내면 표의
           check 가 "빈 글자" 로 거절합니다 — 비움과 빈 글자는 다릅니다). */
        advertiser: str(f.advertiser.value),
        click_url: str(f.click_url.value),
        img_alt: str(f.img_alt.value),
        why: w } };
    }else if(kind === "adbill"){
      /* ⚠️⚠️ 0064 — 청구 · 수납 · 환불을 **한 줄씩** 적습니다.
         ⚠️ 날짜를 비우면 **오늘(한국 시각)**입니다 — 문이 `kst_today()`
         로 채웁니다 (화면이 날짜를 지어 보내면 UTC 로 하루 밀립니다). */
      call = "save_ad_bill";
      args = { p: { ad: f.adId.value, kind: f.billKind.value,
        amount: num(f.amount.value), on_day: str(f.onDay.value),
        memo: str(f.memo.value), why: w } };
    }else if(kind === "plan"){
      call = "save_plan";
      args = { p_id: f.planId.value, p_name: f.planName.value,
               p_monthly: num(f.monthly.value), p_why: w };
    }else if(kind === "mship"){
      call = "set_membership";
      args = { p: { provider: f.provider.value, plan: str(f.plan.value), why: w } };
    }
    if(!call){ btn.disabled = false; return; }

    rpc(call, args).then(function(){ paint(); })
      .catch(function(err){ btn.disabled = false; say(why(err)); });
  });


  /* ════════════════════════════════════════════════════════════════
     광고 소재 올리기 (0064)

     ⚠️⚠️ **파일이 우리 서버를 지나가지 않습니다** — `/api/upload` 가
     **서명된 올리기 주소** 하나를 내주고 브라우저가 거기로 바로
     올립니다 (0011 · 0051 과 같은 길).
     ⚠️⚠️⚠️ **경로도 · 버킷도 서버가 고릅니다** — 화면이 고르게 두면
     서류를 공개 버킷에 올릴 수 있습니다.
     ⚠️ 여기서 보는 형식 · 크기는 **먼저 거르는 것**이고, 실제로 막는
     것은 ① 0064 의 `claim_ad_image` ② 버킷 설정입니다 (자물쇠 셋).
     ════════════════════════════════════════════════════════════════ */
  box.addEventListener("change", function(e){
    var inp = e.target;
    if(!inp || !inp.getAttribute || !inp.getAttribute("data-adup")) return;
    var f = inp.files && inp.files[0];
    if(!f) return;
    var kind = inp.getAttribute("data-adup");
    var adId = inp.getAttribute("data-ad");
    inp.value = "";
    if(AD_MIME.indexOf(f.type) < 0)
      return say("광고 소재는 JPG · PNG · WEBP 만 올리실 수 있습니다.");
    if(f.size > AD_MAX)
      return say("광고 소재는 한 장에 2MB 까지 올리실 수 있습니다.");
    say("자리를 받는 중입니다…");
    fetch("/api/upload", {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json" },
                             window.amAuthHeaders()),
      /* ⚠️ `ad:true` 로 **광고 쪽 길**임을 말합니다 */
      body: JSON.stringify({ ad:true, adId:adId, kind:kind,
                             mime:f.type, bytes:f.size })
    }).then(function(r){
      return r.json().then(function(j){ return { ok:r.ok, j:j }; });
    }).then(function(x){
      if(!x.ok || !x.j || !x.j.url)
        throw new Error((x.j && x.j.error) || "지금 올리지 못했습니다");
      /* ⚠️⚠️ **여기서 "올렸습니다" 라고 하지 않습니다** — 자리를 받은
         것이고 파일은 아직 안 갔습니다. */
      say("올리는 중입니다…");
      return fetch(x.j.url, { method:"PUT",
        headers:{ "content-type":f.type }, body:f });
    }).then(function(r){
      if(!r || !r.ok) throw new Error("올리지 못했습니다");
      paint();
    }).catch(function(err){ say(why(err)); });
  });

  amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ /admin 의 윗자리가 이미 안내합니다 — 관리자가 아니면 아무것도
       그리지 않습니다. ⚠️⚠️ **직원도 안 됩니다** — 이 문들은 전부
       관리자만 받습니다 (0007 · 0026 · 0036). 직원에게 양식을 내면
       누를 때마다 거절당하는 화면이 됩니다 (절대 규칙 5). */
    if(!a.on || !a.signedIn) return;
    if(a.role !== "admin") return;
    /* ⚠️⚠️ 0064 — 공개 버킷이 설정됐는지 **묻고** 나서 그립니다.
       꺼져 있으면 소재를 올리는 칸을 **아예 안 냅니다** (그리면 눌러도
       거절되는 칸입니다 · 절대 규칙 5). ⚠️ 못 물어봐도 그립니다 —
       소재 칸만 안 나오고 나머지는 그대로 돌아야 합니다. */
    return fetch("/api/upload", { headers:{ accept:"application/json" } })
      .then(function(r){ return r.ok ? r.json() : null; })
      .catch(function(){ return null; })
      .then(function(j){ AD_IMG = !!(j && j.adImg); paint(); });
  });
})();
