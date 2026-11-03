# img/ — 사진을 두는 곳

⚠️⚠️ **폴더를 일부러 갈라 두었습니다.** 어느 사진이 임시인지 한눈에
보이지 않으면, 바꿔야 할 때 아무도 못 찾습니다.

```
img/            원본 품질입니다. 그대로 씁니다.
                hero.jpg · zone-learn/trade/play/biz.jpg

img/mock/       ⚠️ 시안 스크린샷에서 뽑아 **늘린** 것입니다.
                규격은 맞지만 원본 해상도가 아니라 크게 보면 뿌옇습니다.
                cat-*.jpg (10장) · match-banner.jpg · partner-banner.jpg

img/raw/        위 mock 의 **원본**입니다 (화면이 읽지 않습니다).
                tools/fit-photos.js 가 이것을 읽어 규격에 맞춥니다.

img/hold/       ⚠️ **아무 데서도 안 씁니다.** 시안의 "신규 입점업체"
                예시 사진 넉 장입니다 — 그 자리에 쓰면 없는 업체를
                광고하는 것입니다 (절대 규칙 1). 실제 업체가 승인되면
                그 업체의 사진으로 채워집니다.
```

## 원본 사진으로 바꾸실 때

```
① 새 사진을 img/raw/<자리이름>.jpg 로 넣습니다
② node tools/fit-photos.js            → img/ 에 규격을 맞춰 냅니다
③ js/data/photos.js 의 그 줄에서 경로의 `mock/` 만 지웁니다
④ node tools/check-photos.js  →  node tools/test-photos.js
```

⚠️ 자리 이름 · 최소 크기 · 비율 · 용량은 `js/data/photos.js` 의
`AM_PHOTO_SLOTS` **한 곳**에 있습니다. 여기 다시 적지 않습니다.

## ⚠️ 아직 사람 눈으로 보셔야 하는 것 둘

- `mock/cat-market.jpg` — 상자에 **금색 글자**가 보입니다 (AI 가 만든
  글자라 읽히지는 않지만 글자꼴입니다). 규칙은 "글자 없음" 입니다.
- `mock/match-banner.jpg` — 골프공에 **방패 로고**가 박혀 있습니다.
  사진 안에 있어 나중에 못 바꿉니다.
