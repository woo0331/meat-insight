/* ════════════════════════════════════════════════════════════════════
   사진 자리

   ⚠️ **지금 한 장도 없습니다.** 예전의 그림 41장은 전부 고깃집 · 정육점
   장면이라 2026-09-29 리뉴얼 때 걷어냈습니다 (§53). 모든 업종의
   사장님이 손님인 플랫폼에 한 업종 그림을 깔아 두면, 나머지 어느
   업종에게도 "여긴 내 자리가 아니네" 로 읽힙니다.

   ⚠️ **의미 없는 AI 이미지를 남발하지 마세요** (§54). 여기 들어갈 것은
   **업체가 직접 올린 포트폴리오**와 **사장님이 올린 매물 사진**입니다.
   그 두 가지가 이 플랫폼의 진짜 그림이고, 그때까지는 비워 둡니다.

   ⚠️ **"이미지 준비 중" 같은 자리표시자를 찍지 마세요.** 빈 회색 칸이
   보이면 그 순간 미완성 사이트로 읽힙니다. 사진이 없으면 화면이
   `hasPhoto()` 를 보고 **글이 주인공인 짜임새**로 갑니다.
   ════════════════════════════════════════════════════════════════════ */

/* ── 자리 목록 ───────────────────────────────────────────────────
   키를 적어 두는 이유는, 사진이 생겼을 때 **경로만 바꾸면 되도록**
   하기 위해서입니다. 값이 없으면 화면이 알아서 글 짜임새로 갑니다.

   ⚠️⚠️ **2026-10-04 에 히어로가 화면 너비를 쓰는 두 판이 됐습니다.**
   아래는 **열한 폭에서 실제로 재 본 액자 크기**입니다 (2560 ~ 360px).
   object-fit:cover 라 액자보다 넓으면 좌우가, 좁으면 위아래가 잘립니다.

   | 화면 폭 | 액자 | 비율 |
   |---|---|---|
   | 2560 | **1324 × 520** ← 제일 큼 | 2.55 |
   | 1920 | 1004 × 520 | 1.93 |
   | 1440 | 764 × 520 | 1.47 |
   | 1280 | 684 × 520 | 1.32 |
   | 1024 | 556 × 480 | 1.16 |
   | 980 (세로로 쌓임) | 980 × 368 | 2.66 |
   | 390 | 390 × 331 | 1.18 |
   | 360 | 360 × 331 | **1.09** ← 제일 좁음 |

   ⚠️⚠️ **그래서 최소 크기가 1400×560 입니다** — 제일 큰 액자(1324×520)에
   여유를 조금 둔 값입니다. 전에 적혀 있던 `1400×900` 은 **옛 히어로**
   (가운데 기둥 안의 620px 카드) 시절 값이라 지금 구조와 안 맞습니다.
   ⚠️ 비율은 **1.09 ~ 2.66 사이를 다 쓰므로** 원본이 그 안이면 자르지
   않고 그대로 둡니다. **가로로 넓은 쪽(2:1 안팎)이 낫습니다** — 넓으면
   좁은 화면에서 좌우만 잘리고(아래 object-position 으로 고릅니다),
   세로로 길면 넓은 화면에서 위아래가 잘려 천장과 바닥만 남습니다.

   | 키 | 어디 | 넣을 원본 |
   |---|---|---|
   | hero-start | 히어로 **왼쪽 판** | 1900×850 안팎 (가로로 넓게) |
   | hero-close | 히어로 **오른쪽 판** | 〃 |

   ⚠️⚠️ **가운데가 대각선으로 잘립니다.** 액자가 판보다 44px 넓고
   그만큼 비스듬히 깎여서 **안쪽(가운데) 모서리가 사라집니다** —
   주인공을 거기 두지 마세요. 바깥쪽(화면 가장자리)이 가장 잘 보입니다.
   ⚠️ 글과 단추가 **판의 가운데 높이**에 앉습니다. 사람 얼굴이나
   간판을 거기 두면 글에 덮입니다.
   ⚠️ 그 위에 막이 덮입니다 — 왼쪽은 짙은 남색, 오른쪽은 밝은 샌드.
   왼쪽 사진은 **어두워지고** 오른쪽 사진은 **옅어집니다.**
   ⚠️ **글자가 박힌 사진을 쓰지 마세요.** 확대도 번역도 안 됩니다.
   ⚠️ **업종이 드러나는 사진을 쓰지 마세요.** 고깃집 사진을 깔면
   미용실 사장님에게 "여긴 내 자리가 아니네" 로 읽힙니다.
   ⚠️ **폐업 쪽을 처연하게 찍지 마세요.** 불 꺼진 가게 · 고개 숙인
   사람은 안 됩니다 — 실패가 아니라 **정리와 다음 단계**입니다.
   ⚠️ **저작권.** 검색해서 나온 사진을 그냥 쓰면 안 됩니다. 직접 찍은
   것 · 상업적 이용이 되는 무료 사진 · 유료 스톡 셋 중 하나여야 하고,
   알아볼 수 있는 얼굴이 나오면 **초상권 동의**를 따로 받으세요.

   넣는 법 — 파일을 `img/` 에 두고 아래에 한 줄씩 적습니다.
     "hero-start": { src:"/img/hero-start.jpg", alt:"…" }
   ⚠️ `alt` 를 비우지 마세요. 읽어 주는 프로그램과 검색엔진이 봅니다. */
/* ── 자리의 규격 ─────────────────────────────────────────────────
   ⚠️ **여기가 한 곳입니다.** `tools/check-photos.js` 와 `build-pages.js`
   가 이 목록을 읽습니다 — 자리를 늘리거나 크기를 바꾸면 여기만
   고치세요. 화면과 검사가 따로 놀지 않게 하려는 것입니다.

   `min`   넣을 그림의 **최소** 가로×세로 (레티나 2배를 감안한 값)
   `ratio` 가로÷세로가 이 사이여야 합니다. 벗어나면 많이 잘립니다
   `maxKB` 이 용량을 넘으면 첫 화면이 느려집니다 */
/* ⚠️⚠️ **화면에 실제로 그려지는 자리는 넷입니다** (2026-10-24 재측정).
   ⚠️ 전에 여기 "일곱" 이라고 적혀 있었습니다 — 구간이 내려갈 때마다
   조용히 어긋나니 **메인을 고치실 때마다 브라우저로 다시 재세요.**
   (자리 30 · 파일 12 · 그려지는 것 **4**) —

     hero-startup · hero-ops · hero-closure
                  전문관 세 화면 머리 + **메인 진입 카드 셋**
     kind-pass    메인 ④ 매장 양도양수 배너

   ⚠️⚠️ **파일이 있는데 안 나오는 것이 여덟입니다** — hero-start ·
   hero-close(사장님이 주신 원본 두 장) · kind-take · kind-asset ·
   svc-interior · svc-equip · svc-it · svc-clean. **지운 것이 아니라
   쓰는 구간이 내려간 것**이고, 되살리면 코드를 한 줄도 안 고치고
   붙습니다.

   ⚠⚠ **비어 있는 자리 열여덟 가운데 "넣으면 나오는" 것은
   category-* 여섯뿐입니다** — 나머지 열둘은 코드가 **아무 데서도
   안 부릅니다**(cta-consult · feat-* 셋 · side-* 둘 · flow-* 둘 ·
   svc-store · svc-admin · svc-marketing · svc-demolish). 전에 여기
   "사야 하는 것은 cta-consult 한 장" 이라고 적어 두었는데 **그
   줄이 틀렸습니다** — MainLast() 가 내려가면서 그 자리도 같이
   죽었습니다.
   ⚠️ category-* 여섯도 지금은 `/g/:stage` 여섯 화면의 **앞뒤 카드
   한두 장**에만 나옵니다 (StageNear). 단계 열이 메인에 있던 시절의
   자리라 **값을 재서 정하세요** — 돈을 쓰기 전에 그 화면을 찍어
   보시는 쪽이 낫습니다.

   ⚠️⚠️ **"(지금 안 나옴)" 이 붙은 자리에 사진을 사지 마세요.** 파일을
   넣어도 화면에 안 나옵니다 — 그 구간이 메인에서 내려왔을 뿐이고
   함수는 그대로라 되살리면 바로 붙습니다.
   ⚠️ `tools/check-photos.js` 는 **규격만** 봅니다 (크기 · 비율 · 용량 ·
   alt). "그 자리가 화면에 나오는가" 는 브라우저로 재야 알고, 구간이
   내려갈 때마다 조용히 어긋납니다 — 이 저장소가 feat-* 셋으로 한 번,
   kind-* 둘과 svc-* 넷으로 또 한 번 겪은 자리입니다. */
