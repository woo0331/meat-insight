const L = require("./img-lib.js");
const { C, r, c, e, p, g, figure, shadow, showcase, hood, duct, fridge, boxes, table, facade, svg } = L;

/* ⚠️ **그리는 순서가 곧 앞뒤**입니다. 카운터를 사람보다 먼저 그리면
   사람이 카운터 **위에 올라선 것처럼** 보입니다. 사람 → 카운터 순서로. */

function room(w, h, floorAt, wall, floor){
  return r(0,0,w,floorAt, wall||C.wall) + r(0,floorAt,w,h-floorAt, floor||C.floor)
       + r(0,floorAt-3,w,3,"rgba(0,0,0,.06)");
}
function tiles(x,y,w,h,size,tone){
  let o = "";
  for(let ty=0; ty<h; ty+=size)
    for(let tx=0; tx<w; tx+=size)
      o += r(x+tx+1, y+ty+1, size-2, size-2, tone||"rgba(255,255,255,.35)", 2);
  return o;
}
function lamp(x, y, drop, rr){
  return g([ r(-2,0,4,drop,C.ink3), p(`M${-rr},${drop} L${rr},${drop} L${rr*.45},${drop+rr*.8} L${-rr*.45},${drop+rr*.8} Z`, C.ink),
             e(0, drop+rr*.8, rr*.5, rr*.22, C.glow) ].join(""), `translate(${x},${y})`);
}
/* 앞에 오는 카운터 — 사람을 가려 줍니다 */
function counterFront(x, y, w, h, top){
  return g([ r(0,0,w,20, top||C.wood, 4), r(6,20,w-12,h-20, C.wood2) ].join(""), `translate(${x},${y})`);
}

const S = {};

/* ── 히어로 1600×900 ─────────────────────────────────────────
   ⚠️ 글자가 왼쪽에 얹히고 어두운 겹이 왼쪽에서 제일 진합니다.
   그래서 볼 것은 전부 **오른쪽 절반**에 둡니다. */
/* ⚠️ 히어로는 아주 **납작한 띠**로 잘립니다 (1440×약 420px). 16:9 로
   그리면 가운데 30% 만 남아 사람도 쇼케이스도 다 잘려 나갑니다.
   그래서 처음부터 납작하게 그리고, 볼 것을 세로 가운데에 둡니다.
   ⚠️ 글자는 왼쪽에 얹히고 어두운 겹이 왼쪽에서 제일 진합니다 —
   볼 것은 전부 오른쪽 절반에. */
S.hero = () => svg(1600, 620,
  room(1600, 620, 520, C.wall2, C.floor) +
  tiles(560, 0, 1040, 520, 74) +
  duct(560, 0, 1040, 52) +
  /* 갈고리 줄 */
  r(640, 96, 500, 11, C.steel3, 6) +
  [0,1,2,3,4,5].map(i => r(684+i*84, 107, 8, 58, C.steel2, 4)).join("") +
  [0,1,2,3,4,5].map(i => e(688+i*84, 192, 21, 30, i%2?C.meat:C.meat2)).join("") +
  /* 쇼케이스 (뒤) */
  showcase(1300, 330, 300, 190) +
  /* 사장님 — ⚠️ 제목 글자가 이미지 왼쪽 60% 를 덮습니다. 가운데에
     세우면 글자 뒤에 숨어 아무 소용이 없습니다. */
  shadow(1090, 522, 86) +
  figure({ x:1090, y:520, h:420, body:C.light, pants:C.ink, apron:C.burg, cap:C.light, arm:"fold" }) +
  /* 작업대 (앞) */
  g([ r(0,0,500,24,C.steel2,6), r(26,24,20,120,C.steel3), r(454,24,20,120,C.steel3),
      r(54,-20,140,20,C.white,4), e(124,-20,52,10,C.meat2),
      r(240,-14,104,14,C.white,4) ].join(""), "translate(880,452)") +
  lamp(1250, 0, 120, 50) + lamp(700, 0, 156, 44)
, C.paper);

