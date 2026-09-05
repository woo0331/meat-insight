
/* ════════════════════════════════════════════════════════════════════
   PHASE 3 — 매칭 알림 · 바로견적 · 신뢰 지표 · 시세 연동
   숨고에서 가장 중요한 축: "요청이 올라오면 업체가 그 사실을 안다"
   ════════════════════════════════════════════════════════════════════ */

var P3_TABLES=["chat_rooms","chat_messages","supplier_prefs","verifications","orders","market_prices"];
var MARKET={ rows:[], byItem:{} };
G.MARKET=MARKET;

/* ── 시세 ── */
async function loadMarket(){
  var r=await selectSafe("market_prices", function(q){ return q.order("price_date",{ascending:false}).limit(200); });
  if(r.unavailable){ MARKET.rows=[]; return; }
  var seen={}, rows=[];
  (r.data||[]).forEach(function(m){
    var k=(m.item||"")+"|"+(m.grade||"");
    if(seen[k]) return; seen[k]=1; rows.push(m);
  });
  MARKET.rows=rows;
  var by={}; rows.forEach(function(m){ by[normCat(m.item)]=m; });
  MARKET.byItem=by;
}
/* 요청 내용과 가장 가까운 시세 항목을 찾습니다 */
function marketFor(req){
  if(!MARKET.rows.length) return null;
  var d=(req&&req.detail)||{}, hay=normCat([d.part,d.item,(d.species||[]).join(""),req&&req.title].join(""));
  if(!hay) return null;
  var best=null, bestLen=0;
  MARKET.rows.forEach(function(m){
    var key=normCat(m.item);
    if(key.length>=2 && hay.indexOf(key)>=0 && key.length>bestLen){ best=m; bestLen=key.length; }
  });
  if(best) return best;
  /* 부분 일치가 없으면 축종 단위로 */
  MARKET.rows.forEach(function(m){
    ["한우","한돈","돼지","수입"].forEach(function(t){
      if(!best && hay.indexOf(t)>=0 && normCat(m.item).indexOf(t)>=0) best=m;
    });
  });
  return best;
}
G.marketFor=marketFor;

function marketDiff(unitPrice, ref){
  if(unitPrice==null||!ref||!ref.price) return null;
  var pct=Math.round(((unitPrice-Number(ref.price))/Number(ref.price))*1000)/10;
  return { pct:pct, ref:ref };
}
G.marketDiff=marketDiff;

/* ── 매칭 알림 (DB 트리거가 없을 때의 클라이언트 대체 경로) ── */
function supplierMatches(sup, prefs, req){
  if(sup.notify_on===false) return false;
  if(prefs && prefs.notify_on===false) return false;
  var cats=(prefs&&prefs.category_mains&&prefs.category_mains.length) ? prefs.category_mains
         : (sup.category_mains&&sup.category_mains.length ? sup.category_mains : null);
  if(req.category_main && cats && cats.indexOf(req.category_main)<0){
    /* 등록 카테고리 문자열로도 한 번 더 확인 */
    if(!matchCat8(sup.categories||[], req.category_main)) return false;
  }
  var regions=(prefs&&prefs.regions&&prefs.regions.length) ? prefs.regions
            : (sup.regions&&sup.regions.length ? sup.regions : null);
  var rg=String(req.region||"");
  if(regions && rg && rg!=="전국" && regions.indexOf("전국")<0){
    var hit=regions.some(function(r){ return rg.indexOf(r)>=0 || r.indexOf(rg)>=0; });
    if(!hit) return false;
  }
  return true;
}
G.supplierMatches=supplierMatches;

/* 요청 등록 직후 호출 — 트리거가 이미 처리했으면 중복 발송하지 않습니다 */
async function fanoutRequest(req){
  if(!req || SCHEMA.notifications===false) return 0;
  if(req.notified_at) return 0;                       /* DB 트리거가 처리함 */
  var sup=await selectSafe("suppliers", function(q){ return q.limit(500); });
  var pf =await selectSafe("supplier_prefs", function(q){ return q.limit(500); });
  var pmap={}; (pf.data||[]).forEach(function(p){ pmap[String(p.supplier_id)]=p; });
  var targets=(sup.data||[]).filter(function(s){
    return s.user_id && supplierMatches(s, pmap[String(s.id)], req);
  });
  for(var i=0;i<targets.length;i++){
    await insertSafe("notifications",{
      user_id:targets[i].user_id, type:"request",
      title:"새 요청이 등록되었습니다",
      body:(req.title||req.description||req.category)+" · "+(req.region||"전국"),
      link:"req:"+req.id
    });
  }
  if(targets.length) await updateSafe("purchase_requests",{notified_at:new Date().toISOString(), notified_cnt:targets.length},"id",req.id);
  return targets.length;
}
G.fanoutRequest=fanoutRequest;