window.WOW_PHOTO_SLOTS = [
  /* ── 히어로 오른쪽 비주얼 (2026-10-01 지시서 §9) ──────────────
     ⚠️⚠️ **2026-10-01 에 자리를 다시 짰습니다.** 전에는 랜딩 기준
     열넷이었는데 랜딩을 없애서 그중 아홉이 갈 데가 없어졌습니다.
     사진이 0장이라 파일을 옮길 일은 없었습니다 — 이름만 바뀌었습니다.

     ⚠️ 오른쪽 기둥에 세로로 겹쳐 앉습니다. 위가 크고 아래가 작습니다.
     ⚠️ 작은 카드 셋이 사진 위에 겹치므로 **오른쪽 아래가 가려집니다** —
     주인공을 거기 두지 마세요. */
  /* ⚠️ anchor 가 바깥쪽인 것은 **가운데가 대각선으로 깎이기** 때문입니다
     (2026-10-04). 가운데를 남기면 주인공이 잘려 나갑니다. */
  /* ⚠️⚠️ **2026-10-16 §3-2 — 메인 브랜드 히어로의 바탕이 됐습니다**
     (전에는 가로 2분할 왼쪽 판). 화면 **너비를 통째로** 쓰므로 sizes 가
     100vw 입니다 — 44vw 로 두면 브라우저가 작은 판을 받아 **뿌옇게**
     뜹니다 (에러도 안 나고 검사도 통과합니다).
     ⚠️ 재 본 값 — 1440×600 · 1280×600 · 1024×600 · 900×420 ·
     768×406 · 390×401 · 360×509. 좁은 폭에서는 세로로 길어져 좌우가
     많이 잘립니다 — 위에 짙은 막이 덮여 바탕 질감으로 쓰는 자리라
     그대로 둡니다. 사진을 바꾸시면 **찍어서** 보세요. */
  /* ⚠️⚠️ **2026-10-17 §4 로 메인에서 안 나옵니다** — 지시서가 "기존의
     큰 브랜드 히어로 배너는 삭제한다" 고 적었습니다. 파일(사장님이
     주신 것)과 이 줄은 그대로 두었고, HomeHero() 를 되살리면 코드를
     한 줄도 안 고치고 다시 붙습니다. hero-close 도 같습니다. */
  { key:"hero-start", sizes:"100vw", where:"메인 01 히어로 바탕 (2026-11-19 개편 — 다시 나옵니다)",
    min:[1400,560], ratio:[1.3,2.6], maxKB:300, anchor:"center",
    note:"실제 한국에서 운영될 법한 상업공간 · 자연광 · 고해상도. ⚠️ 위에 짙은 남색 막이 덮이고 글이 판 가운데 높이에 앉습니다 — 주인공을 거기 두지 마세요. ⚠️ 사진 안에 글자 · 상호 · 로고가 보이면 안 됩니다" },
  /* ⚠️⚠️ **지금 화면에 안 나옵니다** (2026-10-16 §3-2 로 히어로가
     브랜드 히어로 하나가 됐습니다). 파일은 그대로 있고 두 판
     (MainHero)을 되살리면 바로 붙습니다 — **없앤 것이 아닙니다.** */
  { key:"hero-close", sizes:"(max-width:900px) 52vw, (max-width:1100px) 48vw, 44vw", where:"(지금 안 나옴) 옛 히어로 오른쪽 판",
    min:[1400,560], ratio:[1.3,2.6], maxKB:300, anchor:"center",
    note:"같은 공간이 정리되는 듯한 장면이면 가장 좋습니다. 밝은 샌드 막이 덮입니다. ⚠️ 실패한 장면이 아니라 다음을 준비하는 장면입니다 — 불 꺼진 가게 · 고개 숙인 사람 금지" },

  /* ── 전문관 머리 사진 셋 (2026-10-10 이미지 지시서 §3) ───────────
     `/startup` · `/closure` · `/operation` 의 화면 머리 오른쪽에
     붙습니다. 1024px 위에서는 **오른쪽 42% 판**이고 그 아래에서는
     글 밑의 **띠**가 됩니다 — 어느 폭에서도 글이 사진 위에 앉지
     않습니다.
     ⚠️⚠️ **사진 안에 글자 · 단추를 넣지 마세요** (§6 · §26). 제목 ·
     설명 · 단추는 전부 HTML 입니다 — 사진에 박아 두면 폰에서 줄어들어
     안 읽히고, 그려진 단추는 눌러도 아무 일이 안 납니다 (§30-7).
     ⚠️ 왼쪽 22% 가 **부드럽게 사라집니다**(mask) — 주인공을 왼쪽 끝에
     두지 마세요. */
  /* ⚠️ 2026-10-16 §3-3 — **메인 진입 카드**에도 같이 나옵니다.
     재 본 값 — 전문관 머리 605×399(1440) · 진입 카드 411×257.
     둘 중 큰 쪽을 덮는 sizes 입니다. */
  { key:"hero-startup", sizes:"(max-width:1023px) 100vw, 42vw",
    where:"창업 전문관(/startup) 머리 · 메인 진입 카드 01",
    min:[840,740], ratio:[0.85,1.5], maxKB:200, anchor:"right",
    note:"새로 여는 밝은 상업공간 · 자연광. ⚠️ 상호 · 간판 · 로고가 읽히면 안 됩니다" },
  { key:"hero-closure", sizes:"(max-width:1023px) 100vw, 42vw",
    where:"폐업 · 정리 전문관(/closure) 머리 · 메인 진입 카드 03",
    min:[840,740], ratio:[0.85,1.5], maxKB:200, anchor:"right",
    note:"정리 중인 매장 — 의자를 올리고 박스를 싸는 장면. ⚠️⚠️ 불 꺼진 가게 · 고개 숙인 사람 · 폐허 금지. 실패가 아니라 다음을 준비하는 장면입니다" },
  { key:"hero-ops", sizes:"(max-width:1023px) 100vw, 42vw",
    where:"운영 서비스관(/operation) 머리 · 메인 진입 카드 02",
    min:[840,740], ratio:[0.85,1.5], maxKB:200, anchor:"right",
    note:"문을 연 매장에서 POS · 태블릿으로 일하는 장면. ⚠️ 실제 POS 상표 · 서비스 로고가 읽히면 안 됩니다" },

  /* ── 사업 단계 여섯 카드 (2026-10-04 §14 · §18 · §19) ──────────
     ⚠️⚠️ **지금 여섯 자리 다 비어 있습니다.** 급하게 저품질 스톡을
     끼워 넣지 않습니다 (§18) — 자리와 구조만 만들어 두었고, 사진이
     들어오면 **화면은 한 줄도 안 고칩니다.**
     ⚠️ 사진이 0장이면 카드는 **글이 주인공인 짜임새**로 갑니다 (아래
     띠가 아예 안 그려집니다). "이미지 준비 중" 을 찍지 않습니다.
     ⚠️ 카드 아래 40~50% 에 들어가고 위로 갈수록 흐려집니다 (§14) —
     글자가 사진 위에 올라앉지 않습니다.
     ⚠️ 원본 이름은 지시서 §19 대로 `category-*.jpg` 입니다.

     ⚠️⚠️ **2026-10-06 — 시안에서 잘라 넣었던 임시 여섯 장을 뺐습니다.**
     두 가지가 걸렸습니다. ① **출처입니다** — 시안에 박혀 있던 사진은
     직접 찍은 것도 · 상업적 이용이 되는 무료 사진도 · 유료 스톡도
     아닙니다. 영업하는 사이트에 올려 두면 저작권이 그대로 남습니다.
     ② **해상도입니다** — 226×148 이었고 이 자리의 최소는 900×560
     입니다 (좁은 폭에서 카드가 390px 까지 넓어집니다). 검사를
     통과시키려고 `min` 을 내리지 않았습니다 — 그 순간 이 자리의 품질
     기준이 영영 사라집니다. 라이선스가 있는 원본을 `img/raw/` 에
     `category-*.jpg` 로 넣고 `node tools/fit-photos.js --write` 를
     돌리면 **화면은 한 줄도 안 고치고** 띠가 돌아옵니다. */
  { key:"category-startup", sizes:"(max-width:900px) 92vw, (max-width:1100px) 44vw, 32vw", where:"단계 카드 01 · 창업 준비",
    min:[900,560], ratio:[1.2,1.9], maxKB:160, anchor:"center",
    note:"사업계획서 · 노트 · 펜 · 노트북 · 밝은 상업공간. ⚠️ 커피컵처럼 한 업종이 떠오르는 사진에 기대지 마세요 — '준비한다' 는 느낌이 먼저입니다" },
  { key:"category-location", sizes:"(max-width:900px) 92vw, (max-width:1100px) 44vw, 32vw", where:"단계 카드 02 · 상가 · 입지",
    min:[900,560], ratio:[1.2,1.9], maxKB:160, anchor:"center",
    note:"한국의 깔끔한 상업지역 · 상가 외관. ⚠️ 브랜드 로고 · 간판 글자가 보이면 안 되고, 해외 거리 느낌도 피합니다" },
  { key:"category-build", sizes:"(max-width:900px) 92vw, (max-width:1100px) 44vw, 32vw", where:"단계 카드 03 · 매장 만들기",
    min:[900,560], ratio:[1.2,1.9], maxKB:160, anchor:"center",
    note:"마감 · 조명 설치 · 가구 배치. ⚠️ 거친 건설현장이 아니라 **매장이 완성되어 가는 모습**입니다" },
  { key:"category-operation", sizes:"(max-width:900px) 92vw, (max-width:1100px) 44vw, 32vw", where:"단계 카드 04 · 매장 운영",
    min:[900,560], ratio:[1.2,1.9], maxKB:160, anchor:"center",
    note:"POS · 매출 관리 · 주문 관리. ⚠️ 실제 서비스 상표나 POS 브랜드 로고가 보이면 안 됩니다" },
  { key:"category-transfer", sizes:"(max-width:900px) 92vw, (max-width:1100px) 44vw, 32vw", where:"단계 카드 05 · 매장 양도 · 양수",
    min:[900,560], ratio:[1.2,1.9], maxKB:160, anchor:"center",
    note:"계약서 · 열쇠 · 깔끔한 상업공간. ⚠️ 악수 스톡사진 느낌은 피합니다 — 이 플랫폼의 핵심 차별화 자리라 고급스럽고 신뢰감 있게" },
  { key:"category-closing", sizes:"(max-width:900px) 92vw, (max-width:1100px) 44vw, 32vw", where:"단계 카드 06 · 폐업 · 정리",
    min:[900,560], ratio:[1.2,1.9], maxKB:160, anchor:"center",
    note:"정리된 박스 · 집기 이동 · 전문 작업자의 정리. ⚠️⚠️ 폐허 · 쓰레기 더미 · 불 꺼진 매장 · 실패한 느낌 **절대 금지** — 폐업은 실패가 아니라 안전한 정리입니다" },

  /* ── START / CLOSE 큰 카드 (§16) ─────────────────────────────
     ⚠️ 카드 윗머리에 띠로 들어갑니다 (카드의 30~40%). 가로로 넓습니다.
     ⚠️ **짙은 막을 씌우지 않습니다** — 사진이 밝아야 합니다. */
  { key:"side-start", sizes:"(max-width:900px) 28vw, 18vw", where:"(지금 안 나옴) START 카드 머리 · 새로 오픈하는 매장",
    min:[1200,530], ratio:[2.0,2.6], maxKB:180,
    note:"새롭게 오픈하는 밝은 매장. 가로로 길게 잘립니다" },
  { key:"side-close", sizes:"(max-width:900px) 28vw, 18vw", where:"(지금 안 나옴) CLOSE 카드 머리 · 깔끔하게 정리하는 매장",
    min:[1200,530], ratio:[2.0,2.6], maxKB:180,
    note:"깔끔하게 정리하는 매장. 어수선하거나 처연하면 안 됩니다" },

  /* ── 창업 ↔ 폐업 연결 구간 (§23) ──────────────────────────────
     ⚠️ 주황 카드와 초록 카드 안에 각각 한 장씩. 5:3 으로 잘립니다. */
  { key:"flow-close", sizes:"(max-width:860px) 82vw, 30vw", where:"(지금 안 나옴) 연결 · 정리하는 사장님 쪽", min:[900,540],
    ratio:[1.5,1.9], maxKB:180,
    note:"정리 중인 매장 · 시설. 차분하되 어둡지 않게" },
  { key:"flow-start", sizes:"(max-width:860px) 82vw, 30vw", where:"(지금 안 나옴) 연결 · 이어받는 사장님 쪽", min:[900,540],
    ratio:[1.5,1.9], maxKB:180,
    note:"이어받아 새로 여는 밝은 매장 내부" },

  /* ── 큰 카드 셋 (2026-10-03 리뉴얼 지시서 §11) ──────────────────
     ⚠️ 셋이 **서로 다른 사진**이어야 합니다. 같은 장면을 세 번 쓰면
     카드가 셋이 아니라 하나로 읽힙니다. */
  { key:"feat-franchise", sizes:"(max-width:900px) 92vw, 36vw", where:"(지금 안 나옴) 큰 카드 · 프랜차이즈", min:[900,620],
    ratio:[1.2,1.6], maxKB:200, note:"완성된 상업 매장 외관 또는 내부" },
  { key:"feat-store", sizes:"(max-width:900px) 92vw, 36vw", where:"(지금 안 나옴) 큰 카드 · 점포 · 상가", min:[900,620],
    ratio:[1.2,1.6], maxKB:200, note:"상가 · 점포 Exterior. 임대 안내가 붙은 빈 점포도 좋습니다" },
  { key:"feat-interior", sizes:"(max-width:900px) 92vw, 36vw", where:"(지금 안 나옴) 큰 카드 · 인테리어", min:[900,620],
    ratio:[1.2,1.6], maxKB:200, note:"상업공간 공사 중 또는 완성된 공간" },

  /* ── 주요 서비스 여덟 (지시서 §13 "실사 Thumbnail") ─────────────
     ⚠️⚠️ **업종이 드러나는 장면을 쓰지 마세요.** 여기 들어가는 것은
     업종이 아니라 **서비스**입니다 — 주방설비 사진이 고깃집으로
     읽히면 미용실 사장님에게 "여긴 내 자리가 아니네" 가 됩니다.
     장비 · 공구 · 도면처럼 **일 자체**가 보이는 쪽이 안전합니다.
     ⚠️⚠️ **원판은 정사각형입니다 — 76 · 92 · 62px** (`.ia-t`). 가로로
     긴 사진을 넣으면 `object-fit:cover` 가 **좌우를 잘라** 주인공이
     사라집니다. 그래서 비율은 **1:1 언저리**이고, 최소 크기는 제일
     큰 원판(92px)의 2.6배인 **240px** 입니다 (92×2 = 184 · 폰의
     62×3 = 186 이 실제 최대입니다) — 2026-10-10 에 재서
     고쳤습니다 (전에는 640×420 · 1.3~1.7 로 **가로 사진 규격**이라
     넣는 족족 좌우가 잘렸을 자리입니다).
     ⚠️ 92px 에서 무엇인지 읽히는지 **반드시 줄여서 보세요.** 물건
     하나가 크게 들어간 쪽이 읽히고, 넓은 풍경은 뭉갭니다.
     ⚠️ 0장이면 분류 컬러 아이콘이 그 자리를 지킵니다 (절대 규칙 2) —
     자리마다 따로라 **여덟 중 몇 장만** 넣으셔도 됩니다. */
  /* ⚠️ 2026-10-08 §8 — 메인 서비스 여덟이 바뀌면서 두 자리가
     늘었습니다. 자리를 늘리는 것은 **여기 한 곳**입니다. */
  /* ⚠️⚠️ **자리 이름은 분류 key 입니다** — `svc-<분류 key>` 이고
     `js/pages/home-retired.js` 의 `MAIN_SVC8` 과 같은 차례입니다. 한 글자
     틀리면 그 사진만 **조용히 안 나옵니다** (빌드의 checkPhotos 가
     막습니다).
     ⚠️ 한 번 상품 id 로 바꿨다가 시안을 받고 되돌렸습니다 — 메인 03 은
     상품이 아니라 **서비스 분류 여덟**입니다 (지시서 PART 5 가 "상품은
     서비스 카테고리와 다르다" 고 적었습니다).
     ⚠️ 업종이 드러나는 사진은 안 됩니다 — 여기 들어가는 것은 업종이
     아니라 **서비스**입니다 (주방설비 사진이 고깃집으로 읽히면 미용실
     사장님에게 "여긴 내 자리가 아니네" 가 됩니다). */
  { key:"svc-store", sizes:"92px",     where:"(지금 안 나옴) 서비스 · 상가 · 점포",     min:[240,240], ratio:[0.95,1.08], maxKB:40, note:"빈 상가 · 상권 거리. ⚠️ 상호 · 간판이 읽히면 안 됩니다" },
  /* ⚠️ 2026-10-16 §3-7 — 배너 둘의 왼쪽 네모입니다 (재 본 값 104px ·
     폰 76px). 나머지 svc-* 는 지금 화면에 안 나옵니다 — 분류 여덟
     구간(MainServices)을 되살리면 바로 붙습니다. */
  { key:"svc-interior", sizes:"104px", where:"창업 사진형 핵심 서비스(인테리어 · 설계) (2026-11-23)",  min:[240,240], ratio:[0.95,1.08], maxKB:40, note:"시공 중인 상업공간 · 도면" },
  { key:"svc-equip", sizes:"92px",     where:"창업 핵심 서비스(주방 · 설비) · 폐업 핵심 서비스(중고 집기 매각) (2026-11-23)",     min:[240,240], ratio:[0.95,1.08], maxKB:40, note:"업소용 장비. ⚠️ 한 업종으로 읽히지 않게" },
  { key:"svc-it", sizes:"104px",       where:"(지금 안 나옴) 서비스 · POS · CCTV · 매장시스템 — CCTV 사진이라 POS 카드에서 뺌(2026-11-23)",  min:[240,240], ratio:[0.95,1.08], maxKB:40, note:"POS · 키오스크 · CCTV. ⚠️ 브랜드가 보이면 안 됩니다" },
  { key:"svc-admin", sizes:"92px",     where:"(지금 안 나옴) 서비스 · 행정 · 전문가",    min:[240,240], ratio:[0.95,1.08], maxKB:40, note:"서류 · 상담 책상. ⚠️ 실제 서류 글자가 읽히면 안 됩니다" },
  { key:"svc-marketing", sizes:"92px", where:"(지금 안 나옴) 서비스 · 마케팅 · 디자인",  min:[240,240], ratio:[0.95,1.08], maxKB:40, note:"디자인 작업 · 촬영" },
  { key:"svc-demolish", sizes:"92px",  where:"(지금 안 나옴) 서비스 · 철거",            min:[240,240], ratio:[0.95,1.08], maxKB:40, note:"철거 · 원상복구 현장" },
  { key:"svc-clean", sizes:"92px",     where:"(지금 안 나옴) 서비스 · 청소 · 방역 — 운영 절차와 장면이 안 맞아 뺌(2026-11-23)",      min:[240,240], ratio:[0.95,1.08], maxKB:40, note:"청소 · 방역 장비" },

  /* ── 매장 · 시설 · 장비 세 카드 (2026-10-11 사장님 지시 3 · 4 · 5) ──
     사장님 지시 — "각 카드에는 실제 상업공간 및 장비를 촬영한 듯한
     고품질 이미지를 적용합니다. 기존의 작은 아이콘 중심 디자인에서
     벗어나 **이미지가 중심이 되도록** 제작합니다."

     ⚠️⚠️ **셋의 규격이 완전히 같습니다** (지시 5 — "전체 이미지의
     색감, 크기, 비율을 통일"). 하나만 비율이 다르면 나란히 선 세
     카드의 액자 높이가 어긋나 **셋이 한 벌로 안 읽힙니다** — 그래서
     min · ratio · maxKB · sizes 를 한 글자도 다르게 두지 마세요.

     ⚠️⚠️ **시안에 박혀 있던 사진은 쓸 수 없습니다** — 사장님 지시 8 이
     "외부 참고 이미지를 무단 사용하지 말고 **상업적 사용 권한이 확보된
     이미지만** 적용합니다" 라고 적었습니다. 2026-10-06 에 단계 카드
     여섯의 임시 그림을 출처 · 해상도 때문에 걷어낸 그 자리입니다.
     ⚠️ **검사를 통과시키려고 `min` 을 내리지 마세요** — 그 순간 이
     자리의 품질 기준이 영영 사라집니다.

     ⚠️ 0장이면 빈 회색 액자를 깔지 않습니다 — `.mk-k-ph-n` 이 브랜드
     면(남색 → 청록)에 큰 아이콘을 얹어 **그 자체로 완성된 면**으로
     섭니다 (절대 규칙 2). 파일을 `img/` 에 두고 아래 `WOW_PHOTOS` 에
     한 줄씩 적으면 **화면은 한 줄도 안 고치고** 시안의 액자가 됩니다.

     ⚠️⚠️ **재 본 액자입니다** (열한 폭 · 2026-10-11) —

       1440 · 1280 | 세 칸  | 385×288  ← PC 기본
       1024        | 세 칸  | 299×224
        900        | 두 칸  | 420×315 · 셋째는 가로로 누워 395×296
        768        | 두 칸  | 354×266 · 셋째 334×250
        600 ~ 520  | 한 칸  | **478×359** ← 제일 큼 (칸 폭을 480 으로 묶었습니다)
        390        | 한 칸  | 348×261
        360        | 한 칸  | 318×239

     제일 큰 액자가 478×359 이고 레티나 2배가 956×718 입니다 —
     **1120×840 은 거기에 여유를 둔 값**입니다 (사진은 넉넉한 쪽이
     낫고, 모자라면 뿌옇게 보입니다).
     ⚠️ 비율 범위를 좁게(1.25~1.45) 둔 것도 지시 5 때문입니다 —
     넓히면 셋의 잘리는 양이 서로 달라집니다.
     ⚠️ `sizes` 도 그 표에서 나온 값입니다 — 없으면 브라우저가 화면
     전체 폭으로 보고 제일 큰 판을 받습니다 (폰에서 제일 아픕니다).

     ⚠️⚠️ **2026-10-11 — 셋은 390px 원본을 키운 판입니다.**
     사장님이 주신 사진이 채팅을 거치며 390×660 으로 줄어 들어왔습니다.
     "사이즈에 맞게 편집해서 넣어라" 고 하셔서 규격(1120×840)에 맞춰
     만들었습니다 — 한 번에 2.9배 늘리지 않고 **1.4배씩 계단식으로**
     키운 뒤 **언샵 마스크**로 윤곽을 세웠습니다 (한 번에 늘린 것보다
     눈에 띄게 또렷합니다).
     ⚠️ 그래도 **없던 화소가 생기지는 않습니다.** 원본(1120×840 이상)이
     들어오면 `img/raw/kind-*.jpg` 에 넣고
     `node tools/fit-photos.js --write` 로 다시 만드세요 — 그때가 제
     품질입니다.
     ⚠️ `fit-photos` 는 작은 원본을 거절합니다(키운 것은 규격을 맞춘
     것이 아니라 뿌옇게 만든 것이라서요). 그래서 이 세 장은 그 도구를
     거치지 않고 만들었습니다 — 자리의 `min` 은 손대지 않았습니다. */
  { key:"kind-take", sizes:"(max-width:520px) 94vw, (max-width:600px) 480px, (max-width:900px) 47vw, (max-width:1280px) 31vw, 387px",
    where:"(지금 안 나옴) 2026-11-20 출처 미확인으로 메인에서 뺌 — 옛 자산 카드 01", min:[1120,840], ratio:[1.25,1.45], maxKB:140,
    note:"문 여는 상업공간 · 빈 점포 내부. ⚠️ 상호 · 간판 · 업종이 읽히면 안 됩니다" },
  /* ⚠️ 2026-10-16 §3-4 — **매장 양도양수 가로형 배너**로 옮겼습니다
     (자산 카드 셋은 메인에서 내려왔습니다). 재 본 값 — 536×401(1440) ·
     394×295(1024) · 858×643(900) · 348×261(390). */
  { key:"kind-pass", sizes:"(max-width:900px) 96vw, (max-width:1100px) 42vw, 40vw",
    where:"(지금 안 나옴) 2026-11-20 출처 미확인으로 메인 배너에서 뺌 — 지금은 자체 일러스트(main-pass 가 비어 있는 동안)", min:[1120,840], ratio:[1.25,1.45], maxKB:140,
    note:"정리하는 상업공간 · 넘기는 열쇠. ⚠️ 처연하면 안 됩니다 — 불 꺼진 가게 · 고개 숙인 사람 금지" },
  { key:"kind-asset", sizes:"(max-width:520px) 94vw, (max-width:600px) 480px, (max-width:900px) 47vw, (max-width:1280px) 31vw, 387px",
    where:"(지금 안 나옴) 자산 카드 03 · 시설 · 장비 거래", min:[1120,840], ratio:[1.25,1.45], maxKB:140,
    note:"업소용 시설 · 장비. ⚠️ 한 업종으로 읽히지 않게 (주방설비만 쓰면 고깃집으로 읽힙니다)" },

  /* 메인 06 견적 · 상담 구간의 오른쪽 사진 (2026-10-11 지시서 §8)
     ⚠️⚠️ **밝은 매장에서 상담하는 장면**이라야 합니다. 정리 · 철거
     현장을 넣으면 "어떤 서비스가 필요하신가요?" 라는 권유 자리가
     통째로 폐업으로 읽힙니다 — `hero-close` 를 넣어 보고 찍어서
     뺐습니다.
     ⚠️ 비어 있으면 **액자째 안 그립니다** (절대 규칙 2) — 글이 한
     칸을 다 쓰고, 파일을 넣으시면 코드를 한 줄도 안 고치고 붙습니다. */
  { key:"cta-consult", sizes:"(max-width:1024px) 92vw, 40vw",
    where:"(지금 안 나옴) 메인 06 · 견적 · 상담 신청 오른쪽", min:[1120,840], ratio:[1.25,1.45], maxKB:150,
    note:"밝은 매장 · 상담하는 장면. ⚠️ 한 업종이 드러나면 안 됩니다. 정리 · 철거 현장 금지" },
  /* ⚠️⚠️ 2026-11-21 Warm Premium 사진 중심 리디자인 — 대표님이 주신 insu_premium_assets.zip 다섯 장.
     README 그대로: 모두 AI 생성 연출 이미지이고 실제 고객 · 거래 · 매물 · 제휴업체 사진이 아닙니다 —
     그렇게 소개하지 마세요. 01~04 는 4분할에서 잘라 768×512 라 최소 크기에 못 미칩니다(temp:true).
     ⚠️ 03_transfer 를 매물 썸네일로 쓰지 마세요 (매물 목록은 실제 매물 사진만). */
  /* 2026-11-23 사진형 시안 카드 — 사진을 아직 못 구한 자리(완료 대기). 파일을 img/ 에 두고 WOW_PHOTOS 에
     한 줄 적으면 코드를 안 고치고 아이콘 판이 사진으로 바뀝니다. 시안 PNG 에서 잘라 쓰기에는 너무 작습니다
     (카드 사진 약 180×128 · 225×110 — 화면 칸 234×161 · 306×172 보다 작아 확대가 됩니다). */
  { key:"kp-st-svc-area", sizes:"(max-width:600px) 46vw, 310px",
    where:"/startup 핵심 서비스 '상권 · 입지 분석'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 상가 거리 · 점포 외관(간판 글자가 읽히지 않게) · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-st-svc-permit", sizes:"(max-width:600px) 46vw, 310px",
    where:"/startup 핵심 서비스 '인허가 · 행정'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 영업 신고 서류 · 도장이 놓인 책상(서류 글자가 읽히지 않게) · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-st-pro-check", sizes:"(max-width:600px) 46vw, 310px",
    where:"/startup 진행 절차 01 '조건 확인'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 지도 · 상권 자료를 펼쳐 놓고 입지를 검토하는 손 · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-st-pro-design", sizes:"(max-width:600px) 46vw, 310px",
    where:"/startup 진행 절차 02 '설계 · 견적'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 평면도 · 마감재 견본 위의 견적 작업(svc-interior 와 다른 구도) · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-op-svc-supply", sizes:"(max-width:600px) 46vw, 310px",
    where:"/operation 핵심 서비스 '식자재 · 납품'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 납품 상자 · 채소 · 원두 등 재료가 들어오는 장면 · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-op-svc-staff", sizes:"(max-width:600px) 46vw, 310px",
    where:"/operation 핵심 서비스 '인력 · 노무'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 직원 근무표 · 태블릿을 보는 직원(얼굴은 동의 받은 것만) · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-op-svc-pos", sizes:"(max-width:600px) 46vw, 310px",
    where:"/operation 핵심 서비스 'POS · 결제'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 계산대의 POS 단말 · 카드 결제기(브랜드 로고 안 보이게) · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-op-svc-repair", sizes:"(max-width:600px) 46vw, 310px",
    where:"/operation 핵심 서비스 '시설 · 수리'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 냉난방 · 냉장 설비를 점검하는 기사 · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-op-pro-pick", sizes:"(max-width:600px) 46vw, 310px",
    where:"/operation 진행 절차 01 '필요한 서비스 고르기'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 노트북 · 휴대폰으로 필요한 것을 고르는 사장님 · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-op-pro-check", sizes:"(max-width:600px) 46vw, 310px",
    where:"/operation 진행 절차 02 '매장 점검'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 매장 점검표 클립보드에 체크하는 손 · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-op-pro-link", sizes:"(max-width:600px) 46vw, 310px",
    where:"(쓰지 않음 · 2026-11-24 — 대표 지시로 kp-cl-pro-quote 사진을 씀) /operation 진행 절차 03 '업체 연결'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 업체 담당자와 상담하는 테이블 · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-op-pro-run", sizes:"(max-width:600px) 46vw, 310px",
    where:"/operation 진행 절차 04 '진행 · 관리'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 정리된 매장에서 작업이 끝난 뒤 확인하는 장면 · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-tr-svc-search", sizes:"(max-width:600px) 46vw, 310px",
    where:"/transfer 핵심 서비스 '매물 찾기' (2026-11-24 ZIP)", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"노트북으로 매물을 둘러보는 장면 · 실제 매물 사진 아님" },
  { key:"kp-tr-svc-sell", sizes:"(max-width:600px) 46vw, 310px",
    where:"/transfer 핵심 서비스 '내 매장 넘기기'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 매장 외관과 양도 안내(상호 · 전화번호가 읽히지 않게) · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-tr-svc-premium", sizes:"(max-width:600px) 46vw, 310px",
    where:"/transfer 핵심 서비스 '권리금 계산'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 계산기와 서류가 놓인 책상(금액 글자가 읽히지 않게) · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-tr-svc-contract", sizes:"(max-width:600px) 46vw, 310px",
    where:"/transfer 핵심 서비스 '계약 가이드'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 계약서 클립보드와 펜(계약 글자가 읽히지 않게) · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-tr-pro-search", sizes:"(max-width:600px) 46vw, 310px",
    where:"/transfer 진행 절차 '매장 탐색' (2026-11-24 대표가 준 사진) · 양도 '다음 사장님 찾기'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 노트북 지도로 매장을 찾아보는 장면 · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-tr-pro-visit", sizes:"(max-width:600px) 46vw, 310px",
    where:"/transfer 진행 절차 '현장 확인'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 영업 중인 매장 안을 둘러보며 확인하는 사람 · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-tr-pro-nego", sizes:"(max-width:600px) 46vw, 310px",
    where:"/transfer 진행 절차 '조건 협의' · 양도 '조건 정하기'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 테이블에서 조건을 이야기하는 두 사람(손 중심) · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-tr-pro-ready", sizes:"(max-width:600px) 46vw, 310px",
    where:"/transfer 진행 절차 '인수 준비' · 양도 '자료 준비 · 계약 · 인계'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 서류 봉투 · 파일을 정리하는 책상 · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-cl-svc-tax", sizes:"(max-width:600px) 46vw, 310px",
    where:"/closure 핵심 서비스 '폐업 세무'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 계산기 · 세무 서류를 보는 손(서류 글자가 읽히지 않게) · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-cl-pro-consult", sizes:"(max-width:600px) 46vw, 310px",
    where:"/closure 진행 절차 01 '상담 접수'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 노트북으로 상담 내용을 적는 장면 · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-cl-pro-quote", sizes:"(max-width:600px) 46vw, 310px",
    where:"/closure 진행 절차 02 '현장 확인 · 견적'", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"필요한 장면 — 현장에서 견적서 클립보드를 적는 손 · 권장 960×660(16:11) · 권리 확인된 사진만" },
  { key:"kp-op-pro-prior", sizes:"(max-width:600px) 46vw, 310px",
    where:"2026-11-25 디자인 개편 — 폐업 '아직 모르겠어요' · 기타 업종 · 가이드 카드", min:[640,440], ratio:[1.3,1.55], maxKB:120,
    note:"준비 목록 카드를 책상에 펼친 장면 (보내 주신 묶음 operations_process-prioritize) · 연출 사진" },
  { key:"kp-cl-ban-cost", sizes:"(max-width:900px) 100vw, 60vw",
    where:"/closure 비용 배너 오른쪽 사진", min:[1600,700], ratio:[1.8,2.6], maxKB:260,
    note:"필요한 장면 — 줄자 · 안전모 · 도면이 놓인 작업대 · 권장 2000×900 · 권리 확인된 사진만" },
  { key:"insu-hero", sizes:"100vw",
    where:"메인 브랜드 히어로 (전체 폭) — ZIP 00_hero_brand.jpg", min:[1600,900], ratio:[1.5,2.0], maxKB:400,
    note:"넓은 상업 공간 · 글은 HTML 로 위에 얹습니다" },
  { key:"insu-startup", sizes:"(max-width:900px) 92vw, 50vw",
    where:"메인 '지금 어떤 도움' 창업 준비 카드 · /startup 머리 — ZIP 01_startup.jpg", min:[1200,800], ratio:[1.3,1.8], maxKB:220, temp:true,
    note:"밝은 카페 오픈 준비 현장" },
  { key:"insu-operations", sizes:"(max-width:900px) 92vw, 50vw",
    where:"메인 '매장 운영 지원' · /operation 머리 — ZIP 02_operations.jpg", min:[1200,800], ratio:[1.3,1.8], maxKB:220, temp:true,
    note:"사람 없는 준비된 음식점 내부" },
  { key:"insu-transfer", sizes:"(max-width:900px) 92vw, 50vw",
    where:"메인 '매장 양도양수' 배너 · /transfer 머리 — ZIP 03_transfer.jpg (매물 사진 아님)", min:[1200,800], ratio:[1.3,1.8], maxKB:220, temp:true,
    note:"매장 외관과 상담 테이블 · 매물 썸네일 금지" },
  { key:"insu-closure", sizes:"(max-width:900px) 92vw, 50vw",
    where:"메인 '지금 어떤 도움' 폐업·철거 카드 · 메인 '폐업·철거' · /closure 머리 — ZIP 04_closure.jpg", min:[1200,800], ratio:[1.3,1.8], maxKB:220, temp:true,
    note:"집기 정리 중인 빈 공간" },
  /* 2026-11-22 — 메인 '폐업·철거' 구간 전용. 같은 ZIP 04_closure 에서 통창 · 사다리 · 빈 바닥 쪽만 잘라 낸 것(568×380 · 확대 없음).
     위 히어로의 폐업 카드(04 전체 · 의자 더미가 주인공)와 구도가 겹치지 않게 했습니다. 새 사진이 아닙니다 — 원본은 ZIP 그대로. */
  { key:"insu-closure-in", sizes:"(max-width:900px) 92vw, 50vw",
    where:"메인 '폐업·철거' 구간 — ZIP 04_closure.jpg 의 통창 쪽 잘라 낸 것", min:[1200,800], ratio:[1.3,1.8], maxKB:220, temp:true,
    note:"햇빛 드는 통창 · 정리된 빈 바닥" },
  /* 2026-11-22 — 메인 사진 넷 (대표가 준 insu_main_images · 원본은 img/home/0X_*.webp 그대로 보관).
     ⚠️ AI 로 만든 연출 사진입니다 — 소개용으로만. 매물 목록 · 거래 실적 · 후기 자리에 쓰지 마세요. */
  { key:"home-startup", sizes:"(max-width:900px) 92vw, 50vw",
    where:"메인 맨 위 창업 준비 카드 — 대표가 준 사진 01_hero_startup (2026-11-22)", min:[1600,800], ratio:[1.7,2.1], maxKB:220,
    note:"AI 연출 사진 — 소개용 · 실제 매물 · 거래 실적으로 쓰지 않습니다" },
  { key:"home-closure", sizes:"(max-width:900px) 92vw, 50vw",
    where:"메인 맨 위 폐업·철거 카드 — 대표가 준 사진 02_hero_closure (2026-11-22)", min:[1600,800], ratio:[1.7,2.1], maxKB:220,
    note:"AI 연출 사진 — 소개용 · 실제 매물 · 거래 실적으로 쓰지 않습니다" },
  { key:"home-ops", sizes:"(max-width:900px) 92vw, 50vw",
    where:"메인 '매장 운영' 구간 — 대표가 준 사진 03_section_operations (2026-11-22)", min:[1600,800], ratio:[1.7,2.1], maxKB:220,
    note:"AI 연출 사진 — 소개용 · 실제 매물 · 거래 실적으로 쓰지 않습니다" },
  { key:"home-transfer", sizes:"(max-width:900px) 92vw, 50vw",
    where:"메인 '매장 양도양수' 구간 — 대표가 준 사진 04_section_transfer (2026-11-22)", min:[1600,800], ratio:[1.7,2.1], maxKB:220,
    note:"AI 연출 사진 — 소개용 · 실제 매물 · 거래 실적으로 쓰지 않습니다" },
  /* 2026-11-24 — /assets 집기 고르기 사진 일곱 (지금 비어 있고 아이콘 면이 자리를 지킵니다).
     ⚠️ 카드 이름과 장면이 같아야 합니다 — 특히 냉장 · 냉동 ↔ 업소용 장비 · 키오스크 ↔ POS 가 사진으로 갈려야 합니다. */
  { key:"as-fridge", sizes:"(max-width:600px) 46vw, (max-width:900px) 47vw, (max-width:1100px) 30vw, 420px",
    where:"/assets 집기 고르기 '냉장 · 냉동' 카드 (2026-11-24)", min:[840,630], ratio:[1.28,1.38], maxKB:140,
    note:"필요한 장면 — 업소용 스테인리스 냉장고 · 냉동고 또는 유리문 쇼케이스를 정면에서 — 문 · 손잡이 · 선반이 보이게. ⚠️ 제빙기 · 식기세척기와 헷갈리지 않게 '문 달린 냉장 칸' 이 주인공 · 권장 1200×900(4:3) · 권리 확인된 사진만" },
  { key:"as-espresso", sizes:"(max-width:600px) 46vw, (max-width:900px) 47vw, (max-width:1100px) 30vw, 420px",
    where:"/assets 집기 고르기 '커피머신' 카드 (2026-11-24)", min:[840,630], ratio:[1.28,1.38], maxKB:140,
    note:"필요한 장면 — 에스프레소 머신(그룹헤드 · 스팀봉)과 그라인더가 한 화면에 — 머신이 주인공 · 원두 · 잔은 곁가지 · 권장 1200×900(4:3) · 권리 확인된 사진만" },
  { key:"as-furniture", sizes:"(max-width:600px) 46vw, (max-width:900px) 47vw, (max-width:1100px) 30vw, 420px",
    where:"/assets 집기 고르기 '가구' 카드 (2026-11-24)", min:[840,630], ratio:[1.28,1.38], maxKB:140,
    note:"필요한 장면 — 매장 테이블 · 의자 묶음(빈 매장) — 기계가 하나도 안 보이게 · 권장 1200×900(4:3) · 권리 확인된 사진만" },
  { key:"as-kiosk", sizes:"(max-width:600px) 46vw, (max-width:900px) 47vw, (max-width:1100px) 30vw, 420px",
    where:"/assets 집기 고르기 '키오스크' 카드 (2026-11-24)", min:[840,630], ratio:[1.28,1.38], maxKB:140,
    note:"필요한 장면 — 매장 무인 주문기(세워 두는 큰 화면)를 정면에서 — 계산대 POS 와 갈리게 '서 있는 큰 화면' 이 주인공 · 화면 글자 · 브랜드 로고 안 보이게 · 권장 1200×900(4:3) · 권리 확인된 사진만" },
  { key:"as-fitness", sizes:"(max-width:600px) 46vw, (max-width:900px) 47vw, (max-width:1100px) 30vw, 420px",
    where:"/assets 집기 고르기 '운동기구' 카드 (2026-11-24)", min:[840,630], ratio:[1.28,1.38], maxKB:140,
    note:"필요한 장면 — 러닝머신 · 웨이트 기구가 줄지어 선 체육관 — 사람 없이 기구가 주인공 · 권장 1200×900(4:3) · 권리 확인된 사진만" },
  { key:"as-salon-eq", sizes:"(max-width:600px) 46vw, (max-width:900px) 47vw, (max-width:1100px) 30vw, 420px",
    where:"/assets 집기 고르기 '미용기기' 카드 (2026-11-24)", min:[840,630], ratio:[1.28,1.38], maxKB:140,
    note:"필요한 장면 — 미용 의자 · 샴푸대 · 거울 — 사람 없이 의자가 주인공 · 권장 1200×900(4:3) · 권리 확인된 사진만" },
  { key:"as-biz-eq", sizes:"(max-width:600px) 46vw, (max-width:900px) 47vw, (max-width:1100px) 30vw, 420px",
    where:"/assets 집기 고르기 '업소용 장비' 카드 (2026-11-24)", min:[840,630], ratio:[1.28,1.38], maxKB:140,
    note:"필요한 장면 — 식기세척기 · 업소용 믹서 등 **냉장 · 조리 기기가 아닌** 업소용 기계 — ⚠️ 냉장고 · 가스레인지가 화면에 나오면 '냉장 · 냉동' · '주방장비' 와 헷갈립니다 · 권장 1200×900(4:3) · 권리 확인된 사진만" }
];


