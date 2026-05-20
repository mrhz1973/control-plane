# Public webhook gate

This document records the next runtime gate required before using a real GitHub webhook with n8n.

**Docs-only:** updating this file does not run runtime, open n8n UI, or configure webhooks.

## At a glance

| Item | State |
|------|--------|
| **v4 polling** (`CONTROL PLANE - GitHub commit Data Table dedupe scheduled v4`) | **Active** — provisional MVP path: GitHub public read → `control_plane_state` dedupe → Telegram |
| **v5 webhook** (`CONTROL PLANE - GitHub push webhook Data Table dedupe notify v5`) | **Inactive** — imported and manually tested (placeholder), then disabled |
| **GitHub webhook (production)** | **Not configured** — cannot target `localhost`; GitHub must reach a public HTTPS endpoint |
| **n8n access today** | localhost / SSH tunnel only — not valid for GitHub delivery |
| **Before real webhook** | Safe public HTTPS URL to n8n (or keep polling) — see options below |
| **Secrets in repo** | None — no tokens, chat IDs, webhook URLs, or webhook secrets committed |

## Current status

The current working MVP path is:

```text
GitHub public read polling -> Data Table dedupe -> Telegram
```

Runtime workflow:

```text
CONTROL PLANE - GitHub commit Data Table dedupe scheduled v4
```

Status:

- v4 one-minute polling is active.
- v4 dedupe is validated with `control_plane_state`.
- v5 webhook workflow is imported and manually tested, but disabled.
- GitHub webhook is not configured.
- n8n is currently accessed through localhost/SSH tunnel, so GitHub cannot reach the webhook URL.

## Problem

GitHub cannot deliver webhooks to `localhost` or other URLs reachable only on your machine or via SSH tunnel.

A real GitHub webhook requires a **public HTTPS** endpoint reachable from GitHub’s servers. Until that exists, **keep v4 polling**; do not point GitHub at an n8n webhook URL that is not publicly reachable.

## Requirement

Before enabling the v5 webhook path, provide n8n with a safe public HTTPS URL.

The public URL must:

- reach the existing n8n instance;
- avoid exposing credentials in the repo;
- avoid committing production webhook URLs containing secrets;
- allow GitHub webhook delivery;
- keep existing Alina workflows untouched;
- keep v4 polling available as rollback/provisional MVP path.

## Candidate approaches

### Option A — Cloudflare Tunnel

Use a Cloudflare Tunnel from the VPS to expose only n8n through HTTPS.

Pros:

- no need to open port 5678 directly;
- can provide HTTPS;
- reversible;
- good fit for a controlled public endpoint gate.

Cons:

- requires Cloudflare/domain setup;
- webhook path must be protected by a GitHub webhook secret or explicit validation logic;
- needs careful documentation so tunnel credentials do not enter the repo.

### Option B — reverse proxy on VPS

Expose n8n through a reverse proxy such as Caddy or Nginx with HTTPS.

Pros:

- standard server setup;
- direct control on VPS;
- good long-term production path.

Cons:

- requires firewall and HTTPS configuration;
- greater risk of exposing the n8n UI if misconfigured;
- must be done as a separate runtime/security gate.

### Option C — keep polling MVP for now

Keep v4 polling active and postpone webhook/public URL work.

Pros:

- already working;
- dedupe validated;
- no new public exposure;
- lowest operational risk right now.

Cons:

- one-minute polling does not satisfy strict sub-30-second notification;
- not a true GitHub push webhook.

## Recommended next gate

**Post-MVP (D-C1-A, 2026-05-21):** **Not** the next automatic gate. Operational MVP accepted with v4 polling (C1 **PARTIAL**, SLA 1–5 min). Pursue this path only if user **explicitly reopens** strict &lt;30s (former D-C1-B) — [decision packet](decision-packets/2026-05-21-criterion-1-latency-closure-decision.md).

If reopened, recommended path:

```text
Keep v4 active. Prepare public HTTPS (e.g. Cloudflare Tunnel or reverse proxy) as a separate security gate before enabling v5.
```

Do not configure a GitHub webhook again until one of these is true:

- n8n has a reachable public HTTPS URL; or
- another safe relay exists between GitHub and n8n.

## Prerequisite for runtime gates 4–5

Per [RUNTIME_GATES.md](RUNTIME_GATES.md), “configurare webhook GitHub” and “testare webhook” stay **blocked** until this public HTTPS gate is satisfied (or polling remains the chosen path).

## Runtime rules

Do not do any of the following without a separate explicit runtime gate:

- execute runtime as part of a docs-only review task;

- expose port 5678 publicly;
- publish n8n UI without access protection;
- configure GitHub webhook to localhost;
- commit webhook URLs containing secrets;
- activate v5 production webhook path;
- modify existing Alina workflows.

## Current safe state

- v4 polling active and stable.
- v5 webhook inactive.
- no public webhook configured.
- no tokens, chat IDs, webhook URLs, or secrets committed.
