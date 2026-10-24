

var RQ = { asked:false, on:false, signedIn:false, role:"", name:"",
           rows:null, provs:[], fil:"", open:"", to:"", busy:false,
           ctx:{},

           deals:[], fees:[], hist:null, histOf:"", money:"", mctx:{},

           itemOf:"", ictx:{} ,

           pvq:{}, pvw:{},

           staff:[], mine:false, conOf:"", con:null, conBusy:false,

           contacts:[], settles:[], pvOf:"", pctx:{}, sctx:{} };

function rqDraw(){
  var root = $("rq");
  if(!root) return;

  if(!RQ.asked || !RQ.on){ root.innerHTML = ""; return; }

  root.innerHTML =
    '<section class="ad-s rq-s rq-s-rq">'+
      '<h2>접수 · 배정</h2>'+
      rqBody()+
    '</section>'+
    (RQ.signedIn ? rqMoney() + rqFees() + rqSettles() + rqProvs() : "");
}

function rqBody(){
  if(!RQ.signedIn) return rqSignIn();
  if(RQ.role !== "staff" && RQ.role !== "admin") return rqNoRole();
  return rqList();
}

function rqSignIn(){
  return '<p class="ad-lead">접수를 보려면 <b>로그인</b>하셔야 합니다. '+
      '비밀번호는 받지 않습니다 — 적어 주신 메일로 <b>한 번 쓰는 링크</b>를 '+
      '보내 드리고, 그 링크를 누르면 들어옵니다.</p>'+
    '<form class="rq-in" onsubmit="return rqSend(event)">'+
      '<div class="f-r">'+
        '<label for="rq-em">메일 주소</label>'+
        '<div class="rq-in-r">'+
          '<input id="rq-em" type="email" required autocomplete="email" '+
            'placeholder="name@example.com">'+
          '<button class="btn btn-b" type="submit">'+icon("mail",18)+'링크 받기</button>'+
        '</div>'+
        '<p class="f-h">받은 편지함에 안 보이면 스팸함도 보세요.</p>'+
      '</div>'+
      '<p class="rq-in-n" id="rq-em-n"></p>'+
    '</form>';
}

window.rqSend = function(ev){
  if(ev && ev.preventDefault) ev.preventDefault();
  var el = $("rq-em"), n = $("rq-em-n");
  if(!el) return false;
  if(n){ n.className = "rq-in-n"; n.textContent = "보내는 중…"; }
  window.amAuthSend(el.value).then(function(r){
    if(!n) return;
    n.className = "rq-in-n " + (r.ok ? "ok" : "bad");
    n.textContent = r.say;
  });
  return false;
};

function rqNoRole(){
  return '<div class="notice-bad">'+
      '<b>이 계정에는 접수를 볼 권한이 없습니다</b>'+
      '<p>지금 역할은 <b>'+esc(window.amRoleName ? amRoleName(RQ.role) : RQ.role)+
      '</b> 입니다. 가입하면 누구나 <b>고객</b>으로 시작하고, 직원 · 관리자는 '+
      '<b>SQL 로만</b> 올립니다 — 화면에 올리는 단추를 두면 누구나 관리자가 '+
      '됩니다. Supabase 의 SQL Editor 에서 한 줄입니다.</p>'+
      '<pre class="rq-sql">update account set role = \'admin\'\n'+
      ' where id = \'&lt;내 user id&gt;\';</pre>'+
      '<p>user id 는 Supabase → Authentication → Users 에서 보입니다.</p>'+
    '</div>'+ rqOutRow();
}

function rqOutRow(){
  return '<p class="rq-out">'+esc(RQ.name || "로그인됨")+
    ' <button class="btn btn-o btn-sm" type="button" onclick="rqOut()">나가기</button></p>';
}

window.rqOut = function(){
  window.amAuthOut().then(function(){
    RQ.signedIn = false; RQ.role = ""; RQ.name = ""; RQ.rows = null;
    RQ.open = ""; RQ.to = "";
    rqDraw();
  });
};

function rqList(){
  if(RQ.rows === null)
    return '<p class="ad-empty">불러오는 중…</p>' + rqOutRow();

  var L = RQ.rows;
  if(!L.length)
    return '<p class="ad-empty">아직 들어온 접수가 없습니다. '+
      '손님이 견적 요청을 넣으시면 여기에 쌓입니다.</p>' + rqOutRow();

  var shown = RQ.fil ? L.filter(function(r){ return r.state === RQ.fil; }) : L;
  if(RQ.mine) shown = shown.filter(rqIsMine);

  return '<p class="ad-lead">'+
      '<b>목록에는 성함 · 연락처가 없습니다</b> — 가져오지 않습니다. '+
      '배정하면 그때 업체에게만 갑니다 (개인정보보호법 제17조). '+
      '상태를 바꾸면 <b>누가 · 언제 · 왜</b>가 DB 에 같이 남습니다.</p>'+
    rqChips(L)+
    '<div class="rq-g">'+ shown.map(rqRow).join("") +'</div>'+
    '<p class="rq-note">위 숫자는 <b>최근 '+L.length+'건에서 센 값</b>입니다. '+
      '전체 누적이 아닙니다.</p>'+
    rqOutRow();
}

function rqChips(L){
  var n = {}, i;
  for(i = 0; i < L.length; i++) n[L[i].state] = (n[L[i].state] || 0) + 1;

  var meN = L.filter(rqIsMine).length;
  var out = '<div class="chip-g chip-g-fil rq-fil">'+
    '<button class="chip'+(!RQ.fil && !RQ.mine ? " on" : "")+'" type="button" '+
      'onclick="rqFil(\'\')">전체 '+L.length+'</button>'+
    (RQ.me ? '<button class="chip'+(RQ.mine ? " on" : "")+'" type="button" '+
      'onclick="rqMineGo()">내 건 '+meN+'</button>' : '');
  (window.AM_DEAL_ST || []).forEach(function(s){
    if(!n[s.key]) return;
    out += '<button class="chip'+(RQ.fil === s.key ? " on" : "")+'" type="button" '+
      'onclick="rqFil(\''+esc(s.key)+'\')">'+esc(s.name)+' '+n[s.key]+'</button>';
  });
  return out + '</div>';
}

window.rqFil = function(k){ RQ.fil = k; RQ.mine = false; RQ.open = ""; RQ.to = ""; rqDraw(); };
window.rqMineGo = function(){ RQ.mine = !RQ.mine; RQ.fil = ""; RQ.open = ""; rqDraw(); };
function rqIsMine(r){ return !!(RQ.me && r.owner_id === RQ.me); }

function rqStaffName(id){
  var L = RQ.staff || [], i;
  for(i = 0; i < L.length; i++) if(L[i].id === id)
    return (L[i].name || "").trim() || ("직원 " + String(id).slice(0, 4));
  return "직원 " + String(id || "").slice(0, 4);
}

function rqOwnerRow(r){
  var L = RQ.staff || [];
  return '<div class="rq-s rq-own-b"><h4>담당자</h4>'+
    (!L.length
      ? '<p class="f-h">직원 계정이 아직 없습니다. '+
        '관리자가 <code>update account set role=\'staff\' where id=\'…\'</code> 로 '+
        '올려 주시면 여기 고르개에 나옵니다.</p>'
      : '<div class="f-r">'+
          '<label for="rq-own-'+esc(r.id)+'">이 건을 맡은 사람</label>'+
          '<select id="rq-own-'+esc(r.id)+'" class="sel" '+
            'onchange="rqOwnerGo(\''+esc(r.id)+'\',this.value)">'+
            '<option value="">담당자 없음</option>'+
            L.map(function(a){
              return '<option value="'+esc(a.id)+'"'+
                (r.owner_id === a.id ? " selected" : "")+'>'+
                esc((a.name || "").trim() || ("직원 " + String(a.id).slice(0,4)))+
                (a.role === "admin" ? " (관리자)" : "")+'</option>';
            }).join("")+
          '</select>'+
          '<p class="f-h">바꾸면 <b>누가 · 언제</b>가 기록에 같이 남습니다. '+
            '고객에게는 안 보입니다.</p>'+
        '</div>'+
        (RQ.me && r.owner_id !== RQ.me
          ? '<button class="btn btn-o btn-sm" type="button" '+
            'onclick="rqOwnerGo(\''+esc(r.id)+'\',\''+esc(RQ.me)+'\')">내가 맡기</button>'
          : ''))+
  '</div>';
}

window.rqOwnerGo = function(id, who){
  rqCall("set_owner", { p_request:id, p_owner: who || null,
    p_why: who ? "담당자 배정" : "담당자 해제" },
    who ? "담당자를 정했습니다" : "담당자를 비웠습니다");
};

function rqContactRow(r){
  var mine = RQ.conOf === r.id, c = mine ? RQ.con : null;
  return '<div class="rq-s rq-con-b"><h4>연락처 · 요청 내용</h4>'+
    (!c
      ? '<p class="f-h">전화를 걸어야 할 때만 여세요 — '+
          '<b>열어 본 것이 기록에 남습니다</b> (제29조 접속기록).</p>'+
        '<button class="btn btn-b" type="button"'+
          (RQ.conBusy ? " disabled" : "")+
          ' onclick="rqContactGo(\''+esc(r.id)+'\')">'+
          (RQ.conBusy && mine ? "불러오는 중…" : "연락처 보기")+'</button>'
      : '<dl class="rq-con">'+
          rqConItem("성함", c.name)+

          (c.tel ? '<dt>연락처</dt><dd><a class="rq-tel" href="tel:'+
             esc(String(c.tel).replace(/[^0-9+]/g, ""))+'">'+esc(c.tel)+'</a></dd>' : '')+
          rqConItem("이메일", c.email)+
          rqConItem("넘기고 싶은 시점", c.want_at)+
          rqConItem("필요한 것", c.body)+
          rqConDetail(c.detail)+
        '</dl>'+
        '<p class="f-h">⚠️ 업체에 넘기는 것은 <b>배정</b>이고, 그때 상호를 '+
          '알리고 <b>제3자 제공 동의</b>를 다시 받습니다 (제17조 제2항).</p>')+
  '</div>';
}

