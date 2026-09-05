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

주의: `renderHeaderUser` · `paintBell` · `renderRequestDetail` · `renderQuotes` ·
`quoteRow` 같은 이름은 IIFE 안의 지역 함수라 **`window.` 에 없다.** 감쌀 때는
지역 바인딩을 직접 재할당해야 한다. `window.X = ...` 로 감싸면 조용히 아무 일도
일어나지 않는다.

## 확인

```bash
node build.js --check                    # 빌드 최신인지
node --check gori-app.js                 # 문법
cmp index.html meat_insight_main.html    # 미러 일치
node test/run.js                         # 회귀 21종 (playwright 필요)
```

바꾼 화면은 **데스크톱과 모바일(390px) 둘 다** 실제로 띄워 보고, 가로 스크롤이
생기지 않는지 확인한다.

## 운영자가 해야 할 설정

`README.md` 의 "남은 것 · 켜야 할 것" 표를 볼 것. 특히 **RLS**(`db/phase4_admin.sql`
5번 블록)는 켜지 않으면 anon 키로 데이터를 지울 수 있다.
