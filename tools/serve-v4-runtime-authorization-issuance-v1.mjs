#!/usr/bin/env node
/**
 * V4 — Windows-local runtime authorization issuance service (OFFLINE-capable).
 * External surface: POST /v4/authorization/register-pending and
 * POST /v4/authorization/status ONLY. There is NO /issue, /approve, /reject
 * or any HTTP route that can represent a human decision.
 * Human decisions arrive exclusively via the direct Telegram client consumed
 * server-side (injected; production client never invoked in offline tests).
 * Planned production bind: 127.0.0.1:18792. Tests MUST use ephemeral port 0.
 * No spend-ledger path is accepted. No execution, no adapter.
 */
import http from "node:http";
import { isAbsolute } from "node:path";
import {
  ISSUANCE_REJECT,
  REGISTER_PENDING_REQUEST_SCHEMA,
  STATUS_REQUEST_SCHEMA,
  loadIssuanceConfig,
  registerPendingAuthorization,
  getPendingAuthorizationStatus,
  handleTelegramDecisionUpdate,
  createTelegramBotClient,
  startTelegramDecisionPolling,
  createPendingStoreMutationMutex,
} from "./v4-runtime-authorization-issuance-v1.mjs";
import {
  loadRegistry,
  issueActiveEntry,
} from "./v4-runtime-authorization-provenance-registry-v1.mjs";

export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 18792;
export const REGISTER_PENDING_PATH = "/v4/authorization/register-pending";
export const STATUS_PATH = "/v4/authorization/status";

function wrapRegisterResult(partial) {
  return {
    schema_version: "v4-runtime-authorization-register-pending-result-v1",
    ok: partial.ok === true,
    classification: partial.classification || ISSUANCE_REJECT,
    pending_decision_id: partial.pending_decision_id ?? null,
    authorization_id: partial.authorization_id ?? null,
    state: partial.ok === true ? "PENDING" : null,
    pending_expires_at: partial.pending_expires_at ?? null,
    reason_codes: partial.reason_codes || [],
  };
}

function wrapStatusResult(partial) {
  return {
    schema_version: "v4-runtime-authorization-status-result-v1",
    ok: partial.ok === true,
    classification: partial.classification || ISSUANCE_REJECT,
    pending_decision_id: partial.pending_decision_id ?? null,
    authorization_id: partial.authorization_id ?? null,
    state: partial.state ?? null,
    pending_expires_at: partial.pending_expires_at ?? null,
    authorization_expires_at: partial.authorization_expires_at ?? null,
    reason_codes: partial.reason_codes || [],
  };
}

/**
 * Handle one validated HTTP request body against the two allowed operations.
 * options inject config loader, pending-store functions, Telegram client.
 */
export async function handleIssuanceRequest(pathname, body, options = {}) {
  if (pathname !== REGISTER_PENDING_PATH && pathname !== STATUS_PATH) {
    return {
      status: 404,
      body: wrapRegisterResult({
        ok: false,
        classification: "ISSUANCE_PATH_REJECTED",
        reason_codes: ["PATH_NOT_FOUND"],
      }),
    };
  }

  // Config resolution: prefer an already-resolved config (service startup),
  // else load from the configured absolute path. Never from the request.
  const configLoader = options.loadIssuanceConfig || loadIssuanceConfig;
  const configPath = options.issuanceConfigPath;
  let config = options.config || null;
  if (!config) {
    if (!configPath || typeof configPath !== "string" || !isAbsolute(configPath)) {
      return {
        status: 200,
        body: wrapRegisterResult({
          ok: false,
          classification: ISSUANCE_REJECT,
          reason_codes: ["ISSUANCE_CONFIG_UNAVAILABLE"],
        }),
      };
    }
    const configResult = configLoader(configPath);
    if (!configResult.ok) {
      return {
        status: 200,
        body:
          pathname === REGISTER_PENDING_PATH
            ? wrapRegisterResult(configResult)
            : wrapStatusResult(configResult),
      };
    }
    config = configResult.config;
  }

  if (pathname === STATUS_PATH) {
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      body.schema_version !== STATUS_REQUEST_SCHEMA ||
      typeof body.pending_decision_id !== "string" ||
      Object.keys(body).length !== 2
    ) {
      return {
        status: 200,
        body: wrapStatusResult({
          ok: false,
          classification: ISSUANCE_REJECT,
          reason_codes: ["ISSUANCE_STATUS_REQUEST_INVALID"],
        }),
      };
    }
    const result = getPendingAuthorizationStatus(
      config.pending_store_path,
      body.pending_decision_id,
      options,
    );
    return { status: 200, body: wrapStatusResult(result) };
  }

  // register-pending: exact key set, no caller-supplied paths/identity/token
  const result = await registerPendingAuthorization(
    config.pending_store_path,
    body,
    {
      ...options,
      config,
      registryPath: config.registry_path,
      loadRegistry: options.loadRegistry || loadRegistry,
      telegram: options.telegram,
    },
  );
  return { status: 200, body: wrapRegisterResult(result) };
}

