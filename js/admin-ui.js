/* ════════════════════════════════════════════════════════════════════
   관리자 화면 그리기 — 목록 / 편집 / 사업자 정보
   ════════════════════════════════════════════════════════════════════ */

function paintAdmin(){
  var v = $("ad-view"); if(!v) return;
  els(".ad-tab").forEach(function(t){
    t.classList.toggle("on", t.getAttribute("data-t")===AD.tab);
  });
  v.innerHTML = AD.tab==="biz" ? bizView()
              : AD.edit!==null  ? editView()
              : listView();
  var d=$("ad-dirty"); if(d) d.hidden = !AD.dirty;
}

/* ── 목록 ───────────────────────────────────────────────── */
function listView(){
  var bad = P.reduce(function(a,p,i){ return a + (errorsOf(p,i).length?1:0); }, 0);
  return '<div class="ad-bar">'+
      '<div><b>'+P.length+'</b>개 상품'+
        (bad?' <span class="ad-bad">· 고칠 것 '+bad+'개</span>':'')+'</div>'+
      '<div class="ad-bar-r">'+
        '<button class="btn btn-o btn-sm" onclick="resetWork()">사이트 상태로 되돌리기</button>'+
        '<button class="btn btn-o btn-sm" onclick="adNew()">+ 상품 추가</button>'+
        '<button class="btn btn-g btn-sm" onclick="exportProducts()">파일 내보내기</button>'+
      '</div></div>'+
    (P.length ? '<table class="ad-t"><thead><tr>'+
      '<th>사진</th><th>상품명</th><th>분류</th><th class="r">가격(원/kg)</th>'+
      '<th>상태</th><th></th></tr></thead><tbody>'+
      P.map(function(p,i){
        var e = errorsOf(p,i);
        var cat = [wowSpeciesName(p.sp), wowCatName(p.sp,p.cat), wowCatName(p.sp,p.cat,p.item)]
                  .filter(Boolean).join(" › ");
        return '<tr'+(e.length?' class="bad"':'')+'>'+
          '<td class="ad-th">'+imgTag(p.img||"", p.name||"")+'</td>'+
          '<td><b>'+esc(p.name||"(이름 없음)")+'</b><div class="ad-id">'+esc(p.id||"")+'</div>'+
            (e.length?'<div class="ad-err">'+esc(e[0])+'</div>':'')+'</td>'+
          '<td>'+esc(cat||"—")+'</td>'+
          '<td class="r">'+(Number(p.price)?wowWon(p.price):'—')+'</td>'+
          '<td>'+(p.badges||[]).map(ProductBadge).join("")+
            (p.today?'<span class="bdg bdg-soft">오늘</span>':'')+'</td>'+
          '<td class="ad-act">'+
            '<button onclick="adEdit('+i+')">수정</button>'+
            '<button onclick="adCopy('+i+')">복제</button>'+
            '<button class="x" onclick="adDel('+i+')">삭제</button>'+
          '</td></tr>';
      }).join("")+'</tbody></table>'
     : '<div class="ad-empty"><b>상품이 하나도 없습니다</b>'+
       '<p>+ 상품 추가 를 눌러 시작하세요.</p></div>');
}

/* ── 편집 ───────────────────────────────────────────────── */
function fld(label, id, val, ph, hint){
  return '<div class="ad-f"><label for="'+id+'">'+esc(label)+'</label>'+
    '<input id="'+id+'" value="'+esc(val==null?"":val)+'"'+
      (ph?' placeholder="'+esc(ph)+'"':'')+' oninput="adSet(this)">'+
    (hint?'<small>'+esc(hint)+'</small>':'')+'</div>';
}
function sel(label, id, val, opts, hint){
  return '<div class="ad-f"><label for="'+id+'">'+esc(label)+'</label>'+
    '<select id="'+id+'" onchange="adSet(this)">'+
      opts.map(function(o){
        return '<option value="'+esc(o[0])+'"'+(String(val)===String(o[0])?" selected":"")+'>'+esc(o[1])+'</option>';
      }).join("")+'</select>'+
    (hint?'<small>'+esc(hint)+'</small>':'')+'</div>';
}
function chips(label, id, vals, opts, hint){
  vals = vals || [];
  return '<div class="ad-f"><label>'+esc(label)+'</label><div class="ad-chips">'+
    opts.map(function(o){
      var on = vals.map(String).indexOf(String(o[0]))>=0;
      return '<button type="button" class="ad-chip'+(on?" on":"")+'" '+
        'onclick="adToggle(\''+esc(id)+'\',\''+esc(String(o[0]))+'\')">'+esc(o[1])+'</button>';
    }).join("")+'</div>'+(hint?'<small>'+esc(hint)+'</small>':'')+'</div>';
}

