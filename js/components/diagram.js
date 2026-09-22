/* ════════════════════════════════════════════════════════════════════
   PartDiagram — "이 부위는 어디인가요?" (작업지시서 17번)

   소·돼지 실루엣을 SVG 로 직접 그립니다. 그림 파일이 아니라 SVG 라서
   (1) 어떤 화면 폭에서도 안 깨지고 (2) 강조 위치를 데이터
   (WOW_ENC[].pos 의 0~1 비율)로 옮길 수 있습니다.

   ⚠️ pos 는 비율입니다. px 로 박으면 모바일에서 표시가 엉뚱한 데를
   가리킵니다 — 그림은 줄어드는데 점은 안 줄어들기 때문입니다.
   ════════════════════════════════════════════════════════════════════ */

var SIL = {
  /* 소 — 옆모습. viewBox 0 0 300 190.
     머리(왼쪽) · 목 · 기갑 · 등 · 엉덩이 · 꼬리 · 네 다리 · 배까지 한 획.
     ⚠️ 덩어리만 그리면 "동물" 로 안 읽힙니다 — 다리 사이가 벌어져
     있어야 소로 보입니다. 실제로 한 번 뭉뚱그렸다가 다시 그렸습니다. */
  beef:
    'M24 86 C16 84 14 74 20 68 L26 62 C30 56 34 50 36 42 '+
    'L38 30 C39 25 45 24 47 29 L52 41 '+
    'C60 38 70 35 82 33 L104 29 '+
    'C130 25 168 24 200 27 L232 31 '+
    'C244 33 250 40 251 50 L253 44 '+
    'C255 37 263 38 262 46 L258 96 C257 103 250 103 250 96 L252 62 '+
    'C249 74 246 88 244 102 L242 128 L246 166 C246 171 238 171 238 166 '+
    'L232 130 L224 128 L218 166 C218 171 210 171 210 166 L212 126 '+
    'C186 132 150 133 122 128 L118 166 C118 171 110 171 110 166 L110 124 '+
    'L100 120 L94 166 C94 171 86 171 86 166 L88 116 '+
    'C74 108 66 96 62 82 L58 68 L44 74 C38 80 32 86 24 86 Z',
  /* 돼지 — 옆모습. 주둥이·귀·통통한 몸통·짧은 다리·말린 꼬리. */
  pork:
    'M18 82 C10 80 10 68 20 66 L34 62 C36 52 42 46 52 43 '+
    'L54 32 C55 27 62 27 63 33 L65 43 '+
    'C88 36 128 33 166 36 L214 41 '+
    'C238 44 252 56 254 74 L258 72 '+
    'C266 70 270 78 264 82 C270 86 266 94 259 92 C254 90 252 84 254 78 '+
    'L250 96 C246 112 236 122 224 127 L226 164 C226 169 218 169 218 164 '+
    'L214 130 L196 132 L192 164 C192 169 184 169 184 164 L186 131 '+
    'C160 133 130 132 108 128 L104 164 C104 169 96 169 96 164 L98 124 '+
    'L86 118 L80 164 C80 169 72 169 72 164 L76 112 '+
    'C62 102 54 90 52 76 L50 64 L36 72 C30 78 24 82 18 82 Z'
};

/* 부위를 하나 강조한 그림.
   sp = "beef" | "pork", ent = WOW_ENC 의 한 줄(없으면 표시 없이 실루엣만) */