/* ── 마지막 CTA 1600×900 — 저녁 홀 ─────────────────────────── */
S.final = () => svg(1600, 700,
  room(1600, 700, 470, C.wall2, C.floor) +
  duct(0, 40, 1600, 50) +
  [280, 800, 1320].map(x => hood(x-150, 90, 300)).join("") +
  [280, 800, 1320].map(x => lamp(x, 140, 100, 44)).join("") +
  shadow(420, 472, 60) + figure({ x:420, y:470, h:300, body:C.light, pants:C.ink, apron:C.burg }) +
  shadow(1180, 472, 56) + figure({ x:1180, y:470, h:284, body:C.ink2, pants:C.ink }) +
  [280, 800, 1320].map(x =>
    table(x-150, 490, 300, 140) +
    r(x-218, 536, 40, 94, C.wood2, 5) + r(x+178, 536, 40, 94, C.wood2, 5)).join("")
, C.paper);

/* ── 상황 다섯 1200×900 ───────────────────────────────────── */
S["sit-start"] = () => svg(1200, 900,
  room(1200, 900, 660, C.wall, C.floor) +
  /* 아직 아무것도 없는 점포 — 창과 빈 벽 */
  r(90, 120, 470, 400, C.light, 8) + r(90, 120, 470, 400, "rgba(255,255,255,.45)", 8) +
  r(90, 120, 470, 22, C.steel2, 8) + r(320, 142, 10, 378, C.steel) +
  /* 사다리 */
  g([r(0,0,13,330,C.wood), r(104,0,13,330,C.wood),
     r(0,66,117,10,C.wood2), r(0,156,117,10,C.wood2), r(0,246,117,10,C.wood2)].join(""), "translate(690,330)") +
  /* 사장님 */
  shadow(330, 662, 76) +
  figure({ x:330, y:660, h:370, body:C.burg, pants:C.ink, cap:C.ink, arm:"point" }) +
  /* 도면 · 페인트통 (앞) */
  g([ r(0,0,230,96,C.light,8), r(0,0,230,16,C.steel,8),
      r(24,36,170,8,C.steel2,4), r(24,58,120,8,C.steel2,4), r(24,80,150,8,C.steel2,4) ].join(""), "translate(880,660)") +
  g([ r(0,0,92,80,C.steel2,5), r(0,-12,92,18,C.steel3,5), r(30,-26,32,16,C.steel3,4) ].join(""), "translate(600,660)")
, C.paper);

S["sit-run"] = () => svg(1200, 900,
  room(1200, 900, 640, C.wall, C.floor) +
  showcase(680, 250, 470, 250) +
  /* 사람 먼저 */
  shadow(330, 642, 74) +
  figure({ x:330, y:640, h:380, body:C.light, pants:C.ink, apron:C.burg, arm:"fold" }) +
  /* 카운터 (앞) — 사람을 허리까지 가립니다 */
  counterFront(60, 560, 560, 340) +
  /* 카운터 위 POS · 장부 */
  g([ r(0,-130,150,108,C.ink,8), r(10,-120,130,76,C.glow,4),
      r(36,-22,78,12,C.ink2,4) ].join(""), "translate(420,560)") +
  g([ r(0,-34,180,34,C.light,4), r(16,-24,120,7,C.steel2,3), r(16,-12,80,7,C.steel2,3) ].join(""), "translate(130,560)")
, C.paper);

