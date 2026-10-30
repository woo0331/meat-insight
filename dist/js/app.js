

var ORIGIN = "https://storeway.co.kr";
var RT = { keepScroll:false };

window.nowPath = function(){
  return location.pathname.replace(/\/index\.html$/,"/").replace(/(.)\/+$/,"$1") || "/";
};
window.nowQS = function(k){
  var m = new RegExp("[?&]"+k+"=([^&#]*)").exec(location.search);
  return m ? decodeURIComponent(m[1].replace(/\+/g," ")) : "";
};

var META = {

  "/":          ["내 폰의 가치를 찾는 새로운 방법",
                 "직접 매입 · 전국 업체 경쟁입찰 · 검수를 마친 중고폰 구매를 " +
                 "한곳에서. 기종과 상태를 고르시면 견적을 나란히 놓고 비교하십니다."],
  "/startup":   ["창업 — 어떤 사업을 준비하세요?",
                 "업종만 고르시면 그 업종 창업에 실제로 필요한 것만 추려 드립니다. 점포 · 상권 · 인테리어 · 장비 · 가구 · POS · 공급 · 인허가 · 마케팅까지."],

  "/operation": ["매장 운영 — 운영하면서 필요한 모든 것",
                 "세무 · 노무 · 직원 · POS · CCTV · 인터넷 · 식자재 · 소모품 · 청소 · 방역 · 시설보수 · 보험 · 법률 · 마케팅까지. 문을 연 뒤에 생기는 일을 맡길 곳을 한곳에서 찾습니다."],
  "/transfer":["매장 인수 · 양도 — 받는 쪽과 넘기는 쪽",
                 "있던 가게를 받으면 공사 기간과 초기 비용이 줄고, 넘기면 철거비와 원상복구가 줄어듭니다. 순서 · 권리금 · 시설 인수 범위 · 임대차 승계까지 짚어 드립니다."],
  "/closure":   ["폐업 — 사업을 어떻게 정리하세요?",
                 "매장 양도 · 시설 집기 처분 · 재고 · 철거 · 원상복구 · 폐기물 · 폐업신고 · 계약 해지까지, 정리에 필요한 곳을 한곳에서 찾습니다."],

  "/sample":    ["업체 상세 예시 — 입점하면 이렇게 보입니다",
                 "실제 업체가 아닌 예시 화면입니다. 입점 업체의 소개 · 전문분야 · " +
                 "포트폴리오 · 확인 배지 · 후기가 어떤 짜임새로 나가는지 보실 수 있습니다."],
  "/providers": ["업체찾기",
                 "인테리어 · 철거 · 간판 · 주방설비 · POS · 세무 · 노무 · 청소까지. 지역과 업종에 맞는 업체를 비교하고 견적을 받으세요."],
  "/franchise": ["프랜차이즈",
                 "업종별 프랜차이즈 브랜드를 창업비 · 가맹비 · 권장 평수 · 모집지역으로 비교하고 창업 상담을 신청하실 수 있습니다."],
  "/stores":    ["점포 · 상가 · 매장 양도",
                 "지역 · 업종 · 평수 · 보증금 · 월세 · 권리금으로 찾습니다. 시설을 그대로 인수할 수 있는 매장도 함께 봅니다."],
  "/assets":    ["시설 · 집기 · 재고",
                 "정리하시는 사장님이 내놓은 주방장비 · 커피머신 · 가구 · POS · 운동기구 · 미용기기와 남은 재고를 찾습니다."],
  "/support":   ["자금 · 정부지원",
                 "창업자금 · 정책자금 · 폐업지원 · 철거비 지원까지, 조건에 맞으면 신청하실 수 있는 지원사업을 모읍니다."],
  "/content":   ["창업 · 폐업 정보",
                 "창업비용 · 철거비 · 원상복구 범위 · 권리금 · 사업자등록 · 폐업신고처럼 실제로 막히는 것만 정리합니다."],
  "/quote":     ["견적 요청",
                 "한 번만 적으시면 조건에 맞는 업체들에 같이 전달합니다. 받으신 제안을 한 화면에서 비교하세요."],

  "/sell":      ["내 폰 판매 — 기기 선택하고 견적 받기",
                 "쓰시던 휴대폰 · 태블릿 · 워치를 고르고 상태를 확인하시면, 바로 매입 신청을 넣거나 전국 전문업체 견적을 비교하실 수 있습니다."],
  "/shop":      ["내 폰 구매 — 검수를 마친 중고폰만",
                 "제조사 · 모델 · 용량 · 상태 등급으로 찾습니다. 기기마다 검수 항목과 상태를 밝히고, 등록된 재고만 냅니다."],
  "/bid":       ["최고가 경쟁입찰 — 전국 전문업체 견적 비교",
                 "기기를 한 번 등록하시면 조건이 맞는 전문업체들이 매입가를 제출합니다. 받으신 견적을 한 화면에서 나란히 놓고 고르세요."],
  "/track":     ["판매 진행 조회",
                 "접수번호와 연락처로 지금 어느 단계인지 확인하실 수 있습니다. 기기 발송 · 검수 · 정산까지 진행 상황을 그대로 냅니다."],
  "/guide":     ["이용 안내 — 판매부터 정산까지",
                 "기기 등록 · 상태 등급 기준 · 발송 · 검수 · 정산 차례와, 검수 결과가 다를 때 어떻게 되는지까지 적어 두었습니다."],
  "/biz":       ["기업 · 수출 거래 — 대량 매입 · 해외 수출 문의",
                 "법인 · 대리점의 대량 매입, 기업 일괄 처분, 해외 수출을 상담으로 진행합니다. 수량과 기종을 알려 주시면 확인한 뒤 연락드립니다."],
  "/sell-biz":  ["매장 · 시설 내놓기",
                 "정리하시는 매장과 쓰시던 시설 · 장비를 내놓으실 수 있습니다. 평수 · 보증금 · 월세 · 권리금 조건 그대로 올리고 문의를 전달합니다."],
  "/join":      ["업체 입점하기",
                 "창업과 폐업을 준비하는 사장님이 직접 찾아옵니다. 지역과 전문 분야가 맞는 요청만 받아 보세요. 기본 입점은 무료입니다."],
  "/my":        ["MY",
                 "판매 신청과 받은 견적, 저장해 두신 것을 한 화면에서 보십시오. 진행 조회는 접수번호로도 됩니다."],
  "/compare":   ["업체 비교",
                 "고르신 업체를 지역 · 전문분야 · 전문업종 · 평점 · 포트폴리오 · 인증 · 상담 시간으로 나란히 놓고 보십시오. 등록된 값만 냅니다."],
  "/search":    ["통합검색",
                 "기종 · 중고폰 상품 · 업체 · 정보를 한 번에 찾습니다. 기종 이름을 그대로 치셔도 됩니다."],
  "/tools":     ["사장님 도구",
                 "창업비 정리표 · 월 고정비 · 손익분기 · 인건비율 · 신규 창업과 매장 인수 비교 · 폐업 체크리스트. 전부 무료입니다."],
  "/tools/cost":["창업비 정리표",
                 "빠뜨리기 쉬운 항목을 전부 늘어놓고, 실제로 받으신 견적을 적으면 합계와 아직 안 받은 칸을 보여 드립니다."],
  "/tools/fixed":["월 고정비 계산",
                 "팔리든 안 팔리든 나가는 돈을 더하고, 하루에 얼마를 벌어야 그것만이라도 맞는지 보여 드립니다."],
  "/tools/bep": ["손익분기 계산",
                 "고정비를 공헌이익률로 나눕니다. 본전이 되는 월 매출과 하루 매출, 하루 손님 수까지."],
  "/tools/labor":["인건비율 계산",
                 "매출 대비 인건비가 몇 퍼센트인지. 판정하지 않고 사장님 가게의 흐름을 보시게 합니다."],
  "/tools/vs":  ["신규 창업 vs 매장 인수",
                 "새로 만드는 것과 하던 가게를 받는 것. 들어가는 돈과 문 여는 시점을 나란히 놓습니다."],
  "/tools/close":["폐업 체크리스트",
                 "정리 순서대로 짚어 가며 빠뜨린 것을 찾습니다. 기한이 있는 것이 여럿입니다."],

  "/tools/target":["목표 매출 계산",
                 "가져가고 싶은 월 순이익을 적으시면, 그러려면 얼마를 팔아야 하는지 월 매출 · 하루 매출 · 하루 손님 수까지 나옵니다."],
  "/tools/premium":["권리금 따져보기",
                 "달라는 권리금이 몇 달이면 돌아오는지, 그중 눈에 보이는 시설값이 얼마인지를 갈라 봅니다. 남은 계약 안에 회수되는지까지."],
  "/tools/rent":["임대료 비율 계산",
                 "월 매출에서 월세와 관리비가 몇 퍼센트인지. 권리금까지 영업 기간으로 나눠 보면 자리에 실제로 쓰는 돈이 보입니다."],
  "/tools/hire":["직원 고용비용 계산",
                 "급여만 보시면 실제보다 적게 잡힙니다. 사업주 부담 4대보험 · 퇴직충당 · 식대까지 더한 한 사람 월 비용과 1년치."],
  "/tools/delivery":["배달 한 건 남는 돈",
                 "중개 · 결제 수수료는 비율로, 배달비 · 포장재 · 재료비는 건마다 빠집니다. 둘을 갈라서 한 건에 얼마가 남는지 봅니다."],
  "/tools/margin":["원가율 · 마진 계산",
                 "판매가와 재료비를 넣으면 원가율과 한 개 남는 돈이 같이 나옵니다. 한 달 판매 수량까지 적으시면 달 단위로도 봅니다."],
  "/tools/closecost":["폐업 예상비용",
                 "철거 · 원상복구 · 위약금처럼 나가는 돈과 보증금 · 시설 매각처럼 돌아오는 돈을 같이 놓습니다. 중요한 것은 그 차액입니다."],
  "/faq":       ["자주 묻는 것",
                 "돈이 드는지, 연락처가 업체에 바로 넘어가는지, 등록된 업체가 몇 곳인지 — 먼저 궁금해하시는 것들에 그대로 답했습니다."],
  "/about":     ["소개",
                 "무엇을 하고 무엇을 하지 않는지 적어 두었습니다. 저희는 중개자이고 거래 당사자가 아닙니다."],
  "/terms":     ["이용약관",
                 "중개 · 매칭 서비스 기준으로 쓴 이용약관입니다. 회사의 지위, 견적 · 상담의 처리, 업체와 이용자 사이의 책임 범위를 적어 두었습니다."],
  "/privacy":   ["개인정보처리방침",
                 "어떤 정보를 어떤 목적으로 얼마나 보관하는지, 업체에 연락처를 전달할 때 어떻게 다시 동의를 받는지 적어 두었습니다."]
};

