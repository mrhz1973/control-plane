# Shared infrastructure registry

This file records the authoritative owner and current state for VPS resources that must not be configured independently by specialist projects.

Project pre-join handoffs were reconciled before Tailscale join. NEW Tailscale authentication/join and post-join read-only identity/static-state verification succeeded on 2026-09-07. A subsequent live NEW GOI read-only reconciliation exposed the remaining OLD-identity/config parity blockers without activating any service.

| Shared resource | Owner | OLD current state | NEW current state | Mutation rule / gate |
|---|---|---|---|---|
| Public host identity | Control Plane | `217.160.71.145` LIVE | `31.70.139.73` PREP | no public cutover before human gate |
| Tailscale node identity | Control Plane | node `ubuntu`, TS IP `100.114.7.53`, MagicDNS `ubuntu.tailc01234.ts.net` | node `ionos-n8n-new`, TS IPv4 `100.99.54.93`, TS IPv6 `fd7a:115c:a1e0::6a3a:365f`, MagicDNS `ionos-n8n-new.tailc01234.ts.net`; OS hostname still `ubuntu` | join + exact DNSName/static config PASS; private component reachability/restart persistence still pending |
| NEW Tailscale hostname | Control Plane | n/a | `ionos-n8n-new` | explicitly selected and proven; do not silently replace with OS hostname `ubuntu` |
| MagicDNS | Control Plane | OLD `ubuntu.tailc01234.ts.net` live | exact NEW name `ionos-n8n-new.tailc01234.ts.net` verified | use exact NEW identity for GOI/TLS rendering; never reuse OLD name while OLD is live |
| DNS/public routing | Control Plane | OLD remains production | NEW not cut over | explicit human cutover only |
| Tailscale ACL/routes | Control Plane with project input | OLD GOI clients use TS-bound `443,5000,8000,8010,8989` | `PrimaryRoutes=NONE`; no advertised primary routes observed | no route advertisement mutation unless explicitly required; component reachability validation still pending |
| Tailscale exit-node role | Control Plane | not required by current migration state | `ExitNodeOption=False` | do not enable without a separate explicit requirement |
| Tailscale Serve/Funnel | Control Plane | no serve config in last census | `No serve config` / `No serve config` verified after join | must remain none unless separately authorized |
| nginx global service | Control Plane | active/enabled OLD | installed but disabled/inactive NEW | activation centralized; do not enable before GOI config/TLS pass |
| GOI nginx vhost | Control Plane with GOI input | active on OLD TS IP | staged, disabled through global nginx; still binds `100.114.7.53:443` and server_name `ubuntu.tailc01234.ts.net` | after OLD parity check, render NEW `100.99.54.93` + `ionos-n8n-new.tailc01234.ts.net`; upstream remains `127.0.0.1:8020` |
| GOI nginx readiness drop-in | Control Plane with GOI input | expected from prior handoff, exact OLD live presence not yet re-proven | `/etc/systemd/system/nginx.service.d/goi-tailscale-ready.conf` confirmed absent on NEW | read-only OLD parity first; copy/reconstruct only if required; no nginx enablement yet |
| GOI Tailscale readiness | Control Plane with GOI input | OLD helper documented against `100.114.7.53` | helper present but still expects `100.114.7.53`; service disabled/inactive | bounded NEW-only update to `100.99.54.93` only after OLD parity/classification |
| GOI endpoint transition | Control Plane with GOI input | GIS references OLD GraphHopper IP and OLD ORS MagicDNS in documented topology | NEW exact identity known; GIS/Nav primary binds dynamically use current Tailscale IP, but service/client endpoint refs still require reconciliation | reconcile endpoint refs after OLD parity; no client cutover yet |
| GOI ORS credential | GOI component / Control Plane activation gate | expected project-local credential + systemd drop-in; OLD live presence must be re-proven | `/etc/systemd/ors-credentials/ORS_API_KEY` and ORS credential drop-in confirmed absent on NEW | secret-safe OLD parity; copy/reconstruct path only, never print value; ORS activation blocked until resolved |
| GOI D-Flight state | GOI component / Control Plane activation gate | prior handoff expects LKG/cache semantics | CSRF public PEM present; `/var/lib/goi-dflight` confirmed absent; config still points at OLD TS host/origin | read-only OLD state metadata probe; preserve any required LKG state before activation |
| GOI D-Flight credentials | GOI component / Control Plane activation gate | OLD credential files documented | prep-copy reported secret-safe copy; effective NEW unit references `/etc/systemd/dflight-credentials/dflight_username` and `dflight_password`; live metadata not yet explicitly checked | metadata-only confirmation next; never print values |
| GOI Nav proxy override | GOI component / Control Plane activation gate | expected override path in handoff, exact OLD live role unproven | `/etc/systemd/system/goi-nav-proxy.service.d/override.conf` absent; base unit dynamically binds current TS IP | read-only OLD parity decides whether override is required or obsolete |
| TLS identity | Control Plane with GOI input | OLD cert CN belongs to `ubuntu.tailc01234.ts.net` | OLD material archived; no valid NEW serving cert; renew helper present | NEW certificate must target `ionos-n8n-new.tailc01234.ts.net`; issuance after config parity delta is explicit |
| TLS renewal | Control Plane with GOI input | OLD timer exists; renewal helper derives identity from host naming | service static/inactive, timer disabled/inactive | qualify after NEW-specific render; OS hostname remains `ubuntu`, so helper must not infer wrong identity |
| Public ports `80/443` | Control Plane | OLD nginx owns | NEW no GOI listener; nginx inactive | no public activation before shared infra pass; GOI `443` must be Tailscale-bound only |
| GOI TS-bound ports | Control Plane allocates; specialist validates component | OLD `443,5000,8000,8010,8989`; loopback `8020,8990` | live probe confirms no listeners on any GOI port | enable only after config collision check, credential/state parity, and NEW identity reconciliation; never expose `8020/8990` to tailnet/public |
| n8n loopback `5678` | Control Plane | OLD production | NEW isolated replica | NEW publication/cutover separately authorized; specialist projects must not mutate |
| schema-engine local dependency | Control Plane | isolated Ajv dependency consumed through n8n bind mount | copied, resolver smoke pending | no network dependency; validate independently |
| dev-method reference tree | dev-method / Control Plane | tree-only method/reference copy | copied/validated | no shared network dependency |
| OpenClaw preserved fallback | Control Plane | `/opt/openclaw-*`, no unit/listener in latest census | copied/staged, inactive | future activation/listener/provider-auth work is a separate gate |
| Hermes CDP/VNC/noVNC `9222/5900/6080` | Control Plane/Hermes | loopback | loopback, qualified | must remain private/loopback |
| Docker common runtime | Control Plane | Docker/Compose live | Docker/Compose live | shared namespace collisions checked centrally |
| Common service users | Control Plane with component input | `graphhopper`, `goi-ors`, `goi-dflight` | NEW live values: graphhopper `970/970`, goi-dflight `971/971`, goi-ors `972/972`; all nologin | compare OLD only if a component actually requires numeric parity; do not mutate preemptively |
| Common paths `/opt` | Control Plane registry; project-local ownership below subtree | GOI/OpenClaw trees | staged copies present | projects may mutate only assigned subtree |
| `/root/local-files/handoff-runtime` | Control Plane | project handoff trees | staged copies present | project scope only; cross-project paths centralized |
| `/srv/cp-verifier-inbox` | Control Plane | live bind | validated NEW directory | no specialist mutation unless explicitly assigned |
| n8n/PostgreSQL/LiteLLM secrets | Control Plane | live OLD | replica continuity validated secret-safe | names/paths/hashes only in evidence, never values |
| Cutover | Control Plane + human operator | OLD live | NOT AUTHORIZED | no specialist project can authorize |
| Rollback retention | Control Plane + human operator | OLD retained | not entered | starts only after successful cutover |
| Decommission | Human final authorization via Control Plane | forbidden now | n/a | only when checklist is fully green |

