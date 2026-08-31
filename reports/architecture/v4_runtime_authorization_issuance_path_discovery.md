# V4 runtime authorization issuance path — discovery

**Block:** `V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_DISCOVERY`  
**Category:** DOCS_ONLY_ARCHITECTURE_DISCOVERY  
**Result:** PASS — `ISSUANCE_PATH_DISCOVERY_PASS`  
**Starting head:** `5e923a46308dbcc4d34dc4e332cdb37593486b21`  
**Live authorization issuance:** **0** · **Live execution:** **0** · Runtime mutations: **0**

## Executive summary

Consumption path is implemented and fail-closed (durable spend ledger → provenance registry ACTIVE→SPENT → adapter). **Issuance path is absent by design**: no owner can create ACTIVE registry entries today. Legacy `docs/runtime/AUTH_V4_*.operator.json` files have **zero code consumers** and are audit evidence only.

This discovery defines a **minimal, operator-owned, fail-closed** architecture:

1. **Proposal** (n8n or operator CLI) registers a bounded pending authorization on the **Windows host** — never writes the provenance registry or spend ledger.
2. **Human gate** reuses the validated Telegram inbound pattern (`allowed_chat_id` / `source_chat_id` guard, duplicate/stale callback handling) to obtain an explicit APPROVE or REJECT.
3. **Issuance** is performed exclusively by a **new Windows-local issuance owner** (separate from the execution endpoint) that verifies decision evidence and appends exactly one ACTIVE entry to the provenance registry.
4. **Spend** remains unchanged on the execution endpoint (`127.0.0.1:18791`).

---

## A. CURRENT OWNERS FOUND

| Concern | Existing owner | Status | Reuse | Reason |
|---|---|---|---|---|
| Authorization **shape** validation | `tools/opencode-execution-adapter-v1.mjs` → `validateRuntimeAuthorization()` | Implemented | **yes** (unchanged) | Validates `operator-runtime-authorization-v1` envelope at execution; not issuance |
| HTTP request schema (strict subset) | `docs/contracts/v4-windows-local-execution-endpoint-v1.request.schema.json` | Implemented | **yes** (unchanged) | Caller-supplied fields only; no provenance |
| Provenance registry **read + SPEND** | `tools/v4-runtime-authorization-provenance-registry-v1.mjs` | Implemented | **partial** | `loadRegistry` / `inspectAuthorization` / `admitAuthorization` / `persistRegistry` reusable; **no issue API**; CLI explicitly “never issues” |
| Durable spend ledger | `tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs` | Implemented | **no** (issuance) | Append-only at **admission** only; contract forbids issuance writes |
| Execution endpoint admission | `tools/serve-v4-windows-local-execution-endpoint-v1.mjs` | Persisted · `127.0.0.1:18791` | **no** (issuance) | Consumption-only; must not gain issuance surface |
| WF40 execution transport | Tailscale → `/v4/execution/opencode-local` | Wired · live-incapable without ACTIVE id | **yes** (transport) | Delivers bounded execution request after issuance |
| Telegram **operator chat** guard | wf47 template + fixtures A–J (`allowed_chat_id`, `source_chat_id`) | Repository-validated · runtime not permanent | **yes** (identity transport) | Strongest existing proof that a callback/message came from the configured operator chat; **not** sufficient alone for registry write |
| Decision Packet open/close | Wd open-on-send + Wg close-on-reply on `control_plane_decisions_test` | Gate 3 user-attested PASS · test table | **partial** (pattern only) | Proves human decision lifecycle for `D-NNNN-X` packets; schema lacks runtime-authorization bindings; VPS-side store must not be issuance writer |
| Decision Packet format / human_gate route | `docs/contracts/decision-packet-mapping-v1.md`, `PROJECT_VISION.md` §3 | Canonical policy | **yes** (policy) | AI/n8n may **propose**; `human_gate` / `HUMAN_GATE_REQUIRED` forbids auto-issue |
| Git `AUTH_V4_*.operator.json` | `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF*.operator.json` | Legacy audit | **no** | **NON AUTHORITATIVE** — referenced only as `provider_state_ref` in packets; no loader in `tools/` or `tests/` |
| n8n adapter-router bridge | `tools/n8n-v4-execution-adapter-router-bridge-v1.mjs` | Offline · deliberately live-incapable | **yes** (proposal transport) | Can assemble bounded proposal + sidecar; cannot write registry |
| STANDING_OPERATOR_AUTHORIZATION | `docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md` | Canonical | **no** (issuance bypass) | Speeds bounded Cursor passes; **does not** replace per-authorization human gate for live runtime execution |
| Tailscale private routes | `/v4/resource-status/local-readonly` → `18790`, `/v4/execution/opencode-local` → `18791` | Persisted | **pattern yes** | Separate issuance route on new loopback port is additive and consistent |

