/* ════════════════════════════════════════════════════════════════════
   관리자 — 상품 데이터 편집기

   이 사이트에는 서버가 없습니다. 그래서 이 화면은 **DB 를 고치는 것이
   아니라 `js/data/products.js` 파일을 만들어 주는 도구**입니다.

     1. 여기서 상품을 넣고 고칩니다 (작업 중인 내용은 브라우저에 남습니다)
     2. "파일 내보내기" 를 누르면 products.js 가 받아집니다
     3. 그 파일로 js/data/products.js 를 덮어쓰고 올리면 사이트에 반영됩니다

   ⚠️ **여기서 고친다고 사이트가 바로 바뀌지 않습니다.** 3번까지 해야
   합니다. 브라우저에만 저장해 두고 반영됐다고 착각하면, 상품을 쉰 개
   넣어 놓고 사이트는 그대로인 일이 생깁니다.

   ⚠️ 이 파일은 손님 화면이 아닙니다. 하지만 **정적 파일이라 주소를 알면
   누구나 열 수 있습니다.** 여기서 할 수 있는 일은 파일을 만드는 것뿐이고
   사이트를 바꾸지는 못하므로 보안 경계가 아닙니다 — 비밀번호를 화면
   코드에 박아 두는 것은 잠갔다는 착각만 줍니다. robots.txt 로 색인에서만
   빼 두었습니다.
   ════════════════════════════════════════════════════════════════════ */

var AD = { tab:"list", edit:null, dirty:false };
var KEY = "wow.admin.products";
var BKEY = "wow.admin.biz";

/* 작업 중인 내용 — 원본(products.js)을 기준으로 시작하고,
   브라우저에 저장해 둔 것이 있으면 그것을 씁니다. */
var P = [];
function loadWork(){
  var saved = null;
  try{ saved = JSON.parse(localStorage.getItem(KEY) || "null"); }catch(e){}
  P = (saved && saved.length) ? saved : JSON.parse(JSON.stringify(WOW_PRODUCTS));
}
function saveWork(){
  try{ localStorage.setItem(KEY, JSON.stringify(P)); }catch(e){
    toast("브라우저에 저장하지 못했습니다. 작업을 잃기 전에 파일로 내보내 주세요.");
  }
  AD.dirty = true; paintAdmin();
}
function resetWork(){
  if(!confirm("지금 편집 중인 내용을 버리고 현재 사이트의 상품으로 되돌립니다. 계속할까요?")) return;
  try{ localStorage.removeItem(KEY); }catch(e){}
  AD.dirty = false; loadWork(); paintAdmin();
  toast("현재 사이트의 상품으로 되돌렸습니다.");
}

/* ── 검사 ───────────────────────────────────────────────
   여기가 이 도구의 값어치입니다. 잘못된 데이터를 넣으면 손님 화면이
   조용히 깨집니다 — 이미 실제로 겪은 것들입니다:
     · 이미지 이름이 한 글자 다르면 카드가 빈 상자가 됩니다
     · 분류가 categories.js 에 없으면 그 상품은 어느 목록에도 안 뜹니다
     · id 가 겹치면 뒤엣것이 영영 안 열립니다                       */
var IMG_KNOWN = ["p-gopchang","p-daechang","p-makchang","p-yang","p-beolzip","p-cheonyeop",
  "p-yeomtong","p-gan","p-heopa","p-jira","p-kongpat","p-useol",
  "t-gopchang","t-daechang","t-makchang","t-cheonyeop",
  "e-gopchang","e-daechang","e-makchang","e-yang","e-beolzip","e-cheonyeop",
  "e-yeomtong","e-gan","e-heopa","e-jira","e-kongpat","e-useol",
  "detail-gopchang","detail-thumb1","detail-thumb2","detail-thumb3","detail-thumb4"];

function imgExists(name, cb){
  if(!name) return cb(false);
  if(IMG_KNOWN.indexOf(name) >= 0) return cb(true);
  /* 목록에 없어도 실제로 있으면 통과입니다 — 새로 넣은 사진을
     "없다" 고 막으면 안 됩니다. */
  var im = new Image();
  im.onload = function(){ cb(true); };
  im.onerror = function(){ cb(false); };
  im.src = "img/" + name + (/^[qe]-/.test(name) ? ".png" : ".jpg");
}

