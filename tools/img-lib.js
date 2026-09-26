/* 그림 조각 — 장면들이 같이 씁니다.
   ⚠️ 면(fill)만 씁니다. 선으로 그리면 줄이면 사라지고 키우면 도드라집니다. */
/* ⚠️ 2026-09-26 — **베이지를 걷어냈습니다.** 벽·바닥·강철이 전부
   누런 갈색이라 그림이 통째로 탁하고 오래돼 보였습니다. 기준 화면의
   그림은 **밝은 중성 바탕에 색이 몇 점**입니다.
   ⚠️ 색은 고기(meat)·브랜드(burg)·나무(wood) **세 가지만** 씁니다.
   나머지는 전부 회색 단계입니다 — 색을 늘리면 다시 탁해집니다. */
const C = {
  paper:"#F7F8FA", paper2:"#EDEFF4", wall:"#F1F2F6", wall2:"#E5E7EE",
  floor:"#DCDFE7", light:"#FFFFFF", white:"#FFFFFF",
  ink:"#2A2A31",  ink2:"#55555F",  ink3:"#9A9AA5",
  steel:"#CFD3DC", steel2:"#B7BCC8", steel3:"#969CAA",
  burg:"#6B2436", burg2:"#8C3A4C", burg3:"#A95566",
  meat:"#B04A52", meat2:"#CE757E",
  wood:"#C9955F", wood2:"#A87749",
  glow:"#F2D9AE"
};

const r  = (x,y,w,h,f,rd) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${rd?` rx="${rd}"`:""}/>`;
const c  = (cx,cy,rr,f) => `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="${f}"/>`;
const e  = (cx,cy,rx,ry,f) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}"/>`;
const p  = (d,f) => `<path d="${d}" fill="${f}"/>`;
const g  = (inner, tf) => `<g${tf?` transform="${tf}"`:""}>${inner}</g>`;

/* 사람 — 앞모습 실루엣. 얼굴은 그리지 않습니다.
   얼굴을 그리는 순간 "누구" 가 되고, 그러면 우리 손님이 아닌 사람이
   됩니다. 밑변(발끝)이 y=0, 키 h. */
function figure(o){
  o = o || {};
  const h = o.h || 300;
  const s = h / 300;
  const body  = o.body  || C.ink;       /* 상의 */
  const pants = o.pants || C.ink2;      /* 하의 */
  const apron = o.apron;                /* 앞치마 (없으면 안 그림) */
  const cap   = o.cap;                  /* 모자 */
  const skin  = o.skin || C.ink2;
  const arm   = o.arm || "down";        /* down · up · fold · point */

  let a = "";
  if(arm === "up")
    a = p("M-46,-214 L-62,-150 L-52,-100 L-34,-104 L-40,-150 L-30,-206 Z", body)
      + p("M46,-214 L70,-250 L84,-238 L60,-196 L44,-190 Z", body);
  else if(arm === "fold")
    a = p("M-46,-212 L-56,-168 L-8,-152 L44,-160 L48,-178 L0,-176 L-30,-190 Z", body);
  else if(arm === "point")
    a = p("M-46,-214 L-62,-150 L-52,-100 L-34,-104 L-40,-150 L-30,-206 Z", body)
      + p("M46,-212 L96,-186 L92,-170 L40,-184 Z", body);
  else
    a = p("M-46,-214 L-60,-146 L-48,-96 L-30,-100 L-38,-146 L-28,-206 Z", body)
      + p("M46,-214 L60,-146 L48,-96 L30,-100 L38,-146 L28,-206 Z", body);

  const parts = [
    /* 다리 */
    p("M-36,-130 L-32,-6 L-4,-6 L-4,-130 Z", pants),
    p("M4,-130 L4,-6 L32,-6 L36,-130 Z", pants),
    r(-38,-8,38,8,C.ink), r(2,-8,38,8,C.ink),
    /* 몸통 */
    p("M-44,-222 C-44,-246 -22,-256 0,-256 C22,-256 44,-246 44,-222 L48,-120 L-48,-120 Z", body),
    a,
    /* 목·머리 */
    r(-11,-272,22,22,skin),
    c(0,-286,27,skin),
    cap ? p("M-29,-292 C-29,-312 -14,-322 0,-322 C14,-322 29,-312 29,-292 L29,-286 L-29,-286 Z", cap) : "",
    apron ? p("M-30,-244 L30,-244 L38,-126 L-38,-126 Z", apron) : "",
    apron ? p("M-18,-250 L-12,-236 L12,-236 L18,-250 L6,-252 L0,-242 L-6,-252 Z", apron) : "",
    /* ⚠️ 오른쪽에 그늘 한 장. 빛이 왼쪽 위에서 온다고 치고 몸통·앞치마·
       다리에 같은 방향으로 깔아야 합니다 — 방향이 섞이면 더 이상해집니다. */
    p("M10,-256 C26,-254 44,-244 44,-222 L48,-120 L38,-126 L30,-244 Z",
      "rgba(58,44,36,.13)"),
    p("M12,-130 L12,-6 L32,-6 L36,-130 Z", "rgba(58,44,36,.10)"),
    /* 머리 아래 목그늘 */
    e(0,-262,13,5,"rgba(58,44,36,.16)")
  ].join("");
  return g(parts, `translate(${o.x||0},${o.y||0}) scale(${s})`);
}

