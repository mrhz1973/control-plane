# V4 Issue 65 noVNC view-only default V1

**TASK_REF:** `V4_ISSUE_65_NOVNC_VIEW_ONLY_DEFAULT_V1`
**BASE_HEAD:** `a74d7481cf60b5e5e95d16a2a88004c69e26d56c` (== origin/main == HEAD at start, verified PASS)
**Date (Europe/Rome):** 2026-09-14
**TARGET_HOST:** `ionos-n8n-new` (identity fence PASS: hostname `ubuntu`, public `31.70.139.73`, Tailscale `100.99.54.93`)
**MODE:** BOUNDED NEW-VPS OPERATOR-SURFACE HARDENING — one bounded A→B→C mode cycle, no campaign

---

## 1. Previous state (captured before mutation)

- `hermes-x11vnc.service`: `ExecStart=/usr/bin/x11vnc -display :99 -rfbauth /home/hermes-test/.hermes/vnc/passwd -rfbport 5900 -localhost -forever -shared -ncache 0` — **no view-only flag**: any VNC/noVNC client could move the mouse/keyboard (observation and control mixed).
- `hermes-novnc.service`: `websockify --web=/usr/share/novnc 127.0.0.1:6080 127.0.0.1:5900`.
- Listeners loopback-only: `127.0.0.1:5900` (+`::1:5900`), `127.0.0.1:6080`, `127.0.0.1:9222`; Chromium PID `4095558`; all four hermes services active.
- No mode helper existed (`/usr/local/bin/hermes-vnc-mode` absent).

## 2. Implementation (smallest robust change)

1. Local rollback copy of the unit: `/etc/systemd/system/hermes-x11vnc.service.bak-issue65` (on VPS) — original unit file untouched otherwise.
2. systemd drop-in `/etc/systemd/system/hermes-x11vnc.service.d/viewonly-default.conf` (canonical repo copy `tools/hermes-x11vnc-viewonly-default-drop-in-v1.conf`): overrides ExecStart with a deterministic branch — marker `/run/hermes-vnc/vnc-interactive` ABSENT ⇒ original arguments + `-viewonly` (VIEW_ONLY default); marker PRESENT ⇒ byte-identical original arguments (input enabled). No other flag changed.
3. Root-owned helper `/usr/local/bin/hermes-vnc-mode` (canonical repo copy `tools/hermes-vnc-mode-v1.sh`, 755 root:root): `view` (delete marker + restart x11vnc), `interactive` (create marker + restart x11vnc), `status`.
4. `systemctl daemon-reload`; restarted ONLY `hermes-x11vnc`. Chromium/Xvfb/noVNC/Hermes/n8n/PostgreSQL/OS untouched.
5. One CRLF normalization fix on the remote helper copy during install (Windows-authored file); no semantic change.

Marker state is tmpfs (`/run`): it cannot survive reboot or service restart — **BOOT_DEFAULT=VIEW_ONLY is structural**, not conventional.

## 3. Exact operator commands (root, via SSH/Tailscale-private tunnel)

```bash
hermes-vnc-mode status         # mode=VIEW_ONLY (default) | mode=INTERACTIVE
hermes-vnc-mode interactive    # temporary human-assist input (explicit action)
hermes-vnc-mode view           # deterministic return to VIEW_ONLY (default)
```

## 4. Default behavior

After boot, after any service restart, and after `view`: x11vnc serves the :99 display strictly read-only (`-viewonly`); no mouse/keyboard input reaches the Hermes-controlled Chromium session. Observation via noVNC remains fully available.

## 5. Interactive-assist procedure (HUMAN ASSIST ONLY — deterministic operating rule)

1. Enable only when Hermes/browser automation is blocked by a genuine human gate (login / 2FA / Cloudflare / popup): `hermes-vnc-mode interactive`.
2. While assisting: automation must NOT intentionally issue browser actions concurrently with manual operator input (operating rule; no new lock system built, per task law).
3. Immediately after assistance: `hermes-vnc-mode view`.
`interactive` is never enabled automatically by any automation, timer, or boot path.

## 6. Return-to-view procedure

`hermes-vnc-mode view` — deletes the marker and restarts only x11vnc into the `-viewonly` branch. Verified deterministic (step C below).

## 7. Listener/bind proof (before / interactive / after — identical loopback set)