/* ── 바로견적: 조건이 맞는 업체를 즉시 추천 ── */
async function instantMatches(req, limit){
  var sup=await selectSafe("suppliers", function(q){ return q.limit(500); });
  var pf =await selectSafe("supplier_prefs", function(q){ return q.limit(500); });
  var pmap={}; (pf.data||[]).forEach(function(p){ pmap[String(p.supplier_id)]=p; });
  var list=(sup.data||[]).filter(function(s){ return supplierMatches(s, pmap[String(s.id)], req); });
  list.sort(function(a,b){
    var sa=score(a), sb=score(b);
    return sb-sa;
  });
  return list.slice(0, limit||6);
  function score(s){
    var v=0;
    if(s.instant_quote) v+=40;
    if(s.is_verified) v+=15;
    if(s.haccp) v+=10;
    if(s.livestock_permit) v+=10;
    if(s.brn_verified) v+=5;
    v += Math.min(Number(s.rating)||0,5)*4;
    v += Math.min(Number(s.deal_count)||0,50)*0.4;
    if(s.response_rate!=null) v += Number(s.response_rate)*0.1;
    if(s.avg_response_min!=null && s.avg_response_min>0) v += Math.max(0, 20 - s.avg_response_min/30);
    return v;
  }
}
G.instantMatches=instantMatches;

/* ── 신뢰 지표 표시 ── */
function trustBadges(s){
  if(!s) return "";
  var b=[];
  if(s.is_verified)       b.push('<span class="gbadge gb-or">고리인증</span>');
  if(s.brn_verified||s.brn) b.push('<span class="gbadge gb-gy">사업자</span>');
  if(s.haccp)             b.push('<span class="gbadge gb-ok">HACCP</span>');
  if(s.livestock_permit)  b.push('<span class="gbadge gb-bl">축산물 허가</span>');
  return b.join("");
}
function respText(s){
  if(!s) return "";
  var out=[];
  if(s.response_rate!=null) out.push(s.response_rate+"%");
  if(s.avg_response_min!=null && s.avg_response_min>0){
    var m=Number(s.avg_response_min);
    out.push("평균 "+(m<60?(m+"분"):(m<1440?Math.round(m/60)+"시간":Math.round(m/1440)+"일")));
  }
  return out.join(" · ");
}
G.trustBadges=trustBadges; G.respText=respText;

