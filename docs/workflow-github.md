# GitHub 로 주고받는 작업 흐름 — 구성안

날짜 2026-11-12 · 저장소 `woo0331/meat-insight` (**공개 저장소**)

목적 — 대표가 ChatGPT 와 Claude 사이에서 **내용을 복사하지 않게** 합니다.
시안 · 지시 · 완료 기준을 저장소에 두고, 일감마다 Issue 와 가지를 내고,
결과를 PR 로 내고, 검수 의견을 그 PR 에서 받습니다.

⚠️⚠️⚠️ **이 저장소는 공개입니다.** Issue · PR · `docs/` 에 적는 것은
전부 **누구나 읽습니다.** 키 · 토큰 · 손님 연락처 · 개인 이메일은 한 글자도
적지 않습니다(작업 기억의 "키를 저장소에 적지 마세요" 가 여기도 그대로).
시안 이미지도 마찬가지입니다 — 사업 계획이 담긴 장면이면 비공개로 옮기신
뒤에 올리세요.

---

## 0. 지금 서 있는 것 (제가 눌러서 확인했습니다)

| 무엇 | 상태 | 근거 |
|---|---|---|
| 저장소 읽기 · 쓰기 | **됩니다** | 이 세션이 GitHub API 로 Issue 목록을 읽었습니다(0건) |
| Issue · PR · 댓글 · 가지 만들기 | **됩니다** | 같은 통로(`mcp__github__*`)에 그 도구들이 있습니다 |
| 검사 자동 실행 | **있습니다** | `.github/workflows/ship.yml` — `claude/**` 에 push 하면 `node tools/ship.js` 전부 |
| 배포 단추 | **있습니다** | 같은 워크플로의 `workflow_dispatch` + `deploy: true` → `ship.js --merge` |
| Issue · PR 서식 | **없습니다** | `.github/` 에 `ISSUE_TEMPLATE` · `pull_request_template.md` 가 없습니다 |
| Claude GitHub App | **확인 못 했습니다** | 설치 여부는 저장소 **관리자 설정**이라 여기서 못 봅니다 |
| Vercel 미리보기(Preview) | **확인 못 했습니다** | Vercel 설정이라 여기서 못 봅니다. 2026-11-07 에 Production Branch 가 어긋나 있던 그 화면입니다 |

---

## 1. 저장소에 두는 것 (§1 — 지금 바로 됩니다)

```
docs/spec/<번호>-<이름>.md      확정 지시서 원문 + 완료 기준
docs/spec/<번호>/*.png          그 지시의 시안 이미지
docs/category-redesign-*.md     조사 · 차이 보고 (지금 둘 있습니다)
CLAUDE.md                       절대 규칙 · 함정 — Claude 가 매번 읽습니다
```

⚠️ **확정 지시서는 원문 그대로** 둡니다. 제가 요약해서 두면 요약이 썩고,
다음 차수가 썩은 요약을 읽습니다(이 저장소가 여러 번 겪은 자리입니다).

⚠️⚠️ **완료 기준을 지시서 안에 같이** 적습니다 — "무엇이 되면 끝인가" 가
문서 밖에 있으면 PR 에서 그 줄을 세울 수가 없습니다.

---

## 2. 일감 하나 = Issue 하나 = 가지 하나 (§2)

```
Issue #12  「확정 시안 ⑨ 인력·비즈니스 화면」
  라벨 : spec:09-career · area:screen · needs:db
  본문 : docs/spec/09-career.md 로 가는 링크 + 완료 기준 체크박스

가지   : claude/09-career            ← Issue 번호나 이름으로
PR     : 「⑨ 인력·비즈니스 — 화면 · DB」  (Closes #12)
```

⚠️⚠️⚠️ **한 가지에는 한 사람(또는 한 에이전트)만** 올립니다.
둘이 같은 가지에 밀면 늦게 민 쪽이 앞사람 것을 덮거나 `ship.yml` 의
`concurrency: ship-main` 에서 줄을 서다 한쪽이 ff 에 실패합니다.
→ 규칙: **Issue 를 맡은 사람이 그 가지의 임자**입니다. 다른 사람이 손대려면
먼저 Issue 에 「넘겨받습니다」를 적고, 임자가 그 가지에 **더 안 민다**고
답한 뒤에 시작합니다.

