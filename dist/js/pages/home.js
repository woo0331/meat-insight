

function PageMain(){
  return PwHero()+ PwServices()+ PwBrands()+ PwProducts()+
         PwBanners()+ PwNews()+ PwSteps()+ PwTrust()+ PwCta();
}

function pwTick(){
  return '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" '+
    'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" '+
    'stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7"/></svg>';
}
function pwArrow(){
  return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" '+
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" '+
    'stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';
}

var PW_HERO_CHIPS = [
  ["bolt", "직접 매입", "폰웨이가 바로 삽니다"],
  ["bid",  "전국 업체 경쟁입찰", "여러 곳 견적 비교"],
  ["ck",   "검수 완료 중고폰", "상태를 밝히고 팝니다"]
];
var PW_CHIP_IC = {
  bolt: '<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z"/>',
  bid:  '<path d="m13 4 7 7M9.5 7.5 16.5 14.5M5 21h7M8 18 3.5 13.5l9-9L17 9l-9 9Z"/>',
  ck:   '<path d="M12 3 4 6v6c0 4.5 3.2 8.3 8 9 4.8-.7 8-4.5 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>'
};

function PwHero(){
  var nm = (window.amBrand ? amBrand() : "");

  var wa = (typeof josa === "function") ? josa(nm, "와과") : "와";
  return '<section class="pwh">'+
    '<div class="pwh-bg" aria-hidden="true">'+
      '<span class="pwh-rb"></span>'+
      '<span class="pwh-rb2"></span>'+
      '<span class="pwh-glow"></span>'+
    '</div>'+
    '<div class="w pwh-in">'+
      '<div class="pwh-tx">'+

        '<p class="pwh-k">PHONEWAY</p>'+

        '<h1><span class="pwh-h1a">중고폰의 새로운 기준</span>'+
          '<em><b>'+ esc(nm) + esc(wa) +'</b> 더 가깝게</em></h1>'+
        '<p class="pwh-sub">팔기부터 구매, 수리, 도매, 수출까지'+
          '<br class="br-m"> 중고폰의 모든 것을 한 곳에서</p>'+
        '<div class="pwh-go">'+
          '<a class="btn pwh-b1" href="/sell" data-to="/sell">'+
            '<b>내 폰 팔기</b>'+ pwArrow() +'</a>'+
          '<a class="btn pwh-b2" href="/shop" data-to="/shop">'+
            '<b>중고폰 구매하기</b>'+ pwArrow() +'</a>'+
        '</div>'+
      '</div>'+
      '<div class="pwh-art">'+
        photoBox("dev-iphone", "pwh-ph", true,
          "(max-width:767px) 42vw, (max-width:1199px) 36vw, 420px")+
      '</div>'+
    '</div>'+
    pwHeroTrust()+
  '</section>';
}

var PW_HERO3 = [
  ["shield", "전문업체", "연결"],
  ["coins",  "견적 비교", "한 번에"],
  ["lock",   "개인정보", "보호"]
];
function pwHero3(){
  return '<ul class="pwh-f3">'+ PW_HERO3.map(function(t){
    return '<li><i>'+ icon(t[0],26) +'</i><b>'+ esc(t[1]) +'</b>'+
      '<span>'+ esc(t[2]) +'</span></li>'; }).join("") +'</ul>';
}

var PW_TRUST4 = [
  ["tag",    "지금 바로",   "견적 비교"],
  ["bolt",   "수거 · 정산", "한 흐름으로"],
  ["shield", "개인정보",    "안전 처리"],
  ["seed",   "지속 가능한", "중고 거래"]
];
function pwHeroTrust(){
  return '<div class="pwh-tr"><ul class="w pwh-tr-g">'+ PW_TRUST4.map(function(t){
    return '<li><i>'+ icon(t[0],26) +'</i>'+
      '<span><b>'+ esc(t[1]) +'</b><span>'+ esc(t[2]) +'</span></span></li>';
  }).join("") +'</ul></div>';
}

