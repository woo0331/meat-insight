# 테스트

실제 Chromium 으로 `index.html` 을 띄우고, Supabase 대신 `fake-sb.js` 의
가짜 클라이언트를 주입해 확인합니다. **실제 DB 에는 아무 것도 쓰지 않습니다.**

```bash
npm i -D playwright && npx playwright install chromium   # 최초 1회
node test/run.js              # 전부
node test/run.js router edit  # 이름으로 골라서
```

각 파일은 단독 실행도 됩니다: `node test/router-e2e.js`

| 파일 | 확인하는 것 |
|---|---|
| `e2e.js` · `e2e3.js` | 요청 등록 → 견적 → 선택 → 거래, 채팅·인증·시세 |
| `onboard-e2e.js` | 업체 온보딩 4단계, 사진 업로드 |
| `router-e2e.js` | URL 라우팅, 뒤로가기, 공유 링크 복원 |
| `filter-e2e.js` | 목록 검색·정렬 |
| `edit-e2e.js` | 요청 수정·삭제, 견적 철회 |
| `market-e2e.js` | 시세 (데이터 있음/없음/테이블 없음) |
| `jobs-e2e.js` | 구인구직 두 출처 통합, 지원 동선 |
| `find-e2e.js` | 비로그인 요청 조회 |
| `live-e2e.js` | 실시간 갱신 (Realtime 켬/끔) |
| `guard-e2e.js` | 거래 무결성 (마감·중복·권한·전화번호) |
| `pwa-e2e.js` | 홈 화면에 추가, 서비스 워커 (localhost 서버를 띄웁니다) |
| `notif-e2e.js` | 알림 전체 읽음, 하단 네비 뱃지 |
| `content-e2e.js` | 홈 콘텐츠, 지어낸 내용이 없는지 |
| `gate-e2e.js` | 레거시 관리 화면 접근 차단 |
| `a11y-e2e.js` | 키보드 조작, 본문 바로가기, 포커스 표시 |
| `offline-e2e.js` | 연결 실패 안내, 카카오 로그인 |
| `stale-e2e.js` | 오래된 요청 표시·접기 |
| `admin-e2e.js` · `admin-find-e2e.js` | 관리자 콘솔, 표 검색 |

## 주의

- `fake-sb.js` 는 Supabase 를 흉내 낸 것이라 **실제 서버 동작과 다를 수 있습니다.**
  특히 RLS(행 단위 권한)는 흉내 내지 않으므로, 권한 테스트는 화면 차단만 확인합니다.
- 인터넷이 막힌 환경에서는 폰트·CDN 요청이 실패해 `DOMContentLoaded` 가 늦게
  옵니다. 각 테스트가 넉넉히 기다리는 이유입니다.
