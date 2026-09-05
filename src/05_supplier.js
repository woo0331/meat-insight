
/* ════════════════════════════════════════════════════════════════════
   업체 상세 · 후기 · 평점 · 관심업체
   ════════════════════════════════════════════════════════════════════ */

var SD = { sup:null, reviews:[], favs:[] };
G.SD = SD;

async function loadFavs(){
  if(!ME.user || SCHEMA.favorites===false){ SD.favs=[]; return; }
  var r=await selectSafe("favorites", function(q){ return q.eq("user_id",ME.user.id); });
  SD.favs=r.data||[];
}
function isFav(type,id){ return SD.favs.some(function(f){ return f.target_type===type && String(f.target_id)===String(id); }); }

window.gToggleFav=async function(type,id,name){
  if(!ME.user){ toast("로그인 후 이용할 수 있습니다.","err"); if(typeof openModal==="function") openModal("login"); return; }
  if(SCHEMA.favorites===false){ toast("db/phase2_schema.sql 을 먼저 실행해주세요.","err"); return; }
  var c=client(); if(!c) return;
  if(isFav(type,id)){
    await c.from("favorites").delete().eq("user_id",ME.user.id).eq("target_type",type).eq("target_id",String(id));
    SD.favs=SD.favs.filter(function(f){ return !(f.target_type===type && String(f.target_id)===String(id)); });
    toast("관심업체에서 해제했습니다.");
  }else{
    await insertSafe("favorites",{ user_id:ME.user.id, target_type:type, target_id:String(id) });
    SD.favs.push({ target_type:type, target_id:String(id) });
    toast((name||"업체")+"를 관심업체에 담았습니다.","ok");
  }
  if(SD.sup && String(SD.sup.id)===String(id)) renderSupplierDetail();
};

/* 기존 renderSP 를 확장 상세 페이지로 교체 */
window.renderSP=async function(id){
  var el=$("sp-body"); if(!el) return;
  el.innerHTML='<div style="padding:50px 0;text-align:center;color:var(--ink4);">불러오는 중…</div>';
  var c=client(), sup=null;
  if(c){
    var r=await c.from("suppliers").select("*").eq("id", id).limit(1);
    sup=(r.data&&r.data[0])||null;
  }
  if(!sup && typeof SUPS!=="undefined"){
    var s=SUPS.find(function(x){ return String(x.id)===String(id); });
    if(s) sup={ id:s.id, name:s.nm, region:(s.cat||"").split(" · ")[0], categories:s.cats, rating:s.rt, lead_time:s.rs, min_qty:s.minq, description:s.desc, is_verified:s.vf };
  }
  if(!sup){ el.innerHTML='<div class="gp"><div class="gempty"><div class="gempty-t">업체를 찾을 수 없습니다</div><button class="gbtn gbtn-p gbtn-sm" onclick="go(&quot;suppliers&quot;)">업체 목록으로</button></div></div>'; return; }
  SD.sup=sup;
  await loadFavs();
  var rv=await selectSafe("reviews", function(q){ return q.eq("target_type","supplier").eq("target_id",String(id)).order("created_at",{ascending:false}).limit(50); });
  SD.reviews = rv.unavailable ? null : (rv.data||[]);
  renderSupplierDetail();
};