function pwHeroArt(){
  return '<svg class="pwh-svg" viewBox="0 0 440 400" aria-hidden="true">'+
    '<defs>'+

      '<linearGradient id="pwa" x1=".1" y1="0" x2=".9" y2="1">'+
        '<stop offset="0" stop-color="#C9BBAE"/><stop offset=".45" stop-color="#4E5560"/>'+
        '<stop offset="1" stop-color="#2E3740"/></linearGradient>'+

      '<linearGradient id="pwsc" x1="0" y1="0" x2=".6" y2="1">'+
        '<stop offset="0" stop-color="#1B242E"/><stop offset="1" stop-color="#0E141B"/></linearGradient>'+

      '<linearGradient id="pwhg" x1="0" y1="0" x2="1" y2="1">'+
        '<stop offset="0" stop-color="#353F4A"/><stop offset="1" stop-color="#1B242E"/></linearGradient>'+
      '<linearGradient id="pwcard" x1="0" y1="0" x2="0" y2="1">'+
        '<stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FBEFE4"/></linearGradient>'+
      '<radialGradient id="pwglow" cx=".5" cy=".5" r=".5">'+
        '<stop offset="0" stop-color="#E07A2E" stop-opacity=".55"/>'+
        '<stop offset="1" stop-color="#E07A2E" stop-opacity="0"/></radialGradient>'+
    '</defs>'+

    '<circle cx="224" cy="186" r="172" fill="url(#pwglow)"/>'+
    '<ellipse cx="224" cy="358" rx="150" ry="17" fill="#080D13" opacity=".45"/>'+

    '<g transform="rotate(-11 300 200)" opacity=".92">'+
      '<rect x="258" y="86" width="132" height="226" rx="26" fill="url(#pwa)"/>'+
      '<rect x="266" y="94" width="116" height="210" rx="20" fill="url(#pwhg)"/>'+
      '<rect x="302" y="100" width="36" height="7" rx="3.5" fill="#2F3842"/>'+
      '<rect x="282" y="130" width="84" height="6" rx="3" fill="#3A444F" opacity=".8"/>'+
      '<rect x="282" y="146" width="58" height="6" rx="3" fill="#303A45" opacity=".8"/>'+
      '<rect x="282" y="176" width="84" height="46" rx="8" fill="#242E39" opacity=".75"/>'+
    '</g>'+

    '<g>'+
      '<rect x="128" y="60" width="168" height="282" rx="30" fill="url(#pwa)"/>'+
      '<rect x="137" y="69" width="150" height="264" rx="23" fill="url(#pwsc)"/>'+
      '<rect x="188" y="76" width="48" height="9" rx="4.5" fill="#282F38"/>'+

      '<rect x="152" y="100" width="120" height="58" rx="11" fill="#242E39"/>'+
      '<rect x="162" y="112" width="26" height="34" rx="5" fill="#EDC09A"/>'+
      '<rect x="196" y="116" width="62" height="7" rx="3.5" fill="#F3CDAA"/>'+
      '<rect x="196" y="130" width="40" height="6" rx="3" fill="#9A8B7E"/>'+

      '<rect x="152" y="176" width="120" height="7" rx="3.5" fill="#2E3A47"/>'+
      '<rect x="152" y="176" width="52" height="7" rx="3.5" fill="#F8A066"/>'+
      '<rect x="152" y="196" width="120" height="7" rx="3.5" fill="#2E3A47"/>'+
      '<rect x="152" y="196" width="86" height="7" rx="3.5" fill="#F37021"/>'+
      '<rect x="152" y="216" width="120" height="7" rx="3.5" fill="#2E3A47"/>'+
      '<rect x="152" y="216" width="68" height="7" rx="3.5" fill="#F8A066"/>'+

      '<rect x="152" y="246" width="120" height="30" rx="15" fill="#F37021"/>'+
      '<rect x="182" y="258" width="60" height="7" rx="3.5" fill="#FFE0C4"/>'+

      '<rect x="186" y="314" width="52" height="6" rx="3" fill="#313B46"/>'+
    '</g>'+

    '<g transform="translate(246 236)">'+
      '<rect x="0" y="0" width="150" height="62" rx="14" fill="url(#pwcard)"/>'+
      '<circle cx="31" cy="31" r="17" fill="#E4F6F1"/>'+
      '<path d="M23.5 31.5l5.5 5.5 10.5-11.5" fill="none" stroke="#12806C" '+
        'stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'+
      '<rect x="58" y="20" width="70" height="8" rx="4" fill="#12806C"/>'+
      '<rect x="58" y="36" width="48" height="7" rx="3.5" fill="#B9BFC7"/>'+
    '</g>'+

    '<g transform="translate(44 108)">'+
      '<rect x="0" y="0" width="104" height="46" rx="13" fill="url(#pwcard)"/>'+
      '<circle cx="26" cy="23" r="14" fill="#18212B"/>'+
      '<path d="M26 14.5l2.9 5.9 6.5 1-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4-4.7-4.6 6.5-1z" fill="#E7B65C"/>'+
      '<rect x="50" y="15" width="40" height="7" rx="3.5" fill="#222B35"/>'+
      '<rect x="50" y="28" width="26" height="6" rx="3" fill="#B2B8C0"/>'+
    '</g>'+

    '<g transform="translate(330 48)">'+
      '<rect x="0" y="0" width="78" height="78" rx="20" fill="url(#pwcard)"/>'+
      '<circle cx="39" cy="33" r="19" fill="none" stroke="#F2E6DA" stroke-width="7"/>'+
      '<path d="M39 14a19 19 0 0 1 14.8 30.9" fill="none" stroke="#16A085" '+
        'stroke-width="7" stroke-linecap="round"/>'+
      '<rect x="22" y="60" width="34" height="7" rx="3.5" fill="#B9BFC7"/>'+
    '</g>'+
  '</svg>';
}