/* ⚠️ 키를 **여기 없는 이름으로 적으면 조용히 안 나옵니다.** 에러도
   안 나고 화면도 멀쩡합니다 — `hero_start` 처럼 한 글자만 달라도
   그렇습니다. `build-pages.js` 가 그것만 따로 막습니다. */
/* ⚠️⚠️ **히어로 두 장은 사장님이 주신 원본입니다** (2026-10-04).
   둘 다 1882×836 으로 들어와 1701~1702×756 · 300KB 아래로 맞췄고,
   비율(2.25)이 자리 범위 안이라 **한 픽셀도 안 잘랐습니다.**

   왼쪽(창업)은 **만들고 있는 공간**, 오른쪽(폐업)은 **정리하고 있는
   공간**입니다 — 둘 다 작업자가 일하는 장면이라 한 쌍으로 읽힙니다.
   ⚠️⚠️ 폐업 쪽은 **처연하지 않아야 합니다** (§7 — 끝이 아니라 다음
   시작). 지금 것은 햇빛이 가득 드는 밝은 현장이고, 불 꺼진 가게나
   고개 숙인 사람이 아닙니다. 바꾸실 때도 그 선을 지키세요.

   ⚠️ 바꾸실 때는 img/raw/ 에 같은 이름으로 넣고
   node tools/fit-photos.js --write 한 줄이면 됩니다. 돌린 뒤에는
   **alt 를 사람이 다시 적으세요** (도구는 빈 칸으로 둡니다). */