function renderSupplierDetail(){
  var s=SD.sup, el=$("sp-body"); if(!s||!el) return;
  var rvs=SD.reviews||[];
  var avg = rvs.length ? (rvs.reduce(function(a,r){ return a+(Number(r.rating)||0); },0)/rvs.length) : (Number(s.rating)||0);
  var cats=(s.categories||[]).slice();
  var mains=(s.category_mains||[]).map(function(k){ var c=(typeof cat8Of==="function")?cat8Of(k):null; return c?c.nm:k; });
  var cover=(s.images&&s.images[0])?('background-image:url('+s.images[0]+');'):('background:'+((typeof supColor==="function")?supColor(s.id):"#1A2332")+';');
  var fav=isFav("supplier",s.id);

  el.innerHTML='<div class="gp">'+
    '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="go(&quot;suppliers&quot;)">← 업체 목록</button></div>'+
    '<div class="sd-hero">'+
      '<div class="sd-cover" style="'+cover+'"><div class="sd-ct">'+
        '<div class="sd-nm">'+esc(s.name)+'</div>'+
        '<div class="sd-loc">'+esc(s.region||"지역 미등록")+(cats.length?" · "+esc(cats.slice(0,3).join(" · ")):"")+'</div>'+
      '</div></div>'+
      '<div class="sd-stats">'+
        '<div class="sd-si"><div class="sd-sv qstar">★ '+(avg?avg.toFixed(1):"—")+'</div><div class="sd-sl">평점</div></div>'+
        '<div class="sd-si"><div class="sd-sv">'+(rvs.length||0)+'</div><div class="sd-sl">후기</div></div>'+
        '<div class="sd-si"><div class="sd-sv">'+(Number(s.deal_count)||0)+'</div><div class="sd-sl">거래실적</div></div>'+
        '<div class="sd-si"><div class="sd-sv">'+esc(s.lead_time||"—")+'</div><div class="sd-sl">평균 납기</div></div>'+
      '</div>'+
    '</div>'+

    '<div class="sd-certs">'+
      '<div class="sd-cert'+(s.is_verified?"":" off")+'">'+(s.is_verified?"✓":"·")+' 고리 인증</div>'+
      '<div class="sd-cert'+(s.brn_verified||s.brn?"":" off")+'">'+(s.brn_verified||s.brn?"✓":"·")+' 사업자 등록</div>'+
      '<div class="sd-cert'+(s.haccp?"":" off")+'">'+(s.haccp?"✓":"·")+' HACCP</div>'+
    '</div>'+

    '<div class="gcard"><div class="gcard-t">기본 정보</div>'+
      '<div class="gsum">'+
        row("취급 품목", (s.items&&s.items.length)?s.items.join(", "):(cats.length?cats.join(", "):"—"))+
        row("제공 서비스", (s.services&&s.services.length)?s.services.join(", "):(mains.length?mains.join(", "):"—"))+
        row("지역", s.region||"—")+
        row("최소 주문·작업량", s.min_qty||"—")+
        row("납기", s.lead_time||"—")+
        row("연락처", s.contact||"—")+
        (s.address?row("주소", s.address):"")+
      '</div></div>'+

    ((s.images&&s.images.length)?'<div class="gcard"><div class="gcard-t">회사 사진</div><div class="sd-imgs">'+
      s.images.slice(0,6).map(function(u){ return '<div class="sd-img" style="background-image:url('+esc(u)+');"></div>'; }).join("")+'</div></div>':'')+

    '<div class="gcard"><div class="gcard-t">업체 소개</div>'+
      '<p style="font-size:14px;color:var(--ink2);line-height:1.75;white-space:pre-wrap;">'+
        esc(s.intro||s.description||((s.region||"")+" 지역의 "+((cats[0]||"축산"))+" 전문 업체입니다."))+'</p></div>'+

    '<div class="gcard"><div class="gcard-t">후기 '+(SD.reviews===null?"":"("+rvs.length+")")+'</div>'+
      (SD.reviews===null ? setupNote("후기")
       : (!rvs.length ? '<div class="gempty" style="padding:26px 16px;"><div class="gempty-t">아직 후기가 없습니다</div><div class="gempty-d">거래를 완료하면 후기를 남길 수 있습니다.</div></div>'
          : rvs.map(function(r){
              return '<div class="rv"><div class="rv-top"><div class="rv-a">'+esc(r.author_name||"익명")+' '+stars(r.rating,true)+'</div>'+
                '<div class="rv-d">'+ago(r.created_at)+'</div></div>'+
                '<div class="rv-c">'+esc(r.content||"")+'</div>'+
                (r.deal_summary?'<div class="rv-deal">거래: '+esc(r.deal_summary)+'</div>':'')+'</div>';
            }).join("")))+
    '</div>'+

    '<div class="sd-cta">'+
      '<button class="gbtn gbtn-w" style="flex:0 0 auto;" onclick="gToggleFav(\'supplier\',\''+esc(s.id)+'\',\''+esc(s.name)+'\')">'+(fav?"♥ 관심":"♡ 관심")+'</button>'+
      '<button class="gbtn gbtn-w" style="flex:1;" onclick="GORI.toast(\''+esc(s.name)+' · '+esc(s.contact||"연락처 미등록")+'\')">연락처</button>'+
      '<button class="gbtn gbtn-p" style="flex:2;" onclick="gRequestToSupplier(\''+esc(s.id)+'\')">견적 요청하기</button>'+
    '</div></div>';
  window.scrollTo(0,0);
}
function row(k,v){ return '<div class="gsum-r"><div class="gsum-k">'+esc(k)+'</div><div class="gsum-v">'+esc(v)+'</div></div>'; }

