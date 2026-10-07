/* ════════════════════════════════════════════════════════════════════
   프랜차이즈 (§8)

   ⚠️⚠️ **브랜드를 지어내지 않습니다.** 프랜차이즈 창업비는 사장님이
   그 숫자를 보고 수천만 원을 빌리러 가는 값입니다. 가맹사업법상
   **정보공개서에 있는 값**이어야 하고, 본사가 직접 등록한 것만
   올립니다. 지금 0 곳이고 화면은 0 이라고 말합니다.

   ⚠️ **프랜차이즈 광고사이트처럼 만들지 마세요** (§54). 여기서 하는
   일은 **나란히 놓고 비교하게** 하는 것입니다 — 창업비 · 가맹비 ·
   권장 평수 · 모집지역. 브랜드 홍보문구를 크게 두지 않습니다.
   ⚠️ 금액은 **출처(`source`)와 기준일(`asOf`)이 있는 것만** 찍습니다.
   정보공개서는 해마다 바뀝니다.
   ════════════════════════════════════════════════════════════════════ */

function PageFranchise(){
  return PgHero({
    kicker:"프랜차이즈",
    h1raw:"브랜드를 고르기 전에<br class=\"br-m\"> 나란히 놓고 보세요.",
    lead:"창업비 · 가맹비 · 교육비 · 보증금 · 권장 평수 · 모집지역을 같은 기준으로 비교합니다. 본사가 직접 등록한 값만 올립니다.",
    cta:'<a class="btn btn-o btn-lg" href="/join">브랜드 등록하기'+icon("arrow",18)+'</a>'
  })+
  '<section class="sec sec-white"><div class="w">'+
    '<ul class="fc-g">'+(window.AM_FRANCHISE_CATS||[]).map(function(c){
      var n = amFranchises({cat:c.key}).length;
      return '<li><a class="fc'+tn(c.tone)+'" href="/franchise/'+esc(c.key)+'">'+
        '<span class="fc-ic">'+icon(c.icon,22)+'</span>'+
        '<b>'+esc(c.name)+'</b>'+
        /* ⚠️ 0 일 때 "준비 중" 을 찍지 않습니다 (절대 규칙 2). 세는 값을
           그대로 냅니다 — 등록되면 저절로 숫자가 되고, 0 이면 0 이라고
           말하는 것이 이 플랫폼의 약속입니다. */
        '<span class="fc-n">'+n+'개 브랜드</span></a></li>';
    }).join("")+'</ul>'+
    (!(window.AM_FRANCHISES||[]).length ? Empty({
      icon:"store",
      title:"아직 등록된 브랜드가 없습니다",
      text:"없는 브랜드와 창업비를 지어내지 않습니다. 본사가 직접 등록한 값만 올립니다. "+
           "개인창업으로 준비하신다면 업종별 창업 화면에서 시작하실 수 있습니다.",
      reads: amContentsFor({ cat:"item", side:"start", limit:3 }),
      readTitle:"브랜드를 고르기 전에 보시면",
      cta:'<a class="btn btn-b" href="/startup">업종별 창업 보기'+icon("arrow",16)+'</a>'+
          '<a class="btn btn-o" href="/join">본사라면 브랜드 등록</a>'
    }) : "")+
  '</div></section>';
}

