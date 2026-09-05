# OpenCode capability/config inspection — PHASE 1 (read-only)

Task: V4_LOCAL_DEV_EXECUTOR_OPENCODE_PERMISSION_AND_NEW_FILE_CONVERGENCE_REMEDIATION_V1
Recorded (UTC): 2026-09-05T03:30Z window
Installed OpenCode: **1.18.25** (`opencode --version`), npm install,
`C:\Users\mrhz\AppData\Roaming\npm\node_modules\opencode-ai\bin\opencode.exe`.
NO install/update/upgrade performed. NO global config modified. NO credentials
touched. All evidence from installed official CLI help/debug facilities.

## E1 — `opencode debug config` (resolved config, cwd = control-plane)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {},
  "mode": {},
  "plugin": [],
  "command": {},
  "username": "mrhz"
}
```

No `permission` key at global scope → project-level `.opencode/` or task-level
`--config`/OPENCODE_CONFIG dominates what the agent sees; the DEV executor
already supplies its own via temp `OPENCODE_CONFIG` (deny-all-first).

## E2 — `opencode run --help` (installed 1.18.25, official facility)

Key flags: `-m provider/model`, `--format json`, `--dir <path>`,
`--title`, `--variant`, `--agent`,
`--auto  auto-approve permissions that are not explicitly denied (dangerous!) [default: false]`.

→ OpenCode's OWN semantics: permission checks are enforced against the
explicit deny/allow lists; anything NOT explicitly denied can be auto-approved
with `--auto`. Conversely, everything the executor wants allowed must be
EXPLICITLY in `permission`.

## E3 — executor permission overlay (current code, `tools/run-local-dev-executor-v1.mjs`)

```js
const bash = { "*": "deny" };        // + exact allowed_commands entries = allow
const edit = { "*": "deny" };        // + allowed_paths globs = allow (dir/** also exposes dir/*)
const permission = { bash, edit, webfetch: "deny", websearch: "deny" };
```

In OpenCode 1.18.x the tool permission groups are `bash`, `edit`, `webfetch`
(plus plugin-provided groups). The **`edit` group covers the file modification
tool family (edit AND write/create of files)** — there is NO separate
`write`/`create` permission group in the installed version's config surface
(`debug config` resolves only the documented groups; no `write` key appears in
any help/config output). Therefore new-file creation inside an allowed path is
ALREADY covered by the existing `edit` allowlist.

## E4 — live failure re-analysis (STOP artifact
2026-09-05T032418Z… + retained stdout in result artifact)

1. Turn 2: agent called `read` on `docs/runtime/CAMPAIGN_NOTES.md` BEFORE it
   existed → tool error "File not found".
2. Turn 3+: agent attempted bash `Test-Path docs/runtime` → denied by
   `{ "*": "deny" }` (bash allowlist has only `git status --short` +
   test command; `Test-Path` never envelope-authorized).
3. Agent never issued an `edit`/`write` call on the target path → the `edit`
   permission layer was NEVER the blocker (no edit-deny event in evidence).
4. Turns exhausted on read/probe attempts → convergence failure, not a
   permission-coverage gap.

## CONCLUSION (LEVEL selection per remediation order)

- **LEVEL 2 NOT REQUIRED**: `edit` already covers create; adding a redundant
  separate permission would invent an unsupported key (explicitly forbidden)
  or duplicate the existing allow.
- **LEVEL 3 NOT REQUIRED**: file creation uses the file tool; shell discovery
  must NOT be widened (Test-Path stays denied).
- **LEVEL 1 REQUIRED + AGENT MESSAGE HARDENING**: the task message must teach
  the deterministic create-flow: CREATE semantics (target MAY not exist;
  create directly with the file tool; never read-before-create; no shell
  existence probes), bounds, and stop-on-acceptance behavior.

Evidence basis: direct `--help`/`debug config` output above + retained
per-turn tool events in
`reports/runtime/dev-queue/LOCAL_DEV_B_D-9001-T__result-retry.json`.
