# Foundation status

**Updated:** 2026-08-25  
**Aligned to:** [PROJECT_VISION](PROJECT_VISION.md) v3.0  
**Status role:** compact foundation/migration index — **NOT runtime source of truth**

---

## 0. Authority

| Document | Role |
|---|---|
| [CURRENT_FRONTIER.md](../runtime/CURRENT_FRONTIER.md) | **Runtime state authority**: gates, workflow state, PM-34/L5, next real runtime gate |
| [PROJECT_VISION.md](PROJECT_VISION.md) | **Foundation authority**: architecture and invariants |
| [MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md](MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md) | Detailed v3 target accepted 2026-08-25; docs/design only |
| `FOUNDATION_STATUS.md` | Compact compatibility/index document only |

Do not reconstruct current runtime from this file.

---

## 1. Foundation v3 target

```text
GPT Web
  ↓ Backlog Item
GitHub
  ↓
n8n
  ↓
OpenClaw broker
  ↓
Qwen 3.8 37B | GLM 5.3 | Codex OAuth
  ↓ Execution Packet
n8n deterministic gate
  ↓
Cursor bounded execution loop
  ↓
Bugbot review
  ↓
GitHub
```

Roles:

- **GPT Web** = strategic orchestrator + backlog owner;
- **GitHub** = source of truth + context continuity;
- **n8n** = workflow/policy/gate;
- **OpenClaw** = provider/auth/quota broker;
- **Qwen / GLM / Codex** = planner/prompt generators;
- **Cursor** = execution harness;
- **Bugbot** = reviewer;
- **Telegram** = human gate;
- **Tailscale** = private transport to local node where required.

---

## 2. Current v3 contracts

| Contract | Role |
|---|---|
| [backlog-item-v1.md](../contracts/backlog-item-v1.md) | GPT Web strategic work object |
| [planner-routing-policy-v1.md](../contracts/planner-routing-policy-v1.md) | semantic preference + provider state + deterministic fallback policy |
| [execution-packet-v1.md](../contracts/execution-packet-v1.md) | planner → Cursor implementation contract |
| [execution-checkpoint-v1.md](../contracts/execution-checkpoint-v1.md) | Cursor context rollover/resume state |
| [CURSOR_PROMPT_TEMPLATE.md](CURSOR_PROMPT_TEMPLATE.md) | Cursor execution/preflight/loop/report contract |

These contracts are design/foundation artifacts. They do not authorize runtime by themselves.

---

## 3. Context-window continuity

Foundation v3 makes context rollover a first-class requirement.

### GPT Web

- `handoff ora` remains the manual kill switch;
- 20 user prompts remain the historical hard ceiling;
- early handoff is required when context quality degrades;
- new chat reads live GitHub state.

### Planner

A new Codex/GLM/Qwen planner session reads Backlog Item + relevant repo state + packet/checkpoint, not the old planner transcript.

### Cursor

An incomplete session persists an Execution Checkpoint before rollover. The next Cursor session resumes from:

```text
Execution Packet + latest Execution Checkpoint + live Git state
```

---

## 4. Historical evidence retained

The following evidence remains useful as historical proof of components already explored/tested. It must not be confused with the current v3 target or with current runtime authorization.

| Layer | Historical evidence status | Meaning in v3 |
|---|---|---|
| Tailscale VPS ↔ Ryzen | PASS | private transport evidence retained |
| Cursor Agent CLI install/auth smoke | PASS | prior Cursor harness evidence retained; current `/goal`/`/loop` track still requires dedicated current-version verification |
| Ollama/Qwen classifier API | PASS | old classifier track retained as evidence; **not** mandatory v3 routing layer |
| OpenClaw gateway loopback | PASS (manual) | broker/gateway evidence retained; current provider capabilities must be re-verified |
| OpenClaw agent Step A | historical BLOCKED on old provider-key path | **not a current architectural conclusion**; v3 explicitly reopens OpenClaw as broker with Codex OAuth/GLM/local provider verification |
| Codex CLI OAuth/manual path | prior PASS evidence | Codex remains planner candidate; v3 routes it through the broker target when verified |
| Codex artifact → Cursor manual cycle | PASS evidence | proves planner-artifact → implementer pattern, now generalized to Execution Packet |
| Workflow 42 Telegram diff summary | prior PASS/active evidence | current state must still be read from CURRENT_FRONTIER |

Historical session logs and PM documents are evidence, not forward authority.

---

## 5. What v3 explicitly supersedes

The following statements from older foundation snapshots are **superseded as target architecture**:

1. `Codex CLI direct path is the only/default model path`;
2. `OpenClaw is only optional backlog/transport and not in model path`;
3. `Ollama classifier is a mandatory step between planner and Cursor`;
4. `GLM is foundation-wide read-only advisor only`;
5. `Cursor receives prompts only from one Codex planner`;
6. `context rollover is mainly a 20-turn GPT handoff concern`.

They remain valid only as historical descriptions of the phase in which they were written.

---

## 6. What does NOT change automatically

Foundation v3 does not itself authorize or change:

- PM-34 / `n8n_ready`;
- L5 state or authorization;
- permanent schedule/loop;
- production workflow mutation;
- public webhook / Telegram Trigger;
- credentials/provider runtime configuration;
- runtime activation of OpenClaw/Codex/GLM/Qwen;
- Bugbot integration;
- Cursor autonomous production loop.

Read exact values from `CURRENT_FRONTIER.md`.

---

## 7. Migration backlog

Authoritative migration tracker: **GitHub issue #8 — `Architecture migration — multi-planner → Cursor bounded loop`**.

Current docs/design sequence:

- [x] persist accepted operating model;
- [x] create Backlog Item contract;
- [x] create planner routing policy;
- [x] create Execution Packet contract;
- [x] create Execution Checkpoint contract;
- [x] consolidate PROJECT_VISION v3;
- [x] adapt Cursor prompt contract to packet/checkpoint model;
- [ ] verify current OpenClaw provider capabilities on the installed runtime;
- [ ] planner smoke tests (Qwen / GLM / Codex), read-only;
- [ ] verify GLM BYOK as Cursor main Agent/custom subagent where supported;
- [ ] verify current Cursor bounded `/goal` + `/loop` behavior;
- [ ] verify Bugbot review without automatic cloud Autofix;
- [ ] only after evidence, design/authorize runtime wiring.

---

## 8. Stable safety boundaries

- GitHub remains source of truth.
- GPT Web/GPT-B remains authoritative n8n workflow author.
- Cursor does not autonomously redesign `workflows/**`.
- Production workflows are never silently mutated.
- Human decisions use direct operator provenance and Decision Packets.
- Destructive/credential/billing/runtime/permanent automation changes remain real gates.
- Fallback must be graceful and recoverable from GitHub.

---

**Entry point:** [PROJECT_VISION.md](PROJECT_VISION.md)  
**Runtime state:** [CURRENT_FRONTIER.md](../runtime/CURRENT_FRONTIER.md)
