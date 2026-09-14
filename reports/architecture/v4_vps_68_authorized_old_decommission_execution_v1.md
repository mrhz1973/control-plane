# V4 VPS 68 authorized OLD decommission execution V1

**TASK_REF:** `V4_VPS_68_AUTHORIZED_OLD_DECOMMISSION_EXECUTION_V1`
**BASE_HEAD:** `90731dcab7f1a9990b84d76b4b9de8e320c53dd5` (== origin/main == HEAD at start, verified)
**Date (Europe/Rome):** 2026-09-14
**MODE:** AUTHORIZED DESTRUCTIVE OLD VPS DECOMMISSION — `HUMAN_AUTHORIZATION=EXPLICITLY_GRANTED`
**Operator authorization text:** `AUTORIZZO LA DISMISSIONE DEL VECCHIO VPS`

## Authorization persistence

Recorded on #68 BEFORE any destructive action:
`https://github.com/mrhz1973/control-plane/issues/68#issuecomment-5665517718`
(readiness basis `90731dc`, target OLD only, NEW explicitly excluded,
identity fence announced). No body/title/label edits.

## Identity fence (CRITICAL gate) — PASS, double-verified

| Check | Expected OLD | Observed | Verdict |
|---|---|---|---|
| SSH alias resolution | `ionos-n8n` → 217.160.71.145, root, 22 | exactly that | PASS |
| Host identity (hostname) | `ubuntu` | `ubuntu` | PASS |
| Public egress | `217.160.71.145` | `217.160.71.145` | PASS |
| Tailscale IP | `100.114.7.53` | `100.114.7.53` | PASS |
| NEW cross-check | must NOT be 31.70.139.73 / 100.99.54.93 / ionos-n8n-new* | none matched | `TARGET_IS_NEW=NO` |
| Role check | frozen standby (n8n stopped) | `n8n inactive` | PASS |

Fence re-run immediately before the destructive command (same triple) →
`IDENTITY_RECHECK_BEFORE_DESTRUCTIVE=PASS`. At no point did any command
target NEW.

## Final backup / evidence law

```text
FINAL_BACKUP_EVIDENCE_REQUIREMENT=SATISFIED_BY_EXISTING_CANONICAL_EVIDENCE
```

Existing canonical chain (from `v4_vps_production_cutover_old_to_new_v1.md`
+ soak + reconciliation reports): OLD writer freeze, final PostgreSQL custom
dump with source/target SHA256, NEW pre-restore backup, FINAL_DB_SYNC=PASS,
FINAL_SYNC_EQUILENCE=PASS, publication map match, sequence audit PASS,
complete 32-component parity, OLD frozen since 2026-09-07 cutover,
post-cutover soak PASS. No duplicate dump created (no ceremony backup).
No missing small artifact identified. No secrets exposed.

## OLD pre-shutdown minimal check

Covered by the identity-fence probe itself: identity triple + `n8n inactive`
(frozen standby role confirmed). No further re-qualification performed.

## Authorized OLD shutdown — PASS

Clean OS shutdown on OLD only:

```text
OLD_OS_SHUTDOWN=PASS
```

- Command: `systemctl poweroff` (via `nohup … &` so the SSH channel could
  close cleanly); clean systemd semantic — no wipe, no disk removal, no
  package uninstall, no Docker prune, no file deletion, no DB deletion.
- Expected SSH loss occurred; bounded external verification after 45 s:
  SSH connect timeout, TCP 22 closed, TCP 443 closed.
- OLD was NOT restarted after shutdown; OLD is NOT rebooted because provider
  deletion is unavailable (failure law honored).

```text
OLD_ROLE=DECOMMISSIONED_OS_SHUTDOWN_COMPLETE_PROVIDER_TERMINATION_PENDING
```

## NEW minimal safety check — PASS (exactly one, read-only)

Identity + production health via SSH (read-only):

```text
NEW egress = 31.70.139.73          PASS (correct NEW identity)
NEW Tailscale = 100.99.54.93       PASS
NEW n8n runtime = docker root-n8n-1 Up 6 days   PASS
NEW PostgreSQL = docker root-postgres-1 Up 7 days (healthy)  PASS
NEW n8n healthz (127.0.0.1:5678) = HTTP 200 {"status":"ok"}  PASS
NEW_POST_OLD_SHUTDOWN_SANITY=PASS
NEW_ROLE=LIVE
PRODUCTION_CHANGED=NO_ON_NEW
```

