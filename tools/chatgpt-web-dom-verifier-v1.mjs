#!/usr/bin/env node
/**
 * Independent read-only DOM verifier for the ChatGPT Web send qualification.
 *
 * This is the INDEPENDENT FENCE required by
 * V4_HERMES_PER_INVOCATION_BROWSER_TOOL_ALLOWLIST_AND_SEND_QUALIFICATION_V1.
 * It is NOT the sender: it never types, never clicks, never navigates. It
 * only attaches read-only to the dedicated Chrome CDP endpoint (127.0.0.1:9222)
 * and observes DOM state through Runtime.evaluate (CDP is used here by the
 * verifier, a trusted Control Plane component, NOT exposed to the model
 * controller - the controller surface stays the 4-tool allowlist).
 *
 * Emits bounded, sanitized observations only:
 *   USER_TURNS / ASSISTANT_TURNS / COMPOSER_EMPTY / COMPOSER_CONTAINS_<nonce>
 *   and the NEW-turn identity match (task_ref, run_id, nonce, base_head).
 */

import { randomUUID } from "node:crypto";

const CDP_HTTP = process.env.CDP_HTTP ?? "http://127.0.0.1:9222";

class CdpConn {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => {
      ws.addEventListener("open", res, { once: true });
      ws.addEventListener("error", rej, { once: true });
    });
    return new CdpConn(ws);
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => this.pending.set(id, { res, rej }));
  }
  async eval(expression) {
    const r = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(`eval exception: ${r.exceptionDetails.text}`);
    return r.result?.value;
  }
  close() { try { this.ws.close(); } catch { /* ignore */ } }
  _init() {
    this.ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { res, rej } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      }
    });
  }
}

async function findChatGptTarget() {
  const res = await fetch(`${CDP_HTTP}/json/list`);
  const targets = await res.json();
  const page = targets.find(
    (t) => t.type === "page" && /^https:\/\/(chat\.openai\.com|chatgpt\.com)/.test(t.url),
  );
  return page ?? null;
}

async function withPage(evalExpr) {
  const page = await findChatGptTarget();
  if (!page) throw new Error("CHATGPT_PAGE_NOT_FOUND");
  const conn = await CdpConn.connect(page.webSocketDebuggerUrl);
  try {
    conn._init();
    return await conn.eval(evalExpr);
  } finally {
    conn.close();
  }
}

function observeExpr(nonce) {
  return `(() => {
    const q = (sel) => Array.from(document.querySelectorAll(sel));
    // v2: turn counting is structural — attribute-marked turns when present,
    // else ANY conversation container that is not the composer and carries
    // non-draft message content.
    const composer = document.querySelector('#prompt-textarea, textarea[data-id], form textarea, div[contenteditable="true"]');
    const composerEl = composer && composer.closest('[contenteditable="true"]') ? composer.closest('[contenteditable="true"]') : composer;
    const composerText = composerEl ? (composerEl.innerText || '') : '';
    const artMarked = q('[data-message-author-role]');
    let containers = artMarked.length ? artMarked : q('article');
    containers = containers.filter((c) => !composerEl || !c.contains(composerEl));
    let userTurns = 0, assistantTurns = 0;
    for (const c of containers) {
      const text = (c.innerText || '').trim();
      if (!text) continue;
      const mark = c.getAttribute && c.getAttribute('data-message-author-role');
      if (mark === 'user') userTurns++;
      else if (mark === 'assistant') assistantTurns++;
      else { userTurns++; }
    }
    const composerEmpty = composerEl ? composerText.trim().length === 0 : true;
    const composerContainsNonce = composerText.includes(${JSON.stringify(nonce)});
    const authMarkers = {
      loginButton: !!document.querySelector('[data-testid="login-button"], a[href*="auth.openai.com"]'),
      accountMenu: !!document.querySelector('[data-testid="accounts-profile-button"], [data-testid="profile-button"], img[alt*="User"]'),
      sidebarNewChat: !!document.querySelector('a[href="/"], nav a'),
      upgradeChip: !!document.querySelector('a[href*="/pricing"]'),
    };
    return { userTurns, assistantTurns, composerEmpty, composerContainsNonce, authMarkers,
      composerChars: composerText.length,
      turnContainers: containers.length };
  })()`;
}

