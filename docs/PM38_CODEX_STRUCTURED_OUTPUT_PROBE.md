# PM-38 — Real Codex structured-output probe

**Status:** **STRICT FORMAT FAIL / FUNCTIONAL JSON PARTIAL** (2026-05-22)

**Related:** [PM-37 harness](PM37_CODEX_EXACT_OUTPUT_HARNESS.md) · [pm-38 gate](runtime-packets/pm-38-real-codex-structured-output-probe-gate.md) · [session](sessions/2026-05-22-control-plane-pm38-codex-structured-output-probe-strict-fail.md) · [output sample](examples/pm38-codex-structured-output-probe-output.sample.json)

---

## Purpose

Real `codex.cmd exec` probe using the **PM-37** marker + JSON contract.

---

## Evidence (functional)

| Check | Result |
|-------|--------|
| Target file read | **Yes** — `docs/PM35_CODEX_NOOP_PROBE.md` |
| PM35 status in content | **PASS** |
| Sandbox / approval | read-only · never |
| JSON-like output | **Yes** |

---

## Strict contract failure

| Expected | Actual |
|----------|--------|
| `CONTROL_PLANE_JSON_START` / `END` | `<<<JSON>>>` / `<<<END_JSON>>>` |
| `schema_version`, `target_file`, `pm35_status`, … | Drifted field names (`modified_files`, `git_commands`, `marker`: `CODEX_NOOP_OK`) |

---

## Conclusion

| Item | State |
|------|--------|
| Repo-read functional | **PASS** |
| Structured automation contract | **FAIL** |
| **PM-34** n8n integration | **Blocked** |
| **Next** | **PM-39** stricter harness hardening — **not** PM-34 runtime |

---

## Explicit negatives

| Item | State |
|------|--------|
| n8n / workflow 40/41 | **Not touched** |
| Worker enabled | **No** |
| Codex thread id in git | **Not recorded** |
