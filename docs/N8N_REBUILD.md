# n8n rebuild and recovery runbook

**Purpose:** Rebuild or recover the CONTROL PLANE automation stack if the VPS dies, n8n is lost, or workflows need to be recreated from this repo.

**Docs-only note:** Following this guide is a **runtime gate**. Do not execute steps during a docs-only review task.

**Related docs:** [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md) (PASS history), [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md) (webhook blocked until public HTTPS), [RUNTIME_GATES.md](RUNTIME_GATES.md) (one step at a time), [workflows/README.md](../workflows/README.md) (export rules), [MVP_CRITERIA.md](MVP_CRITERIA.md) §5, [MVP_STATUS.md](MVP_STATUS.md).

**Criterion 5 status:** **PASS** (2026-05-20) — [FIELD validation](#field-validation-checklist-criterion-5) completed as **non-destructive recovery drill** (not clean VPS rebuild). Evidence below; MVP overall **not** 5/5 — criterion 1 remains **PARTIAL** ([MVP_STATUS.md](MVP_STATUS.md)).

---

## Field validation checklist (criterion 5)

Use this section to close [MVP_CRITERIA.md](MVP_CRITERIA.md) §5 after a controlled test. Steps 1–7 below remain the operational runbook; this section defines **how** to validate without duplicating every command.

### DRY validation (docs-only — no runtime)

**When:** Before any VPS/SSH/n8n UI session (including this repo’s docs-only prep tasks).

**Do:**

- Read Steps 1–7 and [Recovery scenarios](#recovery-scenarios); confirm prerequisites list matches what you keep locally (SSH, token, chat_id, compose path).
- Confirm canonical export exists: `workflows/exports/2026-05-20_github-commit-datatable-dedupe-scheduled-v4.redacted.json` ([WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md)).
- Confirm redaction rules: no token, chat_id, credential ID, or webhook URL in committed JSON or docs.
- Confirm [RUNTIME_GATES.md](RUNTIME_GATES.md): one gate per session; v5 and GitHub webhook stay off unless separate gates.

**Do not:** SSH, Docker, n8n UI, workflow import, Manual Trigger, schedule activation, or Telegram sends.

**Outcome:** Runbook deemed **ready for FIELD** — criterion 5 remains **PARTIAL**.

### FIELD validation (manual gate — runtime)

**When:** One dedicated session; owner executes [RUNTIME_GATES.md](RUNTIME_GATES.md) gates in order. Requires n8n UI access (e.g. tunnel) and secrets **outside git**.

**Environment (pick one — document which in closure notes):**

| Mode | Use when |
|------|----------|
| **Clean VPS / empty n8n** | Strongest proof — full Steps 1–7 (not performed for 2026-05-20 closure) |
| **Recovery drill** | Production n8n intact — verify presence of workflows, Data Table, credential; manual dedupe smoke only; **no** destructive volume wipe |

### FIELD validation result — PASS (2026-05-20)

| Item | Result |
|------|--------|
| **Mode** | **Recovery drill** (non-destructive) — clean VPS rebuild **not** performed |
| **n8n UI** | Reachable via tunnel |
| **Workflows present** | v4 (**active**), v4 multirepo **draft** (**inactive**), handoff manual v1 (**inactive**) |
| **Data Table** | `control_plane_state` — keys for control-plane, dev-method, cursor-coordinate-converter, plus `last_push_head_sha` (separate push key) |
| **Telegram credential** | Operational (prior gates); no token copied into repo |
| **v4 duplicate-skip smoke** | Manual Trigger once on **active v4** → GitHub/Prepare/Get/Decide success → IF **false** → duplicate skip branch → **no** Telegram send → **no** new message on phone |
| **Not done (by design)** | Clean VPS; volume delete; destructive Docker; new import; v5; webhook; new schedule activation; persistent runtime change; secrets in git |

**Checklist (recovery drill — items evidenced):**

- [x] Prerequisites documented locally — not in repo
- [x] n8n reachable; existing workflows + Data Table intact (no wipe)
- [x] Data Table `control_plane_state` present with expected keys
- [x] Credential `CONTROL PLANE - Telegram Bot` — operational evidence (UI; no token in git)
- [x] chat_id in UI only — never committed
- [ ] v4 re-import on empty n8n — **N/A** (recovery drill; export already matched runtime)
- [x] Manual Trigger on **active v4**: duplicate skip — **no** Telegram (smoke **PASS**)
- [x] v4 schedule — already active; **no** new activation in this gate
- [x] v5 **off**; no GitHub webhook
- [x] Multirepo draft **inactive** — not promoted
- [x] No secrets in docs commit from registration task

**PASS criteria (criterion 5 → PASS):**

1. FIELD validation completed on **clean VPS** or **documented recovery drill**.
2. Steps 2–5 (or equivalent recovery path B in [Recovery scenarios](#recovery-scenarios)) succeeded: credential, Data Table, v4 import, manual dedupe smoke **PASS**.
3. Evidence recorded (date, environment mode, PASS/FAIL per checklist row) in control-plane docs — e.g. short note in this file or [MVP_STATUS.md](MVP_STATUS.md); update [MVP_CRITERIA.md](MVP_CRITERIA.md) §5 status only after review.
4. No criterion 1/3/4 regression claimed from this gate alone.

**Stop conditions (abort FIELD session):**

- Second Telegram on duplicate manual re-run → fix dedupe before schedule or closure.
- Token, chat_id, or webhook URL about to be pasted into a file → stop; use n8n UI only.
- Temptation to enable v5, configure GitHub webhook, or activate multirepo draft schedule in the same session → stop; separate gates.
- Production rebuild would require volume delete, `docker compose down -v`, or workflow mass-delete → stop unless explicitly approved.
- SSH or n8n unreachable → stop; do not patch runbook under pressure without recording FAIL.

**Do not (FIELD gate):**

- `git add .` / commit secrets from the VPS session
- Force push, `git reset --hard`, `git clean`, stash as part of “recovery”
- Enable v5 or production webhook
- Activate schedule before manual dedupe PASS
- Touch Alina workflows or non–control-plane repos

### After FIELD PASS (docs follow-up)

~~Update [MVP_CRITERIA.md](MVP_CRITERIA.md) §5 and [MVP_STATUS.md](MVP_STATUS.md)~~ — **Done** in docs commit `docs: record criterion 5 field validation pass`. Re-export redacted v4 only if runtime diverged from `workflows/exports/` (not required for 2026-05-20 closure).

---

## Target state after rebuild

| Component | Expected state |
|-----------|----------------|
| **MVP path** | v4 polling active — provisional MVP |
| **v4 workflow** | `CONTROL PLANE - GitHub commit Data Table dedupe scheduled v4` |
| **v4 flow** | GitHub public read → `control_plane_state` dedupe → Telegram |
| **v5 workflow** | `CONTROL PLANE - GitHub push webhook Data Table dedupe notify v5` — import optional, **stay inactive** |
| **GitHub webhook** | **Not configured** until public HTTPS exists |
| **Secrets** | Token and chat_id only in n8n UI / local secure store — **never in this repo** |

---

## What you need before starting

Keep these **outside the repo** (password manager, local notes, BotFather, n8n backup):

- VPS SSH access (host, user, key) — document locally, not here
- Telegram bot token for `@mrhz_control_plane_mvp_bot` (from BotFather)
- Operational Telegram `chat_id` (recovered locally; see [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md))
- n8n install method already used on the VPS (Docker Compose or native)
- Clone of this repo: `mrhz1973/control-plane`

**Do not commit:** tokens, chat IDs, webhook URLs, webhook secrets, tunnel credentials, or credential IDs.

---

## Step 1 — n8n prerequisites

One runtime gate per [RUNTIME_GATES.md](RUNTIME_GATES.md). Complete each sub-step before the next.

1. **Install or restore n8n** on the VPS (Docker or native). Pin version locally if you track it; this repo does not store install commands with secrets.
2. **Confirm n8n is reachable** for you (localhost on VPS, or SSH tunnel). Gate 7: test UI loads.
3. **Persistent storage:** ensure n8n data volume survives container restart (workflows, credentials, Data Tables).
4. **Do not** expose port `5678` to the public Internet without a separate security gate (reverse proxy, auth, or tunnel). See [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md).
5. **Do not** modify existing Alina workflows during CONTROL PLANE rebuild.

---

## Step 2 — Telegram credential in n8n

Recreate the credential in the n8n UI only.

| Field | Value |
|-------|--------|
| **Credential type** | Telegram |
| **Credential name** | `CONTROL PLANE - Telegram Bot` |
| **Token** | Paste from BotFather — **not** from this repo |

After save, run a minimal local `getMe` / `sendMessage` test if the bot was recreated (see [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md) local test section). Token stays in n8n or ephemeral env only.

---

## Step 3 — Data Table `control_plane_state`

Create in n8n UI: **Data → Data tables → Create**.

| Column | Purpose |
|--------|---------|
| `key` | Dedupe key (e.g. `github:mrhz1973/control-plane:last_commit_sha`) |
| `value` | Last seen SHA or state value |
| `updated_at` | Last update timestamp |
| `note` | Optional human note |

**Table name:** `control_plane_state`

**Scope:** CONTROL PLANE workflows only. Empty table on fresh rebuild is OK — first run will insert state.

**Recovery tip:** If you have an n8n export/backup of the Data Table, restore it locally; do not commit table contents to git.

---

## Step 4 — Import workflow v4 (provisional MVP)

**Export file:** `workflows/exports/2026-05-20_github-commit-datatable-dedupe-scheduled-v4.redacted.json`

1. In n8n: **Workflows → Import from file** → select the v4 redacted JSON.
2. Confirm workflow name: `CONTROL PLANE - GitHub commit Data Table dedupe scheduled v4`.
3. **Re-link credential:** open Telegram node → select `CONTROL PLANE - Telegram Bot` (import does not restore credential secrets).
4. **Configure chat_id in UI only:** Telegram node `chatId` is placeholder `__CONFIGURE_CHAT_ID_IN_N8N_UI__` in the export — replace with your operational chat_id in the n8n node parameter. **Do not** commit the value back to git.
5. **Data Table nodes:** confirm table name `control_plane_state` resolves (select table in UI if import left unresolved references).
6. **GitHub read:** v4 uses public REST read (no GitHub token). Watched repo in current export: `mrhz1973/control-plane`. Extend or duplicate later for `dev-method` / `cursor-coordinate-converter` if needed.
7. **Save workflow inactive** until manual tests pass.

---

## Step 5 — Manual verification (no spam)

Run **one gate at a time**. Goal: prove Telegram + dedupe without flooding the phone.

### 5a — Manual trigger, first run

1. Leave **Schedule Trigger disabled** (workflow inactive or schedule off).
2. Execute via **Manual Trigger** only.
3. **Expected:** one Telegram if the latest commit SHA is new relative to empty/missing Data Table row.
4. **Check Data Table:** row inserted/updated for key `github:mrhz1973/control-plane:last_commit_sha` (or equivalent from workflow).

### 5b — Manual trigger, duplicate skip

1. Run Manual Trigger again **without** a new GitHub commit.
2. **Expected:** execution completes; **no second Telegram** (duplicate skip path).
3. If a second message arrives, stop — fix Data Table dedupe before enabling schedule.

### 5c — Optional new-commit test

1. Push a **docs-only** commit to a watched repo (or wait for natural activity).
2. Run Manual Trigger once (or enable schedule only after 5a–5b pass).
3. **Expected:** exactly one Telegram for the new SHA.

### 5d — Enable v4 schedule (provisional MVP)

Only after 5a–5b pass:

1. Activate workflow.
2. Schedule: **one-minute** controlled polling (already in v4 export).
3. Observe briefly: no duplicate Telegram when no new commit occurs.
4. Document PASS in [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md) or commit notes if criteria met.

**Anti-spam rule:** do not repeatedly manual-trigger while debugging Telegram formatting. Fix dedupe first, then message content.

---

## Step 6 — v5 webhook (import optional, keep off)

**Export file:** `workflows/exports/2026-05-20_github-push-webhook-datatable-dedupe-notify-v5.redacted.json`

| Action | Do |
|--------|-----|
| Import v5 | Optional — for future use |
| Re-link Telegram credential | Yes, if imported |
| Configure chat_id in UI | Yes — same as v4, locally only |
| Manual placeholder test | Once, via Manual Trigger — then **disable** |
| Activate webhook / GitHub webhook | **No** — blocked |

**Why v5 stays off:** GitHub cannot reach `localhost` or SSH-tunnel-only n8n. Production webhook requires a **public HTTPS** URL. See [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md).

**Do not:**

- Configure GitHub repository webhook to an n8n localhost URL
- Commit production webhook URL or webhook secret
- Enable v5 production path before public HTTPS gate

---

## Step 7 — Smoke test checklist

Operational detail for FIELD validation — see [Field validation checklist](#field-validation-checklist-criterion-5). After rebuild, confirm:

- [ ] n8n UI reachable (your access path only)
- [ ] Credential `CONTROL PLANE - Telegram Bot` saved in n8n
- [ ] Data Table `control_plane_state` exists with four columns
- [ ] v4 imported, chat_id set in UI, credential linked
- [ ] Manual run: Telegram received once for new SHA
- [ ] Manual re-run: duplicate skip, no extra Telegram
- [ ] v4 schedule active **only if** duplicate skip validated
- [ ] v5 inactive; no GitHub webhook configured
- [ ] No tokens, chat_id, or webhook URLs in git diff

**Strict MVP criterion 1** (sub-30-second push notification) is **not** satisfied by v4 one-minute polling alone. That remains PARTIAL until webhook or faster path exists.

---

## Recovery scenarios

### A — VPS lost, n8n empty

Follow Steps 1–7 from scratch. Restore token/chat_id from local secure store. Data Table starts empty; first poll may notify latest commit once — acceptable if dedupe then holds.

### B — n8n workflows deleted, instance intact

Skip Step 1 if n8n still runs. Recreate credential if missing (Step 2). Recreate or verify Data Table (Step 3). Re-import v4 (Step 4). Re-run manual verification (Step 5).

### C — Data Table corrupted or wrong state

Export table backup if available. Or delete offending rows in UI (keys starting with `github:`). Re-run manual dedupe test (5a–5b) before re-enabling schedule.

### D — Telegram bot token rotated

Update credential in n8n UI only. Re-run one manual Telegram test. No repo changes.

### E — Need strict &lt;30s notifications later

Separate gate: public HTTPS ([PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md)) → configure GitHub webhook → enable v5 → disable or keep v4 as rollback.

---

## Do not do (hard rules)

| Forbidden | Reason |
|-----------|--------|
| Put token or chat_id in repo | Security |
| Commit webhook URL with secret | Security |
| GitHub webhook → localhost | GitHub cannot deliver |
| Expose port 5678 publicly without proxy/auth | Security |
| Batch install + import + activate + webhook | [RUNTIME_GATES.md](RUNTIME_GATES.md) |
| Modify Alina workflows | Out of scope |
| Enable v5 webhook before public HTTPS | [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md) |
| Re-import unredacted exports | [workflows/README.md](../workflows/README.md) |

---

## Optional earlier workflows (reference only)

Earlier manual-test exports under `workflows/exports/` (v2/v3, manual notify, Telegram test) are **not required** for MVP recovery. Use v4 as the canonical provisional path. Import others only for debugging history.

---

## After rebuild

1. Record PASS/FAIL in [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md) if runtime gates were executed.
2. Update [MVP_CRITERIA.md](MVP_CRITERIA.md) if closure status changed.
3. Re-export redacted v4 from n8n if runtime workflow diverged from committed JSON; follow [workflows/README.md](../workflows/README.md).
