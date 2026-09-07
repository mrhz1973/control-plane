# V4 NEW TLS recovery and qualification

**TASK_REF:** `V4_VPS_NEW_TLS_RECOVERY_V1`  
**Issue:** #68  
**Classification:** `PASS`  
**Timestamp (UTC):** `2026-09-07T02:11:06Z`  
**BASE_HEAD:** `e7ae7d8469de1390ae0deddb5eaad02179b88fd9`  
**Host:** NEW `31.70.139.73` / Tailscale `100.99.54.93`  
**MagicDNS:** `ionos-n8n-new.tailc01234.ts.net`

No private-key value or secret is recorded.

## Precheck

- Git `main`, local HEAD and remote `origin/main` matched the expected base.
- NEW public/Tailscale identity matched exactly.
- nginx and every GOI service/timer were inactive.
- No listener existed on `443`, `5000`, `8000`, `8010`, `8020`, `8989`, or `8990`.
- The already-installed certificate was inspected before renewal:
  - CN/SAN matched the NEW MagicDNS name;
  - the OLD `ubuntu.tailc01234.ts.net` identity was absent;
  - certificate and private key matched;
  - permissions were already correct.

## Bounded correction

Backups created on NEW:

- `/root/goi-ors-renew-cert.pre-v4-tls-recovery.20260907T021039Z`
- `/root/goi-tls-pre-recovery-20260907T021039Z/`

`/usr/local/sbin/goi-ors-renew-cert` now fails closed for:

- `tailscale cert` failure;
- certificate or key install failure;
- `nginx -t` failure;
- nginx reload failure when nginx is active.

When nginx is inactive, the helper skips reload and exits successfully. `bash -n` passed.

## Qualification

- Helper run with nginx inactive: exit `0`.
- SAN: `DNS:ionos-n8n-new.tailc01234.ts.net`.
- OLD SAN absent.
- Issuer: Let's Encrypt `YE2`.
- Validity: `2026-09-07T00:57:18Z` to `2026-12-06T00:57:17Z`.
- Certificate/private-key public-key match: PASS.
- `fullchain.pem`: `root:root` `0644`.
- `privkey.pem`: `root:root` `0600`.
- `nginx -t`: PASS.
- nginx remained inactive.
- All GOI services and renewal timer remained inactive.
- Forbidden GOI listeners remained absent.
- Tailscale Serve/Funnel remained unconfigured.
- NEW n8n remained health-valid with `execution_capable=0`, `published=0`.
- PostgreSQL remained healthy; LiteLLM remained running and unpublished.
- OLD was not contacted or modified during this task.

## Verdict

`NEW_TAILSCALE_TLS_ISSUANCE_QUALIFICATION=PASS`

## Next

Controlled GOI activation/qualification on NEW, followed by schema-engine qualification. Cutover remains closed.
