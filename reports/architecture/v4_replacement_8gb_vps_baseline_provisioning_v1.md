# V4 replacement 8GB VPS — baseline provisioning

**TASK_REF:** `V4_REPLACEMENT_8GB_VPS_BASELINE_PROVISIONING_V1`  
**Issues:** #67 (this pass) · parent #60  
**Classification:** `PASS`  
**Timestamp (UTC):** `2026-09-06T21:50:37Z`  
**BASE_HEAD:** `fe1db27c29df94c62e34a5a7399573041a97d21e`  
**Hosts:** OLD `ionos-n8n` (`217.160.71.145`) · REPLACEMENT NEW `ionos-n8n-new` (`31.70.139.73`)  
**Cutover:** **NOT performed** · OLD remains LIVE production  
**Superseded target:** previous NEW `31.70.139.51` (16 GB) — **cancelled / out of scope**

No secret values are recorded here.

---

## Preflight

| Check | Result |
|---|---|
| `origin/main` | `fe1db27c29df94c62e34a5a7399573041a97d21e` (local FF from `4d6dcfa`) |
| Tracked dirty tree | clean (pre-existing untracked preserved, not staged) |
| `ionos-n8n-new` public IPv4 | **31.70.139.73** |
| `ionos-n8n` public IPv4 | **217.160.71.145** (distinct) |
| OLD n8n health | 200; container IDs/StartedAt unchanged |

---

## Initial NEW inventory (pre-provision)

| Item | Value |
|---|---|
| OS | Ubuntu 24.04.4 LTS (`noble`) |
| Kernel | `6.8.0-138-generic` |
| CPU | 6 vCPU (AMD EPYC-Milan) |
| RAM | 7.7 GiB |
| Root FS | `/dev/vda1` ext4 **232G**, ~230G free |
| Swap | **0** |
| Users `cpinbox` / `hermes-test` | absent (UIDs 1000/1001 free) |
| Listeners | SSH `:22` + local DNS stub only |
| Docker / Node / Tailscale | absent |
| reboot-required | NO (at inventory) |

---

## Provisioning applied (NEW only)

### Packages
`ca-certificates`, `curl`, `git`, `jq`, `rsync`, `unzip`, `gnupg`, `python3`, `python3-venv`, `python3-pip`

### Docker Engine (official Ubuntu noble)
- Docker **29.8.0**
- Compose plugin **v5.5.1**
- `docker` service enabled/active
- Containers=0 · Images=0 (no app workload)

### Node.js
- NodeSource **22.x** → **v22.23.2** · npm **10.9.8**

### Tailscale
- Package **1.102.3** · `tailscaled` active
- `BackendState=NeedsLogin`
- **No** `tailscale up` / login / MagiсDNS mutation

### Swapfile 4 GiB
- Path `/swapfile` mode **600**
- `swapon` active · Size **4G**
- `/etc/fstab` entry: `/swapfile none swap sw 0 0` (single entry)

### Users
| User | UID:GID | Home mode |
|---|---|---|
| `cpinbox` | 1000:1000 | 755 |
| `hermes-test` | 1001:1001 | 750 |

No UID/GID collision. Dirs prepared: `/root/local-files/handoff-runtime`, `/srv/cp-verifier-inbox` (uid 1000).

---

## Final baseline

| Item | Value |
|---|---|
| Public IPv4 | `31.70.139.73` |
| RAM | 7.7 GiB |
| Swap | **4.0 GiB** active |
| Disk | 232G · ~7.3G used · ~225G avail |
| Docker | 29.8.0 · Compose v5.5.1 · **zero containers** |
| Node | v22.23.2 |
| Python | 3.12.3 + venv smoke OK |
| Tailscale | NeedsLogin / not joined |
| App ports 5678/5432/4000/9222/5900/6080 | **absent** |
| Reboot executed | **NO** |
| reboot-required flag | YES (`linux-image-6.8.0-139-generic`, `linux-base`) — **not acted on**; all acceptance met without reboot |

---

## OLD close fingerprint (unchanged)

| container | StartedAt | status |
|---|---|---|
| `root-n8n-1` `4df66089…e4f556` | `2026-09-05T08:15:02Z` | running health 200 |
| `root-postgres-1` `6691aadd…e98ce0` | `2026-09-01T14:32:36Z` | healthy |
| `litellm-primary` `edbb0398…63f635` | `2026-08-28T14:01:10Z` | running |

---

## Hard walls

| Wall | Result |
|---|---|
| OLD mutation / reboot / restart | not crossed |
| Tailscale join/up | not crossed |
| DNS / public route / cutover | not crossed |
| n8n/PG/LiteLLM/Hermes on NEW | not started |
| Secrets in evidence | none |
| Prior 16GB host `31.70.139.51` | not used |

---

## Next

**Isolated core replica** on this 8GB NEW (PostgreSQL/n8n/LiteLLM), using proven #64 `unpublish:workflow --all` before any n8n start. Hermes/browser remains a later #67 slice. Cutover remains GATE.