/* ⚠️⚠️ **`node tools/fit-photos.js --write` 는 이 칸을 통째로 다시
   씁니다** — 원본(`img/raw/`)이 있는 자리만 적고 나머지는 **지웁니다.**
   한쪽만 새로 넣으면 다른 쪽이 조용히 사라지니, 돌린 뒤에는 반드시
   이 칸을 되읽어 보세요 (실제로 hero-close 가 한 번 빠졌습니다). */
window.WOW_PHOTOS = {
  "hero-start": { src:"/img/hero-start.jpg?v=43939c5f",
    w:1701, h:756,
    webp:"/img/hero-start-sm.webp?v=d10230c9 936w, /img/hero-start.webp?v=61230e9c 1701w",
    jpg:"/img/hero-start-sm.jpg?v=7627d1c7 936w, /img/hero-start.jpg?v=43939c5f 1701w",
    alt:"큰 창으로 햇빛이 드는 상업공간에서 작업자들이 카운터와 조명을 설치하고 있습니다" },
  "hero-close": { src:"/img/hero-close.jpg?v=5011de99",
    w:1702, h:756,
    webp:"/img/hero-close-sm.webp?v=0c461161 936w, /img/hero-close.webp?v=a9bcb267 1702w",
    jpg:"/img/hero-close-sm.jpg?v=14d773b3 936w, /img/hero-close.jpg?v=5011de99 1702w",
    alt:"햇빛이 드는 상가 내부에서 작업자들이 마감재를 떼어 내고 정리하고 있습니다" },
  "hero-startup": { src:"/img/hero-startup.jpg?v=cafced7d",
    w:978, h:941,
    webp:"/img/hero-startup-sm.webp?v=7ebd4ab7 538w, /img/hero-startup.webp?v=1f776267 978w",
    jpg:"/img/hero-startup-sm.jpg?v=3fd69ce9 538w, /img/hero-startup.jpg?v=cafced7d 978w",
    alt:"갓 문을 연 카페 카운터에서 사장님이 태블릿을 들고 매장을 둘러보고 있습니다" },
  "hero-closure": { src:"/img/hero-closure.jpg?v=5ed467e1",
    w:869, h:941,
    webp:"/img/hero-closure-sm.webp?v=2aca1ddb 478w, /img/hero-closure.webp?v=f89dbdaf 869w",
    jpg:"/img/hero-closure-sm.jpg?v=f82fb7f1 478w, /img/hero-closure.jpg?v=5ed467e1 869w",
    alt:"햇빛이 드는 매장에서 사장님이 의자를 테이블에 올리고 포장 상자를 정리하고 있습니다" },
  "hero-ops": { src:"/img/hero-ops.jpg?v=4fd18720",
    w:953, h:941,
    webp:"/img/hero-ops-sm.webp?v=75ad6292 524w, /img/hero-ops.webp?v=34b13237 953w",
    jpg:"/img/hero-ops-sm.jpg?v=3ec4c91c 524w, /img/hero-ops.jpg?v=4fd18720 953w",
    alt:"문을 연 매장 카운터에서 사장님이 POS 화면을 보며 주문을 처리하고 있습니다" },
  "svc-interior": { src:"/img/svc-interior.jpg?v=b42e5abd",
    w:267, h:263,
    webp:"/img/svc-interior.webp?v=ee373d5e 267w",
    alt:"상업공간 인테리어 마감재 견본과 매장 평면도면이 작업대에 놓여 있습니다" },
  "svc-equip": { src:"/img/svc-equip.jpg?v=57207420",
    w:322, h:324,
    webp:"/img/svc-equip.webp?v=dab4866d 322w",
    alt:"업소용 주방의 스테인리스 가스레인지와 대형 조리 냄비들" },
  "svc-it": { src:"/img/svc-it.jpg?v=a7e82576",
    w:324, h:323,
    webp:"/img/svc-it.webp?v=82788821 324w",
    alt:"매장 천장에 설치된 CCTV 카메라 셋과 화면이 나뉜 관제 모니터" },
  "svc-clean": { src:"/img/svc-clean.jpg?v=41582a26",
    w:267, h:263,
    webp:"/img/svc-clean.webp?v=a079a198 267w",
    alt:"매장 청소에 쓰는 세정제 분무기와 밀대, 청소 카트" },
  "kind-take": { src:"/img/kind-take.jpg?v=88e14a31",
    w:1120, h:840,
    webp:"/img/kind-take-sm.webp?v=785bc293 560w, /img/kind-take.webp?v=fe3cdf82 1120w",
    jpg:"/img/kind-take-sm.jpg?v=8a843e3d 560w, /img/kind-take.jpg?v=88e14a31 1120w",
    alt:"큰 통창으로 햇빛이 드는 빈 상업공간 내부" },
  "kind-pass": { src:"/img/kind-pass.jpg?v=297df8c2",
    w:1120, h:840,
    webp:"/img/kind-pass-sm.webp?v=daeb2353 560w, /img/kind-pass.webp?v=6e251ce5 1120w",
    jpg:"/img/kind-pass-sm.jpg?v=397c4b96 560w, /img/kind-pass.jpg?v=297df8c2 1120w",
    alt:"따뜻한 조명이 켜진 매장 카운터와 좌석" },
  "kind-asset": { src:"/img/kind-asset.jpg?v=449ec642",
    w:1120, h:840,
    webp:"/img/kind-asset-sm.webp?v=d6f4fc74 560w, /img/kind-asset.webp?v=64cc0fe1 1120w",
    jpg:"/img/kind-asset-sm.jpg?v=428937df 560w, /img/kind-asset.jpg?v=449ec642 1120w",
    alt:"스테인리스 조리대와 장비가 늘어선 상업용 주방" },
  "kp-st-svc-area": { src:"/img/kp/kp-st-svc-area.jpg?v=70d21d19",
    w:685, h:471,
    webp:"/img/kp/kp-st-svc-area.webp?v=678a961c 685w",
    alt:"상가 거리를 따라 이어진 점포 외관 — 연출 사진" },
  "kp-st-svc-permit": { src:"/img/kp/kp-st-svc-permit.jpg?v=665ed58d",
    w:685, h:471,
    webp:"/img/kp/kp-st-svc-permit.webp?v=22cda4e1 685w",
    alt:"책상 위에 놓인 신고 서류 묶음과 펜 — 연출 사진" },
  "kp-st-pro-check": { src:"/img/kp/kp-st-pro-check.jpg?v=a0a97adc",
    w:684, h:470,
    webp:"/img/kp/kp-st-pro-check.webp?v=8f2d596a 684w",
    alt:"지도를 펼쳐 놓고 입지를 함께 검토하는 두 사람 — 연출 사진" },
  "kp-st-pro-design": { src:"/img/kp/kp-st-pro-design.jpg?v=147582fd",
    w:684, h:470,
    webp:"/img/kp/kp-st-pro-design.webp?v=ace2d63e 684w",
    alt:"매장 평면도와 마감재 견본 — 연출 사진" },
  "kp-op-svc-supply": { src:"/img/kp/kp-op-svc-supply.jpg?v=d61138aa",
    w:685, h:471,
    webp:"/img/kp/kp-op-svc-supply.webp?v=ed11b632 685w",
    alt:"주방으로 채소 상자를 납품하는 장면 — 연출 사진" },
  "kp-op-svc-staff": { src:"/img/kp/kp-op-svc-staff.jpg?v=082040f1",
    w:685, h:471,
    webp:"/img/kp/kp-op-svc-staff.webp?v=9953d88c 685w",
    alt:"근무표를 함께 보는 직원 둘 — 연출 사진" },
  "kp-op-svc-pos": { src:"/img/kp/kp-op-svc-pos.jpg?v=004f13ef",
    w:684, h:470,
    webp:"/img/kp/kp-op-svc-pos.webp?v=cabba5a1 684w",
    alt:"계산대의 POS 단말과 카드 결제기 — 연출 사진" },
  "kp-op-svc-repair": { src:"/img/kp/kp-op-svc-repair.jpg?v=d5c6d040",
    w:684, h:470,
    webp:"/img/kp/kp-op-svc-repair.webp?v=2572c817 684w",
    alt:"천장형 냉난방기를 점검하는 기사 — 연출 사진" },
  "kp-op-pro-pick": { src:"/img/kp/kp-op-pro-pick.jpg?v=20331f32",
    w:685, h:471,
    webp:"/img/kp/kp-op-pro-pick.webp?v=d0e19650 685w",
    alt:"노트북 앞에서 고민을 정리하는 사장님 — 연출 사진" },
  "kp-op-pro-check": { src:"/img/kp/kp-op-pro-check.jpg?v=46aff731",
    w:685, h:471,
    webp:"/img/kp/kp-op-pro-check.webp?v=5b813cd7 685w",
    alt:"클립보드에 매장 점검 내용을 적는 사장님 — 연출 사진" },
  "kp-op-pro-prior": { src:"/img/kp/kp-op-pro-prior.jpg?v=2c52d18b",
    w:684, h:470,
    webp:"/img/kp/kp-op-pro-prior.webp?v=bc33db4c 684w",
    alt:"책상에 펼쳐 둔 준비 목록 카드 — 연출 사진" },
  "kp-op-pro-run": { src:"/img/kp/kp-op-pro-run.jpg?v=ca6600aa",
    w:684, h:470,
    webp:"/img/kp/kp-op-pro-run.webp?v=3e59c79a 684w",
    alt:"노트에 진행 계획을 적는 사장님 — 연출 사진" },
  "kp-tr-svc-search": { src:"/img/kp/kp-tr-svc-search.jpg?v=d092f215",
    w:745, h:512,
    webp:"/img/kp/kp-tr-svc-search.webp?v=fcb57973 745w",
    alt:"노트북으로 매장 매물을 둘러보는 사람 — 연출 사진" },
  "kp-tr-svc-sell": { src:"/img/kp/kp-tr-svc-sell.jpg?v=ae26cd02",
    w:745, h:512,
    webp:"/img/kp/kp-tr-svc-sell.webp?v=2004c74c 745w",
    alt:"매장 앞에서 태블릿을 든 사장님 — 연출 사진" },
  "kp-tr-svc-premium": { src:"/img/kp/kp-tr-svc-premium.jpg?v=5f360a9c",
    w:745, h:512,
    webp:"/img/kp/kp-tr-svc-premium.webp?v=412e6bf8 745w",
    alt:"계산기 · 노트 · 열쇠가 놓인 책상 — 연출 사진" },
  "kp-tr-svc-contract": { src:"/img/kp/kp-tr-svc-contract.jpg?v=61b8073c",
    w:745, h:512,
    webp:"/img/kp/kp-tr-svc-contract.webp?v=1611e1d6 745w",
    alt:"계약서를 함께 살펴보는 두 사람 — 연출 사진" },
  "kp-tr-pro-search": { src:"/img/kp/kp-tr-pro-search.jpg?v=251c0d55",
    w:960, h:660,
    webp:"/img/kp/kp-tr-pro-search.webp?v=d85f198d 960w",
    alt:"노트북 화면의 지도에서 점포 위치를 비교하는 사장님 — 연출 사진" },
  "kp-tr-pro-visit": { src:"/img/kp/kp-tr-pro-visit.jpg?v=a47db37c",
    w:685, h:471,
    webp:"/img/kp/kp-tr-pro-visit.webp?v=1382d483 685w",
    alt:"매장 주방 설비를 살펴보며 기록하는 사람 — 연출 사진" },
  "kp-tr-pro-nego": { src:"/img/kp/kp-tr-pro-nego.jpg?v=a92b5ace",
    w:685, h:471,
    webp:"/img/kp/kp-tr-pro-nego.webp?v=1cf49556 685w",
    alt:"카페 테이블에서 조건을 이야기하는 두 사람 — 연출 사진" },
  "kp-tr-pro-ready": { src:"/img/kp/kp-tr-pro-ready.jpg?v=3c888959",
    w:684, h:470,
    webp:"/img/kp/kp-tr-pro-ready.webp?v=08245385 684w",
    alt:"열쇠와 서류 폴더가 놓인 책상 — 연출 사진" },
  "kp-cl-svc-tax": { src:"/img/kp/kp-cl-svc-tax.jpg?v=573e4603",
    w:684, h:470,
    webp:"/img/kp/kp-cl-svc-tax.webp?v=4d2fb0b6 684w",
    alt:"계산기와 서류로 세무를 정리하는 사람 — 연출 사진" },
  "kp-cl-pro-consult": { src:"/img/kp/kp-cl-pro-consult.jpg?v=c51fdb04",
    w:685, h:471,
    webp:"/img/kp/kp-cl-pro-consult.webp?v=8bda9610 685w",
    alt:"노트북으로 상담 내용을 적는 사장님 — 연출 사진" },
  "kp-cl-pro-quote": { src:"/img/kp/kp-cl-pro-quote.jpg?v=fc7a37a4",
    w:685, h:471,
    webp:"/img/kp/kp-cl-pro-quote.webp?v=54d75ce6 685w",
    alt:"빈 매장에서 치수를 재며 견적을 적는 두 사람 — 연출 사진" },
  "kp-cl-ban-cost": { src:"/img/kp/kp-cl-ban-cost.jpg?v=a0e2fd7a",
    w:1870, h:841,
    webp:"/img/kp/kp-cl-ban-cost.webp?v=21e3013d 1870w",
    alt:"빈 매장 작업대 위의 안전모 · 줄자 · 도면 — 연출 사진" },
  "insu-hero": { src:"/img/insu/00_hero_brand.jpg?v=467534fc",
    w:1672, h:941,
    webp:"/img/insu/00_hero_brand-sm.webp?v=30af4ab3 960w, /img/insu/00_hero_brand.webp?v=aa50872f 1672w",
    jpg:"/img/insu/00_hero_brand-sm.jpg?v=9029a9d5 960w, /img/insu/00_hero_brand.jpg?v=467534fc 1672w",
    alt:"햇빛이 드는 넓은 상업 공간 — 카페 · 매장 · 미용 공간이 이어진 실내" },
  "insu-startup": { src:"/img/insu/01_startup.jpg?v=b0f67322",
    w:768, h:512,
    webp:"/img/insu/01_startup.webp?v=c66c129f 768w",
    jpg:"/img/insu/01_startup.jpg?v=b0f67322 768w",
    alt:"햇빛이 드는 카페 오픈 준비 현장 — 나무 카운터와 커피 머신, 상자와 사다리" },
  "insu-operations": { src:"/img/insu/02_operations.jpg?v=87744a96",
    w:768, h:512,
    webp:"/img/insu/02_operations.webp?v=77775207 768w",
    jpg:"/img/insu/02_operations.jpg?v=87744a96 768w",
    alt:"영업 준비를 마친 음식점 내부 — 사람 없는 테이블과 주방" },
  "insu-transfer": { src:"/img/insu/03_transfer.jpg?v=980076c3",
    w:768, h:512,
    webp:"/img/insu/03_transfer.webp?v=bec533d9 768w",
    jpg:"/img/insu/03_transfer.jpg?v=980076c3 768w",
    alt:"매장 외관과 상담 테이블 — 서류와 노트북이 놓인 야외 자리" },
  "insu-closure": { src:"/img/insu/04_closure.jpg?v=bf49facc",
    w:768, h:512,
    webp:"/img/insu/04_closure.webp?v=9a463fcb 768w",
    jpg:"/img/insu/04_closure.jpg?v=bf49facc 768w",
    alt:"집기를 정리하는 빈 매장 — 쌓아 둔 의자와 사다리, 통창" },
  "insu-closure-in": { src:"/img/insu/04_closure-in.jpg?v=b93df345",
    w:568, h:380,
    webp:"/img/insu/04_closure-in.webp?v=5be0ac8b 568w",
    jpg:"/img/insu/04_closure-in.jpg?v=b93df345 568w",
    alt:"햇빛이 드는 통창과 정리된 빈 매장 바닥 — 사다리와 상자 몇 개" },
  "home-startup": { src:"/img/home/01_hero_startup-1600.jpg?v=9fbaaff4",
    w:1600, h:900,
    webp:"/img/home/01_hero_startup-900.webp?v=18bea77f 900w, /img/home/01_hero_startup-1600.webp?v=4086e554 1600w, /img/home/01_hero_startup.webp?v=47ae86aa 1672w",
    jpg:"/img/home/01_hero_startup-900.jpg?v=2e9c5cf0 900w, /img/home/01_hero_startup-1600.jpg?v=9fbaaff4 1600w",
    alt:"햇빛 드는 카페 오픈 준비 현장 — 커피 머신 앞의 사장님과 정리 중인 상자" },
  "home-closure": { src:"/img/home/02_hero_closure-1600.jpg?v=d85dee55",
    w:1600, h:800,
    webp:"/img/home/02_hero_closure-900.webp?v=c490d32d 900w, /img/home/02_hero_closure-1600.webp?v=e665b70c 1600w, /img/home/02_hero_closure.webp?v=03ba6da5 1774w",
    jpg:"/img/home/02_hero_closure-900.jpg?v=413b3255 900w, /img/home/02_hero_closure-1600.jpg?v=d85dee55 1600w",
    alt:"정리 중인 빈 매장 — 집기를 상자에 담는 사장님과 쌓아 둔 의자" },
  "home-ops": { src:"/img/home/03_section_operations-1600.jpg?v=ddee35f2",
    w:1600, h:800,
    webp:"/img/home/03_section_operations-900.webp?v=a25e96cd 900w, /img/home/03_section_operations-1600.webp?v=b4b73d58 1600w, /img/home/03_section_operations.webp?v=65da49c3 1774w",
    jpg:"/img/home/03_section_operations-900.jpg?v=a5d23f44 900w, /img/home/03_section_operations-1600.jpg?v=ddee35f2 1600w",
    alt:"손님으로 붐비는 식당 영업 현장 — 홀과 주방, 계산대" },
  "home-transfer": { src:"/img/home/04_section_transfer-1600.jpg?v=77115932",
    w:1600, h:800,
    webp:"/img/home/04_section_transfer-900.webp?v=0f40d78c 900w, /img/home/04_section_transfer-1600.webp?v=4afb07e0 1600w, /img/home/04_section_transfer.webp?v=ca5dcdd9 1774w",
    jpg:"/img/home/04_section_transfer-900.jpg?v=47b20e20 900w, /img/home/04_section_transfer-1600.jpg?v=77115932 1600w",
    alt:"카페 테이블에서 계약 서류를 두고 악수하는 두 사람 — 소개용 연출 사진" },
  "as-fridge": { src:"/img/as-fridge.jpg?v=2cc840c3",
    w:1134, h:851,
    webp:"/img/as-fridge-sm.webp?v=2b104503 624w, /img/as-fridge.webp?v=5a46b7a2 1134w",
    jpg:"/img/as-fridge-sm.jpg?v=11d053ff 624w, /img/as-fridge.jpg?v=2cc840c3 1134w",
    alt:"문이 둘 달린 업소용 스테인리스 냉장고 — 품목 안내용 연출 사진" },
  "as-espresso": { src:"/img/as-espresso.jpg?v=996c3c9b",
    w:1134, h:851,
    webp:"/img/as-espresso-sm.webp?v=a6f21b2c 624w, /img/as-espresso.webp?v=c24391d6 1134w",
    jpg:"/img/as-espresso-sm.jpg?v=4bccc795 624w, /img/as-espresso.jpg?v=996c3c9b 1134w",
    alt:"카운터 위 2그룹 에스프레소 머신과 원두 그라인더 — 품목 안내용 연출 사진" },
  "as-furniture": { src:"/img/as-furniture.jpg?v=24164b96",
    w:1134, h:851,
    webp:"/img/as-furniture-sm.webp?v=44b83981 624w, /img/as-furniture.webp?v=de3442a6 1134w",
    jpg:"/img/as-furniture-sm.jpg?v=c7703e24 624w, /img/as-furniture.jpg?v=24164b96 1134w",
    alt:"빈 매장의 원목 테이블과 의자 — 품목 안내용 연출 사진" },
  "as-kiosk": { src:"/img/as-kiosk.jpg?v=5f5820c2",
    w:1134, h:851,
    webp:"/img/as-kiosk-sm.webp?v=86c7de97 624w, /img/as-kiosk.webp?v=678e97f1 1134w",
    jpg:"/img/as-kiosk-sm.jpg?v=60d7cf9d 624w, /img/as-kiosk.jpg?v=5f5820c2 1134w",
    alt:"매장에 세워 둔 무인 주문 키오스크 — 품목 안내용 연출 사진" },
  "as-fitness": { src:"/img/as-fitness.jpg?v=6bc171c9",
    w:1134, h:851,
    webp:"/img/as-fitness-sm.webp?v=5a78ce04 624w, /img/as-fitness.webp?v=2f7eb1c0 1134w",
    jpg:"/img/as-fitness-sm.jpg?v=a1222f90 624w, /img/as-fitness.jpg?v=6bc171c9 1134w",
    alt:"러닝머신 · 케이블 머신 · 덤벨이 놓인 체육관 — 품목 안내용 연출 사진" },
  "as-salon-eq": { src:"/img/as-salon-eq.jpg?v=db77b8ba",
    w:1134, h:851,
    webp:"/img/as-salon-eq-sm.webp?v=247699f6 624w, /img/as-salon-eq.webp?v=9848e6af 1134w",
    jpg:"/img/as-salon-eq-sm.jpg?v=d2bc9dc3 624w, /img/as-salon-eq.jpg?v=db77b8ba 1134w",
    alt:"미용 의자 · 거울 · 샴푸대가 있는 미용실 — 품목 안내용 연출 사진" },
  "as-biz-eq": { src:"/img/as-biz-eq.jpg?v=2c34fbac",
    w:1134, h:851,
    webp:"/img/as-biz-eq-sm.webp?v=1a5fdb33 624w, /img/as-biz-eq.webp?v=b0a26fba 1134w",
    jpg:"/img/as-biz-eq-sm.jpg?v=db9ad0dc 624w, /img/as-biz-eq.jpg?v=2c34fbac 1134w",
    alt:"업소용 식기세척기와 스탠드 믹서 · 작업대 — 품목 안내용 연출 사진" }
};

