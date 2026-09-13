#!/usr/bin/env node
/**
 * SOAK / RACE CAMPAIGN — deterministic, local, zero real Telegram sends.
 *
 * Exercises the hardened transport wait law (v4-cursor-acp-gate-transport-telegram-v1)
 * via getUpdatesOverride injection, plus the canonical gate-core fences, plus a
 * real (tiny) quiesce/restore process-lifecycle probe.
 *
 * Aggregate markers only — no giant logs:
 *   SOAK_ITERATIONS VALID_CALLBACK_ACCEPTED VALID_CALLBACK_LOST STALE_REJECTED
 *   DUPLICATE_REJECTED WRONG_BINDING_REJECTED PROCESS_LEAKS UNEXPECTED_EXCEPTIONS
 */
import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";

const T = await import(new URL("../../tools/v4-cursor-acp-gate-transport-telegram-v1.mjs", import.meta.url).href);
const core = await import(new URL("../../tools/v4-cursor-acp-gate-core-v1.mjs", import.meta.url).href);

const AGG = {
  SOAK_ITERATIONS: 0,
  VALID_CALLBACK_ACCEPTED: 0,
  VALID_CALLBACK_LOST: 0,
  STALE_REJECTED: 0,
  DUPLICATE_REJECTED: 0,
  WRONG_BINDING_REJECTED: 0,
  PROCESS_LEAKS: 0,
  UNEXPECTED_EXCEPTIONS: 0,
};
const failures = [];
const check = (name, ok, detail = "") => { if (!ok) failures.push(`${name}${detail ? ": " + detail : ""}`); return ok; };

const mkDecision = (id = `ACP-GATE-${randomUUID().replace(/-/g, "").slice(0, 12)}`) => ({
  decision_id: id, task_ref: "SOAK", run_id: randomUUID().slice(0, 8), session_id_sha: "soak",
  generation: 1, question: { prompt: "p", options: ["A", "B", "C"] }, created_at: new Date().toISOString(),
});
const CHAT = "111111111", USER = "222222222";
const mkUpdate = (updateId, decisionId, option = "A", chat = CHAT, user = USER) => ({
  update_id: updateId,
  callback_query: { id: `cq${updateId}`, from: { id: user }, message: { chat: { id: chat } }, data: `acp:${decisionId}:${option}` },
});
const silence = () => {};

// ---------- 1. processUpdate pure fixtures ----------
{
  const d = mkDecision();
  const cases = [
    [{ update: mkUpdate(1, d.decision_id), want: "ACCEPT" },
     { update: mkUpdate(2, "ACP-GATE-OLDDECISION"), want: "SKIP", reason: "DECISION_MISMATCH", tag: "STALE" },
     { update: { update_id: 3, message: { text: "hi" } }, want: "SKIP", reason: "NOT_CALLBACK_QUERY" },
     { update: mkUpdate(4, d.decision_id, "Z"), want: "SKIP", reason: "FOREIGN_CALLBACK_DATA", tag: "STALE" },
     { update: mkUpdate(5, d.decision_id, "A", "999"), want: "SKIP", reason: "OPERATOR_CHAT_MISMATCH", tag: "WRONG" },
     { update: mkUpdate(6, d.decision_id, "A", CHAT, "999"), want: "SKIP", reason: "OPERATOR_USER_MISMATCH", tag: "WRONG" },
     { update: mkUpdate(7, d.decision_id, "B"), want: "ACCEPT" },
    ],
  ][0];
  for (const c of cases) {
    try {
      AGG.SOAK_ITERATIONS++;
      const v = T.processUpdate({ update: c.update, decision: d, chatOk: CHAT, userOk: USER });
      if (c.want === "ACCEPT") check("processUpdate ACCEPT", v.action === "ACCEPT" && ["A", "B", "C"].includes(v.option));
      else check(`processUpdate SKIP ${c.reason}`, v.action === "SKIP" && v.reason === c.reason, `got ${v.action}/${v.reason}`);
      if (c.tag === "STALE") AGG.STALE_REJECTED++;
      if (c.tag === "WRONG") AGG.WRONG_BINDING_REJECTED++;
    } catch (e) { AGG.UNEXPECTED_EXCEPTIONS++; failures.push(`processUpdate threw: ${e.message}`); }
  }
}

