#!/usr/bin/env node
/**
 * V4 — runtime authorization issuance core + pending store owner (v1).
 * Sole operator-owned boundary that may create an ACTIVE provenance entry,
 * gated by a DIRECT Telegram decision consumed server-side from the update.
 * n8n/HTTP can never attest APPROVE/REJECT. No /issue HTTP surface exists.
 * User-local state outside Git. Fail-closed everywhere. No spend-ledger writes.
 * No execution, no adapter, no OpenCode/Qwen.
 */
import {
  existsSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

export const ISSUANCE_SCHEMA_VERSION = "v4-runtime-authorization-issuance-v1";
export const PENDING_STORE_SCHEMA_VERSION =
  "v4-runtime-authorization-pending-store-v1";
export const ISSUANCE_REJECT = "ISSUANCE_REJECTED";

export const REGISTER_PENDING_REQUEST_SCHEMA =
  "v4-runtime-authorization-register-pending-request-v1";
export const REGISTER_PENDING_RESULT_SCHEMA =
  "v4-runtime-authorization-register-pending-result-v1";
export const STATUS_REQUEST_SCHEMA = "v4-runtime-authorization-status-request-v1";
export const STATUS_RESULT_SCHEMA = "v4-runtime-authorization-status-result-v1";

export const PENDING_TTL_SECONDS_DEFAULT = 900;
export const PENDING_TTL_SECONDS_MAX = 900;
export const AUTHORIZATION_TTL_SECONDS_DEFAULT = 3600;
export const AUTHORIZATION_TTL_SECONDS_MAX = 3600;
export const ALLOWED_ROUTES = ["opencode+qwen_local"];
export const CALLBACK_NAMESPACE = "ra";

const RFC3339_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const SCOPE_DIGEST_RE = /^[0-9a-f]{64}$/;
const PENDING_STATES = ["PENDING", "APPROVED", "REJECTED", "ISSUED", "EXPIRED"];

function reject(reason, extra = {}) {
  return {
    ok: false,
    classification: ISSUANCE_REJECT,
    reason_codes: [reason],
    ...extra,
  };
}

function validId(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 200;
}

function validDate(value) {
  return typeof value === "string" && RFC3339_RE.test(value);
}

function parseInstant(value) {
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : null;
}

function toIso(now) {
  if (now instanceof Date) return now.toISOString();
  const parsed = Date.parse(now);
  return new Date(Number.isFinite(parsed) ? parsed : Date.now()).toISOString();
}

function nowMsOf(now) {
  return now instanceof Date ? now.getTime() : Date.parse(now);
}

function cloneDecision(d) {
  return { ...d };
}

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

/**
 * Validate an issuance config object (pure). DI-friendly: tests use fake values.
 * No caller of the HTTP surface can supply or override any of these values.
 */
export function validateIssuanceConfigObject(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, reason: "ISSUANCE_CONFIG_INVALID" };
  }
  if (!validId(String(obj.operator_telegram_chat_id ?? ""))) {
    return { ok: false, reason: "ISSUANCE_CONFIG_INVALID" };
  }
  if (!validId(String(obj.operator_telegram_user_id ?? ""))) {
    return { ok: false, reason: "ISSUANCE_CONFIG_INVALID" };
  }
  const token = obj.telegram_bot_token;
  if (typeof token !== "string" || token.length === 0) {
    return { ok: false, reason: "ISSUANCE_CONFIG_INVALID" };
  }
  if (!validId(String(obj.pending_store_path ?? "")) || !isAbsolute(String(obj.pending_store_path))) {
    return { ok: false, reason: "ISSUANCE_CONFIG_INVALID" };
  }
  if (!validId(String(obj.registry_path ?? "")) || !isAbsolute(String(obj.registry_path))) {
    return { ok: false, reason: "ISSUANCE_CONFIG_INVALID" };
  }
  const routes = obj.allowed_routes;
  if (
    !Array.isArray(routes) ||
    routes.length === 0 ||
    routes.some((r) => !ALLOWED_ROUTES.includes(r))
  ) {
    return { ok: false, reason: "ISSUANCE_CONFIG_INVALID" };
  }
  const d = Number(obj.pending_ttl_seconds_default);
  const dm = Number(obj.pending_ttl_seconds_max);
  const a = Number(obj.authorization_ttl_seconds_default);
  const am = Number(obj.authorization_ttl_seconds_max);
  if (
    !Number.isInteger(d) || d < 1 || d > PENDING_TTL_SECONDS_MAX ||
    !Number.isInteger(dm) || dm !== PENDING_TTL_SECONDS_MAX ||
    !Number.isInteger(a) || a < 1 || a > AUTHORIZATION_TTL_SECONDS_MAX ||
    !Number.isInteger(am) || am !== AUTHORIZATION_TTL_SECONDS_MAX
  ) {
    return { ok: false, reason: "ISSUANCE_CONFIG_INVALID" };
  }
  return { ok: true };
}

