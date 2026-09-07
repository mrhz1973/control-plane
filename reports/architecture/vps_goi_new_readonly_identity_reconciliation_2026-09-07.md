# VPS GOI NEW read-only identity reconciliation — 2026-09-07

Scope: NEW VPS `31.70.139.73` only. Read-only operator evidence after successful Tailscale join. No service was started/enabled, no secret value was printed, and OLD was not changed.

## Identity baseline

- NEW Tailscale node: `ionos-n8n-new`
- NEW Tailscale IPv4: `100.99.54.93`
- NEW MagicDNS: `ionos-n8n-new.tailc01234.ts.net`
- OLD live identity retained: `100.114.7.53` / `ubuntu.tailc01234.ts.net`

## Service state on NEW

All GOI/shared activation surfaces remain safely inactive:

- `goi-graphhopper.service`: disabled / inactive
- `goi-ors-gateway.service`: disabled / inactive
- `goi-dflight-helper.service`: disabled / inactive
- `goi-gis-app.service`: disabled / inactive
- `goi-nav-proxy.service`: disabled / inactive
- `goi-tailscale-ready.service`: disabled / inactive
- `goi-ors-cert-renew.service`: static / inactive
- `goi-ors-cert-renew.timer`: disabled / inactive
- `nginx.service`: disabled / inactive
- GOI ports `443,5000,8000,8010,8020,8989,8990`: no listeners

## Project-local presence findings

Present:

- `/usr/local/sbin/goi-ors-renew-cert` — mode `755`, root:root
- `/etc/goi-dflight/csrf-public.pem` — mode `640`, root:root
- service accounts:
  - `graphhopper` uid/gid `970/970`
  - `goi-dflight` uid/gid `971/971`
  - `goi-ors` uid/gid `972/972`

Not present on NEW in this live check:

- `/etc/systemd/ors-credentials/ORS_API_KEY`
- `/etc/systemd/system/goi-ors-gateway.service.d/credential.conf`
- `/etc/systemd/system/goi-nav-proxy.service.d/override.conf`
- `/etc/systemd/system/nginx.service.d/goi-tailscale-ready.conf`
- `/var/lib/goi-dflight`

These findings supersede their previous `UNKNOWN` status on NEW. They are **NEW-path absence facts**, not yet proof that each item is required or present on OLD; OLD live parity check is required before copy/reconstruction decisions.

## Stale OLD identity references confirmed on NEW

`/etc/goi-dflight/config.toml` still contains:

- bind host `100.114.7.53`
- port `8010`
- origin allowlist `http://100.114.7.53:8000`

`/usr/local/sbin/goi-wait-tailscale-ip` still contains expected IP `100.114.7.53`.

`/etc/nginx/sites-available/goi-ors-gateway` still contains OLD placeholders/rendered identity:

- `listen 100.114.7.53:443 ssl`
- `server_name ubuntu.tailc01234.ts.net`
- upstream remains `127.0.0.1:8020`

By contrast, GIS and Nav proxy units already derive the Tailscale IPv4 dynamically at runtime using `tailscale ip -4`, so their primary bind command is not hard-coded to OLD:

- GIS: port `8000`, bind current Tailscale IPv4 dynamically
- Nav proxy: port `5000`, bind current Tailscale IPv4 dynamically

## Effective unit dependencies observed

- GraphHopper waits for tailscaled/network and runs as `graphhopper`; runtime config path is `/run/goi-graphhopper/config.yml`.
- ORS gateway runs as `goi-ors`; no `LoadCredential=` line appeared in the effective filtered unit output, consistent with the missing credential drop-in requiring OLD parity confirmation.
- D-Flight runs as `goi-dflight`, uses `/etc/goi-dflight/config.toml`, and references `LoadCredential=` paths `/etc/systemd/dflight-credentials/dflight_username` and `dflight_password`.
- GIS/Nav depend on tailscaled and derive current Tailscale IP dynamically.
- `goi-tailscale-ready.service` executes `/usr/local/sbin/goi-wait-tailscale-ip`, which is currently stale to OLD IP.

## Classification

```text
GOI_NEW_READONLY_RECONCILIATION=PASS_WITH_BLOCKERS
NEW_GOI_LISTENERS=NONE
OLD_IDENTITY_REFERENCES_PRESENT=YES
PROJECT_LOCAL_PATHS_NOW_CONFIRMED_ABSENT=5
NEW_GOI_ACTIVATION_SAFE=NO
OLD_CHANGED=NO
```

## Required next

Perform a **read-only OLD parity probe** for the five absent NEW paths plus D-Flight credential metadata and relevant unit/drop-in state. Do not print credential contents. After OLD parity is known, Control Plane can classify each item as copy-required, obsolete/not-required, or reconstruct-from-canonical-config, then prepare a bounded NEW-only config delta for `100.99.54.93` / `ionos-n8n-new.tailc01234.ts.net`.