function rqConItem(k, v){

  if(v == null || String(v).trim() === "") return "";
  return '<dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd>';
}

function rqConDetail(d){
  if(!d || typeof d !== "object") return "";
  var K = Object.keys(d).filter(function(k){
    return d[k] != null && String(d[k]).trim() !== ""; });
  if(!K.length) return "";
  return K.map(function(k){
    return '<dt>'+esc(k)+'</dt><dd>'+esc(d[k])+'</dd>'; }).join("");
}

window.rqContactGo = function(id){
  if(RQ.conBusy) return;
  RQ.conBusy = true; RQ.conOf = id; RQ.con = null; rqDraw();
  fetch("/api/me?c=1&r=" + encodeURIComponent(id), {
    headers: Object.assign({ accept:"application/json" }, window.amAuthHeaders()) })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(d){
      RQ.conBusy = false;

      if(!d || !d.contact){ RQ.conOf = ""; toast("연락처를 불러오지 못했습니다"); }
      else { RQ.con = d.contact; if(d.history) RQ.hist = d.history; }
      rqDraw();
    })
    .catch(function(e){
      RQ.conBusy = false; RQ.conOf = "";
      try{ console.warn("[rq] contact — " + e); }catch(_){}
      toast("연결이 끊겼습니다. 잠시 뒤 다시 눌러 주세요");
      rqDraw();
    });
};

function rqRow(r){
  var st   = (window.amDealSt && amDealSt(r.state)) || null;
  var open = RQ.open === r.id;

  var meta = [
    rqSideName(r.side), rqCatName(r.cat), rqIndName(r.industry), rqRegName(r)
  ].filter(Boolean).join(" · ");
  var day = window.amDate(String(r.created_at || "").slice(0, 10));

  return '<article class="rq-r'+(open ? " on" : "")+'">'+
    '<button class="rq-hd" type="button" onclick="rqOpen(\''+esc(r.id)+'\')">'+
      '<span class="rq-hd-l">'+
        (r.no ? '<b class="rq-no">'+esc(r.no)+'</b>' : '')+
        '<span class="rq-m">'+esc(meta || "조건이 적혀 있지 않습니다")+'</span>'+
      '</span>'+
      '<span class="rq-hd-r">'+

        '<i class="myq-st myq-'+esc(window.amDealTone ? amDealTone(r.state) : "gray")+
          '">'+esc(st ? st.name : r.state)+'</i>'+

        '<i class="rq-own'+(rqIsMine(r) ? " on" : "")+'">'+
          esc(r.owner_id ? rqStaffName(r.owner_id) : "담당자 없음")+'</i>'+
        (day ? '<em class="rq-d">'+esc(day)+'</em>' : '')+
      '</span>'+
    '</button>'+
    (open ? '<div class="rq-bd">'+ rqOwnerRow(r) + rqContactRow(r) +
              rqItems(r) + rqMove(r) + rqAsg(r) +
              rqQuotes(r) + rqHistRow(r) +'</div>' : '')+
  '</article>';
}

window.rqOpen = function(id){
  RQ.open = (RQ.open === id) ? "" : id;
  RQ.to = ""; RQ.ctx = {};

  RQ.histOf = ""; RQ.hist = null;

  RQ.itemOf = ""; RQ.ictx = {};

  RQ.conOf = ""; RQ.con = null;
  rqDraw();
};

window.rqCtx = function(k, v){ RQ.ctx[k] = v; };

function rqSideName(v){
  var s = (typeof amSide === "function") ? amSide(v) : null;
  return s ? s.short : "";
}
function rqCatName(k){
  var L = window.AM_CATS || [], i;
  for(i = 0; i < L.length; i++) if(L[i].key === k) return L[i].name;
  return "";
}
function rqIndName(k){
  var L = window.AM_INDUSTRIES || [], i;
  for(i = 0; i < L.length; i++) if(L[i].key === k) return L[i].name;
  return "";
}
function rqRegName(r){
  var nm = window.amRegionName ? amRegionName(r.region) : "";
  return [nm, r.gu].filter(Boolean).join(" ");
}

function rqMoves(r){
  return (window.amDealMoves ? amDealMoves(r.state, RQ.role) : []).filter(function(m){
    var s = amDealSt(m[1]);
    return s && !s.money;
  });
}

function rqMove(r){
  var M = rqMoves(r);
  if(!M.length)
    return '<p class="rq-none">여기서 '+
      esc(window.amRoleName ? amRoleName(RQ.role) : RQ.role)+
      ' 이(가) 옮길 수 있는 길이 없습니다.</p>';

  var sel = M.filter(function(m){ return m[1] === RQ.to; })[0];

  return '<div class="rq-mv">'+
    '<div class="f-r">'+
      '<label for="rq-to">다음 상태</label>'+
      '<select id="rq-to" class="sel" onchange="rqSetTo(this.value)">'+
        '<option value="">골라 주세요</option>'+
        M.map(function(m){
          return '<option value="'+esc(m[1])+'"'+(RQ.to === m[1] ? " selected" : "")+'>'+
            esc(amDealStName(m[1]))+'</option>';
        }).join("")+
      '</select>'+
    '</div>'+
    (sel ? rqNeed(sel, r) +
      '<div class="ad-acts">'+
        '<button class="btn btn-b" type="button"'+(RQ.busy ? " disabled" : "")+
          ' onclick="rqGo(\''+esc(r.id)+'\')">'+icon("check",18)+
          (RQ.busy ? "보내는 중…" : "이 상태로 바꾸기")+'</button>'+
      '</div>' : '')+
  '</div>';
}

window.rqSetTo = function(v){ RQ.to = v; rqDraw(); };

function rqNeed(m, r){
  var need = m[3] || [], out = "";

  if(need.indexOf("why") >= 0)
    out += '<div class="f-r">'+
      '<label for="rq-why">사유</label>'+
      '<textarea id="rq-why" rows="2" spellcheck="false" '+
        'oninput="rqCtx(\'why\',this.value)" '+
        'placeholder="예: 사장님이 다음 달에 다시 연락 달라고 하셨습니다">'+
        esc(RQ.ctx.why || "")+'</textarea>'+
      '<p class="f-h">§8 — 왜 이렇게 바뀌었는지가 안 남으면 '+
        '다음 사람이 이 건을 어떻게 다룰지 모릅니다.</p>'+
    '</div>';

  if(need.indexOf("amount") >= 0)
    out += '<div class="f-r">'+
      '<label for="rq-amt">계약금액 (원)</label>'+
      '<input id="rq-amt" type="number" min="0" step="1" inputmode="numeric" '+
        'oninput="rqCtx(\'amount\',this.value)" '+
        'value="'+esc(RQ.ctx.amount == null ? "" : RQ.ctx.amount)+'" '+
        'placeholder="10000000">'+
      '<p class="f-h">⚠️ 수수료는 여기서 <b>확정되지 않습니다</b>. '+
        '증빙을 보고 관리자가 따로 확정합니다 (§8 마지막 문장).</p>'+
    '</div>';

  if(need.indexOf("providerId") >= 0) out += rqPvField(r);

  if(need.indexOf("agree3rd") >= 0)
    out += '<div class="notice-bad rq-a3">'+
        '<b>배정은 제3자 제공입니다 — 개인정보보호법 제17조 제2항</b>'+
        '<p>배정하면 그 업체에게 사장님의 <b>성함 · 연락처 · 요청 내용</b>이 '+
        '갑니다. 접수 때 받은 동의에는 <b>그것이 들어 있지 않습니다</b> — '+
        '어느 업체에 줄지가 정해지지 않았기 때문입니다. '+
        '<b>업체 상호를 알려 드리고 그 자리에서 다시 동의를 받으신 뒤</b> '+
        '아래를 켜세요. 받지 않고 켜면 그 순간 법 위반입니다.</p>'+
      '</div>'+
      '<label class="f-ck rq-ck"><input id="rq-a3" type="checkbox"'+
        (RQ.ctx.agree3rd ? " checked" : "")+
        ' onchange="rqCtx(\'agree3rd\',this.checked)">'+
        '<span>고객에게 <b>업체 상호를 알리고</b> 연락처 전달 동의를 '+
        '받았습니다</span></label>';

  return out;
}

function rqPvOpt(p, cur){
  var on = p.assignable !== false;
  return '<option value="'+esc(p.id)+'"'+
    (cur === p.id ? " selected" : "")+(on ? "" : " disabled")+'>'+
    esc(p.name)+
    (on ? (p.listed ? "" : " (아직 공개 전)") : " — 배정 가능 꺼짐")+
  '</option>';
}

function rqPvFit(p, w){
  if(!w) return false;
  if(p.assignable === false) return false;
  var subs = p.subs || [];
  if(w.sub){
    if(subs.indexOf(w.sub) < 0) return false;
  }else if(w.cat){

    var c = (typeof amCat === "function") ? amCat(w.cat) : null;
    if(!c || typeof amProviderInCat !== "function") return false;
    if(!amProviderInCat(p, c)) return false;
  }
  var R = p.regions || [];
  if(w.region && R.length && R.indexOf(w.region) < 0) return false;
  var I = p.industries || [];
  if(w.industry && I.length && I.indexOf(w.industry) < 0) return false;
  return true;
}

