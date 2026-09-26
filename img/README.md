# /img — 사진 자리

이 폴더의 `*.svg` 는 **코드로 그린 그림**입니다 (`node tools/make-img.js`).
실제 사진이 생기면 **여기 파일을 넣고 `js/data/photos.js` 의 경로만
바꾸면** 그 자리가 사진용 짜임새로 바뀝니다. 화면 코드는 안 건드립니다.

```js
// js/data/photos.js
hero: { src:"/img/hero.jpg", alt:"정육 작업대 앞에서 고기를 손질하는 사장님" },
```

## 사진을 만들 때

- ⚠️ **글자가 박힌 이미지를 쓰지 마세요.** AI 가 만든 한글은 글자가 틀려
  있습니다. 확대도 번역도 안 됩니다.
- ⚠️ **AI 티가 강한 고기 사진을 남발하지 마세요** (지시서 32번). 이 사이트는
  고기를 파는 곳이 아니라 **사업자를 위한 서비스**입니다. 실제 고깃집 ·
  정육점 · 주방 · 덕트 · 쇼케이스 · 사장님 · 작업현장이 찍혀야 합니다.
  **사람과 사업장 비중을 높이세요.**
- ⚠️ 바탕 사진(`hero-wide` · `final`)은 **아주 납작한 띠**로 잘립니다.
  16:9 로 만들면 가운데 30% 만 남습니다. 처음부터 납작하게 만들고,
  **볼 것을 오른쪽에** 두세요 — 왼쪽 60% 는 제목 글자가 덮습니다.
- ⚠️ `alt` 는 **사진에 무엇이 찍혀 있는지**를 적습니다. "고깃집 사진" 은
  눈이 불편한 손님에게 아무것도 알려 주지 않습니다.
- 형식은 `.jpg` (사진) 또는 `.webp`. 긴 변 1600px 이면 충분합니다.

## 자리 목록