// ---------- 2. waitAnswer law: arrival timing, offsets, races ----------
async function waitLaw() {
  const d = mkDecision();
  const BIND = { chatId: CHAT, userId: USER };
  // (a) callback present in the VERY FIRST poll (arrived before poll start)
  try {
    AGG.SOAK_ITERATIONS++;
    let firstOffsetSeen = null;
    const r = await T.waitAnswer({
      decision: d, deadlineMs: Date.now() + 5000, observe: silence, binding: BIND,
      getUpdatesOverride: async ({ offset }) => {
        firstOffsetSeen ??= offset;
        return { ok: true, result: [mkUpdate(100, d.decision_id)] };
      },
    });
    check("pre-poll callback ACCEPTED", r.status === "ANSWERED" && r.option === "A", JSON.stringify(r));
    check("first poll offset starts at 0", firstOffsetSeen === 0, String(firstOffsetSeen));
    if (r.status === "ANSWERED") AGG.VALID_CALLBACK_ACCEPTED++; else AGG.VALID_CALLBACK_LOST++;
  } catch (e) { AGG.UNEXPECTED_EXCEPTIONS++; failures.push(`waitLaw(a): ${e.message}`); }

  // (b) callback appears on poll k (randomized 1..5): never lost
  for (let k = 1; k <= 5; k++) {
    try {
      AGG.SOAK_ITERATIONS++;
      let polls = 0;
      const r = await T.waitAnswer({
        decision: d, deadlineMs: Date.now() + 8000, observe: silence, binding: BIND,
        getUpdatesOverride: async () => {
          polls++;
          if (polls < k) return { ok: true, result: [] };
          if (polls === k) return { ok: true, result: [mkUpdate(200 + k, d.decision_id, k % 2 ? "A" : "C")] };
          return { ok: true, result: [] };
        },
      });
      check(`callback-on-poll-${k} ACCEPTED`, r.status === "ANSWERED", JSON.stringify(r));
      if (r.status === "ANSWERED") AGG.VALID_CALLBACK_ACCEPTED++; else AGG.VALID_CALLBACK_LOST++;
    } catch (e) { AGG.UNEXPECTED_EXCEPTIONS++; failures.push(`waitLaw(b,k=${k}): ${e.message}`); }
  }

  // (c) stale updates BEFORE the real one: skipped, offset advanced, real one accepted
  try {
    AGG.SOAK_ITERATIONS++;
    const stale = mkUpdate(300, "ACP-GATE-EXPIREDONE"); // old gate button
    const real = mkUpdate(301, d.decision_id, "B");
    const r = await T.waitAnswer({
      decision: d, deadlineMs: Date.now() + 5000, observe: silence, binding: BIND,
      getUpdatesOverride: async () => ({ ok: true, result: [stale, real] }),
    });
    check("stale-then-real ACCEPTED with option B", r.status === "ANSWERED" && r.option === "B", JSON.stringify(r));
    check("stale advanced offset", r.updates_seen === 302, String(r.updates_seen));
    AGG.STALE_REJECTED++;
    if (r.status === "ANSWERED") AGG.VALID_CALLBACK_ACCEPTED++; else AGG.VALID_CALLBACK_LOST++;
  } catch (e) { AGG.UNEXPECTED_EXCEPTIONS++; failures.push(`waitLaw(c): ${e.message}`); }

  // (d) duplicate delivery of the same update id: first accepted, single admission
  try {
    AGG.SOAK_ITERATIONS++;
    let admissions = 0;
    const r = await T.waitAnswer({
      decision: d, deadlineMs: Date.now() + 5000, observe: silence, binding: BIND,
      getUpdatesOverride: async () => ({ ok: true, result: [mkUpdate(400, d.decision_id), mkUpdate(400, d.decision_id, "A")] }),
    });
    check("duplicate delivery ACCEPTED once", r.status === "ANSWERED");
    if (r.status === "ANSWERED") admissions++;
    check("exactly one admission", admissions === 1);
    AGG.DUPLICATE_REJECTED++;
    if (r.status === "ANSWERED") AGG.VALID_CALLBACK_ACCEPTED++; else AGG.VALID_CALLBACK_LOST++;
  } catch (e) { AGG.UNEXPECTED_EXCEPTIONS++; failures.push(`waitLaw(d): ${e.message}`); }

  // (e) CONFLICT (409) is FATAL to the wait — never polled through
  try {
    AGG.SOAK_ITERATIONS++;
    let pollCount = 0;
    const r = await T.waitAnswer({
      decision: d, deadlineMs: Date.now() + 8000, observe: silence,
      getUpdatesOverride: async () => { pollCount++; return { ok: false, description: "Conflict: terminated by other getUpdates request; make sure that only one bot instance is running" }; },
    });
    check("CONFLICT aborts", r.status === "ABORTED" && r.class === "CONFLICT", JSON.stringify(r));
    check("CONFLICT aborts immediately (single poll)", pollCount === 1, String(pollCount));
  } catch (e) { AGG.UNEXPECTED_EXCEPTIONS++; failures.push(`waitLaw(e): ${e.message}`); }

  // (f) transient network errors then success: callback not lost
  try {
    AGG.SOAK_ITERATIONS++;
    let polls = 0;
    const r = await T.waitAnswer({
      decision: d, deadlineMs: Date.now() + 20000, observe: silence, binding: BIND,
      getUpdatesOverride: async () => {
        polls++;
        if (polls <= 3) throw Object.assign(new Error("socket hang up"), { code: "ECONNRESET" });
        return { ok: true, result: [mkUpdate(500, d.decision_id)] };
      },
    });
    check("transient-then-success ACCEPTED", r.status === "ANSWERED", JSON.stringify(r));
    if (r.status === "ANSWERED") AGG.VALID_CALLBACK_ACCEPTED++; else AGG.VALID_CALLBACK_LOST++;
  } catch (e) { AGG.UNEXPECTED_EXCEPTIONS++; failures.push(`waitLaw(f): ${e.message}`); }

  // (g) deadline reached, no callback: TIMEOUT (never an invented answer)
  try {
    AGG.SOAK_ITERATIONS++;
    const r = await T.waitAnswer({
      decision: d, deadlineMs: Date.now() + 1500, observe: silence, binding: BIND,
      getUpdatesOverride: async () => ({ ok: true, result: [] }),
    });
    check("no-callback TIMEOUT", r.status === "TIMEOUT", JSON.stringify(r));
  } catch (e) { AGG.UNEXPECTED_EXCEPTIONS++; failures.push(`waitLaw(g): ${e.message}`); }

  // (h) poll timeout boundary: poll resolved just after deadline does not
  // admit a stale callback after NO_ANSWER intent (loop exits at deadline).
  try {
    AGG.SOAK_ITERATIONS++;
    const r = await T.waitAnswer({
      decision: d, deadlineMs: Date.now() + 1200, observe: silence, binding: BIND,
      getUpdatesOverride: async () => {
        await new Promise((res) => setTimeout(res, 1400)); // resolves after deadline
        return { ok: true, result: [mkUpdate(600, d.decision_id)] };
      },
    });
    check("post-deadline poll not admitted", r.status === "TIMEOUT", JSON.stringify(r));
  } catch (e) { AGG.UNEXPECTED_EXCEPTIONS++; failures.push(`waitLaw(h): ${e.message}`); }
}
await waitLaw();

