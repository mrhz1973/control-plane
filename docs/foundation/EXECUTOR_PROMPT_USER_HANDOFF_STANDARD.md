# EXECUTOR PROMPT USER HANDOFF STANDARD

Status: CANONICAL
Version: 1.0 — 2026-09-12

## Rule

User-facing prompts are recipient-neutral by default whenever the operator has not explicitly fixed the destination.

The copyable prompt must not bind execution to a specific model, provider, harness, IDE, app, CLI or agent merely because one was used previously.

Use:

```text
=== INIZIO PROMPT ===
...
=== FINE PROMPT ===
```

Do not put recipient-routing metadata inside a neutral prompt. Model/provider/harness selection is routing metadata and stays outside the semantic task prompt.

A named component may appear only when it is intrinsically the object under test, an architectural dependency, a quota/resource domain, or a hard wall. Never infer from such a task-domain reference that the same component is also the executor.

If the same task semantics can be expressed through canonical abstractions already present in the repository, prefer those abstractions and require the executor to read the canonical source.

Persistence must follow the canonical convention for the execution surface actually used. The orchestrator must not guess an executor-specific commit prefix before dispatch.

`docs/foundation/CURSOR_PROMPT_USER_HANDOFF_STANDARD.md` applies only when Cursor is explicitly selected as destination. Any other executor-specific standard applies only after that surface is explicitly selected.

For unspecified destination, this document has precedence for user-facing prompt presentation.

AUTO-VIA and `agg` sequencing are unchanged. After persisted PASS/STOP is ingested and NEXT is mechanically determined, emit the next neutral prompt automatically unless a real Human Gate exists.

Canonical markers:

```text
EXECUTOR_NEUTRAL_PROMPT_DEFAULT=YES
RECIPIENT_SPECIFIC_WRAPPER_DEFAULT=NO
MODEL_NAME_IN_NEUTRAL_PROMPT=NO
PROVIDER_BINDING_IN_NEUTRAL_PROMPT=NO
HARNESS_BINDING_IN_NEUTRAL_PROMPT=NO
ROUTING_METADATA_OUTSIDE_SEMANTIC_PROMPT=YES
AUTO_VIA_PRESERVED=YES
AGG_SEQUENCING_PRESERVED=YES
```