var NOINDEX = ["/my","/search","/quote","/compare","/sample",
               "/track","/sell-biz"];

function pvDesc(pv){
  var who = [];
  var reg = (pv.regions||[]).map(amRegionName).filter(Boolean);
  var gu  = (pv.gu||[]).slice(0, 3);
  var sub = (pv.subs||[]).map(amSubName).filter(Boolean);
  var ind = (pv.industries||[]).map(amIndustryName).filter(Boolean);
  if(reg.length || gu.length) who.push((gu.length ? gu.join(" · ") : reg.join(" · ")) + "에서");
  if(ind.length) who.push(ind.join(" · "));
  if(sub.length) who.push(sub.join(" · ") + " 일을 합니다.");
  else who.push("일하는 업체입니다.");
  var out = pv.name + " — " + who.join(" ");
  if(pv.intro) out += " " + pv.intro;
  return out + " 지역 · 업종 · 평수 · 예산을 적으시면 견적을 받으실 수 있습니다. " +
         "연락처는 사장님이 동의하신 뒤에만 오갑니다.";
}
function frDesc(fr){
  var fc = (typeof amFranchiseCat === "function") ? amFranchiseCat(fr.cat) : null;
  var out = fr.name + " — " + (fc ? fc.name + " 프랜차이즈입니다. " : "");
  if(fr.intro) out += fr.intro + " ";
  var c = (typeof amFranchiseCost === "function") ? amFranchiseCost(fr) : null;

  if(c && c.total) out += "총 예상 창업비 " + c.total + (c.unit||"만원") +
                          " (" + c.source + " 기준 " + c.asOf + "). ";
  if(c && c.pyeong) out += "권장 평수 " + c.pyeong + "평. ";
  return out + "창업비 · 가맹비 · 보증금 · 모집지역을 같은 기준으로 비교하실 수 있습니다.";
}