var PW_WAYS = [
  { no:"01", kind:"a", to:"/sell", cta:"바로 판매하기",
    ic:'<rect x="2.5" y="6" width="19" height="13" rx="2.6"/>'+
       '<path d="M2.5 10.5h19M6.5 15h3"/>',

    h:function(){ return (window.amBrand ? amBrand() : "") + " 직접 매입"; },
    lead:"저희가 직접 삽니다. 한 번만 등록하시면 예상 매입가를 바로 "+
         "확인하실 수 있습니다.",
    li:["빠르고 간편한 판매","검수 기준을 미리 공개","최종 금액에 동의한 뒤 정산"],
    note:function(){
      return '⚠️ 등록 화면에 적으신 상태를 기준으로 한 <b>예상 금액</b>입니다. '+
             '기기를 받아 검수한 뒤 최종 금액을 다시 안내드리고, 동의하신 '+
             '뒤에 정산합니다.'; } },
  { no:"02", kind:"b", to:"/bid", cta:"견적 비교 신청하기",
    ic:'<path d="m13 3.5 7.5 7.5M9.5 7 17 14.5M4.5 21h8M7.5 17.5 3 13l9.5-9.5L17 8l-9.5 9.5Z"/>',
    h:function(){ return "전국 업체 경쟁입찰"; },
    lead:"전국의 인증 매입업체가 견적을 냅니다. 가격만이 아니라 거래 "+
         "조건까지 나란히 놓고 고르세요.",
    li:["여러 업체 견적 비교","검수 기준 · 정산 소요일 비교","고르는 것은 사장님입니다"],
    note:function(){
      var n = (window.AM_PROVIDERS || []).length;
      return n ? ('지금 <b>'+ n +'곳</b>이 참여하고 있습니다. 견적은 신청하신 '+
                  '기기의 조건을 보고 업체가 직접 냅니다.')
               : ('⚠️ <b>지금 입점업체를 모집하고 있습니다.</b> 참여 업체가 '+
                  '생기면 이 자리에 실제 견적이 나란히 섭니다 — 없는 업체를 '+
                  '미리 보여 드리지 않습니다.'); } }
];
function PwWays(){
  return '<section class="pww"><div class="w">'+
    '<div class="pw-hd">'+
      '<span class="pw-ey">HOW TO SELL</span>'+
      '<h2>휴대폰을 판매하는 두 가지 방법</h2>'+
      '<p>원하는 방식으로 더 높은 가치를 받아보세요.</p>'+
    '</div>'+
    '<div class="pww-g">'+ PW_WAYS.map(pwWayCard).join("") +'</div>'+
  '</div></section>';
}
function pwWayCard(o){
  return '<article class="pww-c'+ (o.kind==="b" ? " b" : "") +'">'+
    '<span class="pww-no">'+ esc(o.no) +'</span>'+
    '<div class="pww-ic"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" '+
      'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '+
      'stroke-linejoin="round" aria-hidden="true">'+ o.ic +'</svg></div>'+
    '<h3>'+ esc(typeof o.h === "function" ? o.h() : o.h) +'</h3>'+
    '<p class="pww-l">'+ esc(o.lead) +'</p>'+
    '<ul>'+ o.li.map(function(t){
      return '<li>'+ pwTick() + esc(t) +'</li>'; }).join("") +'</ul>'+
    '<a class="btn '+ (o.kind==="b" ? "btn-pw-o" : "btn-pw") +'" href="'+ esc(o.to) +'">'+
      esc(o.cta) +'</a>'+
    '<p class="pww-n">'+ (typeof o.note === "function" ? o.note() : o.note) +'</p>'+
  '</article>';
}

