# V4 Ollama / ChatGPT Desktop multi-model lane audit V1

## Result

- `TASK_REF=V4_OLLAMA_CHATGPT_DESKTOP_MULTI_MODEL_LANE_AUDIT_V1`
- `Classification=PASS`
- `BASE_HEAD=1fe1f1369b89f962a22a5a3eb554b7ebef80528f`
- `AUDIT_MODE=ANALYSIS_ONLY`
- `IMPLEMENTATION_PERFORMED=NO`
- `MODEL_TESTS=NO`
- `PROVIDER_INFERENCE=NO`
- `MODEL_INFERENCE_CALLS=0`
- `GLM_INFERENCE_CALLS=0`
- `CODEX_TARGET_INFERENCE_CALLS=0`
- `QWEN_INFERENCE_CALLS=0`
- `OLLAMA_CONFIGURATION_CHANGED=NO`
- `CHATGPT_CONFIGURATION_CHANGED=NO`
- `CONTROL_PLANE_ROUTING_CHANGED=NO`
- `HERMES_ARCHITECTURE_CHANGED=NO`
- `CHATGPT_WEB_ROUTE_CHANGED=NO`
- `NEXT=HUMAN_GATE_OLLAMA_DESKTOP_MULTI_MODEL_LANE_DECISION`

This is a documented capability audit only. It does not qualify a new lane,
alter the registry, authorize routing, or enable production execution.

## Scope and evidence method

The operator email received on 2026-09-11 was treated as a trigger, not as
authority. No account was opened, no authenticated browser was used, and no
prompt was sent to Qwen, GLM, Codex, Ollama Cloud, ChatGPT Web, or Hermes.

The official sources were read on 2026-09-11:

