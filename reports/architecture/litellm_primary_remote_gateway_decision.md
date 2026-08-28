# LiteLLM primary remote gateway — architecture decision

**Repository:** `mrhz1973/control-plane`  
**Decision date:** 2026-08-28  
**Status:** OPERATOR APPROVED — ARCHITECTURE DECISION  
**Decision owner:** Operator  
**Implementation track:** issue #31 `D-0025-W`

## Decision

LiteLLM is promoted to the **primary gateway for the remote-planner path** serving:

- GLM 5.3 via Z.AI Coding Plan;
- Codex via ChatGPT subscription OAuth (`chatgpt/gpt-5.6-sol`).

The canonical remote planner path becomes:

```text
planner selection
  -> LiteLLM primary remote gateway
  -> selected remote planner (GLM or Codex)
  -> emit_execution_packet
  -> canonical response/schema/policy gates
  -> Cursor bounded execution
```

## Preserved path

OpenClaw remains **installed and intact** as an existing/fallback broker path. This decision does not authorize uninstall, removal, destructive mutation, or forced retirement of OpenClaw.

## Deferred path

Qwen 3.8 37B remains `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH`. No Qwen load/start/download/inference is implied by this decision.

## Evidence basis

D-0024-W / issue #30 completed the comparison and runtime qualification:

- D-0023 offline portability and explicit LiteLLM alias binding PASS;
- GLM remote route reached runtime structural PASS using `planner-glm-pilot -> zai/glm-5.3` with explicit Coding Plan endpoint;
- Codex route reached HTTP 200 using `planner-codex-pilot -> chatgpt/gpt-5.6-sol`;
- Codex SSE response normalization PASS;
- exactly one `emit_execution_packet` function call;
- `hard_constraints` exact equality PASS;
- execution-packet schema PASS;
- canonical response gate PASS;
- canonical policy decision `PROCEED`;
- no secret exposure.

## Runtime status boundary

This architecture decision is **not** itself a production deployment or n8n routing mutation.

Subsequent integration must use bounded controlled passes. In particular:

- n8n live topology/routing changes require an exact GPT-Web-authored artifact/patch;
- one runtime action per gate remains canonical;
- no credential/OAuth/billing mutation is bundled into architecture promotion;
- no permanent LiteLLM service/autostart is implied until its own controlled implementation pass;
- no public exposure is implied.

## Planner budget retained

Current bounded validation budget after promotion:

- GLM: maximum 10 bounded inference calls available under the expanded authorization;
- Codex: maximum 10 bounded inference calls, 1 already used in the expanded budget, 9 remaining;
- retry: 0;
- planner fallback: 0;
- gateway fallback: 0;
- Qwen: 0 until separately resumed.

Budget availability does not require spending calls when deterministic/offline evidence is sufficient.

## WORK-PC remote-access invariant

TeamViewer continuity is a hard operational constraint. No controlled integration pass may autonomously change or restart:

- NIC/network adapters or NIC power management;
- IP/DHCP/DNS/routes/proxy;
- Windows Firewall;
- VPN/Tailscale;
- TeamViewer networking/service/config;
- Windows session through reboot/logoff/network-stack reset.

Any such need is a STOP/gate.

## Compatibility / rollback principle

Until the controlled n8n/runtime integration has been independently validated:

- preserve existing WF40/WF60/OpenClaw behavior;
- do not remove legacy/fallback paths;
- make the LiteLLM integration additive/reversible where technically possible;
- fail closed rather than silently route to an unverified provider/backend.

## Next implementation stage

Issue #31 Phase A synchronizes foundation/configuration and maps the exact current n8n integration point without live workflow mutation. GPT Web then authors the minimal workflow delta for a later controlled apply pass.
