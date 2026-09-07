# Post-cutover GIS client-path diagnostic

**TASK_REF:** `V4_VPS_POST_CUTOVER_GIS_CLIENT_PATH_DIAGNOSTIC_V1`
**Issue:** #68
**BASE_HEAD:** `6f6a5d64ae331517ffd8ddae4d31713f55d61f42`
**Classification:** `PASS — GIS_CLIENT_PATH_DIAGNOSTIC=PASS`
**Scope:** read-only NEW diagnosis; no OLD contact or mutation; no service restart

```text
GIS_CLIENT_PATH_ROOT_CAUSE=TAILSCALE_ACL_OR_POLICY_BLOCK
CUTOVER_STATE=PRESERVED_PASS
NEW_ROLE=LIVE
OLD_ROLE=ROLLBACK_STANDBY_FROZEN
OLD_CHANGED=NO
SECRET_VALUES_EXPOSED=0
```

The diagnostic does not roll back production and does not alter Tailscale ACLs, firewall rules, routes, Serve, Funnel, or either host.

## Preflight

```text
branch=main
HEAD=6f6a5d64ae331517ffd8ddae4d31713f55d61f42
origin/main=6f6a5d64ae331517ffd8ddae4d31713f55d61f42
tracked_tree=clean
```

## NEW GIS service and listener

```text
ActiveState=active
SubState=running
UnitFileState=enabled
Result=success
MainPID=417155
NRestarts=0
```

The only port-8000 listener is:

```text
100.99.54.93:8000 -> python3 PID 417155
```

There is no `127.0.0.1:8000`, `0.0.0.0:8000`, or `[::]:8000` listener.

The effective unit is:

```text
WorkingDirectory=/root/local-files/handoff-runtime/cursor-coordinate-converter
ExecStartPre=/bin/bash -lc 'for i in {1..45}; do TS_IP=$(tailscale ip -4 2>/dev/null | head -n1); if [ -n "$TS_IP" ]; then exit 0; fi; sleep 1; done; echo "No Tailscale IPv4 available" >&2; exit 1'
ExecStart=/bin/bash -lc 'TS_IP=$(tailscale ip -4 2>/dev/null | head -n1); exec python3 -m http.server 8000 --bind "$TS_IP"'
Restart=on-failure
```

The process command line confirms `python3 -m http.server 8000 --bind 100.99.54.93`; no OLD identity is present in the effective unit or process.

## HTTP and reverse tailnet evidence

```text
GIS_LOCAL_HTTP=HTTP 200
NEW_TO_WORKSTATION_TAILSCALE_PING=pong, 47ms via direct path
```

The local request was made to the exact workstation URL path:

```text
http://100.99.54.93:8000/coordinate_converter%20Claude.html
```

The server-side/private qualification remains valid. The workstation-side TCP timeout is therefore not explained by GIS process failure or a missing listener.

## Host firewall and Tailscale netfilter

```text
UFW=inactive
HOST_FIREWALL_8000=NO_EXPLICIT_RULE
```

Relevant effective rules were bounded to the following:

- nftables filter `INPUT` policy is `accept`.
- nftables `ts-input` accepts traffic arriving on `tailscale0`; no port-8000 DROP/REJECT was present.
- iptables `INPUT` policy is `ACCEPT` and jumps to `ts-input`.
- iptables `ts-input -i tailscale0 -j ACCEPT`.
- ip6tables `INPUT` policy is `ACCEPT` and its `ts-input` accepts `tailscale0`.
- Docker DROP rules concern Docker bridge forwarding/container protection and do not target the host GIS listener on `100.99.54.93:8000`.
- No bounded `8000` DROP or REJECT rule was found.

The Tailscale-managed netfilter path therefore does not show a host-side drop for this traffic.

## Journal and invariants

The bounded last-hour GIS journal contained one `ConnectionResetError: [Errno 104]` and no bind failure, service exit, permission failure, or listener startup failure. This is not evidence of a GIS bind problem.

Production invariants remained unchanged:

```text
NEW n8n health=200
NEW published=4
NEW PostgreSQL=healthy
NEW n8n=running
GOI units=active/enabled
Serve=NONE
Funnel=NONE
advertised routes=NONE
OLD_CHANGED=NO
```

## Classification

```text
GIS_SERVICE_STATE=active/running/enabled, PID 417155, NRestarts=0
GIS_LISTENER_STATE=exact 100.99.54.93:8000; no alternate 8000 listener
GIS_LOCAL_HTTP=200
NEW_TO_WORKSTATION_TAILSCALE_PING=PASS
HOST_FIREWALL_8000=NO_EXPLICIT_RULE
GIS_CLIENT_PATH_ROOT_CAUSE=TAILSCALE_ACL_OR_POLICY_BLOCK
```

Given exact listener, local HTTP 200, reverse Tailscale ping PASS, and no host firewall DROP/REJECT, the remaining likely layer is the Tailscale ACL/policy or an equivalent tailnet client-path policy. ACLs were not inspected beyond host-side evidence and were not mutated automatically.