function rqPvWhy(w){
  var L = [];
  if(w && (w.sub || w.cat)) L.push("하는 일");
  if(w && w.region) L.push(
    (typeof amRegionName === "function" ? amRegionName(w.region) : w.region) || "지역");
  if(w && w.industry) L.push(
    (typeof amIndustryName === "function" ? amIndustryName(w.industry) : w.industry) || "업종");
  return L;
}

function rqPvHit(p, q){
  if(!q) return true;
  var hay = [p.name || "", p.id || ""];
  (p.regions || []).forEach(function(k){
    hay.push(k);
    if(typeof amRegionName === "function") hay.push(amRegionName(k) || ""); });
  (p.gu || []).forEach(function(g){ hay.push(g); });
  (p.industries || []).forEach(function(k){
    hay.push(k);
    if(typeof amIndustryName === "function") hay.push(amIndustryName(k) || ""); });
  (p.subs || []).forEach(function(k){
    hay.push(k);
    var one = (typeof amSubName === "function") ? amSubName(k) : "";
    if(one) hay.push(one); });
  return hay.join(" ").toLowerCase().replace(/\s+/g, "")
    .indexOf(String(q).toLowerCase().replace(/\s+/g, "")) >= 0;
}

function rqPvBox(key, want, cur, onch){
  RQ.pvw[key] = want || null;
  return '<div class="rq-pvb" id="'+esc(key)+'-box">'+
    rqPvIn(key)+
    '<div class="f-r">'+
      '<label for="'+esc(key)+'">'+
        (want && want.item ? "이 서비스를 맡길 업체" : "배정할 업체")+'</label>'+
      '<select id="'+esc(key)+'" class="sel" onchange="'+onch+'">'+
        rqPvOpts(key, cur)+
      '</select>'+
      '<p class="f-h" id="'+esc(key)+'-n">'+rqPvNote(key, cur)+'</p>'+
    '</div>'+
  '</div>';
}

function rqPvIn(key){
  var q = RQ.pvq[key] || "";
  return '<div class="f-r rq-pvq">'+
    '<label for="'+esc(key)+'-q">업체 찾기</label>'+
    '<input id="'+esc(key)+'-q" class="in" type="search" '+
      'value="'+esc(q)+'" placeholder="상호 · 지역 · 업종 · 하는 일" '+
      'oninput="rqPvQ(\''+esc(key)+'\',this.value)">'+
  '</div>';
}

function rqPvOpts(key, cur){
  var P   = RQ.provs || [], w = RQ.pvw[key], q = RQ.pvq[key] || "";
  var L   = P.filter(function(p){ return rqPvHit(p, q) || p.id === cur; });
  var fit = w ? L.filter(function(p){ return rqPvFit(p, w); }) : [];
  var rest= L.filter(function(p){ return fit.indexOf(p) < 0; });
  var o = '<option value="">골라 주세요</option>';
  if(fit.length)
    o += '<optgroup label="조건에 맞는 곳 '+fit.length+'곳">'+
      fit.map(function(p){ return rqPvOpt(p, cur); }).join("")+'</optgroup>';
  if(rest.length)
    o += '<optgroup label="'+(fit.length ? "그 밖 " : "")+rest.length+'곳">'+
      rest.map(function(p){ return rqPvOpt(p, cur); }).join("")+'</optgroup>';
  return o;
}

function rqPvNote(key, cur){
  var P = RQ.provs || [], w = RQ.pvw[key], q = RQ.pvq[key] || "";
  var L = P.filter(function(p){ return rqPvHit(p, q); });

  var kept = !!cur && !L.some(function(p){ return p.id === cur; }) &&
             P.some(function(p){ return p.id === cur; });
  var on = L.filter(function(p){ return p.assignable !== false; }).length;
  var fit= w ? L.filter(function(p){ return rqPvFit(p, w); }).length : 0;
  var why= rqPvWhy(w);
  var t = "";
  if(q) t += '찾으신 말에 '+L.length+'곳이 걸렸습니다 (등록 '+P.length+'곳) — '+
    (P.length - L.length)+'곳은 검색으로 빠졌습니다. '+
    (kept ? '<b>고르신 곳은 찾으신 말과 안 맞아도 그대로 둡니다.</b> ' : '');
  else  t += '고를 수 있는 업체는 '+on+'곳입니다 (등록 '+P.length+'곳). ';
  if(why.length)
    t += '<b>'+esc(why.join(" · "))+'</b>이 맞는 곳 '+fit+'곳을 위에 모았습니다 — '+
      '추천이 아니라 <b>조건이 맞는 것</b>이고, 평점 · 응답속도로 줄을 세우지 '+
      '않습니다 (재는 장치가 없습니다). 고르는 것은 사람입니다.';
  if(on < L.length)
    t += ' ⚠️ <b>'+(L.length - on)+'곳</b>은 <b>배정 가능</b>이 꺼져 있습니다 — '+
      '제휴 계약을 확인하고 아래 <b>업체 · 공개 승인</b> 에서 켜 주세요. '+
      '켜기 전에 배정하면 그 순간 성함 · 연락처가 그 업체로 넘어갑니다 '+
      '(개인정보보호법 제17조).';
  return t;
}

window.rqPvQ = function(key, v){
  RQ.pvq[key] = v;
  var sel = document.getElementById(key), n = document.getElementById(key + "-n");
  var cur = sel ? sel.value : "";
  if(sel) sel.innerHTML = rqPvOpts(key, cur);
  if(n)   n.innerHTML   = rqPvNote(key, cur);
};

function rqPvField(r){
  var P = RQ.provs || [];
  if(!P.length)
    return '<div class="notice-bad">'+
      '<b>등록된 업체가 0곳입니다 — 배정할 곳이 없습니다</b>'+
      '<p>업체를 먼저 등록하셔야 합니다. 위 <b>영업 작업대</b>에서 찾아 '+
      '전화하고, 입점에 동의한 업체를 Supabase 의 <b>provider</b> 표에 '+
      '한 줄 넣으면 여기 고르개에 바로 나옵니다 '+
      '(<b>listed</b> 가 꺼져 있어도 직원 · 관리자에게는 보입니다).</p>'+
    '</div>';

  return rqPvBox("rq-pv", rqWant(r), RQ.ctx.providerId,
                 "rqCtx('providerId',this.value)");
}

function rqWant(r){
  if(!r) return null;
  return { cat:r.cat || "", region:r.region || "",
           industry:r.industry || "" };
}

function rqItems(r){
  var L = r.request_item || [];
  if(!L.length) return "";
  return '<div class="rq-it">'+
    '<b class="rq-it-h">신청 서비스 '+esc(L.length)+'개 — 서비스마다 따로 배정하세요</b>'+
    '<ul class="rq-it-l">'+L.map(function(it){ return rqItemRow(it, r); }).join("")+'</ul>'+
    '<p class="f-h">서비스마다 다른 업체에 보낼 수 있습니다. '+
      '배정은 <b>제3자 제공</b>이라 서비스마다 동의를 따로 기록합니다 '+
      '(개인정보보호법 제17조 제2항).</p>'+
  '</div>';
}

function rqItemRow(it, r){
  var open = RQ.itemOf === it.id;
  var st   = (window.amDealSt && amDealSt(it.state)) || null;
  var A    = it.assignment || [];

  var d    = it.detail && typeof it.detail === "object" ? it.detail : {};
  var keys = Object.keys(d);
  return '<li class="rq-it-i'+(open ? " on" : "")+'">'+
    '<button class="rq-it-b" type="button" onclick="rqItemOpen(\''+esc(it.id)+'\')">'+
      '<span class="rq-it-n">'+esc(rqSvcName(it.service_id))+'</span>'+
      '<i class="myq-st myq-'+esc(window.amDealTone ? amDealTone(it.state) : "gray")+
        '">'+esc(st ? st.name : it.state)+'</i>'+
    '</button>'+
    (A.length
      ? '<p class="rq-it-pv">'+icon("check",14)+' '+
          esc(A.map(function(a){ return rqPvName(a.provider_id) || a.provider_id; })
               .join(" · "))+'</p>'
      : '')+
    (open ? rqItemForm(it, keys, d, r) : "")+
  '</li>';
}

function rqSvcName(k){
  var one = (typeof amPickOne === "function") ? amPickOne(k) : null;
  if(one) return one.sub ? (one.desc + " · " + one.name) : one.name;
  var c = (window.AM_CATS || []).filter(function(x){ return x.key === k; })[0];
  return c ? c.name : k;
}

window.rqItemOpen = function(id){
  RQ.itemOf = (RQ.itemOf === id) ? "" : id;
  RQ.ictx = {};
  rqDraw();
};
window.rqIctx = function(k, v){ RQ.ictx[k] = v; };

function rqItemWant(it, r){
  var id = String((it && it.service_id) || ""), i = id.indexOf("/");

  return { item:true,
           cat: i > 0 ? id.slice(0, i) : id,
           sub: i > 0 ? id.slice(i + 1) : "",
           region:   (r && r.region) || "",
           industry: (r && r.industry) || "" };
}