⚠️ 지금 쓰는 가지는 `claude/git-branch-workflow-j74dol` 하나입니다.
Issue 별로 가르면 `ship.yml` 의 `branches: ["claude/**"]` 가 그대로 받습니다
(워크플로를 고칠 것이 없습니다).

---

## 3. PR 에 무엇을 내는가 (§3)

PR 본문에 **다섯 칸**을 고정으로 둡니다 (`.github/pull_request_template.md`
로 박아 둡니다 — 제가 만들어 두면 PR 을 열 때마다 저절로 나옵니다).

```markdown
## 무엇을 바꿨나
- 파일과 커밋

## 시안 대비 차이와 까닭
- 다르게 한 것마다 한 줄씩 (같게 한 것은 안 적습니다)

## 화면 (PC · 모바일)
- PC 1280px / 폰 360px 캡처

## 검사
- 통과 / 실패 / **미검증** 을 갈라서. 건너뛴 묶음이 있으면 "전부 초록" 이라고
  적지 않습니다

## 운영 DB · 배포
- 필요한 마이그레이션 번호 / 롤백 방법 / **아직 적용 안 했음**
```

### 캡처를 PR 에 싣는 길 — 둘
1. **가지에 같이 커밋**합니다 (`docs/preview/<Issue 번호>/pc.png`).
   PR 본문에서 그대로 보입니다. 추가 인증이 **필요 없습니다.**
   ⚠️ 저장소가 무거워집니다 — 합친 뒤 지우는 커밋을 같이 냅니다.
2. **Vercel Preview 주소**를 적습니다. Vercel 이 이 저장소의 가지를
   미리보기로 올리고 있다면 PR 마다 주소가 하나 생깁니다.
   ⚠️ **지금 그렇게 돌고 있는지 제가 확인하지 못했습니다** — Vercel →
   Project → Settings → Git 에서 Preview Deployments 가 켜져 있는지만
   보시면 됩니다. 켜져 있으면 1번보다 훨씬 좋습니다(실제로 눌러 볼 수
   있습니다).

⚠️⚠️ 어느 쪽이든 **미리보기는 `SITE_LIVE=false`** 입니다 — 모든 화면에
noindex 가 붙고 검색에 안 올라갑니다. 손님 화면이 바뀌는 것이 아닙니다.

---

## 4. 검수 의견을 받아 이어서 고치기 (§4)

```
검수자(ChatGPT 또는 대표)가 PR 에 댓글/리뷰를 답니다
        ↓
Claude 가 그 PR 을 보고 있다가 고쳐서 같은 가지에 push
        ↓
ship.yml 이 다시 돌아 초록/빨강을 PR 에 붙입니다
        ↓  (반복)
초록 + 검수 통과 → 대표가 Actions 에서 deploy 단추
```

지금 이 세션은 **PR 을 구독해서** 댓글 · CI 결과를 받아 이어서 고칠 수
있습니다(세션이 살아 있는 동안). 세션이 끝난 뒤에도 돌게 하려면 §5 의
GitHub Action 이 필요합니다.

---

## 5. 승인된 일감을 자동으로 돌리기 — Claude Code GitHub Action

공식 문서에서 확인한 내용입니다(2026-11-12 · code.claude.com).

### 설치 (대표가 한 번)
1. **Claude GitHub App** 을 이 저장소에 설치합니다 — https://github.com/apps/claude
   (저장소 **admin** 권한이 필요합니다)
2. 저장소 Secrets 에 **인증값 하나**를 넣습니다
   - `CLAUDE_CODE_OAUTH_TOKEN` — 구독(Pro · Max 등)으로 쓰실 때.
     `claude setup-token` 으로 만듭니다 ← **이쪽을 권합니다**(API 과금이
     따로 안 붙습니다)
   - 또는 `ANTHROPIC_API_KEY` — API 키로 쓰실 때
   넣는 자리: GitHub → 저장소 → Settings → Secrets and variables →
   Actions → New repository secret
3. 워크플로 파일 `.github/workflows/claude.yml` 을 올립니다
   (제가 만들어 둘 수 있습니다 — 아래 §5-2)

⚠️⚠️ 더 쉬운 길: 대표 컴퓨터의 Claude Code 에서 **`/install-github-app`**
한 줄이면 1·2·3 을 알아서 합니다(GitHub CLI 로그인이 먼저 필요합니다).