| Source | What it establishes |
|---|---|
| [Ollama v0.34.0 release](https://github.com/ollama/ollama/releases/tag/v0.34.0) | Announces use of Ollama models in ChatGPT Desktop; release prose says setup is available from the Ollama app on macOS. |
| [Ollama v0.34.0 `cmd/launch/codex_app.go`](https://raw.githubusercontent.com/ollama/ollama/v0.34.0/cmd/launch/codex_app.go) | Official implementation evidence for the ChatGPT integration: Windows and macOS support, loopback routing, combined native/Ollama catalog, and native account-control preservation. |
| [Ollama v0.34.0 Codex App integration](https://raw.githubusercontent.com/ollama/ollama/v0.34.0/docs/integrations/codex-app.mdx) | OpenAI desktop coding agent on macOS and Windows; Ollama endpoint with local and Ollama Cloud models; local/cloud examples; built-in browser and review mode. |
| [Ollama OpenAI compatibility](https://docs.ollama.com/api/openai-compatibility) | OpenAI-compatible chat/completions, Responses, vision, tools, reasoning, and model-list surfaces. |
| [Ollama API introduction](https://docs.ollama.com/api/introduction) | Local API at `http://localhost:11434/api`, remote Ollama Cloud API, and official libraries. |
| [Ollama Cloud](https://docs.ollama.com/cloud) | Cloud offload, Ollama account requirement for cloud models, direct-cloud API key semantics, and local-only mode. |
| [Ollama `glm-5.3`](https://ollama.com/library/glm-5.3) and [`glm-5.3-flash`](https://ollama.com/library/glm-5.3-flash) | Official GLM identities exposed by Ollama; the current library pages expose `:cloud` variants, hosted in US/Europe, with Ollama Cloud semantics. |
| [Ollama `gemma4`](https://ollama.com/library/gemma4) and [`qwen3.8`](https://ollama.com/library/qwen3.8) | Official examples of local model families and separate cloud/local catalog entries; context only, not a Control Plane qualification. |
| [OpenAI: moving to the new ChatGPT desktop app](https://help.openai.com/en/articles/20001276) | Chat, Work, and Codex are separate desktop views; Codex workflows/history remain separate from ChatGPT history. |
| [OpenAI: ChatGPT Windows app](https://help.openai.com/en/articles/9982051-using-the-chatgpt-windows-app) | Windows desktop availability and native model-picker/UI evidence; it does not prove that every externally supplied model inherits every ChatGPT tool. |

The official release prose is narrower than the tagged implementation and
integration document. The Windows classification below relies on the
feature-specific v0.34.0 source and document, not on generic Ollama Windows
availability.

## Local read-only metadata

Only non-sensitive workstation metadata was inspected:

```text
OLLAMA_INSTALLED=YES
OLLAMA_VERSION=0.33.3
OLLAMA_RUNNING_SERVER=NO
OLLAMA_MODEL_INVENTORY=NOT_OBSERVED
CHATGPT_DESKTOP_INSTALLED=YES (ChatGPT process observed)
CHATGPT_DESKTOP_VERSION=152.0.7977.83 (process file version)
CODEX_PROCESS=OBSERVED; VERSION=UNKNOWN
```

`ollama list` was read-only and could not obtain an inventory because no
running Ollama server was available; no model was downloaded, started, or
queried. The installed local version is below v0.34.0. `Get-AppxPackage`
returned no matching package row, while process metadata independently showed
the ChatGPT desktop process. No settings, auth files, browser storage,
tokens, cookies, or credentials were inspected.

## A — Real topology

| Component | Type / harness | Provider | Auth surface | Quota pool | Tools / UI | Where / programmatic access |
|---|---|---|---|---|---|---|
| ChatGPT Desktop | Desktop UI; contains Chat, Work, and Codex views | OpenAI for native surfaces; can display Ollama-provided catalog entries after Ollama configuration | Native ChatGPT account for native surfaces; Ollama-managed local bridge for Ollama models | Native ChatGPT plan for native calls; Ollama local compute or Ollama Cloud for Ollama calls; not automatically the repo Codex pool | UI tools are view/model/provider dependent; native Work/Codex has files, browser, repo, terminal/review evidence | Windows/macOS; UI is human-facing; no repo-native receipt API established |
| Codex Desktop view | OpenAI coding-agent harness/view, distinct from normal ChatGPT chat | OpenAI native or selected Ollama endpoint | Native account or Ollama-managed local bridge, depending selected model | Native account domain or Ollama domain; mapping to `chatgpt_codex_subscription` through Ollama is not proven | Built-in browser/review and repository workflows are documented for Codex App; selected-model inheritance remains bounded | Windows/macOS; desktop integration, not the existing Control Plane app-server adapter |
| Ollama | Local model runtime plus provider gateway/router | Ollama; model publisher remains distinct (for example Z.ai for GLM) | Local mode needs no commercial pool; cloud requires Ollama account; direct cloud API uses `OLLAMA_API_KEY` | Local compute or `ollama_cloud`; no evidence of Z.ai GLM plan or OpenAI Codex subscription reuse | OpenAI-compatible tools, vision, reasoning, chat/completions and Responses surfaces | Workstation loopback `11434`; official API is programmatic, but no Control Plane adapter is added here |
| Qwen canonical | Local model behind local router and OpenCode harness | `local_llama_cpp` | `local_runtime` | None; local unmetered semantics | Existing repo-qualified local harness/file/code path, subject to current gates | `qwen_runtime_router.py` → `http://127.0.0.1:8080` |
| GLM suite | Model family; candidate Ollama lane | Z.ai model identity through Ollama interface for `:cloud` entries | Ollama account for cloud interactive use; direct remote API key semantics; exact Desktop auth path not proven | Ollama Cloud for `:cloud`; local compute only if a local GLM artifact is separately present; existing `glm_coding_plan` is not implied | Official GLM pages advertise tools/vision/agentic coding; ChatGPT Desktop tool inheritance is not proven | Ollama local API or cloud; no governed Control Plane route |
| GPT / Codex native | Provider-managed OpenAI models and Codex subscription capability | OpenAI | Native ChatGPT/Codex subscription auth for qualified native surfaces | The repo’s `chatgpt_codex_subscription` pool applies to `codex_ide_cursor_extension` and `codex_external_planner`; Ollama overlay reuse is not proven | Native Codex files/repo/terminal/browser/review surface is distinct from normal ChatGPT chat | Existing app-server route is programmatic and separately qualified; Ollama Desktop path is not wired |
| Hermes | Orchestrator / bridge | Route-dependent | Existing governed surfaces | Existing route semantics | Bridge/orchestration only; not a model replacement | Existing `HERMES_ROLE=ORCHESTRATORE_BRIDGE`; unchanged |
| ChatGPT Web | Hosted web surface | OpenAI | `chatgpt_web_session` | Separate/unverified in registry | Separate web UI | `chatgpt_web_via_hermes`; unchanged |
| Cursor / OpenCode | Cursor harness / local development harness | Cursor or local Qwen according to surface | Existing repo-governed auth | Existing registry semantics | Files, terminal and code-edit capability according to harness | Existing Control Plane surfaces; unchanged |

## B — Qwen baseline

The current canonical Qwen path is not Ollama:

```text
QWEN_CANONICAL_RUNTIME=llama-server behind qwen_runtime_router.py
QWEN_CANONICAL_ENDPOINT=http://127.0.0.1:8080
QWEN_OLLAMA_DEPENDENCY=NO
```

The repo-owned `qwen-local-runtime.json` names `multi_model_router`, the
normal and DCFR `llama-server.exe` identities, exact profile selection through
`:8080`, and `OpenCode` as the local harness. The six-profile policy and the
role-qualification overlay remain unchanged. Qwen exposed through Ollama or
ChatGPT Desktop would be a separate candidate surface and must not be merged
with `qwen_local`.

## C — Ollama v0.34 feature findings

| Question | Classification | Finding |
|---|---|---|
| Exact feature/version | `SUPPORTED_BY_OFFICIAL_DOCS` | v0.34.0 release: use Ollama models in ChatGPT Desktop; tagged source calls the integration `chatgpt`/Codex App. |
| Windows support for this feature | `PROVEN_SUPPORTED` | The v0.34.0 integration document names macOS and Windows, and the tagged implementation accepts `darwin` and `windows`, discovers Windows ChatGPT/Codex installations, and opens/restarts the app. |
| macOS support | `PROVEN_SUPPORTED` | Release, integration document, and implementation support macOS. |
| Linux support for this feature | `NOT_SUPPORTED` | The feature-specific implementation rejects operating systems other than macOS and Windows; this does not mean generic Ollama Linux support is absent. |
| Configuration mechanism | `SUPPORTED_BY_OFFICIAL_DOCS` | Ollama launch configuration builds a loopback router/catalog, writes ChatGPT configuration, preserves/restores state, and may restart the desktop app. This was not executed. |
| Protocol/provider interface | `PROVEN` | Ollama OpenAI-compatible interface; the tagged integration uses an Ollama loopback router and the API documents chat/completions, Responses, tools, vision, and reasoning fields. |
| Local models | `PROVEN` | Official Codex App document uses `gemma4:31b`; Ollama model pages document local Gemma/Qwen entries. Exact availability still depends on the local catalog and hardware. |
| Cloud models | `PROVEN` | Official document uses `kimi-k2.6:cloud`; Ollama Cloud documents offload and account requirements. GLM pages expose `glm-5.3:cloud` and `glm-5.3-flash:cloud`. |
| Maximum five models | `NOT_DOCUMENTED` | The source accepts a model list and creates a combined catalog, but no official maximum of five was found. The email claim is not treated as authority. |
| Web search | `UNKNOWN` for an Ollama-selected model | ChatGPT/Codex UI has browser/web surfaces, but the official Ollama integration evidence does not prove web-search entitlement for every selected external model. |
| Plugins | `UNKNOWN` for an Ollama-selected model | UI/plugin availability is not equivalent to selected-model/provider capability; no model-specific inheritance proof was found. |
| Computer use | `UNKNOWN` for an Ollama-selected model | The GLM page describes computer-use training, and OpenAI documents desktop computer/browser features, but this does not prove an Ollama-selected model can invoke the same UI capability. |
| Files/GitHub/repository tools | `PARTIAL` | Codex App documents repository/files/review workflows; Ollama itself exposes programmatic API surfaces. End-to-end selected-model authorization and receipts are not proven. |

The feature is therefore real and Windows-capable at the official product
level, but the desktop integration is a user-facing configuration seam, not a
Control Plane qualification.

## D — GLM suite through Ollama / ChatGPT Desktop

### Model and provider identity

The official Ollama library pages identify `glm-5.3` and
`glm-5.3-flash` as Z.ai models and currently expose their `:cloud` entries.
Those pages show Ollama Cloud hosting and the Ollama API examples. This proves
Ollama access to the GLM identities, not access to the repository’s Z.ai plan.

```text
GLM_OLLAMA_ACCESS_SURFACE=PROVEN
GLM_QUOTA_POOL=ollama_cloud for the documented :cloud entries
GLM_EXISTING_CODING_PLAN_REUSE=NOT_PROVEN
GLM_API_REQUIRED=UNKNOWN for the Desktop path
GLM_CHATGPT_DESKTOP_TOOLS=UNKNOWN
GLM_OLLAMA_DESKTOP_LANE=NOT_PROVEN (not Control Plane-qualified)
```

The quota separation is strict:

- `glm_coding_plan` is the repo registry pool for the Z.ai plan and is shared
  by `glm-5.3` and `glm-5.3-flash` on the existing approved surfaces.
- `ollama_cloud` is the Ollama-hosted cloud domain. Cloud model use requires
  an Ollama account; direct `ollama.com` API access additionally uses an
  Ollama API key.
- A local GLM artifact, if separately installed and supported by Ollama, would
  be local compute; no local GLM artifact was inspected or started here.

No official source connects the Ollama GLM path to the existing
`glm_coding_plan` allowance, Z.ai account, or its current Cursor/BYOK surface.
The existing plan therefore cannot be reused by implication. The exact
ChatGPT Desktop tool behavior for a selected GLM model also remains
`UNKNOWN`; the model-page capability tags are not an end-to-end UI proof.

## E — GPT / Codex suite findings

### What Ollama actually exposes

Ollama exposes Ollama model identities through an OpenAI-compatible local or
Ollama Cloud interface. The official Cloud documentation uses `gpt-oss` as an
Ollama cloud model; this is not evidence that Ollama supplies native OpenAI
GPT models or native Codex subscription calls.

The v0.34.0 source shows the Desktop integration adding Ollama models to the
native catalog through a loopback router. It deliberately preserves native
ChatGPT account controls. Therefore the app can present native and Ollama
catalog entries together, but the selected entry determines which upstream
surface is used.

```text
CODEX_DESKTOP_SUBSCRIPTION_LANE=NOT_PROVEN
CODEX_SUBSCRIPTION_QUOTA_REUSE=NOT_PROVEN
CODEX_API_REQUIRED=NOT_PROVEN for the Ollama Desktop overlay
```

This means:

1. Native OpenAI GPT/Codex selection remains a native account-controlled
   surface and is distinct from Ollama-provided models.
2. Ollama-provided models use the Ollama local/cloud route; they are not
   proven to consume `chatgpt_codex_subscription`.
3. Native Codex subscription quota can remain available for native Codex
   calls, but the three-part requirement `CODEX_API_BILLING=NO`,
   `CODEX_BYOK=NO`, `CODEX_SUBSCRIPTION_QUOTA=YES` is not proven for an
   Ollama-selected model in ChatGPT Desktop.
4. The repository’s already-qualified Codex subscription app-server route is
   separate and remains unchanged. Its pool is bound in `registry.json` to
   `codex_ide_cursor_extension` and `codex_external_planner`, not to a new
   Ollama Desktop surface.
5. The Codex view remains distinct from ordinary ChatGPT Chat/Work history and
   workflow semantics, as documented by OpenAI.

### Programmatic and governed access

Ollama is programmatically addressable through its documented local API and
OpenAI-compatible endpoints. That makes an Ollama lane technically callable,
but does not supply the Control Plane properties that are required before
qualification: governed route identity, admission/authorization, receipts,
quota observation, stale-state handling, and a fail-closed production gate.

The native ChatGPT Desktop UI is human-facing in this repository. The current
programmatic Codex subscription surface is the separately qualified
app-server/external-planner path. No adapter, selector, router, quota pool, or
receipt contract was added by this audit.

## F — Tool and capability boundaries

| Lane | Web search | Plugins | Computer use | Files / GitHub | Terminal / code execution | Evidence boundary |
|---|---|---|---|---|---|---|
| Qwen canonical | `PARTIAL` through existing harnesses, not re-tested | `UNKNOWN` | `UNKNOWN` | `YES` through existing OpenCode/Control Plane semantics | `YES` through existing governed local path, no new execution | Repo-qualified baseline; no new model call |
| Qwen via Ollama/Desktop | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | `PARTIAL` at UI/API level | `UNKNOWN` | Ollama API is documented; selected-model Desktop inheritance is not |
| GLM via Ollama/Desktop | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | `PARTIAL` at UI/API level | `PARTIAL` at provider/application level | GLM page advertises tools/agentic coding; Desktop-to-tool proof absent |
| Codex subscription / native Codex | `PARTIAL`/`YES` according to native Codex surface | `UNKNOWN` | `PARTIAL`/`YES` according to native Codex surface | `YES` | `YES` | OpenAI/Ollama Codex App docs plus existing repo qualification; live quota collector remains absent |
| GPT native ChatGPT Desktop | `YES` at Chat/Work UI level | `PARTIAL` and plan/workspace dependent | `PARTIAL` and permission dependent | `PARTIAL` across Chat/Work/Codex views | `YES` in Codex view, not ordinary Chat | UI evidence does not transfer automatically to external models |

The safe rule is: a capability documented for the desktop UI, a selected
model, a provider protocol, and the Codex harness are four different claims.
This audit only promotes a claim when its evidence reaches the relevant
boundary.

## G — Control Plane usability matrix

Values are `YES`, `NO`, `PARTIAL`, or `UNKNOWN`; they are suitability findings,
not implementation authorization.

| Candidate lane | Human interactive | Programmatic | Automatable | Unattended | Tool capable | File edit | Code execution | Browser | Observable | Receipt capable | Quota observable | Fail-closed possible |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Qwen canonical | YES | YES | YES | PARTIAL | YES | YES | YES | PARTIAL | YES | YES | YES (local/no commercial pool) | YES |
| Qwen via Ollama/Desktop | YES | PARTIAL | UNKNOWN | UNKNOWN | PARTIAL | UNKNOWN | UNKNOWN | UNKNOWN | PARTIAL | NO current contract | UNKNOWN | YES in a future governed adapter |
| GLM via Ollama/Desktop | YES | YES at Ollama API | UNKNOWN | UNKNOWN | PARTIAL | UNKNOWN | UNKNOWN | UNKNOWN | PARTIAL | NO current contract | UNKNOWN | YES in a future governed adapter |
| Codex subscription / native app-server | YES | YES | YES | PARTIAL | YES | YES | YES | YES | PARTIAL | YES | NOT_PROVIDED_BY_SOURCE | YES |
| GPT native ChatGPT Desktop | YES | UNKNOWN | UNKNOWN | UNKNOWN | PARTIAL | PARTIAL | PARTIAL | YES | PARTIAL | NO current contract | UNKNOWN | UNKNOWN |

The `YES` for an Ollama API is only API reachability/programmatic surface
evidence. It is not a claim that the Control Plane may call it, nor that
desktop calls generate governed receipts.

## H — Use-case and convenience comparison

No benchmark or model-quality claim was made. `MORE_CONVENIENT` below is only
about setup/UI/friction for the named human use case; otherwise the result is
`UNKNOWN` because this audit did not run the lane.

| Use case | Qwen canonical | Qwen via Ollama/Desktop | GLM via Ollama/Desktop | Codex subscription / Desktop | GPT native ChatGPT Desktop |
|---|---|---|---|---|---|
| Coding | `PROVEN baseline` | `UNKNOWN` | `UNKNOWN` | `MORE_CONVENIENT` for native repo workflow; subscription reuse via Ollama `NOT_PROVEN` | `MORE_CONVENIENT` in Codex view; not a new Control Plane route |
| Planning | `PROVEN baseline` | `UNKNOWN` | `UNKNOWN` | `MORE_CONVENIENT` for native Codex planning; current repo route remains separate | `MORE_CONVENIENT` for human Chat/Work planning |
| Review | `PROVEN baseline` | `UNKNOWN` | `UNKNOWN` | `MORE_CONVENIENT` in documented review mode; no new route | `UNKNOWN` outside Codex view |
| Quick reasoning | `PROVEN baseline` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | `MORE_CONVENIENT` as a native desktop chat UI |
| Long context | `PROVEN policy metadata; no new benchmark` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` without live account/model evidence |
| Local privacy | `MORE_CONVENIENT` for the existing local path | `UNKNOWN` pending a supported local setup and qualification | `UNKNOWN` for exact local GLM artifact | `LESS_CONVENIENT` when using cloud/native upstream | `LESS_CONVENIENT` for local-only privacy |
| Offline capability | `MORE_CONVENIENT` for local compute | `UNKNOWN` | `UNKNOWN` | `LESS_CONVENIENT` | `LESS_CONVENIENT` |
| Tools/plugins/computer use | `PROVEN only at existing harness boundary` | `UNKNOWN` | `UNKNOWN` | `MORE_CONVENIENT` for documented Codex browser/review workflow | `MORE_CONVENIENT` for native UI, subject to plan/permission |
| File editing / GitHub | `MORE_CONVENIENT` through existing OpenCode path | `UNKNOWN` | `UNKNOWN` | `MORE_CONVENIENT` for native Codex repo workflow | `MORE_CONVENIENT` in Codex view, not ordinary Chat |
| Unattended execution | `PARTIAL` under existing gates | `UNKNOWN` | `UNKNOWN` | `PARTIAL` under existing governed app-server controls | `UNKNOWN`/not governed here |
| Cost/quota domain | `LOCAL_COMPUTE / none` | Ollama local or `ollama_cloud` | Ollama local/cloud; not `glm_coding_plan` by implication | `chatgpt_codex_subscription` only on existing qualified surfaces | Native ChatGPT plan, not automatically the Codex pool |
| Windows usability | `PROVEN` locally/repo-wise | `PROVEN_SUPPORTED` at Ollama feature level; local install below v0.34 | `PROVEN` at Ollama library level, Desktop lane not qualified | `PROVEN` for separate native surface; no Ollama quota proof | `PROVEN` native desktop availability |
| Control Plane integration suitability | `PROVEN` baseline | `UNKNOWN / future candidate` | `UNKNOWN / future candidate` | `PROVEN` only for existing app-server/external-planner path | `UNKNOWN` for direct desktop control |

These are case-specific convenience statements, not an absolute ranking. The
potentially easier human UI for GLM or native Codex does not authorize a new
automated lane.

## I — Quota map

| Lane | Access surface | Auth | Quota pool | Billing domain | Observability | Evidence |
|---|---|---|---|---|---|---|
| Qwen local compute | `opencode_local_harness` + Qwen router | `local_runtime` | None / local unmetered | Workstation compute | Router/resource status; no commercial reset | Repo `registry.json`, Qwen runtime/policy |
| GLM Coding Plan | `glm_coding_plan_client` / existing Cursor BYOK surface | `glm_coding_plan` | `glm_coding_plan` | Z.ai plan; no inferred API billing | Static pool; live collector absent | Repo `registry.json` and GLM translator report |
| GLM via Ollama `:cloud` | Ollama local gateway to Ollama Cloud, or direct Ollama Cloud API | Ollama account; direct cloud API uses `OLLAMA_API_KEY` | `ollama_cloud` (classification for this audit) | Ollama Cloud | Not in current Control Plane registry/collector | Official Ollama Cloud + GLM library pages |
| ChatGPT native | ChatGPT Desktop native surface | ChatGPT account | Native ChatGPT plan | OpenAI ChatGPT plan | Account/UI dependent | OpenAI desktop documentation |
| Codex subscription | `codex_ide_cursor_extension` / `codex_external_planner` | ChatGPT subscription | `chatgpt_codex_subscription` | Included subscription allowance; excludes OpenAI API/BYOK | Static registry; live quota collector absent | Repo `registry.json`, Hermes dynamic router docs |
| Ollama Desktop overlay | ChatGPT/Codex Desktop combined catalog plus Ollama loopback router | Native account for native entries; Ollama bridge/account for Ollama entries | Per selected upstream; no single merged pool | Native OpenAI plan or Ollama local/cloud | No current Control Plane observer/receipt | Official tagged Ollama source/docs; no repo integration |
| OpenAI API | `openai_api_route` | API key | None in this Control Plane | API billing | Forbidden | Repo registry explicitly forbids it |

No quota values, reset times, pool ownership, or API billing semantics were
invented.

## J — Hermes invariants

```text
HERMES_ARCHITECTURE_CHANGED=NO
HERMES_ROLE=ORCHESTRATORE_BRIDGE
CHATGPT_WEB_ROUTE_CHANGED=NO
HERMES_RETIREMENT_CANDIDATE=NO
HERMES_REPLACEMENT_ANALYSIS=OUT_OF_SCOPE
```

Ollama/ChatGPT Desktop is an additional candidate desktop surface. It is not
a replacement, reduction, or re-evaluation of Hermes → ChatGPT Web. The
existing `chatgpt_web_via_hermes` route and Phase D state remain unchanged.

## K — Findings and classifications

| Finding | Classification | Basis |
|---|---|---|
| Ollama v0.34 has a ChatGPT Desktop integration | `SUPPORTED_BY_OFFICIAL_DOCS` | v0.34.0 release and tagged integration source/document |
| The feature supports Windows | `PROVEN` | v0.34.0 tagged source and integration document explicitly cover Windows |
| The installed workstation is ready for this feature | `NOT_SUPPORTED` | Local Ollama is 0.33.3; no configuration or upgrade was performed |
| Qwen canonical runtime is Ollama | `NOT_SUPPORTED` | Repo authorities identify llama-server plus local router at `127.0.0.1:8080` |
| GLM identities are available through Ollama | `PROVEN` | Official GLM library pages and API examples |
| GLM through Ollama consumes the existing `glm_coding_plan` | `NOT_SUPPORTED` as an assumption / `NOT_PROVEN` as a governed claim | No source connects Ollama Cloud to the repo Z.ai plan |
| Ollama supplies native OpenAI GPT/Codex subscription calls | `NOT_PROVEN` | Official docs describe Ollama models/OpenAI-compatible protocol, not native OpenAI entitlement |
| Native and Ollama entries can coexist in the Desktop catalog | `PROVEN` at official implementation level | Tagged source writes a combined catalog and preserves native account controls |
| Ollama overlay reuses `chatgpt_codex_subscription` | `NOT_PROVEN` | No auth/quota binding or receipt evidence |
| Ollama API is programmatically callable | `PROVEN` | Official local/OpenAI-compatible API documentation |
| Ollama API is already a governed Control Plane lane | `NOT_SUPPORTED` | No adapter, selector, receipt, quota observer, or authorization was added |
| Hermes should be replaced by Desktop integration | `NOT_SUPPORTED` | Explicitly outside scope and contrary to current canonical architecture |

## L — Decision table

| Resource | Can affiancare Qwen? | Auth | Quota | Tools | Windows | Control Plane suitability | Evidence grade |
|---|---|---|---|---|---|---|---|
| Qwen canonical | `YES — existing` | local runtime | local compute / none | existing OpenCode boundary | `YES` | `PROVEN baseline` | `PROVEN / repo` |
| Qwen via Ollama/Desktop | `POSSIBLE, not qualified` | Ollama local/cloud surface | Ollama local/cloud | selected-model inheritance unknown | `PROVEN_SUPPORTED` feature-level | `UNKNOWN / future candidate` | `SUPPORTED_BY_OFFICIAL_DOCS`, no CP proof |
| GLM suite via Ollama/Desktop | `POSSIBLE, not qualified` | Ollama account for cloud; exact Desktop path unknown | `ollama_cloud` for documented `:cloud`; not existing GLM plan | `UNKNOWN` at Desktop boundary | feature-level support, lane not qualified | `UNKNOWN / future candidate` | `PROVEN` Ollama access; Desktop lane `NOT_PROVEN` |
| Codex subscription suite | `YES — separate native/app-server lane` | ChatGPT subscription | `chatgpt_codex_subscription` on existing qualified surfaces | `YES` on qualified Codex harness | `YES` | `PROVEN` only existing route; Ollama reuse `NOT_PROVEN` | `PROVEN / repo + official docs` |
| GPT native ChatGPT Desktop | `YES — human UI alternative` | native ChatGPT account | native ChatGPT plan | UI/plan dependent | `PROVEN` | `UNKNOWN` for direct CP control | `SUPPORTED_BY_OFFICIAL_DOCS` |

Other email-mentioned models are context only. Their presence in the Ollama
library would not qualify a Control Plane lane or prove tool/quota semantics.

## M — Explicit answers for the operator

1. **Can GLM be placed beside Qwen in this lane?** Yes as a possible separate
   human/Ollama surface; no as a newly qualified Control Plane lane.
2. **Can it use the GLM plan already present?** Not proven. The existing
   `glm_coding_plan` and Ollama Cloud are separate quota domains.
3. **Can Codex be placed beside Qwen?** Yes as the existing native Codex
   subscription/app-server capability, separate from Qwen and separate from
   the Ollama overlay.
4. **Can it consume Codex subscription quota without API/BYOK?** The existing
   qualified Codex surface does. The Ollama-selected Desktop model path does
   not prove that triple requirement, so `CODEX_DESKTOP_SUBSCRIPTION_LANE` and
   `CODEX_SUBSCRIPTION_QUOTA_REUSE` remain `NOT_PROVEN`.
5. **Which cases are concretely easier?** Native Codex/Desktop is more
   convenient for human repository work and review; native ChatGPT Desktop is
   more convenient for human Chat/Work interaction. These are UI/setup
   observations, not performance claims. GLM/Qwen-through-Ollama convenience
   remains unqualified on this Windows workstation.
6. **What stays identical?** Qwen’s canonical router/runtime, registry pools,
   Hermes role, ChatGPT Web route, Phase D status, production routing gates,
   and all existing receipt/authorization boundaries.
7. **What is not proven?** GLM plan reuse, Codex subscription quota reuse by
   Ollama, selected-model inheritance of web search/plugins/computer use,
   end-to-end receipts/quota observation, unattended Control Plane invocation,
   and the email’s maximum-five-model claim.
8. **Possible future test only:** after a human decision and a separately
   authorized implementation task, install/use a supported Ollama version in
   an isolated Windows profile, configure one harmless local model and one
   Ollama Cloud model in the Desktop catalog, verify native catalog restoration,
   capture provider/auth/quota boundaries without secrets, and run one
   non-production no-side-effect API/receipt probe. This test was not run and
   is not authorized by this audit.

## Persistence and hard-wall record

Only this report plus the two canonical runtime documents were eligible for
the PASS commit. No `configs/`, `tools/`, `tests/`, registry, dispatcher,
planner, selector, n8n, Tailscale, Hermes, Ollama, ChatGPT, Codex, GLM, Qwen,
Windows Scheduled Task, VPS, browser, or provider state was changed. The
previous benchmark STOP residue at commit `1fe1f1369b89f962a22a5a3eb554b7ebef80528f`
was read-only preserved and was not used as Ollama/Desktop capability proof.
