# V4_DASHBOARD_CONFIGURABLE_REFRESH_NO_FLICKER_V1

- **Issue**: #85 — Dashboard — configurable refresh interval and no full-page flicker
- **Status**: CLOSED / COMPLETED
- **Date**: 2026-09-17 (UTC+2)

RESULT=PASS
TASK_REF=V4_DASHBOARD_CONFIGURABLE_REFRESH_NO_FLICKER_V1
ISSUE_85=#85

BASE_HEAD=703968132487ab999b8b4cd44fded26b2571d882
FINAL_HEAD=<filled at commit>

REFRESH_INTERVAL_OPTIONS=3000|5000|10000|30000 ms (3 s / 5 s / 10 s / 30 s)
DEFAULT_REFRESH_INTERVAL=3000 ms (auto ON)
AUTO_REFRESH_TOGGLE=YES (checkbox "Auto", persisted)
MANUAL_REFRESH=YES ("Aggiorna" button reuses the same single-flight refresh path, works with auto ON and OFF)

PREFERENCE_STORAGE=localStorage key `control-plane.dashboard.refresh.v1` (JSON: interval_ms, auto_refresh_enabled); written only on operator change; guarded by try/catch (dashboard works with storage unavailable)
INVALID_STORAGE_FALLBACK=YES (corrupt JSON / non-boolean / out-of-catalog interval → safe defaults 3000 ms + auto ON; initialization never throws)

FULL_PAGE_RELOADS=0 (no location.reload / document.write / history navigation constructs; all refreshes are in-place async GETs)
SINGLE_FLIGHT_REFRESH=YES (`refreshing` guard coalesces overlapping ticks, manual clicks and interval ticks)
OVERLAP_PROTECTION=YES (interval callback starts a cycle only if none is in flight; late completion never spawns a second cycle; timers never accumulate)

LAST_KNOWN_GOOD=YES (per-source snapshots status/diagnostics/resources in refreshState.lastGood; STALE source renders its own last-known-good data)
INDEPENDENT_SOURCE_FRESHNESS=YES (per-source state map: FRESH / STALE / UNAVAILABLE_NO_DATA; one global flag was removed)
STALE_RESOURCE_BEHAVIOR=resource cards keep last-known-good values; in-section badge "⚠ Dati non aggiornati (STALE)" rendered inside resources-cards via the same idempotent put() path (no DOM injection hacks); global alert names the failing endpoint; healthy sections keep updating
NO_DATA_BEHAVIOR=UNAVAILABLE_NO_DATA when a source never succeeded: no invented values; resources section shows the canonical "non ancora disponibile" empty state; poll indicator says "Dati non ancora disponibili: …"
STALE_RECOVERY=YES (next successful poll per source flips STALE→FRESH, clears the badge and the partial-data alert; errors never latch permanently)

WF90_CADENCE_SECONDS=120
WF90_CHANGED=NO
COUNTDOWN_REGRESSION=PASS (client 1 s interpolation timer untouched and separate from the data-poll timer; opstripClock.intervalSeconds stays 120; changing the dashboard interval does not touch last tick / next tick / WF90 owner)

HUMAN_GATE_REGRESSION=PASS (#86 focused suite 18/18; NEW_GATE / UNCHANGED_NOTIFIED_GATE / RESOLVED_GATE, canonical chips, expandable detail, no buttons, no invented choices; gate strip survives a stale resources endpoint)
SELF_MAINTENANCE_REGRESSION=PASS (#88 module and suite untouched; dashboard only observes; dispatcher service suite 75/75)
QWEN_LIFECYCLE_REGRESSION=PASS (dashboard polling issues GET /v1/status, /v1/diagnostics, /v1/resources only; never calls the Qwen endpoint; live check confirmed no Qwen process, port 8080 free during polling; #89 code untouched)

DASHBOARD_MUTATION_CONTROLS_ADDED=0 (interval selector + auto toggle are browser presentation controls only)
BACKEND_MUTATION_ENDPOINTS_ADDED=0 (no backend changes at all: dashboard file only)

N8N_CHANGED=NO
TELEGRAM_CHANGED=NO
PRODUCTION_CHANGED=NO
ROUTING_CHANGED=NO
WF90_SCHEDULE_CHANGED=NO
DISPATCHER_ADMISSION_CHANGED=NO

FOCUSED_TESTS=tests/dashboard-refresh-control-v1/run.mjs — 18/18 PASS (T1 default config; T2 interval catalog 3/5/10/30 s; T3 interval persistence; T4 auto persistence; T5 corrupt-storage safe fallback; T6 auto OFF = zero future polls; T7 interval change cancels/replaces the single timer; T8 single-flight in-flight coalescing; T9 manual refresh with auto OFF; T10 no full-page reload constructs; T11 resources failure keeps last-known-good cards; T12 only resources marked STALE; T13 status keeps updating while resources fails; T14 recovery clears stale; T15 never-succeeded source = UNAVAILABLE_NO_DATA, no invented data; T16 #86 gate intact and read-only under stale resources; T17 WF90 countdown/120 s semantics unchanged; T18 polling is read-only GETs to the three dispatcher endpoints only)

REGRESSION_TESTS=tests/dashboard-human-gate-view-v1 (18/18), tests/local-dev-dispatcher-service-v1 (75/75), tests/local-dev-dashboard-quota-reset-times-v1 (PASS)

LIVE_DASHBOARD_CHECK=PASS — live dashboard at http://127.0.0.1:18793/dashboard (service PID 37848, already running, no restart needed):
1. dashboard loads, 6 resource cards + gate strip + countdown render;
2. default 3 s / auto ON works (poll indicator "Aggiornato alle …");
3. switched 3 s → 10 s: preference persisted, single 10 s timer observed across 2+ ticks;
4. browser reload restores 10 s + auto state from localStorage;
5. Auto OFF: 21 s window with zero automatic polls, indicator "Aggiornamento automatico sospeso";
6. manual Aggiorna with auto OFF: full refresh executed ("Lettura parziale alle …" during a transient partial);
7. Auto ON resumes immediately with the persisted interval;
8. cards remain mounted during refresh (no flicker; .res-grid stable, no reload navigation entries — exactly 1 for the whole session);
9. countdown keeps ticking from real WF90 ticks ("ogni 2 minuti", mm:ss format);
10. human gate (#86) fully intact and read-only (HUMAN GATE strip, TRACKED_DIRTY_CONFLICT shown, no buttons);
11. Qwen stays STOPPED during all polling (no worker process, port 8080 free).

TEMPORARY_FAILURE_PROOF=covered deterministically by T11–T15 (network error, HTTP 503, and recovery scenarios against the vm harness); no real backend was stopped.

SECRETS_EXPOSED=0

ISSUE_85=CLOSED_COMPLETED
COMMIT=<filled at commit>
REMOTE_HEAD_VERIFIED=YES

## Notes

- Service `serve-local-dev-autonomous-dispatcher-v1.mjs` reads the dashboard HTML from disk per request (`loadDashboardHtml`), so no service restart was required.
- The stale badge is rendered through the same idempotent `put()` path as the cards (differential innerHTML; open `<details>`/focus are preserved), avoiding any pre/post injection that could flicker.
- Data-poll timer and WF90 countdown timer are deliberately separate intervals: data polling uses the operator-selected interval; countdown interpolation stays at 1 s anchored on real tick timestamps.