| key | 넣을 파일 | 권장 크기 | 무엇이 찍혀야 하는가 |
|---|---|---|---|
| `hero-wide` | `/img/hero.jpg` | 1600×620 (아주 납작함) | (글자가 얹히는 바탕. 무엇이 찍혔는지 alt 를 따로 적으세요) |
| `hero` | `/img/hero-home.jpg` | 1200×840 | 정육 작업대 앞에 선 사장님. 뒤로 갈고리·쇼케이스·냉장고가 보입니다 |
| `sit-start` | `/img/sit-start.jpg` | 1440×900 | 아직 아무것도 들어오지 않은 빈 점포. 사다리와 도면이 놓여 있습니다 |
| `sit-run` | `/img/sit-run.jpg` | 1440×900 | 카운터에서 POS 와 장부를 보고 있는 사장님. 뒤로 쇼케이스가 있습니다 |
| `sit-solve` | `/img/sit-solve.jpg` | 1440×900 | 문이 열린 채 물이 새는 냉장고와 공구 가방을 든 기사 |
| `sit-grow` | `/img/sit-grow.jpg` | 1440×900 | 영업 중인 1호점 옆에 비계가 세워진 2호점 공사 현장 |
| `sit-exit` | `/img/sit-exit.jpg` | 1440×900 | 셔터가 반쯤 내려온 가게 앞에 선 사장님과 정리해 둔 상자들 |
| `cat-meat` | `/img/cat-meat.jpg` | 1440×900 | 냉장 탑차와 내려놓은 육류 상자들, 손수레 |
| `cat-space` | `/img/cat-space.jpg` | 1440×900 | 천장 덕트와 후드가 내려온 고깃집 홀. 타일 벽과 로스터 테이블 |
| `cat-equip` | `/img/cat-equip.jpg` | 1440×900 | 작업대 위의 육절기 · 진공기 · 저울 |
| `cat-ops` | `/img/cat-ops.jpg` | 1440×900 | 카운터의 POS 와 카드 단말기, 키오스크, 천장의 CCTV |
| `cat-grow` | `/img/cat-grow.jpg` | 1440×900 | 오르는 막대그래프와 손전화 화면 |
| `cat-pro` | `/img/cat-pro.jpg` | 1440×900 | 항목을 체크한 점검표와 위생모 · 위생장갑 |
| `worry` | `/img/worry.jpg` | 900×1200 (세로) | 카운터에 서서 쌓인 고지서와 계산기를 앞에 두고 있는 사장님 |
| `partner` | `/img/partner.jpg` | 960×1200 (세로) | 주방 후드 아래에서 작업을 설명하는 기사와 공구 가방 |
| `final` | `/img/final.jpg` | 1600×700 (아주 납작함) | 후드가 내려온 저녁 고깃집 홀 |
| `post-cost-0` | `/img/post-cost-0.jpg` | 1440×780 | 계산기와 장부, 동전 |
| `post-cost-1` | `/img/post-cost-1.jpg` | 1440×780 | 저울과 고기 상자, 나란히 놓인 견적서 세 장 |
| `post-run-0` | `/img/post-run-0.jpg` | 1440×780 | 메뉴판과 매출 막대그래프, 시계 |
| `post-run-1` | `/img/post-run-1.jpg` | 1440×780 | 배달앱 화면과 포장 용기, 정산 내역서 |
| `post-fac-0` | `/img/post-fac-0.jpg` | 1440×780 | 후드와 온도계, 공구 가방 |
| `post-fac-1` | `/img/post-fac-1.jpg` | 1440×780 | 냉장고와 육절기, 점검 기록지 |
| `post-law-0` | `/img/post-law-0.jpg` | 1440×780 | 서류 두 장과 도장 |
| `post-law-1` | `/img/post-law-1.jpg` | 1440×780 | 근로계약서와 마주 선 두 사람, 달력 |
| `post-start-0` | `/img/post-start-0.jpg` | 1440×780 | 점포 도면과 자, 연필, 열쇠 |
| `post-start-1` | `/img/post-start-1.jpg` | 1440×780 | 빈 점포와 사다리, 예산표 |
| `post-grow-0` | `/img/post-grow-0.jpg` | 1440×780 | 매출이 오르는 화면과 나란한 두 매장 |
| `post-grow-1` | `/img/post-grow-1.jpg` | 1440×780 | 셔터 내린 가게와 정리한 상자, 점검 목록 |
| `hero-start` | `/img/hero-start.jpg` | 1200×840 | 아직 아무것도 들어오지 않은 빈 점포. 사다리와 도면, 쌓아 둔 상자가 보입니다 |
| `hero-partner` | `/img/hero-partner.jpg` | 1200×840 | 공구 가방을 옆에 두고 주방에 선 시공 기사. 후드와 냉장고가 보입니다 |
| `hero-my` | `/img/hero-my.jpg` | 1200×840 | 체크 표시가 붙은 줄들이 적힌 클립보드와, 뒤에 쌓아 둔 종이 |
| `hero-lab` | `/img/hero-lab.jpg` | 1200×840 | 펼쳐 놓은 공책과 쌓아 둔 자료, 연필이 놓인 책상 |
| `hero-tools` | `/img/hero-tools.jpg` | 1200×840 | 계산기와 숫자를 적어 둔 종이 두 장이 놓인 책상 |
| `hero-yield` | `/img/hero-yield.jpg` | 1200×840 | 저울에 올린 고기와, 손질 전후로 크기가 달라진 두 덩이 |
| `hero-bep` | `/img/hero-bep.jpg` | 1200×840 | 본전 선을 넘어서며 높아지는 막대 그래프와 동전 더미 |
| `hero-cost` | `/img/hero-cost.jpg` | 1200×840 | 금액을 적은 줄과 아직 비어 있는 줄이 섞인 항목 목록 |
| `hero-check` | `/img/hero-check.jpg` | 1200×840 | 점수 고리와 항목별 점검 카드 |
| `hero-partners` | `/img/hero-partners.jpg` | 1200×840 | 여러 업체 중에서 세 곳만 골라 앞으로 내놓은 모습 |
| `hero-quotes` | `/img/hero-quotes.jpg` | 1200×840 | 나란히 놓인 견적서 세 장과 돋보기 |
| `hero-about` | `/img/hero-about.jpg` | 1200×840 | 적어 주신 문제에서 사람을 거쳐 업체로 이어지는 흐름 |
| `band-meat` | `/img/band-meat.jpg` | 600×900 (세로) | 붉은 띠 왼쪽에 깔 고기 클로즈업. **아직 photos.js 에 없습니다 — 파일을 넣고 한 줄 적으면 그 자리가 살아납니다** |

## 바꾼 뒤 확인

```bash
node build-pages.js
node check.js          # alt 가 비었는지 · 파일이 실제로 열리는지 봅니다
node tools/shot.js "/|1440|home"   # 눈으로 보세요
```

⚠️ `check.js` 의 흉내 서버 MIME 표에 **새 확장자를 빠뜨리면** 사진이
`application/octet-stream` 으로 나가서 브라우저가 그리지 않고 alt 글자만
보여 줍니다. 화면은 멀쩡해 보이고 에러도 안 납니다 — `.webp` 를 쓰실
거면 `check.js` 의 MIME 표에 한 줄 넣으세요.