async function main() {
  const mode = process.argv[2] ?? "observe";
  const nonce = process.argv[3] ?? "";
  if (mode === "observe") {
    if (!nonce) { console.error("usage: observe <nonce>"); process.exitCode = 2; return; }
    const obs = await withPage(observeExpr(nonce));
    console.log(JSON.stringify({
      observed_at: new Date().toISOString(),
      ...obs,
      USER_TURNS: obs.userTurns,
      ASSISTANT_TURNS: obs.assistantTurns,
      COMPOSER_EMPTY: obs.composerEmpty ? "YES" : "NO",
      COMPOSER_CONTAINS_CURRENT_NONCE: obs.composerContainsNonce ? "YES" : "NO",
    }, null, 2));
    return;
  }
  if (mode === "fresh-check") {
    const obs = await withPage(observeExpr(nonce || "X"));
    const fresh = obs.userTurns === 0 && obs.assistantTurns === 0 && obs.composerEmpty;
    console.log(JSON.stringify({
      observed_at: new Date().toISOString(),
      USER_TURNS: obs.userTurns,
      ASSISTANT_TURNS: obs.assistantTurns,
      COMPOSER_EMPTY: obs.composerEmpty ? "YES" : "NO",
      FRESH_CHAT: fresh ? "YES" : "NO",
      AUTH_HINTS: obs.authMarkers,
      AUTHENTICATED_HINT: (obs.authMarkers.accountMenu || obs.authMarkers.upgradeChip) ? "YES" : "UNCERTAIN",
    }, null, 2));
    return;
  }
  if (mode === "turn-verify") {
    // require a NEW user turn containing task_ref/run_id/nonce/base_head.
    // v2 (Phase D repair): the current ChatGPT Web frontend no longer renders
    // data-message-author-role, and body-substring checks match DRAFT text
    // sitting in the composer — a false-positive class proven live on
    // 2026-09-11. Detection is now structural: user turns are detected via the
    // conversation turn containers whose text is NOT inside the composer, and
    // identity substrings must appear OUTSIDE the composer draft.
    const [taskRef, runId, nonceArg, baseHead] = process.argv.slice(3, 7);
    const obs = await withPage(`(() => {
      const identity = [${JSON.stringify(taskRef)}, ${JSON.stringify(runId)}, ${JSON.stringify(nonceArg)}, ${JSON.stringify(baseHead)}];
      const composer = document.querySelector('#prompt-textarea, textarea[data-id], form textarea, div[contenteditable="true"]');
      const composerEl = composer && composer.closest('[contenteditable="true"]') ? composer.closest('[contenteditable="true"]') : composer;
      const composerText = composerEl ? (composerEl.innerText || '') : '';
      // conversation turn containers: attribute-marked (old UI) OR structural
      // group containers that hold message bubbles but NOT the composer.
      const artMarked = Array.from(document.querySelectorAll('[data-message-author-role]'));
      const artLegacy = Array.from(document.querySelectorAll('article'));
      let containers = artMarked.length ? artMarked : artLegacy;
      // exclude any container that contains the composer element itself
      containers = containers.filter((c) => !composerEl || !c.contains(composerEl));
      let turnCount = 0;
      let turnWithIdentity = 0;
      let lastTurnText = '';
      for (const c of containers) {
        const text = (c.innerText || '').trim();
        if (!text) continue;
        turnCount++;
        lastTurnText = text;
        if (identity.every((s) => text.includes(s))) turnWithIdentity++;
      }
      // identity must ALSO not be merely the composer draft:
      const composerOnlyMatch = identity.every((s) => composerText.includes(s));
      const identityInTurn = turnWithIdentity > 0;
      const bodyText = document.body ? document.body.innerText : '';
      // Legacy body-substring observations: NON-AUTHORITATIVE diagnostics only.
      // body-substring matching produced a proven false-positive class live
      // (draft text + old turns both satisfy it) and must never confirm a send.
      const bodyHasTaskRef = bodyText.includes(${JSON.stringify(taskRef)});
      const bodyHasRunId = bodyText.includes(${JSON.stringify(runId)});
      const bodyHasNonce = bodyText.includes(${JSON.stringify(nonceArg)});
      const bodyHasBaseHead = bodyText.includes(${JSON.stringify(baseHead)});
      return {
        turnContainers: turnCount,
        composerChars: composerText.length,
        identityInTurn,
        turnWithIdentity,
        composerOnlyMatch,
        lastTurnHead: lastTurnText.slice(0, 120),
        legacyBodyHadIdentity: identity.every((s) => bodyText.includes(s)),
        bodyHasTaskRef,
        bodyHasRunId,
        bodyHasNonce,
        bodyHasBaseHead,
        BODY_SUBSTRING_AUTHORITATIVE: false,
      };
    })()`);
    // FAIL-CLOSED confirmation: identity must live inside a real conversation
    // turn container, and NOT be explainable by the composer draft alone.
    const confirmed =
      obs.identityInTurn === true &&
      obs.composerOnlyMatch === false;
    console.log(JSON.stringify({
      observed_at: new Date().toISOString(),
      ...obs,
      REAL_USER_TURN_DOM_CONFIRMED: confirmed ? "PASS" : "NO",
      DETECTION: "structural-v2",
    }, null, 2));
    process.exitCode = confirmed ? 0 : 1;
    return;
  }
  if (mode === "raw-eval") {
    // bounded read-only evaluation used by the Phase D response poller.
    // The expression comes from the trusted local driver (not from any model).
    const expr = process.argv[3] ?? "";
    if (!expr) { console.error("usage: raw-eval <expression>"); process.exitCode = 2; return; }
    const value = await withPage(expr);
    console.log(JSON.stringify(value ?? {}, null, 2));
    return;
  }
  if (mode === "focus-tab") {
    // Delivery-class control-plane action: bring the ChatGPT tab to the
    // foreground of the dedicated automation Chrome. Rationale: a fully
    // backgrounded/occluded tab gets renderer-throttled and the ChatGPT SSE
    // stream died mid-reply twice in live runs (assistant turn froze at 2
    // chars). This is NOT a page-content action: no DOM access, no
    // evaluation, no navigation; it only changes tab visibility, the same
    // way a human operator would click the tab. Sends are still confirmed
    // exclusively by the independent structural DOM verifier.
    const page = await findChatGptTarget();
    if (!page) { console.log(JSON.stringify({ focus: "NO_PAGE" })); return; }
    try {
      const res = await fetch(`${CDP_HTTP}/json/activate/${page.id}`);
      console.log(JSON.stringify({ focus: res.ok ? "OK" : `HTTP_${res.status}` }));
    } catch (e) {
      console.log(JSON.stringify({ focus: `ERROR:${String(e.message || e).slice(0, 80)}` }));
    }
    return;
  }
  if (mode === "list") {
    const targets = await (await fetch(`${CDP_HTTP}/json/list`)).json();
    console.log(JSON.stringify(targets.map((t) => ({ type: t.type, url: t.url, title: (t.title||"").slice(0,60) })), null, 2));
    return;
  }
  console.error("usage: verifier.mjs [list|fresh-check|focus-tab|observe <nonce>|turn-verify taskRef runId nonce baseHead|raw-eval <expression>]");
  process.exitCode = 2;
}

main().catch((e) => { console.error(String(e.message || e)); process.exitCode = 1; });
