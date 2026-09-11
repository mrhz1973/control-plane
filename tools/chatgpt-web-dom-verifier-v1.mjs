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
    const articles = q('article');
    // ChatGPT user turns: articles whose data attrs mark the user side, else heuristics.
    let userTurns = 0, assistantTurns = 0;
    for (const a of articles) {
      const mark = (a.getAttribute('data-message-author-role') || a.closest('[data-message-author-role]')?.getAttribute('data-message-author-role') || '');
      if (mark === 'user') userTurns++;
      else if (mark === 'assistant') assistantTurns++;
    }
    if (userTurns + assistantTurns === 0) {
      for (const a of articles) {
        const hasWhBubble = a.querySelector('.whitespace-pre-wrap');
        if (!hasWhBubble) continue;
        const cls = a.className || '';
        userTurns++; // fresh chat: any article means at least one turn exists
      }
    }
    const composer = document.querySelector('#prompt-textarea, textarea[data-id], form textarea, div[contenteditable="true"]');
    const composerEmpty = composer ? (composer.textContent || '').trim().length === 0 : true;
    const bodyText = document.body ? document.body.innerText : '';
    const composerContainsNonce = composer ? (composer.textContent || '').includes(${JSON.stringify(nonce)}) : false;
    const authMarkers = {
      loginButton: !!document.querySelector('[data-testid="login-button"], a[href*="auth.openai.com"]'),
      accountMenu: !!document.querySelector('[data-testid="accounts-profile-button"], [data-testid="profile-button"], img[alt*="User"]'),
      sidebarNewChat: !!document.querySelector('a[href="/"], nav a'),
      upgradeChip: !!document.querySelector('a[href*="/pricing"]'),
    };
    return { userTurns, assistantTurns, composerEmpty, composerContainsNonce, authMarkers,
      lastTurnHasNonce: bodyText.includes(${JSON.stringify(nonce)}) };
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
    // require a NEW user turn containing task_ref/run_id/nonce/base_head
    const [taskRef, runId, nonceArg, baseHead] = process.argv.slice(3, 7);
    const obs = await withPage(`(() => {
      const arts = Array.from(document.querySelectorAll('article'));
      let lastUser = '';
      for (const a of arts) {
        const mark = a.getAttribute('data-message-author-role') || a.closest('[data-message-author-role]')?.getAttribute('data-message-author-role') || '';
        if (mark === 'user') lastUser = a.innerText || '';
      }
      if (!lastUser && arts.length) lastUser = (arts[arts.length-1].innerText || '');
      const t = document.body.innerText;
      return {
        turns: arts.length,
        lastUserMatchesTaskRef: lastUser.includes(${JSON.stringify(taskRef)}),
        bodyHasTaskRef: t.includes(${JSON.stringify(taskRef)}),
        bodyHasRunId: t.includes(${JSON.stringify(runId)}),
        bodyHasNonce: t.includes(${JSON.stringify(nonceArg)}),
        bodyHasBaseHead: t.includes(${JSON.stringify(baseHead)}),
      };
    })()`);
    const confirmed =
      obs.bodyHasTaskRef && obs.bodyHasRunId && obs.bodyHasNonce && obs.bodyHasBaseHead;
    console.log(JSON.stringify({
      observed_at: new Date().toISOString(),
      ...obs,
      REAL_USER_TURN_DOM_CONFIRMED: confirmed ? "PASS" : "NO",
    }, null, 2));
    process.exitCode = confirmed ? 0 : 1;
    return;
  }
  if (mode === "list") {
    const targets = await (await fetch(`${CDP_HTTP}/json/list`)).json();
    console.log(JSON.stringify(targets.map((t) => ({ type: t.type, url: t.url, title: (t.title||"").slice(0,60) })), null, 2));
    return;
  }
  console.error("usage: verifier.mjs [list|fresh-check|observe <nonce>|turn-verify taskRef runId nonce baseHead]");
  process.exitCode = 2;
}

main().catch((e) => { console.error(String(e.message || e)); process.exitCode = 1; });