function PartDiagram(sp, ent, opt){
  opt = opt || {};
  var sil = SIL[sp] || SIL.beef;
  var label = ent ? (ent.name + (opt.sub?" ("+opt.sub+")":"")) : "";
  var px = ent ? (ent.pos[0]*300) : null;
  var py = ent ? (ent.pos[1]*190) : null;

  return '<figure class="pd" style="margin:0;">'+
    '<svg viewBox="0 0 300 190" role="img" '+
      'aria-label="'+esc(sp==="pork"?"돼지":"소")+' 부위 그림'+(ent?' — '+esc(ent.name)+' 위치':'')+'" '+
      'style="width:100%;height:auto;display:block;">'+
      /* ⚠️ SIL 은 <path> 요소가 아니라 좌표(d) 문자열입니다 —
         그냥 넣으면 글자로 들어가 **그림이 통째로 안 나옵니다.** */
      '<path d="'+sil+'" fill="#DCDAD2" stroke="#C9C6BC" stroke-width="1.5" '+
        'stroke-linejoin="round" stroke-linecap="round"/>'+
      (ent ?
        /* 강조 — 빨간 점 + 지시선 + 이름표. 빨강은 여기서만 씁니다
           (지시서 3번: Accent Red 는 강조 요소에만). */
        '<g>'+
          '<ellipse cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" rx="30" ry="17" '+
            'fill="#C85B4B" fill-opacity=".22" stroke="#C85B4B" stroke-width="2"/>'+
          '<circle cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="4" fill="#C85B4B"/>'+
        '</g>' : '')+
    '</svg>'+
    /* ⚠️ 이름표를 **SVG 안의 <text> 로 넣지 마세요.** 그림이 줄어들면
       글자도 같이 줄어들어 모바일에서 11.5px 이 됐습니다 — 12px 미만
       금지에 걸립니다. HTML 로 빼면 화면 폭과 상관없이 크기가 고정되고,
       읽어 주는 프로그램도 그냥 읽습니다. */
    (ent ? '<figcaption class="pd-cap">'+esc(label)+'</figcaption>' : '')+
  '</figure>';
}

/* 카드에 넣는 작은 부위 그림 — **사진이 아직 없는 부위**에 씁니다.

   ⚠️ 없는 사진 파일명을 적어 넣어 때우지 마세요. imgTag 가 404 를 한 번
   내고 카드가 빈 상자가 됩니다. 비슷하게 생겼다고 남의 부위 사진을
   돌려 쓰는 것은 더 나쁩니다 — 손님은 그 사진으로 살지 말지를 정합니다.
   사진이 없으면 **어디 부위인지**라도 보여 주는 편이 낫습니다.

   이름표(pd-cap)는 붙이지 않습니다. 카드에 이름이 이미 있습니다. */
function PartThumb(sp, ent){
  var sil = SIL[sp] || SIL.beef;
  var px = (ent && ent.pos) ? (ent.pos[0]*300) : null;
  var py = (ent && ent.pos) ? (ent.pos[1]*190) : null;
  return '<svg class="pd-th" viewBox="0 0 300 190" role="img" aria-hidden="true" focusable="false">'+
    '<path d="'+sil+'" fill="#DCDAD2" stroke="#C9C6BC" stroke-width="1.5" '+
      'stroke-linejoin="round" stroke-linecap="round"/>'+
    (px===null ? '' :
      '<ellipse cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" rx="30" ry="17" '+
        'fill="#C85B4B" fill-opacity=".22" stroke="#C85B4B" stroke-width="2"/>'+
      '<circle cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="4" fill="#C85B4B"/>')+
  '</svg>';
}

/* 부위 요약표 — 그림 옆에 붙는 "한눈에 보는 포인트" */
function PartPoints(p, ent){
  var rows=[
    ["부위",    ent ? ent.name+(ent.sub?" ("+ent.sub+")":"") : null],
    ["특징",    ent && ent.feat],
    ["식감",    ent && ent.texture],
    ["추천요리", ent && (ent.cook||[]).join(", ")],
    ["보관방법", p && p.temp==="frozen" ? "-18℃ 이하 냉동" : "0~5℃ 냉장"],
    ["작업일",  p && p.workDate],
    ["원산지",  p && p.origin]
  ].filter(function(r){ return r[1] && String(r[1]).trim(); });
  if(!rows.length) return "";
  return '<div class="pp"><h4>한눈에 보는 포인트</h4><ul>'+
    rows.map(function(r){
      return '<li><span>'+esc(r[0])+'</span><b>'+esc(r[1])+'</b></li>';
    }).join("")+'</ul></div>';
}
