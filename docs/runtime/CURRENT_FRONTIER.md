# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-ZAI-VPS-DIRECT-SMOKE-RETRY` |
| **STATO BLOCCO** | `AUTHORIZED / ONE_BOUNDED_MODEL_INVOCATION_PENDING` |
| **GATE CORRENTE** | `GLM_ZAI_VPS_DIRECT_SMOKE_RETRY_AUTHORIZED` |
| **NEXT** | execute exactly one new direct smoke invocation of exact `zai/glm-5.3` after successful Z.AI auth refresh; no automatic retry or fallback |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **GLM 5.3 REF** | `zai/glm-5.3` visible |
| **Z.AI AUTH REFRESH** | PASS · exit `0` · profile present · provider available · zero model invocations during refresh |
| **PREVIOUS GLM 5.3 SMOKE** | BLOCKED on provider HTTP 401 before refresh; exactly one invocation; no retry |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `1` before authorized retry · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_ZAI_VPS_CREDENTIAL_REFRESH = PASS`; evidence commit `2ceee3f76c08763a9f63d9145181e9b5d4aa64bb` |
| **PLANNER SMOKE** | Codex PASS · GLM retry authorized exactly once · Qwen 3.8 37B blocked missing model |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Z.AI auth refresh completato PASS; stato locale post-refresh coerente e nessuna model invocation durante il refresh.
- L'operatore ha autorizzato esattamente una nuova minimal direct smoke invocation dell'esatto `zai/glm-5.3` esclusivamente per verificare end-to-end la credenziale aggiornata.
- Nessun retry automatico o seconda invocation è autorizzato se il nuovo smoke fallisce o è inconcludente.
- Nessun fallback a GLM 5.2/5.1/5 o altri modelli, Codex/Qwen invocation, gateway/service activation, auth/config/core/plugin mutation, n8n/Docker/Tailscale mutation, firewall/reverse proxy, runtime wiring, billing o broader runtime activation è autorizzato.
- Dopo la singola invocation: postcheck read-only, persist `LAST_CURSOR_REPORT.md`, quindi STOP sul successivo gate reale.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
