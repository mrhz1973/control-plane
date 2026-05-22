# Operating memory

**Status:** active.

Future chats and agents must read this file before changing CONTROL PLANE n8n automation.

---

## Ready-import n8n credential binding

For CONTROL PLANE ready-import workflow JSON, **credential name alone is not enough**.

If a workflow JSON contains only:

```json
"credentials": {
  "telegramApi": {
    "name": "CONTROL PLANE - Telegram Bot"
  }
}
```

n8n may import Telegram nodes as **red / unbound**.

Ready-import JSON must contain **real n8n credential ids** when the goal is zero manual node repair.

**Current ready-import file:**

```text
workflows/exports/READY_IMPORT_40-control-plane-active-with-credentials.json
```

**Required:**

| Field | Value |
|-------|--------|
| All Telegram nodes `chatId` | `472599368` |
| All Telegram nodes `credentials.telegramApi.name` | `CONTROL PLANE - Telegram Bot` |
| All Telegram nodes `credentials.telegramApi.id` | **real** n8n credential id |
| All GitHub nodes `credentials.githubApi.name` | `GitHub account` |
| All GitHub nodes `credentials.githubApi.id` | **real** n8n credential id |

**Forbidden in ready-import output:**

- `__CONFIGURE_CHAT_ID_IN_N8N_UI__`
- `__REDACTED_N8N_CREDENTIAL_ID__`
- name-only credential blocks (no `id`)

If real credential ids cannot be recovered from n8n API or a **local unredacted export**, **STOP**. Do not generate a fake ready-import file.

**Do not commit:** bot tokens, OAuth secrets, or `.n8n-credential-ids.local.json`.

---

## Build script

```text
scripts/build-ready-import-40.py
```

**Inputs (required — script exits with error if missing):**

| Source | Variables / file |
|--------|------------------|
| Environment | `TELEGRAM_CREDENTIAL_ID`, `GITHUB_CREDENTIAL_ID` |
| Local file (gitignored) | `.n8n-credential-ids.local.json` |

Example local file (create at repo root, never commit):

```json
{
  "telegramCredentialId": "<from n8n UI or unredacted export>",
  "githubCredentialId": "<from n8n UI or unredacted export>"
}
```

**Recover ids without committing them:**

1. n8n UI → Credentials → open each credential → copy id from URL or export.
2. Local unredacted workflow export in Downloads (match by credential **name**).
3. n8n API `GET /api/v1/credentials` with `N8N_API_KEY` (do not print tokens in logs).

---

## Historical note (2026-05-21)

Commit `8b3a468` regenerated ready-import with **name-only** credentials. That output is **invalid** for zero-touch import until rebuilt with real ids via the script above.

---

## Current production state (2026-05-22)

| Item | State |
|------|--------|
| **Production workflow** | `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` — **Published** |
| **Rebuild source** | `workflows/exports/READY_IMPORT_40-control-plane-active-with-credentials.json` with **real credential ids** (`1f62ebd`) |
| **PM-15 smoke** | **PASS** on commit `c0ea042` — [session](sessions/2026-05-22-control-plane-pm15-new-40-smoke-pass.md) |
| **CP list** | `40` ACTIVE · `01` / `20` / `30` OFF — no `41`/`42` in use |

**Recovery:** If production **`40`** is missing again, import from **`READY_IMPORT_40-control-plane-active-with-credentials.json`**, **not** old candidate `41`/`42` redacted exports or name-only bundles.

**Post-PM15 runtime snapshot (pending):** `workflows/exports/2026-05-22_40-production-post-pm15-smoke.redacted.json` — **not yet in git**; export current published `40` from n8n UI when snapshot is required ([session](sessions/2026-05-22-control-plane-40-post-pm15-export-snapshot.md)). **Non-blocking** for PM-17.

**PM-17 classifier output schema:** `pm17-classifier-v1` — sample [docs/examples/pm17-classifier-output.sample.json](examples/pm17-classifier-output.sample.json); tool `tools/ollama-classifier-dry-run.mjs`. Ollama = classifier only, not implementer.

**PM-18 Codex OAuth feasibility:** `pm18-codex-oauth-feasibility-v1` — [sample](examples/pm18-codex-feasibility-output.sample.json); tool `tools/codex-oauth-feasibility-check.mjs`. **No** OAuth tokens in git. Codex = future implementer worker only, after classifier + manual gate.

