# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `ZAI-GLOBAL-HTTP500-PERSISTS-WITH-VALID-FORMAT-CREDENTIAL` |
| **STATO BLOCCO** | `REPAIR_COMPLETE + ONE_LIVE_REQUEST_EXECUTED_HTTP500 / NEXT_DISCRIMINATOR_UNSELECTED` |
| **GATE CORRENTE** | `ZAI_GLM53_SINGLE_LIVE_VERIFICATION_CONSUMED_HTTP500` — next: real human gate to select next bounded discriminator or escalate to provider support |
| **NEXT** | real human gate: choose the next bounded discriminator (e.g. `glm-5.1` vs `glm-5.3` same host/key, or same model different egress) or escalate to Z.AI support with sanitized evidence. No further provider/model requests without new authorization. |
| **VPS OPENCLAW** | `2026.8.1-beta.3` (5831b80) · gateway inactive (unchanged) · node runtime `/opt/openclaw-node/current` v24.19.0 |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` (active generation, unchanged) |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **CURRENT ZAI PROFILE** | provider `zai` · profile `zai:default` · auth `api_key` · credential in documented `{32-hex}.{16-alnum}` format (metadata-verified, value withheld) |
| **LEGACY ZAI PROFILE** | `zai:manual` still present, nonconforming (len 5, no dot), not reused; removal not authorized by this gate |
| **AUTH PROFILE ORDER** | none (automatic; selection prefers `zai:default`) |
| **CURRENT ZAI BASE URL** | `https://api.z.ai/api/coding/paas/v4` (Global Coding Plan — repaired from CN) |
| **CURRENT API STYLE / ADAPTER** | `openai-completions` |
| **ZAI MODEL CATALOG** | `glm-5.3`, `glm-5.2`, `glm-5-turbo`, `glm-5v-turbo`, `glm-5.1` (+ catalog defaults visible in `models list`) |
| **PRIMARY MODEL** | `zai/glm-5.3` · alias `GLM` · allowed models: `openai/gpt-5.6-sol`, `zai/glm-5.3` |
| **CREDENTIAL REPAIR** | COMPLETE `2026-08-26` · official path `openclaw onboard --auth-choice zai-coding-global` with skip-daemon/channels/skills/hooks/search/bootstrap/ui/health · key entered by operator in interactive terminal only · local validation PASS |
| **REPAIR EVIDENCE** | `docs/runtime/LAST_CURSOR_REPORT.md` · provider/model requests during repair+verification: `0` |
| **REGIONAL GLM 5.3 SMOKE** | historical CN: BLOCKED (commit `57534fc5f9787d94a377a6fe901c7123495bd0f5`); current Global repaired surface: ONE live request `2026-08-26T21:43:29Z` → HTTP `500` (412 ms, zero retry/fallback) with documented-format credential — uniform 500 persists |
| **LIVE REQUEST LEDGER** | repair+verify `0`; post-repair authorized live test `1` (`zai/glm-5.3`, Global Coding Plan, `zai:default`) — total this task `1`, exactly as authorized |
| **OPENCLAW UPSTREAM GLM 5.3 SUPPORT** | merged PR #123523 / issue #123522 confirm first-class GLM 5.3 Coding Plan support |
| **OPERATOR AUTHORIZATION** | 2026-08-26 · issue #8 comment `5429724710` (diagnostic matrix, consumed) · 2026-08-26 in-band gate: credential repair `zai-coding-global` authorized and completed |
| **ROOT CAUSE CLASSIFICATION** | `STORED_ZAI_MANUAL_CREDENTIAL_NOT_IN_DOCUMENTED_ZAI_KEY_FORMAT` (confirmed) — repaired via new `zai:default` profile with documented-format key; prior four-surface HTTP 500 matrix remains explained by the nonconforming stored bearer value |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Credential repair completed 2026-08-26 via the official `zai-coding-global` onboard path: new profile `zai:default` with documented-format key, baseUrl `https://api.z.ai/api/coding/paas/v4`, primary model `zai/glm-5.3`, alias `GLM`.
- The malformed legacy `zai:manual` profile was preserved (not deleted): credential deletion requires a separate gate. It must not be reused.
- Secret handling: key entered by the operator in an interactive terminal only; never printed, logged, hashed, measured, persisted in GitHub or exposed in-band.
- Zero additional provider/model requests beyond the single authorized live test (`1` request, `zai/glm-5.3`, Global Coding Plan, via `zai:default`, HTTP 500, zero retry/fallback). `NO_MORE_MANUAL_ONE_OFF_PROBES` remains in force: no further requests without a new explicit authorization selecting a named discriminator.
- Live outcome interpretation boundary: the HTTP 500 with a documented-format credential on the repaired Global surface weakens "malformed stored credential" as the sole cause. Discriminators not yet tested: model variant (`glm-5.1` vs `glm-5.3`), host egress geography, key binding/entitlement. No conclusion beyond this boundary.
- No gateway/service activation, daemon install, n8n/Docker/Tailscale/firewall/reverse-proxy mutation, channel/skill/hook installation or any production/runtime wiring was performed. Gateway remains inactive with port `18789` free.
- Cursor BYOK (dashboard key `Cursor`) and OpenClaw Z.AI auth (dashboard key `Control Plane`) remain logically separate integrations.
- Planner-generated Cursor Execution Packets remain governed by `docs/contracts/execution-packet-v1.md` and `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`.
- Issue #8 remains an evidence backlog; `CURRENT_FRONTIER.md` owns live state. Issue #19 remains DEFERRED for production quota-aware policy.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Operator authorization audit: issue **#8**, comment `5429724710`
- Historical autodetect matrix packet: `docs/runtime/ISSUE_8_ZAI_AUTODETECTION_PACKET.yaml`
- Future research: issue **#18** (`DEFERRED`)
- Future production quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor packet contract: `docs/contracts/execution-packet-v1.md`
- Cursor execution contract: `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
