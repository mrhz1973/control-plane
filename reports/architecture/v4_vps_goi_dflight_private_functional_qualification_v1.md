# V4 GOI D-Flight private functional qualification on NEW — STOP

**TASK_REF:** `V4_VPS_GOI_DFLIGHT_PRIVATE_FUNCTIONAL_QUALIFICATION_V1`
**Issue:** #68
**Classification:** `STOP`
**Timestamp (UTC):** `2026-09-07T07:49:48Z`
**BASE_HEAD:** `73dd5c0a2fa3836a1b0fd8a09c2f9588b4fb37c8`
**Host:** NEW `31.70.139.73` / Tailscale `100.99.54.93`

```text
GOI_DFLIGHT_FUNCTIONAL_QUALIFICATION=STOP
DFLIGHT_RUNTIME=INACTIVE_DISABLED
OLD_CHANGED=NO
SECRET_VALUES_EXPOSED=0
```

GIS and Nav were not started. GraphHopper / ORS / nginx were not restarted. No D-Flight config, credential, or state mutation.

## Finding

`systemctl start goi-dflight-helper.service` failed immediately:

`PermissionError: [Errno 13] Permission denied: '/etc/goi-dflight/config.toml'`

in `goi_dflight_helper.py` `main()` `cfg_path.is_file()`.

Effective DAC:

| Path | Mode | Owner:Group |
|---|---|---|
| `/etc/goi-dflight` | `0750` | `root:root` |
| `/etc/goi-dflight/config.toml` | `0640` | `root:root` |
| `/etc/goi-dflight/csrf-public.pem` | `0640` | `root:goi-dflight` |

Unit `User=goi-dflight` cannot traverse `/etc/goi-dflight` (`750` root-only execute). `ReadOnlyPaths=/etc/goi-dflight` under `ProtectSystem=strict` does not grant that DAC. CSRF PEM group is already service-readable but blocked by the directory.

This task is not authorized to remediate permissions. No second remediation loop.

## Precheck (before start)

- Bind/origin in `/etc/goi-dflight/config.toml` already NEW: `host=100.99.54.93` `port=8010` `origin_allowlist=["http://100.99.54.93:8000"]`.
- LoadCredential names `dflight_username` / `dflight_password` → `/etc/systemd/dflight-credentials/*` nonempty `600` `root:root`.
- LKG/state files present `goi-dflight:goi-dflight`.
- Canonical smoke identified from source: `GET /status` (read-only); `GET /dataset` for LKG; `POST /refresh` not used (mutating).

## Rollback

`systemctl stop goi-dflight-helper.service` only.

After:

- D-Flight `inactive` / `disabled`; no `:8010`
- GraphHopper PID `185266` active/disabled `8989`/`8990`
- ORS PID `368923` active/disabled `127.0.0.1:8020`
- nginx PID `373425` active/disabled `100.99.54.93:443`
- GIS/Nav inactive
- n8n still `127.0.0.1:5678` health 200

## Next

Bounded permission remediation for `/etc/goi-dflight` so `goi-dflight` can read `config.toml` (and reach the CSRF PEM), then retry this functional qualification. Do not start GIS/Nav here.
