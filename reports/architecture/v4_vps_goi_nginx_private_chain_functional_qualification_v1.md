# V4 GOI nginx private-chain functional qualification on NEW

**TASK_REF:** `V4_VPS_GOI_NGINX_PRIVATE_CHAIN_FUNCTIONAL_QUALIFICATION_V1`
**Issue:** #68
**Classification:** `PASS`
**Timestamp (UTC):** `2026-09-07T07:40:16Z`
**BASE_HEAD:** `71bc3a3c4943cc6d003053d6cc04640f50b41e69`
**Host:** NEW `31.70.139.73` / Tailscale `100.99.54.93` / MagicDNS `ionos-n8n-new.tailc01234.ts.net`

```text
GOI_NGINX_FUNCTIONAL_QUALIFICATION=PASS
NGINX_RUNTIME=ACTIVE_NOT_ENABLED
NGINX_BIND=100.99.54.93:443
NGINX_PUBLIC_EXPOSURE=NONE
GOI_HTTPS_ORS_CHAIN=PASS
GOI_HTTPS_TLS_HOSTNAME_VERIFY=PASS
GOI_HTTPS_CORS_NEW_GIS=PASS
GOI_NGINX_BOOT_PERSISTENCE=PENDING
OLD_CHANGED=NO
SECRET_VALUES_EXPOSED=0
```

nginx is not promoted to `MIGRATED_VALIDATED`. GIS / Nav / D-Flight were not started. ORS and GraphHopper were not restarted.

## Precheck

- Git `main` local and `origin/main` matched expected base.
- NEW public/Tailscale identity exact. Serve=NONE, Funnel=NONE, PrimaryRoutes=None, ExitNodeOption=False.
- nginx `disabled`/`inactive`; ORS and GraphHopper `disabled`/`active`; GIS/Nav/D-Flight `disabled`/`inactive`.
- `goi-tailscale-ready` already `active`/`disabled`; helper `/usr/local/sbin/goi-wait-tailscale-ip` waits for `WANT=100.99.54.93` on `tailscale0` (NEW). No OLD IP.

### Effective nginx unit

| Field | Value |
|---|---|
| Fragment | `/usr/lib/systemd/system/nginx.service` |
| Drop-in | `/etc/systemd/system/nginx.service.d/goi-tailscale-ready.conf` |
| Requires/After | `goi-tailscale-ready.service` only as extra GOI dependency |
| Start side-effects | Does not start ORS/GIS/Nav/D-Flight |

### Filtered vhost (no `nginx -T` dump persisted)

`nginx -t` PASS. Effective files: `nginx.conf`, `mime.types`, `sites-enabled/goi-ors-gateway` → `sites-available/goi-ors-gateway`. `conf.d` empty. Ubuntu `default` site not enabled.

Only listen line in the effective graph:

`listen 100.99.54.93:443 ssl;`

`server_name ionos-n8n-new.tailc01234.ts.net;`  
`ssl_certificate /etc/goi-ors/tls/fullchain.pem;`  
`ssl_certificate_key /etc/goi-ors/tls/privkey.pem;`  
`proxy_pass http://127.0.0.1:8020;` on `/ors/status` and directions geojson.

No listen on `0.0.0.0`, `31.70.139.73`, `[::]`, OLD TS IP, or `:80`.

### TLS (secret-safe)

`fullchain.pem` `root:root` `644`; `privkey.pem` `root:root` `600`. Public-key match YES. SAN `DNS:ionos-n8n-new.tailc01234.ts.net`. OLD SAN absent. Valid `2026-09-07`–`2026-12-06`. Key value not printed.

## Start

`systemctl start nginx` only. Not enabled. No other unit start/restart.

- ActiveState `active` / running / UnitFileState `disabled`
- MainPID `373425` · NRestarts `0` · Result `success`
- Journal: Starting/Started only. No bind/TLS/config/upstream failure. JOURNAL_SECRET_LEAK=NO

## Listeners

- nginx: `100.99.54.93:443` only
- ORS: `127.0.0.1:8020` (PID `368923` unchanged)
- GraphHopper: TS `8989` + admin `8990` (PID `185266` unchanged)
- no `:80`, no `31.70.139.73:443`, no `0.0.0.0:443` / `[::]:443`
- no `5000/8000/8010`

## HTTPS / TLS

`curl --resolve ionos-n8n-new.tailc01234.ts.net:443:100.99.54.93 https://ionos-n8n-new.tailc01234.ts.net/ors/status` (no `-k`).

- OpenSSL `-verify_hostname` Verify return code `0 (ok)`
- Python `ssl.create_default_context` hostname verify PASS
- Handshake SAN = NEW MagicDNS; OLD SAN absent
- HTTP `200` · `Server: nginx` · JSON `status=ready` `secret=PRESENT`

## Proxy chain

Client → `100.99.54.93:443` nginx workers → `proxy_pass http://127.0.0.1:8020` → ORS PID unchanged serving `/ors/status`. Response JSON matches ORS gateway keys (`profiles,secret,secret_name,service,status,upstream_host,version`), not an nginx stub.

## CORS through nginx

| Origin | HTTP | ACAO | Vary |
|---|---|---|---|
| `http://100.99.54.93:8000` | 200 | exact NEW origin | Origin |
| `http://100.114.7.53:8000` | 403 `origin_forbidden` | none | n/a |

## Public exposure negative

`connect_ex(31.70.139.73, 443)=111` and `:80=111`. No public/wildcard 443 socket.

## Unrelated

GIS/Nav/D-Flight inactive/disabled. n8n health 200 on `127.0.0.1:5678` only (`HostIp 127.0.0.1`). Tailscale Serve still none. OLD not contacted.

## Next

Next separately bounded GOI runtime slice (GIS/Nav/D-Flight). Do not start them here. nginx boot persistence pending.
