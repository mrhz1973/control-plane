# V4 Hermes governed Codex CDP and VPS 08/12 qualification V7

**TASK_REF:** `V4_HERMES_CODEX_GOVERNED_CDP_AND_VPS_08_12_QUALIFICATION_V7`
**Classification:** `PASS — CODEX_HERMES_GOVERNED_CDP=QUALIFIED · VPS_CODEX_HERMES_GOVERNED_CDP=QUALIFIED_PREFILL_ONLY · VPS_CODEX_08_12_POLICY=SHADOW_PASS · PHASE_D=OPEN`
**Date (UTC):** 2026-09-10
**BASE_HEAD:** `3760158cf196aad9f4db564e04ddf4e60b7a79b4`

## Scope and hard-wall result

This was a bounded local and isolated NEW VPS qualification. The governed
adapter exposes only `control_plane_chatgpt_composer_cdp` with these fixed
operations:

```text
DISCOVER_CHATGPT_TARGET
GET_COMPOSER_STATE
PREFILL_SINGLE_LINE
CLEAR_COMPOSER
```

`RAW_BROWSER_CDP_EXPOSED=NO` and
`GUARDED_COMPOSER_TOOL_EXPOSED=YES`. No raw browser CDP, GLM, OpenAI
API/BYOK, ChatGPT Web send, candidate execution, production routing,
`/v1/tick`, n8n mutation, OLD VPS mutation, credential copying, or Phase D
PASS claim occurred.

The external Hermes v0.21.0 source was protected by the exact original hash
guard and local apply/verify/rollback was completed with byte-for-byte local
restoration. The NEW VPS qualification overlay is isolated at
`/home/hermes-test/.cache/control-plane-v7`; no production service was
changed.

## Evidence

```text
ORIGIN_MAIN=3760158cf196aad9f4db564e04ddf4e60b7a79b4
HERMES_VERSION=0.21.0
CODEX_VERSION=0.133.0
ORIGINAL_HERMES_SHA256=F643189A1F4BA4CDC159CC9CB2F8421E963F3C6D0F9B175C18E4790AD6F0DA15
PATCHED_HERMES_SHA256=3195783A6B495607952165AF48426AC3EE66F00DD4DAD98582FEAB6C4C5C8B6D
LOCAL_APPLY_VERIFY_ROLLBACK=PASS
VPS_GOVERNED_ADAPTER_APPLY=PASS
VPS_GOVERNED_ADAPTER_VERIFY=PASS
VPS_GOVERNED_ADAPTER_TARGET_SHA256=3195783A6B495607952165AF48426AC3EE66F00DD4DAD98582FEAB6C4C5C8B6D
VPS_CATALOG_STANDALONE_TOOLS_LIST=PASS:ONE_GOVERNED_TOOL_ONLY
VPS_RAW_BROWSER_TOOLS=ABSENT
VPS_CODEX_APP_SERVER_GOVERNED_TOOL_CALL=PASS
VPS_CODEX_SUBSCRIPTION_AUTH=PASS
VPS_HERMES_OPENAI_CODEX_AUTH=PASS
VPS_CHATGPT_WEB_AUTH=PASS
CDP_LOOPBACK_ONLY=YES:127.0.0.1:9222
FRESH_CHAT_INITIAL=PASS:USER_TURNS=0;ASSISTANT_TURNS=0;COMPOSER_EMPTY=YES
VPS_CODEX_TEXT=PASS
VPS_GOVERNED_DISCOVERY=PASS
VPS_COMPOSER_STATE=PASS
VPS_EXACT_PREFILL=PASS
VPS_EXACT_PREFILL_DOM_VERIFY=PASS
VPS_CLEAR_AFTER_EXACT=PASS
VPS_LONG_PREFILL_900=PASS
VPS_LONG_SHA256_MATCH=PASS
VPS_LONG_SHA256=0d3afbb695ddc858413331299a3e9d807be4215084ca1ab08be470c29e7acac5
VPS_CLEAR_FINAL=PASS
VPS_FINAL_USER_TURNS=0
VPS_FINAL_ASSISTANT_TURNS=0
VPS_FINAL_COMPOSER_EMPTY=YES
VPS_REQUESTS_SENT=0
VPS_CODEX_TEXT_VALUE=VPS_CODEX_HERMES_GOVERNED_OK
VPS_PRODUCTION_ROUTING=NO
VPS_CANDIDATE_EXECUTED=NO
VPS_GLM_USED=NO
VPS_OPENAI_API_BYOK_USED=NO
VPS_BROWSER_SEND=NO
VPS_N8N_MUTATION=NO
VPS_OLD_MUTATION=NO
```

The NEW VPS was `ionos-n8n-new` (`31.70.139.73`, tailnet identity
`100.99.54.93`, MagicDNS `ionos-n8n-new.tailc01234.ts.net`). The isolated
Codex CLI was used with the authenticated subscription and Hermes
`openai-codex` app-server runtime. The browser proof performed target
discovery, composer discovery, exact single-line prefill, independent DOM
verification, clear, a 900-character single-line SHA256 proof, and clear
again. No Enter, submit, or send operation was issued.

The Codex build's `mcpServerStatus/list` response did not enumerate tool
names. The authoritative standalone Hermes MCP `tools/list` response exposed
exactly the one governed tool, with raw/browser tools absent, and the
supported direct `mcpServer/tool/call` for that governed tool passed. No raw
CDP capability was exposed to the qualification controller.

## Europe/Rome shadow routing qualification

The deterministic selector tests passed for Europe/Rome at all required
boundaries, including CET and CEST:

```text
07:59  OUTSIDE_WINDOW      preserve existing governed policy
08:00  INSIDE_WINDOW       CODEX_SUBSCRIPTION
11:59  INSIDE_WINDOW       CODEX_SUBSCRIPTION
12:00  OUTSIDE_WINDOW      preserve existing governed policy
```

Inside `[08:00,12:00)`, `GLM_ELIGIBLE=NO`. Missing, unavailable,
unauthenticated, unqualified, or exhausted Codex subscription state is
`FAIL_CLOSED` with no silent GLM fallback. Outside the window, the existing
governed policy is preserved exactly. This is shadow qualification only;
`PRODUCTION_ROUTING_ENABLED=NO`.

## Tests

`node tests/hermes-governed-cdp-adapter-v1/run.mjs` — **FOCUSED_TESTS=PASS**.

`node tests/registry-v2/run.mjs` — **76/76 PASS**.

`git diff --check` — **PASS**.

No cookie, token, credential, session, or OAuth material is persisted in this
evidence. Issue #73 remains open, `ISSUE_73_PHASE_C=PASS`, and `PHASE_D=OPEN`.
