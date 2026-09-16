#!/usr/bin/env node
/**
 * V4_TELEGRAM_ACTIONABLE_HUMAN_GATE_V1 — WF90 actionable-gate build/decision
 * logic, canonical and offline-testable. This module is the single source of
 * the exact jsCode embedded into the WF90 artifact nodes:
 *   - Code - Normalize LOCAL_DEV tick result (additive gate metadata)
 *   - Code - Build WF90 actionable gate message (MODE A/B renderer)
 * The artifact embeds these strings verbatim; this module adds focused tests.
 *
 * WF90 is NOT a decision authority: it renders/normalizes canonical gate
 * metadata only. Choices are never invented here; unknown/partial choice sets
 * degrade to MODE A (informational) exactly like the dispatcher contract.
 *
 * NOTE: the two exported sources are STORED AS ARRAYS OF LINES and joined
 * with \n so the embedded code can safely contain single quotes and template
 * literals without any escaping ambiguity.
 */
const NORMALIZER_LINES = [
  "const raw = $input.item.json ?? {};",
  "let body = raw.body ?? raw;",
  "if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }",
  "const SCHEMA = 'local-dev-dispatch-tick-result-v1';",
  "const ALLOWED = ['WORK_EXECUTED_PASS','WORK_EXECUTED_STOP','IDLE_CLEAN','BUSY','HUMAN_GATE_REQUIRED','SERVICE_ERROR'];",
  "const isTickResult = (v) => Boolean(v && typeof v === 'object' && !Array.isArray(v) && v.schema_version === SCHEMA && ALLOWED.includes(v.classification) && typeof v.execution_performed === 'boolean');",
  "// WF90_HTTP409_FIX: n8n/Axios error envelopes (onError=continueRegularOutput) embed the dispatcher body in error.message as STATUS - JSON; recover it ONLY when it validates as the tick schema.",
  "// HTTP status alone NEVER infers HUMAN_GATE_REQUIRED; the dispatcher body remains the authority.",
  "if (!isTickResult(body) && raw.error && typeof raw.error.message === 'string') {",
  "  const sep = raw.error.message.indexOf(' - ');",
  "  if (sep > 0) {",
  "    try {",
  "      let decoded = JSON.parse(raw.error.message.slice(sep + 3));",
  "      if (typeof decoded === 'string') { decoded = JSON.parse(decoded); }",
  "      if (isTickResult(decoded)) { body = decoded; }",
  "    } catch {}",
  "  }",
  "}",
  "const valid = isTickResult(body);",
  "const classification = valid ? body.classification : 'SERVICE_ERROR';",
  "const humanGateRequired = valid && body.human_gate_required === true;",
  "const notifyRequired = humanGateRequired || classification === 'WORK_EXECUTED_STOP' || classification === 'SERVICE_ERROR';",
  "// WF90_TELEGRAM_HUMAN_GATE_RELIABILITY_V1: Telegram body built here as telegram_text.",
  "// The n8n Telegram node FORCES parse_mode=Markdown when unset; unpaired underscores",
  "// in HUMAN_GATE_REQUIRED/TRACKED_DIRTY_CONFLICT then trigger Telegram 400",
  "// 'can't parse entities'. We set parse_mode=HTML on the node and HTML-escape all",
  "// dynamic values here. No task invention: task_ref/executor stay NONE when unknown.",
  "const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');",
  "const lines = ['CONTROL PLANE - HUMAN ACTION REQUIRED',",
  "  'classification: ' + classification,",
  "  'task: ' + ((valid && body.task_ref) ? esc(body.task_ref) : 'NONE'),",
  "  'phase: ' + ((valid && body.human_gate_required) ? 'HUMAN_GATE' : 'NONE'),",
  "  'reason: ' + ((valid && Array.isArray(body.reason_codes) && body.reason_codes.length) ? esc(body.reason_codes.join(',')) : ((valid && body.gate_summary) ? esc(body.gate_summary) : 'none')),",
  "  'executor: ' + ((valid && body.executor_classification) ? esc(body.executor_classification) : 'NONE'),",
  "  'origin: WF90'];",
  "// V4_TELEGRAM_ACTIONABLE_HUMAN_GATE_V1: additive canonical actionable-gate metadata.",
  "// The dispatcher (runtime gate authority) MAY attach operator_action_* evidence;",
  "// WF90 never invents choices: a partial/unknown choice set degrades to none.",
  "const CANONICAL_CHOICES = ['APPROVE_AND_CONTINUE', 'STOP', 'DEFER'];",
  "const rawChoices = valid && Array.isArray(body.operator_action_choices) ? body.operator_action_choices : [];",
  "const cleanChoices = rawChoices.map((c) => String(c).trim()).filter(Boolean);",
  "const canonicalChoices = cleanChoices.filter((c) => CANONICAL_CHOICES.includes(c));",
  "const gateActionable = cleanChoices.length > 0 && canonicalChoices.length === cleanChoices.length;",
  "const gate = humanGateRequired && gateActionable && valid && body.operator_action_gate_id ? {",
  "  gate_id: String(body.operator_action_gate_id).slice(0, 120),",
  "  summary: body.operator_action_summary ? String(body.operator_action_summary).slice(0, 240) : null,",
  "  detail: body.operator_action_detail ? String(body.operator_action_detail).slice(0, 2000) : null,",
  "  choices: canonicalChoices,",
  "  requires_confirmation: body.operator_action_requires_confirmation === true,",
  "  expires_at: body.operator_action_expires_at ? String(body.operator_action_expires_at).slice(0, 40) : null,",
  "} : null;",
  "return { json: {",
  "  schema: 'local-dev-always-on-tick-normalized-v1',",
  "  response_valid: valid,",
  "  classification,",
  "  execution_performed: valid ? body.execution_performed === true : false,",
  "  task_ref: valid ? (body.task_ref ?? null) : null,",
  "  executor_classification: valid ? (body.executor_classification ?? null) : null,",
  "  human_gate_required: humanGateRequired,",
  "  gate_summary: valid ? (body.gate_summary ?? null) : null,",
  "  reason_codes: valid && Array.isArray(body.reason_codes) ? body.reason_codes : [],",
  "  notify_required: notifyRequired,",
  "  telegram_text: lines.join('\\n'),",
  "  actionable_gate: gate,",
  "} };",
];

