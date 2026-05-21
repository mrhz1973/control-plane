# Operating memory

**Status:** active.

Future chats and agents must read this file before changing CONTROL PLANE n8n automation.

---

## Ready-import n8n credential binding

For CONTROL PLANE ready-import workflow JSON, **credential name alone is not enough**.

If a workflow JSON contains only:

```json
"credentials": {
  "telegramApi": {
    "name": "CONTROL PLANE - Telegram Bot"
  }
}
```

n8n may import Telegram nodes as **red / unbound**.

Ready-import JSON must contain **real n8n credential ids** when the goal is zero manual node repair.

**Current ready-import file:**

```text
workflows/exports/READY_IMPORT_40-control-plane-active-with-credentials.json
```

**Required:**

| Field | Value |
|-------|--------|
| All Telegram nodes `chatId` | `472599368` |
| All Telegram nodes `credentials.telegramApi.name` | `CONTROL PLANE - Telegram Bot` |
| All Telegram nodes `credentials.telegramApi.id` | **real** n8n credential id |
| All GitHub nodes `credentials.githubApi.name` | `GitHub account` |
| All GitHub nodes `credentials.githubApi.id` | **real** n8n credential id |

**Forbidden in ready-import output:**

- `__CONFIGURE_CHAT_ID_IN_N8N_UI__`
- `__REDACTED_N8N_CREDENTIAL_ID__`
- name-only credential blocks (no `id`)

If real credential ids cannot be recovered from n8n API or a **local unredacted export**, **STOP**. Do not generate a fake ready-import file.

**Do not commit:** bot tokens, OAuth secrets, or `.n8n-credential-ids.local.json`.

---

## Build script

```text
scripts/build-ready-import-40.py
```

**Inputs (required — script exits with error if missing):**

| Source | Variables / file |
|--------|------------------|
| Environment | `TELEGRAM_CREDENTIAL_ID`, `GITHUB_CREDENTIAL_ID` |
| Local file (gitignored) | `.n8n-credential-ids.local.json` |

Example local file (create at repo root, never commit):

```json
{
  "telegramCredentialId": "<from n8n UI or unredacted export>",
  "githubCredentialId": "<from n8n UI or unredacted export>"
}
```

**Recover ids without committing them:**

1. n8n UI → Credentials → open each credential → copy id from URL or export.
2. Local unredacted workflow export in Downloads (match by credential **name**).
3. n8n API `GET /api/v1/credentials` with `N8N_API_KEY` (do not print tokens in logs).

---

## Historical note (2026-05-21)

Commit `8b3a468` regenerated ready-import with **name-only** credentials. That output is **invalid** for zero-touch import until rebuilt with real ids via the script above.

---

## Current production state (2026-05-22)

| Item | State |
|------|--------|
| **Production workflow** | `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` — **Published** |
| **Rebuild source** | `workflows/exports/READY_IMPORT_40-control-plane-active-with-credentials.json` with **real credential ids** (`1f62ebd`) |
| **PM-15 smoke** | **PASS** on commit `c0ea042` — [session](sessions/2026-05-22-control-plane-pm15-new-40-smoke-pass.md) |
| **CP list** | `40` ACTIVE · `01` / `20` / `30` OFF — no `41`/`42` in use |

**Recovery:** If production **`40`** is missing again, import from **`READY_IMPORT_40-control-plane-active-with-credentials.json`**, **not** old candidate `41`/`42` redacted exports or name-only bundles.

**Post-PM15 runtime snapshot (pending):** `workflows/exports/2026-05-22_40-production-post-pm15-smoke.redacted.json` — **not yet in git**; export current published `40` from n8n UI when snapshot is required ([session](sessions/2026-05-22-control-plane-40-post-pm15-export-snapshot.md)). **Non-blocking** for PM-17.

**PM-17 classifier output schema:** `pm17-classifier-v1` — sample [docs/examples/pm17-classifier-output.sample.json](examples/pm17-classifier-output.sample.json); tool `tools/ollama-classifier-dry-run.mjs`. Ollama = classifier only, not implementer.

**PM-18 Codex OAuth feasibility:** `pm18-codex-oauth-feasibility-v1` — [sample](examples/pm18-codex-feasibility-output.sample.json); tool `tools/codex-oauth-feasibility-check.mjs`. **No** OAuth tokens in git. Codex = future implementer worker only, after classifier + manual gate.

**PM-19 implementer bridge:** `pm19-implementer-bridge-request-v1` / `pm19-implementer-bridge-result-v1` — [request](examples/pm19-implementer-bridge-request.sample.json) · [result](examples/pm19-implementer-bridge-result.sample.json); tool `tools/implementer-bridge-dry-run.mjs`. Mock worker only until PM-18 unblocks Codex.

**PM-20 n8n bridge packet:** [PM20_N8N_BRIDGE_PACKET.md](PM20_N8N_BRIDGE_PACKET.md) · [runtime packet](runtime-packets/pm-20-n8n-classifier-bridge-gate-packet.md) · [flow sample](examples/pm20-n8n-bridge-flow.sample.json). **No** real worker in first runtime; PM-18 PENDING blocks Codex only, not mock bridge. Successor workflow for PM-21 — do not silently edit published `40`.
