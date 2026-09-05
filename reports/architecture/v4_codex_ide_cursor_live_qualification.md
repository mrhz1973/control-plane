# V4 Codex IDE in Cursor — live qualification evidence

**Date:** 2026-09-05
**Repository:** `mrhz1973/control-plane`
**Qualification status:** `NOT_YET_FULLY_QUALIFIED`

## Verified live evidence

- The official OpenAI Codex IDE extension is installed in Cursor IDE.
- Authentication uses the operator's ChatGPT Plus subscription, not an OpenAI API key.
- The Codex Agent UI is functional.
- Observed model choices include `GPT-5.6 Sol`, `GPT-5.6 Terra`, `GPT-5.6 Luna`, `GPT-5.5`, and `GPT-5.4 Mini`.
- Observed reasoning levels are `Minimal`, `Light`, `Medium`, `High`, `Extra High`, `Max`, and `Custom`.
- `GPT-5.6 Sol` with `High` reasoning completed the bounded repository read: `CODEX_IDE_REPO_READ=PASS`.
- The read correctly identified `WORKSTREAM=V4_ADDITIVE_EXECUTION_RUNTIME`, `ACTIVE_BLOCK=V4_LOCAL_DEV_N8N_ALWAYS_ON_LIVE_FAST_TRACK_V1`, and `N8N_ALWAYS_ON=LIVE / PASS`.
- TASK DELTA generation for GitHub issue #33 completed successfully using the verified `origin/main` HEAD and a preset SHA already supported by repository evidence: `TASK_DELTA_GENERATION=PASS_WITH_ORCHESTRATOR_LEANING`.
- The first bounded-edit attempt stopped before modification because the local HEAD was stale: `FAIL_CLOSED_BEHAVIOR=PASS`.

## Remaining gate and policy

- Quota and usage accounting source: `PENDING`.
- The Codex IDE route is not yet fully qualified.
- Project policy permits Codex/OpenAI usage through the ChatGPT Plus subscription only.
- OpenAI API key/BYOK usage is `OUT_OF_SCOPE`.
- GPT-6 Astra qualification is tracked separately in GitHub issue #35.
