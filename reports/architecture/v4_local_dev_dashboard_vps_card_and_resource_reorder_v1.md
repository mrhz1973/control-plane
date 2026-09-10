# V4 Local Dev dashboard VPS card and resource reorder V1

## Classification

`PASS`

## Scope

- `BASE_HEAD=4ef484ad030433ac1ba35d63c106cc17ec5e4146`
- Repository-only dashboard and read-only resource observability delta.
- No dispatcher, routing, queue, quota authority, or production semantics changed.

## Result

The Resources panel now renders exactly six stable resource cards in the
canonical default order:

`workstation → vps → qwen → glm → codex → cursor`

The visible `NEW VPS` label is `VPS`. Its card follows the workstation card
pattern with bounded read-only main state, CPU/RAM/swap/disk bars, and safe
details for observed identity, operating system, kernel, vCPU count, uptime,
load, memory, root filesystem, private Tailscale address/MagicDNS hint, and
bounded service observations. Missing values remain unknown rather than being
invented. The CPU bar remains unknown when the collector has no CPU percentage.

ChatGPT Web remains available in the backend resource envelope and registry
semantics, but its card is removed from the main Resources row as requested.

All six cards expose stable IDs and a keyboard-labelled drag handle. Browser
localStorage stores the order only in
`local-dev-dispatcher-dashboard-v1:resource-order`; stale IDs (including the
legacy `chatgpt_web`) are ignored, future IDs are preserved when present in the
known canonical set, and reset restores the six-card canonical order. Existing
details are preserved because reorder moves the existing DOM nodes.

## Validation evidence

- `node tests/local-dev-dispatcher-service-v1/run.mjs` → `69/69 PASS`
- `node tests/local-dev-resource-observability-integrity-v1/run.mjs` → `7/7 PASS`
- `node tests/registry-v2/run.mjs` → `76/76 PASS`
- `node --check tools/local-dev-resource-observatory-v1.mjs` → PASS
- `node --check tools/serve-local-dev-autonomous-dispatcher-v1.mjs` → PASS
- `git diff --check` → PASS
- Live read-only smoke: `GET http://127.0.0.1:18793/dashboard` → HTTP 200;
  `GET http://127.0.0.1:18793/v1/resources` → HTTP 200 with `read_only=true`.
  The already-running service was not restarted or mutated. The current
  source was independently checked for six-column layout and absence of a
  `chatgpt_web` main-row card.

## Safety classification

`VPS_PRIVATE_OBSERVATION=LIVE` remains read-only. The allowlist contains only
bounded observation commands; no mutation verb, credential, cookie, token,
session material, public IP, Qwen inference, Hermes/Chrome interaction,
ChatGPT Web send, `/v1/tick`, provider fallback, n8n/VPS mutation, or
production dispatch occurred.

`ISSUE_73_PHASE_C=PASS` remains unchanged, #73 remains OPEN, and the next real
frontier is `V4_QWEN_CANONICAL_ENDPOINT_502_RECOVERY_V1`.
