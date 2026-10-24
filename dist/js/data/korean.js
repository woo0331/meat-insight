

var KO_NUM_JONG = [true,true,false,true,false,false,true,true,true,false];

window.koJong = function(word){
  var s = String(word==null?"":word).trim();

  s = s.replace(/[\s(){}\[\]<>]*$/,"").replace(/\([^)]*\)\s*$/,"").trim();
  if(!s) return null;
  var c = s.charCodeAt(s.length-1);
  if(c>=0xAC00 && c<=0xD7A3) return ((c-0xAC00)%28) !== 0;
  if(c>=0x30 && c<=0x39)     return KO_NUM_JONG[c-0x30];
  return null;
};

var KO_PAIR = {
  "은는":["은","는"], "는은":["은","는"],
  "이가":["이","가"], "가이":["이","가"],
  "을를":["을","를"], "를을":["을","를"],
  "와과":["과","와"], "과와":["과","와"],
  "아야":["아","야"], "야아":["아","야"],
  "으로로":["으로","로"], "로으로":["으로","로"],

  "이라고라고":["이라고","라고"], "라고이라고":["이라고","라고"]
};

window.josa = function(word, pair){
  var t = KO_PAIR[pair];
  if(!t){ try{ console.warn("[site] 모르는 조사 짝: "+pair); }catch(e){} return ""; }

  if(t[0]==="으로"){
    var s = String(word==null?"":word).trim();
    var c = s.charCodeAt(s.length-1);
    if(c>=0xAC00 && c<=0xD7A3 && ((c-0xAC00)%28)===8) return "로";
  }
  var has = koJong(word);

  if(has === null) return t[1];
  return has ? t[0] : t[1];
};

window.koWith = function(word, pair){ return String(word)+josa(word, pair); };
