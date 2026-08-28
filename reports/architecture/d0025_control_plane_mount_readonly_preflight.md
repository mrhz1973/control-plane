# D-0025-W — control-plane mount read-only preflight

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W-CONTROL-PLANE-MOUNT-READONLY-PREFLIGHT`  
**Date:** 2026-08-28  
**Status:** **STOP** — `CONTROL_PLANE_HOST_PATH = ABSENT`  
**Runtime mutations:** 0  
**Inference / provider calls:** 0  
**Credential / OAuth mutations:** 0  
**Secret values read/displayed/persisted:** 0  
**TeamViewer / WORK-PC network mutations:** 0

## Result summary

| Field | Value |
|---|---|
| Compose ownership | **GROUNDED** |
| n8n mounts | **GROUNDED** |
| `CONTROL_PLANE_HOST_PATH` | **ABSENT** |
| Candidate mount (not applied) | `/root/local-files/handoff-runtime/control-plane` → `/files/handoff-runtime/control-plane:ro` |
| `CAN_ADD_BIND_MOUNT_WITHOUT_RECREATE` | **false** |
| Recreate required | **YES** (n8n service only) |
| Rollback | **PROVEN** |
| Active running-execution count | **UNKNOWN** (sqlite3 unavailable; WF40 active) |

**Stop reason:** No suitable `mrhz1973/control-plane` checkout exists on the VPS. A separate authorized gate is required before the read-only mount can be applied.

---

## Precheck

| Check | Result |
|---|---|
| issue #31 | **OPEN** |
| `litellm-primary` | **running** |
| `root-n8n-1` | **running** · StartedAt `2026-08-21T21:38:26.189399585Z` · RestartCount **0** |
| n8n restart performed | **no** |
| runtime mutations | **0** |

---

## Scope 1 — `root-n8n-1` origin (read-only)

| Field | Value |
|---|---|
| Container name | `root-n8n-1` |
| Container ID | `56e639b521e753b5ca097ad251c58c2d8382920aa0fc9014ebb25467422bdbc2` |
| Image ref | `docker.n8n.io/n8nio/n8n` |
| Image ID | `sha256:b1b0c592735e24acd3cc64db83f94ef4efd8e331e47c6883249cc51cc1bea16b` |
| n8n version | **2.19.5** |
| StartedAt | `2026-08-21T21:38:26.189399585Z` |
| RestartCount | **0** |
| Restart policy | `always` |
| Network mode | `root_default` |
| Entrypoint | `tini -- /docker-entrypoint.sh` |
| Published ports | `127.0.0.1:5678 → 5678/tcp` |

### Compose labels

| Label | Value |
|---|---|
| Docker Compose managed | **true** |
| `com.docker.compose.project` | `root` |
| `com.docker.compose.service` | `n8n` |
| `com.docker.compose.project.config_files` | `/root/docker-compose.yaml` |
| `com.docker.compose.project.working_dir` | `/root` |
| `com.docker.compose.version` | `5.5.0` |

### Current mounts

| Type | Host source | Container destination | Mode |
|---|---|---|---|
| bind | `/root/local-files` | `/files` | rw |
| bind | `/srv/cp-verifier-inbox` | `/files/control-plane-verifier-inbox` | rw |
| volume | `root_n8n_data` (`/var/lib/docker/volumes/root_n8n_data/_data`) | `/home/node/.n8n` | rw |

### Environment variable names only (no values read)

`GENERIC_TIMEZONE`, `N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS`, `N8N_PORT`, `N8N_PROTOCOL`, `N8N_RELEASE_TYPE`, `N8N_RUNNERS_ENABLED`, `N8N_SECURE_COOKIE`, `NODES_EXCLUDE`, `NODE_ENV`, `NODE_PATH`, `NODE_VERSION`, `NPM_CONFIG_UPDATE_NOTIFIER`, `PATH`, `SHELL`, `TZ`

No secret-shaped env names observed beyond standard n8n/runtime names. `${GENERIC_TIMEZONE}` is referenced in compose; env file content was **not** read.

---

## Scope 2 — Compose source (read-only)

**File:** `/root/docker-compose.yaml`  
**Project:** `root`  
**Services:** `n8n` only

```yaml
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n
    restart: always
    ports:
      - "127.0.0.1:5678:5678"
    environment:
      - N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - N8N_RUNNERS_ENABLED=true
      - "NODES_EXCLUDE=[]"
      - NODE_ENV=production
      - N8N_SECURE_COOKIE=false
      - GENERIC_TIMEZONE=${GENERIC_TIMEZONE}
      - TZ=${GENERIC_TIMEZONE}
    volumes:
      - n8n_data:/home/node/.n8n
      - ./local-files:/files
      - /srv/cp-verifier-inbox:/files/control-plane-verifier-inbox

volumes:
  n8n_data:
```

| Compose field | Value |
|---|---|
| image | `docker.n8n.io/n8nio/n8n` (floating tag in compose; live container image ID grounded above) |
| volumes | named `n8n_data` + two bind mounts |
| networks | implicit default project network → **`root_default`** |
| ports | loopback-only `5678` |
| restart | `always` |
| env_file references | **none** |
| dependencies | **none** |
| other services | **none** |

**Not modified.**

---

## Scope 3 — control-plane host path

### Search performed

Read-only search under `/root`, `/srv`, `/opt`, `/home`, `/files` for:

- directories named `control-plane` with `.git`
- remote origin `mrhz1973/control-plane`

### Git repositories found under handoff-runtime (not control-plane)

| Path | Remote | Branch |
|---|---|---|
| `/root/local-files/handoff-runtime/cursor-coordinate-converter` | `mrhz1973/cursor-coordinate-converter` | `main` |
| `/root/local-files/handoff-runtime/Planet-Clone` | `mrhz1973/Planet-Clone` | `main` |
| `/root/local-files/handoff-runtime/dev-method` | `mrhz1973/dev-method` | `main` |

### Result

| Field | Value |
|---|---|
| `CONTROL_PLANE_HOST_PATH` | **ABSENT** |
| Expected future path class | `/root/local-files/handoff-runtime/control-plane` (follows existing handoff-runtime convention) |
| Target directory exists | **no** |
| Parent permissions | `/root/local-files/handoff-runtime` · `755` · `root:root` |

**No clone, pull, chmod, chown, or directory creation performed.**

---

## Scope 4 — target mount design (conceptual only)

### Canonical contract target

```
/files/handoff-runtime/control-plane
```

### Candidate bind mount (NOT applied)

```
/root/local-files/handoff-runtime/control-plane:/files/handoff-runtime/control-plane:ro
```

### Collision check

| Check | Result |
|---|---|
| `/files/handoff-runtime/control-plane` inside container | **absent** |
| Name collision with existing mounts | **none** |
| Overlap with `/files` root bind | **compatible** — nested bind under existing `/root/local-files` → `/files` tree |

The mount is technically compatible once a host checkout exists at the candidate path.

---

## Scope 5 — recreation requirement

| Field | Value |
|---|---|
| `CAN_ADD_BIND_MOUNT_WITHOUT_RECREATE` | **false** |

Docker does not allow adding a new bind mount to a running container without recreate.

### Expected apply mechanics (not executed)

1. Add one read-only volume line to `/root/docker-compose.yaml` under `services.n8n.volumes`
2. Run `docker compose -f /root/docker-compose.yaml --project-directory /root up -d n8n`

### Blast radius

| Entity | Impact |
|---|---|
| `root-n8n-1` / compose service `n8n` | **recreated** |
| `litellm-primary` | **unaffected** — standalone `docker run`, not in compose |
| `root_default` network | **persists** — not recreated |
| `root_n8n_data` named volume | **persists** — workflows/credentials DB retained |
| WF40 / WF60 | **unchanged in DB** — stored in persisted volume |
| compose project | only service is `n8n`; `up -d n8n` should affect **n8n only** |

### Persistence implications

| Data | Survives recreate? |
|---|---|
| n8n SQLite DB (`database.sqlite`) | **yes** — named volume |
| workflow definitions / credentials metadata | **yes** — in named volume |
| bind mount host content (`/root/local-files`, `/srv/cp-verifier-inbox`) | **yes** — host paths unchanged |
| container-local ephemeral state | replaced on recreate |

---

## Scope 6 — rollback (candidate, not executed)

**Classification:** **ROLLBACK PROVEN**

Deterministic rollback for a future mount apply:

1. Remove the added bind-mount line from `/root/docker-compose.yaml`
2. Run `docker compose -f /root/docker-compose.yaml --project-directory /root up -d n8n`

Expected rollback properties:

| Requirement | Result |
|---|---|
| DB restore needed | **no** |
| workflow restore needed | **no** |
| network recreation needed | **no** |
| credential reset needed | **no** |
| `litellm-primary` impact | **none** |

---

## Scope 7 — downtime / risk

| Field | Value |
|---|---|
| Expected n8n downtime class | **brief** — container stop/start during recreate (seconds to low minutes) |
| Loopback port | `127.0.0.1:5678` unavailable during stop window |
| Active workflows (metadata) | WF40 **active**; two additional workflows active |
| Running execution count | **unknown** — host/container `sqlite3` unavailable; no execution termination performed |
| Safe window recommendation | apply during low-traffic window; verify zero running executions before future apply gate if sqlite tooling becomes available |

### Preserved in this pass

- `litellm-primary` running
- WF40/WF60 unchanged
- OpenClaw unchanged
- WF61 unimported
- schema engine uninstalled
- credentials unchanged

---

## Scope budget

| Metric | Value |
|---|---|
| runtime mutations | 0 |
| provider_calls | 0 |
| inference | 0 |
| GLM / Codex / Qwen | 0 |
| secret_exposure | false |
| TeamViewer/network mutations | 0 |

---

## Next gate (separate, not authorized here)

1. **Clone/copy gate:** populate `/root/local-files/handoff-runtime/control-plane` with canonical `mrhz1973/control-plane` checkout on VPS
2. **Mount apply gate:** add read-only bind mount + authorized n8n recreate
3. Then continue: VPS schema engine, Header Auth credential, WF61 import

Issue **#31** remains **OPEN**.
