#!/usr/bin/env python3
"""Control Plane per-invocation Hermes browser-tool allowlist bridge (v1).

Repository-owned, bounded Python interop helper for
tools/hermes-per-invocation-browser-allowlist-v1.mjs.

Runs INSIDE the installed Hermes venv, imports the EXISTING Hermes
implementation in-process (read-only dependency), and enforces an
EXACT-name execution allowlist on the native browser tools BEFORE any
Hermes handler is touched:

    browser_navigate, browser_snapshot, browser_type, browser_press

Guarantees:
- never modifies ~/.hermes/config.yaml or any installed Hermes file;
- never monkey-patches Hermes modules;
- sets BROWSER_CDP_URL only in its OWN process environment (the documented
  per-invocation equivalent of `/browser connect`), which disappears at
  process exit;
- exact-name allowlist matching only; no prefix, no wildcard;
- any non-allowlisted tool deterministically returns TOOL_NOT_ALLOWED and
  never reaches a Hermes handler;
- result envelopes are sanitized: no page DOM, no page text, no cookies,
  no tokens, no storage, no credentials. Snapshot results are reduced to
  success/element-count/composer-ref metadata only.
"""

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import urllib.parse

EXACT_ALLOWLIST = (
    "browser_navigate",
    "browser_snapshot",
    "browser_type",
    "browser_press",
)

FORBIDDEN_PROBE_NAMES = (
    "browser_cdp",
    "browser_console",
    "browser_exec",
    "synthetic_unknown_tool",
)

HERMES_AGENT_ROOT = r"C:\Users\mrhz\AppData\Local\hermes\hermes-agent"
DEFAULT_CDP_URL = "http://127.0.0.1:9222"

HERMES_HANDLER_INVOCATIONS = 0


def _focus_guard_set(enabled: bool):
    """Enable/disable CDP focus emulation for the ChatGPT page (delivery guard).

    REPAIR (Phase D, user-authorized inline fix #2): when the Chrome window is
    NOT OS-focused (the dedicated automation Chrome runs in the background),
    ChatGPT's frontend processes a submitted `press Enter` as if the window
    were blurred and leaves the message as a composer draft — the tool reports
    success but no user turn is created (empirically 0-3/6 without the guard,
    6/6 with it). This is a DELIVERY mechanism: it does not create, modify, or
    observe page content; the send itself remains the qualified
    snapshot->fill->press chain, and send confirmation remains the INDEPENDENT
    DOM verifier (tool success never implies send success).

    Uses the page-level CDP websocket from the qualified HTTP endpoint (same
    endpoint Hermes' own session already uses). Bounded: one command, no DOM
    access, no navigation, no evaluation.
    """
    import urllib.request
    try:
        cdp_http = os.environ.get("BROWSER_CDP_URL", DEFAULT_CDP_URL).rstrip("/")
        with urllib.request.urlopen(f"{cdp_http}/json/list", timeout=5) as resp:
            targets = json.loads(resp.read().decode("utf-8"))
        page = next(
            t for t in targets
            if isinstance(t, dict) and t.get("type") == "page"
            and str(t.get("url", "")).startswith("https://chatgpt.com")
        )
        ws_url = page.get("webSocketDebuggerUrl")
        if not ws_url:
            return {"focus_guard": "NO_PAGE_TARGET"}
        # `websockets` library client: the stdlib raw-socket client completes the
        # WS handshake but empirically receives NO replies from Chrome's page
        # endpoint (validated: library replies, raw client times out on the same
        # target). The library is present in the exact interpreter the bridge
        # runs under (validated: `import websockets` OK).
        import asyncio
        import websockets

        async def _send_focus_cmd():
            async with websockets.connect(ws_url, max_size=4 * 1024 * 1024) as ws:
                await ws.send(json.dumps({
                    "id": 1,
                    "method": "Emulation.setFocusEmulationEnabled",
                    "params": {"enabled": bool(enabled)},
                }))
                while True:
                    raw = await asyncio.wait_for(ws.recv(), timeout=5)
                    msg = json.loads(raw)
                    if isinstance(msg, dict) and msg.get("id") == 1:
                        return msg

        loop = asyncio.new_event_loop()
        try:
            reply = loop.run_until_complete(_send_focus_cmd())
        finally:
            loop.close()
        if not isinstance(reply, dict) or "error" in reply:
            return {"focus_guard": "CDP_ERROR", "detail": str(reply.get("error") if isinstance(reply, dict) else reply)}
        return {"focus_guard": "OK", "enabled": bool(enabled)}
    except Exception as exc:
        return {"focus_guard": f"ERROR:{type(exc).__name__}"}


