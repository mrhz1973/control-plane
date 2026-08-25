# OPERATING MEMORY — SUPERSEDED HISTORICAL POINTER

**Status:** `SUPERSEDED_BY_WIKI_LLM_LEAN`  
**Superseded:** 2026-08-25  
**Runtime authority:** **NONE**.

This file previously mixed:

- redaction/credential rules;
- ready-import rebuild details;
- a May-2026 `Current production state`;
- PM-17→PM-80 rolling history;
- operator interaction rules.

That mixture is no longer allowed because it creates a competing current-state source.

## Do not use this file for current state

New sessions must use:

```text
README AI-BOOT
→ docs/runtime/CURRENT_FRONTIER.md
→ ACTIVE WORK pointer
→ on-demand source
```

Current source ownership:

| Need | Canonical owner |
|---|---|
| bootstrap / AUTO-VIA / `agg` | `README.md` AI-BOOT |
| LIVE STATE | `docs/runtime/CURRENT_FRONTIER.md` |
| architecture / hard policy | `docs/foundation/PROJECT_VISION.md` |
| wiki-LLM lean method | `docs/foundation/WIKI_LLM_LEAN_METHOD.md` |
| workflow export policy | `workflows/README.md` |
| rebuild procedure | `docs/N8N_REBUILD.md` — read only when rebuild is actually in scope; validate against frontier before runtime |
| active architecture evidence work | GitHub issue #8 |
| lean repository consolidation | GitHub issue #10 |
| historical PM evidence | `docs/PM_INDEX_ARCHIVE.md`, sessions/runtime-packets, Git history |

## Important conflict rule

Any old rule previously present here that conflicts with a newer canonical owner is **historical**, not current.

In particular, do not resurrect PM-era assumptions such as:

- Ollama classifier as the mandatory primary router;
- Codex as a single future worker path;
- May-2026 workflow state as current runtime;
- old handoff/bootstrap preload rules.

Foundation v3 and the live frontier govern the current design/state.

## Historical recovery

The full pre-supersession content remains recoverable in Git history. Baseline immediately before the wiki-LLM lean branch:

`777504f7c46e5e724b6ad5f8586a98d43bab7ce8`

Do not expand this file into a new rolling memory. If a still-useful rule is discovered in history, migrate it to the correct canonical owner and cite the historical source in the migration evidence.
