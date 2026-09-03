# 고리 (aboutmeat.co.kr)

**축산업에 필요한 모든 연결, 고리** — 원육 구매부터 가공·OEM, 물류, 인력, 당일알바,
구인구직, 장비·부자재, 창업·인테리어, HACCP·컨설팅까지 축산업에 필요한 업체와 사람을
연결하는 요청·견적 매칭 플랫폼입니다.

## 핵심 흐름

```
요청 등록 → 조건 매칭 → 견적·지원 도착 → 비교 → 선택 → 거래 진행 → 완료 → 후기·평점
```

## 기술 스택

- 프레임워크·빌드 도구 없는 정적 HTML / CSS / JavaScript
- Supabase (Postgres + Auth)
- Vercel 배포

## 파일 구조

| 파일 | 역할 |
|---|---|
| `index.html` | 메인 SPA (홈·요청·업체·시세·뉴스·커뮤니티·구인·거래관리) |
| `meat_insight_main.html` | `index.html` 과 동일한 사본. 다른 페이지들이 홈으로 링크하고 있어 유지합니다. **수정 시 두 파일을 함께 갱신하세요.** |
| `gori-app.css` | 요청 3단계 · 견적 비교 · 당일알바 · 거래관리 스타일 |
| `gori-app.js` | 위 기능의 애플리케이션 로직 |
| `db/phase2_schema.sql` | DB 확장 스크립트 (추가 전용) |
| `dashboard.html` | 운영 허브 |
| `purchase_request.html` / `suppliers.html` / `jobs.html` | 관리자 CRUD |
| `meat_insight_*.html` | 창업 컨설팅 브랜드 페이지 (신청·진단·계산기·사례·파트너·리포트·관리자) |

## 최초 1회 설정

견적 비교 · 당일알바 · 후기 · 알림 · 관심업체 기능은 신규 테이블이 필요합니다.

1. Supabase 대시보드 → **SQL Editor**
2. `db/phase2_schema.sql` 내용을 붙여넣고 **Run**

스크립트는 **추가 전용**입니다. `DROP` / `DELETE` / `TRUNCATE` 가 없고, 기존 컬럼을
변경하지 않으며, 여러 번 실행해도 안전합니다.

실행 전에도 사이트는 정상 동작합니다. 신규 테이블이 필요한 화면에는 안내 문구가 뜨고,
요청 등록은 기존 컬럼만으로 자동 저장됩니다.

## ⚠️ 보안 점검 필요

`suppliers.html` · `jobs.html` · `purchase_request.html` 은 브라우저에 노출되는 anon 키로
`UPDATE` · `DELETE` 를 실행합니다. 해당 테이블에 RLS 정책이 없다면 URL 을 아는 누구나
데이터를 삭제할 수 있습니다. `db/phase2_schema.sql` 하단의 **4. 보안 강화** 항목을
확인하고, 관리자 인증을 붙인 뒤 RLS 를 적용하세요.

## 카테고리 매핑

`suppliers.html` 은 `냉장물류`·`기자재·장비`·`HACCP·위생` 으로, 메인은 `물류`·`장비`·`HACCP`
으로 저장해 필터가 어긋나 있었습니다. DB 값을 바꾸지 않고 `gori-app.js` / `index.html` 의
`CATS8[].legacy` 매핑에서 흡수합니다. 새 표기가 생기면 이 배열에 추가하세요.
