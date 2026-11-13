/* ════════════════════════════════════════════════════════════════════
   골프용품 마켓 — 상품 · 탭 · 거르개를 한 곳에서 (확정 시안 ⑥)

   ⚠️⚠️⚠️ **상품을 담는 표를 새로 만들지 않았습니다.** 시안 ⑥ 은 상품
     카드 격자를 요구하는데, 그 값은 이미 `provider_price`(0042)에
     있습니다 — 업체가 `/desk` 에서 직접 올리는 **품목 · 금액 · 단위 ·
     비고**이고, 공개로 나가는 길(`v_provider_price_public`)과 운영자
     심사(업체 승인 · 정지)가 이미 돕니다. 새 표를 세우면 등록 · 수정 ·
     심사 · 정지 · 사진 · 신고를 **한 벌 더** 만들고 한쪽만 고치는 날
     둘이 다른 말을 합니다(0071 에서 「프로」를 새 표로 안 만든 그 까닭).
   ⚠️⚠️ 그래서 **지어낸 상품이 한 건도 없습니다** — 업체가 올린 값만
     나오고, 0건이면 화면이 0건이라고 말합니다(절대 규칙 1).
   ⚠️⚠️ **「상품 상세」는 `/pro/<업체>` 로 갑니다** — 상품마다 따로
     화면을 두면 같은 내용이 두 주소로 나가고(검색에서 둘 다 무시),
     그 업체의 신원정보 · 사진 · 후기가 **거기에만** 있습니다.
   ⚠️ 시안의 「상품 상세」 단추 글자는 그대로 씁니다.

   ⚠️⚠️⚠️ **안 만든 것 — 장바구니 · 결제 · 재고 · 배송**. 결제를 아예
     안 받습니다(제20조의3). 칸을 만들어 두면 누군가 켭니다.
   ⚠️ 시안의 「전체 상품 24건 (예시)」 · 상품 사진 여덟 장은 **예시
     데이터**라 넣지 않습니다.
   ════════════════════════════════════════════════════════════════════ */
(function(W){
  "use strict";

  /* ── 탭 셋 ────────────────────────────────────────────────────────
     ⚠️⚠️ 「렌탈」은 **하위 키 하나**(`mk-rent`)로 좁히는 자리입니다 —
       따로 표를 두면 같은 업체가 두 목록에 어긋나게 섭니다.
     ⚠️ 키는 **주소에 남는 글자**라 바꾸면 옛 주소가 깨집니다. */
  W.AM_MK_TAB = [
    { key:"item",  name:"전체 상품",
      note:"입점 업체가 직접 올린 품목과 금액입니다." },
    { key:"store", name:"입점 스토어",
      note:"골프용품 마켓에 입점한 업체입니다." },
    { key:"rent",  name:"렌탈",
      note:"대여를 하는 업체의 품목입니다." }
  ];
  W.amMkTab = function(k){
    var r = (W.AM_MK_TAB || []).filter(function(t){ return t.key === k; })[0];
    return r || W.AM_MK_TAB[0];
  };

  /* ── 차례 ────────────────────────────────────────────────────────
     ⚠️⚠️ 시안의 「최신 등록순」은 **안 냅니다** — `provider_price` 에
       올린 날 칸이 공개 보기에 없습니다. 없는 차례를 고르게 두면
       골라도 안 바뀌는 칸입니다(절대 규칙 5).
     ⚠️ 「추천순」도 안 냅니다 — 무엇이 추천인지 세어 본 적이 없습니다. */
  W.AM_MK_SORT = [
    { key:"low",  name:"가격 낮은 순" },
    { key:"high", name:"가격 높은 순" }
  ];

  /* ── 업체들이 올린 품목을 **상품 한 줄**로 펴 놓습니다 ───────────
     ⚠️ 값이 없는 줄(`amount` 가 null)은 **뺍니다** — 시안의 카드는
       금액 자리가 있는데 비워 두면 「(미기재)」가 됩니다(절대 규칙 2).
     ⚠️⚠️ 마켓 하위(`mk-*`)인 줄만 냅니다 — 같은 업체가 중고 매입
       (`us-*`)도 하면 그 값이 상품 격자에 섞입니다(`amPriceLow()` 가
       분류를 안 가려 연습장 타석료가 레슨 가격으로 찍힌 그 자리). */
  function mkSubs(){
    var cat = (W.AM_CATS || []).filter(function(x){
      return x.key === "market";
    })[0];
    return ((cat && cat.items) || []).map(function(s){ return s.key; });
  }
  W.amMkSubs = mkSubs;

  W.amMkItems = function(list){
    var keys = mkSubs(), out = [];
    (list || []).forEach(function(p){
      (p.prices || []).forEach(function(r, i){
        if(!r || keys.indexOf(r.sub) < 0) return;
        var n = Number(r.amount);
        if(!isFinite(n) || n < 0) return;
        out.push({ pid:p.id, store:p.name, regions:p.regions || [],
                   brands:p.brands || [], verified:p.verified || null,
                   sub:r.sub, label:r.label || "", amount:n,
                   unit:r.unit || "", note:r.note || "",
                   key:p.id + ":" + i });
      });
    });
    return out;
  };

  /* ⚠️ 브랜드 목록은 **업체가 올린 글자에서 모읍니다** — 목록을 박아
     두면 목록에 없는 브랜드를 가진 업체가 거르개에서 빠집니다(0068 의
     `AM_LST_BRAND` 와 반대 자리: 거기는 올리는 칸이라 목록이 필요하고,
     여기는 **이미 올라온 값**을 모으는 자리입니다). */
  W.amMkBrands = function(list){
    var seen = {}, out = [];
    (list || []).forEach(function(p){
      (p.brands || []).forEach(function(b){
        var s = String(b || "").trim();
        if(!s || seen[s]) return;
        seen[s] = 1; out.push(s);
      });
    });
    return out.sort(function(a, b){ return a.localeCompare(b, "ko"); });
  };
})(window);