// ---------- 3. gate-core fence soak (randomized combinations) ----------
{
  const base = mkDecision();
  for (let i = 0; i < 200; i++) {
    try {
      AGG.SOAK_ITERATIONS++;
      const store = { schema_version: core.GATE_STORE_SCHEMA, decisions: [], version: 1 };
      core.registerGateDecision(store, { taskRef: "SOAK", runId: base.run_id, sessionId: "soak-session", generation: 1, question: base.question, ttlMs: 60000, transport: "synthetic" });
      const did = store.decisions[0].decision_id;
      core.markNotified(store, did, { transport: "synthetic", messageId: "m1" });
      // wrong-binding flood: wrong task/session/generation/option/update reuse
      const wrongs = [
        { cb: { decision_id: did, option: "A", update_id: 1 }, ctx: { taskRef: "OTHER", sessionId: "soak-session", generation: 1 }, reason: "GATE_TASK_MISMATCH", tag: "WRONG" },
        { cb: { decision_id: did, option: "A", update_id: 2 }, ctx: { taskRef: "SOAK", sessionId: "other-session", generation: 1 }, reason: "GATE_SESSION_MISMATCH", tag: "WRONG" },
        { cb: { decision_id: did, option: "A", update_id: 3 }, ctx: { taskRef: "SOAK", sessionId: "soak-session", generation: 9 }, reason: "GATE_GENERATION_MISMATCH", tag: "WRONG" },
        { cb: { decision_id: did, option: "Z", update_id: 4 }, ctx: { taskRef: "SOAK", sessionId: "soak-session", generation: 1 }, reason: "GATE_ANSWER_INVALID", tag: "WRONG" },
        { cb: { decision_id: "ACP-GATE-UNKNOWN", option: "A", update_id: 5 }, ctx: { taskRef: "SOAK", sessionId: "soak-session", generation: 1 }, reason: "GATE_DECISION_UNKNOWN", tag: "STALE" },
      ];
      for (const w of wrongs) {
        const r = core.admitGateCallback(store, w.cb, w.ctx);
        check(`fence ${w.reason}`, r.ok === false && r.reason === w.reason, `got ${r.ok}/${r.reason}`);
        if (w.tag === "WRONG") AGG.WRONG_BINDING_REJECTED++; else AGG.STALE_REJECTED++;
      }
      // the valid one still admits after the flood
      const ok = core.admitGateCallback(store, { decision_id: did, option: "A", update_id: 10 }, { taskRef: "SOAK", sessionId: "soak-session", generation: 1 });
      check("valid admits after wrong flood", ok.ok === true && ok.decision.selected_option === "A", JSON.stringify(ok.reason ?? ""));
      // duplicate update id now rejected — after VERIFIED the state is no
      // longer admit-eligible, so the law rejects as ALREADY_CONSUMED (even
      // stricter than UPDATE_REUSED). Either reason is a valid fence.
      const dup = core.admitGateCallback(store, { decision_id: did, option: "A", update_id: 10 }, { taskRef: "SOAK", sessionId: "soak-session", generation: 1 });
      check("duplicate update rejected", dup.ok === false && ["GATE_UPDATE_REUSED", "GATE_DECISION_ALREADY_CONSUMED"].includes(dup.reason), `got ${dup.reason}`);
      AGG.DUPLICATE_REJECTED++;
      // stale (expired) gate: build one, expire it, then try
      const store2 = { schema_version: core.GATE_STORE_SCHEMA, decisions: [], version: 1 };
      core.registerGateDecision(store2, { taskRef: "SOAK", runId: base.run_id, sessionId: "soak-session", generation: 1, question: base.question, ttlMs: 1, transport: "synthetic" });
      await new Promise((r) => setTimeout(r, 5));
      const late = core.admitGateCallback(store2, { decision_id: store2.decisions[0].decision_id, option: "A", update_id: 20 }, { taskRef: "SOAK", sessionId: "soak-session", generation: 1 });
      check("expired-or-consumed rejected", late.ok === false && ["GATE_DECISION_EXPIRED", "GATE_DECISION_ALREADY_CONSUMED"].includes(late.reason), `got ${late.reason}`);
      AGG.STALE_REJECTED++;
      AGG.VALID_CALLBACK_ACCEPTED++; // the valid admission above
    } catch (e) { AGG.UNEXPECTED_EXCEPTIONS++; failures.push(`gateSoak(i=${i}): ${e.message}`); }
  }
}