**PM-19 implementer bridge:** `pm19-implementer-bridge-request-v1` / `pm19-implementer-bridge-result-v1` — [request](examples/pm19-implementer-bridge-request.sample.json) · [result](examples/pm19-implementer-bridge-result.sample.json); tool `tools/implementer-bridge-dry-run.mjs`. Mock worker only until PM-18 unblocks Codex.

**PM-20 n8n bridge packet:** [PM20_N8N_BRIDGE_PACKET.md](PM20_N8N_BRIDGE_PACKET.md) · [runtime packet](runtime-packets/pm-20-n8n-classifier-bridge-gate-packet.md) · [flow sample](examples/pm20-n8n-bridge-flow.sample.json). **No** real worker in first runtime; PM-18 PENDING blocks Codex only, not mock bridge. Successor workflow for PM-21 — do not silently edit published `40`.

**PM-50 PASS:** OpenClaw install/onboard — [PM50](PM50_OPENCLAW_LOCAL_INSTALL_ONBOARD_PASS.md). **PM-51:** **PREPARED / NOT EXECUTED** — handoff canonico in control-plane: [handoffs/pm-51-…](handoffs/pm-51-openclaw-confined-gateway-noop-probe-new-chat.md) · [PM51](PM51_OPENCLAW_CONFINED_GATEWAY_NOOP_PROBE_GATE.md). **Macchine:** PC lavoro (`Utente`) = **docs-only**; PM-51 si esegue **solo a casa** (`mrhz`, `C:\Users\mrhz\Documents\AI\GitHub\control-plane`). **dev-method `bb5693d`** = **mirror metodo/docs**, non fonte runtime. **PM-34:** **blocked**.