/** Load + validate issuance config from a user-local absolute path. */
export function loadIssuanceConfig(configPath, options = {}) {
  if (!configPath || typeof configPath !== "string" || !isAbsolute(configPath)) {
    return reject("ISSUANCE_CONFIG_UNAVAILABLE");
  }
  let obj;
  try {
    obj = JSON.parse(readFileSync(configPath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return reject("ISSUANCE_CONFIG_UNAVAILABLE");
  }
  const validated = validateIssuanceConfigObject(obj);
  if (!validated.ok) {
    return reject(validated.reason);
  }
  return { ok: true, config: obj };
}

/* ------------------------------------------------------------------ */
/* Pending store                                                       */
/* ------------------------------------------------------------------ */

/**
 * Validate a parsed pending-store object (pure). Duplicate pending ids,
 * duplicate authorization ids, malformed states/dates, reused telegram
 * update ids, wrong schema → INVALID.
 */
export function validatePendingStoreObject(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
  }
  if (obj.schema_version !== PENDING_STORE_SCHEMA_VERSION) {
    return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
  }
  if (!Array.isArray(obj.decisions)) {
    return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
  }
  const seenPending = new Set();
  const seenAuth = new Set();
  const seenUpdates = new Set();
  for (const d of obj.decisions) {
    if (!d || typeof d !== "object" || Array.isArray(d)) {
      return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
    }
    if (!validId(d.pending_decision_id)) {
      return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
    }
    if (seenPending.has(d.pending_decision_id)) {
      return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
    }
    seenPending.add(d.pending_decision_id);
    if (!validId(d.authorization_id)) {
      return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
    }
    if (seenAuth.has(d.authorization_id)) {
      return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
    }
    seenAuth.add(d.authorization_id);
    if (!validId(d.task_id) || !validId(d.execution_id)) {
      return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
    }
    if (d.route_id !== "opencode+qwen_local") {
      return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
    }
    if (typeof d.scope_digest !== "string" || !SCOPE_DIGEST_RE.test(d.scope_digest)) {
      return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
    }
    if (!validDate(d.created_at) || !validDate(d.pending_expires_at)) {
      return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
    }
    if (!PENDING_STATES.includes(d.state)) {
      return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
    }
    const receipt = {
      decision_at: d.decision_at,
      selected_option: d.selected_option,
      telegram_update_id: d.telegram_update_id,
      telegram_chat_id: d.telegram_chat_id,
      telegram_user_id: d.telegram_user_id,
      authorization_expires_at: d.authorization_expires_at,
      issued_at: d.issued_at,
    };
    const receiptFilled = (v) => v !== null && v !== undefined;
    // State-specific validation. PENDING/EXPIRED carry no human decision
    // receipt (EXPIRED may derive from PENDING without APPROVE/REJECT);
    // APPROVED/REJECTED/ISSUED must each carry a complete receipt whose
    // option matches the state. Terminal states never regress.
    if (d.state === "PENDING" || d.state === "EXPIRED") {
      if (Object.values(receipt).some(receiptFilled)) {
        return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
      }
    } else if (d.state === "APPROVED" || d.state === "ISSUED") {
      if (d.selected_option !== "APPROVE") {
        return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
      }
      if (
        !validDate(d.decision_at) ||
        !validId(d.telegram_update_id) ||
        !validId(d.telegram_chat_id) ||
        !validId(d.telegram_user_id) ||
        !validDate(d.authorization_expires_at)
      ) {
        return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
      }
      if (seenUpdates.has(String(d.telegram_update_id))) {
        return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
      }
      seenUpdates.add(String(d.telegram_update_id));
      if (d.state === "APPROVED" && receiptFilled(d.issued_at)) {
        return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
      }
      if (d.state === "ISSUED" && !validDate(d.issued_at)) {
        return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
      }
    } else if (d.state === "REJECTED") {
      if (d.selected_option !== "REJECT") {
        return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
      }
      if (
        !validDate(d.decision_at) ||
        !validId(d.telegram_update_id) ||
        !validId(d.telegram_chat_id) ||
        !validId(d.telegram_user_id)
      ) {
        return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
      }
      if (seenUpdates.has(String(d.telegram_update_id))) {
        return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
      }
      seenUpdates.add(String(d.telegram_update_id));
      if (receiptFilled(d.authorization_expires_at) || receiptFilled(d.issued_at)) {
        return { ok: false, reason: "ISSUANCE_PENDING_STORE_INVALID" };
      }
    }
  }
  return { ok: true, decisions: obj.decisions };
}

/** Read + validate the pending store from a server-side absolute path. */
export function loadPendingStore(storePath) {
  if (!storePath || typeof storePath !== "string" || !isAbsolute(storePath)) {
    return reject("ISSUANCE_PENDING_STORE_UNAVAILABLE");
  }
  if (!existsSync(storePath)) {
    return reject("ISSUANCE_PENDING_STORE_UNAVAILABLE");
  }
  let obj;
  try {
    obj = JSON.parse(readFileSync(storePath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return reject("ISSUANCE_PENDING_STORE_INVALID");
  }
  const validated = validatePendingStoreObject(obj);
  if (!validated.ok) {
    return reject(validated.reason);
  }
  return { ok: true, store: obj, storePath };
}

/** Atomic same-directory temp+rename persistence. */
export function persistPendingStore(storePath, obj, options = {}) {
  const writeFileImpl = options.writeFile || writeFileSync;
  const renameImpl = options.rename || renameSync;
  const mkName =
    options.tempName || (() => `${resolve(storePath)}.${randomUUID()}.tmp`);
  const temp = mkName();
  writeFileImpl(temp, `${JSON.stringify(obj, null, 2)}\n`, "utf8");
  renameImpl(temp, storePath);
}

function emptyStore() {
  return { schema_version: PENDING_STORE_SCHEMA_VERSION, decisions: [] };
}

/* ------------------------------------------------------------------ */
/* Pending-store single-writer mutation lane (per-process)             */
/* ------------------------------------------------------------------ */

/**
 * Create a per-process FIFO async mutation lane for the pending store.
 * Exactly one critical write sequence runs at a time; exception-safe release.
 * Shared by registerPendingAuthorization, handleTelegramDecisionUpdate and
 * reconcileApprovedPending so a stale register snapshot can never clobber
 * a decision made while Telegram send was in flight.
 */
export function createPendingStoreMutationMutex() {
  let tail = Promise.resolve();
  let depth = 0;
  return {
    runExclusive(asyncFn) {
      const run = new Promise((resolve, reject) => {
        const start = () => {
          depth += 1;
          Promise.resolve()
            .then(() => asyncFn())
            .then(
              (value) => {
                depth -= 1;
                resolve(value);
              },
              (err) => {
                depth -= 1;
                reject(err);
              },
            );
        };
        // Chain onto the previous waiter; recover so a rejection never stalls the lane.
        tail = tail.then(start, start);
      });
      // Keep the lane alive even if this run rejects.
      tail = run.then(
        () => {},
        () => {},
      );
      return run;
    },
    /** Test/introspection: number of currently nested exclusive holders (0 or 1). */
    get activeCount() {
      return depth;
    },
  };
}

/** Passthrough lane used when no shared mutex is injected (single-threaded tests). */
function passthroughMutex() {
  return {
    runExclusive(asyncFn) {
      return Promise.resolve().then(() => asyncFn());
    },
    get activeCount() {
      return 0;
    },
  };
}

function resolveMutationMutex(options) {
  return options.mutationMutex || passthroughMutex();
}

/* ------------------------------------------------------------------ */
/* Telegram client abstraction (DI; production fetch never invoked here)*/
/* ------------------------------------------------------------------ */

/**
 * Build the logical decision message body. No secrets in text.
 */
export function buildDecisionMessageText(decision) {
  const lines = [
    "V4 runtime authorization — human gate",
    `task_id: ${decision.task_id}`,
    `authorization_id: ${decision.authorization_id}`,
    `route_id: ${decision.route_id}`,
    `scope_digest: ${decision.scope_digest.slice(0, 16)}…`,
    `pending_expires_at: ${decision.pending_expires_at}`,
    "APPROVE or REJECT — one-shot, operator-only.",
  ];
  return lines.join("\n");
}

/**
 * Build the inline keyboard callback_data values for a pending decision.
 */
export function buildCallbackData(pendingDecisionId) {
  return {
    approve: `${CALLBACK_NAMESPACE}:${pendingDecisionId}:approve`,
    reject: `${CALLBACK_NAMESPACE}:${pendingDecisionId}:reject`,
  };
}

/**
 * Production Telegram bot client (canonical). Token comes ONLY from the
 * server-side issuance config. Never from HTTP callers, n8n, env or query.
 * Results never echo the token or the request URL. An optional AbortController
 * signal lets the polling worker cancel an in-flight long poll on shutdown.
 */
export function createTelegramBotClient(config, options = {}) {
  const fetchImpl = options.fetch || ((...a) => fetch(...a));
  const signal = options.signal || null;
  const token = config?.telegram_bot_token;
  if (typeof token !== "string" || token.length === 0) {
    throw new Error("TELEGRAM_BOT_TOKEN_MISSING");
  }
  async function call(method, payload) {
    const res = await fetchImpl(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      ...(signal ? { signal } : {}),
    });
    if (!res.ok) {
      return { ok: false, status: res.status };
    }
    const data = await res.json();
    if (data?.ok !== true) {
      return { ok: false, description: data?.description || "TELEGRAM_API_ERROR" };
    }
    return { ok: true, result: data.result };
  }
  return {
    async sendDecisionMessage(chatId, text, keyboard) {
      return call("sendMessage", {
        chat_id: chatId,
        text,
        reply_markup: { inline_keyboard: keyboard },
      });
    },
    async getUpdates(offset, timeout) {
      return call("getUpdates", {
        offset,
        timeout,
        allowed_updates: ["callback_query"],
      });
    },
    async answerCallbackQuery(callbackQueryId) {
      return call("answerCallbackQuery", { callback_query_id: callbackQueryId });
    },
  };
}

/** Backward-compatible alias; token still comes only from the config. */
export function createProductionTelegramClient(config, options = {}) {
  return createTelegramBotClient(config, options);
}

/* ------------------------------------------------------------------ */
/* Direct Telegram decision polling worker                             */
/* ------------------------------------------------------------------ */

let pollerLoopActive = false;

/**
 * Single long-poll loop consuming Telegram updates directly server-side.
 * - one loop per process (second start while running fails closed);
 * - monotonic offset: max(update_id) + 1, advanced for EVERY update type;
 * - non-callback updates (e.g. /start, plain text) never decide anything;
 * - each callback_query update goes VERBATIM to handleTelegramDecisionUpdate;
 * - poll/transport errors back off bounded and never create decisions;
 * - stop() aborts an in-flight long poll via the supplied onAbort hook.
 */
export function startTelegramDecisionPolling(options = {}) {
  if (pollerLoopActive) {
    return { ok: false, reason_codes: ["ISSUANCE_POLLER_ALREADY_RUNNING"] };
  }
  const telegram = options.telegram;
  if (
    !telegram ||
    typeof telegram.getUpdates !== "function" ||
    typeof telegram.answerCallbackQuery !== "function"
  ) {
    return { ok: false, reason_codes: ["ISSUANCE_TELEGRAM_TRANSPORT_UNAVAILABLE"] };
  }
  const handleUpdate = options.handleUpdate || handleTelegramDecisionUpdate;
  const handlerOptions = options.handlerOptions || {};
  const pollTimeoutSeconds = options.pollTimeoutSeconds ?? 25;
  const idleDelayMs = options.idleDelayMs ?? 0;
  const initialBackoffMs = options.initialBackoffMs ?? 1000;
  const maxBackoffMs = options.maxBackoffMs ?? 60000;
  const sleep = options.sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
  const onAbort = typeof options.onAbort === "function" ? options.onAbort : null;

  let stopped = false;
  let offset = Number.isInteger(options.initialOffset) ? options.initialOffset : 0;
  let backoffMs = initialBackoffMs;
  pollerLoopActive = true;

  const loopPromise = (async () => {
    while (!stopped) {
      let res;
      try {
        res = await telegram.getUpdates(offset, pollTimeoutSeconds);
      } catch {
        if (stopped) break;
        await sleep(backoffMs);
        backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
        continue;
      }
      if (stopped) break;
      if (!res || res.ok !== true || !Array.isArray(res.result)) {
        await sleep(backoffMs);
        backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
        continue;
      }
      backoffMs = initialBackoffMs;
      for (const update of res.result) {
        const updateId = update?.update_id;
        // Advance BEFORE handling: at-least-once delivery is safe because the
        // durable pending store dedupes update ids and terminal states.
        if (Number.isInteger(updateId) && updateId + 1 > offset) {
          offset = updateId + 1;
        }
        if (update && update.callback_query) {
          try {
            await handleUpdate(update, handlerOptions);
          } catch {
            // fail closed: poller errors never approve anything
          }
        }
        // Plain messages (/start, text) are ignored; offset already advanced.
      }
      // Always yield to the event loop between polls, even on empty batches,
      // so a zero-delay fake transport cannot produce a tight spin.
      if (!stopped) {
        await sleep(Math.max(idleDelayMs, 1));
      }
    }
  })();

  const stoppedPromise = loopPromise.then(
    () => {
      pollerLoopActive = false;
      return true;
    },
    () => {
      pollerLoopActive = false;
      return true;
    },
  );

  return {
    ok: true,
    stop() {
      stopped = true;
      if (onAbort) {
        try {
          onAbort();
        } catch {
          /* ignore */
        }
      }
    },
    getOffset: () => offset,
    isStopped: () => stopped,
    stopped: stoppedPromise,
  };
}

/* ------------------------------------------------------------------ */
/* Register pending                                                    */
/* ------------------------------------------------------------------ */

function validateRegisterPendingRequest(body, config) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, reason: "ISSUANCE_REGISTER_REQUEST_INVALID" };
  }
  const keys = Object.keys(body);
  const expected = [
    "schema_version",
    "pending_decision_id",
    "authorization_id",
    "task_id",
    "execution_id",
    "route_id",
    "scope_digest",
    "pending_ttl_seconds",
  ].sort();
  const sortedKeys = [...keys].sort();
  if (
    sortedKeys.length !== expected.length ||
    sortedKeys.some((k, i) => k !== expected[i])
  ) {
    return { ok: false, reason: "ISSUANCE_REGISTER_REQUEST_INVALID" };
  }
  if (body.schema_version !== REGISTER_PENDING_REQUEST_SCHEMA) {
    return { ok: false, reason: "ISSUANCE_REGISTER_REQUEST_INVALID" };
  }
  if (!validId(body.pending_decision_id) || !validId(body.authorization_id)) {
    return { ok: false, reason: "ISSUANCE_REGISTER_REQUEST_INVALID" };
  }
  if (!validId(body.task_id) || !validId(body.execution_id)) {
    return { ok: false, reason: "ISSUANCE_REGISTER_REQUEST_INVALID" };
  }
  if (!ALLOWED_ROUTES.includes(body.route_id)) {
    return { ok: false, reason: "ISSUANCE_ROUTE_NOT_ALLOWED" };
  }
  if (typeof body.scope_digest !== "string" || !SCOPE_DIGEST_RE.test(body.scope_digest)) {
    return { ok: false, reason: "ISSUANCE_REGISTER_REQUEST_INVALID" };
  }
  const ttl = Number(body.pending_ttl_seconds);
  if (!Number.isInteger(ttl) || ttl < 1 || ttl > PENDING_TTL_SECONDS_MAX) {
    return { ok: false, reason: "ISSUANCE_REGISTER_REQUEST_INVALID" };
  }
  if (!config.allowed_routes.includes(body.route_id)) {
    return { ok: false, reason: "ISSUANCE_ROUTE_NOT_ALLOWED" };
  }
  return { ok: true, request: body };
}

