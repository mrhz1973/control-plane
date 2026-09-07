# V4 active-nginx TLS renewal qualification on NEW

**TASK_REF:** `V4_VPS_ACTIVE_NGINX_TLS_RENEWAL_QUALIFICATION_V1`
**Issue:** #68
**Classification:** `PASS`
**Timestamp (UTC):** `2026-09-07T09:07:17Z`
**BASE_HEAD:** `9605eb4f1dbf3405a933d5c538f273788d9b8cf5`
**Host:** NEW `31.70.139.73` / Tailscale `100.99.54.93` (OLD not contacted)

```text
ACTIVE_NGINX_TLS_RENEWAL=PASS
TLS_RENEWAL_HELPER_ACTIVE_NGINX=PASS
TLS_RENEWAL_NGINX_TEST=PASS
TLS_RENEWAL_NGINX_RELOAD=PASS
TLS_RENEWAL_HTTPS_POST_RENEW=PASS
TLS_RENEWAL_LIVE_CERT_MATCH=PASS
TLS_RENEWAL_TIMER_ENABLEMENT=PASS
TLS_RENEWAL_TIMER_PERSISTENCE=PASS
TLS_IDENTITY=NEW_MAGICDNS_ONLY
TLS_PUBLIC_EXPOSURE=NONE
CERT_CONTENT_CHANGED=NO_SAME_VALID_CERT_RETURNED
OLD_CHANGED=NO
SECRET_VALUES_EXPOSED=0
```

## Precheck

Git `main` matched expected base. GOI stack active/enabled (7 units), listener topology exactly NEW-private, no `:80`, public negatives `111`. n8n health 200 loopback; PostgreSQL healthy; LiteLLM unpublished; Hermes four loopback units. Container IDs/StartedAt unchanged through task.

## Effective units

`goi-ors-cert-renew.service`: oneshot, `ExecStart=/usr/local/sbin/goi-ors-renew-cert`, `UnitFileState=static`.
`goi-ors-cert-renew.timer`: `OnCalendar=weekly`, `Persistent=true`, `RandomizedDelaySec=1h`, `WantedBy=timers.target`. Pre-state: `disabled`/`inactive`, never triggered.

## Helper provenance

`/usr/local/sbin/goi-ors-renew-cert` (897 B, Sep 7 02:10) matches `v4_vps_new_tls_recovery_v1` fail-closed shape: explicit `DOMAIN="ionos-n8n-new.tailc01234.ts.net"` (NOT `hostname -f`), tailscale cert failure → nonzero, install failures → nonzero, `nginx -t` failure → nonzero, and when nginx active: `systemctl reload nginx` failure → nonzero. Active-nginx reload branch present. No drift.

## TLS pre-state (secret-safe)

fullchain `0644` `root:root` sha256 `1493e6ec…a514f`; privkey `0600` `root:root` sha256 `8408f506…2fd6c` (never printed). CN/SAN `ionos-n8n-new.tailc01234.ts.net`; OLD SAN absent; issuer Let's Encrypt `YE2`; validity `2026-09-07` → `2026-12-06`; cert/key pubkey match PASS.

Root-only backup: `/root/goi-tls-pre-renewal-20260907T090717Z/` (`700`, hashes equal pre-state). Not in git.

## Renewal execution

`systemctl start goi-ors-cert-renew.service` (canonical unit path).

- Result `success`, `ExecMainStatus=0`, "Deactivated successfully"
- Journal: tailscale cert wrote cert+key → installs → `nginx -t` successful → `nginx active; reload completed`

## Cert post-state

Modes/owner unchanged; hashes unchanged → `CERT_CONTENT_CHANGED=NO_SAME_VALID_CERT_RETURNED` (Tailscale returned the still-valid current cert; issuance+install+reload chain fully exercised). SAN exact NEW; OLD SAN absent; pubkey match PASS; validity not regressed.

## nginx reload proof

Master `417203` unchanged pre/post; workers rotated `417204-417210` → `429571-429576`; journal shows systemd "Reloading nginx.service" → signal process → "Reloaded nginx.service"; `NRestarts=0`, Result `success`. This is an actual reload, not mere survival.

## HTTPS post-renewal (no `-k`, hostname verified)

`GET https://ionos-n8n-new.tailc01234.ts.net/ors/status` via `100.99.54.93:443`:

- 200 · `Server: nginx` · `ready`/`PRESENT`
- with `Origin: http://100.99.54.93:8000` → ACAO exact GIS origin

Live served leaf sha256 `1ed1e5d0…a7f6d` = installed fullchain leaf; live SAN NEW only; OLD SAN absent live.

## Timer enablement

`systemctl enable --now goi-ors-cert-renew.timer` → active/waiting, enabled, symlink under `timers.target.wants`, next trigger `Mon 2026-09-14 00:19:43 UTC` (weekly + randomized delay). Service remains inactive/dead after successful completion. No second renewal triggered.

## Minimal GOI regression

GH `/health` 200 · ORS loopback `/ors/status` 200 · D-Flight `READY` · GIS file 200 · Nav `tokens_ok=true`/`last_error=null`. All PIDs unchanged; no restarts caused by task.

## Invariants

n8n/Postgres/LiteLLM same IDs+StartedAt; health 200; unpublished. Hermes unchanged. Tailscale Serve/Funnel NONE, routes none. Topology post-task identical; no `:80`; public `:443`/`:80` negatives `111`.

## F03

Aggregate rollup frozen `15/14/0/1` (`ROLLUP_COUNTS_STATUS=UNRECONCILED_F03`). GOI TLS renewal row promoted individually to `MIGRATED_VALIDATED`.

## Next

Parallel OLD↔NEW validation (F03 denominator, F04 OLD public `:80` requiredness, F05 OLD TLS renewal/rollback health, final parity). Not started here.