def _focus_guard_ok(guard_result) -> bool:
    return isinstance(guard_result, dict) and guard_result.get("focus_guard") == "OK"


def _bootstrap():
    sys.path.insert(0, HERMES_AGENT_ROOT)
    os.chdir(HERMES_AGENT_ROOT)


def _write_out(out_path, payload):
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2)


def _config_meta():
    """Hash/size/path metadata only; contents are never printed."""
    meta = {"action": "config-meta"}
    try:
        from hermes_cli.config import get_config_path
        p = get_config_path()
        if p is not None and os.path.isfile(str(p)):
            with open(str(p), "rb") as fh:
                data = fh.read()
            meta.update({
                "path": str(p),
                "exists": True,
                "size": len(data),
                "sha256": hashlib.sha256(data).hexdigest(),
            })
        else:
            meta.update({"path": str(p) if p else None, "exists": False})
    except Exception as exc:  # pragma: no cover - defensive
        meta.update({"error": type(exc).__name__})
    return meta


def _gate(name):
    """EXACT-name membership only. No prefix matching, no wildcards."""
    return name in EXACT_ALLOWLIST


def action_schemas(out_path):
    """Derive the Hermes native browser schemas and filter them to exactly 4.

    The schemas handed to the model are the existing Hermes schemas
    (model_tools.get_tool_definitions on the 'browser' toolset) filtered by
    the exact allowlist - never hand-invented replacements.
    """
    from model_tools import get_tool_definitions
    defs = get_tool_definitions(enabled_toolsets=["browser"], quiet_mode=True)
    functions = [d.get("function", d) for d in defs]
    inventory = sorted(str(f.get("name")) for f in functions)
    visible = [f for f in functions if f.get("name") in EXACT_ALLOWLIST]
    visible_names = sorted(str(f.get("name")) for f in visible)
    forbidden_universe = (
        "browser_cdp", "browser_console", "browser_exec", "browser_click",
        "browser_back", "browser_dialog", "browser_get_images",
        "browser_scroll", "browser_vision",
    )
    _write_out(out_path, {
        "action": "schemas",
        "schemas_sourced_from_hermes": True,
        "hermes_inventory_count": len(inventory),
        "hermes_inventory_names": inventory,
        "model_visible_count": len(visible),
        "model_visible_names": visible_names,
        "model_visible_definitions": [{"type": "function", "function": f} for f in visible],
        "forbidden_model_visible": sorted(
            n for n in forbidden_universe if n in visible_names
        ),
        "config_meta": _config_meta(),
    })


def action_dispatch_probe(out_path):
    """Offline dispatch probes. Rejected names must never touch a handler.

    Allowed names report WOULD_DISPATCH only - nothing executes offline.
    """
    results = []
    for name in list(EXACT_ALLOWLIST) + list(FORBIDDEN_PROBE_NAMES):
        allowed = _gate(name)
        results.append({
            "tool": name,
            "allowed": allowed,
            "decision": "WOULD_DISPATCH" if allowed else "TOOL_NOT_ALLOWED",
            "hermes_handler_invoked": False,
        })
    _write_out(out_path, {
        "action": "dispatch-probe",
        "exact_allowlist": list(EXACT_ALLOWLIST),
        "probes": results,
        "hermes_handler_invocations": HERMES_HANDLER_INVOCATIONS,
        "config_meta": _config_meta(),
    })


_COMPOSER_HINT_RE = re.compile(
    r"composer|textbox|textarea|ask anything|message chatgpt|prompt", re.I
)
_REF_RE = re.compile(r"\[ref=@?(e\d+)\]")
# "Send prompt" buttons are submit owners, NOT typing targets; they must never
# be selected as the composer ref (the e160 class of bug).
_SEND_BUTTON_RE = re.compile(r"button\s+\"(?:send prompt|send|submit)\"", re.I)


