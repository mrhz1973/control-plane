# LAST CURSOR REPORT

**BLOCK-ID:** `V4_CLINE_EXTENSION_UNINSTALL_AFTER_OPENCODE_MIGRATION_V1` (GitHub issue #36)
**Classification:** `PASS — CLINE_EXTENSION_STATUS=ALREADY_ABSENT; OPENCODE AND CODEX PRESERVED; NO MANUAL DELETION; RUNTIME/N8N UNTOUCHED`
**Timestamp (local):** 2026-09-05 ~15:0x
**Base HEAD:** `bcf62faed82716df39e8df7cf775ae2cc59552b6` (preverified = origin/main; local was 1 behind → ff-only pull applied)
**CLOSURE:** STANDARD_RUNTIME_BUNDLE

## Outcome

Cline extension census and bounded uninstall pass completed. Result is **ALREADY_ABSENT**:

- **Cursor**: `cursor --list-extensions` = 4 extensions (`anthropic.claude-code@2.1.261`,
  `anysphere.remote-ssh@1.1.14`, `anysphere.remote-wsl@1.0.13`, `openai.chatgpt@26.721.30844`)
  — no Cline; `extensions.json` registry has no Cline entry; the on-disk orphan folder
  `saoudrizwan.claude-dev-4.1.17-universal` (exact identifier confirmed from its own
  `package.json`: `saoudrizwan.claude-dev @ 4.1.17`, displayName Cline) is already marked
  `true` in Cursor's own `.obsolete` → retired by Cursor, pending internal GC, not installed.
- **VS Code**: `code --list-extensions` = `ritwickdey.liveserver@5.7.10` only — no Cline.
- Negative proof via supported CLI: `cursor --uninstall-extension saoudrizwan.claude-dev`
  → "Extension 'saoudrizwan.claude-dev' is not installed." (no mutation).
- No identifier guessing; single Cline-like package across surfaces → no ambiguity, no STOP.
- No manual folder deletion (explicit OUT OF SCOPE); `.obsolete` byte-identical; no
  settings.json edits; nothing reinstalled.

## Preservation (verified)

- **OpenCode available (non-generative)**: `opencode --version` → `1.18.25`, exit 0; zero
  generation calls.
- **Codex preserved**: `openai.chatgpt@26.721.30844` still installed (CLI + registry +
  on-disk package intact); auth untouched.
- **Other extensions**: claude-code 2.1.261, remote-ssh 1.1.14, remote-wsl 1.0.13,
  liveserver 5.7.10 — before/after identical; nothing else uninstalled.
- **Qwen runtime untouched (read-only)**: local router `GET /v1/models` → same 10 profiles
  incl. `qwen38-opus-q3-opencode-24k/64k`; no reload, no generation; `qwen-models.ini`,
  GGUF, configs untouched.
- **n8n wf90 / dispatcher 18793 / Tailscale / WF40/WF61/D-0025 / production**: zero changes.
- **Historical provenance**: no `reports/**` modifications.

## Prior task recap (issue #33, superseded details)

DEV profile nomenclature migrated CLINE→OPENCODE (`qwen38-opus-q3-opencode-24k/64k`), runtime
parity verified, smokes PASS, census `CLINE_UNINSTALL_ELIGIBLE=YES` with uninstall deferred to
this task. Full detail:
`reports/architecture/v4_qwen_dev_profiles_opencode_nomenclature_migration_v1.md`.
Full detail of this pass:
`reports/architecture/v4_cline_extension_uninstall_after_opencode_migration_v1.md`.

EXECUTOR_END_HEAD = the `cursor-pass:` commit carrying this report.