S["sit-solve"] = () => svg(1200, 900,
  room(1200, 900, 660, C.wall, C.floor) +
  tiles(0, 0, 1200, 660, 66) +
  /* 문 열린 냉장고 */
  g([ r(0,0,330,520,C.steel2,10), r(14,14,302,492,C.ink2,7),
      r(34,70,262,16,C.steel3,5), r(34,206,262,16,C.steel3,5), r(34,342,262,16,C.steel3,5),
      p("M330,0 L520,44 L520,476 L330,520 Z", C.steel),
      r(500, 208, 12, 104, C.steel3, 5) ].join(""), "translate(120,140)") +
  /* 새는 물 */
  [0,1,2].map(i => e(330+i*60, 668+(i%2?6:0), 30+i*5, 8, "rgba(107,36,54,.16)")).join("") +
  /* 기사님 */
  shadow(930, 662, 70) +
  figure({ x:930, y:660, h:360, body:C.ink, pants:C.ink2, cap:C.burg, arm:"point" }) +
  /* 공구 가방 (앞) */
  g([ r(0,0,230,132,C.burg,10), r(0,0,230,32,C.burg2,10), r(92,-32,46,36,C.ink,5) ].join(""), "translate(690,660)")
, C.paper);

S["sit-grow"] = () => svg(1200, 900,
  room(1200, 900, 720, C.wall2, C.floor) +
  /* 1호점 — 영업 중 */
  g([ r(0,0,450,470,C.wall),
      r(0,0,450,54,C.burg),
      r(40,84,170,300,C.light,4), r(240,84,170,300,C.light,4),
      r(240,84,170,300,"rgba(255,255,255,.4)",4),
      r(200,398,50,72,C.steel2,3) ].join(""), "translate(70,250)") +
  /* 2호점 — 공사 중 */
  g([ r(0,0,450,470,C.paper2),
      r(0,0,450,54,C.wall2),
      r(0,0,10,470,C.wood), r(216,0,10,470,C.wood), r(440,0,10,470,C.wood),
      r(0,120,450,10,C.wood2), r(0,280,450,10,C.wood2) ].join(""), "translate(680,250)") +
  /* 화살표 */
  p("M545,170 L600,170 L600,150 L655,185 L600,220 L600,200 L545,200 Z", C.burg) +
  shadow(300, 722, 76) +
  figure({ x:300, y:720, h:380, body:C.light, pants:C.ink, apron:C.burg, arm:"point" })
, C.paper);

S["sit-exit"] = () => svg(1200, 900,
  room(1200, 900, 720, C.wall2, C.floor) +
  /* 반쯤 내려온 셔터 */
  r(230, 150, 740, 64, C.steel3, 5) +
  [0,1,2,3,4].map(i => r(230, 214+i*40, 740, 34, i%2?C.steel:C.steel2, 3)).join("") +
  r(230, 414, 740, 16, C.steel3, 3) +
  r(270, 430, 660, 290, C.ink2) +
  /* ⚠️ 사장님을 어두운 칸(C.ink2) 위에 같은 색으로 두었더니 **통째로
     안 보였습니다.** 밝은 상의로 바꾸고 셔터 밖에 세웁니다. */
  shadow(170, 722, 68) +
  figure({ x:170, y:720, h:340, body:C.light, pants:C.ink, apron:C.burg, arm:"down" }) +
  boxes(700, 720, 6, 140, 92)
, C.paper);

/* ── 서비스 여섯 묶음 1440×900 ────────────────────────────── */
S["cat-meat"] = () => svg(1440, 900,
  room(1440, 900, 680, C.wall, C.floor) +
  /* 냉장 탑차 — 옆모습이라야 트럭으로 읽힙니다 */
  g([ r(0,0,640,330,C.light,10),                      /* 적재함 */
      r(0,0,640,34,C.steel2,8),
      r(520,60,110,230,C.paper2,6), r(576,60,8,230,C.steel),
      p("M640,90 L790,90 L850,180 L850,330 L640,330 Z", C.burg),  /* 운전석 */
      p("M676,116 L784,116 L818,180 L676,180 Z", C.light),
      r(0,330,850,26,C.ink2,4),
      c(170,384,44,C.ink), c(170,384,18,C.steel2),
      c(746,384,44,C.ink), c(746,384,18,C.steel2) ].join(""), "translate(60,270)") +
  boxes(1020, 680, 6, 150, 98) +
  /* 손수레 */
  g([ r(0,-16,18,220,C.steel3,5), r(0,196,170,18,C.steel3,5),
      c(32,228,24,C.ink), c(144,228,24,C.ink) ].join(""), "translate(1330,448)")
, C.paper);