/**
 * Register one pending authorization. Writes exactly one PENDING record and
 * sends the decision message through the injected Telegram client ONLY.
 * Never writes the registry, ledger, or execution state.
 *
 * Holds the pending-store mutation lane across the entire
 * load → send Telegram → persist sequence so a concurrent callback cannot
 * observe a stale store and a concurrent register cannot clobber a decision.
 */
export async function registerPendingAuthorization(storePath, body, options = {}) {
  const config = options.config;
  const loadStore = options.loadPendingStore || loadPendingStore;
  const persistStore = options.persistPendingStore || persistPendingStore;
  const telegram = options.telegram;
  const now = options.now || new Date();
  const loadRegistryFn = options.loadRegistry;
  const registryPath = options.registryPath || config?.registry_path || null;
  const mutex = resolveMutationMutex(options);

  if (!config) {
    return reject("ISSUANCE_CONFIG_UNAVAILABLE");
  }
  if (!telegram || typeof telegram.sendDecisionMessage !== "function") {
    return reject("ISSUANCE_TELEGRAM_TRANSPORT_UNAVAILABLE");
  }

  const shape = validateRegisterPendingRequest(body, config);
  if (!shape.ok) {
    return reject(shape.reason);
  }

  return mutex.runExclusive(async () => {
    const loaded = loadStore(storePath);
    if (!loaded.ok) {
      return reject(loaded.reason_codes[0]);
    }

    const decisions = loaded.store.decisions;
    if (decisions.some((d) => d.pending_decision_id === body.pending_decision_id)) {
      return reject("ISSUANCE_PENDING_ID_CONFLICT", {
        pending_decision_id: body.pending_decision_id,
      });
    }
    if (decisions.some((d) => d.authorization_id === body.authorization_id)) {
      return reject("ISSUANCE_AUTHORIZATION_ID_CONFLICT", {
        authorization_id: body.authorization_id,
      });
    }

    if (loadRegistryFn && registryPath) {
      const reg = loadRegistryFn(registryPath);
      if (!reg.ok) {
        return reject(reg.reason_codes[0].startsWith("AUTHORIZATION_")
          ? "ISSUANCE_REGISTRY_UNAVAILABLE"
          : reg.reason_codes[0]);
      }
      if (reg.registry.entries.some((e) => e.authorization_id === body.authorization_id)) {
        return reject("ISSUANCE_AUTHORIZATION_ID_CONFLICT", {
          authorization_id: body.authorization_id,
        });
      }
    }

    const createdAt = toIso(now);
    const expiresMs = nowMsOf(now) + body.pending_ttl_seconds * 1000;
    const pendingExpiresAt = new Date(expiresMs).toISOString();
    const decision = {
      pending_decision_id: body.pending_decision_id,
      authorization_id: body.authorization_id,
      task_id: body.task_id,
      execution_id: body.execution_id,
      route_id: body.route_id,
      scope_digest: body.scope_digest,
      created_at: createdAt,
      pending_expires_at: pendingExpiresAt,
      state: "PENDING",
      decision_at: null,
      selected_option: null,
      telegram_update_id: null,
      telegram_chat_id: null,
      telegram_user_id: null,
      authorization_expires_at: null,
      issued_at: null,
    };

    const next = {
      schema_version: PENDING_STORE_SCHEMA_VERSION,
      decisions: [...decisions.map(cloneDecision), decision],
    };
    const selfCheck = validatePendingStoreObject(next);
    if (!selfCheck.ok) {
      return reject(selfCheck.reason);
    }

    let telegramOk = false;
    try {
      const cb = buildCallbackData(decision.pending_decision_id);
      const keyboard = [[
        { text: "APPROVE", callback_data: cb.approve },
        { text: "REJECT", callback_data: cb.reject },
      ]];
      // Hold the mutation lane across the Telegram send so a concurrent
      // callback cannot mutate the store until PENDING is durably persisted.
      const sent = await telegram.sendDecisionMessage(
        config.operator_telegram_chat_id,
        buildDecisionMessageText(decision),
        keyboard,
      );
      telegramOk = sent?.ok === true;
    } catch {
      telegramOk = false;
    }

    if (!telegramOk) {
      // Fail closed: no PENDING persisted for a proposal whose operator gate
      // message was never delivered — the operator cannot decide what they
      // never saw, and no silent auto-approval path may exist.
      return reject("ISSUANCE_TELEGRAM_DELIVERY_FAILED", {
        pending_decision_id: decision.pending_decision_id,
        authorization_id: decision.authorization_id,
      });
    }

    try {
      persistStore(storePath, next, options);
    } catch {
      return reject("ISSUANCE_PENDING_STORE_UNAVAILABLE", {
        pending_decision_id: decision.pending_decision_id,
        authorization_id: decision.authorization_id,
      });
    }

    return {
      ok: true,
      classification: "REGISTER_PENDING_ACCEPTED",
      pending_decision_id: decision.pending_decision_id,
      authorization_id: decision.authorization_id,
      state: "PENDING",
      pending_expires_at: decision.pending_expires_at,
      reason_codes: [],
    };
  });
}