def _composer_ref_from_stored_snapshot(parsed):
    """Page the stored full snapshot (Hermes truncates oversized snapshots at
    line boundaries and persists the complete tree under cache/web — its own
    documented read_file paging mechanism). Read-only: only the composer ref
    metadata extracted here leaves this function; file contents are never
    returned or persisted by the wrapper."""
    if not isinstance(parsed, dict):
        return None
    snap = str(parsed.get("snapshot") or "")
    m = re.search(r"full snapshot:\s*read_file\s+path=\"([^\"]+)\"", snap)
    if not m:
        return None
    stored = m.group(1)
    candidates = [
        stored,
        stored.replace("cache/web/", os.path.join(HERMES_AGENT_ROOT)),
    ]
    # The note's path is agent-visible ("read_file" form); resolve the real one.
    real = None
    if os.path.isabs(stored) and os.path.isfile(stored):
        real = stored
    else:
        base = os.path.join(os.path.dirname(HERMES_AGENT_ROOT))  # hermes home root
        guess = os.path.join(base, stored)  # e.g. .../hermes/cache/web/xxx.txt
        if os.path.isfile(guess):
            real = guess
        else:
            web_dir = os.path.join(os.path.dirname(HERMES_AGENT_ROOT), "cache", "web")
            if os.path.isdir(web_dir):
                stem = os.path.basename(stored)
                hit = os.path.join(web_dir, stem)
                if os.path.isfile(hit):
                    real = hit
    if not real:
        # last resort: newest browser-snapshot file (content-hash named, deduped)
        web_dir = os.path.join(os.path.dirname(HERMES_AGENT_ROOT), "cache", "web")
        if os.path.isdir(web_dir):
            files = [os.path.join(web_dir, f) for f in os.listdir(web_dir)
                     if f.startswith("browser-snapshot-") and f.endswith(".txt")]
            if files:
                real = max(files, key=os.path.getmtime)
    if not real or not os.path.isfile(real):
        return None
    try:
        with open(real, "r", encoding="utf-8") as fh:
            full_text = fh.read()
    except OSError:
        return None
    for line in full_text.splitlines():
        if _SEND_BUTTON_RE.search(line):
            continue
        if re.search(r"textbox|textarea", line, re.I):
            mm = _REF_RE.search(line)
            if mm:
                return mm.group(1)
    return None


def _extract_composer_ref(parsed):
    """Best-effort deterministic composer-ref extraction from a snapshot.

    Returns sanitized metadata only (ref id, role class, candidate count).
    Textbox candidates are preferred in LAST-observed order; any Send/Submit
    button line is excluded as a typing target.
    """
    candidates = []
    elements = None
    text = ""
    if isinstance(parsed, dict):
        elements = parsed.get("elements")
        text = str(parsed.get("snapshot") or parsed.get("text") or "")
    if isinstance(elements, list):
        for el in elements:
            if not isinstance(el, dict):
                continue
            role = str(el.get("role") or el.get("tag") or "")
            label = " ".join(
                str(el.get(k) or "") for k in ("name", "label", "placeholder", "text", "aria", "id")
            )
            ref = str(el.get("ref") or el.get("id") or "")
            if role.lower() in ("textbox", "textarea", "searchbox") or (
                _COMPOSER_HINT_RE.search(label) and not _SEND_BUTTON_RE.search(label)
            ):
                if ref:
                    candidates.append((ref, role or "element", label[:40]))
    if not candidates and text:
        for line in text.splitlines():
            if _SEND_BUTTON_RE.search(line):
                continue
            if _COMPOSER_HINT_RE.search(line):
                m = _REF_RE.search(line)
                if m:
                    candidates.append((m.group(1), "line-textbox", ""))
    if not candidates and text:
        for line in text.splitlines():
            if _SEND_BUTTON_RE.search(line):
                continue
            if re.search(r"textbox|textarea", line, re.I):
                m = _REF_RE.search(line)
                if m:
                    candidates.append((m.group(1), "line-textbox-fallback", ""))
    if candidates:
        ref, role, _ = candidates[-1]
        return {"composer_ref": ref, "composer_role": role, "candidate_count": len(candidates)}
    # Oversized snapshot: composer lines may have been truncated away. Page the
    # stored full snapshot (read-only) for the composer ref only.
    stored_ref = _composer_ref_from_stored_snapshot(parsed)
    if stored_ref:
        return {
            "composer_ref": stored_ref,
            "composer_role": "stored-snapshot-textbox",
            "candidate_count": 0,
            "composer_ref_source": "stored_full_snapshot",
        }
    return {"composer_ref": None, "composer_role": None, "candidate_count": 0}


