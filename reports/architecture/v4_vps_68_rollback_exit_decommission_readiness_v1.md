# V4 VPS 68 rollback exit decommission readiness V1

**TASK_REF:** `V4_VPS_68_ROLLBACK_EXIT_DECOMMISSION_READINESS_V1`
**BASE_HEAD:** `70a9231d30355940de40cff721161aae0a041680` (== origin/main == HEAD at start, verified)
**Date (Europe/Rome):** 2026-09-14
**MODE:** EVIDENCE RECONCILIATION + DECOMMISSION READINESS ONLY — `HUMAN_DECOMMISSION_AUTHORIZED=NO`; OLD NOT touched

## Current NEW/OLD roles (preserved)

```text
NEW_ROLE=LIVE (ionos-n8n-new, 31.70.139.73, Tailscale 100.99.54.93)
OLD_ROLE=ROLLBACK_STANDBY_FROZEN (ionos-n8n, 217.160.71.145, Tailscale 100.114.7.53)
CUTOVER=PASS (2026-09-07)
ROLLBACK_RETENTION=OPEN
ROLLBACK_RETENTION_AUTO_EXPIRY=NONE
```

## Component counts (current, unchanged)

```text
MIGRATED_VALIDATED=32
PRESENT_NOT_VALIDATED=0
MISSING=0
OBSOLETE_NEEDS_HUMAN_DECISION=0
OBSOLETE_CONFIRMED_NOT_REQUIRED=2
F03_CENSUS_DENOMINATOR=34
REGISTRY_ROWS: 20/21 MIGRATED_VALIDATED, 1 OBSOLETE_CONFIRMED_NOT_REQUIRED, 0 missing/unvalidated
VPS_PARALLEL_VALIDATION=PASS
NEW_CORE_RESTART_PERSISTENCE=PASS
GOI_BOOT_PERSISTENCE=PASS_ENABLED_AND_COLD_START (GraphHopper/ORS/GIS/D-Flight/Nav/nginx)
POST_CUTOVER_SOAK=PASS (29+2+6 exactly reconciled, unexplained=0, independent Codex closure)
PRODUCTION_TRAFFIC_ON_NEW=PASS
```

## Already-proven facts relied upon (no rerun)