window.wowPhoto = function(key){
  var p = (window.WOW_PHOTOS || {})[key];
  return (p && p.src) ? p : null;
};
window.hasPhoto = function(key){ return !!wowPhoto(key); };

/* ⚠️ 세 번째 값 `eager` 는 **첫 화면에 보이는 사진**에만 씁니다.
   첫 화면 사진에 `loading="lazy"` 를 걸면 제일 큰 그림이 늦게 떠서
   손님이 "느리다" 고 느낍니다. 반대로 아래쪽까지 eager 로 두면 첫
   화면이 아래 사진들을 다 기다립니다. */
window.wowSlot = function(key){
  var L = window.WOW_PHOTO_SLOTS || [], i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};

/* ⚠️⚠️ **대체 형식이 없으면 예전과 글자 하나 다르지 않게** 냅니다.
   `<picture>` 는 webp · avif 가 실제로 있을 때만 생깁니다 — 사진을
   다시 만들기 전까지 화면이 바뀌지 않는다는 뜻입니다.
   ⚠️ `sizes` 는 **자리**의 성질입니다 (히어로는 반쪽 화면, 서비스
   카드는 네 칸) — 그래서 `WOW_PHOTO_SLOTS` 에 적혀 있습니다. 없으면
   브라우저가 **화면 전체 폭**으로 보고 제일 큰 파일을 받습니다. */
