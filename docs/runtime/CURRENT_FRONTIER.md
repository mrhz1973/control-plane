# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `ZAI-LIVE-SMOKE-GLOBAL-GLM53-HTTP500` |
| **STATO BLOCCO** | `BLOCKED / REPAIRED_CREDENTIAL_STILL_HTTP500_ON_GLOBAL_CODING_PLAN` |
| **GATE CORRENTE** | `ZAI_PROVIDER_ACCOUNT_VERIFICATION_OR_PROFILE_CLEANUP_REQUIRED` |
| **NEXT** | real human gate: provider/account support verification with sanitized evidence, and/or authorized removal of residual malformed `zai:manual` profile before any further provider/model request. Do not issue another provider/model request without a new explicit authorization. |
| **VPS OPENCLAW** | `2026.8.1-beta.3` (5831b80) · gateway inactive (unchanged) · node runtime `/opt/openclaw-node/current` v24.19.0 |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` (active generation, unchanged) |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **CURRENT ZAI PROFILE** | provider `zai` · profile `zai:default` · auth `api_key` · credential in documented `{32-hex}.{16-alnum}` format (metadata-verified, value withheld) |
| **LEGACY ZAI PROFILE** | `zai:manual` still present, nonconforming (len 5, no dot), not reused; removal not yet authorized |
| **CURRENT ZAI BASE URL** | `https://api.z.ai/api/coding/paas/v4` (Global Coding Plan) |
| **PRIMARY MODEL** | `zai/glm-5.3` · alias `GLM` |
| **CREDENTIAL REPAIR** | COMPLETE `2026-08-26` · local validation PASS |
| **LIVE GLM 5.3 SMOKE (GLOBAL)** | BLOCKED · exactly one request · profile intent `zai:default` · model `zai/glm-5.3` · URL `https://api.z.ai/api/coding/paas/v4/chat/completions` · HTTP 500 · elapsed ~193ms · zero retry/fallback · no mutation |
| **LIVE SMOKE EVIDENCE** | `docs/runtime/LAST_CURSOR_REPORT.md` task `D-0010-Z_ZAI_GLM53_LIVE_SMOKE_GLOBAL` |
| **REGIONAL GLM 5.3 SMOKE (CN, historical)** | BLOCKED · CN endpoint · commit `57534fc5f9787d94a377a6fe901c7123495bd0f5` |
| **PRIMARY AUTODETECT MATRIX (historical)** | four surfaces HTTP 500 with malformed `zai:manual` · consumed · not repeated |
| **ROOT CAUSE CLASSIFICATION** | `STORED_ZAI_MANUAL_CREDENTIAL_NOT_IN_DOCUMENTED_ZAI_KEY_FORMAT` (confirmed, repaired) **plus** `PROVIDER_OR_ACCOUNT_SPECIFIC_UPSTREAM_FAILURE_ON_GLOBAL_CODING_PLAN_WITH_REPAIRED_CREDENTIAL` (new, live-evidenced) |
| **OPERATOR AUTHORIZATION** | credential repair gate consumed · live smoke gate consumed (exactly one request) |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Credential repair (2026-08-26) remains valid: `zai:default` with documented-format key, Global Coding Plan baseUrl, primary model `zai/glm-5.3`.
- Live smoke (2026-08-26) consumed exactly once: HTTP 500 on `https://api.z.ai/api/coding/paas/v4/chat/completions` with `zai/glm-5.3`, zero retry/fallback, gateway still inactive.
- Malformed-credential-alone is no longer sufficient to explain Global surface failure; provider/account/key-entitlement or upstream routing verification is now the highest-value discriminator.
- Residual `zai:manual` profile remains present; removal requires a separate authorized gate.
- `NO_MORE_MANUAL_ONE_OFF_PROBES`: no further Z.AI/provider/model call authorized after the consumed live smoke.
- Never print/persist API key, token, Authorization values, secret fragments, secret length or secret hashes.
- No gateway/service activation, n8n/Docker/Tailscale/firewall/reverse-proxy mutation, channel/skill/hook installation or production/runtime wiring.
- Cursor BYOK (`Cursor` dashboard key) and OpenClaw Z.AI auth (`Control Plane` dashboard key) remain separate integrations.
- Issue #8 remains evidence backlog; Issue #19 remains DEFERRED for production quota-aware policy.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
- Historical autodetect matrix: `docs/runtime/ISSUE_8_ZAI_AUTODETECTION_PACKET.yaml`
- Cursor execution contract: `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
