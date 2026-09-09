# Operator constraint — Cursor Agent / 5.6 Luna High / existing Work-Codex quota route

**Status:** ACTIVE OPERATOR CONSTRAINT  
**Scope:** interactive implementation tasks dispatched by the operator through Cursor IDE  
**Authority:** explicit operator decision recorded 2026-09-09  
**Runtime mutation authorized by this document:** NO

## Decision

When the operator asks to use Cursor for an implementation task, the default interactive surface is:

```text
Cursor IDE
  -> Cursor Agent composer (the `Do anything` box)
  -> model selection: `5.6 Luna High`
```

Do **not** redirect the operator to the separate OpenAI Codex IDE extension/chat merely because Codex is installed in Cursor.

The operator has explicitly stated that this local Cursor setup is already configured to use the existing **Work/Codex subscription quota route** rather than a separately supplied BYOK/API-key route. Preserve that existing configuration; do not replace it with GLM BYOK, OpenAI API/BYOK, or another provider path unless the operator explicitly changes the instruction.

## Prompt handoff rule

For Cursor-Agent prompts under this constraint, use the canonical Cursor header:

```text
MODELLO CURSOR: 5.6 Luna High
BUGBOT: <NO|SÌ>
MODALITÀ CURSOR: <AGENT|PLAN>
```

For implementation work, default to:

```text
MODELLO CURSOR: 5.6 Luna High
BUGBOT: NO
MODALITÀ CURSOR: AGENT
```

unless the task itself requires a different reviewed/gated choice.

## Surface distinction

Keep these surfaces distinct:

- **Cursor Agent** = the Cursor `Do anything` composer with `5.6 Luna High` selected.
- **Codex IDE extension** = separate OpenAI Codex panel/chat inside Cursor.

The presence of the Codex extension does not imply that tasks should be moved there.

## Accounting / evidence boundary

This file records the operator's configuration and routing preference. It does **not** by itself change or prove the global resource-registry accounting contract for Cursor. Where deterministic quota accounting is required, use the current runtime/registry evidence and fail closed on unknown mappings.

Therefore:

- preserve the operator-declared non-BYOK Work/Codex quota configuration;
- do not invent API consumption;
- do not claim a different quota pool from UI assumptions alone;
- do not reconfigure the route just to satisfy documentation.

## Override

Only an explicit later operator instruction may override this default for a specific task or permanently.
