# Shared infrastructure registry

This file records authoritative ownership/state for VPS resources that specialist projects must not configure independently.

NEW Tailscale identity, TLS issuance qualification, GraphHopper functional qualification and cross-project consumer coverage are proven. Read-only F01/F02 evidence additionally proved two configuration gaps: the GOI nginx vhost is staged but not in the effective nginx include graph, and the effective GIS HTML still targets OLD GOI identities. No public cutover.

| Shared resource | Owner | OLD current state | NEW current state | Mutation rule / gate |
|---|---|---|---|---|
| Public host identity | Control Plane | `217.160.71.145` LIVE | `31.70.139.73` PREP | no public cutover before human gate |
| Tailscale node identity | Control Plane | `ubuntu`, `100.114.7.53`, `ubuntu.tailc01234.ts.net` | `ionos-n8n-new`, `100.99.54.93`, `ionos-n8n-new.tailc01234.ts.net`; OS hostname `ubuntu` | identity/static PASS; component persistence pending |
| MagicDNS | Control Plane | OLD live | exact NEW MagicDNS verified | NEW identity qualified for TLS; never reuse OLD while OLD live |
| DNS/public routing | Control Plane | OLD remains production | NEW not cut over | explicit human cutover only |
| Tailscale ACL/routes | Control Plane with project input | OLD private GOI topology live | NEW no advertised routes, no exit-node, Serve or Funnel | no mutation unless separately required |
| nginx global service | Control Plane | active/enabled OLD | installed, disabled/inactive NEW | remain inactive during F01 remediation; later controlled activation only |
| GOI nginx vhost | Control Plane with GOI input | OLD `100.114.7.53:443`, OLD MagicDNS | intended NEW file exists in `sites-available`, but effective include graph has empty `sites-enabled`/`conf.d`; current `nginx -t` does not test GOI vhost | **F01 include remediation required before nginx activation** |
| GOI nginx readiness | Control Plane with GOI input | active on OLD | readiness drop-in/helper targets NEW TS IP | preserve; no nginx start in F01 remediation |
| GOI GraphHopper bind | GOI / Control Plane activation gate | OLD app TS bind + loopback admin | runtime active not enabled: `100.99.54.93:8989`, admin `127.0.0.1:8990`; functional smoke PASS | restart-persistence pending |
| GOI GIS bind / downstream endpoints | GOI | OLD TS `:8000`; clients target OLD GraphHopper/ORS/D-Flight | dynamic NEW TS bind unit is disabled/inactive, but effective served HTML still contains OLD GraphHopper `100.114.7.53:8989`, OLD ORS MagicDNS and adjacent OLD D-Flight override | **F02 endpoint remediation required before GIS activation** |
| GOI Nav proxy | GOI | OLD TS `:5000` from Planet-Clone | dynamic NEW TS bind + parity override loaded, disabled/inactive | controlled activation after prerequisite remediation |
| GOI ORS | GOI / Control Plane activation gate | OLD loopback runtime | parity artifacts + `LoadCredential` wiring verified; unit disabled/inactive | controlled loopback qualification; nginx serving later |
| GOI D-Flight | GOI / Control Plane activation gate | OLD TS `:8010` + persistent state | service config/state points NEW; unit inactive; GIS client still has OLD D-Flight override | client retarget before GIS activation; service qualification separately |
| TLS identity | Control Plane with GOI input | OLD cert files `/etc/goi-ors/tls`; OLD MagicDNS live | NEW cert SAN exactly `ionos-n8n-new.tailc01234.ts.net`; OLD SAN absent | qualified; no public cutover implied |
| TLS renewal | Control Plane with GOI input | OLD timer live; oneshot observed failed | NEW helper inactive-nginx behavior PASS; timer inactive | active-nginx renewal + persistence later; OLD health checked before cutover |
| Public ports `80/443` | Control Plane | OLD nginx owns public `:80` default and TS `:443` | NEW no nginx listener; GraphHopper private only | no public-route cutover; OLD `:80` requiredness unresolved for final sign-off |
| GOI TS-bound ports | Control Plane allocates; GOI validates | OLD `443,5000,8000,8010,8989`; loopback `8020,8990` | NEW GraphHopper `8989` + admin `8990`; others still closed | never expose `8020/8990` beyond loopback |
| n8n loopback `5678` | Control Plane | OLD production | NEW isolated replica | publication/cutover separately authorized |
| n8n filesystem binds | Control Plane | `/root/local-files`, `/srv/cp-verifier-inbox`, control-plane checkout bind | same bind names present on NEW | do not drop binds; no secret values in git |
| schema-engine local dependency | Control Plane | `/root/local-files/handoff-runtime/schema-engine` | copied, resolver smoke pending | no network dependency |
| dev-method reference tree | dev-method / Control Plane | `/root/local-files/handoff-runtime/dev-method` | copied/validated | no shared network dependency |
| OpenClaw preserved fallback | Control Plane | preserved fallback | copied/staged inactive | future activation separately gated |
| Hermes private ports | Control Plane/Hermes | loopback | loopback qualified | remain private |
| Docker common runtime | Control Plane | live | live | shared namespace centralized |
| Cutover | Control Plane + human operator | OLD live | NOT AUTHORIZED | explicit human gate |
| Rollback retention | Control Plane + human operator | OLD retained | not entered | after successful cutover only |
| Decommission | Human final authorization via Control Plane | forbidden now | n/a | only after checklist fully green |

## Current proof

```text
NEW_TAILSCALE_TLS_ISSUANCE_QUALIFICATION=PASS
GOI_GRAPHHOPPER_FUNCTIONAL_QUALIFICATION=PASS
GOI_GRAPHHOPPER_BOOT_PERSISTENCE=PENDING
VPS_CONSUMER_REGISTRY_COVERAGE=PASS
F01_NGINX_VHOST=STAGED_NOT_INCLUDED
F02_GIS_ENDPOINTS=ACTIVE_OLD_ENDPOINT_FOUND
CUTOVER=NOT_AUTHORIZED
```

Canonical evidence:
- `reports/architecture/v4_vps_goi_f01_f02_readonly_evidence_v1.md`
- `reports/architecture/v4_vps_codex_independent_evidence_audit_v1.md`
- `reports/architecture/v4_vps_goi_graphhopper_activation_v1.md`
- `reports/architecture/v4_vps_new_tls_recovery_v1.md`

## Current shared-infrastructure next

F01 nginx include remediation → F02 effective GIS OLD endpoint remediation → remaining GOI private qualification → restart-persistence/parallel OLD↔NEW validation → human cutover.