function PageFranchiseCat(fc){
  var reg  = nowQS("r");
  var list = amFranchises({ cat:fc.key, region:reg || null });
  return PgHero({
    crumb: Crumb([["프랜차이즈","/franchise"],[fc.name]]),
    kicker:"프랜차이즈",
    h1:fc.name + " 프랜차이즈",
    lead:"창업비 · 가맹비 · 권장 평수 · 모집지역을 나란히 놓고 보십시오.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w">'+
    '<div class="fil"><span class="fil-ic" aria-hidden="true">'+icon("sliders",18)+'</span>'+
      RegionSelect("fil-r", reg, "fcGo('"+esc(fc.key)+"')")+
      '<span class="fil-n">'+list.length+'개</span></div>'+
    (list.length
      ? '<div class="fr-g">'+list.slice(0, amShown(list.length)).map(FranchiseCard).join("")+'</div>'+
        MoreBtn(list.length)
      : Empty({
          icon:fc.icon,
          /* ⚠️ `Empty()` 가 이미 `esc()` 를 거칩니다 — 두 번 거치면 `&amp;` 가 글자로 찍힙니다 */
          title:fc.name+" 브랜드가 아직 없습니다",
          text:"본사가 직접 등록한 값만 올립니다. 등록을 원하시면 무료로 시작하실 수 있습니다.",
          reads: amContentsFor({ cat:"item", side:"start", limit:3 }),
          readTitle:"브랜드를 고르기 전에 보시면",
          cta:'<a class="btn btn-b" href="/join">브랜드 등록하기'+icon("arrow",16)+'</a>'+
              '<a class="btn btn-o" href="/startup">개인창업으로 보기</a>'
        }))+
  '</div></section>';
}
window.fcGo = function(k){
  var r = $("fil-r");
  go("/franchise/"+k+(r && r.value ? "?r="+encodeURIComponent(r.value) : ""));
};

function FranchiseCard(f){
  /* ⚠️⚠️ 출처 없는 금액은 **목록에서도** 안 찍습니다 — 손님은 상세를
     안 열어 보셔도 그만이고, 카드의 숫자를 들고 은행에 가십니다. */
  var c = amFranchiseCost(f) || {};
  /* ⚠️ 사진이 없으면 액자를 안 그립니다 (업체 카드와 같은 까닭) */
  var ph = f.cover
    ? '<img class="ph" src="'+esc(f.cover)+'" alt="'+esc(f.name)+' 매장 사진" loading="lazy" decoding="async">'
    : "";
  return '<a class="fr'+(ph ? "" : " nph")+'" href="/f/'+esc(f.slug)+'">'+
    (ph ? '<span class="fr-ph">'+ph+'</span>' : '')+
    '<span class="fr-b"><b>'+esc(f.name)+'</b>'+
      (f.intro ? '<span class="fr-i">'+esc(f.intro)+'</span>' : '')+
      '<span class="fr-m">'+
        (c.total ? '<em>총 '+esc(won(c.total))+esc(c.unit||"만원")+'</em>' : '')+
        (c.pyeong ? '<em>'+esc(String(c.pyeong))+'평~</em>' : '')+
        (f.stores != null ? '<em>가맹점 '+esc(won(f.stores))+'</em>' : '')+
      '</span>'+
      '<span class="mk-go">브랜드 보기'+icon("arrow",16)+'</span>'+
    '</span></a>';
}

/* ── /f/:slug — 브랜드 상세 (§8) ───────────────────────────────── */
function PageFranchiseOne(f){
  var c = amFranchiseCost(f) || {};
  var rows = [["join","가맹비"],["edu","교육비"],["deposit","보증금"],
              ["interior","인테리어비"],["equip","설비비"],["etc","기타 비용"]];
  var fc = amFranchiseCat(f.cat);
  return PgHero({
    crumb: Crumb([["프랜차이즈","/franchise"],[fc?fc.name:"", fc?("/franchise/"+fc.key):""],[f.name]]),
    kicker:fc ? fc.name : "프랜차이즈",
    h1:f.name,
    lead:f.intro || "",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w">'+
    /* ⚠️ 출처와 기준일이 없으면 금액을 통째로 안 냅니다 */
    (c.source && c.asOf ? '<div class="cost-box">'+
      '<div class="cost-top"><span>총 예상 창업비</span>'+
        '<b>'+(c.total ? esc(won(c.total))+esc(c.unit||"만원") : "—")+'</b></div>'+
      '<ul class="cost-l">'+rows.filter(function(r){ return c[r[0]]; }).map(function(r){
        return '<li><span>'+esc(r[1])+'</span><b>'+esc(won(c[r[0]]))+esc(c.unit||"만원")+'</b></li>';
      }).join("")+
      (c.pyeong ? '<li><span>권장 평수</span><b>'+esc(String(c.pyeong))+'평</b></li>' : '')+
      '</ul>'+
      '<p class="note">출처 '+esc(c.source)+' · 기준일 '+esc(c.asOf)+'. '+
        '점포 비용과 지역에 따라 달라집니다. 실제 금액은 정보공개서와 '+
        '본사 상담으로 확인하세요.</p>'+
    '</div>' : '<p class="note">본사가 금액을 등록하지 않았습니다. 상담으로 확인하세요.</p>')+

    ((f.features||[]).length ? '<div class="pv-sec"><h2>브랜드 특징</h2>'+
      '<ul class="tick-l">'+f.features.map(function(x){
        return '<li>'+icon("check",16)+'<span>'+esc(x)+'</span></li>'; }).join("")+'</ul></div>' : '')+
    ((f.support||[]).length ? '<div class="pv-sec"><h2>본사 지원</h2>'+
      '<ul class="tick-l">'+f.support.map(function(x){
        return '<li>'+icon("check",16)+'<span>'+esc(x)+'</span></li>'; }).join("")+'</ul></div>' : '')+
    ((f.regions||[]).length ? '<div class="pv-sec"><h2>모집지역</h2>'+
      '<ul class="chip-g">'+f.regions.map(function(k){
        return '<li><span class="chip chip-flat">'+esc(amRegionName(k))+'</span></li>';
      }).join("")+'</ul></div>' : '')+
    (f.disclosure && f.disclosure.has ? '<div class="pv-sec"><h2>정보공개서</h2>'+
      '<p>등록번호 '+esc(f.disclosure.no||"-")+' · 등록일 '+esc(f.disclosure.at||"-")+'</p>'+
      '<p class="note">공정거래위원회 가맹사업거래 홈페이지에서 원문을 확인하실 수 있습니다.</p>'+
      '</div>' : '')+

    Empty({
      icon:"chat",
      title:"창업 상담 신청",
      text:"적어 주신 내용을 본사에 전달합니다. 연락처는 사장님이 동의하신 뒤에만 오갑니다.",
      cta:'<a class="btn btn-b" href="'+esc(quoteTo({side:"start"}))+'">창업 상담 신청'+icon("arrow",16)+'</a>'
    })+
  '</div></section>'+
  '<div class="sticky-cta"><a class="btn btn-b" href="'+esc(quoteTo({side:"start"}))+'">창업 상담 신청</a></div>';
}