window.gRequestToSupplier=function(id){
  var s=SD.sup;
  var key = s && s.category_mains && s.category_mains[0] ? s.category_mains[0]
          : (s && s.categories && s.categories.length && typeof key8Of==="function" ? key8Of(s.categories[0]) : "meat");
  G.W.cat=key||"meat"; G.W.sub=null; G.W.data={};
  if(typeof go==="function") go("rw");
  setTimeout(function(){ window.gStep2(); toast((s?s.name:"업체")+" 등 조건에 맞는 업체에 요청이 전달됩니다."); }, 60);
};

/* ── 후기 작성 ── */
window.gOpenReview=function(type, targetId, targetName, requestId){
  if(SCHEMA.reviews===false){ toast("db/phase2_schema.sql 을 먼저 실행해주세요.","err"); return; }
  if(typeof go==="function") go("review");
  var body=$("review-body"); if(!body) return;
  body.innerHTML=
    '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="go(&quot;my&quot;)">← 거래관리</button>'+
      '<div><div class="gp-title">후기 남기기</div><div class="gp-sub">'+esc(targetName||"")+'</div></div></div>'+
    '<div class="gcard">'+
      '<label class="glabel">평점 <span class="greq">*</span></label>'+
      '<div class="stars" id="rv-stars" style="font-size:30px;">'+[1,2,3,4,5].map(function(i){
        return '<span style="font-size:30px;" onclick="gSetRating('+i+')">★</span>'; }).join("")+'</div>'+
      '<label class="glabel">거래 내용</label><input class="gin" id="rv-deal" placeholder="한우 지육 10두 / 냉장 정기배송 등">'+
      '<label class="glabel">후기 <span class="greq">*</span></label>'+
      '<textarea class="gin" id="rv-content" placeholder="납기, 품질, 소통, 가격 등 실제 경험을 적어주세요"></textarea>'+
      '<div class="gmsg" id="rv-msg"></div>'+
    '</div>'+
    '<div class="grow keep"><button class="gbtn gbtn-w" onclick="go(&quot;my&quot;)">나중에</button>'+
    '<button class="gbtn gbtn-p" id="rv-submit" onclick="gSubmitReview(\''+esc(type)+'\',\''+esc(targetId)+'\',\''+esc(requestId||"")+'\')">후기 등록</button></div>';
  G._rating=5; window.gSetRating(5);
  window.scrollTo(0,0);
};
window.gSetRating=function(n){
  G._rating=n;
  var st=$("rv-stars"); if(!st) return;
  st.querySelectorAll("span").forEach(function(s,i){ s.classList.toggle("on", i<n); });
};
window.gSubmitReview=async function(type,targetId,requestId){
  var content=(($("rv-content")||{}).value||"").trim();
  if(!content){ setMsg("rv-msg","후기 내용을 입력해주세요.","err"); return; }
  var btn=$("rv-submit"); if(btn){ btn.disabled=true; btn.textContent="등록 중…"; }
  var r=await insertSafe("reviews",{
    target_type:type, target_id:String(targetId), request_id:requestId||null,
    user_id:ME.user?ME.user.id:null, author_name:ME.name||"익명",
    rating:G._rating||5, content:content,
    deal_summary:(($("rv-deal")||{}).value||"").trim()||null
  });
  if(btn){ btn.disabled=false; btn.textContent="후기 등록"; }
  if(r.error){ setMsg("rv-msg", r.missingTable?"db/phase2_schema.sql 을 먼저 실행해주세요.":("등록 실패: "+(r.error.message||"")),"err"); return; }
  if(type==="supplier" && targetId){
    var rv=await selectSafe("reviews", function(q){ return q.eq("target_type","supplier").eq("target_id",String(targetId)); });
    var list=rv.data||[];
    if(list.length){
      var avg=list.reduce(function(a,x){ return a+(Number(x.rating)||0); },0)/list.length;
      await updateSafe("suppliers",{ rating:Math.round(avg*10)/10, review_count:list.length },"id",targetId);
    }
  }
  toast("후기를 등록했습니다. 감사합니다.","ok");
  if(typeof go==="function") go("my");
};
