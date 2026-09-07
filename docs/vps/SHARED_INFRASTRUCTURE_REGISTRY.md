# Shared infrastructure registry

This file records authoritative ownership/state for VPS resources that specialist projects must not configure independently.

NEW Tailscale join/identity verification, GOI OLD↔NEW parity reconciliation, and NEW-only GOI parity/config render have completed. No NEW GOI/nginx activation or public cutover has occurred.

| Shared resource | Owner | OLD current state | NEW current state | Mutation rule / gate |
|---|---|---|---|---|
| Public host identity | Control Plane | `217.160.71.145` LIVE | `31.70.139.73` PREP | no public cutover before human gate |
| Tailscale node identity | Control Plane | `ubuntu`, `100.114.7.53`, `ubuntu.tailc01234.ts.net` | `ionos-n8n-new`, `100.99.54.93`, `ionos-n8n-new.tailc01234.ts.net`; OS hostname `ubuntu` | identity/static PASS; private component reachability/restart persistence pending |
| MagicDNS | Control Plane | OLD live | exact NEW MagicDNS verified | use exact NEW identity for TLS/GOI; never reuse OLD while OLD live |
| DNS/public routing | Control Plane | OLD remains production | NEW not cut over | explicit human cutover only |
| Tailscale ACL/routes | Control Plane with project input | OLD private GOI topology live | NEW no advertised routes, no exit-node, Serve or Funnel | no mutation unless separately required |
| nginx global service | Control Plane | active/enabled OLD | installed, disabled/inactive NEW | remain inactive until syntax/TLS/pre-activation checks pass |
| GOI nginx vhost | Control Plane with GOI input | OLD `100.114.7.53:443`, OLD MagicDNS | rendered NEW `100.99.54.93:443`, `ionos-n8n-new.tailc01234.ts.net`; nginx still off | validate syntax and NEW TLS before activation |
| GOI nginx readiness | Control Plane with GOI input | active on OLD | parity drop-in staged; readiness helper rendered to NEW TS IP; services off | verify dependency semantics before nginx activation |
| GOI GraphHopper bind | GOI / Control Plane activation gate | OLD app TS bind + loopback admin | generated NEW config rendered: `100.99.54.93:8989`, admin `127.0.0.1:8990`; service off | validate preflight/runtime before enablement |
| GOI GIS bind | GOI | OLD TS `:8000` | dynamic TS bind unit, disabled/inactive | controlled activation only |
| GOI Nav proxy | GOI | OLD TS `:5000` | dynamic TS bind + parity override staged, disabled/inactive | controlled activation only |
| GOI ORS | GOI / Control Plane activation gate | OLD loopback runtime | required parity artifacts staged; unit disabled/inactive | validate wiring/runtime before nginx |
| GOI D-Flight | GOI / Control Plane activation gate | OLD TS `:8010` + persistent state | state staged; config rendered to NEW TS bind/origin; service off | controlled activation + private reachability proof |
| TLS identity | Control Plane with GOI input | OLD cert identity live | NEW helper targets exact NEW MagicDNS; valid NEW serving cert not yet issued | issue/qualify Tailscale cert before nginx activation |
| TLS renewal | Control Plane with GOI input | OLD timer live | helper rendered to explicit NEW MagicDNS; service/timer not enabled | qualify renewal after initial NEW cert issuance; do not infer from OS hostname |
| Public ports `80/443` | Control Plane | OLD nginx owns | NEW has no GOI listener | no public-route cutover; GOI `443` must remain Tailscale-bound |
| GOI TS-bound ports | Control Plane allocates; GOI validates | OLD `443,5000,8000,8010,8989`; loopback `8020,8990` | no GOI listeners yet | activate only after pre-activation/TLS checks; never expose `8020/8990` beyond loopback |
| n8n loopback `5678` | Control Plane | OLD production | NEW isolated replica | publication/cutover separately authorized |
| schema-engine local dependency | Control Plane | local Ajv dependency | copied, resolver smoke pending | no network dependency |
| dev-method reference tree | dev-method / Control Plane | tree-only | copied/validated | no shared network dependency |
| OpenClaw preserved fallback | Control Plane | preserved fallback | copied/staged inactive | future activation separately gated |
| Hermes private ports | Control Plane/Hermes | loopback | loopback qualified | remain private |
| Docker common runtime | Control Plane | live | live | shared namespace centralized |
| Cutover | Control Plane + human operator | OLD live | NOT AUTHORIZED | explicit human gate |
| Rollback retention | Control Plane + human operator | OLD retained | not entered | after successful cutover only |
| Decommission | Human final authorization via Control Plane | forbidden now | n/a | only after checklist fully green |

## Current proof

```text
OLD_TS_IPV4=100.114.7.53
OLD_MAGICDNS=ubuntu.tailc01234.ts.net
NEW_TS_IPV4=100.99.54.93
NEW_MAGICDNS=ionos-n8n-new.tailc01234.ts.net
IDENTITY_COLLISION=NO
GOI_NEW_PARITY_COPY_CONFIG_RENDER=PASS
GOI_ACTIVE_OLD_IDENTITY_REFS=NONE
GOI_SERVICES=NOT_ACTIVATED
NEW_TLS_IDENTITY=NOT_YET_ISSUED
CUTOVER=NOT_AUTHORIZED
```

## Current shared-infrastructure next

`GOI_POST_RENDER_PREACTIVATION_VERIFY` → NEW Tailscale TLS issuance/renewal qualification → controlled GOI activation → private reachability/restart-persistence proof → parallel OLD↔NEW validation → human cutover.