Note: the initial probe's `systemctl is-active n8n/postgresql` returned
`inactive` because NEW's production stack runs in Docker (systemd units of
that name don't exist on NEW — they were the OLD deployment shape); the
follow-up read-only clarification probe (same SSH session family, still a
single bounded check — listener + containers + healthz) confirmed the live
Docker path. No workflow launched, no schedule wait, no soak, no NEW config
change.

## Provider termination — MANUAL_OPERATOR_ACTION_REQUIRED (per law)

Inventory performed: no `ionosctl`, no IONOS API credentials/env/files, no
authenticated deterministic IONOS control surface exists in this toolchain.
Per the task law ("Do not improvise / do not infer an API endpoint / do not
create new API credentials / do not use browser scraping"):

```text
OLD_PROVIDER_TERMINATION=MANUAL_OPERATOR_ACTION_REQUIRED
OLD_DECOMMISSION_EXECUTED=PARTIAL_OS_SHUTDOWN_COMPLETE
```

Valid bounded result; OLD stays powered off. Operator action: terminate/
delete the IONOS VPS with public IPv4 **217.160.71.145** (hostname
`ubuntu`/`ionos-n8n`) from the IONOS panel — never the NEW instance
(31.70.139.73 / `ionos-n8n-new`).

## Tailscale / shared identity cleanup

No deterministic Tailscale admin surface in this toolchain either →

```text
TAILSCALE_OLD_NODE_CLEANUP=NONBLOCKING_MANUAL_HYGIENE
```

OLD node `ubuntu` / `100.114.7.53` is now offline (node will show stale in
the tailnet); remove/expire it via the Tailscale admin console when
convenient. NEW identity `ionos-n8n-new` / `100.99.54.93` must never be
touched.

## Issue #68 — NOT closed (closure law)

Provider termination is pending → closure law requires
`OLD_PROVIDER_TERMINATION=PASS` → issue stays open:

```text
ISSUE_68=OPEN_PENDING_PROVIDER_TERMINATION
NEXT=IONOS_OLD_VPS_PROVIDER_TERMINATION_OPERATOR_ACTION
```

After the operator performs the IONOS deletion, the bounded follow-up
(closure persistence task) verifies provider state, flips
`OLD_DECOMMISSION_EXECUTED=YES`, `OLD_ROLE=DECOMMISSIONED`, closes #68
COMPLETED and reconciles docs.

## Executed-action audit trail (all commands toward VPS hosts)

1. read-only identity probe (OLD) — fence
2. read-only `ssh -G` resolution (local)
3. authorization comment (GitHub, before destructive step)
4. read-only identity recheck (OLD, pre-shutdown)
5. `nohup systemctl poweroff` (OLD — the single destructive command)
6. bounded reachability checks (local TCP, no OLD login)
7. read-only NEW sanity probe (SSH read-only commands only)
8. read-only NEW clarification probe (docker ps / ss / curl healthz)

No other VPS-affecting command was issued. No NEW mutation. No OLD restart.

## Canonical doc updates

CURRENT_VPS_STATE (execution block + role flips + `ROLLBACK_RETENTION=
CLOSED_BY_OPERATOR_AUTHORIZATION`), DECOMMISSION_CHECKLIST (4 final-gate
rows marked per evidence, provider deletion explicitly left incomplete),
CURRENT_FRONTIER, LAST_CURSOR_REPORT. Historical evidence untouched.
PROJECT_VPS_REGISTRY / SHARED_INFRASTRUCTURE_REGISTRY unchanged this pass
(their OLD columns describe the frozen-standby era; the new execution block
in CURRENT_VPS_STATE is the live supersession record — registry rows may be
reconciled in the closure-persistence follow-up after provider termination).

## Failure-law compliance recap

Identity fence never failed; NEW sanity PASS; provider deletion unavailable
→ bounded partial PASS path (no OLD reboot); no split-state (repo persistence
completes in this commit).
