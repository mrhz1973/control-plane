# V4 runtime authorization issuance path — implementation offline (with BugBot correction)

**Block:** `V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_IMPLEMENTATION_OFFLINE` (+ `_BUGBOT_CORRECTION`)
**Category:** SECURITY_RUNTIME_INTEGRATION
**Result:** PASS — `ISSUANCE_IMPLEMENTATION_OFFLINE_PASS`
**dispatch_base_head:** `d50f0a917810013d80e0cef0cbc11fdec14f086c`
**STOP evidence commit:** `096f16bece0601a5c0390427962c992134b71a7c` (preserved in history)
**Real Telegram Bot API calls:** **0** · Telegram messages: **0** · Production mutations: **0** · Executions: **0**

## 1. Contract refs (implemented exactly)

- `docs/contracts/v4-runtime-authorization-issuance-v1.md` + `.schema.json`
- `docs/contracts/v4-runtime-authorization-pending-store-v1.md` + `.schema.json`
- Preserved references: `docs/contracts/v4-runtime-authorization-provenance-registry-v1.md`, `docs/contracts/v4-runtime-authorization-durable-spend-ledger-v1.md`

The ratified contract hardening over the initial discovery is honored: **n8n cannot attest APPROVE/REJECT**; there is **no HTTP `/issue` endpoint**; the Windows issuance owner consumes the Telegram update **directly** with a dedicated server-side bot credential; `chat_id` and `from.id` are read only from the received Telegram update.

## 2. Artifacts

| File | Role |
|---|---|
| `tools/v4-runtime-authorization-issuance-v1.mjs` | Pending store owner (validate/load/persist, register, status) + direct Telegram client abstraction (`createProductionTelegramClient` — fetch-based, never invoked in this pass) + `handleTelegramDecisionUpdate` + `reconcileApprovedPending` + validation-only CLI |
| `tools/serve-v4-runtime-authorization-issuance-v1.mjs` | Issuance HTTP service: `POST /v4/authorization/register-pending` + `POST /v4/authorization/status` ONLY. No `/issue`, `/approve`, `/reject`. Planned production bind `127.0.0.1:18792`; tests use ephemeral port 0 |
| `tools/v4-runtime-authorization-provenance-registry-v1.mjs` | Bounded addition: `issueActiveEntry()` — sole ACTIVE append owner (collision fail-closed, route const, valid dates, atomic persist, no ledger, no adapter). Existing CLI untouched: validation-only / never issues |
| `tests/v4-runtime-authorization-issuance/run.mjs` | 43 tests: 36 original + 7 BugBot-correction regressions (A–G) |

## 3. Trust boundary invariants (all test-proven)

- Direct Telegram verification: `chat_id` + `from.id` verified server-side against user-local config; wrong chat/user → `ISSUANCE_OPERATOR_IDENTITY_MISMATCH`, zero issuance (tests 14, 15).
- No HTTP decision surface: `/issue`-style paths 404 (test 11); n8n-smuggled `selected_option`/identity/token fields in register requests → `ISSUANCE_REGISTER_REQUEST_INVALID` (tests 10, 35); spoofed fields on Telegram updates are inert (test 35).
- One-shot semantics: double APPROVE → `ISSUANCE_DECISION_ALREADY_CONSUMED` (test 23); REJECT then APPROVE blocked (test 24); duplicate `update_id` across records → `ISSUANCE_TELEGRAM_UPDATE_REUSED` (test 22).
- State machine: PENDING → APPROVED → ISSUED / PENDING → REJECTED / PENDING → EXPIRED; ISSUED/REJECTED/EXPIRED terminal (tests 18–20, 29).
- APPROVE → APPROVED persist → `issueActiveEntry` registry ACTIVE → ISSUED persist; registry failure after APPROVED leaves pending APPROVED; bounded reconciliation retries only the exact same pre-bound `authorization_id`/bindings; changed-binding reconciliation → `ISSUANCE_AUTHORIZATION_ID_CONFLICT` (tests 20, 25, 26, 27, 28).
- REJECT → terminal REJECTED, registry writes 0, ledger writes 0, execution 0 (test 19).
- Authorization expiry server-derived ≤ 3600 s (test 21); pending TTL ≤ 900 s.
- Register: duplicate pending id / authorization id collision / registry-already-present → fail closed; Telegram delivery failure → `ISSUANCE_TELEGRAM_DELIVERY_FAILED`, nothing persisted, nothing issued (tests 3, 4, 8).
- Spend ledger: zero writes on the entire issuance path (test 32); no ledger path accepted anywhere in the issuance config surface.
- Responses/CLI leak no paths, tokens, operator ids, Telegram raw data (tests 33, 42).