---

## B. MISSING OWNERS

1. **Windows-local pending authorization store (source of truth A)** — durable user-local JSON for `PENDING | APPROVED | REJECTED | ISSUED | EXPIRED` lifecycle; binds `pending_decision_id`, pre-assigned `authorization_id`, `task_id`, `execution_id`, `route_id`, `scope_digest`, `expires_at`.
2. **Windows-local issuance owner (sole ACTIVE writer)** — server-side service or CLI sibling that verifies human-decision evidence and calls registry persist to append **one** ACTIVE entry; **never** touches spend ledger; **never** shares port/process with execution endpoint.
3. **Issuance evidence verifier** — validates operator Telegram chat binding, pending state, one-decision/one-authorization, scope/task/route/expiry coherence, and replay of consumed decisions.
4. **Issuance transport contract** — bounded request/result schema for `register-pending` and `issue` (or equivalent CLI flags); Tailscale-private route separate from execution.
5. **User-local issuance config** — operator Telegram chat id (redacted placeholder in docs), registry path, pending store path, fixed route allowlist; no HTTP caller override.
6. **n8n runtime-authorization gate workflow slice** — presents Telegram APPROVE/REJECT for a pending authorization and forwards sanitized close evidence to Windows issuance; **does not** write registry JSON.

---

## C. TRUST GRAPH

```text
[AI / n8n / operator CLI]
  → bounded proposal (task_id, route_id, scope_digest, execution_id, authorization_id, TTL)
  → Windows issuance owner: register-pending
  → pending store A: PENDING

[Telegram presentation — n8n]
  → message + inline APPROVE / REJECT (callback_data ra:<pending_decision_id>:approve|reject)
  → wf47 inbound: allowed_chat_id + source_chat_id guard
  → duplicate / stale / malformed → fail-closed (no issuance)

[Human explicit decision]
  → operator taps APPROVE or REJECT in configured chat only

[n8n — transport only after close]
  → sanitized issuance-evidence request → Tailscale-private Windows issuance route

[Windows issuance owner — trust boundary]
  → verify operator identity (chat id vs user-local config)
  → verify pending_decision_id state + bindings + expiry + one-shot
  → REJECT path: terminal REJECTED, zero registry/ledger writes
  → APPROVE path: append ACTIVE entry → provenance registry B

[Normal execution endpoint — unchanged]
  → POST /v4/execution/opencode-local (127.0.0.1:18791)
  → replay cache → durable spend ledger → registry inspect ACTIVE → binding → ledger append → registry SPENT → adapter
```

**Hard separations:**

| Caller | May do | Must not do |
|---|---|---|
| Generic HTTP client | Nothing without ACTIVE registry id + valid envelope | Self-issue, pick registry path, write ledger |
| n8n | Propose, Telegram UX, transport bounded evidence | Direct registry/ledger JSON mutation |
| Execution endpoint | Consume ACTIVE id once | Issue ACTIVE, accept issuance requests |
| Issuance owner | Pending lifecycle + ACTIVE append | Run OpenCode/Qwen, append spend ledger at issuance |

---

## D. RECOMMENDED MINIMAL ARCHITECTURE (primary)

**Single recommendation:** add a **Windows-local issuance owner** as a **separate loopback service** (new port, e.g. `127.0.0.1:18792`) with an additive Tailscale route (e.g. `/v4/authorization/issue`), plus a **user-local pending store** and **user-local issuance config**.

### Why this option

- Matches provenance registry contract: “issuance tooling for ACTIVE entries (operator action, separate gate)” and “no caller can add entries via HTTP” **execution** surface.
- Reuses existing Telegram operator-identity guards without trusting n8n as registry writer.
- Keeps spend ledger **issuance-free** per durable ledger contract.
- Compatible with today (Telegram manual) and tomorrow (control-plane auto-issue only when policy ≠ `HUMAN_GATE_REQUIRED`).

### Flow (minimal)

1. **Register pending** (localhost or tailnet-private POST): creates `PENDING` row with immutable bindings (`pending_decision_id`, `authorization_id`, `task_id`, `execution_id`, `route_id=opencode+qwen_local`, `scope_digest`, `pending_expires_at`).
2. **Telegram gate**: n8n sends APPROVE/REJECT; wf47 validates chat; close metadata captured (`telegram_update_id`, `telegram_chat_id`, `selected_option`).
3. **Issue** (tailnet-private POST after APPROVE only): issuance owner verifies evidence → `PENDING→APPROVED→ISSUED` + registry append ACTIVE (`issued_at`, `expires_at`) → **no ledger write**.
4. **Execute**: existing WF40 → execution endpoint path unchanged.