/* 쇼케이스 — 정육점의 얼굴입니다 */
function showcase(x, y, w, hh){
  const gl = hh * .52;
  return g([
    r(0, 0, w, hh, C.steel2, 4),
    r(4, 4, w-8, gl, C.light, 3),
    r(4, 4, w-8, gl, "rgba(255,255,255,.55)", 3),
    r(10, 4+gl-26, w-20, 22, C.paper2, 2),
    /* 쟁반 위의 고기 — 덩어리가 아니라 **쟁반**이 주인공입니다 */
    r(20, 4+gl-44, (w-40)/3-8, 18, C.white, 3),
    r(20+ (w-40)/3, 4+gl-44, (w-40)/3-8, 18, C.white, 3),
    r(20+ 2*(w-40)/3, 4+gl-44, (w-40)/3-8, 18, C.white, 3),
    e(20+((w-40)/3-8)/2, 4+gl-44, ((w-40)/3-8)/2-6, 6, C.meat),
    e(20+(w-40)/3+((w-40)/3-8)/2, 4+gl-44, ((w-40)/3-8)/2-6, 6, C.meat2),
    e(20+2*(w-40)/3+((w-40)/3-8)/2, 4+gl-44, ((w-40)/3-8)/2-6, 6, C.meat),
    r(0, gl+8, w, 6, C.steel3),
    r(0, gl+14, w, hh-gl-14, C.steel, 0),
    /* ⚠️ 빛은 왼쪽 위에서 옵니다. 유리에 비스듬한 빛줄 하나, 아래
       몸통에는 오른쪽으로 갈수록 그늘. 방향을 섞지 마세요. */
    p(`M${w*.08},4 L${w*.30},4 L${w*.12},${4+gl} L${-w*.10+w*.02},${4+gl} Z`,
      "rgba(255,255,255,.45)"),
    r(w*.62, gl+14, w*.38, hh-gl-14, "rgba(58,44,36,.10)"),
    r(0, hh-7, w, 7, "rgba(58,44,36,.14)")
  ].join(""), `translate(${x},${y})`);
}

/* 후드 · 덕트 — 고깃집에서 제일 중요한 설비 */
function hood(x, y, w){
  return g([
    p(`M0,0 L${w},0 L${w-26},46 L26,46 Z`, C.steel2),
    r(26, 46, w-52, 10, C.steel3),
    r(w/2-22, -54, 44, 54, C.steel)
  ].join(""), `translate(${x},${y})`);
}
function duct(x, y, w, h2){
  return g([
    r(0, 0, w, h2, C.steel),
    r(0, 6, w, 4, C.steel3), r(0, h2-10, w, 4, C.steel3),
    r(w/2-4, 0, 8, h2, "rgba(255,255,255,.25)")
  ].join(""), `translate(${x},${y})`);
}

function fridge(x, y, w, hh, open){
  return g([
    r(0,0,w,hh, C.steel2, 5),
    open ? r(4,4,w-8,hh-8, C.ink2, 4) : r(4,4,w-8,hh-8, C.steel, 4),
    open ? "" : r(w-16, hh*.3, 6, hh*.4, C.steel3, 3),
    open ? g([r(0,0,w*.9,hh, C.steel2, 5), r(4,4,w*.9-8,hh-8, C.steel,4),
              r(10, hh*.3, 6, hh*.4, C.steel3,3)].join(""),
             `translate(${w-6},0) skewY(0)`) : "",
    /* 문짝의 빛과 그늘 */
    open ? "" : r(8, 8, w*.22, hh-16, "rgba(255,255,255,.34)", 3),
    open ? "" : r(w*.66, 8, w*.28, hh-16, "rgba(58,44,36,.09)", 3),
    r(0, hh-6, w, 6, "rgba(58,44,36,.14)", 3)
  ].join(""), `translate(${x},${y})`);
}