var PW_KINDS = [
  ["/shop?m=iphone",  "아이폰",   "iPhone",
   '<rect x="6" y="2.5" width="12" height="19" rx="2.8"/><path d="M10.5 5.5h3"/>'],
  ["/shop?m=galaxy",  "갤럭시",   "Galaxy",
   '<rect x="5.5" y="2.5" width="13" height="19" rx="3"/><path d="M12 18.5h.01"/>'],
  ["/shop?m=tablet",  "태블릿",   "iPad · Tab",
   '<rect x="3" y="4" width="18" height="16" rx="2.6"/><path d="M12 16.5h.01"/>'],
  ["/shop?m=etc",     "기타 기기", "워치 · 버즈",
   '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>']
];
function PwShop(){
  var P = window.AM_PRODUCTS || [];
  return '<section class="pws"><div class="w">'+
    '<div class="pw-hd-l">'+
      '<div><h2>검증된 중고폰을, 믿고 구매하세요</h2>'+
        '<p>폰웨이가 직접 매입하고 검수한 기기만 판매합니다.</p></div>'+
      '<a class="pw-more" href="/shop">전체 보기 '+ pwArrow() +'</a>'+
    '</div>'+
    '<ul class="pws-g">'+ PW_KINDS.map(function(k){
      return '<li><a class="pws-c" href="'+ esc(k[0]) +'">'+
        '<i><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
          'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
          k[3] +'</svg></i>'+
        '<b>'+ esc(k[1]) +'</b><span>'+ esc(k[2]) +'</span></a></li>';
    }).join("") +'</ul>'+
    (P.length ? "" :
      '<div class="pws-e">'+
        '<b>지금 판매 중인 상품이 0건입니다.</b>'+
        '<p>검수를 마친 기기부터 이 자리에 올라옵니다. 한 대라도 올라오면 사진 · 등급 · '+
          '배터리 상태 · 검수 결과가 그대로 보입니다.<br>'+
          '⚠️ 없는 상품을 미리 만들어 두지 않습니다.</p>'+
      '</div>')+
  '</div></section>';
}