⚠️⚠️⚠️ **값을 채팅에 붙여 넣지 마세요.** 토큰은 GitHub Secrets 칸에만
넣습니다. 저는 그 값을 받을 필요도 없고 받아서도 안 됩니다.

### 5-2. 워크플로 (예시 — 올리기 전에 같이 보십니다)

```yaml
name: Claude
on:
  issue_comment:        { types: [created] }
  pull_request_review_comment: { types: [created] }
jobs:
  claude:
    if: contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-24.04        # ⚠️ latest 를 쓰지 않습니다 (ship.yml 과 같은 까닭)
    timeout-minutes: 30          # ⚠️ 비용 한도 ①
    concurrency:                 # ⚠️ 같은 PR 에 두 번 안 돕니다
      group: claude-${{ github.event.issue.number }}
      cancel-in-progress: false
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
      actions: read
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 1 }
      - uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          claude_args: "--max-turns 15"   # ⚠️ 비용 한도 ②
```

### 5-3. 누가 `@claude` 를 부를 수 있나
공식 문서의 규칙입니다 —
- 부른 사람이 저장소에 **쓰기 권한**이 있어야 합니다
- **봇은 거절**합니다(루프 방지). `allowed_bots` 에 적은 봇만 됩니다
→ 그래서 ChatGPT 쪽 계정에 쓰기 권한을 주면 ChatGPT 가 `@claude` 로
   일을 시킬 수 있고, 안 주면 **대표만** 시킬 수 있습니다.

### 5-4. 자동 재작업의 한도 (대표 지시)
| 한도 | 어디에 | 값 |
|---|---|---|
| 한 번에 도는 시간 | `timeout-minutes` | 30분 |
| 모델이 도는 횟수 | `claude_args: --max-turns` | 15 |
| 같은 PR 동시 실행 | `concurrency` | 1개 |
| 한 PR 당 왕복 | **사람이 셉니다** | 3회 — 넘으면 Claude 가 멈추고 Issue 에 「무엇이 막혔는지」만 적습니다 |

⚠️⚠️ 마지막 줄은 기계가 못 셉니다(GitHub 에 그런 칸이 없습니다). PR 본문
체크박스로 두고, 3회째 push 에 Claude 가 **멈추고 묻게** 지시서에 적습니다.

### 5-5. 승인 단계로 **분리**하는 것 (자동으로 안 합니다)
| 일 | 누가 |
|---|---|
| 운영 DB 마이그레이션 적용 | **대표만** (Supabase SQL 편집기에 직접 붙여넣기) |
| 관리자 권한 · 역할 변경 | **대표만** |
| `main` 으로 합치기 = **배포** | **대표만** — Actions → 「검사 (배포는 단추로)」 → deploy ✓ |
| 가지에 코드 올리기 · PR 열기 · 댓글 | Claude 가 합니다 |

⚠️ `ship.yml` 은 지금도 **push 만으로는 main 을 안 움직입니다.** 그
설계를 그대로 둡니다 — 사업자 정보 여덟 칸이 빈 채로 나가면 전자상거래법
제10조입니다.

---

## 6. ChatGPT 쪽에 필요한 연결 (§6)

### ⓐ **읽기 — 아무 연결도 필요 없습니다**
이 저장소는 **공개**라, ChatGPT 가 주소만으로 파일 · Issue · PR · 차이를
읽습니다.
```
https://github.com/woo0331/meat-insight/blob/main/docs/spec/09-career.md
https://github.com/woo0331/meat-insight/pull/12/files
```
⚠️ ChatGPT 의 **GitHub 커넥터**(Deep research 등)를 붙이면 비공개
저장소도 읽지만, OpenAI 의 안내에 따르면 그 커넥터는 **읽기 전용**입니다.

### ⓑ **검수 의견 남기기 — 셋 가운데 하나**
| 길 | 필요한 것 | 평 |
|---|---|---|
| ① 대표가 한 번 붙여넣기 | 없음 | 지금 당장 됩니다. **왕복마다 한 번**으로 줄어듭니다(지금은 여러 번) |
| ② ChatGPT 용 GitHub 계정 + **fine-grained PAT** | 대표가 PAT 발급 · ChatGPT 에 Action 으로 연결 | 권한을 **이 저장소 · Issues·PR 쓰기**로만 좁힐 수 있습니다 |
| ③ OpenAI Codex 연결 | Codex 쓰기 권한 | 코드도 밀 수 있어 **권한이 넓습니다** — 같은 가지에 둘이 미는 사고가 납니다 |

