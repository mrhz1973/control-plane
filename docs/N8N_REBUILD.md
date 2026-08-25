# n8n recovery runbook (current method)

**Role:** CURRENT RECOVERY METHOD — durable rebuild/recovery procedure.
**Runtime authority:** **NONE**. This file is not LIVE STATE.
**Activation authority:** **NONE**. Import ≠ activate.

When current workflow IDs, publication state, or authorization flags are needed, read:

1. `docs/runtime/CURRENT_FRONTIER.md`
2. `workflows/README.md`
3. the specific asset under `workflows/**`

Do not reconstruct “current runtime” from this runbook or from May/MVP history.

Historical recovery drill / prior MVP procedure: recoverable through Git history; pre-cleanup baseline `777504f7c46e5e724b6ad5f8586a98d43bab7ce8`.

---

## 1. Purpose

Recover or rebuild the control-plane n8n automation stack when the VPS, n8n instance, or workflow set is lost or must be recreated from Git — without treating historical docs as live inventory.

## 2. Source precedence

```text
CURRENT_FRONTIER
  > workflows/README.md + workflows/** assets
  > PROJECT_VISION hard policy / gates
  > this recovery method
  > historical docs (evidence only)
```

Legacy status/MVP/export chronologies are not authority for what is active now.

## 3. Prerequisites (outside Git)

Confirm before any import/activation:

- reachable n8n host (and Tailscale/private path if required);
- n8n admin access;
- credentials/secrets available **outside** the repo (Telegram, GitHub, classifier, SSH, etc.);
- operator available for UI steps and smoke checks;
- Decision Packet / frontier gate if the task includes activation, schedule, publish, or destructive change.

## 4. Install / recover n8n

- Reinstall or restore n8n per the host’s current ops practice.
- Prefer restoring **persistent storage / volume** when available over blank rebuild.
- Do **not** wipe volumes or mass-delete workflows without an explicit destructive gate.

## 5. Persistent storage

- Preserve n8n data directory / database / volume across reinstalls when possible.
- After restore, verify instance boots and credentials store is intact before importing duplicates.

## 6. Credentials and secrets

- **No live tokens/secrets in Git as authority.** Configure credentials in n8n UI (or approved secret store).
- Compensating control for the non-confidential repo posture: `docs/ROTATION_CHECKLIST.md`.
- Relink credential bindings after import; do not invent missing secret values from docs.

## 7. Choose assets to import

1. Read LIVE STATE in `CURRENT_FRONTIER.md` (what must exist / stay inactive / must not activate).
2. Read `workflows/README.md` for export/import policy and asset categories.
3. Select the concrete file under `workflows/**` (template, proposed, or snapshot) named by the authorizing task.
4. If multiple exports exist for one workflow family, prefer the asset explicitly named by frontier/task; otherwise stop and ask — do not guess from chronology.

## 8. Import (starts inactive)

- Import the chosen JSON into n8n.
- Keep the workflow **inactive / unpublished** unless a separate authorization says otherwise.
- On n8n 2.x: if Execute Command nodes are required, ensure host config allows them (`NODES_EXCLUDE` must not disable Execute Command). Diagnose host config before treating import failure as a workflow defect.
- Relink credentials, chat/allowlist config, and environment-specific parameters in UI only.

## 9. Manual smoke (pre-activation)

Still without permanent activation unless authorized:

- open workflow, confirm nodes/credentials resolve;
- run a **bounded** manual test if the gate allows Execute;
- verify dedupe / decision-store / correlation behavior when the workflow uses those stores;
- record evidence in the place the task specifies (session/report) — not by rewriting this runbook into LIVE STATE.

## 10. Activation = separate gate

Publish, Schedule enable, trigger enable, or production cut-over requires its **own** authorized gate (see `PROJECT_VISION` §7.0 and current frontier).
Recovery import success does **not** imply activation.

## 11. Generic recovery scenarios

| Scenario | First move |
|---|---|
| n8n lost, volume intact | restore volume → verify credentials → compare to frontier |
| n8n + volume lost | reinstall n8n → recreate credentials → import inactive assets from `workflows/**` |
| single workflow corrupted | re-import that asset inactive → relink → smoke → activation gate |
| unsure which asset is current | stop; use frontier + task pointer; do not pick by date alone |

## 12. Stop conditions

Stop and escalate when:

- required asset cannot be identified from frontier/task;
- credentials missing or would need invention;
- task implies activation/schedule/delete without gate;
- Execute Command blocked by host policy and cannot be fixed under current authorization;
- live sources conflict (frontier vs authorized packet).

## 13. Verification checklist

- [ ] Frontier read; no unauthorized activation planned
- [ ] Correct `workflows/**` asset identified
- [ ] Import completed **inactive**
- [ ] Credentials/config relinked in UI
- [ ] n8n 2.x Execute Command prerequisite checked if needed
- [ ] Bounded smoke done only if Execute was authorized
- [ ] Activation/schedule left for a separate gate
- [ ] No volume wipe / mass delete performed
- [ ] Evidence recorded where the task requires; this file unchanged as LIVE STATE
