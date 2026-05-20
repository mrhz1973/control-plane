# Handoff n8n gate (MVP criterion 2)

**Docs-only design.** This document prepares MVP criterion 2. It does **not** run n8n, execute `handoff-generate.mjs`, open the n8n UI, or configure webhooks.

**Criterion (Italian):** `handoff-generate.mjs` può essere invocato da n8n (manuale o webhook) e il risultato `Prompt ready: yes/no` arriva su Telegram.

**Related:** [MVP_CRITERIA.md](MVP_CRITERIA.md) §2, [RUNTIME_GATES.md](RUNTIME_GATES.md), [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md), [N8N_REBUILD.md](N8N_REBUILD.md), [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md).

---

## Purpose

Extend the CONTROL PLANE stack beyond commit polling (v4) so that **handoff generation** from `dev-method` can be triggered through n8n and the user receives a **binary readiness signal** on Telegram:

```text
Prompt ready: yes
```

or

```text
Prompt ready: no
```

Criterion 2 is **closed** only after a real runtime test proves that chain end-to-end. Design and docs can be ready before that test.

---

## Scope boundary

| In scope (criterion 2) | Out of scope (other criteria / gates) |
|--------------------------|----------------------------------------|
| Invoke `handoff-generate.mjs` from n8n | v4 one-minute commit polling (criterion 1 provisional path) |
| Parse `Prompt ready: yes/no` | Strict sub-30s push notification (criterion 1 final) |
| Telegram notification of result | Three full handoff→implementer→commit cycles (criterion 3) |
| Manual or webhook n8n trigger | Production GitHub webhook before [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md) |
| CONTROL PLANE workflows only | Alina workflows — **do not touch** |

**Script home:** `handoff-generate.mjs` lives in [mrhz1973/dev-method](https://github.com/mrhz1973/dev-method), not in control-plane. This repo documents **orchestration** only.

---

## Expected script contract (design)

Align exact flags and env vars with `dev-method` when implementing the runtime gate. Until then, treat this as the **control-plane interface contract**.

### Inputs (conceptual)

n8n must supply whatever `handoff-generate.mjs` requires, typically including:

| Input | Role |
|-------|------|
| **Target repo** | Which watched repo the handoff applies to (`dev-method`, `cursor-coordinate-converter`, etc.) — never `alina-lavoro` |
| **Task / handoff context** | Identifier or payload the script uses to build the prompt (path, issue ref, template name — per dev-method) |
| **Working directory** | Clone or mount path on the VPS where the target repo exists |
| **Node runtime** | `node` available on the host that runs the script |

Inputs are passed via n8n **Execute Command**, **SSH**, or a thin **HTTP wrapper** on the VPS — choose one method in a separate runtime gate; do not batch method selection with first test.

**No secrets in repo:** API keys or tokens required by the script stay in n8n credentials or VPS env, not in committed docs or workflow JSON.

### Output (required for criterion 2)

The script (or a wrapper) must expose a parseable result for n8n:

| Field | Values |
|-------|--------|
| **Prompt ready** | `yes` or `no` (case-sensitive in Telegram message per verification) |

**Telegram message shape (minimum):**

```text
CONTROL PLANE handoff
Repo: <repo>
Prompt ready: yes
```

or

```text
CONTROL PLANE handoff
Repo: <repo>
Prompt ready: no
```

Optional extra lines (reason, path, short SHA) are allowed if they do not contain secrets.

**Parsing in n8n:** Code node or IF node reads stdout/JSON and branches on `yes` / `no` before sending Telegram.

---

## Future n8n flow (not implemented in this task)

```text
Trigger (manual OR webhook when PUBLIC_WEBHOOK_GATE satisfied)
  → Prepare handoff inputs (repo, context)
  → Run handoff-generate.mjs on VPS (Execute Command / SSH / HTTP)
  → Parse Prompt ready: yes|no
  → Telegram (credential CONTROL PLANE - Telegram Bot)
  → Optional: store last handoff run in control_plane_state (separate design)
```

### Trigger options

| Trigger | When to use | Notes |
|---------|-------------|--------|
| **Manual** | First validation gate | Safest; no GitHub webhook required |
| **Webhook** | After [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md) | Do not point GitHub at localhost |
| **Schedule** | Not for criterion 2 closure | v4 schedule is for commit polling, not handoff |

### Telegram

- **Credential name:** `CONTROL PLANE - Telegram Bot` (already PASS — see [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md))
- **chat_id:** configure only in n8n UI — never commit
- **Bot:** `@mrhz_control_plane_mvp_bot`

### VPS / path assumptions (document locally, not in git)

Record on your machine (not in repo):

- Path to `dev-method` clone on VPS
- Command line used to invoke `handoff-generate.mjs`
- Node version

---

## Docs-only path (now)

| Step | Status |
|------|--------|
| Design document (this file) | **Done** when committed |
| n8n workflow JSON export | **Not created** — after runtime workflow exists |
| Script execution test | **Not run** |
| Telegram result test | **Not run** |
| MVP criterion 2 closure | **PENDING** |

Updating this file does **not** satisfy criterion 2. Closure requires a real n8n run and a Telegram message on the user's phone.

---

## Runtime gates (separate, one at a time)

Follow [RUNTIME_GATES.md](RUNTIME_GATES.md). Suggested order for criterion 2 only:

1. Confirm `handoff-generate.mjs` runs on VPS with known inputs (manual SSH/shell, outside n8n) — document command locally.
2. Import or build n8n workflow **inactive**; link `CONTROL PLANE - Telegram Bot`; set `chat_id` in UI.
3. n8n **manual** trigger → execute script → verify Telegram shows `Prompt ready: yes` or `Prompt ready: no`.
4. Export redacted workflow JSON to `workflows/exports/` per [workflows/README.md](../workflows/README.md).
5. (Optional later) webhook trigger — only after public HTTPS gate.

Do **not** combine: import + execute + activate webhook + schedule in one session.

---

## What NOT to do now

- Open n8n UI for implementation (unless user starts explicit runtime gate)
- Execute `handoff-generate.mjs` from this docs task
- Store token, chat_id, webhook URL, or webhook secret in repo
- Configure GitHub webhook to localhost
- Enable v5 or production webhook for handoff
- Modify `workflows/exports/*.json` in this task
- Touch GIS (`cursor-coordinate-converter` automation), DEV repo content, or **alina-lavoro**
- Commit unredacted workflow exports

---

## Verification (criterion 2 closure)

When runtime is allowed:

1. Trigger n8n workflow (manual first).
2. n8n invokes `handoff-generate.mjs` with valid inputs for a watched repo.
3. User receives Telegram message containing exactly **`Prompt ready: yes`** or **`Prompt ready: no`**.
4. Record PASS in [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md) and update [MVP_CRITERIA.md](MVP_CRITERIA.md) §2 status.

---

## Dependency on other MVP work

| Dependency | Status |
|------------|--------|
| Telegram bot + credential | PASS ([TELEGRAM_SETUP.md](TELEGRAM_SETUP.md)) |
| v4 commit polling | Active provisional path — independent of criterion 2 |
| Public HTTPS for GitHub webhook | Not required for **manual** criterion 2 test |
| dev-method script contract | Source of truth in dev-method repo — confirm flags before VPS test |

Criterion 3 (three full cycles) builds on criterion 2 but is a **separate** closure item.
