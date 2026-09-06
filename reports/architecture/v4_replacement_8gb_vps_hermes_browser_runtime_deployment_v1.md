# V4 replacement 8GB VPS — Hermes/browser runtime deployment

**TASK_REF:** `V4_REPLACEMENT_8GB_VPS_HERMES_BROWSER_RUNTIME_DEPLOYMENT_V1`  
**Issues:** #67 (this pass) · parent #60  
**Classification:** `PASS`  
**Timestamp (UTC):** `2026-09-06T22:25:30Z`  
**BASE_HEAD:** `8bccd69c7c38bf87d96cb3400bcd15c86c6e9fa5`  
**Hosts:** OLD `ionos-n8n` (`217.160.71.145`) · NEW `ionos-n8n-new` (`31.70.139.73`, 8GB)  
**Cutover:** **NOT performed** · ChatGPT login **NOT performed** · no provider/model inference

No secret values, cookies, tokens, or VNC passwords are recorded here.

---

## Precheck

| check | result |
|---|---|
| `origin/main` | `8bccd69c7c38bf87d96cb3400bcd15c86c6e9fa5` |
| NEW public IPv4 | `31.70.139.73` |
| OLD public IPv4 | `217.160.71.145` |
| NEW n8n health | 200 loopback |
| NEW execution-capable | 0 |
| NEW PostgreSQL | healthy, unpublished |
| NEW LiteLLM | running, unpublished |
| NEW Tailscale | Logged out / `NeedsLogin` |
| pre listeners | ssh + resolver + `127.0.0.1:5678` only |

---

## OLD read-only reference (unchanged)

| item | proven value |
|---|---|
| Hermes | `v0.21.0 (2026.8.31)` · git · `~/.hermes/hermes-agent` · local `3ac671db` |
| upstream | `https://github.com/NousResearch/hermes-agent.git` |
| browser config | `cdp_url: http://127.0.0.1:9222` · `backend: off` |
| Chromium | Playwright under `~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome` |
| CDP flags | `--remote-debugging-address=127.0.0.1 --remote-debugging-port=9222` · **no `--no-sandbox`** |
| sandbox helper | `/usr/local/sbin/chrome-devel-sandbox` root:root mode `4755` (= playwright `chrome_sandbox`) |
| Xvfb | `:99` · `1440x900x24` |
| x11vnc | `127.0.0.1:5900` (`-localhost`) |
| noVNC | `websockify --web=/usr/share/novnc 127.0.0.1:6080 127.0.0.1:5900` |
| systemd on OLD | **none** (manual processes) — NEW uses systemd for 24/7 |

OLD containers **not** stopped/restarted. Cookies/profile/auth **not** read or copied.

---

## NEW Hermes install

| item | result |
|---|---|
| method | official `install.sh --skip-setup --force-commit --commit 3ac671db…` |
| version | **Hermes Agent v0.21.0 (2026.8.31)** · local `3ac671db` |
| user | `hermes-test` uid 1001 |
| binary | `/home/hermes-test/.local/bin/hermes` |
| agent home | `/home/hermes-test/.hermes/hermes-agent` |
| provider credentials | **not configured** this pass |
| `browser.cdp_url` | `http://127.0.0.1:9222` |

---

## Browser / display / VNC

