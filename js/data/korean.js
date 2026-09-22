/* ════════════════════════════════════════════════════════════════════
   조사(은/는 · 이/가 · 을/를 · 와/과 · (으)로) 고르기

   왜 데이터 폴더에 있는가:
   build-pages.js 가 js/data/*.js 와 app.js 의 routeInfo() 만 읽어
   검색용 메타를 만듭니다. 조사 고르기가 components/ 에 있으면
   **검색 결과에만** "막창을(를) 보내 드립니다" 가 남습니다.
   실제로 카테고리 17개의 description 이 그렇게 나가 있었습니다.

   ⚠️ "곱창을(를)" 처럼 괄호로 때우지 마세요. 손님 화면에서는 물론이고
   구글 검색 결과 줄에 그대로 보입니다 — 그 순간 자동 생성 티가 납니다.
   ════════════════════════════════════════════════════════════════════ */

/* 숫자를 우리말로 읽었을 때 받침이 있는지 — 0영 1일 3삼 6육 7칠 8팔 */
var KO_NUM_JONG = [true,true,false,true,false,false,true,true,true,false];

/* 마지막 글자에 받침이 있는가.
   한글이 아니면 알 수 없으므로 null 을 돌려줍니다 (호출부가 정합니다). */
window.koJong = function(word){
  var s = String(word==null?"":word).trim();
  /* 괄호 안 설명은 빼고 봅니다 — "간 (소간)" 은 "간" 으로 읽습니다 */
  s = s.replace(/[\s(){}\[\]<>]*$/,"").replace(/\([^)]*\)\s*$/,"").trim();
  if(!s) return null;
  var c = s.charCodeAt(s.length-1);
  if(c>=0xAC00 && c<=0xD7A3) return ((c-0xAC00)%28) !== 0;   /* 종성 인덱스 */
  if(c>=0x30 && c<=0x39)     return KO_NUM_JONG[c-0x30];
  return null;
};

/* 받침이 있을 때 / 없을 때. ⚠️ "와/과" 만 우리가 말하는 순서가
   거꾸로입니다 (받침 없을 때가 "와"). 부르는 쪽이 "와과" 로 적든
   "과와" 로 적든 같은 답이 나오게 둘 다 받습니다 — 이 하나 때문에
   틀린 조사가 나가는 일을 막습니다. */
var KO_PAIR = {
  "은는":["은","는"], "는은":["은","는"],
  "이가":["이","가"], "가이":["이","가"],
  "을를":["을","를"], "를을":["을","를"],
  "와과":["과","와"], "과와":["과","와"],
  "아야":["아","야"], "야아":["아","야"],
  "으로로":["으로","로"], "로으로":["으로","로"]
};

/* josa("곱창","을를") → "을",  josa("지라","을를") → "를" */
window.josa = function(word, pair){
  var t = KO_PAIR[pair];
  if(!t){ try{ console.warn("[ABOUTMEAT] 모르는 조사 짝: "+pair); }catch(e){} return ""; }
  /* (으)로 는 ㄹ 받침이 예외입니다 — "물로" · "서울로" */
  if(t[0]==="으로"){
    var s = String(word==null?"":word).trim();
    var c = s.charCodeAt(s.length-1);
    if(c>=0xAC00 && c<=0xD7A3 && ((c-0xAC00)%28)===8) return "로";
  }
  var has = koJong(word);
  /* 한글도 숫자도 아니면 읽는 법을 모릅니다. 괄호로 때우지 않고
     받침 없는 쪽을 씁니다 — 적어도 문장으로는 읽힙니다. */
  if(has === null) return t[1];
  return has ? t[0] : t[1];
};

/* 낱말 뒤에 조사를 붙여 돌려줍니다 — 부르는 쪽이 짧아집니다.
   window.koWith("곱창","은는") → "곱창은" */
window.koWith = function(word, pair){ return String(word)+josa(word, pair); };
