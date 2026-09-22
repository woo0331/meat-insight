# ABOUTMEAT — 소·돼지 부산물 전문 온라인몰

`www.aboutmeat.co.kr`. 빌드 도구 없는 정적 HTML/CSS/JS 입니다.
`index.html` 을 그냥 열면 바로 돕니다 — 설치할 것도, 빌드할 것도 없습니다.

## 구조

```
index.html              해시 라우팅 SPA 껍데기 (스크립트 순서가 곧 의존 순서)
css/tokens.css          색·글씨·간격·모서리·비율 — 날값은 여기 한 곳에만
css/app.css             공통 (헤더·히어로·카드·버튼·푸터·모바일 네비)
css/pages.css           화면별 (목록·상세·도감·장바구니·폼)
js/data/site.js         사업자 정보 (WOW_BIZ) — 비면 푸터에서 줄째 빠짐
js/data/categories.js   소·돼지 전체 분류 · GNB · 퀵 카테고리
js/data/products.js     상품 (임시 데이터)
js/data/filters.js      필터·정렬
js/data/encyclopedia.js 부산물 도감 (부위 설명·pos 강조 좌표)
js/components/          base · chrome · cards · diagram
js/pages/               home · list · detail · misc
js/app.js               라우터 · 장바구니 · 찜
img/                    사진 48장
check.js                전수 점검 (playwright)
```

## 화면 (전부 새로고침·공유 링크로 열립니다)

| 주소 | 화면 |
|---|---|
| `#/` | 메인 |
| `#/products` | 전체상품 (`?today=1` `?trim=full` `?use=업소용`) |
| `#/c/<sp>` · `/<cat>` · `/<item>` | 소·돼지 / 분류 / 세부 품목 |
| `#/p/<id>` | 상품 상세 |
| `#/enc` · `#/enc/<sp>` · `#/enc/<sp>/<slug>` | 부산물 도감 |
| `#/b2b` · `#/b2b/quote` | 업소용 · 대량견적 |
| `#/search?q=` `#/cart` `#/login` `#/signup` `#/my` `#/about` | 나머지 |

**화면을 새로 만들면 `js/app.js` 의 `render()` 와 `TITLES` 둘 다 넣으세요.**
`render()` 에만 넣으면 문서 제목이 안 바뀌고, 안 넣으면 주소가 `#/` 로
정리되어 새로고침·공유 링크로 안 열립니다.

## 확인

```bash
node check.js     # 16개 화면 × 1440·1024·390px 전수
```

보는 것: JS 에러 · 못 불러온 파일 · 가로 스크롤 · **12px 미만 글씨** ·
**40px 미만 누름** · 낱말 가운데 잘림 · 손님 화면에 남은 개발자 말 ·
링크 65개가 실제로 열리는지.

## 지켜야 할 것

1. **Accent Red(`--red` #C85B4B)는 가격·특가·NEW 배지에만.** 구간 제목이나
   카드 배경으로 넓히면 그 순간 "빨간 정육점" 이 됩니다.
2. **12px 미만 글씨 금지, 누르는 것은 40px 이상.** `<button>` 만이 아니라
   `onclick` 을 단 `a`·`div` 도 전부 해당합니다. `padding` 으로 높이를
   만들지 말고 `min-height` + `flex` 로 잡으세요 ("천엽" 처럼 짧은 이름에서
   다시 낮아집니다).
3. **사진 url 을 CSS 변수로 넘기지 마세요.** 변수 안의 `url()` 은 HTML 이
   아니라 **그 CSS 파일 기준**으로 풀립니다 — `img/hero.jpg` 가
   `css/img/hero.jpg` 가 되어 히어로가 통째로 검게 비었습니다.
   `.hero-ph` 처럼 실제 요소에 인라인으로 주세요.
4. **`.w` 에서 `width:100%` 를 빼지 마세요.** 그리드 칸 안에서
   `margin:0 auto` 가 stretch 를 꺼서 폭이 내용 크기로 쪼그라듭니다
   (히어로 글자가 1280px → 441px 로 줄어 가운데로 몰렸습니다).
5. **그리드 칸에는 `min-width:0`.** 안에 가로로 긴 것이 있으면 칸이 화면보다
   넓어져 페이지 전체에 가로 스크롤이 생깁니다.
6. **값이 없으면 자리표시자를 찍지 말고 줄째 빼세요.** 푸터 사업자 정보가
   그렇게 되어 있습니다. 무엇이 비었는지는 `console.warn` 으로 (운영자만 봄).
7. **숫자·리뷰를 지어내지 마세요.** 리뷰가 없으면 "아직 등록된 리뷰가
   없습니다" 라고 씁니다.

## 아직 안 된 것 (운영자·개발자가 붙여야 함)

| 항목 | 어디 |
|---|---|
| **사업자 정보** (판매 시작 전 필수 — 전자상거래법 제10조) | `js/data/site.js` 의 `WOW_BIZ` |
| 실제 상품·가격 | `js/data/products.js` — 구조는 그대로 두고 내용만 교체 |
| 로그인·회원가입 | `js/app.js` 의 `doLogin` · `doSignup` |
| 결제 | `js/app.js` 의 `checkout` |
| 대량견적 접수 | `js/pages/misc.js` 의 `submitQuote` + `WOW_BIZ.quoteTo` |

## 사진에 대하여

`img/` 48장은 **시안 이미지에서 잘라낸 임시 사진**입니다. 시안 원본이
1312px 이라 화소가 그만큼밖에 없어, 큰 배너는 `background-size:auto 100%`
로 확대율을 낮춰 쓰고 있습니다. 실제 촬영본이 생기면 같은 파일명으로
바꿔 넣으면 코드는 안 고쳐도 됩니다.

⚠️ 시안에 박힌 한글은 AI 가 만든 것이라 **글자가 틀려 있습니다.** 그래서
글자가 걸린 부분은 잘라내지 않고, 화면의 모든 글은 HTML 로 다시 썼습니다.
사진을 교체할 때도 **글자가 박힌 이미지는 쓰지 마세요.**