export async function createIssuanceRequestHandler(options = {}) {
  return async function handle(req, res) {
    const send = (status, obj) => {
      try {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(`${JSON.stringify(obj)}\n`);
      } catch {
        /* client gone */
      }
    };

    if (req.method !== "POST") {
      send(
        405,
        wrapRegisterResult({
          ok: false,
          classification: "ISSUANCE_METHOD_REJECTED",
          reason_codes: ["POST_ONLY"],
        }),
      );
      return;
    }

    let url;
    try {
      url = new URL(req.url, "http://127.0.0.1");
    } catch {
      send(
        400,
        wrapRegisterResult({
          ok: false,
          classification: "ISSUANCE_URL_INVALID",
          reason_codes: ["URL_UNPARSEABLE"],
        }),
      );
      return;
    }
    if (url.search && url.search.length > 0) {
      send(
        400,
        wrapRegisterResult({
          ok: false,
          classification: "ISSUANCE_QUERY_REJECTED",
          reason_codes: ["QUERY_PARAMETERS_FORBIDDEN"],
        }),
      );
      return;
    }

    const ctype = String(req.headers["content-type"] || "").toLowerCase();
    if (!ctype.includes("application/json")) {
      send(
        400,
        wrapRegisterResult({
          ok: false,
          classification: "ISSUANCE_CONTENT_TYPE_REJECTED",
          reason_codes: ["APPLICATION_JSON_REQUIRED"],
        }),
      );
      return;
    }

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      send(
        400,
        wrapRegisterResult({
          ok: false,
          classification: "ISSUANCE_BODY_INVALID",
          reason_codes: ["JSON_UNPARSEABLE"],
        }),
      );
      return;
    }

    const result = await handleIssuanceRequest(url.pathname, body, options);
    send(result.status, result.body);
  };
}

/**
 * Start the issuance service.
 * Production default: loads config, creates the DIRECT Telegram bot client,
 * wires issueActiveEntry/loadRegistry into the decision handler, starts HTTP,
 * then starts exactly ONE Telegram poll loop. close() stops both.
 * Tests inject fake telegram / poller via options (DI only, zero real calls).
 */