/* ------------------------------------------------------------------ */
/* Status                                                              */
/* ------------------------------------------------------------------ */

export function getPendingAuthorizationStatus(storePath, pendingDecisionId, options = {}) {
  const loadStore = options.loadPendingStore || loadPendingStore;
  const now = options.now || new Date();

  if (!validId(pendingDecisionId)) {
    return reject("ISSUANCE_PENDING_NOT_FOUND");
  }
  const loaded = loadStore(storePath);
  if (!loaded.ok) {
    return reject(loaded.reason_codes[0]);
  }
  const d = loaded.store.decisions.find(
    (x) => x.pending_decision_id === pendingDecisionId,
  );
  if (!d) {
    return reject("ISSUANCE_PENDING_NOT_FOUND", {
      pending_decision_id: pendingDecisionId,
    });
  }

  let state = d.state;
  let authorizationExpiresAt = d.authorization_expires_at;
  if (state === "PENDING" && nowMsOf(now) >= parseInstant(d.pending_expires_at)) {
    state = "EXPIRED";
    authorizationExpiresAt = null;
  }

  return {
    ok: true,
    classification: "STATUS_OK",
    pending_decision_id: d.pending_decision_id,
    authorization_id: d.authorization_id,
    state,
    pending_expires_at: d.pending_expires_at,
    authorization_expires_at: authorizationExpiresAt,
    reason_codes: [],
  };
}