function pwDevLink(c){

  var qs = c.more ? "?mo=1"
         : "?mk="+ encodeURIComponent(c.maker) +"&kd="+ encodeURIComponent(c.kind);
  return '<li><a class="dvc dvc-a" href="/sell'+ qs +'">'+
    '<span class="dvc-ph">'+
      (typeof hasPhoto === "function" && hasPhoto(c.ph)
        ? photoBox(c.ph, "dvc-im")
        : iconArt(c.ia, 96))+
    '</span>'+
    '<span class="dvc-tx">'+
      pwDevLogos(c)+
      '<b class="dvc-nm">'+ esc(c.nm) +'</b>'+
      '<span class="dvc-s">'+ esc(c.sub) +'</span>'+
    '</span>'+
    '<span class="dvc-go" aria-hidden="true">'+ pwArrow() +'</span>'+
  '</a></li>';
}
function PwDevice(){
  var C = window.PW_SELL_CARDS || [];
  if(!C.length) return "";
  return '<section class="pwd"><div class="w pwd-in">'+
    '<div class="pwd-hd">'+
      '<span class="pw-ey">SELL YOUR DEVICE</span>'+
      '<h2>어떤 기기를 판매하시나요?</h2>'+
      '<p>판매할 기기 종류를 선택해 주세요.</p>'+
    '</div>'+
    '<ul class="pwd-g">'+ C.map(pwDevLink).join("") +'</ul>'+
  '</div></section>';
}

var PW_BIZ = [
  { k:"1", nm:"지금 바로<br>내 폰 팔기", to:"/sell", cta:"내 폰 팔기",
    d:"복잡한 절차 없이, 간편하게 최고가 견적을 받아보세요.", ph:"biz-sell", ia:"mobile" },
  { k:"2", nm:"믿을 수 있는<br>중고폰 구매", to:"/shop", cta:"중고폰 보기",
    d:"검수를 마친 중고폰을 합리적인 가격에 만나보세요.", ph:"biz-shop", ia:"bag" },
  { k:"3", nm:"업체 경쟁입찰", to:"/bid", cta:"경쟁입찰 알아보기",
    d:"여러 업체의 견적을 한번에 비교하고 가장 높은 값에 판매하세요.",
    ph:"biz-bid", ia:"chart" },
  { k:"4", nm:"기업 · 수출 거래", to:"/biz", cta:"거래 문의하기",
    d:"대량 매입과 해외 수출을 상담으로 진행합니다.",
    note:"지금은 문의를 받는 단계입니다", ph:"biz-export", ia:"handover" }
];
function PwBiz(){
  return '<section class="pwbz"><div class="w">'+
    '<ul class="pwbz-g">'+ PW_BIZ.map(function(b){
      return '<li><a class="pwbz-c pwbz-v'+ b.k +'" href="'+ esc(b.to) +'">'+
        '<span class="pwbz-tx">'+
          '<b class="pwbz-nm">'+ b.nm +'</b>'+
          '<span class="pwbz-d">'+ esc(b.d) +'</span>'+
          (b.note ? '<span class="pwbz-note">'+ esc(b.note) +'</span>' : '')+
          '<span class="pwbz-go">'+ esc(b.cta) +' '+ pwArrow() +'</span>'+
        '</span>'+
        '<span class="pwbz-ph">'+
          (typeof hasPhoto === "function" && hasPhoto(b.ph)
            ? photoBox(b.ph, "pwbz-im")
            : '<span class="pwbz-ic">'+ iconArt(b.ia, 76) +'</span>')+
        '</span>'+
      '</a></li>';
    }).join("") +'</ul>'+
  '</div></section>';
}

var PW_QUICK = [
  ["/sell",  "mobile",   "내 폰 팔기",     "간편 신청"],
  ["/shop",  "bag",      "중고폰 구매",    "검수된 제품"],
  ["/bid",   "chart",    "경쟁입찰",       "최고가 견적"],
  ["/biz",   "handover", "수출 · 기업거래", "대량 거래"],
  ["/faq",   "chat",     "도움말",         "자주 묻는 질문"]
];
function PwQuick(){
  return '<section class="pwq"><div class="w">'+
    '<div class="pw-hd-l"><div><h2>주요 서비스 바로가기</h2></div>'+
      '<a class="pw-more" href="/guide">이용 안내 '+ pwArrow() +'</a></div>'+
    '<ul class="pwq-g">'+ PW_QUICK.map(function(q){
      return '<li><a class="pwq-c" href="'+ esc(q[0]) +'">'+
        '<i>'+ (typeof iconArt === "function" && hasIconArt(q[1])
                 ? iconArt(q[1], 44)
                 : icon(q[1], 26)) +'</i>'+
        '<b>'+ esc(q[2]) +'</b><span>'+ esc(q[3]) +'</span></a></li>';
    }).join("") +'</ul>'+
  '</div></section>';
}

