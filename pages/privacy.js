/* ════════════════════════════════════════════════════════════════════
   개인정보처리방침 — /privacy  (글은 js/data/legal-privacy.js 한 곳에)

   ⚠️⚠️ **보유 기간은 site.js 의 applyKeep 에서 끌어옵니다.** 두 곳에
   적으면, 손님이 동의할 때 본 기간과 방침에 적힌 기간이 달라집니다 —
   둘 다 화면에 나가는 글입니다.

   ⚠️⚠️ **개인정보 보호책임자(제31조)가 비면 그 절이 빠집니다.**
   지어낼 수 없습니다. 영업 전에 반드시 채우세요.
   ════════════════════════════════════════════════════════════════════ */
var W = global.window, esc = W.esc;

function table(head, rows){
  return '<div class="doc-t"><table><thead><tr>' +
    head.map(function(h){ return '<th scope="col">' + esc(h) + '</th>'; }).join("") +
    '</tr></thead><tbody>' + rows.map(function(r){
      return '<tr>' + r.map(function(c){ return '<td>' + esc(c) + '</td>'; }).join("") + '</tr>';
    }).join("") + '</tbody></table></div>';
}
function list(title, lines, n){
  return '<section class="doc-a"><h2>' + n + '. ' + esc(title) + '</h2>' +
    '<ul class="doc-ul">' + lines.map(function(s){ return '<li>' + esc(s) + '</li>'; }).join("") +
    '</ul></section>';
}

exports.build = function(){
  var P = W.AM_PRIVACY, eff = W.bizVal("effective");

  /* ⚠️⚠️⚠️ **보유 기간은 글로 적지 않고 `{...Keep}` 꼴로 적어 둡니다** —
     값은 js/data/site.js 한 곳에서 옵니다. 전에는 여기서 `applyKeep` ·
     `inquiryKeep` **둘을 손으로 적어** 바꿨는데, 그러면 새 기능이
     보유 기간을 하나 더 쓰는 날 그 자리만 **바뀌지 않은 채**
     손님 화면에 중괄호째 찍힙니다 (조인 · 커뮤니티 · 인력을 더하면서
     실제로 그럴 참이었습니다).
     ⚠️ 그래서 **꼴을 따라가며** 바꿉니다 — 키를 여기 다시 적지
     않습니다. 비어 있으면 그 자리에서 어느 키인지 말합니다. */
  function fill(txt, where){
    return String(txt).replace(/\{([A-Za-z]+Keep)\}/g, function(_, k){
      var v = W.bizVal(k);
      if(!v){
        console.warn("  ⚠️ /privacy — " + k + "(보유 기간)이 비어 있습니다 " +
          "(개인정보보호법 제15조 제2항 · js/data/site.js) — \"" + where + "\" 줄.");
        return "";
      }
      return v;
    });
  }

  var body = '<section class="pghd"><div class="wrap">' +
    '<nav class="crumb" aria-label="현재 위치"><a href="/">홈</a>' +
    '<span aria-current="page">' + esc(P.title) + '</span></nav>' +
    '<h1>' + esc(P.title) + '</h1>' +
    '<p class="pghd-l">' + esc(P.lead) + '</p>' +
    (eff ? '<p class="doc-eff">시행일 ' + esc(eff) + '</p>' : '') +
  '</div></section>';

  var n = 0, secs = "";

  secs += '<section class="doc-a"><h2>' + (++n) + '. 받는 개인정보와 그 까닭</h2>' +
    table(["누구에게서", "받는 것", "쓰는 까닭", "두는 기간"],
      P.collect.map(function(c){
        return [c.who, c.items, c.why, fill(c.keep, c.who)];
      })) + '</section>';

  secs += '<section class="doc-a"><h2>' + (++n) + '. 제3자 제공</h2>' +
    '<p>' + esc(P.third.lead) + '</p>' +
    table(["누구에게", "주는 것", "주는 까닭", "두는 기간"],
      P.third.rows.map(function(r){ return [r.to, r.items, r.why, fill(r.keep, r.to)]; })) +
    '<p>' + esc(P.third.note) + '</p>' +
    /* ⚠️⚠️ 법령에 따른 제공(제20조의4 제2항) — 동의를 받지 않는 자리라
       위의 표가 아니라 따로 적습니다. ⚠️ 칸을 만들어 놓고 **그리는 자리를
       안 만들면** 그 글은 아무도 안 읽는 글이 됩니다 (0053 에서 겪은
       자리). 비면 줄째 빠집니다. */
    (P.third.law ? '<p>' + esc(P.third.law) + '</p>' : '') +
    '</section>';

  /* ⚠️ 수탁자가 없으면 그 절을 아예 빼지 않고 "없습니다" 라고 적습니다 —
     방침에서 빠진 절은 "안 알렸다" 로 읽힙니다. */
  secs += '<section class="doc-a"><h2>' + (++n) + '. 처리 위탁</h2>' +
    (P.trustees.length
      ? table(["맡는 곳", "나라", "맡기는 일", "맡기는 기간"],
          P.trustees.map(function(t){ return [t.name, t.country, t.what, t.keep]; }))
      : '<p>현재 위탁하는 곳이 없습니다.</p>') + '</section>';

  secs += list("이용자의 권리", P.rights, ++n);
  secs += list("파기", P.destroy, ++n);
  secs += list("안전 조치", P.safety, ++n);
  secs += list("쿠키와 브라우저 저장", P.cookie, ++n);

  /* ⚠️⚠️ 개인정보보호법 제31조 — 지어낼 수 없습니다. 비면 절째 뺍니다. */
  var who = W.bizVal("privacyOfficer");
  if(who){
    var rows = [["직책 · 성명", who]];
    if(W.bizPrivacyEmail()) rows.push(["이메일", W.bizPrivacyEmail()]);
    if(W.bizPrivacyPhone()) rows.push(["전화", W.bizPrivacyPhone()]);
    secs += '<section class="doc-a"><h2>' + (++n) + '. 개인정보 보호책임자</h2>' +
      table(["칸", "값"], rows) + '</section>';
  }else{
    console.warn("  ⚠️ /privacy — 개인정보 보호책임자가 비어 있어 그 절을 뺐습니다 " +
                 "(개인정보보호법 제31조 · 영업 전 필수).");
  }

  secs += '<section class="doc-a"><h2>' + (++n) + '. 방침의 변경</h2>' +
    '<p>이 방침을 고칠 때에는 적용일과 고친 내용을 적용일 7일 전부터 게시합니다. ' +
    '이용자에게 불리한 변경은 30일 전부터 게시합니다.</p></section>';

  body += '<section class="sec"><div class="wrap"><div class="doc">' + secs + '</div></div></section>';

  return {
    route: "/privacy", title: P.title, crumbs: [[P.title, "/privacy"]],
    desc: "골프올인원 개인정보처리방침 — 받는 항목, 쓰는 까닭, 두는 기간, " +
          "업체에 넘길 때의 절차, 위탁하는 곳을 적습니다.",
    body: body
  };
};
