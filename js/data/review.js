/* ════════════════════════════════════════════════════════════════════
   후기 · 평점을 **세는** 자리 — 규칙은 여기 한 곳입니다

   ⚠️⚠️⚠️ **평점을 값으로 들고 있지 않습니다.** 업체 자료
   (js/data/providers.generated.js)에도, DB 의 provider 표에도 평점 칸이
   없습니다 (0001 · 0037 머리말). 평균과 건수는 **후기 줄에서 그때그때
   셉니다** — 칸으로 두면 누군가 거기에 4.9 를 적어 넣고, 그 순간 없는
   신뢰를 광고하는 것입니다 (절대 규칙 1 · 표시광고법 제3조).

   ⚠️⚠️ **후기가 0건이면 null 입니다.** 0 이나 0.0 을 돌려주지 않습니다 —
   화면이 "평점 0.0" 을 찍으면 나쁜 업체로 읽힙니다. 0 일 때 화면은
   "아직 후기가 없습니다" 라고 **말합니다** (절대 규칙 1 · 2).

   ⚠️ 자료는 js/data/reviews.generated.js 에 있고 그것은 DB 에서
   나옵니다 (tools/pull-reviews.js). 이 파일은 그 자료를 **어떻게 세고
   어떻게 읽는가**만 정합니다. 둘을 섞지 마세요.
   ════════════════════════════════════════════════════════════════════ */

/* 전부 — 없으면 빈 배열입니다 (null 을 돌려주지 않습니다) */
window.amReviews = function(){
  return Array.isArray(window.AM_REVIEWS) ? window.AM_REVIEWS : [];
};

/* 한 업체의 후기 — ⚠️ **새것이 위**입니다 (평점 순이 아닙니다).
   평점으로 줄 세우면 그게 플랫폼의 편집이고, 좋은 말만 위로 옵니다. */
window.amReviewsOf = function(pid){
  var id = (typeof pid === "string") ? pid : (pid && pid.id);
  if(!id) return [];
  return window.amReviews().filter(function(r){ return r.provider_id === id; })
    .slice()
    .sort(function(a, b){
      return String(b.created_at || "").localeCompare(String(a.created_at || ""));
    });
};

/* ⚠️⚠️ **평균을 여기서만 냅니다.** 화면마다 따로 세면 한쪽만 고쳐서
   조용히 다른 숫자가 나옵니다.
   돌려주는 것 — { n: 건수, avg: 평균(소수 한 자리), round: 가까운 정수 }
   ⚠️ 후기가 0건이면 **null** 입니다.
   ⚠️ 분모가 0 이면 비율을 내지 않습니다 (작업 기억의 경계값 줄). */
window.amRating = function(pid){
  var L = window.amReviewsOf(pid);
  if(!L.length) return null;
  var sum = 0, n = 0;
  L.forEach(function(r){
    var v = Number(r.rating);
    /* ⚠️ 1~5 밖의 값은 **안 셉니다** (DB 가 막지만, 파일이 앞서 나갈 수
       있습니다). 세지 않은 것이 있으면 n 이 줄어 그대로 드러납니다. */
    if(v >= 1 && v <= 5){ sum += v; n++; }
  });
  if(!n) return null;
  var avg = sum / n;
  return { n: n, avg: Math.round(avg * 10) / 10, round: Math.round(avg) };
};

/* 별 글자 — ⚠️ 정수 1~5 입니다. 평균에 쓰려면 round 를 넘기세요.
   ⚠️ 색이나 아이콘으로 하지 않습니다: 글자라서 소리로도 읽히고, 복사해도
   남습니다. 소리로 듣는 분께는 아래 amStarLabel() 을 같이 답니다. */
window.amStarGlyphs = function(n){
  var k = Math.max(0, Math.min(5, Math.round(Number(n) || 0)));
  var s = "";
  for(var i = 0; i < 5; i++) s += (i < k) ? "★" : "☆";
  return s;
};
window.amStarLabel = function(n){
  var k = Math.max(0, Math.min(5, Math.round(Number(n) || 0)));
  return "5점 만점에 " + k + "점";
};

/* 사람이 읽는 한 줄 — ⚠️ 0건이면 **null** 입니다 */
window.amRatingLine = function(pid){
  var g = window.amRating(pid);
  if(!g) return null;
  /* ⚠️ 평균을 늘 소수 한 자리로 적습니다 — "4" 와 "4.0" 이 섞이면
     어느 쪽이 참인지 묻게 됩니다. */
  return g.avg.toFixed(1) + "점 · 후기 " + g.n + "건";
};

/* 날짜 — ⚠️⚠️ **한국 시각으로 봅니다.** Supabase 는 UTC 라 그냥 찍으면
   밤 9시 이후 것이 다음 날로 보입니다 (작업 기억의 UTC 줄).
   ⚠️ 시각은 안 찍습니다 — 후기에 몇 시 몇 분이 필요한 자리가 없고,
   시각까지 적으면 누가 썼는지 좁혀집니다. */
window.amDay = function(iso){
  if(!iso) return "";
  var d = new Date(iso);
  if(isNaN(d.getTime())) return "";
  var k = new Date(d.getTime() + 9 * 3600 * 1000);
  return k.getUTCFullYear() + "." +
         String(k.getUTCMonth() + 1).padStart(2, "0") + "." +
         String(k.getUTCDate()).padStart(2, "0");
};

/* 별점을 고르는 자리의 말 — ⚠️ 화면 둘(/my 에서 쓰기 · 고치기)이
   같은 말을 써야 합니다. */
window.AM_RATING_WORD = [
  { v:5, name:"아주 좋았습니다" },
  { v:4, name:"좋았습니다" },
  { v:3, name:"보통이었습니다" },
  { v:2, name:"아쉬웠습니다" },
  { v:1, name:"좋지 않았습니다" }
];
