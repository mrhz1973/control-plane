# V4 Hermes native Codex browser CDP ephemeral exposure V6

**TASK_REF:** `V4_HERMES_NATIVE_CODEX_BROWSER_CDP_EPHEMERAL_EXPOSURE_V6`
**Classification:** `QUALIFIED_WITH_EPHEMERAL_NATIVE_EXPOSURE`
**Date (UTC):** 2026-09-10
**BASE_HEAD:** `9d163b5b52aeda0b1288f7d74f6f920f31efe86a`

## Scope and hard-wall result

The qualification was local-only. No VPS, n8n, production dispatch, GLM,
OpenAI API/BYOK, credential copy, browser snapshot, browser console, or
ChatGPT Web message send was performed. Chrome CDP remained loopback-only at
`127.0.0.1:9222`.

Hermes Agent was `v0.21.0`. The installed native transport had
`browser_cdp` in the Hermes model registry but not in `EXPOSED_TOOLS`.
One ephemeral entry was added to that tuple and no implementation was
changed.

## Evidence

```text
ORIGINAL_FILE_SHA256=F643189A1F4BA4CDC159CC9CB2F8421E963F3C6D0F9B175C18E4790AD6F0DA15
PATCHED_FILE_SHA256=FEB2235AA769652F4F6E2B751DE6B9730A9ECA7D4778C3F0DA5393256D0C0F74
RESTORED_FILE_SHA256=F643189A1F4BA4CDC159CC9CB2F8421E963F3C6D0F9B175C18E4790AD6F0DA15
HERMES_INSTALL_RESTORED=YES
BROWSER_CDP_EXPOSED_TO_CODEX=YES
FRESH_CHAT_VALID=PASS
CODEX_BROWSER_CDP_CALL_RECEIVED=YES
CODEX_BROWSER_CDP_RESULT_RETURNED=YES
CHATGPT_TARGET_FOUND=YES
COMPOSER_FOUND=YES
EXACT_PREFILL=PASS
EXACT_PREFILL_CHAR_COUNT=44
EXACT_PREFILL_SHA256=c49beb7220cf26f787fb74bbc718ab0c0bb5aec28f11051186153675d2ca49b4
CLEAR=PASS
LONG_PREFILL=PASS
LONG_CHAR_COUNT=900
LONG_SHA256_MATCH=YES
LONG_SHA256=3ee8395b0f4ab0e0cef59fe563c36a187df9f13ae1d8b92fd67da9f4dde40cf6
COMPOSER_FINAL_EMPTY=YES
USER_TURNS=0
ASSISTANT_TURNS=0
REQUESTS_SENT=0
HERMES_CODEX_AUTH=PASS:openai-codex_logged_in
CODEX_SUBSCRIPTION_AUTH=PASS:CHATGPT_MODE
OPENAI_API_BYOK_USED=NO
GLM_USED=NO
BROWSER_SNAPSHOT_USED=NO
BROWSER_CONSOLE_USED=NO
PRODUCTION_EXPOSURE=NOT_AUTHORIZED
VPS_EXPOSURE=NOT_IMPLEMENTED
```

The Codex app-server controller invoked `hermes-tools.browser_cdp` for
`Target.getTargets`, then for bounded `Runtime.evaluate` composer metadata,
`Input.insertText`, and bounded clear operations. The returned target set
contained the authenticated ChatGPT page. Independent loopback CDP checks
confirmed the fresh-chat invariant, exact prefill/hash, long prefill/hash,
and final empty composer. No Enter or Send operation was issued.

The temporary Hermes app-server was stopped, the Hermes file was restored
from a backup outside the repository, the restored hash matched the original,
and the backup was deleted. The existing Cursor Codex app-server process was
not modified.

## Tests

`node tests/registry-v2/run.mjs` — **76/76 PASS**.

`git diff --check` — **PASS**.

## Interpretation and next gate

This bounded result confirms that the native `browser_cdp` capability works
through the Codex app-server → Hermes MCP transport when exposed ephemerally.
It does not authorize a permanent Hermes patch, production exposure, VPS
use, or Phase D PASS. The next architecture task is governed/reproducible
Hermes browser CDP exposure and the separately gated VPS 08/12 qualification.