function validate(p, idx){
  var e = [];
  if(!p.id)                         e.push("id 가 비었습니다");
  else if(!/^[a-z0-9][a-z0-9-]*$/.test(p.id))
                                    e.push("id 는 영문 소문자·숫자·하이픈만 쓸 수 있습니다 (주소에 그대로 들어갑니다)");
  else if(P.some(function(x,i){ return i!==idx && x.id===p.id; }))
                                    e.push("id 가 다른 상품과 겹칩니다");
  if(!p.name)                       e.push("상품명이 비었습니다");
  if(!(Number(p.price) > 0))        e.push("가격은 0보다 큰 숫자여야 합니다");
  if(!WOW_CATS[p.sp])               e.push("축종 구분(sp)이 잘못됐습니다");
  else{
    var cat = WOW_CATS[p.sp].find(function(c){ return c.slug===p.cat; });
    if(!cat)                        e.push("분류가 categories.js 에 없습니다 — 이 상품은 어느 목록에도 안 뜹니다");
    else if(p.item && !cat.items.some(function(i){ return i.slug===p.item; }))
                                    e.push("세부 품목이 그 분류 안에 없습니다");
  }
  if(!p.img)                        e.push("사진이 비었습니다 — 카드가 빈 상자가 됩니다");
  if(p.breed && !WOW_BREED[p.breed])e.push("축종 값이 잘못됐습니다");
  if(p.temp && !WOW_TEMP[p.temp])   e.push("냉장/냉동 값이 잘못됐습니다");
  if(p.trim && !WOW_TRIM[p.trim])   e.push("손질 상태 값이 잘못됐습니다");
  if(p.rating && (p.rating<0 || p.rating>5)) e.push("평점은 0~5 입니다");

  /* ⚠️ 경고는 오류와 **따로** 모읍니다. 예전에는 `e.push(글, "warn")` 으로
     넣었는데, push 는 인자를 둘 다 배열에 넣습니다 — 경고가 오류로 세어져
     내보내기가 통째로 막혔습니다. */
  var w = [];
  if(Number(p.reviews) > 0)
    w.push("후기 수를 "+p.reviews+" 로 적어 두면 상세에 \"("+p.reviews+"개 리뷰)\" 라고 나옵니다. "+
           "실제 후기가 쌓이기 전에는 0 으로 두세요 — 없는 후기를 있다고 적는 셈입니다.");
  if((p.badges||[]).indexOf("sale")>=0)
    w.push("특가 배지를 달았습니다. 가격도 실제로 내렸는지 확인하세요 — 배지만 달면 손님에게 거짓말이 됩니다.");
  if(p.today)
    w.push("\"오늘 들어온 부산물\" 에 올라갑니다. 오늘 작업한 것이 맞는지 확인하세요.");

  return { errors:e, warns:w };
}
function errorsOf(p, i){ return validate(p,i).errors; }
function warnsOf(p, i){ return validate(p,i).warns; }

/* ── 내보내기 ─────────────────────────────────────────── */
function exportProducts(){
  var bad = [];
  P.forEach(function(p,i){ var e=errorsOf(p,i); if(e.length) bad.push((p.name||p.id||"("+(i+1)+"번째)")+" — "+e[0]); });
  if(bad.length){
    alert("고칠 것이 남아 있습니다. 이대로 내보내면 손님 화면이 깨집니다.\n\n" + bad.slice(0,8).join("\n"));
    return;
  }
  download("products.js", buildProductsFile());
  toast("products.js 를 받았습니다. js/data/products.js 를 이 파일로 덮어쓰고 올리세요.");
}

