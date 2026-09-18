# V4 LOCAL_DEV Dispatcher Crash Resilience V1

**Issue:** #93  
**Classification:** CLOSED / FINAL OWNERSHIP + HEADLESS PROOF COMPLETE — Date: 2026-09-18 (incident + supervisor qualification) · 2026-09-19 (final ownership reconciliation + headless proof)

## Incident

During TMAR R001 `D-9501-R`, the canonical workstation dispatcher disappeared while the durable receipt remained `EXECUTING`. The dashboard listener on `127.0.0.1:18793` vanished, OpenCode was no longer present, and Qwen remained loaded.

The TMAR worktree was clean, TMAR HEAD remained unchanged, no R001 temporary venv existed, and no R001 commit was produced. The original receipt remains intentionally blocking and was not deleted or rewritten.

## Proven pre-state

The canonical Scheduled Task was:

- `ControlPlane-V4-LocalDevDispatcher`
- `MultipleInstances=IgnoreNew`
- `ExecutionTimeLimit=PT0S`
- `RestartCount=0`
- `RestartInterval` unset
- `StartWhenAvailable=true`

No TaskScheduler/Operational event or Application Error entry proved the original Node termination cause. WER `LiveKernelEvent 141` records observed near the investigation time referenced older dump files and were not accepted as causal evidence.

## Failed Task Scheduler restart experiment

A first remediation added durable wrapper logging outside the Git worktree and configured Task Scheduler restart settings:

- `RestartCount=3`
- `RestartInterval=PT1M`

Controlled Node-only termination was executed only while dispatcher `status.active=false`.

Result:

- exact dispatcher Node PID was terminated;
- wrapper logged `NODE_EXIT code=-1`;
- task returned to `Ready`;
- listener did not return within 100 seconds;
- receipt ledger SHA-256 remained unchanged.

Therefore Task Scheduler restart-on-failure was not accepted as sufficient recovery for this demand-start service topology.

## Qualified supervisor recovery

The single canonical Scheduled Task was retained. Its PowerShell wrapper was converted into a supervisor loop that owns one Node child at a time and restarts that child after a 10-second backoff if the child exits.

Live proof:

- task state before controlled crash: `Running`;
- wrapper PID: `58588`;
- dispatcher Node PID before: `25416`;
- controlled termination of only Node PID `25416`;
- wrapper stayed alive;
- log recorded `NODE_EXIT attempt=1 code=-1`;
- log recorded `RESTART_WAIT seconds=10`;
- log recorded `SUPERVISOR_START attempt=2 wrapper_pid=58588`;
- dispatcher Node PID after: `51192`;
- listener returned on `127.0.0.1:18793`;
- final dispatcher state: `IDLE`, `active=false`;
- receipt SHA-256 before and after:
  `E813831A5183DDE57869007EADE37D8909A77F96F7068542701333C4448EFDC7`;
- receipt mutation: **NONE**.

**SUPERVISOR_RECOVERY=PASS**  
**SINGLE_CANONICAL_TASK=PASS**  
**LOOPBACK_BIND_PRESERVED=PASS**  
**RECEIPTS_IMMUTABLE_DURING_RECOVERY_TEST=PASS**  
**SECOND_DAEMON_CREATED=NO**  
**PUBLIC_SURFACE_CHANGED=NO**  
**WF90_CHANGED=NO**  
**ROUTING_CHANGED=NO**

## Canonical implementation

Repository supervisor:

`tools/run-local-dev-dispatcher-supervisor-v1.ps1`

Runtime log:

`%LOCALAPPDATA%\ControlPlane\logs\local-dev-dispatcher.log`

The Scheduled Task must invoke the repository supervisor script directly. The AppData copy used during live diagnosis is transitional and must not remain the canonical action target after local fast-forward.

## Remaining gate

Before closing #93, fast-forward the workstation repository to the commit containing the canonical supervisor and repoint the existing Scheduled Task action to:

`powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File "<repo>\tools\run-local-dev-dispatcher-supervisor-v1.ps1"`

Then verify the same single listener and dashboard health. No second service/task is permitted.

## Final closure — ownership reconciliation + fully headless proof (2026-09-19)

**BASE_HEAD:** `cc257ce6dfe0500a484d499f7dc5cca95a13a99b` (origin/main verified; tracked worktree clean)

### Phase 1 — Read-only process ownership census

Scheduled Task `ControlPlane-V4-LocalDevDispatcher`:

- State: `Running`
- Action (canonical, unchanged): `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\Users\mrhz\Documents\AI\GitHub\control-plane\tools\run-local-dev-dispatcher-supervisor-v1.ps1"`

Dispatcher tree (PID+PPID+CommandLine evidence, no name-only inference):

```
Task Scheduler (svchost 2652)
  -> PowerShell supervisor PID 8276 (canonical repo supervisor script, started 2026-09-18 16:03:58)
      -> conhost PID 25756 (hidden, MWH=0)
      -> Node dispatcher PID 6256 — sole listener 127.0.0.1:18793
```

