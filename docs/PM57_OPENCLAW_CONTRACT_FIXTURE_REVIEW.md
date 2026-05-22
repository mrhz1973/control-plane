# PM-57 — OpenClaw contract fixture review

**Status:** **PASS** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-57-openclaw-contract-fixture-review-gate.md) · [session](sessions/2026-05-22-control-plane-pm57-openclaw-contract-fixture-review.md) · [PM-56 review](PM56_OPENCLAW_ADAPTER_CONTRACT_REVIEW.md) · [PM-53 validator](PM53_OPENCLAW_BRIDGE_ARTIFACT_VALIDATOR_DRY_RUN.md) · [tool](../tools/validate-openclaw-bridge-artifact.mjs)

---

## Scopo

Chiude il finding **LOW F-07** di PM-56: `next_gate` su artifact PM-52 ora **allowlist-validato** in PM-53, con fixture locale e regression PM-55.

| Item | PM-57 |
|------|--------|
| **Runtime / OpenClaw** | **No** |
| **Gateway / n8n / worker** | **No** |
| **Workflow 40 / 41** | **Not** touched |
| **PM-34** | **Blocked** |
| **n8n_ready** | **false** (unchanged) |

---

## Remediation (PM-56 F-07)

| Change | Detail |
|--------|--------|
| **Validator** | `next_gate` allowlist in `validate-openclaw-bridge-artifact.mjs` |
| **Allowlist** | `pm-54-bridge-adapter-design` · `pm-55-adapter-dry-run` · `pm-56-adapter-contract-review` · `pm-57-contract-fixture-review` · `stop` |
| **Fixture** | [pm53-openclaw-bridge-artifact-invalid-next-gate.sample.json](../examples/pm53-openclaw-bridge-artifact-invalid-next-gate.sample.json) — `next_gate: pm-34-n8n-runtime-now` → **invalid** |

---

## PM-53 dry-run commands

```bash
node tools/validate-openclaw-bridge-artifact.mjs examples/pm53-openclaw-bridge-artifact-valid.sample.json
node tools/validate-openclaw-bridge-artifact.mjs examples/pm53-openclaw-bridge-artifact-invalid-secret.sample.json
node tools/validate-openclaw-bridge-artifact.mjs examples/pm53-openclaw-bridge-artifact-invalid-forbidden.sample.json
node tools/validate-openclaw-bridge-artifact.mjs examples/pm53-openclaw-bridge-artifact-invalid-schema.sample.json
node tools/validate-openclaw-bridge-artifact.mjs examples/pm53-openclaw-bridge-artifact-invalid-next-gate.sample.json
```

| Sample | Exit | `valid` |
|--------|------|---------|
| **valid** | **0** | **true** |
| **invalid-secret** | **1** | **false** |
| **invalid-forbidden** | **1** | **false** |
| **invalid-schema** | **1** | **false** |
| **invalid-next-gate** | **1** | **false** |

---

## PM-55 regression commands

```bash
node tools/adapt-openclaw-bridge-artifact.mjs examples/pm53-openclaw-bridge-artifact-valid.sample.json
node tools/adapt-openclaw-bridge-artifact.mjs examples/pm53-openclaw-bridge-artifact-invalid-secret.sample.json
node tools/adapt-openclaw-bridge-artifact.mjs examples/pm53-openclaw-bridge-artifact-invalid-forbidden.sample.json
node tools/adapt-openclaw-bridge-artifact.mjs examples/pm53-openclaw-bridge-artifact-invalid-schema.sample.json
node tools/adapt-openclaw-bridge-artifact.mjs examples/pm53-openclaw-bridge-artifact-invalid-next-gate.sample.json
```

| Sample | Exit | `adapted` |
|--------|------|-----------|
| **valid** | **0** | **true** |
| **invalid-*** | **1** | **false** |

Valid output: `safety.n8n_ready` = **false**.

---

## Explicit negatives

No OpenClaw runtime · no gateway · no n8n · no workflow 40/41 · no worker · no Telegram/OpenRouter/Gemini · no network · no real secrets · PM-34 **blocked**.

---

## Decisione

**PASS** — LOW F-07 closed; all PM-53/PM-55 dry-runs pass; no blockers introduced.

---

## Next

**PM-58** (candidate) — integration readiness design or bridge artifact lifecycle design; **not** PM-34 runtime.
