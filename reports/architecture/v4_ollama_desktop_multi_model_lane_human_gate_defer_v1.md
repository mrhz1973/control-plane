# V4 Ollama Desktop multi-model lane — Human Gate defer V1

## Decision record

```text
TASK_REF=V4_OLLAMA_DESKTOP_MULTI_MODEL_LANE_HUMAN_GATE_DEFER_V1
BASE_HEAD=cfeca3b95e5f46fe664ed50b8708a52e94016178
DECISION=DEFER_DOCUMENTED_ONLY
OLLAMA_DESKTOP_IMPLEMENTATION=NO
OLLAMA_DESKTOP_ROUTING=NO
OLLAMA_DESKTOP_QUALIFICATION=NO
AUDIT_PRESERVED=YES

QWEN_CANONICAL_CHANGED=NO
GLM_ROUTE_CHANGED=NO
CODEX_ROUTE_CHANGED=NO
HERMES_ARCHITECTURE_CHANGED=NO
CHATGPT_WEB_ROUTE_CHANGED=NO

OLLAMA_DESKTOP_HUMAN_GATE=RESOLVED
OLLAMA_DESKTOP_DECISION=DEFER_DOCUMENTED_ONLY
OLLAMA_DESKTOP_IMPLEMENTATION_AUTHORIZED=NO
OLLAMA_DESKTOP_FUTURE_CANDIDATE=YES
IMPLEMENTATION_PERFORMED=NO
CONTROL_PLANE_ROUTING_CHANGED=NO
ISSUE_73_PHASE_C=PASS
PHASE_D=OPEN
NEXT=V4_HERMES_PHASE_D_CONTEXT_ROLLOVER_STALE_GENERATION_FENCE_V1
```

The operator decision is to defer the Ollama / ChatGPT Desktop multi-model
capability as documented-only. The preceding analysis remains the preserved
reference at
`reports/architecture/v4_ollama_chatgpt_desktop_multi_model_lane_audit_v1.md`.
No new lane is implemented, selected, qualified, or promoted.

## Operator practice recorded as context only

The current human practice is:

- use GLM when it is available and eligible;
- when GLM is exhausted or ineligible during 08:00–12:00 Europe/Rome, use
  Codex App / Codex subscription as the human operational fallback;
- Cursor remains a separate available harness/executor, but is not the normal
  human fallback for that condition.

This practice is not automatic routing, does not alter quota policy, and does
not authorize any dispatcher, provider, or runtime change in this task.

## Preserved state and next frontier

`ISSUE_73_PHASE_C=PASS` and `PHASE_D=OPEN` remain unchanged. The next real
Control Plane work is:

```text
V4_HERMES_PHASE_D_CONTEXT_ROLLOVER_STALE_GENERATION_FENCE_V1
```

Hermes remains `ORCHESTRATORE_BRIDGE`, and the Hermes → ChatGPT Web route is
unchanged. The Ollama Desktop audit is not a Hermes replacement analysis.

## Hard-wall and persistence record

This was a repository-only governance persistence delta. No model inference,
provider call, browser automation, ChatGPT Web send, Ollama/ChatGPT/Codex/GLM/
Qwen/Hermes change, routing change, registry change, dispatcher or n8n action,
VPS/Tailscale mutation, or production dispatch occurred. Only this decision
record and the two canonical runtime documents are in scope for the PASS
commit.
