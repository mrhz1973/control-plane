# VPS GOI post-render pre-activation verification — 2026-09-07

Result: `GOI_POST_RENDER_PREACTIVATION_VERIFY=PASS`.

Operator-run live verification on NEW `31.70.139.73` proved:

- NEW Tailscale identity is `100.99.54.93`.
- ORS credential drop-in is loaded by systemd and points to `/etc/systemd/ors-credentials/ORS_API_KEY` without exposing the value.
- Nav proxy and nginx readiness drop-ins are loaded.
- D-Flight bind/origin are NEW-specific: `100.99.54.93:8010` and `http://100.99.54.93:8000`.
- D-Flight CSRF PEM ownership/mode are `root:goi-dflight` / `640`.
- D-Flight LKG/state files are present with `goi-dflight:goi-dflight` ownership and expected modes.
- Tailscale readiness helper expects `100.99.54.93`.
- GraphHopper rendered config binds app to `100.99.54.93:8989` and admin to `127.0.0.1:8990`.
- nginx vhost binds `100.99.54.93:443`, names `ionos-n8n-new.tailc01234.ts.net`, and proxies to loopback ORS `127.0.0.1:8020`.
- `nginx -t` PASS.
- The currently staged certificate is still the OLD identity `ubuntu.tailc01234.ts.net`; this is expected and proves NEW TLS issuance is still required.
- Renewal helper is rendered to explicit NEW domain `ionos-n8n-new.tailc01234.ts.net` and does not derive from OS hostname.
- renewal service is static/inactive; timer disabled/inactive.
- all GOI/nginx units remain disabled/inactive.
- no GOI listener is open.
- TLS issuance was not performed during this verification.

Classification:

```text
GOI_POST_RENDER_PREACTIVATION_VERIFY=PASS
NEW_TLS_IDENTITY=NOT_YET_ISSUED
GOI_SERVICES=NOT_ACTIVATED
CUTOVER=NOT_AUTHORIZED
OLD_DECOMMISSION_ELIGIBLE=NO
NEXT=NEW_TAILSCALE_TLS_ISSUANCE_QUALIFICATION
```

No OLD mutation, DNS/public route change, service activation, cutover, reboot or shutdown occurred.