| component | result |
|---|---|
| Playwright Chromium | `chromium-1243` · Chrome for Testing `153.0.8010.12` |
| system libs | installed (atk/cups/asound/cairo/pango/gtk…) after first ldd miss |
| sandbox | `/usr/local/sbin/chrome-devel-sandbox` mode `4755` · helper seen in zygote cmdline |
| `--no-sandbox` | **absent** (unit + live cmdline) |
| profile | **fresh** `/home/hermes-test/.hermes/chatgpt-chrome-profile` · marker `host=NEW_8GB` · **no OLD auth transfer** |
| note | Chromium may create empty `Default/Cookies` / `Login Data` SQLite scaffolding after first start (sizes observed ~20KiB/~40KiB); not OLD session copy |
| Xvfb | systemd `hermes-xvfb` · `:99` · `1440x900` · depth 24 |
| CDP | `127.0.0.1:9222` only · `/json/version` **200** · targets enumerable |
| x11vnc | systemd `hermes-x11vnc` · `127.0.0.1:5900` (+ `[::1]:5900`) |
| noVNC | systemd `hermes-novnc` · `127.0.0.1:6080` · `/vnc.html` **200** |
| public probes `:9222/:5900/:6080` | connection refused |
| systemd units | `hermes-xvfb` · `hermes-chromium` · `hermes-x11vnc` · `hermes-novnc` · enabled · secret-free |

---

## Functional non-auth proofs

| proof | result |
|---|---|
| Hermes resolves configured CDP URL | HTTP 200 on `http://127.0.0.1:9222/json/version` |
| Chromium service restart | PASS · CDP 200 after restart · same profile path + fresh marker · sibling services stay active |
| restart storm | no (`NRestarts=0` after intentional restart) |
| ChatGPT login | **not performed** |
| model/provider inference | **not performed** |

---

## Resource baseline (deployment, not endurance grade)

### Before browser stack

| metric | value |
|---|---|
| Mem | 7.7Gi total · ~1.9Gi used · ~5.8Gi available |
| Swap | 4.0Gi · ~12Ki used |
| root fs | 232G · 13G used · 220G free |
| load | ~0.24 / 0.43 / 0.71 |
| OOM | none |

### After browser stack (post Chromium restart)

| metric | value |
|---|---|
| Mem | 7.7Gi total · ~2.2Gi used · ~5.5Gi available |
| Swap | 4.0Gi · ~268Ki used |
| root fs | 232G · 16G used · 216G free |
| load | ~0.70 / 1.20 / 1.05 |
| RSS Chromium aggregate | ~1375 MiB |
| RSS Xvfb | ~29 MiB |
| RSS x11vnc | ~16 MiB |
| RSS websockify | ~37 MiB |
| RSS browser-stack total | ~1457 MiB |
| Hermes idle daemon | not running (CLI install only; no gateway) |
| OOM | none |

No GREEN/AMBER/RED invented this pass.

---

## Core replica preservation (NEW)

| check | result |
|---|---|
| PostgreSQL | healthy · `5432` unpublished |
| n8n | health 200 · `127.0.0.1:5678` · StartedAt `2026-09-06T22:05:03Z` unchanged |
| execution-capable | **0** |
| max execution id | **311171** unchanged (delta 0) |
| execution count this window | **10091** unchanged during qualify (no growth) |
| LiteLLM | running · `4000/tcp` unpublished |
| provider inference | none |

Note: absolute execution row count is lower than the earlier replica dump baseline (`10223`) due to non-growth/pruning dynamics; **no new executions** (max id invariant) and capable=0 hold.

---

## OLD close fingerprint (unchanged)

| container | id | StartedAt | status |
|---|---|---|---|
| `root-n8n-1` | `4df66089…e4f556` | `2026-09-05T08:15:02.702674396Z` | running health 200 |
| `root-postgres-1` | `6691aadd…e98ce0` | `2026-09-01T14:32:36.972332829Z` | healthy |
| `litellm-primary` | `edbb0398…63f635` | `2026-08-28T14:01:10.735053817Z` | running |

---

## Hard walls

| wall | result |
|---|---|
| Tailscale join/up | **NeedsLogin** |
| DNS / nginx cutover / MagicDNS / hostname | not touched |
| ChatGPT login / OLD cookie/profile copy | not performed |
| provider/model calls | not performed |
| workflow republish | not performed |
| reboot | **not executed** |
| secrets in Git/report | **none** |

---

## Next (out of this pass)

HUMAN fresh ChatGPT login through private SSH tunnel, then sentinel/auth/resource qualification. Tailscale/DNS/cutover remain **GATE**.
