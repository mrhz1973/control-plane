# V4 runtime authorization provenance gap — discovery

**Block:** `V4_RUNTIME_AUTHORIZATION_PROVENANCE_GAP_DISCOVERY`
**Result:** PASS — `AUTHORIZATION_PROVENANCE_GAP_CONFIRMED`
**Category:** DOCS_ONLY_ARCHITECTURE_DISCOVERY
**Starting head:** `159bcb162d2df6a99cbd955efb6b109dae408af0`
**Execution endpoint HTTP requests:** **0** · Runtime mutations: **0**

## 1. Question

Does any repo owner verify that an `operator-runtime-authorization-v1` object was **actually issued** by a trusted operator, as distinct from merely having the correct semantic shape?

## 2. Three distinct validation layers (explicitly separated)

### A. SHAPE validation — PRESENT (two owners)

| Owner | Mechanism | What it proves | What it does NOT prove |
|---|---|---|---|
| `tools/opencode-execution-adapter-v1.mjs` → `validateRuntimeAuthorization()` | field-by-field semantic checks (schema version, ACTIVE state, route `opencode+qwen_local`, scope: harness/model/guard/max/retry/fallback/profile/dflash) | the object *conforms* to the authorized envelope | that the object was issued by anyone |
| `docs/contracts/v4-windows-local-execution-endpoint-v1.request.schema.json` | JSON Schema `const`-pinned strict subset, `additionalProperties:false` | the request auth *conforms* to the v1 envelope | same |

Both owners validate identical semantics. Neither consults any external state to establish provenance. **Every field they check is caller-supplied**, including `authorization_state: "ACTIVE"`.

### B. PROVENANCE / ISSUANCE validation — ABSENT

Repo-wide search (`operator-runtime-authorization`, `authorization_id`, issuer/issuance/registry/signature/HMAC/token/allowlist) found:

- **No** trusted-issuer validation.
- **No** HMAC/signature verification (`createHmac`/`crypto.verify`/jwt: zero occurrences in `tools/`).
- **No** server-side issued-authorization registry or `authorization_id` allowlist.
- **No** token exchange.

The only "issuance" artifacts are three operator-authored documents:
`docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF*.operator.json` (2026-08-30, for the already-consumed live dispatch proofs). They are referenced only as `provider_state_ref` inside `docs/packets/EP-V4-OPENCODE-LIVE-PROOF-*.json`. **No code path reads, hashes, or validates them.** They are evidence of operator intent for the audit trail, not a verification boundary. Who can emit an authorization today: **anyone who can send a POST** — the adapter cannot distinguish an operator-issued object from a caller-synthesized one with identical fields.

### C. SPEND / REPLAY validation — PARTIAL, server-side only, post-admission

| Owner | Mechanism | Limits |
|---|---|---|
| execution endpoint (`tools/serve-v4-windows-local-execution-endpoint-v1.mjs`) | in-memory `authorization_id → execution_id` binding, SPENT terminal set, execution_id fingerprint replay cache | binds only authorizations *it has already seen execute*; no knowledge of issuance; lost on restart |
| adapter `validateRuntimeAuthorization()` | rejects `spent === true` / `used === true` | flags live **inside the caller-supplied object** — a synthesized auth simply omits them |
| durable spend ledger | **does not exist** — explicitly deferred (contract §8.3, discovery O4b) | — |

## 3. Consequence for the suspended VPS proof — confirmed unreachable safely

The endpoint request schema is a strict subset of adapter shape validation:

- auth semantically invalid → endpoint **schema reject 400**, never reaches the adapter → `AUTHORIZATION_REJECTED` unreachable;
- auth sematically valid but synthesized → passes schema **and** adapter shape validation → proceeds to occupancy sampling and, if idle, guard + OpenCode spawn.

Therefore `AUTHORIZATION_REJECTED` via the HTTP endpoint is **unreachable by construction** today, and any schema-valid probe risks real execution. `V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_VPS_UNAUTHORIZED_REACHABILITY_PROOF` remains **BLOCKED**.

## 4. Verdict

**`AUTHORIZATION_PROVENANCE_GAP_CONFIRMED`**

## 5. Options for the minimal corrective boundary

| Option | Fail-closed | Caller cannot self-authorize | Single-use | No secrets in Git | Fits future durable ledger | Cost |
|---|---|---|---|---|---|---|
| **(1) Server-side issued-authorization registry** (user-local JSON outside Git, loaded at service construction like `loadRuntimeConfig()`; unknown `authorization_id` → `AUTHORIZATION_REJECTED`) | yes | yes — id must pre-exist server-side | yes — registry entry flips ACTIVE→SPENT server-side | yes — only ids + scope stored locally | yes — registry *is* the ledger seed | small |
| (2) Signed/HMAC authorization envelope | yes | yes | yes | key must live user-local; issuance tooling + key rotation new surface | possible but heavier | medium |
| (3) Tailnet-identity-based trust (assume tailnet auth = authorization) | no | no | no | — | no | — |

## 6. Recommendation (NOT implemented in this pass)

**Option 1 — server-side issued-authorization registry.**

Required properties (all satisfied by option 1):
- fail-closed on unknown/missing/expired registry or id;
- verification entirely server-side at admission, **before** occupancy/runner;
- caller cannot self-authorize by filling fields — `authorization_id` must match a registry entry created by the operator on the Windows host;
- single-use compatible: server-side ACTIVE→SPENT transition integrates with the existing in-memory binding and is the seed of the future durable spend ledger;
- `authorization_id` binding semantics (contract §8.3) preserved unchanged;
- no secrets in Git, no raw secrets in logs (registry holds ids + scope only, user-local path);
- single-generation guard untouched; no Qwen/OpenCode start; no WF40 mutation.

Shape validation stays with the existing owners; the registry adds the provenance + spend-authority layer the adapter cannot and should not own.

## 7. NEXT

`V4_RUNTIME_AUTHORIZATION_PROVENANCE_HARDENING`
`VPS_UNAUTHORIZED_REACHABILITY_PROOF BLOCKED UNTIL PROVENANCE HARDENING PASS`