const MESSAGE_BUILDER_LINES = [
  "// V4_TELEGRAM_ACTIONABLE_HUMAN_GATE_V1: render MODE A (informational) vs",
  "// MODE B (bounded actionable buttons) from the canonical normalized gate.",
  "// callback_data = 'ag:<nonce>:<CHOICE>:<hmac16>' with the dispatcher-issued",
  "// nonce; validation of any callback happens ONLY through the dispatcher gate",
  "// check endpoint. n8n is a TRANSPORT, never a decision authority.",
  "const n = $('Code - Normalize LOCAL_DEV tick result').first().json ?? {};",
  "const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');",
  "const g = n.actionable_gate;",
  "if (!g) {",
  "  return { json: { telegram_text: n.telegram_text, actionable: false, reply_markup: null } };",
  "}",
  "const LABELS = { APPROVE_AND_CONTINUE: 'A — APPROVE_AND_CONTINUE', STOP: 'B — STOP', DEFER: 'C — DEFER' };",
  "const buttons = g.choices.map((c) => ({ text: LABELS[c] || c, callback_data: 'ag:' + g.callback_nonce + ':' + c + ':' + g.callback_tag }));",
  "const ttlLine = g.expires_at ? ('\\nvalid until: ' + esc(g.expires_at)) : '';",
  "const confirmLine = g.requires_confirmation ? '\\nNOTA: la governance richiede una conferma aggiuntiva prima di qualsiasi esecuzione.' : '';",
  "const text = [",
  "  '\\U0001F7E2 CONTROL PLANE — GATE ATTIVO (AZIONABILE)',",
  "  'gate: ' + esc(g.gate_id),",
  "  'task: ' + esc(n.task_ref || 'NONE'),",
  "  'classification: ' + esc(n.classification),",
  "  'reason: ' + esc((Array.isArray(n.reason_codes) && n.reason_codes.length ? n.reason_codes.join(',') : n.gate_summary) || 'none'),",
  "  '',",
  "  esc(g.summary || 'Richiesta decisione operatore.'),",
  "  g.detail ? esc(g.detail) : null,",
  "  ttlLine,",
  "  confirmLine,",
  "  '',",
  "  'Un solo tocco · una sola transizione · solo operatore.',",
  "].filter((v) => v !== null).join('\\n');",
  "return { json: {",
  "  telegram_text: text,",
  "  actionable: true,",
  "  gate_id: g.gate_id,",
  "  reply_markup: { inline_keyboard: [buttons] },",
  "} };",
];

export const NORMALIZER_JSCODE = NORMALIZER_LINES.join("\n");
export const MESSAGE_BUILDER_JSCODE = MESSAGE_BUILDER_LINES.join("\n");

/** Node name constants (single source for artifact + tests). */
export const MESSAGE_BUILDER_NODE = "Code - Build WF90 actionable gate message";