function PwSteps(){
  return '<section class="pwst"><div class="w">'+
    '<div class="pw-hd"><span class="pw-ey">HOW IT WORKS</span>'+
      '<h2>'+ esc(window.amBrand ? amBrand() : "") +' 이용 방법</h2>'+
      '<p>등록부터 정산까지 다섯 걸음입니다.</p></div>'+
    '<ol class="pwst-g">'+ (window.AM_STEPS||[]).map(function(s,i){
      return '<li class="pwst-c"><span class="pwst-n">'+ (i+1) +'</span>'+
        '<i><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
          'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
          (s.art||'') +'</svg></i>'+
        '<b>'+ esc(s.n) +'</b><p>'+ esc(s.d) +'</p></li>';
    }).join("") +'</ol>'+
  '</div></section>';
}

var PW_TRUST = [
  ["검수 기준을 먼저 공개",
   "외관 · 액정 · 배터리 · 기능을 어떤 기준으로 보는지 등록 전에 읽으실 수 있습니다.",
   '<path d="M9 3.5h6l1 3.5h3.5v13H4.5v-13H8l1-3.5Z"/><path d="m9.5 13 2 2 3.5-4"/>'],
  ["개인정보 삭제 안내",
   "보내시기 전에 해 두셔야 할 것과, 저희가 받은 뒤 처리하는 절차를 그대로 적습니다.",
   '<rect x="5" y="10.5" width="14" height="10" rx="2.4"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'],
  ["진행 상황 확인",
   "접수 · 수거 · 검수 · 정산이 지금 어디까지 왔는지 화면에서 보입니다.",
   '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.2l3.2 2"/>'],

  ["분쟁이 생기면",
   "검수 결과에 동의하지 않으시면 반송받으실 수 있습니다. 반송 조건은 보내시기 전에 알려 드립니다.",
   '<path d="M12 3.5 4.5 7v5.5c0 4.3 3.1 7.9 7.5 8.5 4.4-.6 7.5-4.2 7.5-8.5V7L12 3.5Z"/><path d="M12 9v4M12 16h.01"/>']
];
function PwTrust(){
  return '<section class="pwt"><div class="w">'+
    '<div class="pw-hd"><span class="pw-ey">TRUST</span>'+
      '<h2>거래하기 전에 밝혀 둡니다</h2>'+
      '<p>지킬 수 있는 것만 적었습니다.</p></div>'+
    '<ul class="pwt-g">'+ PW_TRUST.map(function(t){
      return '<li class="pwt-c">'+
        '<i><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
          'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
          t[2] +'</svg></i>'+
        '<b>'+ esc(t[0]) +'</b><p>'+ esc(t[1]) +'</p></li>';
    }).join("") +'</ul>'+
    '<p class="pwt-n">⚠️ <b>이 화면에 "무료" · "당일 정산" · "최고가 보장" 을 적지 '+
      '않았습니다.</b> 지킬 수 있는 것만 적는 것이 이 플랫폼의 규칙입니다 — 검수 뒤 '+
      '금액이 바뀔 수 있다는 것, 정산까지 걸리는 시간, 반송 조건을 거래 전에 먼저 '+
      '보여 드립니다.</p>'+
  '</div></section>';
}

function PwCta(){
  return '<section class="pwc"><div class="w pwc-in">'+
    '<div><h2>지금 내 폰은 얼마일까요?</h2>'+
      '<p>기종과 상태만 고르면 예상 금액을 바로 보실 수 있습니다.</p></div>'+
    '<div class="pwc-go">'+
      '<a class="btn btn-pw-w" href="/sell">내 폰 팔기</a>'+
      '<a class="btn btn-pw-gh" href="/guide">이용 안내 보기</a>'+
    '</div>'+
  '</div></section>';
}

