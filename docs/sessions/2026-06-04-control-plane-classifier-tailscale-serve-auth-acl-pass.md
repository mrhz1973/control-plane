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
| Ryzen / asusdesktop Tailscale IP | <RYZEN_TS_IP> |
| VPS / ubuntu Tailscale IP | <VPS_TS_IP> |
| Serve URL | `https://<RYZEN>.<TAILNET>.ts.net/` |
| Serve status | `https://<RYZEN>.<TAILNET>.ts.net` (tailnet only) → `/` proxy `http://127.0.0.1:8765` |
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
  - `src`: `<VPS_TS_IP>/32` (VPS)
  - `dst`: `<RYZEN_TS_IP>/32` (Ryzen)
  - `ip`: `tcp:443`
- Tailscale SSH self/check rule preserved.
- After ACL save: same pass results as before ACL tightening (see §5).

## 5. Evidence — VPS transport tests

**`/healthz` from VPS:**

```text
curl -sS -i https://<RYZEN>.<TAILNET>.ts.net/healthz
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

---

## 9. Addendum 2026-06-13 — GIS tailnet ACL grant

**Date:** 2026-06-13  
**Motivation:** enable browser access from any tailnet member device to the **GOI GIS Tool** (port 8000) and the **Navionics proxy** (port 5000) on the VPS.

### Grant applied (manual Tailscale admin console)

```json
{ "src": ["autogroup:member"], "dst": ["100.114.7.53/32"], "ip": ["tcp:8000", "tcp:5000"] }
```

### Notes

- Grant applied **manually** in the Tailscale admin console; this repository **documents** but does **not enforce** ACL policy.
- Pre-existing grant **VPS → Ryzen `tcp:443`** (D-0021 classifier path) **preserved**.
- Tailscale SSH **`check`** rule **preserved**.
- Root cause of prior Windows→VPS timeouts (2026-06-13): **restrictive Tailscale ACL**, not host firewall (host firewall open on `tailscale0`).
- SSH tunnel (`ssh -L`) was used only as a **temporary smoke-test workaround**, then retired; not the final architecture.
- **Planet-Clone** commit **`5e57c7f`** added SonarChart endpoint `/sonar/` on the **same proxy port 5000**; ACL grant covers the port, not individual paths.
- Endpoint `/sonar/` is available from the proxy; the **GIS monolite does not consume it yet** (GIS uses `/tiles/` only).
- **OPSEC risk to audit (Blocco 5):** raw tailnet exposure on ports **5000/8000**; SonarChart now exposed via proxy; possible evolution **B2** with `tailscale serve`, loopback rebind, and relative URLs.

### Related GIS session

Documented in repo `cursor-coordinate-converter`: checkpoint/session append **2026-06-12/2026-06-13**, orchestrator inbox **`2026-06-13_0112_riepilogo_vps-tailnet-navionics-systemd.md`**.
