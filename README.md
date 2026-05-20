# control-plane

Personal Automation MVP control-plane repository.

## Purpose

This repo holds documentation, workflow exports, and rebuild instructions for a personal automation stack (GitHub webhooks → n8n → Telegram notifications and handoff orchestration). It is **docs and exports only** in the bootstrap phase—no runtime code lives here.

## Repos watched

- [mrhz1973/dev-method](https://github.com/mrhz1973/dev-method) — generator and handoff changes
- [mrhz1973/cursor-coordinate-converter](https://github.com/mrhz1973/cursor-coordinate-converter) — frozen GIS benchmark

## Repos forbidden

- [mrhz1973/alina-lavoro](https://github.com/mrhz1973/alina-lavoro) — **out of scope**, must not be touched by this control-plane

## Current status

See **[docs/MVP_STATUS.md](docs/MVP_STATUS.md)** — operational MVP accepted (**D-C1-A**); C1 **PARTIAL**; **multirepo watcher active**, single-repo legacy off; v5 off; webhook not configured.

## MVP deadline

**7 days** from bootstrap. See [docs/MVP_CRITERIA.md](docs/MVP_CRITERIA.md) for closure criteria and [docs/MVP_STATUS.md](docs/MVP_STATUS.md) for current snapshot.

## Rebuild principle

Documentation in this repo must be sufficient to recreate the full automation setup if the VPS dies. See [docs/N8N_REBUILD.md](docs/N8N_REBUILD.md).

## Rules

- **No secrets committed.** Tokens, credentials, and API keys belong in n8n credentials or a local secure environment only.
- Workflow JSON exports must be redacted before commit (see [workflows/README.md](workflows/README.md)).

## Related docs

| Doc | Description |
|-----|-------------|
| [docs/MVP_STATUS.md](docs/MVP_STATUS.md) | Consolidated MVP snapshot and next gate |
| [docs/decision-packets/2026-05-21-criterion-1-latency-closure-decision.md](docs/decision-packets/2026-05-21-criterion-1-latency-closure-decision.md) | Criterion 1 decision **D-C1-A** (**DECIDED**) |
| [docs/MVP_CRITERIA.md](docs/MVP_CRITERIA.md) | Five closure criteria for Automation MVP |
| [docs/RUNTIME_GATES.md](docs/RUNTIME_GATES.md) | One-step runtime gates (never batched) |
| [docs/TELEGRAM_SETUP.md](docs/TELEGRAM_SETUP.md) | Telegram bot setup (Day 2+) |
| [docs/N8N_REBUILD.md](docs/N8N_REBUILD.md) | VPS / n8n rebuild; [field validation checklist](docs/N8N_REBUILD.md#field-validation-checklist-criterion-5) (criterion 5) |
| [examples/watched-repos.md](examples/watched-repos.md) | Watched repo rationale |
