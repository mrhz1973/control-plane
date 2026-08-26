# Z.AI Support Escalation Draft — Issue #8 (SANITIZED)

> **Status:** `SUPPORT_ESCALATION_PACKET_PREPARED` — draft only; **NOT submitted** to Z.AI.
> **Prepared:** 2026-08-27 · **Active work:** GitHub issue `#8` · **Evidence source:** `docs/runtime/CURRENT_FRONTIER.md`, `docs/runtime/LAST_CURSOR_REPORT.md`
> **Sanitization:** No API keys, Authorization headers, secret-derived data, request bodies, or unnecessary billing identifiers are included in this document.

---

## Subject line (suggested)

```
Coding Plan Global API — HTTP 500 on authenticated chat/completions from datacenter VPS egress (217.160.71.145); same account/key family succeeds from residential IP
```

---

## 1. Account and product context (sanitized)

- Product: **GLM Coding Plan** (Global platform, not CN/BigModel endpoint).
- Plan tier: **GLM Coding Lite Monthly — Legacy Plan V2** (shown as **Valid** in account console).
- Coding Plan quota (5-hour / weekly): **0% used** at time of diagnosis (plan not exhausted).
- Supported tool: **OpenClaw** (documented as supported for Coding Plan Global).
- Integration: OpenClaw official provider path `zai-coding-global` with dashboard API key named **`Control Plane`** (separate from a distinct dashboard key named `Cursor` used for Cursor BYOK — same account, logically separate integrations).
- **No API key value, Authorization header, or credential-derived data is included in this ticket.**

---

## 2. Environment

### VPS (failing authenticated requests)

| Field | Value |
|---|---|
| Host | IONOS VPS (Ubuntu) |
| Hostname (observed) | `ubuntu.tailc01234.ts.net` |
| Public egress IP | **`217.160.71.145`** |
| OpenClaw core | `2026.8.1-beta.3` (5831b80) |
| Z.AI provider plugin | `@openclaw/zai-provider` **`2026.8.1-beta.3`** (active generation) |
| Node runtime | `/opt/openclaw-node/current` v24.19.0 |
| Gateway | inactive (diagnostic only; not relevant to API path) |

### Windows PC (control — authenticated success)

| Field | Value |
|---|---|
| Host | Residential Windows workstation |
| Public egress IP | **`95.249.154.241`** |
| OpenClaw | local install (evidence capture only) |

---

## 3. Endpoint and local configuration (verified PASS)

| Setting | Value |
|---|---|
| Auth surface | `zai-coding-global` (official OpenClaw Coding Plan Global path) |
| Base URL | **`https://api.z.ai/api/coding/paas/v4`** |
| API adapter | `openai-completions` |
| Auth profile (active) | `zai:default` · type `api_key` |
| Credential format check | **PASS** — stored credential matches documented `{32-hex-id}.{16-alnum-secret}` structure (metadata-only verification; value not disclosed) |
| Primary model (configured) | `zai/glm-5.3` |
| Model catalog (configured) | includes `glm-5.3`, `glm-5.2`, `glm-5.1`, `glm-5-turbo`, `glm-5v-turbo` |
| Local config validation | **PASS** (provider, baseUrl, profile, catalog, primary model — read-only CLI verification) |

**Note:** A legacy malformed profile (`zai:manual`, non-documented format) existed prior to repair and was bypassed; it is **not** used for current requests. Automatic profile selection prefers `zai:default`.

---

## 4. Authenticated request evidence (VPS — HTTP 500)

All requests: **single attempt each**, **zero retry**, **zero fallback**, via OpenClaw `infer model run` with `--thinking low`.

| # | Timestamp (UTC) | Source egress | Model | URL | HTTP status | Elapsed |
|---|---|---|---|---|---|---|
| 1 | `2026-08-26T21:43:29Z` | `217.160.71.145` | `glm-5.3` | `POST https://api.z.ai/api/coding/paas/v4/chat/completions` | **500** Internal service error | 412 ms |
| 2 | `2026-08-26T21:48:40Z` | `217.160.71.145` | `glm-5.1` | `POST https://api.z.ai/api/coding/paas/v4/chat/completions` | **500** Internal service error | 183 ms |

- Transport logs (sanitized): provider `zai`, API `openai-completions`, `content-type: application/json` on error response.
- **Model variant is not the differentiator:** both `glm-5.3` and `glm-5.1` fail from VPS with HTTP 500.

---

## 5. Cross-host authenticated evidence (Windows — SUCCESS)