export async function startRuntimeAuthorizationIssuanceService(options = {}) {
  const host = options.host || DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;

  const configLoader = options.loadIssuanceConfig || loadIssuanceConfig;
  let config = options.config || null;
  if (!config && options.issuanceConfigPath) {
    const configResult = configLoader(options.issuanceConfigPath);
    if (!configResult.ok) {
      throw new Error(configResult.reason_codes?.[0] || "ISSUANCE_CONFIG_UNAVAILABLE");
    }
    config = configResult.config;
  }

  // Telegram transport: injected in tests; production client from config
  // ONLY when explicitly allowed (CLI sets the flag). Otherwise a missing
  // injection is a startup error — never a silent real-network client.
  let telegram = options.telegram || null;
  let abortController = null;
  if (!telegram && config) {
    if (options.allowProductionTelegramClient !== true) {
      throw new Error("ISSUANCE_TELEGRAM_TRANSPORT_UNAVAILABLE");
    }
    abortController = new AbortController();
    telegram = options.createTelegramClient
      ? options.createTelegramClient(config)
      : createTelegramBotClient(config, { signal: abortController.signal });
  }

  // One pending-store mutation lane per process — shared by HTTP register
  // and the Telegram decision poller so neither can clobber the other.
  const mutationMutex =
    options.mutationMutex || createPendingStoreMutationMutex();

  const handlerOptions = {
    ...options,
    config,
    telegram,
    mutationMutex,
    loadRegistry: options.loadRegistry || loadRegistry,
  };
  const handler = await createIssuanceRequestHandler(handlerOptions);

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      handler(req, res).catch(() => {
        try {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            `${JSON.stringify(
              wrapRegisterResult({
                ok: false,
                classification: "ISSUANCE_INTERNAL_FAIL_CLOSED",
                reason_codes: ["HANDLER_ERROR"],
              }),
            )}\n`,
          );
        } catch {
          /* ignore */
        }
      });
    });
    server.on("error", reject);
    server.listen(port, host, () => {
      // Direct Telegram decision poller: one loop, decision-handler wired.
      let poller = null;
      if (options.poller !== null && telegram && config) {
        const candidate =
          options.poller ||
          startTelegramDecisionPolling({
            telegram,
            handlerOptions: {
              config,
              pendingStorePath: config.pending_store_path,
              mutationMutex,
              loadRegistry: options.loadRegistry || loadRegistry,
              issueActiveEntry: options.issueActiveEntry || issueActiveEntry,
              acknowledgeCallback: async (id) =>
                telegram.answerCallbackQuery(id),
            },
            onAbort: abortController ? () => abortController.abort() : null,
            pollTimeoutSeconds: options.pollTimeoutSeconds,
            idleDelayMs: options.idleDelayMs,
            initialBackoffMs: options.initialBackoffMs,
            maxBackoffMs: options.maxBackoffMs,
          });
        if (candidate && candidate.ok === true && typeof candidate.stop === "function") {
          poller = candidate;
        }
      }
      resolve({
        server,
        address: server.address(),
        telegram,
        poller,
        mutationMutex,
        close: () =>
          new Promise((r) => {
            if (poller && typeof poller.stop === "function") {
              poller.stop();
              Promise.race([
                poller.stopped,
                new Promise((r2) => setTimeout(r2, 30000)),
              ]).then(() => server.close(() => r()));
            } else {
              server.close(() => r());
            }
          }),
      });
    });
  });
}

const isMain =
  process.argv[1] &&
  process.argv[1]
    .replace(/\\/g, "/")
    .endsWith("/serve-v4-runtime-authorization-issuance-v1.mjs");

if (isMain) {
  const args = new Map();
  for (let i = 2; i < process.argv.length - 1; i += 2) {
    args.set(process.argv[i], process.argv[i + 1]);
  }
  const configPath = args.get("--issuance-config") || "";
  if (!configPath || !isAbsolute(configPath)) {
    process.stderr.write(
      `${JSON.stringify({
        schema_version: "v4-runtime-authorization-issuance-service-started-v1",
        ok: false,
        error_class: "ISSUANCE_CONFIG_REQUIRED",
      })}\n`,
    );
    process.exit(1);
  }
  const host = args.get("--host") || DEFAULT_HOST;
  const port = Number(args.get("--port") || DEFAULT_PORT);
  // Test-only escape hatch: "--poller off" disables the Telegram poll loop so
  // offline test harnesses can exercise CLI parsing with zero network. The
  // canonical production command line never uses it.
  const pollerOff = args.get("--poller") === "off";
  startRuntimeAuthorizationIssuanceService({
    host,
    port,
    issuanceConfigPath: configPath,
    allowProductionTelegramClient: true,
    ...(pollerOff ? { poller: null } : {}),
  })
    .then(({ address }) => {
      process.stdout.write(
        `${JSON.stringify({
          schema_version: "v4-runtime-authorization-issuance-service-started-v1",
          ok: true,
          host: address.address,
          port: address.port,
          register_pending_path: REGISTER_PENDING_PATH,
          status_path: STATUS_PATH,
        })}\n`,
      );
    })
    .catch(() => {
      process.stderr.write(
        `${JSON.stringify({
          schema_version: "v4-runtime-authorization-issuance-service-started-v1",
          ok: false,
          error_class: "ISSUANCE_BIND_FAILED",
        })}\n`,
      );
      process.exit(1);
    });
}