function editView(){
  var p = P[AD.edit], i = AD.edit;
  var e = errorsOf(p, i);
  var cats = (WOW_CATS[p.sp]||[]).map(function(c){ return [c.slug, c.name]; });
  var cur  = (WOW_CATS[p.sp]||[]).find(function(c){ return c.slug===p.cat; });
  var items= cur ? [["","(전체)"]].concat(cur.items.map(function(x){ return [x.slug,x.name]; })) : [["","(분류를 먼저 고르세요)"]];

  return '<div class="ad-bar">'+
      '<div><button class="btn btn-o btn-sm" onclick="adBack()">← 목록</button></div>'+
      '<div class="ad-bar-r">'+
        '<button class="btn btn-o btn-sm x" onclick="adDel('+i+')">이 상품 삭제</button>'+
        '<button class="btn btn-g btn-sm" onclick="adBack()">완료</button>'+
      '</div></div>'+
    (e.length ? '<div class="ad-errs"><b>고쳐야 할 것</b><ul>'+
        e.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join("")+'</ul></div>' : '')+
    (function(){ var w = warnsOf(p,i);
      return w.length ? '<div class="ad-warns"><b>확인해 주세요</b><ul>'+
        w.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join("")+'</ul></div>' : ''; })()+
    '<div class="ad-cols"><div class="ad-form">'+
      '<h3>기본</h3>'+
      '<div class="ad-g2">'+
        fld("상품명","f-name",p.name,"예: 한우 소곱창")+
        fld("id (주소에 들어갑니다)","f-id",p.id,"예: b-gopchang","영문 소문자·숫자·하이픈. 한 번 정하면 바꾸지 마세요 — 링크가 죽습니다.")+
      '</div>'+
      '<div class="ad-g3">'+
        sel("축종 구분","f-sp",p.sp, WOW_SPECIES.map(function(s){ return [s.slug,s.name]; }))+
        sel("분류","f-cat",p.cat, cats)+
        sel("세부 품목","f-item",p.item||"", items, "도감·부위안내가 이 값으로 연결됩니다")+
      '</div>'+
      '<h3>표시</h3>'+
      '<div class="ad-g3">'+
        sel("축종","f-breed",p.breed, Object.keys(WOW_BREED).map(function(k){ return [k,WOW_BREED[k]]; }))+
        fld("원산지 표기","f-origin",p.origin,"예: 국내산 한우")+
        fld("가격 (원/kg)","f-price",p.price,"17900","숫자만. 쉼표 없이.")+
      '</div>'+
      '<div class="ad-g3">'+
        sel("보관","f-temp",p.temp, Object.keys(WOW_TEMP).map(function(k){ return [k,WOW_TEMP[k]]; }))+
        sel("손질 상태","f-trim",p.trim, Object.keys(WOW_TRIM).map(function(k){ return [k,WOW_TRIM[k]]; }))+
        fld("작업일","f-workDate",p.workDate,"2026-09-22","부위안내에 표시됩니다")+
      '</div>'+
      '<h3>사진</h3>'+
      '<div class="ad-g2">'+
        fld("사진 파일 이름","f-img",p.img,"p-gopchang","img/ 안의 파일 이름입니다. 확장자는 빼고 적으세요.")+
        '<div class="ad-f"><label>있는 사진에서 고르기</label>'+
          '<select onchange="adPick(this.value)"><option value="">— 고르기 —</option>'+
            IMG_KNOWN.map(function(n){ return '<option value="'+esc(n)+'"'+(p.img===n?" selected":"")+'>'+esc(n)+'</option>'; }).join("")+
          '</select><small id="img-chk"></small></div>'+
      '</div>'+
      '<h3>배지 · 옵션</h3>'+
      chips("배지","badges",p.badges,[["new","NEW"],["best","BEST"],["sale","특가"]],
            "특가 배지를 달아도 가격은 따로 내려야 합니다 — 배지만 달면 손님에게 거짓말이 됩니다")+
      '<div class="ad-f"><label class="ad-ck"><input type="checkbox" id="f-today"'+
        (p.today?" checked":"")+' onchange="adSet(this)"><span>오늘 들어온 부산물에 올립니다</span></label></div>'+
      chips("판매단위 (kg)","units",p.units,[[1,"1kg"],[5,"5kg"],[10,"10kg"],[20,"20kg"]])+
      chips("고를 수 있는 가공상태","trims",p.trims,
            Object.keys(WOW_TRIM).map(function(k){ return [k,WOW_TRIM[k]]; }))+
      chips("용도","uses",p.uses,
            WOW_FILTERS.find(function(f){ return f.key==="use"; }).opts,
            "여기 넣은 값으로 목록 필터가 걸립니다")+
      '<h3>평점 · 후기</h3>'+
      '<div class="ad-g2">'+
        fld("평점 (0~5)","f-rating",p.rating,"4.9")+
        fld("후기 수","f-reviews",p.reviews,"0","⚠️ 실제 후기가 쌓이기 전에는 0 으로 두세요. 숫자만 적어 두면 상세에 '(N개 리뷰)' 라고 나옵니다.")+
      '</div>'+
    '</div>'+
    '<aside class="ad-prev"><h3>손님에게 이렇게 보입니다</h3>'+
      '<div class="pg pg-1">'+ProductCard(p)+'</div>'+
      '<p class="ad-prev-n">목록·홈·검색 결과에 이 모양으로 나옵니다.</p>'+
    '</aside></div>';
}