/* ⚠️⚠️ 넷째 인자 `sz` 는 **그 자리의 실제 칸 폭**입니다 (안 넘기면 전과
   똑같이 자리(`slot`)의 값을 씁니다). 같은 사진 자리를 **칸이 아주 다른
   두 화면**이 같이 쓰기 때문에 생긴 칸입니다 —
     hero-startup 등 넷:  메인 진입 카드 118~462px  ·  /startup 머리 320~1075px
   자리에 하나만 적을 수 있어서, 머리 띠에 맞춰 둔 `42vw` 가 메인에서는
   **303px 칸에 869w 짜리 파일**을 받게 했습니다 (재 보니 네 장이 446KB —
   -sm 로 받으면 194KB). ⚠️ 자리의 `sizes` 를 메인에 맞춰 줄이면 이번에는
   **전문관 머리 띠가 뿌옇게** 뜹니다. 그래서 자리는 그대로 두고 부르는
   쪽이 제 칸을 알려 줍니다.
   ⚠️ 재서 적으세요 — 눈대중으로 줄이면 작은 판을 받아 뿌옇게 뜨는데
   **에러도 안 나고 검사도 통과합니다.** */
window.photoBox = function(key, cls, eager, sz){
  var c = "ph" + (cls ? " " + cls : "");
  var p = wowPhoto(key);
  /* ⚠️ 없을 때 `alt` 를 단 빈 칸을 만들지 않습니다. 읽어 주는
     프로그램이 없는 사진을 설명하는 것은 없는 것보다 나쁩니다. */
  if(!p) return '<span class="' + c + ' ph-none" aria-hidden="true"></span>';

  var sl    = window.wowSlot(key) || {};
  var sizes = sz || p.sizes || sl.sizes || "";
  var szAtt = sizes ? ' sizes="' + esc(sizes) + '"' : "";

  /* ⚠️⚠️ `width` · `height` 를 적지 않으면 사진이 뜨는 순간 아래 글이
     **밀려 내려갑니다**(레이아웃 이동). 읽던 줄을 놓치고, 누르려던
     단추가 손가락 밑에서 움직입니다. 비율만 알려 주는 값이라
     실제 표시 크기는 CSS 가 그대로 정합니다. */
  var wh = (p.w && p.h) ? ' width="' + p.w + '" height="' + p.h + '"' : "";

  var img = '<img class="' + c + '" src="' + esc(p.src) + '"' +
    (p.jpg ? ' srcset="' + esc(p.jpg) + '"' + szAtt : "") + wh +
    ' alt="' + esc(p.alt || "") + '"' +
    (eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">';

  /* 차례가 곧 우선순위입니다 — 브라우저는 **읽을 수 있는 첫 줄**을
     고릅니다. 그래서 더 작게 눌리는 avif 가 앞입니다. */
  var alt = "";
  if(p.avif) alt += '<source type="image/avif" srcset="' + esc(p.avif) + '"' + szAtt + '>';
  if(p.webp) alt += '<source type="image/webp" srcset="' + esc(p.webp) + '"' + szAtt + '>';

  /* ⚠️⚠️ 감싸개는 `display:contents` 입니다 (`css/app.css` 의 `.ph-p`).
     `.ph` 를 가리키는 규칙이 **열일곱** 개라, 감싸개가 레이아웃에
     끼어들면 그 열일곱이 전부 어긋납니다. */
  return alt ? '<picture class="ph-p">' + alt + img + '</picture>' : img;
};


/* ═══ 2026-11-25 디자인 개편 — 사진 공통 매핑 ═══════════════════════════════════
   업종 14 · 업체 분류 · 장비를 **사진 자리 키**로만 가리킵니다 (파일 경로를 적지 않습니다).
   ⚠️⚠️ 맞는 사진이 없는 자리는 null 입니다 — **비슷한 다른 사진으로 메우지 않습니다.**
      (네일 자리에 미용실 사진을 넣으면 다른 업종으로 읽힙니다.) 그 자리는 picFace() 가
      월넛 면 + 아이콘으로 서고, 사진을 받으면 이 표의 한 줄만 바꾸면 됩니다.
   ⚠️ 전부 연출 사진입니다 — 실제 매물 · 업체 · 시공 실적으로 소개하지 않습니다. */
window.AM_PIC_IND = {
  restaurant:"kind-asset", cafe:"as-espresso", bar:null, hair:"as-salon-eq", beauty:null,
  gym:"as-fitness", academy:null, pet:null, retail:null, unmanned:"as-kiosk", stay:null,
  office:"kp-cl-svc-tax", online:null, etc:"kp-op-pro-prior"
};
window.AM_PIC_CAT = {
  interior:"kp-st-pro-design", equip:"svc-equip", furniture:"as-furniture", it:"kp-op-svc-pos",
  supply:"kp-op-svc-supply", repair:"kp-op-svc-repair", admin:"kp-st-svc-permit", staff:"kp-op-svc-staff",
  marketing:null, clean:"svc-clean", demolish:"hero-close", restore:"kind-take", waste:"insu-closure-in",
  tax:"kp-cl-svc-tax", labor:null, contract:"kp-tr-svc-contract", law:"kp-tr-pro-nego",
  item:"kp-st-pro-check", store:"kp-tr-svc-search", area:"kp-st-svc-area", fund:"kp-tr-svc-premium",
  process:"kp-cl-pro-consult", transfer:"kp-tr-pro-ready", asset:"as-fridge", stock:null, support:null
};
/* 장비(industries.js 의 equip key) — 제품을 알아볼 수 있는 것만 */
window.AM_PIC_EQ = {
  espresso:"as-espresso", fridge:"as-fridge", "kitchen-eq":"as-biz-eq", "cook-eq":"svc-equip",
  "salon-chair":"as-salon-eq", fitness:"as-fitness", "kiosk-eq":"as-kiosk", vending:"as-kiosk"
};
/* 사진 키를 고르는 한 곳 — 없으면 "" */
/* 2026-11-25 §6 — 여러 서비스 고르기의 **물리적인 선택지**만 작은 사진 (id 가 먼저 · 없으면 분류).
   ⚠️ 서류 · 신고 · 상담처럼 손에 잡히는 것이 아닌 칸에는 사진을 안 붙입니다 (아이콘 그대로).
   ⚠️ 간판(interior/sign) · 인터넷(it/internet)은 맞는 사진이 없어 비웠습니다 (빈 액자를 깔지 않습니다). */
window.AM_PIC_PICK = { "interior/interior":"kp-st-pro-design", interior:"kp-st-pro-design",
  "it/pos":"kp-op-svc-pos", "it/kiosk":"as-kiosk", it:"kp-op-svc-pos",
  "repair/aircon-fix":"kp-op-svc-repair", "repair/check-up":"kp-op-svc-repair", repair:"kp-op-svc-repair",
  "supply/consumable":"kp-op-svc-supply", supply:"kp-op-svc-supply",
  "asset/furniture":"as-furniture", furniture:"as-furniture", equip:"svc-equip", asset:"as-fridge",
  "demolish/full":"hero-close", demolish:"hero-close", "restore/shop-restore":"kind-take", restore:"kind-take",
  "waste/biz-waste":"insu-closure-in", waste:"insu-closure-in", clean:"svc-clean" };
function picKey(kind, key){
  if(kind === "pick"){
    var P = window.AM_PIC_PICK || {}, c = String(key || "").split("/")[0];
    var pk = P[key] || ((String(key).indexOf("/") < 0) ? P[c] : "");
    return (pk && typeof hasPhoto === "function" && hasPhoto(pk)) ? pk : "";
  }
  var t = kind === "ind" ? window.AM_PIC_IND : kind === "eq" ? window.AM_PIC_EQ : window.AM_PIC_CAT;
  var k = t && t[key];
  return (k && typeof hasPhoto === "function" && hasPhoto(k)) ? k : "";
}
/* 사진 칸 — 사진이 있으면 photoBox, 없으면 월넛 면 + 아이콘 (빈 틀을 두지 않습니다) */
function picBox(photoKey, iconName, sizes, eager){
  if(photoKey && typeof hasPhoto === "function" && hasPhoto(photoKey))
    return photoBox(photoKey, "", !!eager, sizes || "(max-width:600px) 46vw, 320px");
  return picFace(iconName);
}
function picFace(iconName){
  var art = (typeof hasIconArt === "function" && hasIconArt(iconName)) ? iconArt(iconName, 56)
          : (typeof icon === "function" ? icon(iconName || "store", 34) : "");
  return '<span class="pcd-n" aria-hidden="true">'+art+'</span>';
}