**PM-21 candidate import:** `workflows/exports/READY_IMPORT_42-classifier-bridge-candidate.json` — name `42 - CP v4 multirepo + classifier bridge - CANDIDATE OFF` · **active false**. Build: `tools/build-ready-import-42-bridge-candidate.mjs` from READY_IMPORT_40. **Never** silently edit or delete published `40`. **PM-21 Code nodes:** `runOnceForEachItem` → use **`$json`**, not `$input.first()` or `$('…').first()`; bridge passes `classifier` on result json. **Runtime PASS (PM-21C):** commit `1f46c64` — [session](sessions/2026-05-22-control-plane-pm21c-bridge-runtime-pass.md). **PM-22/23 PASS:** promotion completed; smoke `bfa4710` — production **`40 - CP v4 multirepo + classifier bridge - ACTIVE`**; backup **`41 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - BACKUP OFF`**; PM-24 rollback **not needed**; Codex/provider API **not** used — [session](sessions/2026-05-22-control-plane-pm22-pm23-promotion-smoke-pass.md). **`41` backup:** do **not** delete until [PM-27 cleanup gate](runtime-packets/pm-27-backup-41-retention-cleanup-gate.md). **Post-promotion:** no repeated smoke without real error — [PM-26](PM26_POST_PROMOTION_STABILIZATION.md). **PM-28:** **B then C** — [decision](decision-packets/pm-28-next-track-decision.md). **PM-29 snapshot:** **PENDING** (no Downloads/API export) — [PM29](PM29_POST_PROMOTION_SNAPSHOT.md). **PM-30 PASS:** Codex CLI in PATH (`codex-cli 0.133.0`); **no** login/prompts — [session](sessions/2026-05-22-control-plane-pm30-codex-cli-local-setup.md). **PM-31/32:** worker contract mock **PASS** — `tools/codex-worker-contract-dry-run.mjs`; **no** `codex` invocation — [PM31](PM31_CODEX_WORKER_CONTRACT_DRY_RUN.md). **PM-37:** marker+JSON exact-output harness **PASS** (mock) — do **not** let n8n consume unconstrained Codex NL output — [PM37](PM37_CODEX_EXACT_OUTPUT_HARNESS.md); **PM-50:** OpenClaw install/onboard **PASS** — OpenAI Codex OAuth done; gateway **127.0.0.1:18789** LISTENING (netstat); use **`openclaw.cmd`** on Windows; no daemon/exposure/n8n/worker; PM-51 **PREPARED / NOT EXECUTED** — [handoff new chat](handoffs/pm-51-openclaw-confined-gateway-noop-probe-new-chat.md); PM-34 **blocked** — [PM50 PASS](PM50_OPENCLAW_LOCAL_INSTALL_ONBOARD_PASS.md). **PM-49:** OpenClaw OAuth bridge feasibility **PASS** — confined bridge alt. to failing CLI runner; no install/onboard in PM-49; OpenRouter/Gemini **blocked**; PM-50 prepared; PM-34 **blocked** — [PM49](PM49_OPENCLAW_OAUTH_BRIDGE_FEASIBILITY.md). **PM-47:** runner CLI diagnosis **PASS** — PM-44/46 exit 2 likely argv/spawn vs manual; PM-46 added invalid `--approval`; PM-48 v3 prepared without approval flag; PM-34 **blocked** — [PM47](PM47_CODEX_RUNNER_CLI_DIAGNOSIS.md). **PM-46:** one-shot runner v2 **FAIL** — `cli_exit_nonzero` exit 2; Codex invoked once; raw not committed; PM-34 **blocked** — [PM46](PM46_CODEX_LOCAL_RUNNER_PROBE_V2.md). **PM-45:** runner hardening **PASS** dry-run; PM-44 fail remains non-n8n-usable; PM-46 prepared; PM-34 **blocked** until strict_pass + separate gate — [PM45](PM45_CODEX_RUNNER_HARDENING.md). **PM-44:** local runner probe **FAIL** — classification **fail**; Codex invoked once; raw stdout/stderr **not** committed; PM-34 **blocked** — [PM44](PM44_CODEX_LOCAL_RUNNER_PROBE.md). **PM-43:** adapter runner dry-run **PASS** — parser classifies PM-37/38/41 fixtures correctly; PM-34 **blocked** until PM-44 **strict_pass** artifact + separate gate — [PM43](PM43_CODEX_ADAPTER_RUNNER_DRY_RUN.md). **PM-41:** direct PowerShell Codex ran but **strict output failed** + scope drift — do not lengthen prompts; use **PM-42/43 external adapter/runner**; PM-34 **blocked** until runner **strict_pass** artifact — [PM41](PM41_CODEX_EXTERNAL_STRICT_RETRY_FAIL.md). **PM-40:** strict retry **BLOCKED_BY_TOOL_POLICY** — `codex.cmd` from inside Codex/tool env rejected; **not** a pass; use **PM-41** user PowerShell direct — [PM40](PM40_CODEX_STRICT_RETRY_BLOCKED.md); PM-34 **blocked**. **PM-39:** hardening classifies PM-38 as **recoverable_partial** — **not** n8n-usable; PM-34 blocked until **PM-40** strict pass; never consume recovered Codex output in n8n — [PM39](PM39_CODEX_STRICT_HARNESS_HARDENING.md). **PM-38:** real structured probe — JSON-like output but **strict PM-37 contract FAIL** (`<<<JSON>>>` markers); **PM-34 n8n blocked** — [PM38](PM38_CODEX_STRUCTURED_OUTPUT_PROBE.md). **PM-38** prepared superseded by runtime fail. **PM-36:** repo-read functional **PASS** (read PM35 doc, status PASS found) but final output drifted to `CODEX_NOOP_OK` — do **not** rely on exact final text until PM-37 harness — [PM36](PM36_CODEX_REPO_READ_PROBE.md). **PM-35 PASS:** `codex.cmd exec` read-only no-op → `CODEX_NOOP_OK`; sandbox read-only; **no** session id in git; **no** worker — [PM35](PM35_CODEX_NOOP_PROBE.md). **PM-33 PASS:** manual `codex.cmd login` (ExecutionPolicy workaround for `codex.ps1`); terminal **Successfully logged in**; version/help OK — **no** token dump, **no** prompt, **no** worker — [session](sessions/2026-05-22-control-plane-pm33-codex-manual-login-pass.md). **PM-18:** OAUTH AVAILABLE / WORKER NOT ENABLED. **PM-34:** PREPARED only. **n8n/workflows untouched.** **`41` retained** — [PM-27](runtime-packets/pm-27-backup-41-retention-cleanup-gate.md).