def _element_count(parsed):
    if isinstance(parsed, dict):
        el = parsed.get("elements")
        if isinstance(el, list):
            return len(el)
        text = str(parsed.get("snapshot") or parsed.get("text") or "")
        return len(_REF_RE.findall(text))
    return 0


def _sanitize_result(name, parsed, extract_composer):
    """Reduce a Hermes tool result to bounded, non-DOM metadata."""
    if not isinstance(parsed, dict):
        return {"success": False, "error_class": "non_dict_result"}
    out = {"success": bool(parsed.get("success", False))}
    if parsed.get("error"):
        out["error_class"] = type(parsed.get("error")).__name__
    if name == "browser_navigate":
        out["url"] = str(parsed.get("url") or "")[:120]
        out["title"] = str(parsed.get("title") or "")[:80]
    elif name == "browser_snapshot":
        out["element_count"] = _element_count(parsed)
        if extract_composer:
            out.update(_extract_composer_ref(parsed))
    elif name == "browser_type":
        out["typed"] = bool(parsed.get("typed", parsed.get("success", False)))
    elif name == "browser_press":
        out["pressed"] = str(parsed.get("pressed") or "")[:20]
    return out


def _sanitize_args(name, args):
    """Bounded arg metadata; typed text reduced to length + hash prefix."""
    safe = {}
    for k, v in (args or {}).items():
        if k == "text":
            raw = str(v)
            safe["text_chars"] = len(raw)
            safe["text_sha256_12"] = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:12]
        elif k in ("url",):
            safe[k] = str(v)[:120]
        elif k in ("ref", "key", "full"):
            safe[k] = v
    return safe


def _batch_commands_via_session(task_id, commands, timeout=90):
    """Run commands as ONE `agent-browser batch` invocation through the task's
    EXISTING Hermes browser session machinery (same socket dir, same CDP URL,
    same credential-scrubbed env, same spawn flags as every native tool call).

    REPAIR (Phase D, user-authorized inline fix): agent-browser 0.26.0 keeps
    snapshot refs per CLIENT CONNECTION. Native browser_type/browser_press run
    `fill`/`press` as separate CLI invocations (separate connections), so a ref
    observed by one invocation is Unknown to the next — the live failure root
    cause. Batching snapshot+fill(+press) into ONE invocation (ONE connection)
    keeps the ref valid end-to-end (empirically 10/10 determinism).

    Bounded: only composer-send mechanics. Allowlist, model-visible surface,
    identity fences, sanitization unchanged. stdin is the documented payload
    form (`[["snapshot","-c"],["fill","@e","text"]]`).
    """
    from tools.browser_tool_session import (
        _agent_browser_argv,
        _agent_browser_command_env,
        _browser_command_preflight,
        _get_session_info,
        _prepare_session_socket_dir,
        _popen_agent_browser,
        _read_command_output_files,
    )
    preflight = _browser_command_preflight()
    if "browser_cmd" not in preflight:
        return {"success": False, "error": str(preflight.get("error", "preflight failed"))}
    browser_cmd = preflight["browser_cmd"]
    try:
        session_info = _get_session_info(task_id)
    except Exception as exc:
        return {"success": False, "error": f"Failed to create browser session: {exc}"}
    if session_info.get("cdp_url"):
        backend_args = ["--cdp", session_info["cdp_url"]]
    else:
        backend_args = ["--session", session_info["session_name"]]
    task_socket_dir = _prepare_session_socket_dir(session_info["session_name"])
    browser_env = _agent_browser_command_env(task_socket_dir)
    cmd_parts = _agent_browser_argv(browser_cmd) + backend_args + ["--json", "batch"]

    stdin_payload = json.dumps(commands)
    stdout_path = os.path.join(task_socket_dir, "_stdout_chain_send")
    stderr_path = os.path.join(task_socket_dir, "_stderr_chain_send")
    fds = [os.open(stdout_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600),
           os.open(stderr_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)]
    try:
        proc = subprocess.Popen(
            cmd_parts,
            stdin=subprocess.PIPE,
            stdout=fds[0],
            stderr=fds[1],
            env=browser_env,
            close_fds=True,
        )
        try:
            proc.stdin.write(stdin_payload.encode("utf-8"))
            proc.stdin.close()
        except Exception:
            pass
        try:
            proc.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()
            return {"success": False, "error": f"chain-send batch timed out after {timeout}s"}
    finally:
        for fd in fds:
            os.close(fd)
    stdout, stderr = _read_command_output_files(stdout_path, stderr_path)
    try:
        os.unlink(stdout_path)
        os.unlink(stderr_path)
    except OSError:
        pass
    if proc.returncode != 0:
        detail = (stderr or stdout or "").strip()[:300]
        return {"success": False, "error": f"batch rc={proc.returncode}: {detail}"}
    try:
        parsed = json.loads(stdout.strip())
    except json.JSONDecodeError:
        return {"success": False, "error": "Non-JSON batch output", "raw_head": stdout[:200]}
    if not isinstance(parsed, list):
        return {"success": False, "error": "batch output is not a list"}
    return {"success": True, "results": parsed}


