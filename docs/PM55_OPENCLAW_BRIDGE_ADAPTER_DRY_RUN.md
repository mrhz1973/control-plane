# PM-55 — OpenClaw bridge adapter dry-run

**Status:** **PASS** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-55-openclaw-bridge-adapter-dry-run-gate.md) · [session](sessions/2026-05-22-control-plane-pm55-openclaw-bridge-adapter-dry-run.md) · [PM-54 design](PM54_OPENCLAW_BRIDGE_ADAPTER_DESIGN.md) · [PM-53 validator](PM53_OPENCLAW_BRIDGE_ARTIFACT_VALIDATOR_DRY_RUN.md) · [tool](../tools/adapt-openclaw-bridge-artifact.mjs)

---

## Scopo

Local adapter dry-run: PM-53-validated bridge artifact → PM-54 normalized adapter output — **no** OpenClaw · **no** network · **no** n8n.

---

## Flow

1. Read local PM-52 artifact JSON
2. Run **PM-53** validator (subprocess)
3. If valid → emit `pm54.openclaw.adapter.v1` with **`safety.n8n_ready: false`**
4. If invalid → `adapted: false`, exit **1**

---

## Dry-run commands

```bash
node tools/adapt-openclaw-bridge-artifact.mjs examples/pm53-openclaw-bridge-artifact-valid.sample.json
node tools/adapt-openclaw-bridge-artifact.mjs examples/pm53-openclaw-bridge-artifact-invalid-secret.sample.json
node tools/adapt-openclaw-bridge-artifact.mjs examples/pm53-openclaw-bridge-artifact-invalid-forbidden.sample.json
node tools/adapt-openclaw-bridge-artifact.mjs examples/pm53-openclaw-bridge-artifact-invalid-schema.sample.json
```

| Sample | Exit | `adapted` |
|--------|------|-----------|
| **valid** | **0** | **true** |
| **invalid-secret** | **1** | **false** |
| **invalid-forbidden** | **1** | **false** |
| **invalid-schema** | **1** | **false** |

**Sample output:** [pm55-openclaw-bridge-adapter-valid-output.sample.json](../examples/pm55-openclaw-bridge-adapter-valid-output.sample.json)

---

## Explicit negatives

| Item | State |
|------|--------|
| **OpenClaw / gateway** | **Not** invoked |
| **n8n** | **Not** used |
| **Workflow 40 / 41** | **Not** touched |
| **Worker** | **Not** enabled |
| **n8n_ready** | **Always false** |
| **PM-34** | **Blocked** |

---

## Next

**PM-56** — adapter contract review (candidate).