## 4. Previous STOP and BugBot correction

The first implementation pass STOPped on 4 actionable BugBot findings (stop artifact: `reports/runtime/cursor-stops/2026-08-31T153000Z__V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_IMPLEMENTATION_OFFLINE.stop.json`, commit `096f16b`). The corrective pass fixed exactly those findings with no redesign:

| # | Finding | Correction |
|---|---|---|
| 1 | Service CLI arg parser `args.get(argv[i+1])` typo — `--issuance-config` never acquired | Parser corrected to `args.set(process.argv[i], process.argv[i + 1])`; CLI contract otherwise unchanged |
| 2 | Same argv typo in pending-store CLI — `--pending-store` never acquired | Same correction |
| 3 | `validatePendingStoreObject` EXPIRED contradiction (non-PENDING branch demanded a receipt EXPIRED must not have) | Validator rewritten state-specific: PENDING/EXPIRED require no receipt; APPROVED/ISSUED require complete APPROVE receipt (+`issued_at` for ISSUED); REJECTED requires complete REJECT receipt with null expiry/issued; update-id uniqueness, immutable bindings, terminal rules all preserved |
| 4 | CLI `decision_count` guarded on wrong return shape | Now reads `result.store.decisions.length`; bounded output only |

**Additional latent defect found and fixed during correction verification:** both tools' `isMain` guards used `endsWith("...issuance-v1.mjs")`, so importing the serve tool triggered the module CLI (the serve filename *ends with* the module filename suffix). Both guards now require the full `/`-anchored filename match. The service CLI startup test (37) spawns async, reads the bounded startup JSON, and kills the process — no real network use.

## 5. Test results

| Suite | Result |
|---|---|
| `tests/v4-runtime-authorization-issuance/run.mjs` (target, includes regressions A–G) | **43/43 PASS** (was 36/36 + 7 new) |
| `tests/v4-windows-local-execution-endpoint/run.mjs` (target) | **61/61 PASS** |
| `tests/v4-runtime-authorization-durable-spend-ledger/run.mjs` (target) | **13/13 PASS** |
| opencode-execution-adapter (regression) | 23/23 PASS |
| opencode-single-generation-guard (regression) | 16/16 PASS |
| v4-local-runtime-readonly-contribution (regression) | 29/29 PASS |
| v4-local-runtime-readonly-private-endpoint (regression) | 22/22 PASS |
| `git diff --check` | PASS |
| BugBot (exactly once, this pass) | **PASS_NO_FINDINGS** |

## 6. Hard offline boundary preserved

real Telegram Bot API calls = 0 · Telegram messages = 0 · production pending-store mutations = 0 · production issuance config mutations = 0 · production registry mutations = 0 · production spend-ledger mutations = 0 · Scheduled Task mutations = 0 · Tailscale mutations = 0 · n8n mutations = 0 · WF40 executions = 0 · WF61 executions = 0 · execution endpoint HTTP requests = 0 · OpenCode = 0 · Qwen generations = 0 · provider/model calls = 0 · **ACTIVE production issuance = 0**.

No production service created, no Scheduled Task, no Tailscale route, no real bot token, no production pending/config file. Production registry and spend ledger remain **empty**. Live execution **CLOSED**. Live issuance **CLOSED**.

## 7. NEXT

`V4_RUNTIME_AUTHORIZATION_ISSUANCE_PRIVATE_SERVICE_PERSISTENCE_PRECHECK` — determine and prepare (without conflating setup with the first live approval/execution): dedicated Telegram issuance bot credential; operator chat/user ids; production config; pending store; Scheduled Task; Tailscale private route.