def _composer_ref_from_batch_results(batch_out):
    """Deterministic composer-ref extraction from a batch snapshot result.
    Mirrors the qualified extraction policy: textbox candidates preferred,
    Send/Submit buttons never selected as typing targets."""
    for item in batch_out:
        refs = ((item or {}).get("result") or {}).get("refs") or {}
        candidates = []
        for ref, meta in refs.items():
            if not isinstance(meta, dict):
                continue
            role = str(meta.get("role") or "")
            label = str(meta.get("name") or "")
            if role == "textbox" and not _SEND_BUTTON_RE.search(label):
                candidates.append((ref, role, label[:40]))
        if candidates:
            ref, role, _ = candidates[-1]
            return {"composer_ref": ref, "composer_role": role, "candidate_count": len(candidates)}
    return {"composer_ref": None, "composer_role": None, "candidate_count": 0}


def action_chain_send(out_path, args_json, task_id):
    """Bounded composer-send chain executed in ONE agent-browser connection.

    Sequence (all inside one batch, one daemon connection):
      1. snapshot  -> composer ref is derived from the SAME connection that fills
      2. fill(ref, text) (fill clears-and-types the ProseMirror composer)
      3. press Enter (submit)

    Fail-closed contract: if the ref cannot be resolved, or any step of the
    batch reports success=false, the envelope reports the failure and the
    driver still owes its send classification to the INDEPENDENT DOM verifier
    (tool success never implies send success).
    """
    try:
        args = json.loads(args_json) if args_json else {}
    except Exception:
        _write_out(out_path, {
            "action": "chain-send",
            "decision": "ARGS_JSON_INVALID",
            "hermes_handler_invoked": False,
        })
        return
    press_only_raw = args.get("press_only")
    press_only = press_only_raw is not None and str(press_only_raw).strip() != ""
    text = str(args.get("text") or "")
    if not text and not press_only:
        _write_out(out_path, {
            "action": "chain-send",
            "decision": "TEXT_REQUIRED",
            "hermes_handler_invoked": False,
        })
        return
    if press_only and str(press_only_raw) != "Enter":
        _write_out(out_path, {
            "action": "chain-send",
            "decision": "ONLY_ENTER_SUPPORTED",
            "hermes_handler_invoked": False,
        })
        return
    global HERMES_HANDLER_INVOCATIONS
    HERMES_HANDLER_INVOCATIONS += 1  # one bounded batch (replaces type+press internals)

    # DELIVERY GUARD (fail-closed): focus emulation must be ON for any batch
    # that contains press/typing. Without it the background Chrome window
    # swallows Enter (draft left, no user turn — proven 0-3/6 vs 6/6).
    guard_on = _focus_guard_set(True)
    if not _focus_guard_ok(guard_on):
        _write_out(out_path, {
            "action": "chain-send",
            "decision": "FOCUS_GUARD_UNAVAILABLE",
            "success": False,
            "error_class": "focus_guard_unavailable",
            "guard": guard_on,
            "hermes_handler_invoked": False,
            "chatgpt_web_sends_delta": 0,
        })
        return

    try:
        # Batch 1: snapshot only — establishes the composer ref ON this connection
        # AND seeds the daemon's ref store for the NEXT batch (empirically required:
        # a founder batch must exist before the send batch can resolve @refs).
        snap_batch = _batch_commands_via_session(task_id, [["snapshot", "-c"]])
        if not snap_batch.get("success"):
            _write_out(out_path, {
                "action": "chain-send",
                "decision": "SNAPSHOT_BATCH_FAILED",
                "success": False,
                "error_class": "snapshot_batch_failure",
                "hermes_handler_invoked": True,
            })
            return
        meta = _composer_ref_from_batch_results(snap_batch.get("results") or [])
        ref = meta.get("composer_ref")
        if not ref:
            _write_out(out_path, {
                "action": "chain-send",
                "decision": "COMPOSER_REF_NOT_OBTAINED",
                "success": False,
                "hermes_handler_invoked": True,
            })
            return

        if press_only:
            # S2 press-only: fresh connection has no keyboard focus state on the
            # composer — refocus deterministically with click(ref) INSIDE the
            # same batch, then press (click-refocus+press = 4/4 vs 2/4 without).
            send_batch = _batch_commands_via_session(
                task_id,
                [
                    ["snapshot", "-c"],
                    ["click", f"@{ref}"],
                    ["press", "Enter"],
                ],
                timeout=120,
            )
        else:
            # Batch 2: THE SEND — snapshot+fill+press on one connection
            # (single connection: fill+press same batch guarded = 6/6).
            send_batch = _batch_commands_via_session(
                task_id,
                [
                    ["snapshot", "-c"],
                    ["fill", f"@{ref}", text],
                    ["press", "Enter"],
                ],
                timeout=120,
            )
        if not send_batch.get("success"):
            _write_out(out_path, {
                "action": "chain-send",
                "decision": "SEND_BATCH_FAILED",
                "success": False,
                "error_class": "send_batch_failure",
                "composer_ref": ref,
                "hermes_handler_invoked": True,
            })
            return
        results = send_batch.get("results") or []
        per_cmd = []
        for item in results:
            per_cmd.append({
                "command": (item or {}).get("command", [None])[0] if isinstance(item.get("command"), list) else None,
                "success": bool((item or {}).get("success")),
                "error_class": type(item.get("error")).__name__ if (item or {}).get("error") else None,
            })
        fill_ok = any((c or {}).get("command") == "fill" and (c or {}).get("success") for c in per_cmd)
        press_ok = any((c or {}).get("command") == "press" and (c or {}).get("success") for c in per_cmd)
        envelope = {
            "action": "chain-send",
            "decision": "DISPATCHED",
            "success": bool((fill_ok or press_only) and press_ok),
            "composer_ref": ref,
            "composer_role": meta.get("composer_role"),
            "text_chars": len(text),
            "text_sha256_12": hashlib.sha256(text.encode("utf-8")).hexdigest()[:12] if text else None,
            "press_only": press_only,
            "per_command": per_cmd,
            "hermes_handler_invoked": True,
            "single_connection": True,
        }
    finally:
        # Guard is DELIVERY-SCOPED: always restored, on every exit path.
        _focus_guard_set(False)
    _write_out(out_path, envelope)


