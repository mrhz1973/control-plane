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
HUMAN_CUTOVER_GATE=READY_NOT_AUTHORIZED
OLD_DECOMMISSION_ELIGIBLE=NO
```

The OLD renewal helper remains degraded (`203/EXEC` absent helper); current OLD HTTPS is healthy through `2026-11-15T23:56:47Z`. The checklist boxes below remain the canonical gate and are not marked complete by this checkpoint. Cutover, rollback retention, and decommission authorization remain pending.

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

- [ ] OLD retained intact for the agreed short rollback window
- [ ] rollback trigger criteria documented
- [ ] no rollback trigger fired during the retention window
- [ ] rollback exit criteria satisfied

## Final decommission gate

- [ ] `OLD_DECOMMISSION_ELIGIBLE=YES` recorded by Control Plane
- [ ] explicit final human authorization to decommission OLD recorded
- [ ] final backup/evidence requirements satisfied
- [ ] OLD deletion/shutdown action separately bounded and logged

Until every applicable item is green:

`OLD_DECOMMISSION_ELIGIBLE=NO`