# Always-on DEV queue domain

This directory contains READY backlog items or bounded pointers that may be observed by the n8n always-on LOCAL_DEV dispatcher.

Items with unresolved human gates (for example IDE installation or OAuth/login) are pointers only and MUST NOT be auto-executed until the gate is resolved and a concrete auto-eligible task is persisted.

Current gated pointer:
- `READY_V4_CODEX_IDE_CURSOR_QUALIFICATION.md` — Codex IDE in Cursor qualification; install/login gate unresolved.
