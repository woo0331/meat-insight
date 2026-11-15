/* 비교견적 — 분류마다 여쭙는 조건 · 업체가 적는 비교 항목 · 진행 단계 (2026-11-15 · 0082)
   ════════════════════════════════════════════════════════════════════
   ⚠️⚠️⚠️ **한 곳**입니다 — 손님 양식(`js/compareform.js`) · 업체 견적 양식
   (`js/desk.js`) · 손님 비교표(`js/myreq.js`)가 같은 줄을 읽습니다. 두 곳에
   적으면 업체가 적은 칸을 손님 표가 못 읽는 꼴이 되고 에러도 안 납니다.
   ⚠️⚠️ **키는 더하기만** 합니다 — DB 는 `request.detail` · `quote.terms` 에
   키를 글자로 담습니다(0082 의 `compare_bag_ok` 가 꼴만 봅니다: 영문 소문자로
   시작 · 24자 이하 · 값은 글자 300자 이하).
   ⚠️⚠️⚠️ **켜는 스위치는 `site.js` 의 `compareOn`** 입니다. 0082 를 운영 DB 에
   올리기 전에는 꺼 둡니다 — 켜면 화면이 `request.compare` · `quote.kind` ·
   `v_request_contact` 를 부르고, 그것이 없는 DB 는 질의를 통째로 거절합니다.
   ⚠️ 「상담 선택」은 예약 · 계약 · 결제가 **아닙니다**. 「최저가」 · 「최고가」로
   줄 세우지 않습니다 — 같은 칸을 나란히 놓습니다. */
