# Shared infrastructure registry

This file records the authoritative owner and current state for VPS resources that must not be configured independently by specialist projects.

Project pre-join handoffs were reconciled before Tailscale join. NEW Tailscale authentication/join and post-join identity/static-state verification succeeded on 2026-09-07. Live NEW and OLD GOI read-only probes have now classified the remaining parity/config blockers without activating NEW services or mutating OLD.

| Shared resource | Owner | OLD current state | NEW current state | Mutation rule / gate |
|---|---|---|---|---|
| Public host identity | Control Plane | `217.160.71.145` LIVE | `31.70.139.73` PREP | no public cutover before human gate |
| Tailscale node identity | Control Plane | `ubuntu`, `100.114.7.53`, `ubuntu.tailc01234.ts.net` | `ionos-n8n-new`, `100.99.54.93`, `ionos-n8n-new.tailc01234.ts.net`; OS hostname still `ubuntu` | identity/static PASS; private component reachability/restart persistence pending |
| MagicDNS | Control Plane | OLD live | exact NEW name verified | use NEW identity for GOI/TLS render; never reuse OLD while OLD live |
| DNS/public routing | Control Plane | OLD remains production | NEW not cut over | explicit human cutover only |
| Tailscale ACL/routes | Control Plane with project input | OLD GOI listeners on TS-bound ports | NEW `PrimaryRoutes=NONE`, no exit-node, Serve or Funnel | no route/Serve/Funnel mutation unless separately required |
| nginx global service | Control Plane | active/enabled OLD | installed, disabled/inactive NEW | remain inactive until parity/config/TLS checks pass |
| GOI nginx vhost | Control Plane with GOI input | live `100.114.7.53:443`, `server_name ubuntu.tailc01234.ts.net`, upstream `127.0.0.1:8020` | staged stale OLD identity | `RECONSTRUCT_NEW_SPECIFIC` to `100.99.54.93` + NEW MagicDNS; never copy OLD rendered identity verbatim |
| GOI nginx readiness drop-in | Control Plane with GOI input | present and loaded; requires/after `goi-tailscale-ready.service` | absent | `COPY_REQUIRED`, but nginx stays disabled until readiness helper is NEW-specific |
| GOI Tailscale readiness | Control Plane with GOI input | helper expects `100.114.7.53`, service active | helper copied but stale; service disabled/inactive | `RECONSTRUCT_NEW_SPECIFIC` helper target to `100.99.54.93`; validate without enabling nginx first |
| GOI GraphHopper bind | GOI component / Control Plane activation gate | generated runtime app bind `100.114.7.53:8989`, admin `127.0.0.1:8990` | tree copied; no active GOI listener | render NEW generated runtime with TS app bind `100.99.54.93:8989`, preserve loopback admin `127.0.0.1:8990` |
| GOI GIS bind | GOI component | OLD `100.114.7.53:8000` | base unit dynamically derives `tailscale ip -4`; disabled | dynamic bind already identity-compatible; endpoint refs still reconcile before activation |
| GOI Nav proxy | GOI component | OLD `100.114.7.53:5000`; active override drop-in exists | base unit dynamic TS bind; override absent | inspect OLD non-secret override before copy/reconstruct; no activation yet |
| GOI ORS credential | GOI component / Control Plane activation gate | secret present mode 600 + active `LoadCredential` drop-in | both absent | secret-safe direct host-to-host copy required; never expose value; verify hash/metadata after copy |
| GOI D-Flight credentials | GOI component / Control Plane activation gate | username/password files present mode 600 | prep-copy reported copied; live NEW hash parity not yet verified | metadata/hash verification first; do not recopy unless mismatch/absence |
| GOI D-Flight state | GOI component / Control Plane activation gate | `/var/lib/goi-dflight` current/previous LKG + metadata/state present | directory absent | `COPY_REQUIRED_STATE_SAFE` with service ownership/modes preserved before qualification |
| GOI D-Flight CSRF PEM | GOI component / Control Plane activation gate | mode 640 owner `root:goi-dflight`, size 451 | mode 640 owner `root:root`, size 451 | compare hash; if equal fix NEW group ownership to `goi-dflight`; if not equal investigate before mutation |
| GOI D-Flight config | GOI component / Control Plane activation gate | bind/origin use OLD TS IP | staged copy still uses OLD TS IP | `RECONSTRUCT_NEW_SPECIFIC` host `100.99.54.93`, origin `http://100.99.54.93:8000` after final parity check |
| TLS identity | Control Plane with GOI input | OLD cert identity live | OLD material archived on NEW; no valid NEW serving cert | NEW cert must target `ionos-n8n-new.tailc01234.ts.net`; issuance after bounded config delta |
| TLS renewal | Control Plane with GOI input | helper/timer live on OLD | helper present; service static/inactive, timer disabled | inspect helper naming semantics before issuance; OS hostname `ubuntu` must not derive wrong identity |
| Public ports `80/443` | Control Plane | OLD nginx owns | NEW no GOI listener | no public activation before human cutover; GOI 443 tailnet-bound only |
| GOI TS-bound ports | Control Plane allocates; specialist validates | OLD `443,5000,8000,8010,8989`; loopback `8020,8990` | no GOI listeners | activate only after parity/config/TLS checks; never expose 8020/8990 beyond loopback |
| n8n loopback `5678` | Control Plane | OLD production | NEW isolated replica | production publication/cutover separately authorized |
| schema-engine local dependency | Control Plane | local Ajv dependency | copied, resolver smoke pending | no network dependency |
| dev-method reference tree | dev-method / Control Plane | tree-only | copied/validated | no shared network dependency |
| OpenClaw preserved fallback | Control Plane | staged/fallback footprint | copied/staged inactive | future activation separately gated |
| Hermes CDP/VNC/noVNC `9222/5900/6080` | Control Plane/Hermes | loopback | loopback qualified | must remain private/loopback |
| Docker common runtime | Control Plane | live | live | shared namespace centralized |
| Common service users | Control Plane with component input | GOI service accounts live | NEW nologin accounts captured | no numeric-parity mutation unless evidence requires it |
| Cutover | Control Plane + human operator | OLD live | NOT AUTHORIZED | explicit human gate |
| Rollback retention | Control Plane + human operator | OLD retained | not entered | after successful cutover only |
| Decommission | Human final authorization via Control Plane | forbidden now | n/a | only after checklist fully green |

