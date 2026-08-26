# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `ZAI-VPS-EGRESS-ASYMMETRY-HTTP500-BOTH-MODEL-VARIANTS` |
| **STATO BLOCCO** | `CREDENTIAL+MODEL_DISCRIMINATORS_ELIMINATED / EGRESS_OR_NETWORK_PATH_SUSPECT / DIAGNOSTIC_UNSELECTED` |
| **GATE CORRENTE** | `ZAI_GLM51_SINGLE_LIVE_DISCRIMINATOR_CONSUMED_HTTP500` — next: real human gate for egress-path diagnostic or provider support escalation |
| **NEXT** | real human gate: (a) authorize bounded unauthenticated egress-path diagnostic from VPS vs Windows (TLS/routing comparison, no auth headers), or (b) escalate to Z.AI support with sanitized cross-host asymmetry evidence. No further authenticated provider requests without new authorization. |
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
| **LIVE REQUEST LEDGER** | repair+verify `0`; authorized live tests: `glm-5.3` Global `1` (HTTP 500) + `glm-5.1` Global `1` (HTTP 500) — total this task `2`, each exactly as authorized |
| **CROSS-HOST ASYMMETRY EVIDENCE** | Windows PC + same key family + same endpoint + `glm-5.1` = SUCCESS (local OpenClaw, 2026-08-26); VPS IONOS + same endpoint + both `glm-5.1`/`glm-5.3` = HTTP 500 |
| **OPENCLAW UPSTREAM GLM 5.3 SUPPORT** | merged PR #123523 / issue #123522 confirm first-class GLM 5.3 Coding Plan support |
| **OPERATOR AUTHORIZATION** | 2026-08-26 · issue #8 comment `5429724710` (diagnostic matrix, consumed) · 2026-08-26 in-band gate: credential repair `zai-coding-global` authorized and completed |
| **ROOT CAUSE CLASSIFICATION** | `VPS_EGRESS_OR_NETWORK_PATH_SUSPECT` (updated 2026-08-26): credential format eliminated as sole cause (documented-format key → 500); model variant eliminated as sole cause (`glm-5.1` and `glm-5.3` both 500 on VPS); cross-host asymmetry observed (same endpoint + same key family succeeds from Windows with `glm-5.1`, fails from VPS IONOS with both models). Remaining suspects: VPS egress IP reputation/geography, hoster network-path interference. Historical note: the prior malformed `zai:manual` value remains a real defect (now bypassed) but no longer explains the persistent 500. |
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
- Zero additional provider/model requests beyond the two individually authorized live tests (`glm-5.3` then `glm-5.1`, both Global Coding Plan via `zai:default`, both HTTP 500, zero retry/fallback each). `NO_MORE_MANUAL_ONE_OFF_PROBES` remains in force: no further requests without a new explicit authorization selecting a named discriminator.
- Live outcome interpretation boundary: with credential format and model variant both eliminated as sole causes, and the same endpoint/key family succeeding from Windows, the remaining suspects are VPS egress IP reputation/geography and hoster network-path interference. No network test was performed or authorized; no conclusion beyond this boundary.
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