function stDesc(s){
  var where = amRegionName(s.region, s.gu);
  var out = s.title + " — " + [where, amIndustryName(s.industry)].filter(Boolean).join(" ");
  var m = [];
  if(s.pyeong  != null) m.push(s.pyeong + "평");
  if(s.deposit != null) m.push("보증금 " + s.deposit + "만원");
  if(s.rent    != null) m.push("월세 " + s.rent + "만원");
  if(s.premium != null) m.push("권리금 " + s.premium + "만원");
  if(m.length) out += " " + m.join(" · ") + ".";
  if(s.withEquip) out += " 시설을 그대로 인수하실 수 있습니다.";
  return out + " 올리신 사장님이 적으신 값이고 저희가 보증하는 값이 아닙니다. " +
         "보시려는 날짜를 적으시면 그대로 전달합니다.";
}
function asDesc(a){
  var where = amRegionName(a.region, a.gu);
  var kind  = (typeof amEquipName === "function") ? amEquipName(a.sub) : "";
  var out = a.title + " — " + [where, amIndustryName(a.industry), kind]
            .filter(Boolean).join(" ") + ".";
  var m = [];
  if(a.brand) m.push(a.brand);
  if(a.year)  m.push(a.year + "년식");
  if(a.price != null) m.push(a.price + "만원" + (a.nego ? " (협의 가능)" : ""));
  if(m.length) out += " " + m.join(" · ") + ".";
  var d = (window.AM_DEAL_KINDS||[]).filter(function(x){ return x.key === a.deal; })[0];
  if(d) out += " " + d.name + "로 거래하실 수 있습니다.";
  return out + " 사업을 정리하면서 나온 것이고, 올리신 사장님이 적으신 값입니다.";
}

