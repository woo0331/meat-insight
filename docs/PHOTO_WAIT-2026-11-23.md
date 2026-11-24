# 사진형 카드 — 사진 자리 현황 (2026-11-23)

## ⚠️ 2026-11-24 두 번째 갱신 (대표 지시)

- **운영 절차 03 · 04 이름 복원** — '업체 연결' · '진행 · 관리'. 03 은 사장님과 업체가 작업 범위를 맞추는 장면이라
  폐업 페이지의 `kp-cl-pro-quote`(현장 견적) 사진을 같이 씁니다(다른 페이지 · 같은 화면 반복 아님). 04 는 일정 노트 사진(`kp-op-pro-run`).
  ZIP 의 `operations_process-prioritize`(메모지 정리)는 장면이 안 맞아 쓰지 않습니다 — 원본은 ZIP 에 그대로.
- **양도 탭 '계약 · 인계'** = 열쇠 · 인계 서류(`kp-tr-pro-ready`). 위 '계약 가이드'(서류 검토)와 다른 장면입니다.
  '자료 준비' 는 창업 페이지의 서류 사진(`kp-st-svc-permit`)을 같이 씁니다.
- **남은 빈 자리 하나 — `kp-tr-pro-search`** (양도양수 절차 01 '매장 탐색' · 양도 탭 '다음 사장님 찾기').
  이 작업 환경에는 이미지 생성 도구가 없어 아이콘 판으로 둡니다.
  필요한 사진: **노트북 화면의 지도에서 상권과 점포 위치를 비교하는 장면** · 960×660(16:11) · WebP ·
  120KB 이하 · '매물 찾기'(노트북으로 매물 목록을 보는 장면)와 구도가 겹치지 않게 · 화면 속 글자 · 상호가 읽히지 않게.
  파일을 `img/kp/kp-tr-pro-search.webp` 로 두고 photos.js 에 한 줄이면 코드를 안 고칩니다.

## ⚠️ 2026-11-24 갱신 — storeway-ai-assets.zip 23장 적용

대표가 준 ZIP(WebP 23 · 카드 22 + 폐업 비용 배너 1)을 자리 이름으로 바꿔 `img/kp/` 에 넣었습니다.
원본 WebP 그대로이고 JPG 는 같은 크기로 바꾼 것입니다(확대 없음). 모두 AI 연출 사진 — 실제 고객 · 거래 · 매물로 소개하지 않습니다.

| ZIP 파일 | 자리 | 카드 |
|---|---|---|
| startup-location | kp-st-svc-area | 창업 · 상권 · 입지 분석 |
| startup-permit | kp-st-svc-permit | 창업 · 인허가 · 행정 |
| startup-requirements | kp-st-pro-check | 창업 절차 01 조건 확인 |
| startup-design-estimate | kp-st-pro-design | 창업 절차 02 설계 · 견적 |
| operations_service-supply · staff · pos · repair | kp-op-svc-* | 운영 핵심 서비스 넷 |
| operations_process-choose-issue | kp-op-pro-pick | 운영 절차 01 |
| operations_process-audit | kp-op-pro-check | 운영 절차 02 |
| operations_process-prioritize | kp-op-pro-link | 운영 절차 03 — **단계 이름을 '맡길 일 정리' 로 맞춤** |
| operations_process-action-plan | kp-op-pro-run | 운영 절차 04 — **단계 이름을 '업체 연결 · 진행' 으로 맞춤** |
| transfer_service-search | **kp-tr-svc-search (새 자리)** | 양도양수 · 매물 찾기 (전에는 insu-hero) |
| transfer_service-list-shop · premium · contract-guide | kp-tr-svc-sell · premium · contract | 양도양수 핵심 서비스 |
| transfer_process-inspect · negotiate · handover | kp-tr-pro-visit · nego · ready | 양도양수 절차 02 · 03 · 04 |
| closure-inquiry · site-estimate · tax | kp-cl-pro-consult · quote · kp-cl-svc-tax | 폐업 |
| closure-cost-banner | kp-cl-ban-cost | 폐업 비용 배너 |

