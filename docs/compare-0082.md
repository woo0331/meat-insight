# 비교견적 (0082) — 운영에 올리는 법 · 영향 · 되돌리기

작성 2026-11-15 · ⚠️ **운영 DB 에는 아직 안 올렸습니다.** 로컬 Postgres 에서만 적용하고 검사했습니다.

## 무엇이 바뀌나

| 자리 | 바뀌는 것 | 기존 회원 · 자료 영향 |
|---|---|---|
| `request` | `compare` 칸 더함 (기본 false) | 기존 줄은 전부 false — 한 업체 흐름 그대로 |
| `request` 의 select 권한 | **성함 · 연락처 · 이메일 · tel_key 칸을 표에서 거둠** → `v_request_contact` 보기로만 | 화면이 보여 주던 것은 같음. **업체가 수락 전에 API 로 읽던 길**만 닫힘 |
| `assignment` | `blind` 칸 더함 · `agree3rd_at` 의 not null 을 풀고 「blind 가 아니면 동의 시각 필수」 check 로 바꿈 | 기존 줄은 전부 동의 시각이 있어 check 를 통과 |
| `quote` | `kind`(예상/확정) · `terms`(비교 항목) 칸 더함 | 기존 견적은 kind 가 비어 있음 (화면이 비교표에서만 씀) |
| 새 문 다섯 | `make_compare_request` · `assign_more` · `answer_compare` · `submit_compare_quote` · `pick_quote` | 옛 문은 **하나도 덮지 않음** |
| 트리거 둘 | 옛 문이 **비교 요청**의 견적 · 배정을 건드리면 거절 | 비교 요청이 아닌 줄에는 아무 일도 안 함 |

## 올리는 차례 (사장님 승인 뒤에만)

1. Supabase SQL Editor 에서 `db/pre-apply.sql` (기본 권한을 좁힘 — 새 함수가 anon 에게 열린 채 태어나지 않게)
2. `db/apply-0082.sql` (0082 한 파일 — **0001~0081 은 다시 돌리지 않습니다**)
3. `db/post-apply.sql` (기본 권한 복원)
4. `db/verify.sql` — 판 번호 82 확인
5. 저장소에서 `js/data/site.js` 의 `compareOn` 을 `true` 로 바꾸고 전체 검사 → 배포
   - ⚠️ **5 를 2 보다 먼저 하면 안 됩니다.** 켜진 화면이 없는 칸 · 보기를 부르면
     업체 작업실 · 내 정보 · 운영자 배정이 **빈 채로** 남습니다.
   - ⚠️⚠️ **2 를 하고 5 를 오래 미루면 안 됩니다.** 0082 가 표의 연락처 칸을 거두므로,
     꺼진 화면(옛 질의 `request?select=…,name,tel,email`)이 거절당합니다 —
     업체 작업실 · 운영자 배정이 **빈 채로** 남습니다. 2 와 5 를 같은 시간에 하세요.

## 되돌리기

`db/migrations/0082_compare_quote.sql` 맨 아래 주석에 있습니다. 순서:
`compareOn` 을 false 로 배포 → 함수 · 트리거 · 보기를 내림 → `grant select on request to authenticated` 로 표 권한 복원.
⚠️ 비교 요청이 한 건이라도 들어온 뒤에는 칸(`compare` · `blind` · `kind` · `terms`)을 지우지 마세요 — 그 줄의 조건이 사라집니다.

## 아직 정하지 않은 것 (화면이 약속하지 않습니다)

- 요청당 배정 업체 수 상한 (검토 중인 3곳은 확정 정책이 아니라 DB 가 막지 않습니다)
- 업체 응답 기한 · 무료 입점 · 수수료 — 화면에 적지 않았습니다
- 새 요청 · 새 견적을 문자 · 카카오로 알리기 — 보내지 않습니다(내 정보 · 업체 작업실에서 확인)