function rqItemForm(it, keys, d, r){
  var P = RQ.provs || [];
  return '<div class="rq-it-f">'+
    (keys.length
      ? '<dl class="rq-it-d">'+keys.map(function(k){
          return '<dt>'+esc(k)+'</dt><dd>'+esc(d[k])+'</dd>'; }).join("")+'</dl>'
      : '')+
    (P.length

      ? rqPvBox("rq-ipv-" + it.id, rqItemWant(it, r), RQ.ictx.providerId,
                "rqIctx('providerId',this.value)")+

        '<label class="rq-ag" for="rq-iag-'+esc(it.id)+'">'+
          '<input type="checkbox" id="rq-iag-'+esc(it.id)+'" '+
            'onchange="rqIctx(\'agree3rd\',this.checked)">'+
          '<span>이 서비스의 성함 · 연락처를 위 업체에 넘기는 데 대해 '+
            '<b>상호를 알려 드리고 다시 동의를 받았습니다</b> '+
            '(개인정보보호법 제17조 제2항).</span>'+
        '</label>'+
        '<div class="row-cta">'+
          '<button class="btn btn-b" type="button" '+
            'onclick="rqItemGo(\''+esc(it.id)+'\')">이 서비스 배정하기</button>'+
        '</div>'
      : '<p class="f-h">등록된 업체가 0곳이라 배정할 곳이 없습니다.</p>')+
  '</div>';
}

window.rqItemGo = function(id){
  if(RQ.busy) return;
  if(!RQ.ictx.providerId){ toast("배정할 업체를 골라 주세요"); return; }
  if(RQ.ictx.agree3rd !== true){
    toast("제3자 제공 동의를 받으셨는지 확인해 주세요"); return; }
  rqCall("assign_item",
    { p_item:id, p_provider:RQ.ictx.providerId, p_agree3rd:true },
    "배정했습니다");
};

function rqAsg(r){
  var A = r.assignment || [];
  if(!A.length) return "";
  return '<div class="rq-as">'+
    '<b>이 건에 보낸 업체</b>'+
    '<ul>'+ A.map(function(a){
      var nm = rqPvName(a.provider_id);
      var d  = window.amDate(String(a.created_at || "").slice(0, 10));

      var st = window.amAssignName ? amAssignName(a.state) : "";
      return '<li>'+esc(nm || a.provider_id || "")+
        (st ? ' <i>'+esc(st)+'</i>' : '')+
        (d ? ' <em>'+esc(d)+'</em>' : '')+'</li>';
    }).join("") +'</ul>'+
  '</div>';
}

function rqPvName(id){
  var P = RQ.provs || [], i;
  for(i = 0; i < P.length; i++) if(P[i].id === id) return P[i].name;
  return "";
}

window.rqGo = function(id){
  if(RQ.busy) return;
  var to = RQ.to;
  if(!to){ toast("다음 상태를 골라 주세요"); return; }

  var row = (RQ.rows || []).filter(function(x){ return x.id === id; })[0];
  var mv  = row ? rqMoves(row).filter(function(m){ return m[1] === to; })[0] : null;
  var need = (mv && mv[3]) || [];
  var ctx = {}, i, k, v;
  for(i = 0; i < need.length; i++){
    k = need[i]; v = RQ.ctx[k];
    if(v === undefined || v === null || v === "") continue;
    ctx[k] = (k === "amount" || k === "paid") ? Number(v) : v;
  }

  var pre = window.amDealMove && window.amDealMove(row && row.state, to,
    Object.assign({ role: RQ.role, by: "me" }, ctx));
  if(pre && !pre.ok){ toast(pre.why); return; }

  RQ.busy = true; rqDraw();
  fetch("/api/deal", {
    method:"POST",
    headers: Object.assign(
      { "content-type":"application/json", accept:"application/json" },
      window.amAuthHeaders()),
    body: JSON.stringify({ fn:"move_state",
      args:{ p_request:id, p_to:to, p_ctx:ctx } })
  }).then(function(r){
    return r.json().then(function(d){ return { ok:r.ok, d:d }; });
  }).then(function(x){
    RQ.busy = false;
    if(!x.ok){

      toast((x.d && x.d.error) || "바꾸지 못했습니다");
      rqDraw();
      return;
    }
    toast(amDealStName(to) + " 로 바꿨습니다");
    RQ.open = ""; RQ.to = ""; RQ.ctx = {};
    rqLoad();
  }).catch(function(e){
    RQ.busy = false;
    try{ console.warn("[rq] move_state — " + e); }catch(_){}
    toast("연결이 끊겼습니다. 잠시 뒤 다시 눌러 주세요");
    rqDraw();
  });
};

function rqLoad(){
  RQ.rows = null; rqDraw();
  fetch("/api/me", { headers: Object.assign(
    { accept:"application/json" }, window.amAuthHeaders()) })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(d){
      if(!d || !d.signedIn){ RQ.signedIn = false; RQ.rows = null; rqDraw(); return; }
      RQ.role  = d.role || RQ.role;
      RQ.rows  = d.requests || [];
      RQ.provs = d.providers || [];

      RQ.deals = d.deals || [];
      RQ.fees  = d.fees  || [];

      RQ.quotes = d.quotes || [];

      RQ.staff  = d.staff  || [];
      RQ.me     = d.me || "";

      RQ.contacts = d.contacts || [];
      RQ.settles  = d.settles  || [];
      rqDraw();
    })
    .catch(function(e){

      try{ console.warn("[rq] /api/me — " + e); }catch(_){}
      RQ.rows = [];
      rqDraw();
    });
}

function rqBoot(){
  if(!$("rq")) return;
  window.amAuthAsk().then(function(a){
    RQ.asked = true;
    RQ.on = a.on; RQ.signedIn = a.signedIn; RQ.role = a.role; RQ.name = a.name;
    rqDraw();
    if(a.signedIn && (a.role === "staff" || a.role === "admin")) rqLoad();
  });
}