window.routeInfo = function(path){
  var r = { ok:true, title:"", desc:"", canon:null,
            noindex: NOINDEX.indexOf(path) >= 0, view:null };
  if(META[path]){ r.title = META[path][0]; r.desc = META[path][1]; }

  var VIEW = {

    "/":          "main",
    "/startup":   "startup",
    "/operation": "operation",
    "/transfer":"acquisition",
    "/closure":   "closure",
    "/providers": "providers",
    "/franchise": "franchise",
    "/stores":    "stores",
    "/assets":    "assets",
    "/support":   "support",
    "/content":   "contents",
    "/quote":     "quote",
    "/sell":      "phone-sell",
    "/shop":      "phone-shop",
    "/bid":       "phone-bid",
    "/track":     "phone-track",
    "/guide":     "phone-guide",
    "/biz":       "phone-biz",
    "/sell-biz":  "sell",
    "/sample":    "sample",
    "/join":      "join",
    "/my":        "my",
    "/search":    "search",
    "/compare":   "compare",
    "/tools":      "tools",
    "/tools/cost": "tool-cost",
    "/tools/fixed":"tool-fixed",
    "/tools/bep":  "tool-bep",
    "/tools/labor":"tool-labor",
    "/tools/vs":   "tool-vs",
    "/tools/close":"tool-close",
    "/tools/target":"tool-target",
    "/tools/premium":"tool-premium",
    "/tools/rent":"tool-rent",
    "/tools/hire":"tool-hire",
    "/tools/delivery":"tool-delivery",
    "/tools/margin":"tool-margin",
    "/tools/closecost":"tool-closecost",
    "/faq":       "faq",
    "/about":     "about",
    "/terms":     "terms",
    "/privacy":   "privacy"
  };
  if(VIEW[path]){ r.view = VIEW[path]; return r; }

  var mg = /^\/g\/([a-z0-9-]+)$/.exec(path);
  if(mg){
    var st = (typeof amStage === "function") ? amStage(mg[1]) : null;
    if(!st){ r.ok = false; return r; }
    var sc = (typeof amStageCats === "function") ? amStageCats(st) : [];
    r.view = "stage"; r.stage = st;
    r.title = st.name + " — 필요한 서비스 한곳에서";
    r.desc  = st.lead + " " + st.sub + " 등 " + st.name.replace(/ /g, "") +
              " 단계에 필요한 분야 " + sc.length + "가지를 모았습니다. " +
              "업체를 비교하고 한 번에 견적을 받으세요.";
    return r;
  }

  var m = /^\/startup\/([a-z0-9-]+)$/.exec(path);
  if(m){
    var ind = (typeof amIndustry === "function") ? amIndustry(m[1]) : null;
    if(!ind){ r.ok = false; return r; }
    r.view = "startupIndustry"; r.industry = ind;
    r.title = ind.name + " 창업 — 필요한 모든 것";
    r.desc  = ind.name + " 창업에 실제로 필요한 것만 추렸습니다. " +
              "점포 · 상권 · 인테리어 · " + (ind.equip[0] ? ind.equip[0].name + " · " : "") +
              "가구 · POS · 인허가 · 마케팅까지 업체를 비교하고 견적을 받으세요.";
    return r;
  }

  var mc = /^\/closure\/([a-z0-9-]+)$/.exec(path);
  if(mc){
    var ind2 = (typeof amIndustry === "function") ? amIndustry(mc[1]) : null;
    if(!ind2){ r.ok = false; return r; }
    r.view = "closureIndustry"; r.industry = ind2;
    r.title = ind2.name + " 폐업 — 정리에 필요한 모든 것";
    r.desc  = ind2.name + " 정리에 필요한 것을 순서대로 정리했습니다. " +
              "매장 양도 · 시설 집기 처분 · 재고 · 철거 · 원상복구 · 폐업신고까지.";
    return r;
  }

  var mp = /^\/providers\/([a-z0-9-]+)$/.exec(path);
  if(mp){
    var pc = (typeof amCat === "function") ? amCat(mp[1]) : null;
    if(!pc || pc.kind !== "provider"){ r.ok = false; return r; }
    r.view = "providerCat"; r.cat = pc;
    r.title = pc.name + " 업체찾기";
    r.desc  = pc.desc + " " + (pc.items||[]).slice(0,6).map(function(i){ return i.name; }).join(" · ") +
              " 전문업체를 지역과 업종으로 비교하실 수 있습니다.";
    return r;
  }

  var mcat = /^\/c\/([a-z0-9-]+)$/.exec(path);
  if(mcat){
    var cc = (typeof amCat === "function") ? amCat(mcat[1]) : null;
    if(!cc || cc.kind === "provider"){ r.ok = false; return r; }
    r.view = "cat"; r.cat = cc;
    r.title = cc.name;
    r.desc  = cc.desc + " " + (cc.items||[]).slice(0,6).map(function(i){ return i.name; }).join(" · ") + ".";
    return r;
  }

  var mf = /^\/franchise\/([a-z0-9-]+)$/.exec(path);
  if(mf){
    var fc = (typeof amFranchiseCat === "function") ? amFranchiseCat(mf[1]) : null;
    if(!fc){ r.ok = false; return r; }
    r.view = "franchiseCat"; r.fcat = fc;
    r.title = fc.name + " 프랜차이즈";
    r.desc  = fc.name + " 프랜차이즈 브랜드를 창업비 · 가맹비 · 권장 평수 · 모집지역으로 비교하고 창업 상담을 신청하실 수 있습니다.";
    return r;
  }

  var mfd = /^\/f\/([a-z0-9-]+)$/.exec(path);
  if(mfd){
    var fr = (typeof amFranchise === "function") ? amFranchise(mfd[1]) : null;
    if(!fr){ r.ok = false; return r; }
    r.view = "franchiseOne"; r.fr = fr;
    r.title = fr.name; r.desc = frDesc(fr);
    return r;
  }

  var mpd = /^\/p\/([a-z0-9-]+)$/.exec(path);
  if(mpd){
    var pv = (typeof amProvider === "function") ? amProvider(mpd[1]) : null;
    if(!pv){ r.ok = false; return r; }
    r.view = "providerOne"; r.provider = pv;
    r.title = pv.name; r.desc = pvDesc(pv);
    return r;
  }

  var mst = /^\/s\/([a-zA-Z0-9-]+)$/.exec(path);
  if(mst){
    var st = (typeof amStore === "function") ? amStore(mst[1]) : null;
    if(!st){ r.ok = false; return r; }
    r.view = "storeOne"; r.store = st;
    r.title = st.title; r.desc = stDesc(st);
    return r;
  }

  var mas = /^\/a\/([a-zA-Z0-9-]+)$/.exec(path);
  if(mas){
    var as = (typeof amAsset === "function") ? amAsset(mas[1]) : null;
    if(!as){ r.ok = false; return r; }
    r.view = "assetOne"; r.asset = as;
    r.title = as.title; r.desc = asDesc(as);
    return r;
  }

  var mdp = /^\/d\/([a-zA-Z0-9-]+)$/.exec(path);
  if(mdp){
    var one = (typeof amShopOne === "function") ? amShopOne(mdp[1]) : null;
    if(!one){ r.ok = false; return r; }
    r.view = "product"; r.product = one;
    var nm = (typeof amShopName === "function") ? amShopName(one.it) : "";
    var gg = (typeof amGrade === "function") ? amGrade(one.it.grade) : null;
    r.title = (one.sample ? "[예시] " : "") + nm + " 중고 — 검수 결과 그대로";
    r.desc  = (one.sample
        ? "⚠️ 실제 상품이 아니라 화면 예시입니다. "
        : "") +
      nm + (one.it.color ? " · " + one.it.color : "") +
      (gg ? " · " + gg.name : "") +
      (one.it.batt ? " · 배터리 " + one.it.batt + "%" : "") +
      ". 외관 등급 · 배터리 상태 · 검수 항목 · 구성품 · 보증 조건을 " +
      "그대로 밝힙니다.";
    r.noindex = !!one.sample;
    return r;
  }

  var mct = /^\/content\/([a-z0-9-]+)$/.exec(path);
  if(mct){
    var ct = (typeof amContent === "function") ? amContent(mct[1]) : null;
    if(!ct){ r.ok = false; return r; }
    r.view = "content"; r.content = ct;
    r.title = ct.title; r.desc = ct.lead;
    return r;
  }

  r.ok = false; return r;
};

