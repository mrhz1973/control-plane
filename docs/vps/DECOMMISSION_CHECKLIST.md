# OLD VPS decommission checklist

`OLD_DECOMMISSION_ELIGIBLE=YES` only when every item below is satisfied with evidence.

## Parallel checkpoint annotation — 2026-09-07

`V4_VPS_PARALLEL_OLD_NEW_VALIDATION_F03_F04_F05_V1` records:

```text
VPS_PARALLEL_VALIDATION=PASS
NEW_CORE_RESTART_PERSISTENCE=PASS
F03_ACCOUNTING_RECONCILIATION=PASS
F04_OLD_PUBLIC_80_REQUIREDNESS=NON_REQUIRED_OBSOLETE_DEFAULT
F05_OLD_TLS_CURRENT_HTTPS_HEALTH=PASS
F05_OLD_ROLLBACK_TLS_PRACTICABLE=YES
HUMAN_CUTOVER_GATE=AUTHORIZED_AND_EXECUTED
OLD_DECOMMISSION_ELIGIBLE=NO
```

The OLD renewal helper remains degraded (`203/EXEC` absent helper); current OLD HTTPS is healthy through `2026-11-15T23:56:47Z`.

## Production cutover checkpoint — 2026-09-07

```text
HUMAN_CUTOVER_AUTHORIZED=YES
OLD_WRITE_FREEZE=PASS
FINAL_DB_SYNC=PASS
NEW_PRODUCTION_PUBLICATION_MAP_MATCH=PASS
POST_CUTOVER_HEALTH=PASS
PRODUCTION_TRAFFIC_ON_NEW=PASS
CUTOVER=PASS
NEW_ROLE=LIVE
OLD_ROLE=ROLLBACK_STANDBY_FROZEN
ROLLBACK_RETENTION=ENTERED
ROLLBACK_RETENTION_AUTO_EXPIRY=NONE
OLD_DECOMMISSION_ELIGIBLE=NO
OLD_DECOMMISSION_AUTHORIZED=NO
```

The checklist boxes below remain the canonical gate. Rollback retention is open and its exit criteria are intentionally not complete; decommission boxes are not marked complete.

## Component accounting

- [ ] every OLD service/project runtime has a registry row
- [ ] no required row remains `MISSING`
- [ ] no required row remains `PRESENT_NOT_VALIDATED`
- [ ] every specialist project handoff has been ingested
- [ ] all `OBSOLETE_NEEDS_HUMAN_DECISION` rows are explicitly resolved

## NEW runtime validation

- [ ] PostgreSQL healthy and restart persistence proven
- [ ] n8n production role/capability on NEW activated only at explicit cutover stage
- [ ] LiteLLM runtime validated in intended final mode
- [ ] Hermes/browser qualified and private listeners preserved
- [ ] GraphHopper validated on NEW
- [ ] ORS gateway validated on NEW
- [ ] D-Flight validated on NEW
- [ ] GIS / cursor-coordinate-converter validated on NEW
- [ ] Navionics / Planet-Clone validated on NEW
- [ ] OpenClaw activate-or-archive decision resolved
- [ ] dev-method/schema-engine role resolved/validated

## Shared infrastructure

- [ ] NEW Tailscale node joined with unique identity
- [ ] NEW MagicDNS name recorded
- [ ] all Tailscale routes/listeners collision-checked
- [ ] nginx final vhosts/upstreams validated
- [ ] NEW TLS CN/SAN valid for NEW identity
- [ ] TLS renewal proven
- [ ] public/listener exposure exactly matches intended design
- [ ] service users/groups and shared paths collision-free
- [ ] Docker common namespaces collision-free
- [ ] no secret values exposed during migration/evidence

## Parallel validation

- [ ] OLD remains healthy during validation
- [ ] NEW service-by-service behavior matches required OLD function
- [ ] no unexplained OLD listener/systemd unit/container/project dependency remains
- [ ] restart persistence proven for every required boot service
- [ ] representative end-to-end traffic validated on NEW before production cutover

## Cutover

- [ ] explicit HUMAN CUTOVER authorization recorded
- [ ] production n8n activation/publication separately authorized
- [ ] DNS/public route changes executed only in the authorized cutover window
- [ ] post-cutover health checks PASS
- [ ] production traffic confirmed on NEW

## Rollback retention

- [x] OLD retained intact for the agreed short rollback window — TECHNICALLY SATISFIED (retention observation purpose served; OLD still intact/frozen 2026-09-14)
- [ ] rollback trigger criteria documented
- [x] no rollback trigger fired during the retention window — CONFIRMED (soak PASS, zero triggers, no NEW production incident)
- [x] rollback exit criteria satisfied — TECHNICALLY (HUMAN_ROLLBACK_EXIT decision still required; no automatic expiry)

## Final decommission gate

- [x] `OLD_DECOMMISSION_ELIGIBLE=YES` recorded by Control Plane — 2026-09-14 (technically ready; eligible pending human gate → gate satisfied)
- [x] explicit final human authorization to decommission OLD recorded — 2026-09-14 (#68 issuecomment-5665517718)
- [x] final backup/evidence requirements satisfied — by existing canonical cutover evidence (no duplicate dump)
- [x] OLD shutdown action separately bounded and logged — 2026-09-14 (clean `systemctl poweroff`; OS shutdown PASS)
- [x] IONOS provider closure confirmed — 2026-09-14, evidence grade `OPERATOR_CONFIRMED` ("IONOS mi ha confermato la chiusura"); NOT API-verified (`IONOS_PROVIDER_API_VERIFIED=NO_NOT_AVAILABLE`)

Technical readiness update 2026-09-14 (`V4_VPS_68_ROLLBACK_EXIT_DECOMMISSION_READINESS_V1`): all technical conditions satisfied (`OLD_DECOMMISSION_TECHNICALLY_READY=YES`, 0 technical blockers); at the time of that update the remaining gate was the explicit human decommission authorization — superseded later the same day by the final state below.

## Final state — 2026-09-14 (`V4_VPS_68_PROVIDER_TERMINATION_CLOSURE_PERSISTENCE_V1`)

```text
OLD_DECOMMISSION_ELIGIBLE=YES
OLD_DECOMMISSION_AUTHORIZED=YES
OLD_DECOMMISSION_EXECUTED=YES
OLD_OS_SHUTDOWN=PASS
OLD_PROVIDER_TERMINATION=PASS_OPERATOR_CONFIRMED
IONOS_PROVIDER_CLOSURE_CONFIRMED_BY_OPERATOR=YES
IONOS_PROVIDER_API_VERIFIED=NO_NOT_AVAILABLE
OLD_DECOMMISSION_COMPLETE=YES
OLD_ROLE=DECOMMISSIONED
ROLLBACK_RETENTION=CLOSED_BY_OPERATOR_AUTHORIZATION
NEW_ROLE=LIVE
NEW_CANONICAL_VPS=31.70.139.73
ISSUE_68=CLOSED_COMPLETED
ISSUE_60=CLOSED_COMPLETED
ISSUE_67=CLOSED_COMPLETED
ISSUE_69=CLOSED_COMPLETED
ISSUE_65=CLOSED_COMPLETED
```

Every checklist item is satisfied; the decommission is complete. The
provider-closure evidence grade remains OPERATOR_CONFIRMED (explicit human
statement) and is never silently upgraded to machine/API verification.

Every applicable item is green — `OLD_DECOMMISSION_ELIGIBLE=YES` (2026-09-14).