# Session — classifier wrapper C1b live smoke PASS

**Date:** 2026-05-30  
**Repository:** `mrhz1973/control-plane`  
**Gate:** D-0001-C C1b only  
**Scope:** Live qwen3:14b smoke via existing wrapper; no n8n, no Telegram, no PM-34 unlock

## Offline baseline

```text
node .\tests\classifier-wrapper\run-offline-tests.mjs
offline tests passed (4/4)
```

## Live smoke

**Command:**

```text
node .\tools\classifier-wrapper-v1.mjs --input-file .tmp-classifier-c1b-live-input.json --pretty
```

**Input:** sanitized docs-only event (`event_type: docs_commit`, path `docs/runtime/CURRENT_FRONTIER.md`, all flags untouched). Summary worded to avoid pre-model guard false positives on keywords like "secrets" or "deploy" in negative-context prose.

**Output (schema-valid, no fallback, no chain-of-thought):**

```json
{
  "risk": "low",
  "route": "auto_allowed",
  "reason": "The event involves a Markdown documentation update in the 'docs/runtime' directory, which does not appear to affect critical systems or sensitive data.",
  "confidence": "high",
  "requires_human": false
}
```

**Exit code:** 0  
**Model:** qwen3:14b @ http://127.0.0.1:11434  
**Transport:** `/api/generate` with `stream:false`, `think:false`, `format:json`

## Explicitly not done

- n8n wiring: NOT RUN
- Telegram Decision Packet: NOT RUN
- PM-34 unlock: NO
- workflow 40/41 mutation: NO
- Temporary input file: deleted before commit
