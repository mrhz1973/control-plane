#!/usr/bin/env node
/**
 * D-0024-W — Deterministic LiteLLM /v1/responses body normalizer.
 *
 * Accepts canonical Responses JSON or captured SSE (ChatGPT/Codex path) and
 * returns one canonical Responses object. No network. No secret logging.
 */
const RESPONSES_OBJECT_MARKERS = new Set(["response"]);

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function isResponsesObject(value) {
  if (!isPlainObject(value)) return false;
  if (value.object === "response") return true;
  if (Array.isArray(value.output) && typeof value.status === "string") return true;
  return false;
}

function parseSseDataLines(text) {
  const events = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith(":")) continue;
    if (line.startsWith("event:")) continue;
    let payload = line;
    if (line.startsWith("data:")) {
      payload = line.slice(5).trim();
    }
    if (!payload || payload === "[DONE]") continue;
    let parsed;
    try {
      parsed = JSON.parse(payload);
    } catch {
      throw new Error("SSE_MALFORMED_JSON_LINE");
    }
    if (!isPlainObject(parsed)) {
      throw new Error("SSE_MALFORMED_EVENT_OBJECT");
    }
    events.push(parsed);
  }
  return events;
}

function mergeOutputItems(completedResponse, outputItemsByIndex) {
  const response = { ...completedResponse };
  const existing = Array.isArray(response.output) ? response.output : [];
  if (existing.length > 0 || outputItemsByIndex.size === 0) {
    return response;
  }
  response.output = [...outputItemsByIndex.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, item]) => item);
  return response;
}

/**
 * Normalize a /v1/responses HTTP body to one canonical Responses object.
 */
export function normalizeResponsesBody(rawText) {
  const text = String(rawText ?? "").replace(/^\uFEFF/, "");
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      ok: false,
      classification: "EMPTY_BODY",
      reason: "Response body is empty",
    };
  }

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (isPlainObject(parsed) && parsed.error != null) {
        return {
          ok: false,
          classification: "API_ERROR",
          reason: "Top-level API error in JSON body",
          error: parsed.error,
        };
      }
      if (isResponsesObject(parsed)) {
        return {
          ok: true,
          classification: "PASS",
          source_format: "json",
          response: parsed,
        };
      }
    } catch {
      // fall through to SSE parsing for bodies that look like JSON but aren't
    }
  }

  let events;
  try {
    events = parseSseDataLines(trimmed);
  } catch (err) {
    return {
      ok: false,
      classification: "SSE_MALFORMED",
      reason: String(err.message || err),
    };
  }

  if (events.length === 0) {
    return {
      ok: false,
      classification: "SSE_MALFORMED",
      reason: "No parseable SSE data events found",
    };
  }

  const outputItemsByIndex = new Map();
  let completedResponse = null;
  let terminalError = null;
  let completedCount = 0;

  for (const event of events) {
    const eventType = event.type;
    if (eventType === "response.output_item.done") {
      const item = event.item;
      if (!isPlainObject(item)) continue;
      const idx =
        typeof event.output_index === "number"
          ? event.output_index
          : outputItemsByIndex.size;
      outputItemsByIndex.set(idx, item);
      continue;
    }
    if (eventType === "response.completed") {
      completedCount += 1;
      if (completedCount > 1) {
        return {
          ok: false,
          classification: "SSE_MULTIPLE_TERMINAL_RESPONSES",
          reason: "Multiple response.completed events are incompatible",
        };
      }
      const responsePayload = event.response;
      if (!isPlainObject(responsePayload)) {
        return {
          ok: false,
          classification: "SSE_MALFORMED",
          reason: "response.completed missing response object",
        };
      }
      completedResponse = responsePayload;
      continue;
    }
    if (eventType === "response.failed" || eventType === "error") {
      terminalError = event;
    }
  }

  if (terminalError && !completedResponse) {
    return {
      ok: false,
      classification: "SSE_TERMINAL_ERROR",
      reason: "SSE stream ended in failed/error event",
      error: terminalError.error ?? terminalError,
    };
  }

  if (!completedResponse && outputItemsByIndex.size > 0) {
    completedResponse = {
      object: "response",
      status: "completed",
      output: [],
    };
  }

  if (!completedResponse) {
    return {
      ok: false,
      classification: "SSE_NO_COMPLETED_RESPONSE",
      reason: "No response.completed terminal event found and no response.output_item.done items were available",
    };
  }

  const response = mergeOutputItems(completedResponse, outputItemsByIndex);
  if (!isResponsesObject(response)) {
    return {
      ok: false,
      classification: "SSE_MALFORMED",
      reason: "Merged SSE payload is not a Responses object",
    };
  }

  return {
    ok: true,
    classification: "PASS",
    source_format: "sse",
    response,
  };
}

export function collectFunctionCalls(output) {
  if (!Array.isArray(output)) return [];
  return output.filter(
    (item) => item && typeof item === "object" && item.type === "function_call",
  );
}

const isDirectRun =
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));

if (isDirectRun) {
  import("node:fs").then(({ readFileSync }) => {
    const path = process.argv[2];
    if (!path) {
      process.stderr.write(
        "Usage: node tools/normalize-litellm-responses-body.mjs <body.txt>\n",
      );
      process.exit(1);
    }
    const text = readFileSync(path, "utf8");
    const result = normalizeResponsesBody(text);
    process.stdout.write(`${JSON.stringify(result)}\n`);
    process.exit(result.ok ? 0 : 1);
  });
}