function PwServices(){
  return '<section class="pwsv"><div class="w">'+

    '<div class="pw-hd"><h2>무엇을 도와드릴까요?</h2>'+
      '<p>중고폰을 팔고 · 사고 · 고치고 · 도매로 넘기는 길을 한곳에 모았습니다.</p></div>'+
    '<ul class="pwsv-g">'+ window.PW_SVC6.map(function(s){

      return '<li><a class="pwsv-c" href="'+ esc(s.to) +'">'+
        '<i class="pwsv-i">'+ iconArt(s.ia, 46) +'</i>'+
        '<b>'+ esc(s.nm) +'</b>'+
        '<span class="pwsv-d">'+ esc(s.d) +'</span>'+
        '<span class="pwsv-go" aria-hidden="true">'+ pwArrow() +'</span>'+
      '</a></li>';
    }).join("") +'</ul>'+
  '</div></section>';
}

function PwBrands(){
  var B = window.AM_SHOP_BRANDS || [], LG = window.AM_MAKER_LOGO || {};
  if(!B.length) return "";
  return '<section class="pwbr"><div class="w">'+
    '<div class="pw-hd-l"><div><h2>다양한 브랜드의 기기를 만나보세요</h2></div>'+
      '<a class="pw-more" href="/shop">전체 보기 '+ pwArrow() +'</a></div>'+
    '<ul class="pwbr-g">'+ B.map(function(b){

      var n = (typeof amShopBrandN === "function") ? amShopBrandN(b.key, true) : 0;
      return '<li><a class="pwbr-c" href="/shop?m='+ esc(b.key) +'">'+
        (LG[b.key]
          ? '<span class="pwbr-lg"><img src="'+ esc(LG[b.key]) +'" alt="" '+
            'width="92" height="26" loading="lazy" decoding="async"></span>'
          : '')+
        '<b>'+ esc(b.en) +'</b>'+

        '<span class="pwbr-n">'+ n +'대</span>'+
      '</a></li>';
    }).join("") +'</ul>'+

    '<p class="pwbr-n0">⚠️ 대수는 <b>지금 올라와 있는 기기를 센 값</b>입니다. '+
      '0대는 아직 올라온 기기가 없다는 뜻이고, '+
      '없는 기기를 미리 보여 드리지 않습니다.</p>'+
  '</div></section>';
}

var PW_PD_N = 5;
function PwProducts(){
  var B  = window.AM_SHOP_BRANDS || [];
  var pick = nowQS("b");

  var all = (typeof amShopList === "function") ? amShopList({ real:true }) : [];
  var L   = pick ? all.filter(function(p){
      var md = (typeof amModel === "function") ? amModel(p.model) : null;
      return md && md.maker === pick;
    }) : all;

  var chips = '<a class="chip'+ (pick ? "" : " on") +'" href="/" data-keep>전체</a>'+
    B.map(function(b){
      return '<a class="chip'+ (pick === b.key ? " on" : "") +'" '+
        'href="/?b='+ esc(b.key) +'" data-keep>'+ esc(b.name) +'</a>';
    }).join("");

  var body;
  if(!L.length){

    body = '<div class="pwpd-0"><b>'+
      (pick ? '아직 이 브랜드의 기기가 없습니다.' : '아직 올라온 기기가 없습니다.')+
      '</b><p>검수를 마친 기기부터 이 자리에 올라옵니다. '+
      '먼저 파실 기기가 있으시면 견적부터 받아 보세요.</p>'+
      '<div class="row-cta"><a class="btn btn-pw" href="/sell">내 폰 팔기</a>'+
      '<a class="btn btn-pw-o" href="/shop">중고폰 전체 보기</a></div></div>';
  } else {
    body = '<ul class="pwpd-g">'+ L.slice(0, PW_PD_N).map(pwPdCard).join("") +'</ul>';
  }

  return '<section class="pwpd"><div class="w">'+
    '<div class="pw-hd-l"><div><h2>지금 보실 수 있는 중고폰</h2>'+
      '<p>등록된 차례로 냅니다 — 조회수나 판매량 같은 이용 통계가 아닙니다.</p></div>'+
      '<a class="pw-more" href="/shop">전체 보기 '+ pwArrow() +'</a></div>'+
    '<div class="chip-g chip-g-fil pwpd-fil">'+ chips +'</div>'+
    body+
  '</div></section>';
}