/* ------------------------------------------------------------------ */
/* Direct Telegram decision handling                                   */
/* ------------------------------------------------------------------ */

function extractCallback(update) {
  if (!update || typeof update !== "object") return null;
  const cb = update.callback_query;
  if (!cb || typeof cb !== "object") return null;
  return cb;
}

function parseCallbackData(data) {
  if (typeof data !== "string") return null;
  const parts = data.split(":");
  if (parts.length !== 3) return null;
  if (parts[0] !== CALLBACK_NAMESPACE) return null;
  if (parts[1] === "" || parts[1].length > 200) return null;
  if (parts[2] !== "approve" && parts[2] !== "reject") return null;
  return { pendingDecisionId: parts[1], option: parts[2] };
}

/**
 * Handle ONE direct Telegram update carrying a human decision.
 * The update comes ONLY from the server-side Telegram client (injected).
 * Every identity field is read from the update itself; nothing from HTTP.
 *
 * Identity checks run outside the mutation lane (fail-fast). Store load +
 * state transition + registry ACTIVE append run INSIDE the shared lane so
 * they cannot race with a concurrent registerPendingAuthorization.
 */
export async function handleTelegramDecisionUpdate(update, options = {}) {
  const config = options.config;
  const storePath = options.pendingStorePath || config?.pending_store_path || null;
  const loadStore = options.loadPendingStore || loadPendingStore;
  const persistStore = options.persistPendingStore || persistPendingStore;
  const now = options.now || new Date();
  const issueActiveEntryFn = options.issueActiveEntry;
  const acknowledge = options.acknowledgeCallback;
  const mutex = resolveMutationMutex(options);

  if (!config) {
    return reject("ISSUANCE_CONFIG_UNAVAILABLE");
  }

  const cb = extractCallback(update);
  if (!cb || !cb.message || !cb.message.chat || !cb.message.chat.id) {
    return reject("ISSUANCE_TELEGRAM_UPDATE_INVALID");
  }
  const parsed = parseCallbackData(cb.data);
  if (!parsed) {
    return reject("ISSUANCE_TELEGRAM_UPDATE_INVALID");
  }
  const updateId = update.update_id;
  if (!Number.isInteger(updateId)) {
    return reject("ISSUANCE_TELEGRAM_UPDATE_INVALID");
  }
  const fromId = cb.from && cb.from.id;
  if (fromId === undefined || fromId === null) {
    return reject("ISSUANCE_TELEGRAM_UPDATE_INVALID");
  }

  const chatIdStr = String(cb.message.chat.id);
  const fromIdStr = String(fromId);
  if (chatIdStr !== String(config.operator_telegram_chat_id)) {
    return reject("ISSUANCE_OPERATOR_IDENTITY_MISMATCH");
  }
  if (fromIdStr !== String(config.operator_telegram_user_id)) {
    return reject("ISSUANCE_OPERATOR_IDENTITY_MISMATCH");
  }

  return mutex.runExclusive(async () => {
    // Reload CURRENT store under the lane — never trust a pre-lock snapshot.
    const loaded = loadStore(storePath);
    if (!loaded.ok) {
      return reject(loaded.reason_codes[0]);
    }
    const decisions = loaded.store.decisions;
    const idx = decisions.findIndex(
      (d) => d.pending_decision_id === parsed.pendingDecisionId,
    );
    if (idx === -1) {
      return reject("ISSUANCE_PENDING_NOT_FOUND");
    }
    const d = decisions[idx];

    const updateIdStr = String(updateId);
    const updateUsedByOther = decisions.some(
      (x, i) =>
        i !== idx &&
        x.telegram_update_id !== null &&
        String(x.telegram_update_id) === updateIdStr,
    );
    if (updateUsedByOther) {
      return reject("ISSUANCE_TELEGRAM_UPDATE_REUSED");
    }
    if (d.telegram_update_id === updateIdStr && d.state !== "PENDING") {
      return reject("ISSUANCE_DECISION_ALREADY_CONSUMED");
    }

    if (d.state !== "PENDING") {
      return reject("ISSUANCE_DECISION_ALREADY_CONSUMED");
    }
    if (nowMsOf(now) >= parseInstant(d.pending_expires_at)) {
      return reject("ISSUANCE_EXPIRED");
    }

    const receipt = {
      decision_at: toIso(now),
      selected_option: parsed.option === "approve" ? "APPROVE" : "REJECT",
      telegram_update_id: updateIdStr,
      telegram_chat_id: chatIdStr,
      telegram_user_id: fromIdStr,
    };

    if (acknowledge && typeof acknowledge === "function") {
      try {
        await acknowledge(cb.id);
      } catch {
        // fail-soft: ack failure does not change business classification
      }
    }

    if (parsed.option === "reject") {
      const rejected = {
        ...d,
        state: "REJECTED",
        decision_at: receipt.decision_at,
        selected_option: "REJECT",
        telegram_update_id: receipt.telegram_update_id,
        telegram_chat_id: receipt.telegram_chat_id,
        telegram_user_id: receipt.telegram_user_id,
        authorization_expires_at: null,
        issued_at: null,
      };
      const next = {
        schema_version: PENDING_STORE_SCHEMA_VERSION,
        decisions: decisions.map((x, i) => (i === idx ? rejected : cloneDecision(x))),
      };
      const selfCheck = validatePendingStoreObject(next);
      if (!selfCheck.ok) {
        return reject(selfCheck.reason);
      }
      try {
        persistStore(storePath, next, options);
      } catch {
        return reject("ISSUANCE_PENDING_STORE_UNAVAILABLE");
      }
      return {
        ok: true,
        classification: "DECISION_REJECTED",
        pending_decision_id: d.pending_decision_id,
        authorization_id: d.authorization_id,
        state: "REJECTED",
        reason_codes: [],
      };
    }

    // APPROVE
    const authorizationExpiresAt = new Date(
      nowMsOf(now) + config.authorization_ttl_seconds_default * 1000,
    ).toISOString();
    const approved = {
      ...d,
      state: "APPROVED",
      decision_at: receipt.decision_at,
      selected_option: "APPROVE",
      telegram_update_id: receipt.telegram_update_id,
      telegram_chat_id: receipt.telegram_chat_id,
      telegram_user_id: receipt.telegram_user_id,
      authorization_expires_at: authorizationExpiresAt,
      issued_at: null,
    };
    let next = {
      schema_version: PENDING_STORE_SCHEMA_VERSION,
      decisions: loaded.store.decisions.map((x, i) => (i === idx ? approved : cloneDecision(x))),
    };
    let selfCheck = validatePendingStoreObject(next);
    if (!selfCheck.ok) {
      return reject(selfCheck.reason);
    }
    try {
      persistStore(storePath, next, options);
    } catch {
      return reject("ISSUANCE_PENDING_STORE_UNAVAILABLE");
    }

    if (!issueActiveEntryFn) {
      return reject("ISSUANCE_REGISTRY_UNAVAILABLE");
    }
    const issued = issueActiveEntryFn(config.registry_path, {
      authorization_id: d.authorization_id,
      route_id: d.route_id,
      expires_at: authorizationExpiresAt,
    }, {
      loadRegistry: options.loadRegistry,
      persistRegistry: options.persistRegistry,
      now,
    });
    if (!issued.ok) {
      return reject(
        issued.collision === true
          ? "ISSUANCE_AUTHORIZATION_ID_CONFLICT"
          : issued.reason_codes[0] === "AUTHORIZATION_REGISTRY_UNAVAILABLE"
            ? "ISSUANCE_REGISTRY_UNAVAILABLE"
            : issued.reason_codes[0] === "AUTHORIZATION_REGISTRY_INVALID"
              ? "ISSUANCE_REGISTRY_INVALID"
              : "ISSUANCE_REGISTRY_WRITE_FAILED",
        {
          pending_decision_id: d.pending_decision_id,
          authorization_id: d.authorization_id,
          state: "APPROVED",
        },
      );
    }

    const issuedDecision = {
      ...approved,
      state: "ISSUED",
      issued_at: toIso(now),
    };
    next = {
      schema_version: PENDING_STORE_SCHEMA_VERSION,
      decisions: next.decisions.map((x) =>
        x.pending_decision_id === d.pending_decision_id ? issuedDecision : x,
      ),
    };
    selfCheck = validatePendingStoreObject(next);
    if (!selfCheck.ok) {
      return reject(selfCheck.reason);
    }
    try {
      persistStore(storePath, next, options);
    } catch {
      return reject("ISSUANCE_PENDING_STORE_UNAVAILABLE", {
        pending_decision_id: d.pending_decision_id,
        authorization_id: d.authorization_id,
        state: "APPROVED",
      });
    }

    return {
      ok: true,
      classification: "DECISION_ISSUED",
      pending_decision_id: d.pending_decision_id,
      authorization_id: d.authorization_id,
      state: "ISSUED",
      reason_codes: [],
    };
  });
}

