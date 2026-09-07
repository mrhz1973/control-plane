# V4 GOI GraphHopper functional activation on NEW

**TASK_REF:** `V4_VPS_GOI_GRAPHHOPPER_ACTIVATION_V1`
**Issue:** #68
**Classification:** `PASS`
**Timestamp (UTC):** `2026-09-07T02:25:39Z`
**BASE_HEAD:** `b1c4ba9df93c11f71ab6fb3ef8c3fabf26459d9d`
**Host:** NEW `31.70.139.73` / Tailscale `100.99.54.93`
**MagicDNS:** `ionos-n8n-new.tailc01234.ts.net`

No secret is recorded.

## Precheck

- Git `main`, local HEAD and remote `origin/main` matched the expected base.
- NEW public/Tailscale identity matched exactly.
- `NEW_TAILSCALE_TLS_ISSUANCE_QUALIFICATION=PASS` remained in force from the prior TLS recovery.
- nginx, ORS, GIS, Nav, D-Flight, and cert-renew timer were inactive/disabled.
- No GOI listener existed on `443`, `5000`, `8000`, `8010`, `8020`, `8989`, or `8990` before start.
- Effective readiness helper `/usr/local/sbin/goi-wait-tailscale-ip` waited for exactly `100.99.54.93` on `tailscale0`.
- Generated GraphHopper config already bound app `100.99.54.93:8989` and admin `127.0.0.1:8990`.
- OLD was not contacted or modified.

## Bounded runtime correction

`/var/log/goi-graphhopper` was absent. systemd `ProtectSystem=strict` + `ReadWritePaths` failed with `status=226/NAMESPACE` before ExecStartPre. Restart loop was stopped, the log directory was created `graphhopper:graphhopper` mode `0750`, and the unit was started again without enable.

## Activation (no boot persistence)

- `systemctl start goi-tailscale-ready.service` → `active (exited)`, `disabled`.
- Helper: `goi-tailscale-ready: 100.99.54.93 assigned on tailscale0`.
- Canonical ExecStartPre `preflight.sh` then `render-config.sh` ran on start:
  - `PREFLIGHT_OK ts=100.99.54.93`
  - `RENDER_OK ... bind_app=100.99.54.93 bind_admin=127.0.0.1`
- `systemctl start goi-graphhopper.service` → `active (running)`, `disabled`.
- Journal: Jetty `Started application ... {100.99.54.93:8989}` and `Started admin ... {127.0.0.1:8990}`.
- After the successful start: `NRestarts=0`, `Result=success`. No crash-loop.

## Listeners

Observed sockets:

- `[::ffff:100.99.54.93]:8989` (IPv4-mapped bind of `100.99.54.93:8989`)
- `[::ffff:127.0.0.1]:8990` (IPv4-mapped bind of `127.0.0.1:8990`)

Negative:

- `31.70.139.73:8989` refused
- no GraphHopper on `0.0.0.0`
- no listener on `443`, `5000`, `8000`, `8010`, `8020`

## Routing smoke

Canonical request (not invented):

- path: `/opt/goi-graphhopper/staging/exec-c-20260729-001223/requests/smoke-short-hiking.request.json`
- also inlined in `/opt/goi-graphhopper/staging/exec-c-20260729-001223/scripts/exec-c-cutover.sh` as the `$API/route` hiking body
- sha256: `ebf9d5599ed4148ea9048e4c7d8622398bf26bdf9ae7098e53e0812d80b1c8b9`
- POST `http://100.99.54.93:8989/route`

Result: HTTP `200`, `paths[0].distance=3230.315`, `time_ms=2324633`, `points_len=122`.
`GET /health` on the Tailscale app bind returned `200 OK`.

## Left running / not enabled

`goi-tailscale-ready` and `goi-graphhopper` left **active** for the next GOI delta and **disabled** (no boot persistence). nginx / ORS / GIS / Nav / D-Flight remain inactive. GraphHopper is **not** promoted to `MIGRATED_VALIDATED`.

## Verdict

```text
GOI_GRAPHHOPPER_FUNCTIONAL_QUALIFICATION=PASS
GOI_GRAPHHOPPER_BOOT_PERSISTENCE=PENDING
```

## Next

Next GOI private slice (ORS/GIS/Nav/D-Flight/nginx as separately authorized). Schema-engine, restart-persistence proof, parallel OLD↔NEW validation, and cutover remain later.
