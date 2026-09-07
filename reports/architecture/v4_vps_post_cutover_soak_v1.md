# V4 post-cutover production soak

**TASK_REF:** `V4_VPS_POST_CUTOVER_SOAK_V1`
**Issue:** #68
**BASE_HEAD:** `884a4bc40e64c8a6dab25d7c8462277cfcb1fb98`
**Classification:** `PASS`
**Soak window (UTC):** `2026-09-07T12:48:37Z` → `2026-09-07T13:01:35Z`
**Operator checkpoint:** issue comment [5570555635](https://github.com/mrhz1973/control-plane/issues/68#issuecomment-5570555635)

```text
CUTOVER=PASS
POST_CUTOVER_SOAK=PASS
NEW_ROLE=LIVE
OLD_ROLE=ROLLBACK_STANDBY_FROZEN
OLD_N8N_FROZEN=PASS
DUAL_WRITER_RISK=NO
NEW_PUBLICATION_MAP_STABLE=PASS
NATURAL_EXECUTION_PROGRESS=PASS
WF40_SOAK=PASS
POSTGRES_SEQUENCE_STATE=PASS
GOI_POST_CUTOVER_REGRESSION=PASS
HERMES_PRIVATE_HEALTH=PASS
LITELLM_PRIVATE_HEALTH=PASS
TAILSCALE_PRIVATE_TOPOLOGY=PASS
GIS_NEW_REAL_CLIENT_TEST=PASS
TAILSCALE_GOI_NEW_MEMBER_GRANT=PASS
TAILSCALE_POLICY_ROOT_CAUSE_REMEDIATED=YES
SECOND_DEVICE_TEST=DEFERRED_NON_BLOCKING
NEW_RESOURCE_HEADROOM=PASS
ROLLBACK_RETENTION=OPEN
OLD_DECOMMISSION_ELIGIBLE=NO
OLD_DECOMMISSION_AUTHORIZED=NO
SECRET_VALUES_EXPOSED=0
```

No production mutation, workflow publish/unpublish, restart, OLD n8n start, ACL change, DNS/public-route change, OpenClaw activation, or decommission occurred.

## Phase 0 — preflight and external operator evidence

```text
branch=main
HEAD=884a4bc40e64c8a6dab25d7c8462277cfcb1fb98
origin/main=884a4bc40e64c8a6dab25d7c8462277cfcb1fb98
tracked_tree=clean
```

Comment `5570555635` was ingested as operator-side external evidence, without re-inference:

```text
GIS_NEW_REAL_CLIENT_TEST=PASS
TAILSCALE_GOI_NEW_MEMBER_GRANT=PASS
TAILSCALE_POLICY_ROOT_CAUSE_REMEDIATED=YES
SECOND_DEVICE_TEST=DEFERRED_NON_BLOCKING
```

The operator reported the effective grant `autogroup:member` → `100.99.54.93/32` for TCP `8000,443,5000,8010,8989`, real-client TCP PASS on `8000,443,8010,8989`, and real GIS browser/tool PASS. No OLD change was reported.

## Phase 1 — NEW baseline and soak

Baseline NEW:

```text
n8n health=200
n8n container=running
PostgreSQL=healthy
workflows=50
credentials=3
executions=10136
max_execution_id=313108
nonterminal=0
published=4
WF61/D-0025=false/inactive
```

The publication map remained unchanged at every 30-second poll and at the end:

```text
90ldaa5a-4000-8000-000000000090=febca537-9218-4fb4-8280-847b5e961f6b
9ZMj2ACTKyDVhCue=a609ad90-7eb4-4495-9ec5-c4413165cea1
HVCzN3FoBdLGe9Hx=93d606ae-4883-4e6e-91e5-41ff00cbf741
Rx0Qp7pLj9GnyGh7=3e9d714f-3bdc-44f1-b3c5-b85385ddd811
```

During the window, 29 natural executions were observed:

- WF40 `9ZMj2ACTKyDVhCue`: 13 successful schedule executions.
- WF42 `HVCzN3FoBdLGe9Hx`: 13 successful natural executions.
- WF90 `90ldaa5a-4000-8000-000000000090`: 3 natural executions.

All execution IDs were strictly increasing and greater than frozen OLD max ID `312840`. All were terminal/success after the bounded natural drain. One WF90 execution was still naturally running at the exact window boundary; it completed successfully at `13:02:57Z` after approximately 136 seconds. It was not interrupted or classified as stuck.

Final NEW execution state after drain:

```text
executions=10173
max_execution_id=313145
nonterminal=0
non-success in bounded recent window=0
```

No publication drift, error burst, duplicate OLD execution activity, or stuck execution remained.

## Phase 2 — OLD frozen check

OLD was monitored in parallel for the full soak window:

```text
OLD n8n=exited
OLD 127.0.0.1:5678=absent
OLD PostgreSQL=healthy
OLD executions=10176
OLD max_execution_id=312840
OLD LiteLLM=running
OLD HTTPS=200
OLD GOI units=active
DUAL_WRITER_RISK=NO
```

OLD counts and max ID were unchanged at every poll. No OLD start/stop/restart or other mutation was executed.

## Phase 3 — PostgreSQL, sequence, and headroom

Final NEW PostgreSQL remained healthy and unpublished to the host. The execution sequence was:

```text
execution_entity max=313145
execution_entity_id_seq.last_value=313145
is_called=true
next_value=313146
BEHIND_MAX=0
```

Bounded resource evidence:

```text
uptime=15h28m
load=1.22 1.03 1.03
memory=7884 MB total / 4092 MB available
swap=4 GB configured, approximately 268 KB used
root filesystem=9% used, approximately 221 GB free
failed systemd units=none
```

Final Docker stats remained bounded:

```text
litellm-primary  CPU=0.40%  MEM=716.9MiB / 7.699GiB  9.09%
root-n8n-1       CPU=0.86%  MEM=372.1MiB / 7.699GiB  4.72%
root-postgres-1  CPU=26.88% MEM=52.14MiB / 7.699GiB  0.66%
```

`NEW_RESOURCE_HEADROOM=PASS`; no service impairment was observed.

## Phase 4 — GOI and private-stack regression

NEW bounded smokes:

```text
GraphHopper health=200
GraphHopper canonical route=200
ORS hostname-verified HTTPS=200
D-Flight HTTP=200 READY dataset_available=true
GIS HTTP=200 OLD_IDENTITY_HITS=0 NEW_IDENTITY_HITS=6
Nav HTTP=200 tokens_ok=true last_error=null
NEW TLS SAN=ionos-n8n-new.tailc01234.ts.net only
NEW public :80=absent
```

D-Flight reported `feature_count=816`, not the historical `841`. This is not a service failure: NEW’s current canonical source refreshed naturally at `2026-09-07T12:16:17Z` and logged `refresh_ok result=READY_CHANGED`:

```text
NEW canonical_sha256=60de7f69f4f4433d0448998e02bed093cea4142d72843962529f036fc225c4d5
NEW feature_count=816
NEW byte_count=7349449
NEW fetched_at=2026-09-07T12:16:17Z
NEW last_error_category=null
```

OLD remains frozen on its older `841`-feature snapshot (`canonical_sha256=0db8ee57…`, fetched 2026-08-20). The explicit expected-count exception is therefore satisfied by current canonical source metadata; no refresh was triggered by this task.

Hermes `xvfb`, Chromium, x11vnc and noVNC services remained active/private. LiteLLM remained running with no host publication. Tailscale identity remained `ionos-n8n-new` / `100.99.54.93`; advertised routes were none, Serve was none, and exit-node state remained empty/disabled. No public GOI listener appeared.

## Final classification

```text
POST_CUTOVER_SOAK=PASS
CUTOVER=PASS
NEW_ROLE=LIVE
OLD_ROLE=ROLLBACK_STANDBY_FROZEN
ROLLBACK_RETENTION=OPEN
OLD_DECOMMISSION_ELIGIBLE=NO
OLD_DECOMMISSION_AUTHORIZED=NO
OLD_CHANGED=NO
SECRET_VALUES_EXPOSED=0
```

The second-device test remains deferred/non-blocking exactly as recorded by the operator. Rollback retention remains open with no automatic expiry.
