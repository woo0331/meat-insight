# 운영 DB 적용 상태판 (한 곳에서 관리)

> 갱신은 Claude 가 **Supabase 도구로 직접 조회한 값**으로만 합니다.
> 실행은 사장님이 SQL 편집기에서 **한 파일씩** · 확인되기 전에는 다음 파일로 넘어가지 않습니다.
> 이미 적용된 파일은 다시 실행하지 않습니다. 안전 필터가 막은 작업은 우회하지 않습니다.

| 차례 | 파일 | 상태 | DB 확인 (UTC) | 확인한 것 |
|---|---|---|---|---|
| 1 | `db/pre-apply.sql` | ✅ 적용 | 2026-11-14 | 기본 권한 지문 a3691f6c… |
| 2 | 0001 ~ 0067 | ✅ 적용 | 05:47 | 판 67 |
| 3 | `db/apply-0068-0081/0068_listing_photo.sql` | ✅ 적용 | 06:22 적용 · 06:25 확인 | 판 68 · `listingphoto` 있음 · 16표 지문 동일 |
| 4 | `0069_listing_market.sql` | ✅ 적용 | 06:27 적용 · 06:28 확인 | 판 69 · `listingfav` 있음 · 16표 지문 동일 |
| 5 | `0070_listing_unhide.sql` | ✅ 적용 | 06:29 적용 · 06:31 확인 | 판 70 · `listing.hidden_from` 있음 |
| 6 | `0071_pro_self.sql` | ✅ 적용 | 06:31 적용 · 09:20 확인 | 판 71 · `provider_apply.by_user` · provider 칸 3 · 문 2 |
| 7 | `0072_job_fields.sql` | ✅ 적용 | 09:27 적용 · 확인 | 판 72 · jobpost 칸 4 (09:21 에 0071 이 한 번 더 돌았으나 오류·변화 없음) |
| 8 | `0073_trip.sql` | ✅ 적용 | 09:30 적용 · 09:31 확인 | 판 73 · `trip` · `tripphoto` · `v_trip_photo_mine` 있음 · anon 표 접근 없음 |
| 9 | `0074_range_facility.sql` | ✅ 적용 | 09:32 적용 · 확인 | 판 74 · `provider.range_opts` 있음 |
| 10 | `0075_cq_thumb.sql` | ✅ 적용 | 09:33 적용 · 확인 | 판 75 · `v_cq_public.thumb` · anon 읽기 유지 |
| 11 | `0076_fitting.sql` | ✅ 적용 | 09:34 적용 · 확인 | 판 76 · `provider.fit_ways` 있음 |
| 12 | `0077_trip_depart.sql` | ✅ 적용 | 09:35 적용 · 09:36 확인 | 판 77 · `tripdate` · 출발일 보기 있음 |
| 13 | `0078_job_fav.sql` | ✅ 적용 | 09:37 적용 · 확인 | 판 78 · `jobfav` · `v_job_fav` · anon 표 접근 없음 |
| 14 | `0079_fitting_terms.sql` | ⏳ 다음 | | 판 79 |
| 15 | `0080_join_level_listing_spec.sql` | 대기 | | 판 80 ⚠️ 트랜잭션 없음 |
| 16 | `0081_course_photo.sql` | 대기 | | 판 81 ⚠️ 트랜잭션 없음 |
| 17 | `db/post-apply.sql` | 대기 | | 기본 권한 지문 = 4b42f19c… |
| 18 | 최종 검증 | 대기 | | verify · list-check · 16표 지문 · 백업 |

⚠️ 트랜잭션 없음 = 중간 오류 시 앞부분이 남습니다. **다시 돌리지 말고** 오류 문장을 알려 주세요.
⚠️ 오늘 멈추면 `db/restore-defacl.sql` 로 기본 권한만 복원 → 재개 전 `db/pre-apply.sql` 다시.