```text
LISTEN 127.0.0.1:5900   x11vnc      (+ ::1:5900)
LISTEN 127.0.0.1:6080   websockify
LISTEN 127.0.0.1:9222   chrome (CDP)
```

No `0.0.0.0` VNC, no public noVNC, no Funnel, no public reverse proxy, no firewall/DNS/nginx change. Verified explicitly: `NO_PUBLIC_LISTENERS` during interactive mode. noVNC page reachable via localhost (`http://127.0.0.1:6080/vnc.html` → HTTP 200). Operator access remains SSH/Tailscale-private tunnel only.

## 8. Persistent Chromium preservation

Chromium PID `4095558` unchanged across the entire A→B→C cycle; persistent profile `chatgpt-chrome-profile` present in the Chromium unit ExecStart before and after; no browser restart, no session disturbance. Xvfb PID also untouched (only x11vnc restarted, twice).

## 9. Bounded acceptance cycle evidence

- **A — DEFAULT VIEW:** helper `status` → `mode=VIEW_ONLY (default)`; effective invocation contains `-viewonly` (ps + `systemctl show` ExecStart); hermes-x11vnc active; 5900/6080/9222 loopback-only; noVNC HTTP 200; Chromium active.
- **B — INTERACTIVE:** `hermes-vnc-mode interactive` → `mode=INTERACTIVE`; effective invocation without `-viewonly` (byte-identical original); same `127.0.0.1:5900`; x11vnc + chromium active; no public listener. (No ChatGPT action, no typing, no model traffic.)
- **C — RETURN TO VIEW:** `hermes-vnc-mode view` → `mode=VIEW_ONLY (default)`; invocation again contains `-viewonly`; all four services active; Chromium PID 4095558 unchanged; profile path unchanged; marker directory empty; noVNC still available.

## 10. Rollback

```bash
cp -a /etc/systemd/system/hermes-x11vnc.service.bak-issue65 /etc/systemd/system/hermes-x11vnc.service
rm -rf /etc/systemd/system/hermes-x11vnc.service.d
rm -f /usr/local/bin/hermes-vnc-mode
systemctl daemon-reload && systemctl restart hermes-x11vnc
```

Canonical repo copies (`tools/hermes-vnc-mode-v1.sh`, `tools/hermes-x11vnc-viewonly-default-drop-in-v1.conf`) remain in-repo for reinstall. No secret material was read, displayed, copied, or committed at any point; `-rfbauth` passwd path unchanged.

## 11. Acceptance result

```text
DEFAULT_VIEW_ONLY=YES
INTERACTIVE_ASSIST_EXPLICIT_ACTION=YES
RETURN_TO_VIEW_ONLY_DETERMINISTIC=YES
VNC_NOVNC_CDP_PUBLIC_EXPOSURE=NO
CHROMIUM_PERSISTENT_SESSION_PRESERVED=YES
SECRET_MATERIAL_EXPOSED=NO
WHOLE_HERMES_RUNTIME_RESTART_REQUIRED=NO
BOOT_DEFAULT=VIEW_ONLY
MODEL_INFERENCE=0
PRODUCTION_DISPATCH=0
PRODUCTION_CHANGED=YES_BOUNDED_OPERATOR_SURFACE_HARDENING
```

Issue #65 CLOSED COMPLETED (closure comment issuecomment-5667627731; post-close re-verified `CLOSED/COMPLETED`; body/title/labels untouched).

## 12. #68 / #35 separation

#68 untouched, remains `OPEN_PENDING_PROVIDER_TERMINATION`; `OLD_OS_SHUTDOWN=PASS`; `OLD_PROVIDER_TERMINATION=MANUAL_OPERATOR_ACTION_REQUIRED`. #35 untouched; no Astra polling.

## 13. NEXT

OPEN issues after #65 closure: #68 (operator-side IONOS termination — excluded from engineering work), #35 (parked until new Astra exposure evidence — excluded), #18 (explicitly DEFERRED research — excluded). No other mechanically READY engineering/closure slice exists in the canonical backlog without inventing new work.

```text
CURRENT_NEXT=GLOBAL_FRONTIER_RESELECTION_REQUIRED
NEXT=GLOBAL_FRONTIER_RESELECTION_REQUIRED
```
