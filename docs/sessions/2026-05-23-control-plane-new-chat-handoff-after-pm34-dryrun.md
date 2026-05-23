# Control Plane — new chat handoff after PM-34 strict_pass dry-run

**Date:** 2026-05-23  
**Workspace:** Cursor CONTROL PLANE (arancione) — not DEV/GIS

---

## Repository

| Item | Value |
|------|--------|
| **Repo** | `https://github.com/mrhz1973/control-plane` |
| **Branch** | `main` |
| **HEAD** | `8ea087c` � docs: record PM-34 strict pass dry-run result |

### Prior important commits

| SHA | Message |
|-----|---------|
| `0eafafc` | docs: reconcile OpenClaw preview sequences |
| `98679ff` | docs: design strict pass artifact contract |
| `409df43` | docs: define PM-34 strict pass gate |
| `7edc52f` | docs: prepare PM-34 strict pass dry-run package |
| `537e3ea` | test: trigger PM-34 strict pass dry-run |

**Result doc:** [pm34 strict_pass dry-run result](2026-05-23-control-plane-pm34-strict-pass-dry-run-result.md)

---

## Runtime result (537e3ea trigger)

| Field | Value |
|-------|--------|
| PM-21 bridge | **dry_run_pass** |
| Worker | **mock-worker** |
| Codex | **no** |
| Real worker | **no** |
| Action | preview only |

---

## Current invariants

| Rule | State |
|------|--------|
| PM-34 real worker | **gated** |
| `pm34_unblocked` | **false** |
| `n8n_ready` | **false** |
| `strict_pass_candidate` | **false** |
| Workflow **40** | **ACTIVE** / untouched |
| Workflow **41** | **BACKUP OFF** / untouched |
| `docs/artifacts/openclaw/**` | **not** created |
| Raw OpenClaw logs in git | **no** |

---

## Operational rule

- **One prompt at a time** unless tasks are explicitly independent.  
- After each prompt, user sends a separate **aggio control** block.  
- If a next prompt depends on a prior commit or Telegram result, **do not** prepare it before aggio.

---

## Start here (new ChatGPT chat)

1. User sends **aggio control**.  
2. Read GitHub `main` and this handoff.  
3. Read [dry-run result](2026-05-23-control-plane-pm34-strict-pass-dry-run-result.md) and [pm-34 packet](../runtime-packets/pm-34-n8n-codex-worker-integration-gate.md).  
4. **Do not** launch real worker without explicit gate.

---

## Next recommended

- **New ChatGPT context** for orchestration.  
- Optional future: artifact-validation gate (not real worker by default).
