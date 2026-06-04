# Session — Classifier Tailscale Serve + token + ACL (D-0021) PASS

**Repository:** `mrhz1973/control-plane`  
**Date:** 2026-06-04  
**Type:** Runtime user-attested. **No runtime by Cursor.**

---

## 1. Context

- **a.1** already **PASS**: classifier persistent at-logon on Ryzen, loopback `127.0.0.1:8765`.
- Decision Packet **D-0021**:
  - **D-0021-T:3** = Tailscale Serve tailnet-only to loopback service — **PASS**.
  - **D-0021-A:A** = token + ACL — **PASS**.
- This gate is **transport/auth only** — not permanent loop automation; n8n workflow wiring remains a future gate.

## 2. Transport — Tailscale Serve (D-0021-T:3)

| Item | Value |
|------|--------|
| Ryzen / asusdesktop Tailscale IP | 100.110.35.23 |
| VPS / ubuntu Tailscale IP | 100.114.7.53 |
| Serve URL | `https://asusdesktop.tailc01234.ts.net/` |
| Serve status | `https://asusdesktop.tailc01234.ts.net` (tailnet only) → `/` proxy `http://127.0.0.1:8765` |
| Funnel | **NOT** enabled |
| Exposure | Tailnet only |

## 3. Auth — token (D-0021-A:A, no token in Git)

- `CLASSIFIER_AUTH_TOKEN` set in Windows User environment on Ryzen (length **43** after final rotation).
- First all-zero/invalid token attempt was overwritten.
- A later token was accidentally exposed by a broken curl quoting attempt and was **immediately rotated**.
- **Token value is NOT recorded** in this document or in Git.
- Token used only via environment / transient runtime handoff.
- After restart: unauthenticated local POST `/classify` → **401**; listener `127.0.0.1:8765` Listen, PID **79632**.

## 4. ACL

- Prior ACL: allow-all → replaced with restrictive grant:
  - `src`: `100.114.7.53/32` (VPS)
  - `dst`: `100.110.35.23/32` (Ryzen)
  - `ip`: `tcp:443`
- Tailscale SSH self/check rule preserved.
- After ACL save: same pass results as before ACL tightening (see §5).

## 5. Evidence — VPS transport tests

**`/healthz` from VPS:**

```text
curl -sS -i https://asusdesktop.tailc01234.ts.net/healthz
HTTP/2 200
{"status":"ok"}
```

**`/classify` without token from VPS:**

```text
HTTP/2 401
{"error":"unauthorized"}
```

**`/classify` with token + case A from VPS:**

```text
HTTP/2 200
{"risk":"low","route":"auto_allowed","reason":"The event involves a Markdown cleanup under a non-sensitive directory with no flags indicating security or operational concerns.","confidence":"high","requires_human":false}
```

After ACL save: `/healthz` still HTTP/2 200; `/classify` without token still 401; `/classify` with token still 200 with `risk: low` / `route: auto_allowed`.

## 6. Hygiene

- Temporary VPS files: **TEMP_FILES_REMOVED**.
- No token in Git; no temp token file left on VPS; body temp file removed after cleanup.

## 7. Boundaries

- No n8n workflow modified.
- Workflow **40/41/42** unchanged.
- **47** off; **48** callable/published, not scheduled independently.
- **PM-34** **BLOCKED**.
- No Telegram Trigger; no public webhook; no Funnel; no production Data Table; no `control_plane_state` decision writes.
- **Not** permanent loop automation.

## 8. Conclusion

**D-0021 classifier stable transport/auth = PASS ATTESTATO UTENTE.**
