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

## Local CLI dry-run PASS

**Date:** 2026-05-20

Local PowerShell gate executed from method repo clone. **No n8n, no tunnel, no webhook, no GIS file changes, no commit/push, no secrets.**

| Field | Value |
|-------|--------|
| **Method repo** | `mrhz1973/dev-method` (local: `dev-method` clone) |
| **Target repo** | `mrhz1973/cursor-coordinate-converter` (local: `cursor-coordinate-converter` clone) |
| **Command class** | Local CLI dry-run |
| **Script** | `node .\tools\handoff-generate.mjs` |
| **Flags** | `--implementer cursor`, `--stdout`, `--dry-run`, `--strict-format`, `--require-ready` |
| **Embedded format** | structured |
| **Prompt ready** | **yes** |
| **Task status** | pending |
| **Operation type** | plan |
| **Risk level** | medium |
| **Commit authorized** | yes (not executed — dry-run) |
| **Push authorized** | yes (not executed — dry-run) |
| **Dry-run mode** | YES — no execution performed |
| **Discovery docs** | `docs/orchestrator/latest.md`, `docs/orchestrator/inbox/2026-05-20_0055_t1-1-polygon-flow-closeout.md` |
| **Task generated** | GIS — T1.3 PCN/Geoportale OGC layer gate decision packet |

**What did not happen:** no implementer run, no GIS files modified, no commit/push from generator, no n8n, no Telegram, no secrets read or committed.

**Conclusion:** Local CLI generator path **PASS**. Criterion 2 remains **open** until n8n workflow invokes the script and Telegram receives **`Prompt ready: yes`** or **`Prompt ready: no`** on the user's phone.

---

## n8n container CLI dry-run PASS

**Date:** 2026-05-20

Dry-run executed **inside the n8n container** against mounted runtime repos. **No n8n workflow created or modified, no n8n UI, no Telegram, no implementer, no repo mutation, no secrets.**

| Field | Value |
|-------|--------|
| **Command class** | Container CLI dry-run |
| **Host runtime path** | `/root/local-files/handoff-runtime` |
| **Container runtime path** | `/files/handoff-runtime` |
| **Container path — method** | `/files/handoff-runtime/dev-method` |
| **Container path — target** | `/files/handoff-runtime/cursor-coordinate-converter` |
| **safe.directory** | Configured in container for both runtime repos |
| **Method repo commit (runtime)** | `bef41cc` — fix: complete embedded handoff hardening |
| **Target repo commit (runtime)** | `dc83c21` — docs: freeze GIS pending automation MVP |
| **Script** | `node /files/handoff-runtime/dev-method/tools/handoff-generate.mjs` |
| **Flags** | `--repo /files/handoff-runtime/cursor-coordinate-converter`, `--method /files/handoff-runtime/dev-method`, `--implementer cursor`, `--stdout`, `--dry-run`, `--strict-format`, `--require-ready` |
| **Embedded format** | structured |
| **Prompt ready** | **yes** |
| **Exit codes** | `HANDOFF_EXIT_CODE=0`, `CONTAINER_COMMAND_EXIT_CODE=0` |

**What did not happen:** no n8n workflow created/modified, no Telegram, no implementer, no GIS file changes, no commit/push from generator, no secrets read or committed.

**Conclusion:** n8n container can execute the generator with the same dry-run contract as local CLI. Criterion 2 remains **open** until an **n8n manual workflow** runs this command (or equivalent) and Telegram delivers **`Prompt ready: yes/no`**.

---

## Manual n8n workflow v1 prepared

**Date:** 2026-05-20

**Status:** **Prepared / import pending** — export committed; **not** imported, executed, or activated.

| Field | Value |
|-------|--------|
| **Export file** | [workflows/exports/2026-05-20_handoff-generate-manual-telegram-v1.redacted.json](../workflows/exports/2026-05-20_handoff-generate-manual-telegram-v1.redacted.json) |
| **Workflow name** | `CONTROL PLANE - Handoff generate manual Telegram v1` |
| **active in export** | `false` |
| **Flow** | Manual Trigger → Execute Command (handoff dry-run) → Parse stdout → Telegram |
| **Command** | Same container dry-run validated 2026-05-20 |

