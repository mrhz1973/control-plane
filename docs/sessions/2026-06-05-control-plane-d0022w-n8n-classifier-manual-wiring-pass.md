# Session — D-0022-W n8n classifier manual wiring/config PASS

**Repository:** `mrhz1973/control-plane`  
**Date:** 2026-06-05  
**Type:** Runtime user-attested. **No runtime by Cursor.**

---

## 1. Context

- **D-0021** transport/auth already **PASS** (Tailscale Serve tailnet-only + token + ACL).
- **D-0022-W** Decision: **Option 1** — dedicated manual inactive n8n workflow, template-first, classifier call only.
- Workflow name in n8n UI: **50 - D-0022-W classifier manual wiring test**.
- URL and `X-Classifier-Token` configured **only in n8n UI** — not recorded in Git.

## 2. Evidence

### Happy path — direct HTTP Request node

- HTTP **200**, schema-valid 5-field output:

```json
{
  "risk": "low",
  "route": "auto_allowed",
  "reason": "Event involves only documentation files/updates with no secrets, no deploy, no workflow mutation, and no automation loop.",
  "confidence": "high",
  "requires_human": false
}
```

### Auth-fail verification

- Token deliberately made invalid → HTTP **401** Unauthorized, body `{"error":"unauthorized"}`; token then restored.

### Fail-closed path verification

- URL path temporarily changed to `/classify-broken-test` → HTTP **404** Not Found, body `{"error":"not found"}`; URL then restored.

### Final full workflow run

- After restoring URL/token: HTTP **200**, schema-valid output:

```json
{
  "risk": "low",
  "route": "auto_allowed",
  "reason": "Event involves only documentation updates with no secrets, no deploy, no workflow mutation, and no automation loop.",
  "confidence": "high",
  "requires_human": false
}
```

## 3. Clarifications (reviewer)

- **P1:** `route` remains only contract values: `auto_allowed` | `human_gate` | `blocked`. Granular `blocked_*` diagnostics belong in `reason`/diagnostic fields, never in `route`.
- **P2:** n8n workflow stays intentionally “stupid”: transport + schema validation + fail-closed + do-not-act-on-success. Guard/model reconciliation stays server-side in `tools/classifier-server-v1.mjs` / `classifier-wrapper-v1` — not reimplemented in n8n.

## 4. Scope

- Workflow **inactive/manual**; no schedule.
- No Telegram Trigger; no Telegram send; no Funnel; no public webhook.
- No workflow **40/41/42** mutation. **41** off; **40/42** unchanged.
- **48** not scheduled; **49** not used.
- **PM-34** remains **BLOCKED**.
- No provider API key; no secrets/token/credential/chat_id/auth URL in Git.

## 5. Conclusion

**D-0022-W n8n classifier manual wiring/config = PASS ATTESTATO UTENTE.**

This is **not** permanent loop automation.