**권하는 것은 ①로 시작해 ②로 옮기는 것**입니다. ③은 §2 의 "한 가지에
한 사람" 을 깨기 쉽습니다.

### ②를 고르실 때 PAT 에 줄 권한 (최소)
```
Fine-grained personal access token
  Resource owner : woo0331
  Repository     : meat-insight 하나만
  Repository permissions
    Issues        : Read and write     ← 검수 의견 · 수정 요청
    Pull requests : Read and write     ← 리뷰 댓글
    Contents      : Read-only          ← 코드 읽기 (쓰기는 주지 않습니다)
    Metadata      : Read-only (자동)
  Expiration     : 90일
```
⚠️ **Contents 를 쓰기로 주지 마세요** — 읽기만으로 검수는 다 됩니다.
⚠️ 그 계정이 `@claude` 를 부르려면 저장소에 **Write** 로 초대해야 합니다
(§5-3). 안 부르게 하시려면 초대하지 않습니다 — 그러면 대표가 `@claude` 를
부르는 사람이 됩니다.

---

## 7. 한 바퀴 — 실제로 어떻게 보이는가

```
대표  : 시안과 지시를 올립니다           → docs/spec/09-career.md + png
Claude: Issue #12 을 열고 완료 기준을 체크박스로 옮깁니다
Claude: claude/09-career 가지에서 작업 → push
GitHub: ship.yml 이 검사 전부 → PR 에 초록/빨강
Claude: PR 을 열고 다섯 칸을 채웁니다(캡처 · 차이 · 검사 · 롤백)
ChatGPT: PR 을 읽고 검수 의견을 답니다(ⓑ 의 ①~③ 가운데 하나)
Claude: 고쳐서 같은 가지에 push (최대 3왕복)
대표  : 됐다 싶으면 Actions → deploy ✓  ← 이때만 손님 화면이 바뀝니다
대표  : 마이그레이션이 있으면 Supabase 에 직접 붙여넣기
```

---

## 8. 이제 해야 할 것 — 셋으로 갈라 적습니다

### 지금 바로 됩니다 (제가 합니다 · 추가 인증 없음)
- [ ] `.github/pull_request_template.md` — §3 의 다섯 칸
- [ ] `.github/ISSUE_TEMPLATE/` — 「작업 지시」 · 「고장 신고」 둘
- [ ] `docs/spec/` 로 확정 지시서 · 시안 옮기기
- [ ] `CONTRIBUTING.md` — 가지 이름 규칙 · 한 가지 한 사람 · 승인 단계
- [ ] 남은 카테고리 Issue 아홉 개 열기

### 대표가 한 번 하셔야 합니다
- [ ] Claude GitHub App 설치 + Secret 하나 (§5) ← **또는 `/install-github-app`**
- [ ] Vercel 의 Preview Deployments 가 켜져 있는지 확인 (§3)
- [ ] ChatGPT 쪽을 ②로 가실 거면 fine-grained PAT 발급 (§6)

### 별도 프로그램이 필요합니다
- ChatGPT 가 **스스로** GitHub 에 쓰려면 — GitHub 커넥터만으로는 안 되고
  Custom GPT 의 Action(PAT) 또는 Codex 가 필요합니다 (§6 ⓑ)
- 그 밖에는 **없습니다.** 나머지는 전부 GitHub 과 저장소 안에서 돕니다.

---

## 9. 적어 두는 위험 셋

1. **공개 저장소** — Issue · PR · `docs/` 가 전부 공개입니다. 시안에
   사업 계획 · 매출 · 개인정보가 보이면 올리기 전에 가리세요.
2. **공개 저장소의 포크 PR 에는 Secrets 가 안 갑니다**(GitHub 규칙).
   그래서 `@claude` 는 **이 저장소 안의 가지**에서만 돕니다. 바깥에서
   포크해 온 PR 에는 안 돕니다 — 그게 맞습니다.
3. **GitHub 은 기본 토큰으로 만든 커밋에 CI 를 안 돌립니다.**
   `claude.yml` 에 `github_token: ${{ secrets.GITHUB_TOKEN }}` 을 넣지
   마세요 — 넣으면 Claude 가 민 커밋에 `ship.yml` 이 **안 돕니다**
   (검사 없이 지나가는 커밋이 생깁니다).
