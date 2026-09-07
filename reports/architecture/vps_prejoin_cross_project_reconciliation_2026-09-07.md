# VPS pre-join cross-project reconciliation — 2026-09-07

Parent: #68.

Inputs:
- `reports/architecture/vps_goi_project_handoff_2026-09-07.md`
- `reports/architecture/vps_dev_method_handoff_2026-09-07.md`
- `reports/architecture/vps_schema_engine_handoff_2026-09-07.md`
- `reports/architecture/vps_openclaw_handoff_2026-09-07.md`

## Result

`CROSS_PROJECT_PREJOIN_RECONCILIATION=CLEARED`

No unresolved specialist-project dependency prevents assigning a unique NEW Tailscale identity.

- GOI: all known network/TLS/bind dependencies captured; activation intentionally waits for NEW Tailscale IPv4/MagicDNS.
- dev-method: no runtime/network dependency; migrated/validated as reference tree.
- schema-engine: local n8n/control-plane dependency only; live NEW resolver smoke remains pending but is independent of Tailscale.
- OpenClaw: current staged footprint has no listener/unit; Foundation preserves it as fallback/existing broker; recommendation `KEEP_STAGED_PENDING`; future activation is separate.

## Unique identity selection

Selected NEW Tailscale hostname: `ionos-n8n-new`.

Rationale:
- matches canonical NEW host alias;
- distinct from OLD active MagicDNS identity `ubuntu.tailc01234.ts.net`;
- can be passed explicitly to Tailscale join without changing the OS hostname in this step.

## Still forbidden

This clearance does not authorize:
- GOI service activation;
- nginx enablement;
- TLS issuance/renewal before NEW MagicDNS exists;
- DNS/public routing;
- n8n production publication;
- cutover;
- OLD decommission.

## Next

`TAILSCALE_JOIN_NEW(hostname=ionos-n8n-new)`.

Expected real gate: interactive/manual Tailscale authentication if the NEW node has no pre-authorized auth mechanism.