## Current identity proof

```text
OLD_TS_IPV4=100.114.7.53
OLD_MAGICDNS=ubuntu.tailc01234.ts.net
NEW_TS_IPV4=100.99.54.93
NEW_MAGICDNS=ionos-n8n-new.tailc01234.ts.net
NEW_PRIMARY_ROUTES=NONE
NEW_EXIT_NODE_OPTION=FALSE
NEW_SERVE_CONFIG=NONE
NEW_FUNNEL_CONFIG=NONE
IDENTITY_COLLISION=NO
```

## GOI parity proof

Canonical reports:
- `reports/architecture/vps_goi_new_readonly_identity_reconciliation_2026-09-07.md`
- `reports/architecture/vps_goi_old_parity_probe_2026-09-07.md`

```text
GOI_NEW_READONLY_RECONCILIATION=PASS_WITH_BLOCKERS
GOI_OLD_PARITY_PROBE=PASS
OLD_CHANGED=NO
NEW_GOI_ACTIVATION_SAFE=NO
```

Every prior NEW-absent project path is proven present on OLD live. The next operation is not activation: it is one final bounded read-only parity pass for the Nav override, NEW D-Flight credential/PEM hashes, and helper/render semantics; then a NEW-only copy/render pass while all GOI/nginx units remain disabled/inactive.

## Current shared-infrastructure next

`GOI_FINAL_READONLY_PARITY` → bounded NEW-only copy/render → syntax/ownership validation → NEW MagicDNS TLS issuance/renewal qualification → controlled GOI activation → private reachability/restart-persistence proof.
