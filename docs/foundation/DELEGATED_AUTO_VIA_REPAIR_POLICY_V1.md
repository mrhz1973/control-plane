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

## Extension V2 — LOCAL_DEV convergence repair classes (operator-authorized
## in dispatch V4_LOCAL_DEV_EXECUTOR_OPENCODE_PERMISSION_AND_NEW_FILE_CONVERGENCE_REMEDIATION_V1,
## 2026-09-05)

Unattended LOCAL_DEV campaigns MAY additionally auto-diagnose and auto-repair
these defect classes WITHOUT an operator gate, when ALL conditions of the
narrow rule above still hold:

- LOCAL_DEV task-shaping defects (missing deterministic create-vs-modify
  instructions, convergence-hostile objective wording);
- OpenCode LOCAL_DEV permission mismatches (missing exact file-tool permission
  entry proven necessary by installed-OpenCode evidence; always deny-all-first,
  allowed_paths-derived only);
- agent convergence failures caused by a missing deterministic instruction;
- exact DEV file-tool permission omissions (never generic command widening;
  filesystem-discovery commands such as Test-Path/dir/ls/find/Get-ChildItem
  must NOT be auto-added);
- CLI wrapper/shape mismatches between bridge artifacts and runner inputs;
- test-side defects (assertions or fixtures not matching authorized behavior).

STILL HARD-GATED (Cursor MUST STOP):
- production architecture; n8n live topology authoring/change
  (`GPT_WEB_N8N_AUTHORING_REQUIRED`); Telegram policy semantics;
  credentials/secrets; billing/provider/model policy; destructive or
  irreversible action; security boundary weakening; materially non-equivalent
  product/strategy choices; scope expansion outside LOCAL_DEV; unresolved
  remote/source conflict.

CONVERGENCE RETRY BOOKKEEPING (campaign rule): the same root-cause family
gets at most 2 automatic repair cycles before the campaign must STOP; a
genuinely new mechanical root-cause family may receive its own bounded repair
pass. Every automatic repair MUST record:

```text
AUTO_REPAIR_SELECTED=<repair>
RATIONALE=<evidence>
INVARIANTS_PRESERVED=<list>
```