### Alternative (valid but secondary)

**Operator-only CLI issuance** after Telegram APPROVE: operator runs `issue --pending-decision-id …` on Windows with evidence file exported from n8n. Fail-closed and minimal to implement, but weaker automation binding and higher manual error risk. Acceptable as **bootstrap**; not primary for WF40 integration.

### Rejected alternatives

| Alternative | Why not primary |
|---|---|
| n8n writes registry JSON directly | Breaks trust boundary; VPS compromise = arbitrary ACTIVE ids |
| Extend execution endpoint with `/issue` on `:18791` | Collapses issuance/spend boundary; increases blast radius |
| Trust Tailscale identity alone for issuance | Same as provenance gap option (3) — fail-open to any tailnet caller |
| Reuse `control_plane_decisions_test` as issuance store | VPS-side; wrong id namespace; no authorization bindings; not operator-local SoT for registry |

---

## E. TELEGRAM ROLE

| Aspect | Verdict |
|---|---|
| **Reuse possible?** | **Yes** — wf47 polling + `allowed_chat_id` / `source_chat_id` guard + duplicate/stale fixtures are the canonical operator-identity transport for human gates. |
| **Modifications needed** | New callback namespace `ra:<pending_decision_id>:approve\|reject` (parallel to `dp:<decision_id>:n`); Telegram message body must display immutable bindings (`authorization_id`, `task_id`, `route_id`, scope summary, `expires_at`); wf47→issuance handoff must pass sanitized close receipt (no tokens). |
| **Why not sufficient alone** | Telegram proves **who clicked** in a configured chat; it does **not** prove registry write integrity or prevent n8n from forging close metadata. Windows issuance owner must verify chat id against user-local config and correlate with pending store A. |

**n8n role (exact):**

- **MAY:** create proposal payload; call `register-pending`; send Telegram; receive callback; verify pending id in callback matches open row; forward bounded issuance-evidence to Windows.
- **MUST NOT:** append ACTIVE to provenance registry; append spend ledger; choose registry path; auto-APPROVE when policy marks `human_gate` / `HUMAN_GATE_REQUIRED`; reuse a consumed decision for a second authorization.

---

## F. WINDOWS-LOCAL ISSUANCE OWNER

| Property | Specification |
|---|---|
| **New owner required?** | **Yes** |
| **Transport** | Loopback HTTP server (recommended `127.0.0.1:18792`); Tailscale Serve additive route `/v4/authorization/*` tailnet-only; separate Scheduled Task from execution endpoint |
| **State** | Pending store A: `%LOCALAPPDATA%\control-plane\v4-runtime-authorization-pending-v1.json`; registry B: existing `%LOCALAPPDATA%\control-plane\v4-runtime-authorization-registry-v1.json` (ACTIVE append only); config: `%LOCALAPPDATA%\control-plane\v4-runtime-authorization-issuance-config-v1.json` |
| **Request contract (sketch)** | `register-pending`: `{ pending_decision_id, authorization_id, task_id, execution_id, route_id, scope_digest, pending_ttl_seconds }` → `{ ok, pending_decision_id, pending_expires_at }`. `issue`: `{ pending_decision_id, selected_option, telegram_update_id, telegram_chat_id, authorization_expires_at, scope_digest, task_id, execution_id, route_id }` → `{ ok, authorization_id, state: ISSUED }` or fail-closed reason |
| **Server-side invariants** | Registry path fixed at startup; ledger path **not accepted**; unknown pending → reject; wrong chat id → reject; REJECT → no registry write; duplicate issue → reject; expired pending → reject; `authorization_id` collision in registry → reject; `route_id` must be `opencode+qwen_local` in v1; atomic temp+rename for pending and registry writes; issuance never invokes adapter/occupancy/runner |

---

## G. STATE MACHINES

### Pending decision (store A)

```text
PENDING
  ├─(operator APPROVE + valid evidence)→ APPROVED → ISSUED   [terminal success]
  ├─(operator REJECT)→ REJECTED                               [terminal]
  ├─(pending_expires_at elapsed)→ EXPIRED                     [terminal]
  └─(invalid / replay / mismatch)→ REJECTED or NOOP fail-closed [terminal]

ISSUED / REJECTED / EXPIRED: no further transitions.
```

