# 고리 (aboutmeat.co.kr) — 작업 규칙

축산업 요청·견적 매칭 플랫폼. 빌드 도구 없는 정적 HTML/CSS/JS + Supabase + Vercel.

## 절대 규칙

1. **기존 함수·이벤트 핸들러·Supabase 연동 코드를 지우거나 이름을 바꾸지 않는다.**
   기능을 바꿀 때는 원본을 남기고 바깥에서 감싼다.
   ```js
   var orig = window.gOpenRequest;
   window.gOpenRequest = function(id){ /* 추가 동작 */ return orig.apply(this, arguments); };
   ```
   CDN 이 막히거나 확장이 실패해도 원래 동작으로 돌아갈 수 있어야 한다.

2. **DB 스키마(테이블·컬럼)를 임의로 바꾸지 않는다.** 필요하면 `db/` 에 추가 전용
   SQL 을 새로 쓰고, 왜 필요한지 먼저 설명한다. 기존 값을 바꾸지 말고 클라이언트에서
   매핑한다 (`CATS8[].legacy` 참고).

3. **숫자·거래건수·뉴스·매물을 지어내지 않는다.** 데이터가 없으면 빈 상태를 보여준다.
   확인되지 않은 것을 사실처럼 쓰면 안 된다. (예전에 홈에 "ASF 방역 강화" 같은 가짜
   기사 제목이 있었고 전부 걷어냈다.)

4. **실제로 만들지 않은 기능을 광고하지 않는다.** `site-info.js` 의 `GORI_FEATURES`
   로 끈다.

## 파일을 고치는 방법

| 고칠 것 | 방법 |
|---|---|
| `gori-app.js` | **직접 고치지 말 것.** `src/` 의 조각을 고치고 `node build.js` |
| `index.html` | 고친 뒤 반드시 `cp index.html meat_insight_main.html` (5개 페이지가 이걸 홈으로 링크한다) |
| 사업자 정보·홈 콘텐츠 | `site-info.js` 한 곳 |

`src/` 의 순서는 `build.js` 의 `ORDER` 가 정답이다.
- `07_init.js` 는 **항상 마지막** (IIFE 닫는 괄호가 여기 있다)
- 확장 조각(14~)은 `12_redesign.js` **뒤** — 앞에 두면 리디자인이 덮어쓴다
- 확장 패치는 `07_init.js` 의 `applyExtras()` 에서 **타이머로** 부른다.
  `init()` 안에서 부르면 DOMContentLoaded 가 리디자인(420ms)보다 먼저 오는
  환경에서 감싸는 순서가 뒤집힌다. (실제로 겪은 버그다)
- 홈 히어로·헤더는 `index.html` 마크업이다. **id 와 onclick 을 그대로 두는 한**
  겉모습은 바꿔도 된다 (`hs-input` · `hero-chips` · `gh-stat` · `cat8-grid` ·
  `heroGo` · `heroPick` · `gPickRegion` · `gHeroBell`). 하나라도 이름이 바뀌면
  검색·지역·알림이 조용히 죽는다.
- **`.hdr-actions` 안에는 아무것도 직접 넣지 마라.** `renderHeaderUser()` 가
  로그인 상태가 바뀔 때마다 통째로 다시 쓴다. 헤더에 뭘 붙이려면 `.hdr-right`
  안, `.hdr-actions` **바깥**에 두거나 `44_premium.js` 처럼 그릴 때마다 다시 붙여라.
- `33_layout.js` 는 **`ORDER` 와 `applyExtras()` 둘 다에서 맨 마지막**
  (`07_init` 바로 앞). 그려진 조각을 두 칸으로 담는 일이라, 다른 패치가
  버튼·안내를 다 붙인 뒤여야 그것들까지 같이 담긴다.
- 화면을 옮겨 담는 코드는 **직계 자식만** 보고 판단할 것. `querySelectorAll`
  로 안쪽까지 훑으면 이미 담아 둔 칸(`.lay-side`)을 통째로 집어 날린다.