if(document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", rqBoot);
else rqBoot();

function rqMoney(){
  if(RQ.role !== "admin") return "";
  var D = RQ.deals || [];

  var sum = { amount:0, fee:0, paid:0, due:0, n:D.length, wait:0 };
  D.forEach(function(d){
    sum.amount += Number(d.amount || 0);
    sum.fee    += Number(d.fee || 0);
    sum.paid   += Number(d.paid || 0);

    if(d.fee != null) sum.due += Number(d.fee_total || d.fee || 0) - Number(d.paid || 0);
    if(d.fee == null) sum.wait++;
  });

  return '<section class="ad-s rq-s rq-s-mn">'+
    '<h2>계약 · 수수료 · 정산</h2>'+
    (!D.length
      ? '<p class="ad-empty">아직 계약이 없습니다. '+
        '신청을 <b>계약 완료</b>로 옮기시면 여기에 쌓입니다.</p>'
      : '<div class="rq-kpi">'+
          rqKpi("계약", sum.n + "건", won(sum.amount) + "원")+
          rqKpi("확정 수수료", won(sum.fee) + "원",
                sum.wait ? "확정 전 " + sum.wait + "건" : "")+
          rqKpi("입금", won(sum.paid) + "원", "")+
          rqKpi("미수금", won(sum.due) + "원", "확정 - 입금")+
        '</div>'+
        '<div class="rq-g">'+ D.map(rqDealRow).join("") +'</div>'+

        '<p class="rq-note">위 숫자는 <b>최근 '+D.length+'건에서 센 값</b>입니다. '+
          '전체 누적이 아닙니다.</p>')+
  '</section>';
}

function rqKpi(t, v, s){
  return '<div class="rq-k"><span>'+esc(t)+'</span><b>'+esc(v)+'</b>'+
    (s ? '<em>'+esc(s)+'</em>' : '')+'</div>';
}

function rqDealRow(d){
  var r    = d.request || {};
  var open = RQ.money === d.id;
  var st   = (window.amDealSt && amDealSt(r.state)) || null;
  var tone = window.amDealTone ? amDealTone(r.state) : "gray";

  return '<article class="rq-r'+(open ? " on" : "")+'">'+
    '<button class="rq-hd" type="button" onclick="rqMoneyOpen(\''+esc(d.id)+'\')">'+
      '<span class="rq-hd-l">'+
        (r.no ? '<b class="rq-no">'+esc(r.no)+'</b>' : '')+
        '<span class="rq-m">'+esc(rqPvName(d.provider_id) || d.provider_id || "")+
          ' · 계약 '+esc(won(d.amount))+'원</span>'+
      '</span>'+
      '<span class="rq-hd-r">'+
        '<i class="myq-st myq-'+esc(tone)+'">'+esc(st ? st.name : r.state || "")+'</i>'+
        '<em class="rq-d">'+esc(d.fee == null ? "수수료 확정 전"
          : (d.paid == null ? "입금 대기" : "입금 " + won(d.paid) + "원"))+'</em>'+
      '</span>'+
    '</button>'+
    (open ? '<div class="rq-bd">'+ rqDealBody(d) +'</div>' : '')+
  '</article>';
}

window.rqMoneyOpen = function(id){
  RQ.money = (RQ.money === id) ? "" : id;
  RQ.mctx = {};
  rqDraw();
};

window.rqMctx = function(k, v){ RQ.mctx[k] = v; };

function rqDealBody(d){

  var rows = [
    ["계약금액",     d.amount   == null ? "" : won(d.amount) + "원"],
    ["수수료(공급가)", d.fee      == null ? "" : won(d.fee) + "원"],
    ["부가세",       d.fee_vat  == null ? "" : won(d.fee_vat) + "원"],
    ["청구액",       d.fee_total == null ? "" : won(d.fee_total) + "원"],
    ["실제 입금액",   d.paid     == null ? "" : won(d.paid) + "원"],
    ["계약일",       amDate(String(d.signed_at || "").slice(0, 10))],
    ["완료일",       amDate(String(d.done_at   || "").slice(0, 10))],
    ["확정일",       amDate(String(d.fee_at    || "").slice(0, 10))]

  ].filter(function(x){ return x[1]; });

  return '<dl class="rq-sp">'+ rows.map(function(x){
      return '<dt>'+esc(x[0])+'</dt><dd>'+esc(x[1])+'</dd>';
    }).join("") +'</dl>'+
    (d.fee == null ? rqFeeForm(d)
      : d.paid == null ? rqPaidForm(d)
      : rqClawForm(d));
}

function rqFeeForm(d){
  var P = (RQ.fees || []).filter(function(f){
    return f.provider_id === d.provider_id && f.active !== false;
  });
  if(!P.length)
    return '<div class="notice-bad">'+
      '<b>이 업체의 수수료 정책이 없습니다</b>'+
      '<p>아래 <b>수수료 정책</b> 칸에서 먼저 만드세요. 정책 없이 금액만 '+
      '적는 길을 두지 않았습니다 — 정책과 어긋난 청구서가 나가면 '+
      '어느 쪽이 맞는지 아무도 모릅니다 (§9).</p>'+
    '</div>';

  var pick = RQ.mctx.feeId || P[0].id;
  var pol  = window.amFeeFromDb(P.filter(function(f){ return f.id === pick; })[0] || P[0]);

  var calc = window.amFeeCalc(window.amFeeSnap(pol), {
    amount: Number(d.amount || 0),
    sell:   Number(d.amount || 0),
    cost:   0,
    times:  1,
    at:     String(d.done_at || "").slice(0, 10) || undefined
  });

  return '<div class="rq-mv">'+
    '<div class="f-r">'+
      '<label for="rq-fp">적용할 수수료 정책</label>'+
      '<select id="rq-fp" class="sel" onchange="rqFeePick(this.value)">'+
        P.map(function(f){
          var t = window.amFeeType(f.type);
          return '<option value="'+esc(f.id)+'"'+(f.id === pick ? " selected" : "")+'>'+
            esc((t ? t.name : f.type) +
                (f.rate ? " · " + f.rate + "%" : "") +
                (f.flat ? " · " + won(f.flat) + "원" : ""))+'</option>';
        }).join("")+
      '</select>'+
      '<p class="f-h">⚠️ 고르신 정책은 계약에 <b>사본으로</b> 박힙니다 — '+
        '나중에 요율을 고쳐도 <b>이 계약의 수수료는 안 바뀝니다</b> (§9).</p>'+
    '</div>'+
    (calc.ok
      ? '<div class="rq-calc">'+
          '<b>'+esc(won(calc.fee))+'원</b>'+
          '<span>+ 부가세 '+esc(won(calc.vat))+'원 = 청구 '+esc(won(calc.total))+'원</span>'+
          (calc.clamped ? '<em>'+(calc.clamped === "min" ? "최소" : "최대")+
            ' 수수료가 적용됐습니다</em>' : '')+
        '</div>'

      : '<div class="notice-bad"><b>이 정책으로는 계산되지 않습니다</b>'+
        '<p>'+esc(calc.why)+'</p></div>')+
    '<div class="f-r">'+
      '<label for="rq-proof">계약 완료 증빙</label>'+
      '<input id="rq-proof" type="text" autocomplete="off" '+
        'oninput="rqMctx(\'proof\',this.value)" '+
        'value="'+esc(RQ.mctx.proof || "")+'" '+
        'placeholder="예: 세금계산서 2026-10-11 · 계약서 사본 받음">'+
      '<p class="f-h">§9 — 증빙 없이는 확정되지 않습니다. '+
        '⚠️ 사진 · 파일은 아직 받아 둘 자리가 없어 <b>무엇을 봤는지</b>만 적습니다.</p>'+
    '</div>'+
    '<div class="f-r">'+
      '<label for="rq-fwhy">사유 <em>(선택)</em></label>'+
      '<input id="rq-fwhy" type="text" autocomplete="off" '+
        'oninput="rqMctx(\'why\',this.value)" value="'+esc(RQ.mctx.why || "")+'">'+
    '</div>'+
    '<div class="ad-acts">'+
      '<button class="btn btn-b" type="button"'+
        ((RQ.busy || !calc.ok) ? " disabled" : "")+
        ' onclick="rqFeeGo(\''+esc(d.id)+'\')">'+icon("check",18)+
        '수수료 확정</button>'+
    '</div>'+
  '</div>';
}

window.rqFeePick = function(v){ RQ.mctx.feeId = v; rqDraw(); };

window.rqFeeGo = function(id){
  if(RQ.busy) return;
  var d = (RQ.deals || []).filter(function(x){ return x.id === id; })[0];
  if(!d) return;
  var P = (RQ.fees || []).filter(function(f){
    return f.provider_id === d.provider_id && f.active !== false;
  });
  var pick = RQ.mctx.feeId || (P[0] && P[0].id);
  var pol  = window.amFeeFromDb(P.filter(function(f){ return f.id === pick; })[0]);
  if(!pol){ toast("적용할 정책을 골라 주세요"); return; }

  var snap = window.amFeeSnap(pol);
  var calc = window.amFeeCalc(snap, {
    amount: Number(d.amount || 0), sell: Number(d.amount || 0), cost: 0, times: 1,
    at: String(d.done_at || "").slice(0, 10) || undefined
  });
  if(!calc.ok){ toast(calc.why); return; }
  var proof = String(RQ.mctx.proof || "").trim();
  if(!proof){ toast("계약 완료 증빙을 적어 주세요"); return; }

  rqCall("confirm_fee", {
    p_deal:id, p_fee:calc.fee, p_vat:calc.vat, p_total:calc.total,
    p_snap:snap, p_proof:{ note:proof, at:new Date().toISOString() },
    p_why: String(RQ.mctx.why || "").trim() || null
  }, "수수료를 확정했습니다");
};

function rqPaidForm(d){
  var due = Number(d.fee_total || d.fee || 0);
  return '<div class="rq-mv">'+
    '<div class="f-r">'+
      '<label for="rq-paid">실제 입금액 (원)</label>'+
      '<input id="rq-paid" type="number" min="0" step="1" inputmode="numeric" '+
        'oninput="rqMctx(\'paid\',this.value)" '+
        'value="'+esc(RQ.mctx.paid == null ? String(due) : RQ.mctx.paid)+'">'+
      '<p class="f-h">청구액은 '+esc(won(due))+'원입니다. '+
        '⚠️ <b>실제로 들어온 금액</b>을 적으세요 — 청구액을 그대로 적으면 '+
        '그게 가짜 정산입니다 (§13).</p>'+
    '</div>'+
    '<div class="f-r">'+
      '<label for="rq-pwhy">사유 <em>(선택)</em></label>'+
      '<input id="rq-pwhy" type="text" autocomplete="off" '+
        'oninput="rqMctx(\'why\',this.value)" value="'+esc(RQ.mctx.why || "")+'">'+
    '</div>'+
    '<div class="ad-acts">'+
      '<button class="btn btn-b" type="button"'+(RQ.busy ? " disabled" : "")+
        ' onclick="rqPaidGo(\''+esc(d.id)+'\')">'+icon("check",18)+
        '입금 확인</button>'+
    '</div>'+
  '</div>';
}

window.rqPaidGo = function(id){
  if(RQ.busy) return;
  var v = RQ.mctx.paid;
  if(v === undefined || v === null || v === ""){ toast("실제 입금액을 적어 주세요"); return; }

  rqCall("mark_paid", { p_deal:id, p_paid:Number(v),
    p_why: String(RQ.mctx.why || "").trim() || null }, "입금을 확인했습니다");
};

function rqClawForm(d){
  return '<div class="rq-mv">'+

    '<div class="note-box">'+
      '<b>이 건은 정산이 끝났습니다</b>'+
      '<p>계약이 취소되거나 금액이 줄었으면 <b>환수</b>로 고칩니다. '+
      '⚠️ 확정했던 액을 <b>갈아 치우지 않고</b> 차액을 기록으로 남깁니다 — '+
      '갈아 치우면 "얼마를 확정했다가 얼마를 돌려받았는가" 가 사라집니다.</p>'+
    '</div>'+
    '<div class="f-r">'+
      '<label for="rq-nfee">고쳐 적을 수수료 (원)</label>'+
      '<input id="rq-nfee" type="number" min="0" step="1" inputmode="numeric" '+
        'oninput="rqMctxDraw(\'newFee\',this.value)" '+
        'value="'+esc(RQ.mctx.newFee == null ? "" : RQ.mctx.newFee)+'" '+
        'placeholder="'+esc(String(d.fee || 0))+'">'+
    '</div>'+

    rqClawPreview(d)+
    '<div class="f-r">'+
      '<label for="rq-cwhy">환수 사유 <em>(필수)</em></label>'+
      '<input id="rq-cwhy" type="text" autocomplete="off" '+
        'oninput="rqMctx(\'why\',this.value)" value="'+esc(RQ.mctx.why || "")+'" '+
        'placeholder="예: 계약 일부 취소 — 2026-10-20">'+
    '</div>'+
    '<div class="ad-acts">'+
      '<button class="btn btn-o" type="button"'+(RQ.busy ? " disabled" : "")+
        ' onclick="rqClawGo(\''+esc(d.id)+'\')">'+icon("refresh",18)+
        '환수 기록</button>'+
    '</div>'+
  '</div>';
}

function rqClawPreview(d){
  var v = RQ.mctx.newFee;
  if(v === undefined || v === null || v === "") return "";
  var r = window.amFeeClawback && window.amFeeClawback(
    d.fee_snap || { type:"flat", flat:Number(v) }, Number(d.fee || 0),
    { amount:Number(d.amount || 0), sell:Number(d.amount || 0),
      cost:0, times:1, fixed:Number(v) });

  var was  = Number(d.fee || 0), now = Number(v);
  var back = (r && r.ok) ? r.back : (was - now);
  if(!isFinite(back)) return "";
  return '<div class="rq-calc">'+
      '<b>'+esc(won(Math.abs(back)))+'원</b>'+
      '<span>'+esc(won(was))+'원 확정 → '+esc(won(now))+'원 · '+
        (back >= 0 ? '돌려드릴 금액' : '더 청구할 금액')+'</span>'+

      '<em>확정했던 '+esc(won(was))+'원은 기록에 그대로 남습니다</em>'+
    '</div>';
}

window.rqClawGo = function(id){
  if(RQ.busy) return;
  var v = RQ.mctx.newFee, why = String(RQ.mctx.why || "").trim();
  if(v === undefined || v === null || v === ""){ toast("고쳐 적을 수수료를 적어 주세요"); return; }
  if(!why){ toast("환수 사유를 적어 주세요"); return; }
  rqCall("clawback_fee", { p_deal:id, p_new_fee:Number(v), p_why:why }, "환수를 기록했습니다");
};

function rqCall(fn, args, say){
  RQ.busy = true; rqDraw();
  fetch("/api/deal", {
    method:"POST",
    headers: Object.assign(
      { "content-type":"application/json", accept:"application/json" },
      window.amAuthHeaders()),
    body: JSON.stringify({ fn:fn, args:args })
  }).then(function(r){
    return r.json().then(function(d){ return { ok:r.ok, d:d }; });
  }).then(function(x){
    RQ.busy = false;
    if(!x.ok){ toast((x.d && x.d.error) || "처리하지 못했습니다"); rqDraw(); return; }
    toast(say);
    RQ.money = ""; RQ.mctx = {}; RQ.open = ""; RQ.to = ""; RQ.ctx = {};
    RQ.itemOf = ""; RQ.ictx = {};
    RQ.pvOf = ""; RQ.pctx = {};
    rqLoad();
  }).catch(function(e){
    RQ.busy = false;
    try{ console.warn("[rq] " + fn + " — " + e); }catch(_){}
    toast("연결이 끊겼습니다. 잠시 뒤 다시 눌러 주세요");
    rqDraw();
  });
}

function rqFees(){
  if(RQ.role !== "admin") return "";
  var F = RQ.fees || [], P = RQ.provs || [];

  return '<section class="ad-s rq-s rq-s-fee">'+
    '<h2>수수료 정책</h2>'+
    '<p class="ad-lead">업체마다 · 상품마다 따로 둘 수 있습니다. '+
      '<b>고친 정책은 지난 계약에 영향을 주지 않습니다</b> — 계약에는 '+
      '그때의 <b>사본</b>이 박혀 있습니다 (§9).</p>'+
    (!P.length

      ? '<div class="note-box"><b>등록된 업체가 0곳입니다</b>'+
        '<p>정책은 업체에 붙는 것이라 업체를 먼저 등록하셔야 합니다.</p></div>'
      : (F.length
          ? '<div class="rq-g">'+ F.map(rqFeeRow).join("") +'</div>'
          : '<p class="ad-empty">아직 정책이 없습니다. 아래에서 만드세요.</p>')+
        rqFeeNew())+
  '</section>';
}

function rqFeeRow(f){
  var t = window.amFeeType(f.type);
  var bits = [
    f.rate ? f.rate + "%" : "",
    f.flat ? won(f.flat) + "원" : "",
    f.min_fee ? "최소 " + won(f.min_fee) + "원" : "",
    f.max_fee ? "최대 " + won(f.max_fee) + "원" : "",
    rqName(window.AM_FEE_VAT, f.vat),
    rqName(window.AM_FEE_WHEN, f.confirm_when),
    rqName(window.AM_FEE_CYCLE, f.cycle)

  ].filter(Boolean).join(" · ");

  return '<article class="rq-r">'+
    '<div class="rq-hd rq-hd-s">'+
      '<span class="rq-hd-l">'+
        '<b class="rq-no">'+esc(rqPvName(f.provider_id) || f.provider_id)+'</b>'+
        '<span class="rq-m">'+esc((t ? t.name : f.type) + " · " + bits)+'</span>'+
      '</span>'+
      '<span class="rq-hd-r">'+
        '<i class="myq-st myq-'+(f.active === false ? "gray" : "on")+'">'+
          (f.active === false ? "꺼짐" : "켜짐")+'</i>'+
        '<button class="btn btn-o btn-sm" type="button" '+
          'onclick="rqFeeToggle(\''+esc(f.id)+'\','+(f.active === false)+')">'+
          (f.active === false ? "켜기" : "끄기")+'</button>'+
      '</span>'+
    '</div>'+
  '</article>';
}

function rqName(L, k){
  var i, A = L || [];
  for(i = 0; i < A.length; i++) if(A[i].key === k) return A[i].name;
  return "";
}

window.rqFeeToggle = function(id, on){
  rqCall("set_fee_policy_active", { p_id:id, p_active:!!on,
    p_why: on ? "다시 켬" : "끔" }, on ? "켰습니다" : "껐습니다");
};

function rqFeeNew(){
  var N = RQ.mctx || {};
  var t = window.amFeeType(N.ftype || "rate");
  var needFlat = t && (t.key === "lead" || t.key === "close" ||
                       t.key === "sub"  || t.key === "base_rate");
  var needRate = t && (t.key === "rate" || t.key === "base_rate");

  return '<details class="rq-new"><summary><b>새 정책 만들기</b></summary>'+
    '<div class="ad-g">'+
      rqSel("rq-fn-pv", "업체", "fpv",
        (RQ.provs || []).map(function(p){ return [p.id, p.name]; }))+
      rqSel("rq-fn-t", "수익모델", "ftype",
        (window.AM_FEE_TYPE || []).map(function(x){ return [x.key, x.name]; }), N.ftype || "rate")+
      rqSel("rq-fn-v", "부가세", "fvat",
        (window.AM_FEE_VAT || []).map(function(x){ return [x.key, x.name]; }), N.fvat || "add")+
      rqSel("rq-fn-w", "확정 조건", "fwhen",
        (window.AM_FEE_WHEN || []).map(function(x){ return [x.key, x.name]; }), N.fwhen || "done")+
      rqSel("rq-fn-c", "정산 주기", "fcycle",
        (window.AM_FEE_CYCLE || []).map(function(x){ return [x.key, x.name]; }), N.fcycle || "monthly")+
    '</div>'+
    '<div class="ad-g">'+
      (needRate ? rqNum("rq-fn-r", "요율 (%)", "frate", "3") : "")+
      (needFlat ? rqNum("rq-fn-f", "정액 (원)", "fflat", "50000") : "")+
      rqNum("rq-fn-min", "최소 수수료 (원 · 선택)", "fmin", "")+
      rqNum("rq-fn-max", "최대 수수료 (원 · 선택)", "fmax", "")+
    '</div>'+
    '<div class="ad-f"><label for="rq-fn-rr">환불 · 환수 조건 <em>(선택)</em></label>'+
      '<input id="rq-fn-rr" type="text" autocomplete="off" '+
      'oninput="rqMctx(\'frefund\',this.value)" value="'+esc(N.frefund || "")+'" '+
      'placeholder="예: 계약 취소 시 전액 환수 · 금액 변경 시 차액 정산"></div>'+
    '<p class="ad-rd-n">⚠️ 요율은 <b>0 초과 100 이하</b>이고 최소 ≤ 최대라야 '+
      '합니다 — 화면에서 한 번, DB 제약이 한 번 더 막습니다.</p>'+
    '<div class="ad-acts">'+
      '<button class="btn btn-b" type="button"'+(RQ.busy ? " disabled" : "")+
        ' onclick="rqFeeSave()">'+icon("plus",18)+'정책 만들기</button>'+
    '</div>'+
  '</details>';
}

function rqSel(id, label, key, opts, cur){
  return '<div class="ad-f"><label for="'+id+'">'+esc(label)+'</label>'+
    '<select id="'+id+'" onchange="rqMctxDraw(\''+key+'\',this.value)">'+
      opts.map(function(o){
        return '<option value="'+esc(o[0])+'"'+
          ((cur || RQ.mctx[key]) === o[0] ? " selected" : "")+'>'+esc(o[1])+'</option>';
      }).join("")+
    '</select></div>';
}
function rqNum(id, label, key, ph){
  return '<div class="ad-f"><label for="'+id+'">'+esc(label)+'</label>'+
    '<input id="'+id+'" type="number" min="0" step="any" inputmode="numeric" '+
    'oninput="rqMctx(\''+key+'\',this.value)" value="'+esc(RQ.mctx[key] || "")+'" '+
    'placeholder="'+esc(ph)+'"></div>';
}

window.rqMctxDraw = function(k, v){ RQ.mctx[k] = v; rqDraw(); };

window.rqFeeSave = function(){
  if(RQ.busy) return;
  var N = RQ.mctx || {};
  var pv = N.fpv || ((RQ.provs || [])[0] || {}).id;
  if(!pv){ toast("업체를 골라 주세요"); return; }
  var pol = {
    type: N.ftype || "rate",
    vat:  N.fvat  || "add",
    when: N.fwhen || "done",
    cycle:N.fcycle|| "monthly",

    rate: N.frate === "" || N.frate == null ? null : Number(N.frate),
    flat: N.fflat === "" || N.fflat == null ? null : Number(N.fflat),
    min:  N.fmin  === "" || N.fmin  == null ? null : Number(N.fmin),
    max:  N.fmax  === "" || N.fmax  == null ? null : Number(N.fmax)
  };

  var bad = window.amFeeBadPolicy(pol);
  if(bad){ toast(bad); return; }

  rqCall("save_fee_policy", {
    p_provider: pv,
    p_data: {
      type:pol.type, vat:pol.vat, confirmWhen:pol.when, cycle:pol.cycle,
      rate:pol.rate, flat:pol.flat, minFee:pol.min, maxFee:pol.max,
      refundRule: String(N.frefund || "").trim() || null
    },
    p_why: "새 정책"
  }, "정책을 만들었습니다");
};

function rqSettles(){

  if(RQ.role !== "admin") return "";
  var S = RQ.settles || [];
  var wait = S.filter(function(x){ return x.state === "wait"; }).length;
  var hold = S.filter(function(x){ return x.state === "hold"; }).length;

  return '<section class="ad-s rq-s rq-s-set">'+
    '<h2>기간별 정산</h2>'+
    '<p class="ad-lead">'+
      (S.length
        ? '정산 <b>'+S.length+'건</b>'+
          (wait ? ' · 입금 대기 <b>'+wait+'건</b>' : '')+
          (hold ? ' · 보류 <b>'+hold+'건</b>' : '')
        : '아직 집계한 정산이 없습니다.')+
      ' 업체와 기간을 고르고 <b>집계하기</b>를 누르면 '+
      '<b>그 기간에 확정된 수수료</b>를 세어 청구서 한 줄을 만듭니다.</p>'+
    '<p class="f-h">⚠️ <b>확정된 것만</b> 셉니다 — 확정 전인 건을 '+
      '계약금액으로 섞으면 받을 돈이 열 배로 부풀려집니다. '+
      '⚠️⚠️ <b>입금은 손으로 두지 않습니다</b> — 건별 입금 확인을 '+
      '하시면 다시 집계할 때 저절로 바뀝니다.</p>'+
    rqSetNew()+
    (S.length ? '<div class="rq-g">'+ S.map(rqSetRow).join("") +'</div>' : "")+
  '</section>';
}

window.rqSctx = function(k, v){ RQ.sctx[k] = v; };

function rqSetNew(){
  var N = RQ.sctx || {};
  var P = RQ.provs || [];
  return '<details class="rq-new"><summary><b>기간 정산 집계하기</b></summary>'+
    (!P.length
      ? '<p class="ad-empty">DB 에 등록된 업체가 없습니다.</p>'
      : '<div class="ad-g">'+
        '<div class="ad-f"><label for="rq-st-pv">업체</label>'+
          '<select id="rq-st-pv" onchange="rqSctx(\'spv\',this.value)">'+
            P.map(function(p){
              return '<option value="'+esc(p.id)+'"'+
                (N.spv === p.id ? " selected" : "")+'>'+esc(p.name)+'</option>';
            }).join("")+
          '</select></div>'+
        '<div class="ad-f"><label for="rq-st-f">시작일</label>'+
          '<input id="rq-st-f" type="date" '+
          'oninput="rqSctx(\'sfrom\',this.value)" value="'+esc(N.sfrom || "")+'"></div>'+
        '<div class="ad-f"><label for="rq-st-t">끝일</label>'+
          '<input id="rq-st-t" type="date" '+
          'oninput="rqSctx(\'sto\',this.value)" value="'+esc(N.sto || "")+'"></div>'+
      '</div>'+
      '<p class="ad-rd-n">⚠️ 같은 업체 · 같은 기간을 다시 집계하면 '+
        '<b>그 줄을 덮습니다</b> (줄이 늘지 않습니다). '+
        '보류로 세워 둔 줄은 <b>안 풀립니다</b>.</p>'+
      '<div class="ad-acts">'+
        '<button class="btn btn-b" type="button"'+(RQ.busy ? " disabled" : "")+
          ' onclick="rqSetGo()">'+icon("calc",18)+'집계하기</button>'+
      '</div>')+
  '</details>';
}

window.rqSetGo = function(){
  if(RQ.busy) return;
  var N = RQ.sctx || {};
  var pv = N.spv || ((RQ.provs || [])[0] || {}).id;
  if(!pv){ toast("업체를 골라 주세요"); return; }

  if(!N.sfrom || !N.sto){ toast("기간을 골라 주세요"); return; }
  if(N.sfrom > N.sto){ toast("기간이 거꾸로입니다"); return; }
  rqCall("build_settlement", {
    p_provider: pv, p_from: N.sfrom, p_to: N.sto, p_why: "기간 정산 집계"
  }, "정산을 집계했습니다");
};

function rqSetRow(x){
  var st = x.state === "paid" ? ["ok","입금"]
         : x.state === "hold" ? ["warn","보류"] : ["on","입금 대기"];
  return '<article class="rq-r">'+
    '<div class="rq-hd rq-hd-s">'+
      '<span class="rq-hd-l">'+
        '<b class="rq-no">'+esc(rqPvName(x.provider_id))+'</b>'+
        '<span class="rq-m">'+
          esc(String(x.from_date || "").slice(0,10)+' ~ '+
              String(x.to_date || "").slice(0,10))+
          ' · 청구 '+esc(won(x.total) + "원")+

          (x.approved_at ? ' · 집계 '+esc(String(x.approved_at).slice(0,10)) : '')+
        '</span>'+
      '</span>'+
      '<span class="rq-hd-r">'+
        '<i class="myq-st myq-'+st[0]+'">'+st[1]+'</i>'+
        (x.state === "paid"

          ? ''
          : '<button class="btn '+(x.state === "hold" ? "btn-b" : "btn-o")+' btn-sm" '+
            'type="button" onclick="rqSetHold(\''+esc(x.id)+'\','+
            (x.state !== "hold")+')">'+
            (x.state === "hold" ? "보류 풀기" : "보류")+'</button>')+
      '</span>'+
    '</div>'+
  '</article>';
}

window.rqSetHold = function(id, on){
  if(RQ.busy) return;
  var why = "";
  if(on){
    why = String(prompt("보류하는 까닭을 적어 주세요 (기록에 남습니다)") || "").trim();
    if(!why){ toast("보류 사유를 적어 주세요"); return; }
  } else {
    why = String(prompt("보류를 푸는 까닭을 적어 주세요 (선택)") || "").trim();
  }
  rqCall("hold_settlement", { p_id:id, p_hold:!!on, p_why: why || null },
    on ? "보류했습니다" : "보류를 풀었습니다");
};

function rqProvs(){
  if(RQ.role !== "staff" && RQ.role !== "admin") return "";
  var P = RQ.provs || [];
  var off = P.filter(function(p){ return !p.listed; }).length;

  var noAsg = P.filter(function(p){ return p.assignable === false; }).length;

  var noCon = P.filter(function(p){ return !rqPvCon(p.id); }).length;

  return '<section class="ad-s rq-s rq-s-pv">'+
    '<h2>업체 · 공개 승인</h2>'+
    (!P.length
      ? '<p class="ad-empty">DB 에 등록된 업체가 없습니다. '+
        '아래 <b>관리자 설정</b> 의 9번 칸에서 등록 줄을 만드세요.</p>'
      : '<p class="ad-lead">'+
          (off ? '<b>'+off+'곳</b>이 아직 공개 전입니다. ' : '')+
          '공개 전인 업체도 <b>배정 고르개에는 보입니다</b> — '+
          '손님 목록에만 안 나옵니다.'+
          (noAsg ? ' <b>'+noAsg+'곳</b>은 <b>배정 가능</b>이 꺼져 있어 '+
            '배정 고르개에서 잠겨 있습니다 — 제휴 계약을 확인하고 켜 주세요.' : '')+
          (noCon ? ' <b>'+noCon+'곳</b>은 <b>담당자</b>가 안 적혀 있어 '+
            '배정하고 걸 곳이 대표번호뿐입니다.' : '')+
          (RQ.role === "admin" ? ''
            : ' ⚠️ 공개 · 배정 가능을 켜는 것은 <b>관리자만</b> 할 수 있습니다.')+
        '</p>'+
        '<p class="f-h">⚠️ <b>공개</b>는 손님 목록에 보이는가이고, '+
          '<b>배정 가능</b>은 신청을 넘겨도 되는가입니다 — 둘은 다릅니다. '+
          '구두 합의 단계에서 배정되면 그 순간 성함 · 연락처가 그 업체로 '+
          '넘어갑니다 (개인정보보호법 제17조 제2항).</p>'+
        '<div class="rq-g">'+ P.map(rqProvRow).join("") +'</div>')+
  '</section>';
}

function rqProvRow(p){
  var subs = (p.subs || []).length, regs = (p.regions || []).length;
  var c = rqPvCon(p.id);
  return '<article class="rq-r">'+
    '<div class="rq-hd rq-hd-s">'+
      '<span class="rq-hd-l">'+
        '<b class="rq-no">'+esc(p.name)+'</b>'+
        '<span class="rq-m">'+
          esc([subs ? "하는 일 " + subs : "", regs ? "지역 " + regs : "",
               (p.industries || []).length ? "업종 " + p.industries.length : ""]
              .filter(Boolean).join(" · "))+'</span>'+
      '</span>'+
      '<span class="rq-hd-r">'+
        '<i class="myq-st myq-'+(p.listed ? "ok" : "gray")+'">'+
          (p.listed ? "공개" : "공개 전")+'</i>'+

        '<i class="myq-st myq-'+(p.assignable === false ? "warn" : "ok")+'">'+
          (p.assignable === false ? "배정 불가" : "배정 가능")+'</i>'+
        (RQ.role === "admin"
          ? '<button class="btn '+(p.listed ? "btn-o" : "btn-b")+' btn-sm" type="button" '+
            'onclick="rqProvGo(\''+esc(p.id)+'\','+(!p.listed)+')">'+
            (p.listed ? "내리기" : "공개하기")+'</button>'+
            '<button class="btn '+(p.assignable === false ? "btn-b" : "btn-o")+' btn-sm" type="button" '+
            'onclick="rqAsgGo(\''+esc(p.id)+'\','+(p.assignable === false)+')">'+
            (p.assignable === false ? "배정 가능으로" : "배정 막기")+'</button>'
          : '')+
        '<button class="btn btn-o btn-sm" type="button" aria-expanded="'+
          (RQ.pvOf === p.id ? "true" : "false")+'" '+
          'onclick="rqPvConOpen(\''+esc(p.id)+'\')">'+
          (c ? "담당자 보기" : "담당자 적기")+'</button>'+
      '</span>'+
    '</div>'+
    (RQ.pvOf === p.id ? rqPvConForm(p, c) : "")+
  '</article>';
}

function rqPvCon(id){
  return (RQ.contacts || []).filter(function(c){ return c.provider_id === id; })[0] || null;
}

window.rqPvConOpen = function(id){
  RQ.pvOf = (RQ.pvOf === id) ? "" : id;

  if(RQ.pvOf){
    var c = rqPvCon(id) || {};
    RQ.pctx = { pname:c.name || "", ptel:c.tel || "",
                pmail:c.email || "", pmemo:c.memo || "" };
  } else RQ.pctx = {};
  rqDraw();
};

window.rqPctx = function(k, v){ RQ.pctx[k] = v; };

function rqPvConForm(p, c){
  var N = RQ.pctx || {};
  return '<div class="rq-bd rq-con-f">'+
    '<p class="f-h">⚠️ 이 칸은 <b>직원 · 관리자에게만</b> 보입니다 — '+
      '손님 화면에는 한 글자도 안 나갑니다. '+
      (c ? '마지막으로 고친 날 '+esc(String(c.updated_at || "").slice(0,10))
         : '아직 적어 둔 담당자가 없습니다')+'</p>'+
    '<div class="ad-g">'+
      '<div class="ad-f"><label for="rq-pc-n">담당자 이름</label>'+
        '<input id="rq-pc-n" type="text" autocomplete="off" '+
        'oninput="rqPctx(\'pname\',this.value)" value="'+esc(N.pname || "")+'" '+
        'placeholder="예: 김과장"></div>'+
      '<div class="ad-f"><label for="rq-pc-t">직통 · 휴대폰</label>'+
        '<input id="rq-pc-t" type="tel" autocomplete="off" inputmode="tel" '+
        'oninput="rqPctx(\'ptel\',this.value)" value="'+esc(N.ptel || "")+'" '+
        'placeholder="예: 010-0000-0000"></div>'+
      '<div class="ad-f"><label for="rq-pc-m">메일</label>'+
        '<input id="rq-pc-m" type="email" autocomplete="off" '+
        'oninput="rqPctx(\'pmail\',this.value)" value="'+esc(N.pmail || "")+'" '+
        'placeholder="선택"></div>'+
    '</div>'+
    '<div class="ad-f"><label for="rq-pc-o">메모 <em>(선택)</em></label>'+
      '<input id="rq-pc-o" type="text" autocomplete="off" '+
      'oninput="rqPctx(\'pmemo\',this.value)" value="'+esc(N.pmemo || "")+'" '+
      'placeholder="예: 오전에만 통화 가능 · 현장에 있을 때가 많습니다"></div>'+
    (N.ptel ? '<p class="ad-rd-n">'+
      '<a class="rq-tel" href="tel:'+esc(String(N.ptel).replace(/[^0-9+]/g,""))+'">'+
      icon("phone",18)+esc(N.ptel)+'</a></p>' : "")+
    '<p class="ad-rd-n">⚠️ 넷을 다 비워서 저장하면 <b>줄째 지웁니다</b> '+
      '(담당자가 그만두셨을 때). 바뀐 것은 기록에 남지만 '+
      '<b>이름과 번호는 기록에 안 적습니다</b>.</p>'+
    '<div class="ad-acts">'+
      '<button class="btn btn-b" type="button"'+(RQ.busy ? " disabled" : "")+
        ' onclick="rqPvConSave(\''+esc(p.id)+'\')">'+icon("check",18)+'담당자 저장</button>'+
    '</div>'+
  '</div>';
}

window.rqPvConSave = function(id){
  if(RQ.busy) return;
  var N = RQ.pctx || {};
  rqCall("save_provider_contact", {
    p_provider: id,
    p_data: { name: String(N.pname || "").trim(), tel: String(N.ptel || "").trim(),
              email: String(N.pmail || "").trim(), memo: String(N.pmemo || "").trim() },
    p_why: "업체에서 받아 왔습니다"
  }, "담당자를 저장했습니다");
};

window.rqAsgGo = function(id, on){
  if(on && !confirm("제휴 계약을 확인하셨습니까?\n켜면 이 업체에 신청을 배정할 수 있고, " +
                    "배정하면 손님의 성함 · 연락처가 그 업체로 넘어갑니다."))
    return;
  rqCall("approve_provider", { p_id:id, p_assignable:!!on,
    p_why: on ? "배정 가능 (계약 확인)" : "배정 막음" },
    on ? "배정 가능으로 켰습니다" : "배정을 막았습니다");
};

window.rqProvGo = function(id, on){

  if(!on && !confirm("이 업체를 손님 목록에서 내릴까요?")) return;
  rqCall("approve_provider", { p_id:id, p_listed:!!on,
    p_why: on ? "공개" : "내림" }, on ? "공개했습니다" : "내렸습니다");
};

function rqQuotes(r){
  var L = (RQ.quotes || []).filter(function(q){ return q.request_id === r.id; });
  if(!L.length) return "";
  return '<div class="rq-s"><h4>받은 견적 '+L.length+'건</h4>'+
    '<ul class="rq-q">'+L.map(function(q){
      var bits = [];
      if(q.amount != null)
        bits.push(won(q.amount)+"원 · "+
          (typeof amQuoteVat === "function" ? amQuoteVat(q.vat) : ""));
      if(q.days)     bits.push(q.days+"일");
      if(q.start_on) bits.push(amDate(q.start_on)+" 시작");
      return '<li><div class="rq-q-h">'+
          '<b>'+esc(q.provider_id)+'</b>'+

          '<i class="myq-st myq-'+esc(typeof amQuoteTone === "function"
            ? amQuoteTone(q.state) : "gray")+'">'+
            esc(typeof amQuoteName === "function" ? amQuoteName(q.state) : q.state)+
          '</i></div>'+
        (bits.length ? '<p class="rq-q-m">'+esc(bits.join(" · "))+'</p>' : "")+
        (q.scope ? '<p class="rq-q-s">'+esc(String(q.scope))+'</p>' : "")+
      '</li>';
    }).join("")+'</ul></div>';
}

function rqHistRow(r){
  var on = RQ.histOf === r.id;
  return '<div class="rq-hist-b">'+
      '<button class="btn btn-o btn-sm" type="button" '+
        'onclick="rqHistGo(\''+esc(r.id)+'\')">'+icon("clock",18)+
        (on ? '이력 닫기' : '이력 보기')+'</button>'+
    '</div>'+ rqHist(r);
}

function rqHist(r){
  if(RQ.histOf !== r.id) return '';
  if(RQ.hist === null)
    return '<div class="rq-as"><b>이력</b><p class="rq-none">불러오는 중…</p></div>';
  if(!RQ.hist.length)
    return '<div class="rq-as"><b>이력</b><p class="rq-none">기록이 없습니다.</p></div>';

  return '<div class="rq-as rq-hist"><b>이력</b><ol>'+
    RQ.hist.map(function(h){
      var d = amDate(String(h.at || "").slice(0, 10));
      var to = window.amDealStName ? amDealStName(h.to_state) : h.to_state;
      var fr = window.amDealStName ? amDealStName(h.from_state) : h.from_state;
      return '<li>'+
        (d ? '<em>'+esc(d)+'</em>' : '')+
        '<span>'+esc((fr ? fr + " → " : "") + (to || ""))+'</span>'+

        (h.by_role ? ' <i>· '+esc(window.amRoleName ? amRoleName(h.by_role) : h.by_role)+'</i>' : '')+
        (h.why ? '<p>'+esc(h.why)+'</p>' : '')+
      '</li>';
    }).join("") +'</ol>'+
    '<p class="rq-none">⚠️ 기록은 <b>고치거나 지울 수 없습니다</b> — '+
      '고칠 수 있는 기록은 기록이 아닙니다 (§8).</p>'+
  '</div>';
}

window.rqHistGo = function(id){
  if(RQ.histOf === id){ RQ.histOf = ""; RQ.hist = null; rqDraw(); return; }
  RQ.histOf = id; RQ.hist = null; rqDraw();
  fetch("/api/me?r=" + encodeURIComponent(id), { headers: Object.assign(
    { accept:"application/json" }, window.amAuthHeaders()) })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(d){
      if(RQ.histOf !== id) return;
      RQ.hist = (d && d.history) || [];
      rqDraw();
    })
    .catch(function(e){
      try{ console.warn("[rq] 이력 — " + e); }catch(_){}
      if(RQ.histOf === id){ RQ.hist = []; rqDraw(); }
    });
};
