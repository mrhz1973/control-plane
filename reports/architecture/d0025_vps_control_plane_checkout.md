# D-0025-W — VPS control-plane checkout

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W-VPS-CONTROL-PLANE-CHECKOUT`  
**Date:** 2026-08-28  
**Status:** **PASS**  
**Operator authorization:** issue #31 comment `5452115059`  
**Runtime mutations:** 1 bounded (Git clone only)  
**Compose / mount / n8n mutations:** 0  
**Inference / provider calls:** 0  
**Credential / OAuth mutations:** 0  
**Secret values read/displayed/persisted:** 0  
**TeamViewer / WORK-PC network mutations:** 0

## Result summary

| Field | Value |
|---|---|
| VPS checkout path | `/root/local-files/handoff-runtime/control-plane` |
| Repository identity | `mrhz1973/control-plane` |
| Origin URL | `https://github.com/mrhz1973/control-plane.git` (secret-free) |
| Branch | `main` |
| Upstream | `origin/main` |
| HEAD | `db7879e0c21e9aea141a8951be9b8f9124afb5cb` |
| `origin/main` | `db7879e0c21e9aea141a8951be9b8f9124afb5cb` |
| Baseline ancestry | **PASS** — baseline is HEAD |
| Worktree | **clean** |
| Auth mechanism class | `HTTPS_PUBLIC_CLONE` — no credential mutation; no stored credential artifacts detected |
| Required tools | **all present** |
| `root-n8n-1` | **running**, unrestarted |
| `litellm-primary` | **running**, unchanged |

---

## Precheck

| Check | Result |
|---|---|
| WORK-PC repo | clean · fast-forwarded to `db7879e0c21e9aea141a8951be9b8f9124afb5cb` |
| issue #31 | **OPEN** |
| authorization `5452115059` | **present** |
| target path collision | **absent** before clone |
| `litellm-primary` | **running** |
| `root-n8n-1` before | running · StartedAt `2026-08-21T21:38:26.189399585Z` · RestartCount **0** |

---

## Checkout execution

```bash
export GIT_TERMINAL_PROMPT=0
git clone --branch main https://github.com/mrhz1973/control-plane.git \
  /root/local-files/handoff-runtime/control-plane
cd /root/local-files/handoff-runtime/control-plane
git fetch origin main
```

No compose edit, n8n restart, mount apply, package install, chmod/chown, or credential mutation performed.

---

## Verification

| Check | Result |
|---|---|
| `.git` present | **yes** |
| `git remote get-url origin` | `https://github.com/mrhz1973/control-plane.git` |
| `git rev-parse --abbrev-ref HEAD` | `main` |
| detached HEAD | **no** |
| `git status --porcelain` | empty |
| `git branch -vv` | `* main db7879e [origin/main] runtime: authorize VPS control-plane checkout` |
| HEAD == origin/main | **yes** |
| baseline `db7879e0...` ancestor of HEAD | **yes** (HEAD equals baseline) |
| checkout readable | **yes** (`755 root:root`) |

### Required canonical tools

| Tool | Status |
|---|---|
| `tools/run-litellm-primary-cycle.mjs` | **present** |
| `tools/build-llm-gateway-request.mjs` | **present** |
| `tools/normalize-litellm-responses-body.mjs` | **present** |
| `tools/validate-openclaw-planner-response-gate.mjs` | **present** |
| `tools/validate-execution-packet-v1.mjs` | **present** |
| `tools/evaluate-execution-packet-policy.mjs` | **present** |

---

## Auth safety (class only)

| Mechanism | Detected |
|---|---|
| Git credential helper configured | **no** |
| `.git-credentials` / `.netrc` | **absent** |
| GitHub CLI (`gh`) | **absent** |
| SSH private key files (`id_ed25519`, `id_rsa`) | **not detected** |
| Credential/token values read | **no** |
| Credential mutation | **no** |

Clone succeeded via secret-free HTTPS origin URL without interactive prompt (`GIT_TERMINAL_PROMPT=0`).

---

## n8n / LiteLLM safety (after checkout)

| Field | Before | After | Delta |
|---|---|---|---|
| `root-n8n-1` state | running | running | none |
| StartedAt | `2026-08-21T21:38:26.189399585Z` | same | none |
| RestartCount | 0 | 0 | none |
| `/root/docker-compose.yaml` | unchanged | unchanged | none |
| mount apply | not performed | not performed | — |
| `litellm-primary` | running | running | none |

---

## Scope budget

| Metric | Value |
|---|---|
| runtime mutations (bounded) | 1 (git clone) |
| compose mutations | 0 |
| mount mutations | 0 |
| package install | 0 |
| provider_calls | 0 |
| inference | 0 |
| GLM / Codex / Qwen | 0 |
| secret_exposure | false |
| TeamViewer/network mutations | 0 |

---

## Preserved (not touched)

- OpenClaw / WF40 / WF60 live unchanged
- WF61 not imported
- VPS schema engine not installed
- LiteLLM config/credentials unchanged
- WORK-PC network/TeamViewer unchanged

---

## Next gate (separate, not authorized here)

1. **Mount apply gate:** add read-only bind mount to compose + authorized n8n recreate only
2. VPS schema engine install
3. Header Auth credential binding
4. WF61 inactive import

Issue **#31** remains **OPEN**.
