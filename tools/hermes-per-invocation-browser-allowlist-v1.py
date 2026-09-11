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
import sys

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
                    choices=["schemas", "dispatch-probe", "exec-tool", "config-meta"])
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
    elif ns.action == "config-meta":
        _write_out(ns.out, _config_meta())


if __name__ == "__main__":
    main()