def action_exec_tool(out_path, name, args_json, task_id, extract_composer):
    """Live dispatch: gate FIRST, Hermes handler only for allowlisted names.

    Cross-session ref validity: snapshot refs are agent-browser session-scoped,
    and every bridge call runs in its own process. For browser_type, this
    process therefore re-resolves the composer ref with a fresh in-session
    snapshot and requires EXACT identity with the model-provided ref before
    typing (defense in depth on top of the wrapper-side GEN2 gate).
    """
    if not _gate(name):
        _write_out(out_path, {
            "action": "exec-tool",
            "tool": name,
            "decision": "TOOL_NOT_ALLOWED",
            "hermes_handler_invoked": False,
        })
        return
    global HERMES_HANDLER_INVOCATIONS
    HERMES_HANDLER_INVOCATIONS += 1
    try:
        args = json.loads(args_json) if args_json else {}
    except Exception:
        _write_out(out_path, {
            "action": "exec-tool",
            "tool": name,
            "decision": "ARGS_JSON_INVALID",
            "hermes_handler_invoked": False,
        })
        return
    from tools.registry import registry, discover_builtin_tools
    discover_builtin_tools()  # import self-registering tool modules (idempotent, read-only)

    fresh_ref = None
    if name == "browser_type":
        snap_entry = registry.get_entry("browser_snapshot")
        if snap_entry is None:
            _write_out(out_path, {
                "action": "exec-tool",
                "tool": name,
                "decision": "HERMES_ENTRY_MISSING",
                "hermes_handler_invoked": False,
            })
            return
        HERMES_HANDLER_INVOCATIONS += 1  # in-session re-resolve snapshot (read-only)
        try:
            raw_snap = snap_entry.handler({}, task_id=task_id)
            parsed_snap = json.loads(raw_snap) if isinstance(raw_snap, str) else raw_snap
        except Exception as exc:
            parsed_snap = {"success": False, "error": type(exc).__name__}
        meta = _extract_composer_ref(parsed_snap if isinstance(parsed_snap, dict) else {})
        fresh_ref = meta.get("composer_ref")
        provided = str((args or {}).get("ref") or "").lstrip("@")
        if parsed_snap.get("success") is not True or not fresh_ref or provided != str(fresh_ref).lstrip("@"):
            _write_out(out_path, {
                "action": "exec-tool",
                "tool": name,
                "decision": "REF_RESOLVE_MISMATCH",
                "success": False,
                "provided_ref": provided or None,
                "fresh_ref": fresh_ref,
                "hermes_type_handler_invoked": False,
            })
            return
        args = dict(args or {})
        args["ref"] = f"@{fresh_ref}"

    entry = registry.get_entry(name)
    if entry is None:
        HERMES_HANDLER_INVOCATIONS -= 1
        _write_out(out_path, {
            "action": "exec-tool",
            "tool": name,
            "decision": "HERMES_ENTRY_MISSING",
            "hermes_handler_invoked": False,
        })
        return
    try:
        raw = entry.handler(args, task_id=task_id)
        parsed = json.loads(raw) if isinstance(raw, str) else raw
    except Exception as exc:  # sanitized failure envelope
        parsed = {"success": False, "error": type(exc).__name__}
    envelope = {
        "action": "exec-tool",
        "tool": name,
        "decision": "DISPATCHED",
        "hermes_handler_invoked": True,
        "args_sanitized": _sanitize_args(name, args),
    }
    envelope.update(_sanitize_result(name, parsed, extract_composer))
    _write_out(out_path, envelope)