window.go = function(url, opt){
  opt = opt || {};
  if(opt.keepScroll) RT.keepScroll = true;

  try { history.replaceState({ y: Math.round(window.scrollY || 0) }, ""); } catch(e){}
  history.pushState(null, "", url);
  render();
};

document.addEventListener("click", function(ev){
  if(ev.defaultPrevented || ev.button !== 0) return;
  if(ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
  var a = ev.target.closest && ev.target.closest("a[href]");
  if(!a) return;
  if(a.target && a.target !== "_self") return;
  if(a.hasAttribute("download")) return;
  var href = a.getAttribute("href") || "";
  if(!/^\//.test(href)) return;
  if(/^\/api\//.test(href)) return;
  ev.preventDefault();
  if(href === location.pathname + location.search) return;

  go(href, { keepScroll: a.hasAttribute("data-keep") });
});

window.addEventListener("popstate", function(e){
  var y = e && e.state && typeof e.state.y === "number" ? e.state.y : null;
  if(y !== null) RT.keepScroll = true;
  render();
  if(y !== null) setTimeout(function(){ window.scrollTo(0, y); }, 0);
});

function sideOf(r){

  if(r.view === "phone-sell" || r.view === "phone-shop" ||
     r.view === "phone-bid"  || r.view === "phone-track" ||
     r.view === "phone-guide" ||

     r.view === "phone-biz" ||

     r.view === "join" || r.view === "faq" ||

     r.view === "search" || r.view === "my") return "pw-skin";
  if(r.view === "startup" || r.view === "startupIndustry") return "side-start";
  if(r.view === "closure" || r.view === "closureIndustry") return "side-close";

  if(r.view === "operation" || r.view === "acquisition") return "";

  if(r.stage){
    if(r.stage.side === "start") return "side-start";
    if(r.stage.side === "close") return "side-close";
    return "";
  }

  if(r.content && r.content.side === "start") return "side-start";
  if(r.content && r.content.side === "close") return "side-close";

  var k = r.cat && (r.cat.key || r.cat);
  if(k && window.amCatSide){
    var s = amCatSide(k);
    if(s === "start") return "side-start";
    if(s === "close") return "side-close";
  }
  return "";
}

var TONE_CLS = { white:"sec-white", gray:"sec-gray", warm:"" };
function toneGroup(e){
  var c = " " + (e.className || "") + " ";
  if(c.indexOf(" sec-white ") >= 0) return "white";
  if(c.indexOf(" sec-gray ")  >= 0) return "gray";
  if(c.indexOf(" sec-ivory ") >= 0) return "ivory";
  if(c.indexOf(" sec-start ") >= 0) return "mint";
  if(c.indexOf(" sec-blue ")  >= 0) return "sky";

  if(c.indexOf(" sec-close ") >= 0) return "peach";

  if(c.indexOf(" sec-calc ")  >= 0) return "lav";
  if(c.indexOf(" sec-step ")  >= 0) return "step";

  return "warm";
}
function paintTones(){
  var v = $("view"); if(!v) return;

  if(document.documentElement.classList.contains("ivh")) return;
  var sec = [].slice.call(v.children).filter(function(e){
    return e.tagName === "SECTION"; });
  for(var i = 1; i < sec.length; i++){
    var prev = toneGroup(sec[i-1]);
    if(toneGroup(sec[i]) !== prev) continue;
    var next = (i + 1 < sec.length) ? toneGroup(sec[i+1]) : "";
    var pick = ["white","gray","warm"].filter(function(t){
      return t !== prev && t !== next; })[0]
      || ["white","gray","warm"].filter(function(t){ return t !== prev; })[0];
    sec[i].classList.remove("sec-white","sec-gray","sec-cream");
    if(TONE_CLS[pick]) sec[i].classList.add(TONE_CLS[pick]);
  }
}

function render(){
  var path = nowPath();
  var r = routeInfo(path, {});
  if(!r.ok) return notFound(path);

  var html;
  switch(r.view){
    case "main":            html = PageMain();                      break;
    case "stage":           html = PageStage(r.stage);              break;
    case "startup":         html = PageStartup();                   break;
    case "operation":       html = PageOperation();                 break;
    case "acquisition":     html = PageAcquisition();               break;
    case "startupIndustry": html = PageStartupIndustry(r.industry); break;
    case "closure":         html = PageClosure();                   break;
    case "closureIndustry": html = PageClosureIndustry(r.industry);  break;
    case "sample":          html = PageSample();                    break;
    case "providers":       html = PageProviders();                 break;
    case "providerCat":     html = PageProviderCat(r.cat);          break;
    case "providerOne":     html = PageProviderOne(r.provider);     break;
    case "cat":             html = PageCat(r.cat);                  break;
    case "franchise":       html = PageFranchise();                 break;
    case "franchiseCat":    html = PageFranchiseCat(r.fcat);        break;
    case "franchiseOne":    html = PageFranchiseOne(r.fr);          break;
    case "storeOne":        html = PageStoreOne(r.store);         break;
    case "assetOne":        html = PageAssetOne(r.asset);         break;
    case "stores":          html = PageStores();                    break;
    case "assets":          html = PageAssets();                    break;
    case "support":         html = PageSupport();                   break;
    case "contents":        html = PageContents();                  break;
    case "content":         html = PageContent(r.content);          break;
    case "quote":           html = PageQuote();                     break;
    case "phone-sell":      html = PageSell();                      break;
    case "phone-shop":      html = PageShop();                      break;
    case "phone-bid":       html = PageBid();                       break;
    case "phone-track":     html = PageTrack();                     break;
    case "phone-guide":     html = PageGuide();                     break;
    case "phone-biz":       html = PageBiz();                       break;
    case "product":         html = PageProduct(r.product);          break;
    case "sell":            html = PageSellBiz();                   break;
    case "join":            html = PageJoin();                      break;
    case "my":              html = PageMy();                        break;
    case "search":          html = PageSearch();                    break;
    case "compare":         html = PageCompare();                   break;
    case "tools":           html = PageTools();                     break;
    case "tool-cost":       html = PageToolCost();                  break;
    case "tool-fixed":      html = PageToolFixed();                 break;
    case "tool-bep":        html = PageToolBep();                   break;
    case "tool-labor":      html = PageToolLabor();                 break;
    case "tool-vs":         html = PageToolVs();                    break;
    case "tool-close":      html = PageToolClose();                 break;
    case "tool-target":     html = PageToolTarget();                break;
    case "tool-premium":    html = PageToolPremium();               break;
    case "tool-rent":       html = PageToolRent();                  break;
    case "tool-hire":       html = PageToolHire();                  break;
    case "tool-delivery":   html = PageToolDelivery();              break;
    case "tool-margin":     html = PageToolMargin();                break;
    case "tool-closecost":  html = PageToolCloseCost();             break;
    case "faq":             html = PageFaq();                       break;
    case "about":           html = PageAbout();                     break;
    case "terms":           html = PageTerms();                     break;
    case "privacy":         html = PagePrivacy();                   break;
    default:                return notFound(path);
  }

  document.documentElement.classList.toggle("ivh", nowPath() === "/");
  $("view").className = sideOf(r);
  $("view").innerHTML = html;
  paintTones();
  paintMeta(r);
  paintChrome();
  initReveal();

  if(nowPath() === "/my" && typeof window.myLoadDb === "function") window.myLoadDb();

  if(nowPath() === "/track" && typeof window.pwTrackInit === "function") window.pwTrackInit();

  if(typeof window.pickPaint === "function") window.pickPaint();

  if(typeof window.amStateSync === "function") window.amStateSync();

  if(nowPath() === "/quote" && typeof window.quoteDraftPaint === "function")
    window.quoteDraftPaint();
  if(!RT.keepScroll) window.scrollTo(0,0);
  RT.keepScroll = false;
}
window.render = render;

window.rerender = function(keepScroll){
  if(keepScroll) RT.keepScroll = true;
  render();
};

function notFound(path){
  $("view").innerHTML =
    '<div class="w pad-pg">'+
      '<p class="eyebrow">404</p>'+
      '<h1 class="pg-h1">찾으시는 페이지가 없습니다.</h1>'+
      '<p class="pg-lead">주소가 바뀌었을 수 있습니다. 창업과 폐업 둘 중 '+
        '하나를 고르시면 거기서 다시 찾으실 수 있습니다.</p>'+
      '<div class="row-cta">'+
        '<a class="btn btn-b btn-lg" href="/startup">창업 시작하기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/closure">폐업 시작하기</a>'+
      '</div>'+
    '</div>';
  document.title = "찾을 수 없습니다 · " + ((window.AM_BRAND||{}).name || "");
  paintChrome();
  try{ console.warn("[router] 알 수 없는 주소: "+path); }catch(e){}
}

function paintMeta(r){
  var B = window.AM_BRAND || {};

  document.title = window.amTitle(r.title || "", r.canon || nowPath());
  setMeta("name","description", r.desc || META["/"][1]);
  setMeta("property","og:title", document.title);
  setMeta("property","og:description", r.desc || META["/"][1]);
  setMeta("property","og:url", ORIGIN + (r.canon || nowPath()));

  var c = document.querySelector('link[rel="canonical"]');
  if(!c){ c = document.createElement("link"); c.rel = "canonical"; document.head.appendChild(c); }
  c.href = ORIGIN + (r.canon || nowPath());

  var rb = document.querySelector('meta[name="robots"]');
  if(r.noindex){
    if(!rb){ rb = document.createElement("meta"); rb.name = "robots"; document.head.appendChild(rb); }
    rb.content = "noindex, follow";
  }else if(rb){ rb.remove(); }
}
function setMeta(attr, key, val){
  var el = document.querySelector("meta["+attr+'="'+key+'"]');
  if(!el){ el = document.createElement("meta"); el.setAttribute(attr,key); document.head.appendChild(el); }
  el.setAttribute("content", val || "");
}

try{
  if("scrollRestoration" in history) history.scrollRestoration = "manual";
}catch(e){}

document.addEventListener("DOMContentLoaded", function(){
  mountChrome();

  var root = document.documentElement;
  function onScroll(){ root.classList.toggle("sc", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive:true });
  onScroll();
  initReveal();
  render();
});

var RV_IO = null;
function initReveal(){
  var list = els2("[data-rv]");
  if(!list.length) return;
  var reduce = false;
  try{ reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){}
  if(reduce || typeof IntersectionObserver !== "function"){
    list.forEach(function(e){ e.classList.add("rv-on"); });
    return;
  }
  if(!RV_IO){
    RV_IO = new IntersectionObserver(function(xs){
      xs.forEach(function(x){
        if(!x.isIntersecting) return;
        x.target.classList.add("rv-on");
        RV_IO.unobserve(x.target);
      });
    }, { rootMargin:"0px 0px -12% 0px", threshold:0.12 });
  }
  list.forEach(function(e){
    if(e.classList.contains("rv-on")) return;
    RV_IO.observe(e);
  });
}

function els2(sel){ return [].slice.call(document.querySelectorAll(sel)); }