/* ------------------------------------------------------------------ */
/* Bounded reconciliation                                              */
/* ------------------------------------------------------------------ */

/**
 * Internally-triggered reconciliation for a pending record left APPROVED
 * after registry failure. Retries ONLY the exact same pre-bound id/bindings.
 * Never callable via HTTP; never mints a replacement id.
 * If the registry already contains the exact matching ACTIVE entry,
 * converges idempotently to ISSUED without appending again.
 *
 * Uses the same pending-store mutation lane as register and callback.
 */
export async function reconcileApprovedPending(storePath, pendingDecisionId, options = {}) {
  const config = options.config;
  const loadStore = options.loadPendingStore || loadPendingStore;
  const persistStore = options.persistPendingStore || persistPendingStore;
  const now = options.now || new Date();
  const issueActiveEntryFn = options.issueActiveEntry;
  const loadRegistryFn = options.loadRegistry;
  const mutex = resolveMutationMutex(options);

  if (!config) {
    return reject("ISSUANCE_CONFIG_UNAVAILABLE");
  }
  if (!validId(pendingDecisionId)) {
    return reject("ISSUANCE_PENDING_NOT_FOUND");
  }

  return mutex.runExclusive(async () => {
    const loaded = loadStore(storePath);
    if (!loaded.ok) {
      return reject(loaded.reason_codes[0]);
    }
    const decisions = loaded.store.decisions;
    const idx = decisions.findIndex((d) => d.pending_decision_id === pendingDecisionId);
    if (idx === -1) {
      return reject("ISSUANCE_PENDING_NOT_FOUND");
    }
    const d = decisions[idx];

    if (d.state === "ISSUED") {
      return {
        ok: true,
        classification: "RECONCILE_ALREADY_ISSUED",
        pending_decision_id: d.pending_decision_id,
        authorization_id: d.authorization_id,
        state: "ISSUED",
        reason_codes: [],
      };
    }
    if (d.state !== "APPROVED") {
      return reject("ISSUANCE_BINDING_MISMATCH");
    }

    if (loadRegistryFn) {
      const reg = loadRegistryFn(config.registry_path);
      if (reg.ok) {
        const existing = reg.registry.entries.find(
          (e) => e.authorization_id === d.authorization_id,
        );
        if (existing) {
          const exactMatch =
            existing.state === "ACTIVE" &&
            existing.route_id === d.route_id &&
            existing.expires_at === d.authorization_expires_at;
          if (exactMatch) {
            const converged = {
              ...d,
              state: "ISSUED",
              issued_at: toIso(now),
            };
            const next = {
              schema_version: PENDING_STORE_SCHEMA_VERSION,
              decisions: decisions.map((x, i) => (i === idx ? converged : cloneDecision(x))),
            };
            const selfCheck = validatePendingStoreObject(next);
            if (!selfCheck.ok) {
              return reject(selfCheck.reason);
            }
            try {
              persistStore(storePath, next, options);
            } catch {
              return reject("ISSUANCE_PENDING_STORE_UNAVAILABLE");
            }
            return {
              ok: true,
              classification: "RECONCILE_CONVERGED",
              pending_decision_id: d.pending_decision_id,
              authorization_id: d.authorization_id,
              state: "ISSUED",
              reason_codes: [],
            };
          }
          return reject("ISSUANCE_AUTHORIZATION_ID_CONFLICT");
        }
      }
    }

    if (!issueActiveEntryFn) {
      return reject("ISSUANCE_REGISTRY_UNAVAILABLE");
    }
    const issued = issueActiveEntryFn(config.registry_path, {
      authorization_id: d.authorization_id,
      route_id: d.route_id,
      expires_at: d.authorization_expires_at,
    }, {
      loadRegistry: loadRegistryFn,
      persistRegistry: options.persistRegistry,
      now,
    });
    if (!issued.ok) {
      return reject(
        issued.collision === true
          ? "ISSUANCE_AUTHORIZATION_ID_CONFLICT"
          : issued.reason_codes[0] === "AUTHORIZATION_REGISTRY_UNAVAILABLE"
            ? "ISSUANCE_REGISTRY_UNAVAILABLE"
            : issued.reason_codes[0] === "AUTHORIZATION_REGISTRY_INVALID"
              ? "ISSUANCE_REGISTRY_INVALID"
              : "ISSUANCE_REGISTRY_WRITE_FAILED",
        { state: "APPROVED" },
      );
    }

    const issuedDecision = { ...d, state: "ISSUED", issued_at: toIso(now) };
    const next = {
      schema_version: PENDING_STORE_SCHEMA_VERSION,
      decisions: decisions.map((x, i) => (i === idx ? issuedDecision : cloneDecision(x))),
    };
    const selfCheck = validatePendingStoreObject(next);
    if (!selfCheck.ok) {
      return reject(selfCheck.reason);
    }
    try {
      persistStore(storePath, next, options);
    } catch {
      return reject("ISSUANCE_PENDING_STORE_UNAVAILABLE", { state: "APPROVED" });
    }
    return {
      ok: true,
      classification: "RECONCILE_ISSUED",
      pending_decision_id: d.pending_decision_id,
      authorization_id: d.authorization_id,
      state: "ISSUED",
      reason_codes: [],
    };
  });
}

const isMain =
  process.argv[1] &&
  process.argv[1]
    .replace(/\\/g, "/")
    .endsWith("/v4-runtime-authorization-issuance-v1.mjs");

if (isMain) {
  // CLI: structural pending-store validation only. Never registers, never
  // issues, never contacts Telegram. No ACTIVE-creating public CLI exists.
  const args = new Map();
  for (let i = 2; i < process.argv.length - 1; i += 2) {
    args.set(process.argv[i], process.argv[i + 1]);
  }
  const storePath = args.get("--pending-store");
  const result = storePath
    ? loadPendingStore(storePath)
    : reject("ISSUANCE_PENDING_STORE_UNAVAILABLE");
  process.stdout.write(
    `${JSON.stringify({
      schema_version: "v4-runtime-authorization-pending-store-check-v1",
      ok: result.ok === true,
      ...(result.store ? { decision_count: result.store.decisions.length } : {}),
      ...(result.reason_codes ? { reason_codes: result.reason_codes } : {}),
    })}\n`,
  );
  process.exit(result.ok === true ? 0 : 1);
}