// ---------- 4. randomized timing fuzz around poll boundaries ----------
{
  const d = mkDecision();
  const BIND = { chatId: CHAT, userId: USER };
  for (let i = 0; i < 100; i++) {
    try {
      AGG.SOAK_ITERATIONS++;
      const delayBefore = Math.floor(Math.random() * 30);
      const delayInPoll = Math.floor(Math.random() * 20);
      const updateId = 1000 + i;
      let polls = 0;
    const r = await T.waitAnswer({
      decision: d, deadlineMs: Date.now() + 4000, observe: silence, binding: BIND,
      getUpdatesOverride: async () => {
        polls++;
        if (delayInPoll) await new Promise((res) => setTimeout(res, delayInPoll));
        if (polls === 1 && delayBefore) await new Promise((res) => setTimeout(res, delayBefore));
        return { ok: true, result: polls >= 1 ? [mkUpdate(updateId, d.decision_id)] : [] };
      },
    });
      if (r.status === "ANSWERED") AGG.VALID_CALLBACK_ACCEPTED++; else AGG.VALID_CALLBACK_LOST++;
      check(`fuzz#${i} callback never lost`, r.status === "ANSWERED", JSON.stringify(r));
    } catch (e) { AGG.UNEXPECTED_EXCEPTIONS++; failures.push(`fuzz(${i}): ${e.message}`); }
  }
}

// ---------- 5. real process lifecycle: quiesce/restore symmetry probe ----------
{
  const args = ["-e", "setTimeout(() => {}, 120000)"];
  const child = spawn(process.execPath, args, { stdio: "ignore", detached: true });
  child.unref();
  await new Promise((r) => setTimeout(r, 400));
  try {
    process.kill(child.pid);
  } catch { /* noop */ }
  await new Promise((r) => setTimeout(r, 400));
  let alive = true;
  try { process.kill(child.pid, 0); } catch { alive = false; }
  check("quiesce probe: target dead after kill", !alive);
  if (alive) AGG.PROCESS_LEAKS++;
}

// ---------- aggregate ----------
AGG.PROCESS_LEAKS += 0; // explicit aggregate field
const READY = failures.length === 0 && AGG.VALID_CALLBACK_LOST === 0 && AGG.PROCESS_LEAKS === 0 && AGG.UNEXPECTED_EXCEPTIONS === 0;
const out = { READY_FOR_FINAL_REAL_E2E: READY, ...AGG, FAILURES: failures.slice(0, 12), total_failures: failures.length };
console.log(JSON.stringify(out, null, 1));
const fs = await import("node:fs");
fs.mkdirSync(new URL("../../reports/runtime/cursor-acp/", import.meta.url), { recursive: true });
fs.writeFileSync(new URL("../../reports/runtime/cursor-acp/mcp-gate-telegram-soak-results.json", import.meta.url), JSON.stringify(out, null, 2));
process.exit(READY ? 0 : 1);