Qwen tree at census time (post-#89 auto-stop cold; router detached as designed):

```
python qwen_runtime_router.py PID 31640 (PPID 24428 exited -> detached:true launch, by design)
  -> llama-server manager PID 26892 (--models-preset --models-max 1 --models-autoload)
      -> conhost PID 26084 (hidden, MWH=0)
```

Uniqueness: exactly one supervisor instance, exactly one dispatcher Node. No orphan dispatcher. No second wrapper/daemon/task.

### Phase 2 — Reconciliation verdict

Ownership was **already canonical** (Node PPID == supervisor PID; supervisor parent == Task Scheduler svchost). Per task law ("if ownership is already canonical, do not recycle unnecessarily") no reconciliation kill/restart cycle was performed. Listener `127.0.0.1:18793` only; `/dashboard` 200; `/v1/status` 200; `active=false`.

### Phase 3 — Controlled supervisor recovery proof (fresh, on the canonical tree)

Safety gate honored: one gate check transiently observed `active=true` (WF90 n8n tick in flight, 120 s cadence) → the proof **aborted without touching any process**, waited bounded for idle, then re-checked `active=false` before acting.

- receipt SHA-256 before: `DAD88C92C19803AF91614BC56FB640D47470AD137B30A011216DC8A255BB940F`
- terminated ONLY Node child PID 6256 (supervisor 8276 untouched)
- supervisor stayed alive
- supervisor log: `NODE_EXIT attempt=1 code=-1` → `RESTART_WAIT seconds=10` → `SUPERVISOR_START attempt=2 wrapper_pid=8276`
- new dispatcher Node PID **49040** (≠ 6256), PPID == 8276 (same supervisor)
- listener `127.0.0.1:18793` restored; `/dashboard` 200; `/v1/status` 200; `active=false`, phase IDLE
- receipt SHA-256 after: `DAD88C92C19803AF91614BC56FB640D47470AD137B30A011216DC8A255BB940F` — **unchanged**
- no queue execution, no POST /v1/tick during the proof

**CONTROLLED_NODE_RECOVERY=PASS**

### Phase 4 — Headless dispatcher proof

EnumWindows census over the canonical tree:

- PowerShell supervisor 8276: MWH=0, no visible top-level window
- Node dispatcher 49040: MWH=0, no visible top-level window
- supervisor conhost 25756: MWH=0, hidden

The only visible console-capable window on the workstation (Windows Terminal PID 23536, tabs titled `llama-server.exe` / `npm root`) belongs to the interactive logon session (started 16:03:58 at console logon). Both its hosted consoles (OpenConsole 10404/2296) have **zero attached processes** — they are session-restore ghost tabs holding no runtime process. No Control Plane process owns any visible window. No wrapper/daemon/task added. Scheduled Task action remains the canonical repository supervisor.

**DISPATCHER_VISIBLE_WINDOW_COUNT=0 — DISPATCHER_HEADLESS=PASS**

### Phase 5 — Qwen headless proof (lifecycle proof only)

Started the exact DEV profile `qwen38-opus-q3-opencode-64k` via the canonical `ensureWorkstationDevQwenReady` path (no manual llama-server flags, no model generation):

- ensure result: `PROFILE_LOADED_AND_READY`, `load_performed=true`, `launch_performed=false` (router already healthy)
- exact model loaded (worker `--alias qwen38-opus-q3-opencode-64k`, ctx 64K class, dynamic port 49566)
- tree: router python 31640 → manager llama-server 26892 → worker llama-server 35376 (+ hidden conhosts 26084/27932)
- EnumWindows census: router/manager/worker/conhost all MWH=0, **no visible top-level window** (conhost existence alone was not treated as visibility)
- VRAM 1041 → 11871 MiB while resident; API `/v1/models` HTTP 200
- closed via canonical `stopCanonicalDevRouterTree` lifecycle: VRAM 11871 → **901 MiB**, ports 8080/18080 free, no 64K model left resident

**QWEN_VISIBLE_WINDOW_COUNT=0 — QWEN_HEADLESS=PASS — EXTERNAL_QWEN_CHANGE_REQUIRED=NO** (external `qwen_runtime_router.py` untouched)

Note: the already-present `windowsHide:true, detached:true, stdio:"ignore"` launch options in `tools/qwen-local-session-manager-v1.mjs` were confirmed effective; no code change was required for headless operation.

### Windows Terminal dependency law

Closing a normal Windows Terminal is **not** an operational dependency: every persistent Control Plane process (supervisor, Node dispatcher, Qwen router/manager/worker) runs detached with hidden consoles; the surviving visible WT window hosts only ghost tabs with zero attached processes.

### Hard walls

- WF90_CHANGED=NO · N8N_CHANGED=NO · QUEUE_POLICY_CHANGED=NO
- No receipt add/delete/rewrite (SHA proven above) · no queue item rewrite
- No POST /v1/tick · no manual backlog execution
- No second daemon/scheduler/dispatcher · no public bind · no vendor patching
- No kill-by-name · no broad termination · only positively identified PIDs touched
- No routing/provider/model-policy change · no unrelated service restart

### Final verdict

**ISSUE_93_RESULT=PASS**

Canonical ownership: Task Scheduler → supervisor 8276 → Node 49040 (sole listener 127.0.0.1:18793). Crash resilience re-proven live on the canonical tree. Dispatcher and Qwen runtimes fully headless. Queue/receipts/WF90 behavior preserved exactly.
