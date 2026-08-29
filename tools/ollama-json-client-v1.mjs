#!/usr/bin/env node
/**
 * ollama-json-client-v1 — shared localhost Ollama JSON transport.
 *
 * Transport only: /api/generate with stream=false, think=false, format=json.
 * Never ollama run. No role/routing policy. No secrets logging.
 */
export const DEFAULT_MODEL = "qwen3:14b";
export const DEFAULT_BASE_URL = "http://127.0.0.1:11434";
export const DEFAULT_TIMEOUT_MS = 20_000;

/**
 * Binding precedence: explicit option > env > compatibility default.
 */
export function resolveOllamaConfig(options = {}) {
  const timeoutRaw =
    options.timeoutMs != null
      ? Number(options.timeoutMs)
      : process.env.OLLAMA_TIMEOUT_MS != null && String(process.env.OLLAMA_TIMEOUT_MS).trim() !== ""
        ? Number(process.env.OLLAMA_TIMEOUT_MS)
        : DEFAULT_TIMEOUT_MS;
  return {
    baseUrl: options.baseUrl || process.env.OLLAMA_BASE_URL || DEFAULT_BASE_URL,
    model: options.model || process.env.OLLAMA_MODEL || DEFAULT_MODEL,
    timeoutMs: Number.isFinite(timeoutRaw) && timeoutRaw > 0 ? timeoutRaw : DEFAULT_TIMEOUT_MS,
  };
}

export function buildGeneratePayload({ model, prompt, baseUrl = DEFAULT_BASE_URL }) {
  const url = `${String(baseUrl).replace(/\/$/, "")}/api/generate`;
  return {
    url,
    body: {
      model,
      prompt,
      stream: false,
      think: false,
      format: "json",
    },
  };
}

export async function ollamaReachable(baseUrl, timeoutMs = 3000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${String(baseUrl).replace(/\/$/, "")}/api/tags`, {
      signal: ctrl.signal,
    });
    return r.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function callOllamaGenerate({ baseUrl, model, prompt, timeoutMs }) {
  const { url, body } = buildGeneratePayload({ model, prompt, baseUrl });
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
      const err = new Error(`ollama http ${r.status}`);
      err.classification = "MODEL_ERROR";
      throw err;
    }
    const data = await r.json();
    return String(data.response || "").trim();
  } finally {
    clearTimeout(timer);
  }
}

export function parseJsonModelResponse(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, error: "empty" };
  }
  try {
    return { ok: true, value: JSON.parse(raw.trim()) };
  } catch {
    return { ok: false, error: "invalid_json" };
  }
}
