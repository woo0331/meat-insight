

window.faqToggle = function(btn){
  if(!btn) return;
  var p = document.getElementById(btn.getAttribute("aria-controls"));
  if(!p) return;
  var open = p.hidden;
  p.hidden = !open;
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  btn.classList.toggle("is-open", open);
};

function PageFaq(){
  var f = (window.amFaq ? amFaq() : []);
  var sel  = nowQS("c") || "";
  var nOf  = function(k){
    return f.filter(function(x){ return (x.cat || "etc") === k; }).length; };
  var cats = (window.AM_FAQ_CATS || []).filter(function(k){ return nOf(k.key) > 0; });
  if(sel && !cats.some(function(k){ return k.key === sel; })) sel = "";

  if(!f.length) return PgHero({ kicker:"자주 묻는 것", h1:"자주 묻는 것", tight:true })+
    '<section class="sec"><div class="w w-narrow">'+
      Empty({
        icon:"info",
        title:"아직 정리된 문답이 없습니다",
        text:"궁금한 것을 견적 요청에 적어 주시면 답해 드리고, 자주 나오는 것은 "+
             "여기에 정리해 둡니다.",

        cta:'<a class="btn btn-b" href="/sell">내 폰 팔기</a>'+
            '<a class="btn btn-o" href="/guide">이용 안내</a>'
      })+
    '</div></section>';

  return PgHero({
    crumb: Crumb([["홈","/"],["자주 묻는 것", null]]),
    kicker:"자주 묻는 것",
    h1:"먼저 궁금해하시는 것들",
    lead:"약속드릴 수 없는 것은 약속드리지 않고, 아직 없는 것은 없다고 적었습니다.",
    tight:true
  })+

  '<section class="sec"><div class="w w-narrow">'+
    (cats.length > 1
      ? '<ul class="chip-g chip-g-fil">'+
          '<li><a class="chip'+(sel?"":" on")+'" href="/faq">전체 '+f.length+'</a></li>'+
          cats.map(function(k){
            return '<li><a class="chip'+(sel===k.key?" on":"")+'" href="'+
              esc("/faq?c="+encodeURIComponent(k.key))+'">'+
              esc(k.name)+' '+nOf(k.key)+'</a></li>';
          }).join("")+
        '</ul>'
      : "")+
    '<ul class="faq-l">'+ f.map(function(x, i){
      var id  = "faq-a-" + i;
      var on  = !sel || (x.cat || "etc") === sel;

      return '<li class="faq-i"'+(on ? "" : " hidden")+'>'+
        '<button class="faq-q" type="button" aria-expanded="false"'+
          ' aria-controls="'+esc(id)+'" onclick="faqToggle(this)">'+
          '<span>'+esc(x.q)+'</span>'+
          '<span class="faq-x" aria-hidden="true">'+icon("chevd",18)+'</span>'+
        '</button>'+
        '<p class="faq-a" id="'+esc(id)+'" hidden>'+esc(x.a)+'</p>'+
      '</li>';
    }).join("")+'</ul>'+

    '<p class="note note-mid">여기 없는 것이 궁금하시면 요청에 그대로 적어 주세요.</p>'+
    '<div class="row-cta row-mid">'+

      '<a class="btn btn-b btn-lg" href="/sell">내 폰 팔기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-o btn-lg" href="/guide">이용 안내</a>'+
    '</div>'+
  '</div></section>';
}