/* ── 사업자 정보 ────────────────────────────────────────── */
function bizView(){
  var miss = BIZ_FIELDS.filter(function(f){ return f[3] && !String(B[f[0]]||"").trim(); });
  return '<div class="ad-bar">'+
      '<div>'+(miss.length
        ? '<span class="ad-bad">필수 '+miss.length+'개가 비어 있습니다</span>'
        : '<b>필수 항목이 다 찼습니다</b>')+'</div>'+
      '<div class="ad-bar-r"><button class="btn btn-g btn-sm" onclick="exportBiz()">파일 내보내기</button></div>'+
    '</div>'+
    '<div class="ad-note">여기 채운 값이 <b>푸터 · 이용약관 · 개인정보처리방침</b>에 한꺼번에 반영됩니다. '+
      '빈 칸은 화면에서 줄째 빠집니다 — "(미기재)" 를 찍지 않습니다.</div>'+
    '<div class="ad-form ad-biz">'+
      BIZ_FIELDS.map(function(f){
        var id="b-"+f[0], v=B[f[0]]||"";
        return '<div class="ad-f'+(f[3]&&!String(v).trim()?" need":"")+'">'+
          '<label for="'+id+'">'+esc(f[1])+(f[3]?' <em>필수</em>':'')+'</label>'+
          '<input id="'+id+'" value="'+esc(v)+'"'+(f[2]?' placeholder="'+esc(f[2])+'"':'')+
            ' oninput="bizSet(\''+esc(f[0])+'\',this.value)">'+
          (f[2]?'<small>'+esc(f[2])+'</small>':'')+'</div>';
      }).join("")+
    '</div>';
}

/* ── 조작 ───────────────────────────────────────────────── */
var FMAP = { "f-name":"name","f-id":"id","f-sp":"sp","f-cat":"cat","f-item":"item",
  "f-breed":"breed","f-origin":"origin","f-price":"price","f-temp":"temp","f-trim":"trim",
  "f-img":"img","f-rating":"rating","f-reviews":"reviews","f-today":"today","f-workDate":"workDate" };