| Event | Result |
|---|---|
| Double APPROVE / duplicate callback | Second `issue` → `ISSUANCE_DECISION_ALREADY_CONSUMED` (fail-closed) |
| Callback stale (wf47 fixture E class) | No issuance; pending unchanged or EXPIRED per policy |
| Unknown `pending_decision_id` | `ISSUANCE_PENDING_NOT_FOUND` |
| Operator chat mismatch | `ISSUANCE_OPERATOR_IDENTITY_MISMATCH` |
| Task / route / scope_digest mismatch | `ISSUANCE_BINDING_MISMATCH` |
| `expires_at` already passed at issue | `ISSUANCE_EXPIRED` |
| Issue after service restart | Allowed **only** if pending store durable and state still APPROVED-with-evidence or idempotent ISSUED replay returns same result without double registry append |

### Authorization (registry B)

```text
(none) → ACTIVE   [issuance owner only]
ACTIVE → SPENT    [execution endpoint admission only]
```

No REJECTED state in registry — rejections live only in pending store A.

---

## H. EXACT NEXT CONTRACTS / TOOLS (implementation boundary)

**Create (contract pass — `V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_CONTRACT`):**

| File | Purpose |
|---|---|
| `docs/contracts/v4-runtime-authorization-issuance-v1.md` | Issuance owner contract |
| `docs/contracts/v4-runtime-authorization-issuance-v1.schema.json` | Pending + issue request/result schemas |
| `docs/contracts/v4-runtime-authorization-pending-store-v1.md` | Store A lifecycle |
| `docs/contracts/v4-runtime-authorization-pending-store-v1.schema.json` | Machine shape |

**Create (implementation pass — after contract ratification):**

| File | Purpose |
|---|---|
| `tools/v4-runtime-authorization-issuance-v1.mjs` | Pending + issue + registry ACTIVE append |
| `tools/serve-v4-runtime-authorization-issuance-v1.mjs` | Loopback HTTP surface (if not CLI-only bootstrap) |
| `tests/v4-runtime-authorization-issuance/run.mjs` | Fail-closed + replay + binding tests |

**Modify (later passes only):**

| File | Change |
|---|---|
| `tools/v4-runtime-authorization-provenance-registry-v1.mjs` | Add `issueActiveEntry()` used **only** by issuance owner |
| `docs/contracts/v4-runtime-authorization-provenance-registry-v1.md` | Cross-reference issuance contract; clarify issuance vs spend |
| n8n workflow template(s) | Runtime-authorization Telegram gate slice (templates only until explicitly activated) |

**Explicitly out of scope for next pass:** execution endpoint changes, ledger changes, WF40 live activation, live Telegram, real ACTIVE entries.

---

## I. FIRST LIVE PROOF SHAPE (design only — not executed)

Minimal future proof chain (`V4_RUNTIME_AUTHORIZATION_FIRST_LIVE_ISSUED_EXECUTION_PROOF` or successor):

```text
1 pending_decision_id (PEND-<uuid>)
  → 1 Telegram APPROVE from configured operator chat
  → 1 ACTIVE authorization_id (AUTH-<uuid>) in empty production registry
  → 1 bounded WF40 transport POST with matching runtime_authorization sidecar
  → 1 execution_id
  → 1 durable ledger spend (ADMISSION_CONSUMED)
  → 1 registry SPENT transition
  → max 1 OpenCode execution
  → max 1 Qwen generation
  → counters return to zero; gate re-closed
```

Bindings for the proof: `task_id` = explicit proof task ref, `route_id` = `opencode+qwen_local`, scope pinned to single-generation guard profile, `authorization_expires_at` ≤ 60 minutes, `pending_ttl` ≤ 15 minutes.

---

## J. SECURITY VERDICT

**ISSUANCE_PATH_DISCOVERY_PASS**

Operator identity owner: **wf47 Telegram chat guard + user-local issuance config** (combined).  
Human decision boundary: **Telegram APPROVE/REJECT before Windows `issue`**.  
Pending decision ownership: **new Windows-local store A**.  
Issuance writer ownership: **new Windows-local issuance owner (not n8n, not execution endpoint)**.  
Replay/idempotency: **defined fail-closed** (§G).  
Expiry: **pending 15 min default · authorization 60 min default** (operator-tunable within bounded max).  
Live changes this pass: **zero**.

---

## Canonical references

- `docs/contracts/v4-runtime-authorization-provenance-registry-v1.md`
- `docs/contracts/v4-runtime-authorization-durable-spend-ledger-v1.md`
- `docs/contracts/v4-windows-local-execution-endpoint-v1.md`
- `reports/architecture/v4_runtime_authorization_provenance_gap_discovery.md`
- `docs/decision-store-shared-open-close-design.md`
- `docs/sessions/2026-07-12-control-plane-d-0050-w-wf47-callback-query-l3-implementation.md`
- `docs/foundation/PROJECT_VISION.md` §3 (Telegram = human gate, not SoT)

## NEXT

`V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_CONTRACT` — formalize contracts before any implementation or live issuance.