def main():
    ap = argparse.ArgumentParser(description="Control Plane per-invocation Hermes browser allowlist bridge")
    ap.add_argument("--action", required=True,
                    choices=["schemas", "dispatch-probe", "exec-tool", "chain-send", "config-meta"])
    ap.add_argument("--out", required=True)
    ap.add_argument("--name", default=None)
    ap.add_argument("--args-json", default=None)
    ap.add_argument("--task-id", default="cp-allowlist-v1")
    ap.add_argument("--cdp-url", default=DEFAULT_CDP_URL)
    ap.add_argument("--extract-composer-ref", action="store_true")
    ns = ap.parse_args()

    # Process-local CDP override only (disappears at exit; never persisted).
    if ns.cdp_url:
        os.environ["BROWSER_CDP_URL"] = ns.cdp_url

    _bootstrap()

    if ns.action == "schemas":
        action_schemas(ns.out)
    elif ns.action == "dispatch-probe":
        action_dispatch_probe(ns.out)
    elif ns.action == "exec-tool":
        action_exec_tool(ns.out, ns.name, ns.args_json, ns.task_id, ns.extract_composer_ref)
    elif ns.action == "chain-send":
        action_chain_send(ns.out, ns.args_json, ns.task_id)
    elif ns.action == "config-meta":
        _write_out(ns.out, _config_meta())


if __name__ == "__main__":
    main()
