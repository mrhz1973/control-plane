# V4 GOI F01 nginx include remediation

**TASK_REF:** `V4_VPS_GOI_F01_NGINX_INCLUDE_REMEDIATION_V1`
**Issue:** #68
**Classification:** `PASS`
**Timestamp (UTC):** `2026-09-07T06:58:36Z`
**BASE_HEAD:** `213f6b0bd4dec6ca46f61e95c0ffdd49cf6f4380`
**Host:** NEW `31.70.139.73` / Tailscale `100.99.54.93` / MagicDNS `ionos-n8n-new.tailc01234.ts.net`

```text
F01_NGINX_INCLUDE_REMEDIATION=PASS
F01_NGINX_VHOST=EFFECTIVELY_INCLUDED_SYNTAX_VALID
NGINX_RUNTIME=INACTIVE
NGINX_FUNCTIONAL_QUALIFICATION=PENDING
F02_GIS_ENDPOINTS=ACTIVE_OLD_ENDPOINT_FOUND
RUNTIME_SERVICE_STARTS=0
OLD_CHANGED=NO
SECRET_VALUES_EXPOSED=0
```

Only mutation: symlink `/etc/nginx/sites-enabled/goi-ors-gateway` → `/etc/nginx/sites-available/goi-ors-gateway`. Vhost file content unchanged. nginx not started, reloaded, or enabled.

## Precheck

- Git `main` matched expected base.
- NEW identity exact.
- nginx `disabled`/`inactive`; ORS/GIS/Nav/D-Flight `disabled`/`inactive`.
- GraphHopper `disabled`/`active` (unchanged).
- `sites-enabled` empty; `sites-available/goi-ors-gateway` regular file.
- Staged vhost NEW-only: listen `100.99.54.93:443 ssl`, server_name NEW MagicDNS, TLS `/etc/goi-ors/tls/{fullchain,privkey}.pem`, `proxy_pass http://127.0.0.1:8020`. No OLD IPs/MagicDNS, no `0.0.0.0`, no `31.70.139.73`.

## Mutation and proof

- Created non-force symlink; `readlink -f` = `/etc/nginx/sites-available/goi-ors-gateway`.
- `nginx -t` PASS against `/etc/nginx/nginx.conf` after include.
- Filtered `nginx -T`: configuration file `/etc/nginx/sites-enabled/goi-ors-gateway` present in effective dump with the same listen/server_name/proxy_pass/TLS paths.
- `sites-enabled` glob now matches that one symlink; `conf.d` still empty.

## Post-state

- nginx still `disabled`/`inactive`; no listener on `443`.
- GraphHopper still `disabled`/`active` on `8989`/`8990`.
- ORS/GIS/Nav/D-Flight still inactive.
- nginx not promoted to `MIGRATED_VALIDATED`.
- F02 unchanged.

## Next

F02 GIS HTML GraphHopper/ORS retarget (separate delta). Do not start nginx in that pass unless separately authorized.