Cutover chain (write-freeze → final DB sync → sequence state → publication
map match → post-cutover health → production traffic), NEW TLS full
qualification (SAN exact, renewal helper + timer persistence), Hermes private
health, LiteLLM private health, Tailscale private topology, schema-engine
MIGRATED_VALIDATED (Ajv fixtures PASS/FAIL_CLOSED), consumer mini-audit PASS
("No enabled application systemd unit, timer, socket, container, or cron
workload on OLD was left unattributed"), F04 OLD-public-80 =
NON_REQUIRED_OBSOLETE_DEFAULT.

## Remaining rollback-retention law (this task does NOT exit it)

`ROLLBACK_RETENTION=OPEN` with no automatic expiry is a policy state owned by
the operator. This task classifies its *technical* aspects: the retention
window (2026-09-07 → today, one week of stable NEW production) has already
served its observation purpose — soak PASS, zero rollback triggers, zero
unexplained production incidents attributed to NEW. Retaining OLD longer is
neither required by any technical law nor by any documented trigger criteria;
only the human exit decision remains. OLD stays intact/frozen until that
decision; this task performs no exit action.

## OLD TLS degradation classification

```text
OLD_TLS_RENEWAL_HELPER=DEGRADED (203/EXEC, helper absent — OLD-only state)
CURRENT_OLD_ROLLBACK_TLS=VALID_UNTIL_2026-11-15T23:56:47Z
CURRENT_OLD_ROLLBACK_TLS_PRACTICABLE=YES (hostname-verified HTTPS healthy)
CLASSIFICATION=NONBLOCKING_ACCEPTED_DEGRADATION
```

Per the task's IMPORTANT clause: (1) current OLD rollback TLS still valid;
(2) NEW stable and live; (3) retention observation purpose already served;
(4) no policy requires repairing a standby server before disposal.
→ Do NOT repair OLD. The degradation would only matter if a rollback were
executed near/after 2026-11-15 without renewal — a scenario owned by the
same human gate, now recorded as an acknowledged caveat.

## Technical readiness decision (10-condition law)

| # | Condition | Verdict | Evidence |
|---|---|---|---|
| 1 | every required OLD component accounted for | SATISFIED | consumer mini-audit PASS (all units/timers/containers/cron attributed); F03 census reconciled 32+2; `OBSOLETE_NEEDS_HUMAN_DECISION=0` |
| 2 | NEW required component parity complete | SATISFIED | MIGRATED_VALIDATED=32; all GOI/schema/n8n/PG/LiteLLM/Hermes/TLS qualifications PASS |
| 3 | no MISSING / PRESENT_NOT_VALIDATED rows | SATISFIED | `MISSING=0`, `PRESENT_NOT_VALIDATED=0` |
| 4 | NEW restart persistence proven where required | SATISFIED | `NEW_CORE_RESTART_PERSISTENCE=PASS`; GOI boot persistence PASS (enabled + cold start); TLS timer persistence PASS |
| 5 | production cutover PASS | SATISFIED | `CUTOVER=PASS`, `PRODUCTION_TRAFFIC_ON_NEW=PASS` |
| 6 | post-cutover soak PASS | SATISFIED | `POST_CUTOVER_SOAK=PASS`; exact 29+2+6 reconciliation, independent Codex closure |
| 7 | no unexplained production dependency uniquely on OLD | SATISFIED | consumer mini-audit PASS; NEW is production; OLD public identity retained for rollback only; F04 obsolete-default |
| 8 | rollback source available enough for current retention law | SATISFIED | OLD intact/frozen; rollback HTTPS valid to 2026-11-15 and practicable; retention observation purpose already served (no trigger, stable NEW) |
| 9 | no unresolved technical blocker requires OLD indefinitely | SATISFIED | only degradation (OLD renewal helper) classified NONBLOCKING above; no technical dependency chain requires OLD |
| 10 | remaining blocker is human policy/authorization only | SATISFIED | `SHARED_INFRA_GATES` residual = HUMAN_ROLLBACK_EXIT, OLD_DECOMMISSION_AUTHORIZATION |

```text
VPS_68_DECOMMISSION_READINESS=PASS
ROLLBACK_EXIT_TECHNICALLY_READY=YES
OLD_DECOMMISSION_TECHNICALLY_READY=YES
OLD_DECOMMISSION_ELIGIBLE_PENDING_HUMAN_GATE=YES
OLD_DECOMMISSION_AUTHORIZED=NO
OLD_DECOMMISSION_EXECUTED=NO
REQUIRED_TECHNICAL_BLOCKERS_REMAINING=0
```

The DECOMMISSION_CHECKLIST rollback-retention rows that changed technical
state are annotated in place (`OLD retained intact`, `no rollback trigger
fired`, `rollback exit criteria satisfied — TECHNICALLY, human exit still
required`); every final-gate box remains unchecked pending the human
authorization. `OLD_DECOMMISSION_ELIGIBLE` flips from NO to
`YES_PENDING_HUMAN_GATE` form: technically eligible, authorization-gated.

## Exact human gate remaining (NOT executed)

```text
NEXT=HUMAN_OLD_DECOMMISSION_AUTHORIZATION_GATE
```

Scope of that human decision: rollback-exit acknowledgment, optional final
backup/evidence capture per checklist, OLD shutdown/deletion execution in a
separately bounded logged action. One acknowledged caveat to weigh: OLD
rollback TLS expires 2026-11-15 and the OLD renewal helper is degraded —
after that date a TLS-based rollback verification would need reissuance or
non-TLS paths. This is an input to the human gate, not a technical blocker.

## Issue #68

NOT closed. One concise factual comment added (authorized by the task when
readiness=YES): technical decommission readiness complete; only human
authorization remains. No body/title/label changes.

## Proof no runtime mutation occurred

No OLD access (no stop/start/reboot/shutdown/delete/file/TLS/nginx/
Tailscale/firewall/DNS/database/prune action — OLD frozen untouched), no NEW
service mutation (n8n/PostgreSQL/LiteLLM/Hermes/GOI/Tailscale/nginx/TLS/
schema-engine/OpenClaw untouched), no live check executed at all (every
deciding fact resolved from canonical persisted evidence — zero live
commands toward either VPS), no test campaign, no qualification rerun.
Documentation-only task: this report + CURRENT_VPS_STATE readiness block +
DECOMMISSION_CHECKLIST technical-state annotations + frontier/LCR pointers +
one issue comment. `PRODUCTION_CHANGED=NO`, `RUNTIME_CHANGED=NO`.

## Exact NEXT

```text
NEXT=HUMAN_OLD_DECOMMISSION_AUTHORIZATION_GATE
NEXT_EXECUTOR=OPERATOR (not an agent task; do not execute autonomously)
```