**아직 비어 있는 자리 하나 — `kp-tr-pro-search`** (양도양수 절차 01 '매장 탐색' · 양도 쪽 '다음 사장님 찾기').
ZIP 에 이 장면이 없습니다. 노트북 지도로 매장을 찾는 장면, 권장 960×660.

양도 쪽(?t=out) 절차 04 '계약 · 인계' 는 kp-tr-svc-contract 를 씁니다 — 같은 화면 위 '계약 가이드' 카드와 겹칩니다.

카테고리 네 페이지의 **핵심 서비스 4 · 진행 절차 4** 카드 사진입니다.
사진이 없는 자리는 같은 크기의 큰 아이콘 판으로 섭니다 (빈 액자 · "준비 중" 없음).

## 넣는 법

1. 권리가 확인된 사진을 `img/raw/<자리 이름>.jpg` 로 둡니다.
2. `node tools/fit-photos.js` → `node tools/check-photos.js`
3. `js/data/photos.js` 의 `WOW_PHOTOS` 에 한 줄 (fit-photos `--write` 는 통째로 다시 쓰니 되읽어 보세요)

화면 코드는 고치지 않습니다 — 자리 이름이 이미 카드에 걸려 있습니다.

**권장 크기:** 960×660 (16:11) · 최소 640×440 · 120KB 이하 · 글자 · 상호 · 로고가 읽히지 않을 것.
화면 칸은 PC 234×161(서비스) · 306×172(절차), 폰 168×126 · 153×115 입니다.

## 시안 PNG 를 잘라 쓰지 않은 까닭

시안(1024×1536) 안의 카드 사진은 서비스 약 180×128 · 절차 약 225×110 입니다.
화면 칸보다 작아 PC 에서 1.3~1.6배, 폰 고해상도 화면에서 약 3배 확대가 됩니다 — 흐려집니다.

## 완료 대기 (사진 미확보)

| 자리 이름 | 카드 | 필요한 장면 |
|---|---|---|
| kp-st-svc-area | 창업 · 상권 · 입지 분석 | 상가 거리 · 점포 외관 |
| kp-st-svc-permit | 창업 · 인허가 · 행정 | 영업 신고 서류 · 도장이 놓인 책상 |
| kp-st-pro-check | 창업 절차 01 조건 확인 | 지도 · 상권 자료를 놓고 입지를 검토하는 손 |
| kp-st-pro-design | 창업 절차 02 설계 · 견적 | 평면도 · 마감재 견본 위 견적 작업 |
| kp-op-svc-supply | 운영 · 식자재 · 납품 | 납품 상자 · 채소 · 원두가 들어오는 장면 |
| kp-op-svc-staff | 운영 · 인력 · 노무 | 근무표 · 태블릿을 보는 직원 |
| kp-op-svc-pos | 운영 · POS · 결제 | 계산대 POS 단말 · 카드 결제기 |
| kp-op-svc-repair | 운영 · 시설 · 수리 | 냉난방 · 냉장 설비를 점검하는 기사 |
| kp-op-pro-pick | 운영 절차 01 서비스 고르기 | 노트북 · 휴대폰으로 고르는 사장님 |
| kp-op-pro-check | 운영 절차 02 매장 점검 | 점검표 클립보드에 체크하는 손 |
| kp-op-pro-link | 운영 절차 03 업체 연결 | 업체 담당자와 상담하는 테이블 |
| kp-op-pro-run | 운영 절차 04 진행 · 관리 | 작업이 끝난 매장을 확인하는 장면 |
| kp-tr-svc-sell | 양도양수 · 내 매장 넘기기 | 매장 외관과 양도 안내 |
| kp-tr-svc-premium | 양도양수 · 권리금 계산 | 계산기와 서류가 놓인 책상 |
| kp-tr-svc-contract | 양도양수 · 계약 가이드 | 계약서 클립보드와 펜 |
| kp-tr-pro-search | 양도양수 절차 매장 탐색 (양도: 다음 사장님 찾기) | 노트북 지도로 매장을 찾는 장면 |
| kp-tr-pro-visit | 양도양수 절차 현장 확인 | 매장 안을 둘러보며 확인하는 사람 |
| kp-tr-pro-nego | 양도양수 절차 조건 협의 (양도: 조건 정하기) | 테이블에서 조건을 이야기하는 두 사람 |
| kp-tr-pro-ready | 양도양수 절차 인수 준비 (양도: 자료 준비 · 계약 · 인계) | 서류 봉투 · 파일을 정리하는 책상 |
| kp-cl-svc-tax | 폐업 · 폐업 세무 | 계산기 · 세무 서류를 보는 손 |
| kp-cl-pro-consult | 폐업 절차 01 상담 접수 | 노트북으로 상담 내용을 적는 장면 |
| kp-cl-pro-quote | 폐업 절차 02 현장 확인 · 견적 | 현장에서 견적서 클립보드를 적는 손 |
| kp-cl-ban-cost | 폐업 비용 배너 (오른쪽) | 줄자 · 안전모 · 도면이 놓인 작업대 · 권장 2000×900 |