S["cat-space"] = () => svg(1440, 900,
  room(1440, 900, 640, C.wall2, C.floor) +
  tiles(0, 110, 1440, 530, 72) +
  duct(0, 44, 1440, 66) +
  duct(330, 110, 64, 62) + duct(770, 110, 64, 62) + duct(1210, 110, 64, 62) +
  hood(190, 172, 340) + hood(630, 172, 340) + hood(1070, 172, 340) +
  table(170, 600, 380, 170) + table(630, 600, 380, 170) + table(1090, 600, 340, 170) +
  r(170, 664, 26, 106, C.wood2, 4) + r(524, 664, 26, 106, C.wood2, 4) +
  r(630, 664, 26, 106, C.wood2, 4) + r(984, 664, 26, 106, C.wood2, 4)
, C.paper);

S["cat-equip"] = () => svg(1440, 900,
  room(1440, 900, 660, C.wall, C.floor) +
  tiles(0, 40, 1440, 620, 80) +
  /* 육절기 */
  g([ r(0,-52,270,52,C.steel3,6), r(24,-250,222,198,C.steel2,10),
      c(135,-152,80,C.steel), c(135,-152,62,C.light), c(135,-152,13,C.steel3),
      r(242,-190,54,18,C.ink,5) ].join(""), "translate(150,640)") +
  /* 진공기 */
  g([ r(0,-150,330,150,C.steel2,10), r(20,-136,290,74,C.ink2,6),
      r(20,-52,180,22,C.steel3,5) ].join(""), "translate(560,640)") +
  /* 저울 */
  g([ r(0,-34,280,34,C.steel3,6), r(24,-152,232,118,C.steel2,8),
      r(50,-132,180,66,C.glow,5) ].join(""), "translate(990,640)") +
  /* 작업대 (앞) */
  r(60, 640, 1320, 26, C.steel2, 5) + r(96, 666, 24, 234, C.steel3) + r(1320, 666, 24, 234, C.steel3)
, C.paper);

S["cat-ops"] = () => svg(1440, 900,
  room(1440, 900, 680, C.wall, C.floor) +
  /* CCTV */
  g([ r(0,0,22,90,C.steel3,5), p("M-12,90 L124,68 L124,148 L-12,158 Z", C.light),
      c(108,112,18,C.ink) ].join(""), "translate(1180,120)") +
  /* POS */
  g([ r(0,-340,470,340,C.ink,14), r(20,-320,430,272,C.glow,9),
      r(66,-266,340,20,"rgba(0,0,0,.14)",5), r(66,-218,250,20,"rgba(0,0,0,.10)",5),
      r(66,-170,296,20,"rgba(0,0,0,.10)",5), r(170,-26,130,26,C.ink2,5) ].join(""), "translate(220,680)") +
  /* 카드 단말 */
  g([ r(0,-190,196,190,C.steel2,12), r(16,-174,164,100,C.ink2,7),
      r(34,-58,128,30,C.steel3,6) ].join(""), "translate(790,680)") +
  /* 키오스크 */
  g([ r(0,-420,200,420,C.steel2,12), r(16,-404,168,260,C.ink,8),
      r(34,-380,132,90,C.glow,5), r(50,-110,100,30,C.steel3,6) ].join(""), "translate(1080,680)") +
  /* 카운터 (앞) */
  counterFront(80, 680, 1280, 220)
, C.paper);

S["cat-grow"] = () => svg(1440, 900,
  room(1440, 900, 720, C.wall, C.floor) +
  [0,1,2,3,4].map(i => r(150+i*160, 640-i*102, 118, 80+i*102, i===4?C.burg:C.steel2, 9)).join("") +
  p("M130,490 L320,414 L510,336 L700,236 L880,128 L916,192 L716,306 L520,412 L336,492 L160,556 Z", C.burg2) +
  p("M862,94 L960,110 L928,200 Z", C.burg2) +
  /* 손전화 */
  g([ r(0,0,290,520,C.ink,32), r(16,40,258,442,C.light,14),
      r(44,80,202,124,C.paper2,9), r(44,230,202,22,C.steel2,7),
      r(44,274,134,22,C.steel2,7), r(44,336,202,66,C.burg,14) ].join(""), "translate(1080,270)")
, C.paper);

