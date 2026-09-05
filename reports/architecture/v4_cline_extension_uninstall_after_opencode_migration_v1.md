# V4 Cline Extension Uninstall After OpenCode Migration V1

- **BLOCK-ID**: `V4_CLINE_EXTENSION_UNINSTALL_AFTER_OPENCODE_MIGRATION_V1`
- **GitHub issue**: #36
- **Date**: 2026-09-05
- **Base HEAD**: `bcf62faed82716df39e8df7cf775ae2cc59552b6` (verified = origin/main, branch main, tracked clean; local was 1 commit behind → `git pull --ff-only origin main` applied per canonical preflight)
- **Result**: **PASS**
- **CLINE_EXTENSION_STATUS**: **ALREADY_ABSENT** (confirmed via supported CLI; no manual deletion performed)

## Objective

Remove the Cline IDE extension from workstation IDE surfaces where it is actually installed,
without touching OpenCode, Codex, Qwen, runtime, project configuration, or historical data.
Parent context: #33 migration PASS (`V4_QWEN_DEV_PROFILE_OPENCODE_NOMENCLATURE_MIGRATION_V1`),
persisted census `CLINE_UNINSTALL_ELIGIBLE=YES`.

## Surfaces censited (pre-uninstall, read-only)

Method: supported CLI (`--list-extensions --show-versions`) as primary source, cross-checked
against each surface's `extensions.json` registry, `.obsolete` marker file, and on-disk
extension folders. No settings or data files modified.

### Cursor (`cursor` CLI present; `%USERPROFILE%\.cursor\extensions`)

CLI installed list (before):

- `anthropic.claude-code@2.1.261`
- `anysphere.remote-ssh@1.1.14`
- `anysphere.remote-wsl@1.0.13`
- `openai.chatgpt@26.721.30844`

Registry (`extensions.json`): the same 4 identifiers; **no Cline entry**.

On-disk folders: 6, comprising the 4 active packages plus 2 obsolete-version folders
(`anthropic.claude-code-2.1.146/2.1.260`, both listed in `.obsolete`) and one orphan folder
`saoudrizwan.claude-dev-4.1.17-universal` which is **not registered** in `extensions.json`
and **is already marked obsolete by Cursor itself** in `.obsolete`:

```json
{"anthropic.claude-code-2.1.146-win32-x64":true,"anthropic.claude-code-2.1.148-win32-x64":true,"anthropic.claude-code-2.1.260-win32-x64":true,"saoudrizwan.claude-dev-4.1.17-universal":true}
```

The orphan folder's `package.json` confirms the exact real identifier
`saoudrizwan.claude-dev @ 4.1.17` (displayName `Cline`) — no identifier guessing, and no
ambiguity (single Cline-like package across all surfaces; no other `saoudrizwan.*` or
Cline-fork entries anywhere).

### VS Code (`code` CLI present; `%USERPROFILE%\.vscode`)

CLI installed list (before and after): `ritwickdey.liveserver@5.7.10` only. No Cline, no
Cline-like entries; registry consistent.

## Cline status determination

- Not present in `cursor --list-extensions` → not installed on the active Cursor surface.
- Not present in Cursor `extensions.json` registry → not loadable/registered.
- Orphan folder already flagged `true` in Cursor's own `.obsolete` → Cursor already retired
  the package (prior uninstall/mark); residual bytes are pending Cursor's internal garbage
  collection, not an installation.
- Manual folder deletion explicitly OUT OF SCOPE → residual folder left untouched.
- Bounded negative-proof via supported CLI:
  `cursor --uninstall-extension saoudrizwan.claude-dev` →
  `Extension 'saoudrizwan.claude-dev' is not installed.` (exit 1, expected for an absent
  target; no mutation, no other extension involved).

Classification: **ALREADY_ABSENT**. Per scope: nothing reinstalled; evidence/closure
completed as PASS.

## Before / after

| Surface | Before | After |
|---|---|---|
| Cursor CLI installed | 4 extensions (no Cline) | identical 4 (no Cline) |
| Cursor registry | 4 entries (no Cline) | unchanged |
| Cursor `.obsolete` | 4 entries incl. `saoudrizwan.claude-dev-4.1.17-universal` | byte-identical (no manual deletion) |
| VS Code CLI installed | `ritwickdey.liveserver@5.7.10` | identical |

Method used: supported CLI only (`cursor --list-extensions`, `cursor --uninstall-extension`
as negative proof, `code --list-extensions`); read-only registry/`.obsolete`/folder census.
No `Remove-Item`, no filesystem deletion, no settings.json edits.

## Preservation checks (post-pass)

- **OpenCode available (non-generative)**: `opencode --version` → `1.18.25`, exit 0.
  No generation invoked.
- **Codex/OpenAI extension preserved**: `openai.chatgpt@26.721.30844` still in Cursor CLI
  list after; its on-disk package (`openai.chatgpt-26.721.30844-win32-x64`) intact.
  Auth state untouched (no files under user config modified).
- **All other extensions preserved**: `anthropic.claude-code@2.1.261`,
  `anysphere.remote-ssh@1.1.14`, `anysphere.remote-wsl@1.0.13`,
  `ritwickdey.liveserver@5.7.10` — before/after identical.
- **Qwen runtime untouched (read-only proof)**: `GET /v1/models` on the local router shows
  the same 10 profiles including `qwen38-opus-q3-opencode-24k` and
  `qwen38-opus-q3-opencode-64k`; no reload, no generation, no config writes.
- **n8n / dispatcher / Tailscale / WF40/WF61/D-0025 / production**: zero changes (no
  commands issued against any of them in this pass).
- **Historical provenance**: no `reports/**` file modified.

## Scope compliance

Uninstall via CLI ✓ (negative proof — target already absent) · no manual folder deletion ✓ ·
no settings edits ✓ · no Qwen/OpenCode/Codex changes ✓ · no runtime reload ✓ · no n8n
changes ✓ · census persisted without secrets ✓.

EXECUTOR_END_HEAD = the `cursor-pass:` commit carrying this report.
