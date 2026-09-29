/* ════════════════════════════════════════════════════════════════════
   MY — 내 창업 / 내 폐업 (§42)

   로그인이 없어도 다시 올 이유를 만드는 자리입니다. 전부
   `localStorage` 이고 **서버로 보내지 않습니다.**

   ⚠️ **성함 · 연락처를 담지 않습니다.** 가게 컴퓨터는 여러 사람이 씁니다.
   ⚠️ `localStorage` 는 사파리 비공개 모드에서 **던집니다.** 감싸지
   않으면 화면이 통째로 안 그려집니다 (`amGet`/`amSet` 이 감쌉니다).
   ⚠️ **아직 안 하신 칸도 숨기지 않습니다.** 숨기면 여기서 무엇을 할 수
   있는지 모르게 됩니다.
   ════════════════════════════════════════════════════════════════════ */

var MKEY = "am.profile.v1";

function PageMy(){
  var p = amGet(MKEY, { side:"", industry:"", region:"", gu:"", pyeong:"", dday:"" });
  var qs = amGet("am.quotes.v1", []);
  var ind = p.industry ? amIndustry(p.industry) : null;

  return PgHero({
    kicker:"MY",
    h1raw: p.side === "close" ? "내 폐업" : (p.side === "start" ? "내 창업" : "지금 어느 쪽이세요?"),
    lead:"이 브라우저에만 남습니다. 서버로 보내지 않습니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w">'+
    '<div class="my-set">'+
      '<div class="f-r"><label for="my-side">상황</label>'+
        '<select class="sel" id="my-side" onchange="myPut()">'+
          '<option value=""'+(!p.side?" selected":"")+'>고르지 않음</option>'+
          '<option value="start"'+(p.side==="start"?" selected":"")+'>창업 준비중</option>'+
          '<option value="close"'+(p.side==="close"?" selected":"")+'>폐업 준비중</option>'+
        '</select></div>'+
      '<div class="f-r"><label for="my-ind">업종</label>'+
        IndustrySelect("my-ind", p.industry, "myPut()")+'</div>'+
      '<div class="f-r"><label for="my-reg">지역</label>'+
        RegionSelect("my-reg", p.region, "myPut()")+'</div>'+
      '<div class="f-r"><label for="my-py">평수</label>'+
        '<input id="my-py" inputmode="numeric" value="'+esc(p.pyeong||"")+'" '+
        'onchange="myPut()" placeholder="예: 30"></div>'+
    '</div>'+

    (p.side && ind
      ? '<div class="my-next"><h2>'+esc(ind.name)+' '+
          (p.side==="close"?"정리":"창업")+'에 필요한 것</h2>'+
          '<div class="cat-g cat-g4">'+
            amCatsFor(p.industry, p.side==="close"?"close":"start").slice(0,8)
              .map(function(c){ return CatCard(c, p.industry); }).join("")+
          '</div>'+
          '<div class="row-cta">'+
            '<a class="btn btn-b" href="'+esc(p.side==="close"?("/closure/"+p.industry):("/startup/"+p.industry))+'">'+
              '전부 보기'+icon("arrow",16)+'</a>'+
            '<a class="btn btn-o" href="'+esc(quoteTo({industry:p.industry,region:p.region,side:p.side}))+'">'+
              '견적 요청</a>'+
          '</div></div>'
      : Empty({
          icon:"user",
          title:"상황과 업종을 고르시면",
          text:"그 업종에 실제로 필요한 것만 여기 모아 드립니다.",
          cta:'<a class="btn btn-b" href="/startup">창업 시작하기'+icon("arrow",16)+'</a>'+
              '<a class="btn btn-o" href="/closure">폐업 시작하기</a>'
        }))+

    '<div class="my-next"><h2>받은 제안</h2>'+
      (qs.length
        ? '<p class="lead">'+qs.length+'건을 적어 두셨습니다.</p>'+
          '<div class="row-cta"><a class="btn btn-o" href="/quote">비교 화면으로</a></div>'
        : '<p class="lead">아직 적어 두신 제안이 없습니다. 견적을 받으시면 '+
          '<a href="/quote">여기</a>에 나란히 놓고 보실 수 있습니다.</p>')+
    '</div>'+

    '<div class="row-cta"><button class="btn btn-o" type="button" onclick="myClear()">'+
      '내 기록 전부 지우기</button></div>'+
  '</div></section>';
}

window.myPut = function(){
  amSet(MKEY, {
    side: $("my-side").value, industry: $("my-ind").value,
    region: $("my-reg").value, gu:"", pyeong: $("my-py").value.trim(), dday:""
  });
  rerender(true);
};
/* ⚠️ 되돌릴 수 없으므로 한 번 물어봅니다 */
window.myClear = function(){
  if(!confirm("이 브라우저에 남은 기록을 전부 지웁니다. 되돌릴 수 없습니다.")) return;
  amDel(MKEY); amDel("am.quotes.v1"); rerender(true);
};
