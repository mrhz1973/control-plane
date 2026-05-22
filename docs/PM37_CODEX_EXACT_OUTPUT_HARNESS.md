# PM-37 — Codex exact-output harness

**Status:** **PASS** — mock harness and validator only; **no** Codex invocation.

**Related:** [PM-36 deviation](PM36_CODEX_REPO_READ_PROBE.md) · [PM-38 gate](runtime-packets/pm-38-real-codex-structured-output-probe-gate.md) · [batch session](sessions/2026-05-22-control-plane-pm37-pm38-codex-exact-output-harness.md)

---

## Purpose

Address **PM-36** lesson: do **not** trust unconstrained Codex natural-language final output before n8n integration.

Require **marker-delimited JSON**, validate schema **before** any automation consumes Codex output.

---

## PM-36 lesson

| Item | PM-36 |
|------|--------|
| Functional repo-read | **PASS** — read `docs/PM35_CODEX_NOOP_PROBE.md`; PM35 status **PASS** found |
| Format | **Deviation** — expected `CODEX_REPO_READ_OK` + `PM35_STATUS=PASS`; got `CODEX_NOOP_OK` |

---

## Required future output (PM-38)

```text
CONTROL_PLANE_JSON_START
{ ... single JSON object ... }
CONTROL_PLANE_JSON_END
```

### Required safety fields (all `false`)

- `file_modified`
- `git_command_used`
- `secret_accessed`
- `n8n_touched`
- `worker_enabled`

---

## PM-37 scope

| Does | Does not |
|------|----------|
| Define contract + mock validator | Invoke `codex` / `codex exec` |
| Write request/result samples | Enable worker |
| Parse marker block in mock | Touch n8n or workflow **40**/**41** |

**Tool:** `node tools/codex-exact-output-harness-dry-run.mjs`

**Samples:** [request](examples/pm37-codex-exact-output-request.sample.json) · [result](examples/pm37-codex-exact-output-result.sample.json)

---

## Next

**PM-38** — real structured Codex probe (separate gate).