주의: `renderHeaderUser` · `paintBell` · `renderRequestDetail` · `renderQuotes` ·
`quoteRow` 같은 이름은 IIFE 안의 지역 함수라 **`window.` 에 없다.** 감쌀 때는
지역 바인딩을 직접 재할당해야 한다. `window.X = ...` 로 감싸면 조용히 아무 일도
일어나지 않는다.

## 확인

```bash
node build.js --check                    # 빌드 최신인지
node --check gori-app.js                 # 문법
cmp index.html meat_insight_main.html    # 미러 일치
node test/run.js                         # 회귀 38종 (playwright 필요)
cd test && node contrast-e2e.js          # 색 대비 전수 (팔레트를 바꾸면 필수)
bash test/rls-test.sh                    # RLS SQL 을 진짜 Postgres 에 실행 (db/ 를 고치면 필수)
```

바꾼 화면은 **데스크톱과 모바일(390px) 둘 다** 실제로 띄워 보고, 가로 스크롤이
생기지 않는지 확인한다.

## 색을 어디에 쓸지

| 토큰 | 쓰는 곳 |
|---|---|
| `--cta` `#B4232C` 딥레드 | **누르는 것 하나**. 헤더 요청 올리기 · 히어로 검색하기 · `.gbtn-p` · 모바일 + 버튼 |
| `--gn` `#C24A0C` 브랜드 | 링크 · 아이콘 · 구간 강조 · hover |
| `--brand-dark` `#F0503F` | 어두운 배경 위 (히어로의 "고리") — `--gn` 은 어두운 데서 3.79:1 이라 모자랍니다 |

빨강을 구간 제목이나 카드 배경까지 넓히지 마라. 늘어나는 순간 이벤트
페이지처럼 보인다. `test/premium-e2e.js` 의 "딥레드는 CTA 에만" 이 감시한다.

## CSS 를 어디에 쓸지

반대 방향도 있다: `index.html` 에서 `outline:none` 같은 것을 클래스 두 개 이상으로
잡으면 `gori-app.css` 의 `html :focus-visible`(0,1,1)을 이겨서 **초점 테두리가
통째로 사라진다.** 실제로 새 검색창에서 그렇게 지웠다 — `test/a11y-e2e.js` 와
`test/keyboard-e2e.js` 가 잡는다.

`gori-app.css` 는 `index.html` 의 `<style>` **보다 먼저** 실린다. 같은 굵기면
뒤에 오는 `index.html` 이 이기므로, index.html 에 이미 있는 선택자를
`gori-app.css` 에서 다시 잡으면 **조용히 무시된다.** 이길 때는 `html` 을 하나
붙여 굵기를 올린다 (`html .ha-btn{...}`). 실제로 겪은 버그다 — 실시간 띠의
애니메이션을 늦추는 규칙이 통째로 먹히지 않았다.

**사용자가 쓴 글을 화면에 찍을 때는 반드시 `esc()` 를 통과시킨다.**
`gori-app.js` 의 `esc()` 는 IIFE 안에 갇혀 있어 `index.html` 에서 쓸 수 없다 —
그래서 index.html 에 **따로 하나 더** 두었다. 이 파일에서 렌더러를 새로 쓸 때는
그 `esc()` 를 쓸 것. 안 쓰면 업체명에 넣은 `<img onerror=...>` 가 남의
브라우저에서 실행된다. 실제로 16곳이 뚫려 있었다. `test/xss-e2e.js` 가 잡는다.

쓰는 사람 중에 연세 있는 분이 많다. 새로 넣는 글씨는 **12px 미만 금지**,
누르는 것은 **40px 이상**. `test/ease-e2e.js` 가 화면마다 전수로 잡는다.

## 운영자가 해야 할 설정

`README.md` 의 "남은 것 · 켜야 할 것" 표를 볼 것. 특히 **RLS**(`db/phase4_admin.sql`
5번 블록)는 켜지 않으면 anon 키로 데이터를 지울 수 있다.