/* ── 업체 매칭 설정 화면 ── */
window.gOpenPrefs=async function(supplierId){
  if(typeof go==="function") go("prefs");
  var body=$("prefs-body"); if(!body) return;
  if(!ME.user){
    body.innerHTML='<div class="gempty"><div class="gempty-t">로그인이 필요합니다</div>'+
      '<div class="gempty-d">업체 계정으로 로그인하면 관심 분야에 맞는 요청 알림을 받을 수 있습니다.</div>'+
      '<button class="gbtn gbtn-p gbtn-sm" onclick="openModal(\'login\')">로그인</button></div>';
    return;
  }
  var mine=(await selectSafe("suppliers", function(q){ return q.eq("user_id",ME.user.id); })).data||[];
  if(!mine.length){
    body.innerHTML='<div class="gp-hd"><div><div class="gp-title">요청 알림 설정</div></div></div>'+
      '<div class="gempty"><div class="gempty-t">등록된 업체가 없습니다</div>'+
      '<div class="gempty-d">업체를 먼저 등록하면 조건에 맞는 요청이 올라올 때 알림을 받습니다.</div>'+
      '<button class="gbtn gbtn-p gbtn-sm" onclick="go(&quot;sj&quot;)">업체 등록하기</button></div>';
    return;
  }
  var sup=mine.find(function(s){ return String(s.id)===String(supplierId); })||mine[0];
  var pf=(await selectSafe("supplier_prefs", function(q){ return q.eq("supplier_id",String(sup.id)).limit(1); })).data||[];
  var p=pf[0]||{};
  var cats=(p.category_mains&&p.category_mains.length)?p.category_mains:(sup.category_mains||[]);
  var regs=(p.regions&&p.regions.length)?p.regions:(sup.regions||["전국"]);

  body.innerHTML=
    '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="go(&quot;my&quot;)">← 거래관리</button>'+
      '<div><div class="gp-title">요청 알림 설정</div><div class="gp-sub">'+esc(sup.name)+' — 조건에 맞는 요청이 올라오면 바로 알려드립니다</div></div></div>'+
    (mine.length>1?'<div class="gcard"><label class="glabel">업체 선택</label><select class="gin" onchange="gOpenPrefs(this.value)">'+
      mine.map(function(s){ return '<option value="'+esc(s.id)+'"'+(String(s.id)===String(sup.id)?" selected":"")+'>'+esc(s.name)+'</option>'; }).join("")+'</select></div>':'')+
    '<div class="gcard"><div class="gcard-t">받고 싶은 분야</div>'+
      '<div class="gpick" id="pf-cats">'+CATS8.map(function(c){
        return '<button type="button" class="gpick-i'+(cats.indexOf(c.k)>=0?" on":"")+'" data-k="'+c.k+'" onclick="this.classList.toggle(\'on\')">'+esc(c.nm)+'</button>';
      }).join("")+'</div>'+
      '<div class="ghint">선택하지 않으면 업체 등록 분야를 기준으로 알림을 받습니다.</div>'+
    '</div>'+
    '<div class="gcard"><div class="gcard-t">영업 가능 지역</div>'+
      '<div class="gpick" id="pf-regs">'+REGIONS.map(function(r){
        return '<button type="button" class="gpick-i'+(regs.indexOf(r)>=0?" on":"")+'" onclick="this.classList.toggle(\'on\')">'+esc(r)+'</button>';
      }).join("")+'</div>'+
      '<label class="glabel">최소 거래 규모</label>'+
      '<input class="gin" id="pf-min" inputmode="numeric" placeholder="1,000,000 (비우면 전체)" oninput="gNumFmt(this)" value="'+(p.min_amount?Number(p.min_amount).toLocaleString("ko-KR"):"")+'">'+
      '<div class="ghint">이 금액 미만으로 예상되는 요청은 알림에서 제외합니다.</div>'+
    '</div>'+
    '<div class="gcard"><div class="gcard-t">바로견적</div>'+
      '<label class="glabel">바로견적 참여</label>'+
      '<div class="gpick" id="pf-instant">'+
        '<button type="button" class="gpick-i'+(sup.instant_quote?" on":"")+'" onclick="gPickOne(this)">참여</button>'+
        '<button type="button" class="gpick-i'+(sup.instant_quote?"":" on")+'" onclick="gPickOne(this)">미참여</button></div>'+
      '<div class="ghint">참여하면 요청자가 요청을 올린 직후 추천 업체로 먼저 노출됩니다.</div>'+
      '<label class="glabel">기본 조건 한 줄</label>'+
      '<input class="gin" id="pf-note" placeholder="한우 지육 kg당 협의 · 당일 출고 · 경기 무료배송" value="'+esc(sup.instant_note||"")+'">'+
    '</div>'+
    '<div class="gcard"><div class="gcard-t">알림 수신</div>'+
      '<div class="gpick" id="pf-notify">'+
        '<button type="button" class="gpick-i'+(sup.notify_on!==false?" on":"")+'" onclick="gPickOne(this)">받기</button>'+
        '<button type="button" class="gpick-i'+(sup.notify_on===false?" on":"")+'" onclick="gPickOne(this)">받지 않기</button></div>'+
      '<div class="gmsg" id="pf-msg"></div>'+
    '</div>'+
    '<button class="gbtn gbtn-p gbtn-full" onclick="gSavePrefs(\''+esc(sup.id)+'\')">설정 저장</button>';
  window.scrollTo(0,0);
};
window.gPickOne=function(el){
  el.parentNode.querySelectorAll(".gpick-i").forEach(function(b){ b.classList.toggle("on", b===el); });
};
window.gSavePrefs=async function(supId){
  var cats=[]; document.querySelectorAll("#pf-cats .gpick-i.on").forEach(function(b){ cats.push(b.getAttribute("data-k")); });
  var regs=[]; document.querySelectorAll("#pf-regs .gpick-i.on").forEach(function(b){ regs.push(b.textContent.trim()); });
  var instant=(document.querySelector("#pf-instant .gpick-i.on")||{}).textContent==="참여";
  var notify =(document.querySelector("#pf-notify .gpick-i.on")||{}).textContent==="받기";
  var minAmt=num((($("pf-min")||{}).value)||"");
  var payload={ supplier_id:String(supId), user_id:ME.user?ME.user.id:null,
    category_mains:cats, regions:regs, min_amount:minAmt, notify_on:notify };
  var c=client();
  var existing=(await selectSafe("supplier_prefs", function(q){ return q.eq("supplier_id",String(supId)).limit(1); })).data||[];
  var r = existing.length ? await updateSafe("supplier_prefs", payload, "supplier_id", String(supId))
                          : await insertSafe("supplier_prefs", payload);
  if(r.error){ setMsg("pf-msg", r.missingTable?"db/phase3_schema.sql 을 먼저 실행해주세요.":("저장 실패: "+(r.error.message||"")),"err"); return; }
  await updateSafe("suppliers",{ instant_quote:instant, instant_note:(($("pf-note")||{}).value||"").trim()||null,
    notify_on:notify, category_mains:cats.length?cats:null, regions:regs.length?regs:null }, "id", supId);
  toast("알림 설정을 저장했습니다.","ok");
};