| Timestamp (UTC) | Source egress | Model | Endpoint | Result |
|---|---|---|---|---|
| `2026-08-26` (local OpenClaw session) | `95.249.154.241` | `glm-5.1` | `POST https://api.z.ai/api/coding/paas/v4/chat/completions` | **SUCCESS** (text output returned) |

- Same **Coding Plan Global** base URL and same **API key family** (dashboard key `Control Plane` / same account) as VPS configuration.
- Demonstrates the account, plan, and key family can successfully consume the Coding Plan endpoint from a **residential** egress IP.

---

## 6. Unauthenticated network-path evidence (both hosts)

Diagnostic type: **read-only, unauthenticated** (no Authorization header, no API key, no chat/completions body). Performed `2026-08-26T22:01Z`.

| Check | VPS (`217.160.71.145`) | Windows (`95.249.154.241`) |
|---|---|---|
| DNS A for `api.z.ai` | `47.245.163.4`, `47.245.170.100` | **Same** |
| TCP 443 | reachable | reachable |
| TLS SNI | `api.z.ai` | `api.z.ai` |
| TLS certificate (VPS direct) | `CN=*.z.ai`, Sectigo CA, **verify PASS** | N/A (see caveat) |
| Unauthenticated GET `/` | HTTP 301, TLS OK, HTTP/2 | redirect handling error (non-blocking) |
| Unauthenticated HEAD `/api/coding/paas/v4` | **HTTP 401** (expected without auth) | **HTTP 401** (expected without auth) |

**Interpretation:** DNS, TCP, TLS, and unauthenticated HTTP reachability to the Coding Plan prefix are **functional from the VPS**. Transport/DNS/TLS do **not** appear blocked. Failure occurs only on **authenticated** `chat/completions` requests from the datacenter egress IP.

---

## 7. Caveats and boundaries

1. **Windows TLS comparison is not probative:** Windows path shows certificate issued by **ESET SSL Filter CA** (local SSL inspection). Direct TLS certificate comparison between Windows and VPS is therefore unreliable. Unauthenticated HTTP status comparison (401 on coding prefix from both hosts) remains valid.
2. **Hypothesis, not conclusion:** Current working hypothesis is **`APPLICATION_LAYER_IP_OR_RISK_CONTROL_SUSPECT`** — application-layer handling of authenticated requests may treat datacenter/VPS source IP differently from residential egress. We are **not** asserting root cause; requesting Z.AI backend verification.
3. **No further probes authorized** beyond the evidence above. This packet is prepared for support review only.
4. **Sensitive data omitted by design:** no API key, Authorization value, request/response bodies, account billing IDs, or payment identifiers.

---

## 8. Questions for Z.AI Support

1. Is source IP **`217.160.71.145`** (IONOS datacenter VPS egress) subject to **risk-control, anti-abuse, or access restrictions** for **Coding Plan Global** (`https://api.z.ai/api/coding/paas/v4`) authenticated requests?
2. Are there **geographic, ASN/datacenter, or IP-reputation policies** that could cause **HTTP 500** (rather than 401/403/429) on authenticated `chat/completions` from VPS/datacenter egress while the same account/key family succeeds from residential IP **`95.249.154.241`**?
3. Are there **account/key + source-IP binding** or allowlist rules that could explain authenticated HTTP 500 from datacenter egress only?
4. Can your backend team **locate and review request failures** matching this scenario using:
   - approximate timestamps in Section 4,
   - source IP `217.160.71.145`,
   - endpoint `https://api.z.ai/api/coding/paas/v4/chat/completions`,
   - models `glm-5.3` and `glm-5.1`,
   - **without requiring the API key in this ticket**?
5. Is **Coding Plan usage from VPS/datacenter hosts officially supported**? If yes, is there an **allowlist or unblock procedure** for datacenter egress IPs?

---

## 9. What we are requesting

- Confirmation whether datacenter/VPS egress is permitted for Coding Plan Global.
- If restricted: guidance on allowlist/unblock procedure for IP `217.160.71.145` (or IONOS datacenter range).
- If not restricted: backend investigation of HTTP 500 for authenticated requests from this IP with the timestamps above.
- Any documented requirement we may have missed for OpenClaw + Coding Plan from server/datacenter environments.

---

## 10. Submission gate

| Field | Value |
|---|---|
| Packet status | `PREPARED` |
| External submission | **NOT performed** |
| Next gate | Real human gate: operator reviews draft and submits to Z.AI Support through official channel |
| Repository pointer | `docs/runtime/ISSUE_8_ZAI_SUPPORT_ESCALATION_DRAFT.md` |

---

**End of draft.**
