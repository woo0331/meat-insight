/* ════════════════════════════════════════════════════════════════════
   홈 정리 — 첫 화면은 "무엇이 필요한가"만

   홈에 구간이 12개 세로로 쌓여 있어, 처음 온 사람이 어디부터 봐야 할지
   알 수 없었습니다. 지우지 않고 **접습니다.**

   펼친 채로 두는 것
     검색 · 8분야 · 실시간 요청 · 오늘 시세 — 요청자와 업체가
     매번 보러 오는 것들입니다.

   접어 두는 것
     이용 프로세스 · 소식·정보 — 한 번 읽으면 되는 설명과 참고 자료라,
     제목만 남기고 접습니다. 눌러서 편 상태는 이 기기에 기억합니다.

   접는 것도 삭제가 아닙니다. 안의 위젯·이벤트는 그대로 있고 화면에서
   숨겨져 있을 뿐이라, 펼치면 원래대로 동작합니다.
   ════════════════════════════════════════════════════════════════════ */

var HM_KEY="gori.homeOpen";

/* 접을 구간 — [찾을 제목, 저장 키, 접었을 때 보여줄 한 줄] */
var HM_FOLD=[
  ["고리 이용 프로세스","proc","요청 등록부터 거래 완료·후기까지 7단계"],
  ["고리 소식 · 정보","info","시세 · 매물 · 업계 뉴스 · 커뮤니티"]
];

function hmOpen(key){
  try{
    var raw=localStorage.getItem(HM_KEY);
    if(!raw) return false;
    return JSON.parse(raw)[key]===true;
  }catch(e){ return false; }
}
function hmSave(key, on){
  try{
    var o={};
    try{ o=JSON.parse(localStorage.getItem(HM_KEY)||"{}"); }catch(e){}
    o[key]=!!on;
    localStorage.setItem(HM_KEY, JSON.stringify(o));
  }catch(e){}
}

window.gHomeFold=function(key){
  var sec=document.querySelector('.hm-fold[data-k="'+key+'"]');
  if(!sec) return;
  var on=!sec.classList.contains("open");
  sec.classList.toggle("open", on);
  var btn=sec.querySelector(".hm-fold-btn");
  if(btn){
    btn.setAttribute("aria-expanded", on?"true":"false");
    btn.querySelector(".hm-fold-l").textContent = on ? "접기" : "펼쳐 보기";
  }
  hmSave(key, on);
};

/* 제목으로 구간을 찾습니다 — 마크업 구조에 기대지 않으려고요 */
function hmFind(title){
  var found=null;
  [].slice.call(document.querySelectorAll("#pg-h .sec-h2, #pg-h .sec-h"))
    .forEach(function(h){
      if(found) return;
      if(h.textContent.replace(/\s+/g," ").trim().indexOf(title)===0){
        found=h.closest("section") || h.closest(".sec") ||
              (h.parentNode && h.parentNode.parentNode && h.parentNode.parentNode.parentNode);
      }
    });
  return found;
}

function hmFoldOne(title, key, sub){
  var sec=hmFind(title);
  if(!sec || sec.classList.contains("hm-fold")) return;

  /* 접을 몸통 = 제목 줄을 뺀 나머지 직계 자식들.
     안쪽까지 훑으면 안 됩니다 — 이미 담아 둔 칸을 통째로 집어 날립니다. */
  var w=sec.querySelector(".w") || sec;
  var hd=w.querySelector(".sec-hd2, .sec-hd");
  if(!hd) return;
  var body=[].slice.call(w.children).filter(function(c){ return c!==hd; });
  if(!body.length) return;

  var box=document.createElement("div");
  box.className="hm-fold-body";
  body.forEach(function(c){ box.appendChild(c); });
  w.appendChild(box);

  var open=hmOpen(key);
  sec.classList.add("hm-fold");
  sec.setAttribute("data-k", key);
  if(open) sec.classList.add("open");

  var btn=document.createElement("button");
  btn.className="hm-fold-btn";
  btn.type="button";
  btn.setAttribute("aria-expanded", open?"true":"false");
  btn.setAttribute("onclick", "gHomeFold('"+key+"')");
  btn.innerHTML='<span class="hm-fold-l">'+(open?"접기":"펼쳐 보기")+'</span>'+
    '<span class="hm-fold-c" aria-hidden="true">'+
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
    'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></span>';

  hd.classList.add("hm-fold-hd");
  hd.appendChild(btn);

  /* 접힌 동안 뭐가 들어 있는지 한 줄로 알려 줍니다 */
  if(sub && !hd.querySelector(".sec-d2")){
    var p=document.createElement("p");
    p.className="sec-d2"; p.textContent=sub;
    hd.insertBefore(p, btn);
  }
}

function patchHome(){
  if(G._home) return; G._home=true;
  HM_FOLD.forEach(function(f){
    try{ hmFoldOne(f[0], f[1], f[2]); }catch(e){}
  });
}