function buildProductsFile(){
  var head =
"/* ════════════════════════════════════════════════════════════════════\n"+
"   상품 데이터 — 화면과 분리 (지시서 10·24번)\n"+
"\n"+
"   ⚠️ 이 파일은 admin.html 에서 만들어졌습니다 ("+new Date().toISOString().slice(0,10)+").\n"+
"   손으로 고쳐도 되지만, 다음에 admin 에서 내보내면 덮어씁니다.\n"+
"\n"+
"   price  : 원/kg\n"+
"   trim   : raw(원물) / wash(1차 세척) / full(완전 손질) / clean / cut / boil\n"+
"   temp   : chill(냉장) / frozen(냉동)\n"+
"   badges : new / best / sale\n"+
"   ════════════════════════════════════════════════════════════════════ */\n\n"+
"window.WOW_TRIM  = " + js(WOW_TRIM) + ";\n"+
"window.WOW_TEMP  = " + js(WOW_TEMP) + ";\n"+
"window.WOW_BREED = " + js(WOW_BREED) + ";\n\n"+
"window.WOW_PRODUCTS = [\n";

  var body = P.map(function(p){
    var o = {};
    ["id","sp","cat","item","name","breed","origin","price","temp","trim","img",
     "badges","soldOut","today","rating","reviews","units","trims","uses","workDate","detail"]
      .forEach(function(k){
        var v = p[k];
        if(v===undefined || v===null || v==="") return;
        if(Array.isArray(v) && !v.length) return;
        if((k==="today"||k==="soldOut") && !v) return;
        if((k==="rating"||k==="reviews") && !Number(v)) return;
        o[k] = v;
      });
    return "  " + js(o);
  }).join(",\n");

  var tail = "\n];\n\n" +
"/* ── 조회 도우미 — 화면은 이것만 부릅니다 ──────────────── */\n"+
"window.wowProduct = function(id){\n"+
"  return WOW_PRODUCTS.find(function(p){ return p.id===id; }) || null;\n"+
"};\n"+
"window.wowFind = function(q){\n"+
"  q = q || {};\n"+
"  return WOW_PRODUCTS.filter(function(p){\n"+
"    if(q.sp    && p.sp   !== q.sp)   return false;\n"+
"    if(q.cat   && p.cat  !== q.cat)  return false;\n"+
"    if(q.item  && p.item !== q.item) return false;\n"+
"    if(q.today && !p.today)          return false;\n"+
"    if(q.breed && q.breed.length && q.breed.indexOf(p.breed)<0) return false;\n"+
"    if(q.temp  && q.temp.length  && q.temp.indexOf(p.temp)<0)   return false;\n"+
"    if(q.trim  && q.trim.length  && q.trim.indexOf(p.trim)<0)   return false;\n"+
"    if(q.use   && q.use.length   && !q.use.some(function(u){ return (p.uses||[]).indexOf(u)>=0; })) return false;\n"+
"    if(q.text){\n"+
"      var t=(p.name+\" \"+p.origin+\" \"+(p.uses||[]).join(\" \")).toLowerCase();\n"+
"      if(t.indexOf(String(q.text).toLowerCase())<0) return false;\n"+
"    }\n"+
"    return true;\n"+
"  });\n"+
"};\n"+
"/* 가격은 원/kg 입니다. 천 단위 구분만 하고 **반올림하지 않습니다** —\n"+
"   사업자가 단가를 그대로 계산에 씁니다. */\n"+
"window.wowWon = function(n){ return Number(n||0).toLocaleString(\"ko-KR\"); };\n";

  return head + body + tail;
}