(function(){
  var W = window;

  W.AM_CMP = {
    lesson: {
      name: "레슨", svcPrefix: "ls-",
      lead: "지역 · 목표 · 개인/그룹 · 가능한 시간 · 예산을 남기시면 맞는 프로가 레슨 조건을 제안합니다.",
      ask: [
        { k:"goal",  label:"목표", type:"select", req:true,
          opts:["입문 · 기초","자세 교정","비거리","숏게임 · 퍼팅","필드 레슨","기타"] },
        { k:"style", label:"개인 · 그룹", type:"select", req:true, opts:["개인","그룹","상관없음"] },
        { k:"when",  label:"가능한 요일 · 시간", type:"text", req:true, ph:"예: 평일 저녁 7시 이후 · 주말 오전" }
      ],
      amount: "총비용",
      terms: [
        { k:"pro",      label:"담당 프로", req:true },
        { k:"count",    label:"레슨 횟수", req:true, ph:"예: 8회" },
        { k:"mins",     label:"회당 시간", req:true, ph:"예: 50분" },
        { k:"style",    label:"개인 · 그룹 (그룹이면 인원)", req:true, ph:"예: 개인 / 그룹 3명" },
        { k:"facility", label:"시설(타석) 이용료", req:true, ph:"포함 / 별도 월 5만원 등" },
        { k:"extra",    label:"별도 비용", ph:"없으면 비워 두세요" },
        { k:"when",     label:"가능한 일정 · 이용 기간", req:true, ph:"예: 화 · 목 저녁 · 3개월 안" }
      ]
    },
    fitting: {
      name: "피팅 · 수리", svcPrefix: "ft-",
      lead: "클럽과 증상을 남기시면 업체가 진단비 · 부품 · 공임과 기간을 제안합니다. 실물을 봐야 정해지는 금액은 「예상 견적」으로 옵니다.",
      ask: [
        { k:"club",    label:"클럽 종류 · 모델", type:"text", req:true, ph:"예: 드라이버 · 모델명" },
        { k:"symptom", label:"증상", type:"text", req:true, ph:"예: 헤드가 흔들림 · 그립이 미끄러움" },
        { k:"work",    label:"원하는 작업", type:"text", ph:"예: 샤프트 교체 · 그립 교체 · 모르겠음" },
        { k:"way",     label:"맡기는 방법", type:"select", req:true, opts:["방문","택배","상관없음"] }
      ],
      amount: "합계 금액",
      terms: [
        { k:"diag",   label:"진단비", req:true, ph:"없으면 0원" },
        { k:"parts",  label:"부품비", req:true },
        { k:"labor",  label:"공임", req:true },
        { k:"extra",  label:"추가 비용이 생기는 조건", req:true, ph:"예: 실물 점검 뒤 헤드 손상이 보이면" },
        { k:"period", label:"예상 기간", req:true, ph:"예: 맡기신 뒤 3일" },
        { k:"ship",   label:"방문 · 배송 · 반송 조건", req:true }
      ]
    },
    used: {
      name: "중고클럽 매입", svcPrefix: "us-buyquote",
      lead: "클럽 정보를 남기시면 매입 업체가 예상 매입가와 감액 조건 · 지급 시점을 제안합니다. 개인 매물 판매 · 위탁판매와는 다른 요청입니다.",
      ask: [
        { k:"brand", label:"브랜드 · 모델", type:"text", req:true },
        { k:"set",   label:"구성", type:"text", req:true, ph:"예: 아이언 5~P (6개)" },
        { k:"shaft", label:"샤프트", type:"text", ph:"예: 스틸 S" },
        { k:"cond",  label:"상태 · 수리 이력", type:"text", req:true, ph:"예: 페이스 사용감 · 그립 교체 1회" },
        { k:"way",   label:"거래 방법", type:"select", req:true, opts:["방문","택배","상관없음"] }
      ],
      amount: "매입가",
      terms: [
        { k:"deduct", label:"검수 후 감액될 수 있는 사유", req:true },
        { k:"ship",   label:"방문 · 택배 · 반송 비용", req:true },
        { k:"pay",    label:"지급 시점", req:true, ph:"예: 검수 당일 계좌 이체" }
      ]
    }
  };

  /* 견적의 종류 — ⚠️ 실물을 봐야 정해지는 금액을 확정가로 보이지 않습니다 */
  W.AM_CMP_KIND = { estimate:"예상 견적 (실물 확인 뒤 달라질 수 있음)", fixed:"확정 견적" };

  W.amCmpOn = function(){ return !!(W.WOW_BIZ && W.WOW_BIZ.compareOn); };
  W.amCmp = function(cat){ return (W.AM_CMP && W.AM_CMP[cat]) || null; };
  /* /match?compare=1&cat=<분류> 로 왔는가 — ⚠️ 스위치가 꺼져 있으면 언제나 아니라고 합니다 */
  W.amCompareMode = function(){
    if(!W.amCmpOn()) return null;
    try{
      var p = new URLSearchParams(location.search);
      if(p.get("compare") !== "1") return null;
      return W.amCmp(p.get("cat")) ? p.get("cat") : null;
    }catch(e){ return null; }
  };
  W.amCmpUrl = function(cat){ return "/match?compare=1&cat=" + encodeURIComponent(cat); };

  /* 진행 단계 — ⚠️ 여섯을 섞지 않습니다(지시 3번).
     요청 접수 → (업체 확인 중) → 견적 도착 → 상담 선택 → 최종 조건 확정 → 이용 완료 · 취소/만료/미성사 */
  W.amCmpExpired = function(q, today){
    return !!(q && q.valid_to && today && String(q.valid_to) < String(today));
  };
  W.amCmpStage = function(r, quotes, today){
    var st = r && r.state, Q = quotes || [];
    if(st === "lost") return { k:"end",  name:"취소 · 미성사" };
    if(st === "done" || st === "fee_wait" || st === "fee_done") return { k:"used", name:"이용 완료" };
    if(st === "signed") return { k:"fixed", name:"최종 조건 확정" };
    if(Q.some(function(q){ return q.state === "chosen"; })) return { k:"pick", name:"상담 선택" };
    var open = Q.filter(function(q){ return q.state === "open" && !W.amCmpExpired(q, today); });
    if(open.length) return { k:"quote", name:"견적 도착" };
    if(Q.length) return { k:"stale", name:"견적 만료 · 철회" };
    if(st === "new" || st === "check") return { k:"recv", name:"요청 접수" };
    return { k:"wait", name:"업체 확인 중" };
  };
})();