window.adSet = function(el){
  var k = FMAP[el.id]; if(!k) return;
  var p = P[AD.edit];
  if(el.type==="checkbox") p[k] = el.checked;
  else if(k==="price"||k==="reviews") p[k] = parseInt(String(el.value).replace(/[^\d]/g,""),10) || 0;
  else if(k==="rating") p[k] = Math.min(5, Math.max(0, Number(el.value)||0));
  else p[k] = el.value;
  /* 축종 구분을 바꾸면 분류가 그 축종에 없을 수 있습니다 — 첫 분류로 맞춥니다 */
  if(k==="sp"){
    var cs = WOW_CATS[p.sp]||[];
    if(!cs.some(function(c){ return c.slug===p.cat; })) { p.cat = cs.length?cs[0].slug:""; p.item=""; }
  }
  if(k==="cat") p.item = "";
  saveWork();
  /* ⚠️ 다시 그리기(paintAdmin)가 #img-chk 를 지웁니다.
     반드시 **그린 뒤에** 확인해야 표시가 남습니다. */
  if(k==="img") setTimeout(function(){ checkImg(p.img); }, 0);
};
window.adToggle = function(field, val){
  var p = P[AD.edit];
  var a = (p[field]||[]).slice();
  var v = (field==="units") ? Number(val) : val;
  var i = a.map(String).indexOf(String(v));
  if(i<0) a.push(v); else a.splice(i,1);
  if(field==="units") a.sort(function(x,y){ return x-y; });
  p[field] = a; saveWork();
};
window.adPick = function(v){ if(!v) return; P[AD.edit].img = v; saveWork(); };
function checkImg(name){
  imgExists(name, function(has){
    var s=$("img-chk"); if(!s) return;
    s.textContent = has ? "✓ 이 사진이 있습니다" : "✕ img/ 에 이 파일이 없습니다 — 카드가 빈 상자가 됩니다";
    s.className = has ? "ok" : "no";
  });
}
window.adNew = function(){
  P.push({ id:"", sp:"beef", cat:(WOW_CAT_BEEF[0]||{}).slug||"gut", item:"", name:"",
           breed:"hanwoo", origin:"국내산 한우", price:0, temp:"chill", trim:"full",
           img:"", badges:[], units:[1,5,10], trims:["raw","wash","full"], uses:[] });
  AD.edit = P.length-1; saveWork();
};
window.adEdit = function(i){ AD.edit = i; paintAdmin(); setTimeout(function(){ checkImg(P[i].img); },0); };
window.adBack = function(){ AD.edit = null; paintAdmin(); };
window.adCopy = function(i){
  var c = JSON.parse(JSON.stringify(P[i]));
  c.id = (c.id||"item")+"-copy"; c.name = (c.name||"")+" (복제)";
  P.splice(i+1,0,c); AD.edit = i+1; saveWork();
};
window.adDel = function(i){
  if(!confirm("“"+(P[i].name||P[i].id||"이 상품")+"” 을 목록에서 뺍니다. 계속할까요?")) return;
  P.splice(i,1); AD.edit = null; saveWork();
};
window.bizSet = function(k,v){ B[k]=v; saveBiz(); };
window.adTab = function(t){ AD.tab=t; AD.edit=null; paintAdmin(); };

function bootAdmin(){
  loadWork(); loadBiz(); paintAdmin();
  /* 저장 안 한 채로 창을 닫으려 하면 붙잡습니다 — 파일로 내보내지
     않으면 사이트에는 아무것도 반영되지 않기 때문입니다. */
  window.addEventListener("beforeunload", function(e){
    if(!AD.dirty) return;
    e.preventDefault(); e.returnValue = "";
  });
}
/* ⚠️ 여기서 스스로 시작하지 않습니다. admin-gate.js 가 잠금을 푼 뒤에
   bootAdmin() 을 부릅니다. 여기서 부르면 잠겨 있어도 내용이 그려집니다. */
window.bootAdmin = bootAdmin;