function pwPdCard(p){
  var md  = (typeof amModel === "function") ? amModel(p.model) : null;
  var smp = String(p.id || "").indexOf("sample-") === 0;
  var ph  = (p.images && p.images[0]) || "";
  return '<li><a class="pwpd-c" href="/d/'+ esc(p.id) +'">'+
    '<span class="pwpd-ph">'+
      (ph ? '<img class="ph" src="'+ esc(ph) +'" alt="" loading="lazy" decoding="async">'

          : iconArt((typeof shopIcon === "function" ? shopIcon(md) : "mobile"), 58))+
      (smp ? '<span class="pwpd-smp-b">예시</span>' : '')+
    '</span>'+
    '<b class="pwpd-nm">'+ esc(md ? md.name : p.model) +'</b>'+
    '<span class="pwpd-sp">'+
      esc([(p.cap ? (p.cap >= 1024 ? (p.cap/1024)+"TB" : p.cap+"GB") : ""),
           p.color || ""].filter(Boolean).join(" · "))+'</span>'+
    '<span class="pwpd-pr">'+ esc(Number(p.price||0).toLocaleString()) +'원</span>'+
    '<span class="pwpd-bd">'+
      '<i>'+ esc(p.grade) +'등급</i>'+
      (p.batt ? '<i>배터리 '+ esc(p.batt) +'%</i>' : '')+
    '</span>'+
  '</a></li>';
}

function PwBanners(){
  return '<section class="pwbz"><div class="w">'+
    '<div class="pw-hd"><h2>먼저 보시면 좋은 것</h2>'+
      '<p>거래 전에 한 번 읽어 두시면 선택이 쉬워집니다.</p></div>'+
    '<ul class="pwbz-g">'+ window.PW_BAN3.map(function(b, i){
      return '<li><a class="pwbz-c pwbz-v'+ (i+1) +'" href="'+ esc(b.to) +'">'+
        '<span class="pwbz-ph"><span class="pwbz-ic">'+ iconArt(b.ia, 56) +'</span></span>'+
        '<span class="pwbz-tx">'+
          '<b class="pwbz-nm">'+ esc(b.nm) +'</b>'+
          '<span class="pwbz-d">'+ esc(b.d) +'</span>'+
          '<span class="pwbz-go">'+ esc(b.cta) +' '+ pwArrow() +'</span>'+
        '</span>'+
      '</a></li>';
    }).join("") +'</ul>'+
  '</div></section>';
}

function PwNews(){
  var L = (window.AM_PW_NEWS || []).slice()
    .sort(function(a,b){ return String(b.at||"").localeCompare(String(a.at||"")); })
    .slice(0, 4);
  if(!L.length) return "";
  return '<section class="pwnw"><div class="w">'+
    '<div class="pw-hd-l"><div><h2>'+ esc(window.amBrand ? amBrand() : "") +
      ' 소식과 혜택</h2></div>'+
      '<a class="pw-more" href="/guide">전체 보기 '+ pwArrow() +'</a></div>'+
    '<ul class="pwnw-g">'+ L.map(function(n){
      var d = (typeof amDate === "function") ? amDate(n.at) : "";
      return '<li><a class="pwnw-c" href="'+ esc(n.to || "/guide") +'">'+
        '<span class="pwnw-ph">'+
          (n.ph && typeof hasPhoto === "function" && hasPhoto(n.ph)
            ? photoBox(n.ph, "pwnw-im")
            : '<span class="pwnw-ic">'+ iconArt("mobile", 44) +'</span>')+
        '</span>'+
        '<b>'+ esc(n.title) +'</b>'+
        (n.lead ? '<span class="pwnw-d">'+ esc(n.lead) +'</span>' : '')+
        (d ? '<time datetime="'+ esc(n.at) +'">'+ esc(d) +'</time>' : '')+
      '</a></li>';
    }).join("") +'</ul>'+
  '</div></section>';
}