### Runtime steps (next gate — not this task)

1. Import workflow JSON in n8n UI (**inactive**).
2. Link credential **`CONTROL PLANE - Telegram Bot`**.
3. Set **chat_id** only in n8n UI — never commit.
4. Leave workflow **inactive** until manual test is ready (do not activate schedule/webhook).
5. Run **Manual Trigger** once.
6. Confirm Telegram message contains **`Prompt ready: yes`** or **`Prompt ready: no`**.
7. If PASS and runtime differs from export → re-export redacted JSON and update this doc.

**Criterion 2:** **PASS** (2026-05-20) — step 6 confirmed on phone; see [Manual n8n workflow + Telegram PASS](#manual-n8n-workflow--telegram-pass).

---

## Self-hosted n8n Execute Command availability diagnosis

**Date:** 2026-05-20
**Method:** read-only SSH + `docker inspect` / `docker exec` (no n8n UI, no workflow run, no container restart, no config changes).

### Runtime observed

| Item | Finding |
|------|---------|
| **Container** | `root-n8n-1` (`a740e772bcca`) |
| **Image** | `docker.n8n.io/n8nio/n8n` |
| **n8n CLI version** | `2.19.5` |
| **Execute Command on disk** | **Present** — `ExecuteCommand.node.js` under `n8n-nodes-base/dist/nodes/ExecuteCommand/` |
| **Code node on disk** | **Present** — `n8n-nodes-base/dist/nodes/Code/Code.node.js` |
| **NODES_EXCLUDE** | **Not set** in container env |
| **NODES_INCLUDE** | **Not set** |
| **N8N_BLOCK_ENV_ACCESS_IN_NODE** | Not set |
| **N8N_RESTRICT_FILE_ACCESS_TO** | Not set |
| **N8N_RUNNERS_ENABLED** | `true` |
| **NODE_FUNCTION_ALLOW_BUILTIN** | Not set |
| **NODE_FUNCTION_ALLOW_EXTERNAL** | Not set |

### n8n v2 default policy (verified in container)

n8n **v2** ships `disabled-nodes.rule.js` which disables by default:

- `n8n-nodes-base.executeCommand`
- `n8n-nodes-base.localFileTrigger`

When **`NODES_EXCLUDE` is not set**, workflows using Execute Command are flagged/disabled. n8n docs in that rule recommend enabling via explicit env, e.g. **`NODES_EXCLUDE=[]`** (empty exclude list).

**Interpretation:** the node package exists, but the **runtime node registry excludes it by default** until env is configured.

### Export v1 compatibility (`2026-05-20_handoff-generate-manual-telegram-v1.redacted.json`)

| Check | Result |
|-------|--------|
| Execute Command `type` | `n8n-nodes-base.executeCommand` — matches on-disk node name |
| Execute Command `typeVersion` | `1` |
| Code node `typeVersion` | `2` |
| Telegram node | Standard redacted template pattern |

**Finding:** export shape is **consistent** with installed node types. Import/UI issues are **unlikely** to be caused by wrong JSON type string alone; primary blocker is v2 **default disable policy**, not missing files.

### Conclusion: **A — likely config exclusion; fix may be NODES_EXCLUDE / env config**

| Code | Meaning | This deployment |
|------|---------|-----------------|
| **A** | Config exclusion — enable via `NODES_EXCLUDE=[]` or explicit include/exclude policy | **Selected** |
| B | Execute Command absent — Code-only rewrite | **Rejected** — node files present |
| C | Export type mismatch | **Rejected as primary** — types match; policy block dominates |
| D | Inconclusive | **Rejected** — sufficient container evidence |

**Not chosen yet:** Code node rewrite (B fallback) or bridge — only if config fix fails after controlled runtime gate.

### FASE 2 config fix — **applied** (see also [Execute Command enabled via NODES_EXCLUDE config](#execute-command-enabled-via-nodes_exclude-config))

~~**FASE 2 is blocked** until step 1–3 are validated.~~ Steps 1–2 done 2026-05-20; step 3 (UI check) pending.

---

## Execute Command enabled via NODES_EXCLUDE config

**Date:** 2026-05-20

Runtime config gate applied on VPS `ionos-n8n`. **No** handoff workflow execution, **no** Telegram, **no** workflow activation.

| Field | Value |
|-------|--------|
| **Config changed** | `NODES_EXCLUDE=[]` added to `n8n` service `environment` in `/root/docker-compose.yaml` |
| **Backup path** | `/root/docker-compose.yaml.bak.20260520_175750` (on VPS — not in git) |
| **Apply method** | `docker compose up -d n8n` from `/root` (container recreated, volumes preserved) |
| **Container after restart** | `root-n8n-1` (`cb7273d622aa`) — Up, image `docker.n8n.io/n8nio/n8n` |
| **n8n version** | `2.19.5` |
| **`NODES_EXCLUDE` in container** | `[]` (verified via `printenv`) |
| **Execute Command on disk** | Present — `ExecuteCommand.node.js` |
| **Policy check (CLI)** | `NODES_EXCLUDE` set → n8n v2 `disabled-nodes.rule.js` skips default ExecuteCommand disable |
| **Handoff workflow** | **Not executed** |
| **Telegram** | **Not sent** |
| **v4 / v5** | Not modified in compose; v4 schedule should resume after n8n recreate |

### Next gate (separate)

1. **n8n UI:** open imported handoff workflow v1; confirm Execute Command node is recognized (not “disabled/unavailable”).
2. Link credential + chat_id in UI if needed.
3. **Manual Trigger once** → confirm Telegram `Prompt ready: yes/no`.
4. Record PASS in docs if criterion 2 closes.

---

## Manual Trigger failed: runtime repo path not git repo

**Date:** 2026-05-20 (after Execute Command UI recognized + one Manual Trigger attempt)

| Field | Value |
|-------|--------|
| **Workflow** | `CONTROL PLANE - Handoff generate manual Telegram v1` (inactive) |
| **Failed node** | `Execute Command - handoff dry-run` |
| **Error observed** | `ERROR: --repo is not a git repository: /files/handoff-runtime/cursor-coordinate-converter` |
| **Telegram** | **Not sent** — criterion 2 **not** PASS |
| **Second workflow run** | **Not performed** (per gate rules) |

### Root cause (verified)

Runtime directories **are** valid Git clones (`.git` present on host and in container). Failure was **not** missing clone.

**Actual cause:** n8n **Execute Command** runs the shell command as **`root`** inside the container. `root` had **no** `git config safe.directory` for root-owned repos under `/files/handoff-runtime/`. Git reported **dubious ownership** → `handoff-generate.mjs` treated `--repo` as non-git → same user-visible error.

Earlier container CLI tests used **`docker exec -u node`**, which had `safe.directory` configured — those passed and masked this gap.

### Corrective action (applied)

| Action | Detail |
|--------|--------|
| **Clone/recreate** | **Not required** — repos already present |
| **Fix applied** | `git config --global --add safe.directory` for **root** in container `root-n8n-1` on both runtime paths |
| **Also verified** | `node` user `safe.directory` (from prior gate) |
| **`git pull`** | Attempted as root — `.git/FETCH_HEAD` permission denied (non-blocking; read-only dry-run OK at current SHAs) |

**Runtime commits (unchanged, valid):**

| Repo | `git log -1` |
|------|----------------|
| **dev-method** | `bef41cc` — fix: complete embedded handoff hardening |
| **cursor-coordinate-converter** | `dc83c21` — docs: freeze GIS pending automation MVP |

**Note:** After future `docker compose` recreate of n8n, re-apply **root** `safe.directory` in container (or automate via entrypoint) — not persisted in compose yet.

---

## Runtime repos repaired / verified

**Date:** 2026-05-20

Post-fix verification **inside container as root** (same user class as Execute Command):

```text
Embedded format:    structured
Prompt ready:       yes
Dry-run mode:       YES — no execution was performed
HANDOFF_EXIT=0
```

| Check | Result |
|-------|--------|
| Both paths have `.git` | **Yes** |
| `handoff-generate.mjs` dry-run as root | **PASS** |
| n8n workflow re-run | **Not done** in this task |
| Telegram | **Not sent** |

**Criterion 2:** ~~still **open**~~ **PASS** — see [Manual n8n workflow + Telegram PASS](#manual-n8n-workflow--telegram-pass).

---

## Manual n8n workflow + Telegram PASS

**Date:** 2026-05-20

| Field | Value |
|-------|--------|
| **Workflow** | `CONTROL PLANE - Handoff generate manual Telegram v1` |
| **Trigger** | Manual Trigger (single retry after runtime fix) |
| **Workflow active flag** | **Inactive** — manual run only; not activated for schedule/webhook |
| **Status** | **PASS** |
| **Telegram** | Message **arrived on user's phone** |
| **Prompt ready** | **yes** |
| **Exit code** | **0** |
| **GitHub webhook** | **Not configured** |
| **v4 / v5** | **Not modified** |

**Path:** Manual Trigger → Execute Command (`handoff-generate.mjs` dry-run) → Parse stdout → Telegram send.

**Prior failure:** first Manual Trigger failed ([root `safe.directory`](#manual-trigger-failed-runtime-repo-path-not-git-repo)); fixed before this PASS.

**Conclusion:** **MVP criterion 2 — PASS.** Does **not** close full MVP (criteria 1, 3, 5 still open). Does **not** count as [criterion 3](END_TO_END_CYCLES.md) cycle PASS (no implementer → commit → watched-repo notifica).

**Optional follow-up:** re-export redacted handoff JSON if runtime workflow differs from [template](../workflows/exports/2026-05-20_handoff-generate-manual-telegram-v1.redacted.json).

---

## Automatic GIS handoff from multirepo watcher PASS

**Trigger:** `02 - CP v4 multirepo polling - TARGET ON` (scheduled poll) — **not** Manual Trigger on `03` handoff manual workflow.

| Field | Value |
|-------|--------|
| **Repo** | `mrhz1973/cursor-coordinate-converter` |
| **Commit** | `2a2ff31` (`2a2ff310a9e7b0fa985e15d6fd44536ad3a36952`) |
| **Message** | `docs: retest automatic handoff after IF fix` |
| **Handoff Telegram** | **PASS** — `Prompt ready: yes`; exit code **0**; embedded format structured; task status pending; operation type plan; risk medium; target cursor-coordinate-converter; mode manual dry-run |
| **Commit notify Telegram** | **PASS** — New `2a2ff31`; Previous `8c72f48`; same message |
| **Technical result** | **PASS** — automatic handoff path works end-to-end from GIS commit via multirepo watcher |

**UX note (non-blocking):** Handoff and commit Telegram arrived in the **same minute**; **handoff message arrived before** commit notification because n8n branches run **in parallel**. Technical **PASS**; future improvement: prefer commit notification before handoff result, or enrich handoff message (see [POST_MVP_BACKLOG.md](POST_MVP_BACKLOG.md) PM-06).

**Posture unchanged:** v5 **off**; webhook **not configured**; `01` single-repo legacy **off**; `03` handoff manual remains manual/test fallback.

---

## 02F safe text + Telegram document handoff PASS

**Trigger:** `02F - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT` (scheduled poll) — superseded experimental workflows `02` / `02B`–`02E` for this path.

| Field | Value |
|-------|--------|
| **GIS commit** | `58c5c46` (`58c5c4650772d21ffd6e8edacf2c536ffd4a4bf0`) — `docs: final retest handoff safe text file attachment` |
| **Safe text Telegram** | **PASS** — `Prompt ready: yes`; exit **0**; generated prompt available **yes**; length **2884**; task/operation/risk fields present; **no** Markdown/entities parse error; **no** full prompt in message body |
| **Document Telegram** | **PASS** — `latest-gis-handoff.md` attached (~4.5 KB) |
| **Prompt file path (n8n)** | `/home/node/.n8n-files/latest-gis-handoff.md` |
| **Commit notify** | **PASS** — New `58c5c46`; Previous `7a59bbf` |
| **n8n execution** | `02F` runs **succeeded** — safe text + file + commit branches |

**UX note (non-blocking):** Handoff/file Telegram still arrives **before** commit notification (parallel branches). Technical **PASS**; optional ordering improvement in [POST_MVP_BACKLOG.md](POST_MVP_BACKLOG.md).

**Cleanup (done):** After 02F **PASS**, superseded CONTROL PLANE workflows removed (`02`, `02B`–`02E`, `90`–`93`). **Retained:** `02F` target; `01` legacy off; `03` manual fallback; `20` v5 off. ALINA LAVORO workflows untouched. Details: [POST_MVP_BACKLOG.md](POST_MVP_BACKLOG.md) PM-07.

**Export hygiene (pending):** No committed redacted JSON for **`02F`** yet — manual export gate PM-08 ([WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md#02f-redacted-export-status)).

---

## Docs-only path (now)

| Step | Status |
|------|--------|
| Design document (this file) | **Done** |
| Local CLI dry-run (`Prompt ready: yes`) | **PASS** — [Local CLI dry-run PASS](#local-cli-dry-run-pass) |
| Container CLI dry-run inside n8n | **PASS** — [n8n container CLI dry-run PASS](#n8n-container-cli-dry-run-pass) |
| Manual n8n workflow v1 export | **Prepared** — [Manual n8n workflow v1 prepared](#manual-n8n-workflow-v1-prepared) |
| Execute Command availability diagnosis | **Done** — conclusion **A** |
| Execute Command config fix (`NODES_EXCLUDE=[]`) | **Applied** — [Execute Command enabled](#execute-command-enabled-via-nodes_exclude-config) |
| Manual Trigger (first attempt) | **FAIL** — [dubious ownership / root safe.directory](#manual-trigger-failed-runtime-repo-path-not-git-repo) |
| Runtime repo fix (root `safe.directory`) | **Applied** — [Runtime repos verified](#runtime-repos-repaired--verified) |
| Manual Trigger retry + Telegram | **PASS** — [Manual n8n workflow + Telegram PASS](#manual-n8n-workflow--telegram-pass) |
| Automatic GIS handoff (multirepo `02`) | **PASS** — [Automatic GIS handoff](#automatic-gis-handoff-from-multirepo-watcher-pass) |
| 02F safe text + file handoff | **PASS** — [02F section](#02f-safe-text--telegram-document-handoff-pass) |
| n8n CONTROL PLANE cleanup (PM-07) | **PASS** — [POST_MVP_BACKLOG.md](POST_MVP_BACKLOG.md) |
| MVP criterion 2 closure | **PASS** (manual + automatic GIS + safe text/file handoff evidenced) |

Criterion 2 closure recorded from real n8n manual workflow + Telegram on phone.

---

## Runtime gates (separate, one at a time)

Follow [RUNTIME_GATES.md](RUNTIME_GATES.md). Suggested order for criterion 2 only:

1. ~~Confirm `handoff-generate.mjs` runs locally~~ — **PASS** (2026-05-20 local CLI; [Local CLI dry-run PASS](#local-cli-dry-run-pass)).
2. ~~Confirm generator runs inside n8n container~~ — **PASS** (2026-05-20 container CLI; [n8n container CLI dry-run PASS](#n8n-container-cli-dry-run-pass)).
3. ~~Execute Command config fix~~ — **Applied** 2026-05-20 ([Execute Command enabled](#execute-command-enabled-via-nodes_exclude-config)).
4. ~~UI check + Manual Trigger + Telegram~~ — **PASS** (2026-05-20; [Manual n8n workflow + Telegram PASS](#manual-n8n-workflow--telegram-pass)).
5. Re-export redacted JSON if runtime differs (optional).

Do **not** combine: import + execute + activate webhook + schedule in one session.

---

## What NOT to do now

- Open n8n UI for implementation (unless user starts explicit runtime gate)
- Execute `handoff-generate.mjs` from this docs task
- Store token, chat_id, webhook URL, or webhook secret in repo
- Configure GitHub webhook to localhost
- Enable v5 or production webhook for handoff
- Modify other `workflows/exports/*.json` in this task
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
| dev-method script contract | Local + container CLI PASS; n8n manual workflow + Telegram PASS (2026-05-20) |

Criterion 3 (three full cycles) builds on criterion 2 but is a **separate** closure item.
