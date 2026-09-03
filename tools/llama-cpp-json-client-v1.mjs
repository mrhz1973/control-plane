#!/usr/bin/env node
/**
 * llama-cpp-json-client-v1 — OpenAI-compatible JSON client for local llama-server.
 *
 * Primary transport for logical qwen_local (DFlash2 is an internal server/runtime
 * mechanism — callers do not address the draft model separately).
 * stream=false. No chain-of-thought persistence. No secrets logging.
 */
export const DEFAULT_BASE_URL = "http://127.0.0.1:8080";
export const DEFAULT_TIMEOUT_MS = 120_000;
export const DEFAULT_MODEL_ID = "qwen38-opus-q3-daily-16k";

/**
 * Binding precedence: explicit option > QWEN_LOCAL_* env > defaults.
 */
export function resolveLlamaCppConfig(options = {}) {
  const timeoutRaw =
    options.timeoutMs != null
      ? Number(options.timeoutMs)
      : process.env.QWEN_LOCAL_TIMEOUT_MS != null &&
          String(process.env.QWEN_LOCAL_TIMEOUT_MS).trim() !== ""
        ? Number(process.env.QWEN_LOCAL_TIMEOUT_MS)
        : DEFAULT_TIMEOUT_MS;
  return {
    baseUrl:
      options.baseUrl ||
      process.env.QWEN_LOCAL_BASE_URL ||
      DEFAULT_BASE_URL,
    model:
      options.model ||
      process.env.QWEN_LOCAL_MODEL ||
      DEFAULT_MODEL_ID,
    timeoutMs:
      Number.isFinite(timeoutRaw) && timeoutRaw > 0
        ? timeoutRaw
        : DEFAULT_TIMEOUT_MS,
  };
}

export async function llamaCppReachable(baseUrl, timeoutMs = 3000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${String(baseUrl).replace(/\/$/, "")}/v1/models`, {
      signal: ctrl.signal,
    });
    return r.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function listLlamaCppModels(baseUrl, timeoutMs = 5000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${String(baseUrl).replace(/\/$/, "")}/v1/models`, {
      signal: ctrl.signal,
    });
    if (!r.ok) {
      const err = new Error(`llama.cpp models http ${r.status}`);
      err.classification = "MODEL_ERROR";
      throw err;
    }
    const data = await r.json();
    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows
      .map((row) => (row && typeof row.id === "string" ? row.id : null))
      .filter(Boolean);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * One structured chat completion. Returns assistant message text.
 * Does not persist reasoning / CoT fields even if the server returns them.
 */
export async function callLlamaCppChat({
  baseUrl,
  model,
  prompt,
  timeoutMs,
  system,
}) {
  const url = `${String(baseUrl).replace(/\/$/, "")}/v1/chat/completions`;
  const messages = [];
  if (typeof system === "string" && system.trim()) {
    messages.push({ role: "system", content: system });
  }
  messages.push({ role: "user", content: prompt });

  const body = {
    model,
    messages,
    stream: false,
    temperature: 0,
  };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const err = new Error(`llama.cpp chat http ${r.status}`);
      err.classification = "MODEL_ERROR";
      throw err;
    }
    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content;
    return String(content || "").trim();
  } finally {
    clearTimeout(timer);
  }
}

export function parseJsonModelResponse(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, error: "empty" };
  }
  const trimmed = raw.trim();
  try {
    return { ok: true, value: JSON.parse(trimmed) };
  } catch {
    // Tolerate accidental markdown fences without persisting raw beyond parse.
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced && fenced[1]) {
      try {
        return { ok: true, value: JSON.parse(fenced[1].trim()) };
      } catch {
        return { ok: false, error: "invalid_json" };
      }
    }
    return { ok: false, error: "invalid_json" };
  }
}