function boxes(x, y, n, w, hh, tone){
  let out = "";
  for(let i=0;i<n;i++){
    const bx = (i%2)*(w+10), by = -Math.floor(i/2)*(hh+6);
    out += r(bx, by-hh, w, hh, i%2 ? (tone||C.wood) : (tone||C.wood2), 3)
         + r(bx, by-hh, w*.18, hh, "rgba(255,255,255,.22)", 3)
         + r(bx+w*.72, by-hh, w*.28, hh, "rgba(58,44,36,.12)", 3)
         + r(bx+w*.18, by-hh+hh*.34, w*.64, 8, "rgba(255,255,255,.28)", 2);
  }
  return g(out, `translate(${x},${y})`);
}

function table(x, y, w, hh){
  return g([
    r(0, 0, w, 12, C.wood, 3),
    /* ⚠️ 상판에 **두께**가 없으면 널빤지가 떠 있는 것처럼 보입니다.
       밑면을 한 단 어둡게 깔아 주면 그것만으로 두꺼워 보입니다. */
    r(0, 10, w, 5, "rgba(58,44,36,.18)"),
    r(0, 0, w, 4, "rgba(255,255,255,.30)", 3),
    r(6, 15, 8, hh-15, C.wood2), r(w-14, 15, 8, hh-15, C.wood2),
    r(w-14, 15, 3, hh-15, "rgba(58,44,36,.14)"),
    e(w/2, 6, 26, 9, C.ink)               /* 가운데 로스터 */
  ].join(""), `translate(${x},${y})`);
}

function facade(x, y, w, hh, o){
  o = o || {};
  return g([
    r(0, 0, w, hh, o.wall || C.wall),
    r(0, 0, w, 26, C.burg),                              /* 간판 자리 */
    r(w*.14, 46, w*.34, hh-46, o.glass || C.light, 3),   /* 창 */
    r(w*.56, 46, w*.3, hh-46, o.glass || C.light, 3),
    r(w*.56, 46, w*.3, hh-46, "rgba(255,255,255,.4)", 3),
    o.door === false ? "" : r(w*.5-16, hh-72, 32, 72, C.steel2, 2)
  ].join(""), `translate(${x},${y})`);
}

/* 발밑 그림자 — 없으면 사람이 **공중에 떠 있는 것처럼** 보입니다 */
function shadow(x, y, w){
  return e(x, y, w, w*.16, "rgba(51,44,42,.13)");
}

/* ── 입체감 ────────────────────────────────────────────────
   ⚠️ 면만 칠하면 스티커처럼 납작합니다. **빛이 위에서 온다**고 치고
   두 겹을 덮습니다 — 위에서 내려오는 옅은 빛, 아래에 깔리는 옅은 그늘.
   이것만으로 같은 그림이 공간 안에 있는 것처럼 읽힙니다.

   ⚠️ **색이 바뀌는 그라디언트는 금지**입니다 (지시서 30번). 여기 있는
   것은 흰색과 갈색의 투명도만 바뀌는 것이라 색이 바뀌지 않습니다.
   ⚠️ 값을 올리지 마세요. 그림이 뿌옇게 바래 보입니다. */
const SHADE =
  '<defs>'+
    '<linearGradient id="gTop" x1="0" y1="0" x2="0" y2="1">'+
      '<stop offset="0" stop-color="#FFFFFF" stop-opacity=".30"/>'+
      '<stop offset=".48" stop-color="#FFFFFF" stop-opacity="0"/>'+
    '</linearGradient>'+
    '<linearGradient id="gBot" x1="0" y1="0" x2="0" y2="1">'+
      '<stop offset=".55" stop-color="#3A2C24" stop-opacity="0"/>'+
      '<stop offset="1" stop-color="#3A2C24" stop-opacity=".13"/>'+
    '</linearGradient>'+
    /* 모서리를 살짝 눌러 주면 가운데가 떠 보입니다 */
    '<radialGradient id="gVig" cx=".5" cy=".46" r=".75">'+
      '<stop offset=".62" stop-color="#3A2C24" stop-opacity="0"/>'+
      '<stop offset="1" stop-color="#3A2C24" stop-opacity=".10"/>'+
    '</radialGradient>'+
  '</defs>';

function svg(w, hh, inner, bg){
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${hh}" width="${w}" height="${hh}" role="img">`+
    /* ⚠️ 한때 그림 **전체**에 빛·그늘·모서리 눌림을 덮었습니다. 입체감
       대신 **사진에 필터 씌운 것 같은 인위적인 느낌**이 났습니다 —
       걷어냈습니다. 입체감은 조각마다(쇼케이스 유리, 문짝, 상판 두께)
       넣습니다. 되살리지 마세요. */
    r(0,0,w,hh, bg || C.paper) + inner +
    `</svg>\n`;
}

module.exports = { C, r, c, e, p, g, figure, shadow, showcase, hood, duct, fridge, boxes, table, facade, svg };
