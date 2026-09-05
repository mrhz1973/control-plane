# Delegated AUTO-VIA repair policy (unattended DEV campaigns)

Status: RATIFIED by operator dispatch `V4_LOCAL_DEV_EXECUTOR_BRIDGED_PROOF_TRACKED_FILE_SEMANTICS_V1` (2026-09-05).
Scope: unattended bounded DEV campaigns on this workstation (LOCAL_DEV lane).
This policy does NOT grant Cursor general architectural authority.

## Narrow rule

Cursor MAY automatically choose and apply a repair option WITHOUT operator
interruption when EXACTLY ONE option:

1. preserves all existing safety invariants;
2. is strictly inside current task scope;
3. introduces no production/runtime authorization;
4. introduces no provider/cost decision;
5. introduces no credentials;
6. requires no destructive operation;
7. has deterministic tests;
8. is reversible;
9. removes a demonstrated integration defect rather than changing project
   strategy.

## Mandatory record for every auto-repair

```text
AUTO_REPAIR_SELECTED=<option>
RATIONALE=<bounded evidence>
INVARIANTS_PRESERVED=<list>
```

## Cursor MUST STILL STOP for

- multiple materially reasonable trade-offs;
- user/product behavior choice;
- production architecture;
- n8n topology authoring/change (`GPT_WEB_N8N_AUTHORING_REQUIRED`);
- external services;
- provider/model policy;
- security policy;
- destructive changes;
- irreversible changes;
- unclear safety dominance.

## Usage note (this dispatch)

This policy was persisted BEFORE the bridged live proof retry below. It
authorizes only mechanical same-scope repairs (e.g. fixing a proven
envelope/fixture mismatch discovered inside an authorized proof task). It
does not authorize re-running a stopped live proof more times than the task
explicitly allows.