S["cat-pro"] = () => svg(1440, 900,
  room(1440, 900, 720, C.wall, C.floor) +
  /* 서류판 */
  g([ r(0,0,500,640,C.steel2,14), r(22,22,456,596,C.light,9),
      r(184,-20,132,48,C.steel3,9) ].join(""), "translate(150,150)") +
  [0,1,2,3,4].map(i => r(212, 240+i*94, 48, 48, i<3?C.paper2:C.paper2, 9)).join("") +
  [0,1,2,3,4].map(i => r(288, 258+i*94, 270-(i%2)*80, 17, C.steel2, 7)).join("") +
  [0,1,2].map(i => p(`M221,${264+i*94} L236,${280+i*94} L262,${248+i*94} L272,${259+i*94} L236,${299+i*94} L211,${275+i*94} Z`, C.burg)).join("") +
  /* 위생모 */
  g([ p("M0,74 C0,16 58,-14 110,-14 C162,-14 220,16 220,74 L220,92 L0,92 Z", C.light),
      r(0,92,220,26,C.steel,7) ].join(""), "translate(800,300)") +
  /* 장갑 — 손가락이 보여야 장갑으로 읽힙니다 */
  g([ p("M0,190 L0,86 C0,74 18,74 18,86 L18,140 L18,40 C18,26 38,26 38,40 L38,138 L38,22 C38,8 58,8 58,22 L58,138 L58,34 C58,20 78,20 78,34 L78,150 L96,116 C104,100 122,110 116,126 L92,196 L92,262 L0,262 Z", C.light),
      r(0,258,92,30,C.burg,7) ].join(""), "translate(1120,352)")
, C.paper);

/* ── 세로 ──────────────────────────────────────────────────── */
S.worry = () => svg(900, 1200,
  room(900, 1200, 1000, C.wall, C.floor) +
  showcase(20, 210, 560, 330) +
  lamp(740, 30, 300, 78) +
  /* 사장님 — 카운터 뒤에 서서 상반신만 보입니다. 세로 칸이라
     전신을 넣으면 사람이 손톱만 해집니다. */
  shadow(330, 1002, 96) +
  figure({ x:330, y:1000, h:700, body:C.light, pants:C.ink, apron:C.burg, arm:"fold" }) +
  /* 카운터 (앞) */
  counterFront(0, 820, 900, 380) +
  /* 쌓인 고지서 · 계산기 */
  [0,1,2].map(i => r(560+i*14, 762+i*18, 250, 32, C.light, 6)).join("") +
  g([ r(0,0,120,86,C.ink,8), r(12,10,96,30,C.glow,4),
      r(14,50,26,12,C.ink2,3), r(48,50,26,12,C.ink2,3), r(82,50,26,12,C.ink2,3),
      r(14,68,26,12,C.ink2,3), r(48,68,26,12,C.ink2,3), r(82,68,26,12,C.burg,3) ].join(""), "translate(120,734)")
, C.paper);

S.partner = () => svg(960, 1200,
  room(960, 1200, 920, C.wall2, C.floor) +
  tiles(0, 90, 960, 830, 84) +
  duct(600, 90, 320, 74) +
  hood(540, 164, 380) +
  shadow(370, 922, 96) +
  figure({ x:370, y:920, h:600, body:C.burg, pants:C.ink, cap:C.ink, arm:"point" }) +
  g([ r(0,0,250,142,C.ink,11), r(0,0,250,34,C.ink2,11), r(100,-34,50,38,C.steel3,6) ].join(""), "translate(620,778)")
, C.paper);

module.exports = S;
