/* 검사용 씨앗 — tools/test-providers.js 가 잠깐 바꿔 둔 것입니다. */
window.AM_PROVIDERS_AT = "검사용 씨앗";
window.AM_PROVIDERS = [
  {
    "id": "green-pt",
    "name": "성남 그린골프연습장",
    "intro": "실내 타석 열두 개와 스크린 네 대를 둡니다.",
    "regions": [
      "gyeonggi"
    ],
    "subs": [
      "rg-in",
      "rg-sim",
      "ls-solo"
    ],
    "since": 2019,
    "consult_hours": "평일 09:00~22:00",
    "verified": {
      "brn": true,
      "tel": true
    },
    "scale": "mid",
    "brands": [
      "타이틀리스트",
      "캘러웨이"
    ],
    "prices": [
      {
        "sub": "rg-in",
        "label": "타석 1시간",
        "amount": 12000,
        "unit": "1시간"
      },
      {
        "sub": "ls-solo",
        "label": "주 1회 · 8회권",
        "amount": 400000,
        "unit": "8회",
        "note": "타석 이용료 별도"
      }
    ],
    "photos": [
      {
        "url": "https://sb-test.supabase.co/storage/v1/object/public/pv/a.jpg",
        "caption": "실내 타석"
      },
      {
        "url": "https://sb-test.supabase.co/storage/v1/object/public/pv/b.jpg"
      }
    ],
    "ceo": "박대표",
    "addr": "<b>경기</b> 성남시 분당구 1",
    "tel": "031-111-2222",
    "email": "pt@green.test",
    "brn": "123-45-67890"
  },
  {
    "id": "xss-test",
    "name": "<img src=x onerror=alert(1)>",
    "intro": "<script>alert(2)</script> 소개글",
    "regions": [
      "seoul"
    ],
    "subs": [
      "ft-mend",
      "ft-grip"
    ],
    "scale": "small"
  }
];
