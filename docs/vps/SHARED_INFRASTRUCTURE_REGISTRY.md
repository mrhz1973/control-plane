# Shared infrastructure registry

This file records authoritative ownership/state for VPS resources that specialist projects must not configure independently.

NEW Tailscale identity, GOI pre-activation staging, and NEW TLS recovery/qualification have completed. No NEW GOI/nginx activation or public cutover has occurred.

| Shared resource | Owner | OLD current state | NEW current state | Mutation rule / gate |
|---|---|---|---|---|
| Public host identity | Control Plane | `217.160.71.145` LIVE | `31.70.139.73` PREP | no public cutover before human gate |
| Tailscale node identity | Control Plane | `ubuntu`, `100.114.7.53`, `ubuntu.tailc01234.ts.net` | `ionos-n8n-new`, `100.99.54.93`, `ionos-n8n-new.tailc01234.ts.net`; OS hostname `ubuntu` | identity/static PASS; private component reachability/restart persistence pending |
| MagicDNS | Control Plane | OLD live | exact NEW MagicDNS verified | exact NEW identity qualified for TLS; never reuse OLD while OLD live |
| DNS/public routing | Control Plane | OLD remains production | NEW not cut over | explicit human cutover only |
| Tailscale ACL/routes | Control Plane with project input | OLD private GOI topology live | NEW no advertised routes, no exit-node, Serve or Funnel | no mutation unless separately required |
| nginx global service | Control Plane | active/enabled OLD | installed, disabled/inactive NEW; `nginx -t` PASS with qualified NEW cert | controlled activation only after runtime prerequisites |
| GOI nginx vhost | Control Plane with GOI input | OLD `100.114.7.53:443`, OLD MagicDNS | rendered/verified NEW `100.99.54.93:443`, `ionos-n8n-new.tailc01234.ts.net`; NEW TLS qualified; nginx still off | controlled activation after ORS/runtime qualification |
| GOI nginx readiness | Control Plane with GOI input | active on OLD | parity drop-in loaded; readiness helper verified against NEW TS IP; services off | controlled activation only |
| GOI GraphHopper bind | GOI / Control Plane activation gate | OLD app TS bind + loopback admin | generated config verified: `100.99.54.93:8989`, admin `127.0.0.1:8990`; service off | controlled runtime qualification |
| GOI GIS bind | GOI | OLD TS `:8000` | dynamic TS bind unit, disabled/inactive | controlled activation only |
| GOI Nav proxy | GOI | OLD TS `:5000` | dynamic TS bind + parity override loaded, disabled/inactive | controlled activation only |
| GOI ORS | GOI / Control Plane activation gate | OLD loopback runtime | parity artifacts + `LoadCredential` wiring verified; unit disabled/inactive | controlled loopback runtime qualification before nginx serving validation |
| GOI D-Flight | GOI / Control Plane activation gate | OLD TS `:8010` + persistent state | persistent state/permissions validated; config verified on NEW TS bind/origin; service off | controlled activation + private reachability proof |
| TLS identity | Control Plane with GOI input | OLD cert identity live | NEW cert SAN exactly `ionos-n8n-new.tailc01234.ts.net`; OLD SAN absent; cert/key match and modes PASS | qualified; no public cutover implied |
| TLS renewal | Control Plane with GOI input | OLD timer live | helper targets NEW MagicDNS; inactive-nginx path exits 0 after `nginx -t`; fail-closed semantics preserved; timer still inactive | active-nginx renewal + persistence proof later |
| Public ports `80/443` | Control Plane | OLD nginx owns | NEW has no GOI listener yet | no public-route cutover; GOI `443` remains Tailscale-bound only |
| GOI TS-bound ports | Control Plane allocates; GOI validates | OLD `443,5000,8000,8010,8989`; loopback `8020,8990` | no GOI listeners yet | controlled component activation; never expose `8020/8990` beyond loopback |
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
NEW_TAILSCALE_TLS_ISSUANCE_QUALIFICATION=PASS
NEW_TLS_SAN=ionos-n8n-new.tailc01234.ts.net
OLD_TLS_SAN_PRESENT=NO
CERT_KEY_MATCH=PASS
NGINX_SYNTAX=PASS
GOI_SERVICES=NOT_ACTIVATED
CUTOVER=NOT_AUTHORIZED
```

Canonical TLS evidence: `reports/architecture/v4_vps_new_tls_recovery_v1.md`.

## Current shared-infrastructure next

Controlled GOI runtime qualification → private reachability/restart-persistence proof → parallel OLD↔NEW validation → human cutover.
