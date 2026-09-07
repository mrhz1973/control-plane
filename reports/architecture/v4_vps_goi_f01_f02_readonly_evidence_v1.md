# V4 GOI F01/F02 read-only evidence

**TASK_REF:** `V4_VPS_GOI_F01_F02_READONLY_EVIDENCE_V1`
**Issue:** #68
**Classification:** `PASS` (evidence complete; configuration not thereby correct)
**Timestamp (UTC):** `2026-09-07T06:23:01Z`
**BASE_HEAD:** `c947896daa1c07ee998a13982a9d02f185c0fa1e`
**Host:** NEW `31.70.139.73` / Tailscale `100.99.54.93` / MagicDNS `ionos-n8n-new.tailc01234.ts.net`

```text
F01_RESULT=STAGED_NOT_INCLUDED
F01_EFFECTIVE_CONFIG=/etc/nginx/nginx.conf
F01_VHOST_INCLUDED=NO
F02_RESULT=ACTIVE_OLD_ENDPOINT_FOUND
F02_GRAPHHOPPER_DESTINATION=http://100.114.7.53:8989
F02_ORS_DESTINATION=https://ubuntu.tailc01234.ts.net
OLD_EFFECTIVE_REFS_FOUND=YES
RUNTIME_MUTATIONS=0
OLD_CHANGED=NO
SECRET_VALUES_EXPOSED=0
NEXT_CLASSIFICATION=REMEDIATE_F01_INCLUDE_AND_F02_GIS_ENDPOINTS_IN_SEPARATE_DELTAS
```

SSH NEW only. No start/stop/enable/reload/edit/copy. GraphHopper left `active`/`disabled`. nginx/ORS/GIS/Nav/D-Flight remained inactive.

## Precheck

- Git `main` local and `origin/main` matched the expected base.
- NEW public IPv4 and Tailscale identity matched exactly.
- `goi-graphhopper`: `disabled` + `active`; listeners `[::ffff:100.99.54.93]:8989` and `[::ffff:127.0.0.1]:8990`.
- nginx, ORS, GIS, Nav, D-Flight, cert-renew timer: `disabled` + `inactive`. No listeners on `443/5000/8000/8010/8020`.

## F01 — nginx GOI vhost include/test chain

Effective unit: `/usr/lib/systemd/system/nginx.service` plus drop-in `/etc/systemd/system/nginx.service.d/goi-tailscale-ready.conf`.

- `ExecStart=/usr/sbin/nginx -g 'daemon on; master_process on;'`
- no `-c`; compiled `--conf-path=/etc/nginx/nginx.conf`
- `ExecStartPre` is `nginx -t` against the same default conf

Entry config `/etc/nginx/nginx.conf` includes:

- `/etc/nginx/conf.d/*.conf` → **0 matches**
- `/etc/nginx/sites-enabled/*` → **0 matches**

`/etc/nginx/sites-enabled` is empty (no `default`, no `goi-ors-gateway` symlink).

`/etc/nginx/sites-available/goi-ors-gateway` exists as a regular file (not a symlink). Structural non-secret extract:

- `listen 100.99.54.93:443 ssl;`
- `server_name ionos-n8n-new.tailc01234.ts.net;`
- `ssl_certificate /etc/goi-ors/tls/fullchain.pem;`
- `ssl_certificate_key /etc/goi-ors/tls/privkey.pem;`
- `proxy_pass http://127.0.0.1:8020;` on `/ors/status` and `/ors/v2/directions/...`

`nginx -t` (read-only) reported syntax ok for **`/etc/nginx/nginx.conf`**. That test does **not** load `sites-available/goi-ors-gateway`. Prior `nginx -t PASS` therefore validated the empty include set, not the staged GOI vhost.

**F01_RESULT:** `STAGED_NOT_INCLUDED`

## F02 — GIS GraphHopper/ORS destinations

Effective unit `/etc/systemd/system/goi-gis-app.service`:

- WorkingDirectory `/root/local-files/handoff-runtime/cursor-coordinate-converter`
- `ExecStart`: `python3 -m http.server 8000 --bind "$TS_IP"` (dynamic Tailscale IPv4)
- Environment: none
- No EnvironmentFiles

The GIS process is a static file server. The browser-consumed app is `coordinate_converter Claude.html` (10 870 739 bytes). Bounded search of that file (not docs/history/repomix):

| Constant | Value |
|---|---|
| `ROUTING_GRAPHHOPPER_ENDPOINT` | `http://100.114.7.53:8989` |
| `ROUTING_GRAPHHOPPER_ENDPOINT_LOCAL` | `http://127.0.0.1:8989` |
| `ROUTING_ORS_GATEWAY_BASE` | `https://ubuntu.tailc01234.ts.net` |
| `ROUTING_ORS_STATUS_PATH` | `/ors/status` |
| `ROUTING_ORS_DIRECTIONS_PATH` | `/ors/v2/directions` |

Counts in the HTML: OLD TS IP `100.114.7.53` = 5; OLD MagicDNS = 1; NEW public / NEW TS / NEW MagicDNS = 0. No `:8020` in the HTML (ORS is MagicDNS/`443` via nginx, not loopback `8020` from the client).

**F02_GRAPHHOPPER_DESTINATION:** `http://100.114.7.53:8989` (plus local option `http://127.0.0.1:8989`)

**F02_ORS_DESTINATION:** `https://ubuntu.tailc01234.ts.net` + `/ors/status` and `/ors/v2/directions`

**F02_RESULT:** `ACTIVE_OLD_ENDPOINT_FOUND`

### OLD refs classification

| Ref | Where | Class |
|---|---|---|
| `http://100.114.7.53:8989` | HTML routing constant | ACTIVE_EFFECTIVE |
| `https://ubuntu.tailc01234.ts.net` | HTML ORS gateway base | ACTIVE_EFFECTIVE |
| `http://127.0.0.1:8989` | HTML local GH option | ACTIVE_EFFECTIVE (loopback, not OLD identity) |
| `http://100.114.7.53:8010` | HTML `_dflightHelperBaseUrlOverride` (adjacent, not F02 destinations) | ACTIVE_EFFECTIVE in served HTML |
| `100.114.7.53` / GIS URL in `docs/`, `docs/QA-CHECKLIST.md`, work-units, `repomix-output.xml`, `infra/*/README.md` | not loaded as GIS config | NON_EFFECTIVE/HISTORICAL |

No NEW identity strings in the served HTML.

## Verdict

Evidence for F01 and F02 is complete. Configuration is **not** thereby correct. No remediation in this pass.

## Next

Separate deltas: include/enable GOI nginx vhost (F01) and retarget GIS HTML GraphHopper/ORS constants to NEW (F02). Do not treat this as GOI activation clearance.
