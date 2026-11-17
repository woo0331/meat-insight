

window.WOW_BIZ = {

  site:           "https://storeway.co.kr",

  company:        "",
  ceo:            "",
  brn:            "",
  mailOrder:      "",
  address:        "",
  phone:          "",
  email:          "",
  hours:          "",

  privacyOfficer: "",
  privacyEmail:   "",
  privacyPhone:   "",

  sosReady:       true,

  effective:      "2026-09-25"
};

window.bizVal = function(k){
  var v = (window.WOW_BIZ || {})[k];
  if(v === true) return true;
  if(v === false || v == null) return null;
  v = String(v).trim();
  return v ? v : null;
};
window.bizPrivacyEmail = function(){ return bizVal("privacyEmail") || bizVal("email"); };
window.bizPrivacyPhone = function(){ return bizVal("privacyPhone") || bizVal("phone"); };