## 지금 사진이 들어간 카드 (8)

| 페이지 | 카드 | 사진 |
|---|---|---|
| 창업 | 인테리어 · 설계 | svc-interior (마감재 견본 · 도면) |
| 창업 | 주방 · 설비 | svc-equip (업소용 주방 설비) |
| 창업 | 절차 03 시공 · 설비 | hero-start (작업자가 카운터 · 조명 설치) |
| 창업 | 절차 04 오픈 준비 | home-startup (오픈 준비 중인 카페) |
| 양도양수 | 매물 찾기 | insu-hero (넓은 상업 공간) |
| 폐업 | 매장 양도 | insu-transfer (매장 외관 · 상담 테이블) |
| 폐업 | 중고 집기 매각 | svc-equip (업소용 주방 설비) |
| 폐업 | 철거 · 원상복구 | hero-close (작업자가 마감재를 떼는 현장) |
| 폐업 | 절차 03 철거 · 정리 진행 | home-closure (집기를 상자에 담는 사장님) |
| 폐업 | 절차 04 최종 확인 | insu-closure-in (정리된 빈 매장) |

(svc-equip 은 창업 · 폐업 두 페이지에 쓰이지만 한 화면 안에서는 한 번입니다. svc-interior · svc-equip 원본이 267~322px 라 PC 에서 약간 무르게 보입니다 — 같은 장면 고해상도로 바꾸면 좋습니다.)

## 뺀 사진과 까닭

| 카드 | 전에 쓰던 사진 | 까닭 |
|---|---|---|
| 운영 · POS · 결제 | svc-it | CCTV 사진 — 장면이 다름 |
| 운영 · 시설 · 수리 | svc-equip | 조리 냄비 — 수리 장면 아님 |
| 운영 · 인력 · 노무 / 절차 03 | home-ops | 배너와 한 화면에서 세 번 반복 |
| 운영 절차 04 | svc-clean | 청소 도구 — 진행 · 관리 장면 아님 |
| 양도 · 내 매장 넘기기 | insu-operations | 음식점 내부 — 양도 장면 아님 |
| 양도 · 계약 가이드 | home-transfer | 배너와 한 화면 반복 |
| 양도 절차 현장 확인 · 자료 준비 | insu-closure-in | 폐업(정리 중) 사진 |
| 창업 · 상권 · 입지 | insu-transfer | 폐업 · 양도 화면과 겹치고 상권 장면 아님 |
| 창업 절차 01 | home-transfer | 악수 · 계약 장면 — 조건 확인 아님 |
| 폐업 절차 02 | insu-closure-in | 시안처럼 최종 확인(빈 매장)으로 옮김 |
| 폐업 비용 배너 | home-closure | 절차 03 과 한 화면 반복 |