/* 한 줄 JSON — 사람이 읽을 수 있게 키 사이만 띄웁니다 */
function js(o){
  return JSON.stringify(o)
    .replace(/","/g, '", "')
    .replace(/,"/g, ', "')
    .replace(/":/g, '": ');
}

function download(name, text){
  var b = new Blob([text], { type:"text/javascript;charset=utf-8" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(b); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/* ── 사업자 정보 ────────────────────────────────────────── */
var BIZ_FIELDS = [
  ["company","상호","법인명 또는 개인사업자 상호", true],
  ["ceo","대표자 성명","", true],
  ["brn","사업자등록번호","000-00-00000", true],
  ["mailOrder","통신판매업 신고번호","제0000-지역-0000호", true],
  ["address","사업장 주소","", true],
  ["phone","고객센터 전화","", true],
  ["email","문의 이메일","", true],
  ["hours","상담 시간","예: 평일 09:00~18:00", false],
  ["meatLicense","축산물 영업신고번호","축산물 위생관리법상 영업신고 번호", false],
  ["haccp","HACCP 인증번호","", false],
  ["privacyOfficer","개인정보 보호책임자","직책·성명 (개인정보보호법 제31조)", true],
  ["privacyEmail","개인정보 문의 이메일","비우면 위 문의 이메일을 씁니다", false],
  ["privacyPhone","개인정보 문의 전화","비우면 위 고객센터를 씁니다", false],
  ["hostRegion","개인정보 보관 리전","예: 서울", false],
  /* ⚠️ 여기에 주소를 적는다고 접수가 되는 것이 아닙니다. 실제 접수는
     Vercel 환경변수(QUOTE_WEBHOOK_URL 또는 RESEND_API_KEY·
     QUOTE_EMAIL_TO)가 합니다. 이 칸은 **그 설정을 마쳤다는 표시**라,
     비어 있으면 견적 화면 맨 위에 "지금은 이 양식으로 접수하지
     못합니다" 안내가 뜹니다. */
  ["quoteTo","대량견적 접수처","받을 주소 — Vercel 환경변수 설정을 마친 뒤에 적으세요", false],
  ["effective","약관·방침 시행일","YYYY-MM-DD", true],

  /* ── 배송 ───────────────────────────────────────────────
     신선식품이라 이 셋이 구매를 정합니다. 비어 있으면 상품 상세와
     장바구니에서 배송 안내가 **아예 안 나옵니다.** */
  ["shipCutoff","주문 마감 시간","예: 오후 3시 — 이때까지 주문하면 당일 작업", false],
  ["shipNote","배송 안내","예: 당일 작업 · 익일 냉장 도착", false],
  ["shipExclude","배송 제한 지역","예: 제주·도서산간 제외", false],
  ["shipFee","배송비 (원)","3000 — 숫자만", false],
  ["shipFreeOver","무료배송 기준 (원)","100000 — 이 금액 이상이면 무료", false],

  /* ── 무통장입금 계좌 ────────────────────────────────────
     ⚠️ **이 셋을 채워야 손님이 주문할 수 있습니다.** 하나라도 비면
     주문서에 결제수단이 하나도 없어서 "지금은 주문을 받지 못합니다"
     가 나옵니다 — 계좌를 모르는 채로 "입금해 주세요" 라고 할 수는
     없기 때문입니다. */
  ["bankName","입금 은행 ⚑","예: 국민은행 — 셋을 다 채워야 주문을 받습니다", false],
  ["bankAccount","계좌번호 ⚑","숫자와 하이픈 그대로 (손님이 보고 옮겨 적습니다)", false],
  ["bankHolder","예금주 ⚑","입금자명 확인에 씁니다", false]
];
var B = {};
function loadBiz(){
  var saved=null;
  try{ saved = JSON.parse(localStorage.getItem(BKEY) || "null"); }catch(e){}
  B = saved || JSON.parse(JSON.stringify(WOW_BIZ));
}
function saveBiz(){
  try{ localStorage.setItem(BKEY, JSON.stringify(B)); }catch(e){}
  paintAdmin();
}
function exportBiz(){
  var miss = BIZ_FIELDS.filter(function(f){ return f[3] && !String(B[f[0]]||"").trim(); });
  if(miss.length && !confirm(
      "필수 항목이 "+miss.length+"개 비어 있습니다:\n"+miss.map(function(f){return "· "+f[1];}).join("\n")+
      "\n\n전자상거래법 제10조·개인정보보호법 제31조 표시 의무입니다.\n"+
      "빈 항목은 화면에서 줄째 빠집니다. 이대로 내보낼까요?")) return;

  var out =
"/* ════════════════════════════════════════════════════════════════════\n"+
"   사업자 정보 · 사이트 설정 — 한 곳에만 둡니다\n"+
"\n"+
"   ⚠️ 이 파일은 admin.html 에서 만들어졌습니다 ("+new Date().toISOString().slice(0,10)+").\n"+
"   여기 채운 값이 푸터 · 이용약관 · 개인정보처리방침에 한꺼번에 반영됩니다.\n"+
"   빈 칸은 화면에서 줄째 빠집니다 — \"(미기재)\" 를 찍지 않습니다.\n"+
"   ════════════════════════════════════════════════════════════════════ */\n"+
"window.WOW_BIZ = " + JSON.stringify(Object.assign({}, WOW_BIZ, B), null, 2) + ";\n\n"+
"window.bizVal = function(k){\n"+
"  var v = (window.WOW_BIZ || {})[k];\n"+
"  v = (v == null) ? \"\" : String(v).trim();\n"+
"  return v ? v : null;\n"+
"};\n"+
"window.bizPrivacyEmail = function(){ return bizVal(\"privacyEmail\") || bizVal(\"email\"); };\n"+
"window.bizPrivacyPhone = function(){ return bizVal(\"privacyPhone\") || bizVal(\"phone\"); };\n";
  download("site.js", out);
  toast("site.js 를 받았습니다. js/data/site.js 를 이 파일로 덮어쓰고 올리세요.");
}