## Current identity proof

```text
OLD_TS_NODE=ubuntu
OLD_TS_IPV4=100.114.7.53
OLD_MAGICDNS=ubuntu.tailc01234.ts.net
NEW_TS_NODE=ionos-n8n-new
NEW_TS_IPV4=100.99.54.93
NEW_TS_IPV6=fd7a:115c:a1e0::6a3a:365f
NEW_MAGICDNS=ionos-n8n-new.tailc01234.ts.net
NEW_PRIMARY_ROUTES=NONE
NEW_EXIT_NODE_OPTION=FALSE
NEW_SERVE_CONFIG=NONE
NEW_FUNNEL_CONFIG=NONE
NEW_OS_HOSTNAME=ubuntu
IDENTITY_COLLISION=NO
```

## Live NEW GOI evidence

```text
GOI_NEW_READONLY_RECONCILIATION=PASS_WITH_BLOCKERS
GOI_NEW_LISTENERS=NONE
STALE_OLD_IDENTITY_REFERENCES=YES
NEW_CONFIRMED_ABSENT_PATHS=5
OLD_PARITY_REQUIRED=YES
```

Canonical report: `reports/architecture/vps_goi_new_readonly_identity_reconciliation_2026-09-07.md`.

## Current shared-infrastructure next

`GOI_OLD_PARITY_PROBE_READ_ONLY` → classify NEW-absent paths and credential/state parity → bounded NEW-specific GOI config delta → NEW TLS issuance/renewal qualification → controlled GOI activation → private reachability/restart-persistence proof.
