"""Repo-owned, fail-closed ChatGPT composer capability for Hermes.

This module is intentionally not a generic CDP client.  The only public entry
point accepts one of four fixed operations and never accepts a CDP method,
selector, target id, JavaScript expression, URL, or keyboard key from the
controller.
"""

from __future__ import annotations

import hashlib
import json
import os
import time
import urllib.parse
import urllib.request
from typing import Any

try:
    from websockets.sync.client import connect
except ImportError:  # pragma: no cover - exercised by the installed Hermes runtime
    connect = None


TOOL_NAME = "control_plane_chatgpt_composer_cdp"
CAPABILITY = "CONTROL_PLANE_CHATGPT_COMPOSER_CDP"
OPERATIONS = (
    "DISCOVER_CHATGPT_TARGET",
    "GET_COMPOSER_STATE",
    "PREFILL_SINGLE_LINE",
    "CLEAR_COMPOSER",
)
MAX_PREFILL_LENGTH = 4096
DEFAULT_CDP_URL = "http://127.0.0.1:9222"
ALLOWED_ORIGINS = frozenset({"https://chatgpt.com", "https://chat.openai.com"})

TOOL_SCHEMA = {
    "name": TOOL_NAME,
    "description": (
        "Governed ChatGPT composer capability. Allowed operations are target discovery, "
        "composer state, single-line prefill, and clear. No send, navigation, arbitrary "
        "CDP, selector, target, JavaScript, storage, cookie, network, or credential access."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "operation": {"type": "string", "enum": list(OPERATIONS)},
            "text": {"type": "string", "description": "Required only for PREFILL_SINGLE_LINE."},
        },
        "required": ["operation"],
        "additionalProperties": False,
    },
}


_COMPOSER_STATE_EXPRESSION = r'''(() => {
  const e = document.querySelector('#prompt-textarea') ||
    document.querySelector('textarea') ||
    document.querySelector('[contenteditable="true"]');
  if (!e) return {found:false};
  const text = e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement
    ? (e.value || '') : (e.innerText || e.textContent || '');
  return {found:true, tag:e.tagName, contenteditable:e.getAttribute('contenteditable'), text};
})()'''

_COMPOSER_FOCUS_EXPRESSION = r'''(() => {
  const e = document.querySelector('#prompt-textarea') ||
    document.querySelector('textarea') ||
    document.querySelector('[contenteditable="true"]');
  if (!e) return {found:false};
  e.focus();
  if (e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement) {
    const n = (e.value || '').length;
    e.setSelectionRange(n, n);
  } else {
    const s = window.getSelection();
    const r = document.createRange();
    r.selectNodeContents(e);
    r.collapse(false);
    s.removeAllRanges();
    s.addRange(r);
  }
  return {found:true};
})()'''


def _error(code: str, detail: str = "") -> str:
    body: dict[str, Any] = {"capability": CAPABILITY, "ok": False, "error": code}
    if detail:
        body["detail"] = detail[:240]
    return json.dumps(body, separators=(",", ":"))


def _ok(operation: str, **fields: Any) -> str:
    return json.dumps(
        {"capability": CAPABILITY, "ok": True, "operation": operation, **fields},
        separators=(",", ":"),
    )


def _cdp_http_url() -> str:
    raw = (os.environ.get("BROWSER_CDP_URL") or DEFAULT_CDP_URL).strip().rstrip("/")
    parsed = urllib.parse.urlparse(raw)
    if parsed.scheme not in {"http", "https"} or parsed.hostname not in {"127.0.0.1", "localhost"}:
        raise ValueError("CDP endpoint must be loopback HTTP(S)")
    if parsed.path not in {"", "/"} or parsed.query or parsed.fragment:
        raise ValueError("CDP endpoint path/query is not allowed")
    return raw


def _browser_ws_url() -> str:
    with urllib.request.urlopen(_cdp_http_url() + "/json/version", timeout=5) as response:
        payload = json.load(response)
    ws = payload.get("webSocketDebuggerUrl")
    if not isinstance(ws, str) or not ws.startswith("ws://127.0.0.1:"):
        raise ValueError("CDP browser websocket is not loopback")
    return ws


def _rpc(ws: Any, request_id: int, method: str, params: dict[str, Any], *, session_id: str | None = None,
         timeout: float = 30.0) -> dict[str, Any]:
    if method not in {"Target.getTargets", "Target.attachToTarget",
                      "Runtime.evaluate", "Input.insertText", "Input.dispatchKeyEvent"}:
        raise ValueError("CDP method is not allowlisted")
    request: dict[str, Any] = {"id": request_id, "method": method, "params": params}
    if session_id:
        request["sessionId"] = session_id
    ws.send(json.dumps(request, separators=(",", ":")))
    deadline = time.monotonic() + timeout
    while True:
        remaining = max(0.1, deadline - time.monotonic())
        message = json.loads(ws.recv(timeout=remaining))
        if message.get("id") != request_id:
            continue
        if "error" in message:
            raise RuntimeError(str(message["error"]))
        return message.get("result") or {}


def _chatgpt_target(ws: Any) -> dict[str, Any]:
    targets = _rpc(ws, 1, "Target.getTargets", {})
    infos = targets.get("targetInfos")
    if not isinstance(infos, list):
        raise RuntimeError("target inventory missing")
    candidates = []
    for item in infos:
        if not isinstance(item, dict) or item.get("type") != "page":
            continue
        parsed = urllib.parse.urlparse(str(item.get("url") or ""))
        origin = f"{parsed.scheme}://{parsed.netloc}" if parsed.scheme and parsed.netloc else ""
        if origin in ALLOWED_ORIGINS:
            candidates.append(item)
    if len(candidates) != 1:
        raise RuntimeError("ChatGPT target is ambiguous or absent")
    target = candidates[0]
    return {
        "targetId": target.get("targetId"),
        "title": str(target.get("title") or "")[:120],
        "origin": f"{urllib.parse.urlparse(str(target.get('url') or '')).scheme}://"
                  f"{urllib.parse.urlparse(str(target.get('url') or '')).netloc}",
    }


def _with_page(operation: str, callback):
    if connect is None:
        return _error("CDP_DEPENDENCY_MISSING")
    try:
        with connect(_browser_ws_url(), open_timeout=5, close_timeout=5, proxy=None) as ws:
            target = _chatgpt_target(ws)
            target_id = target.get("targetId")
            if not isinstance(target_id, str) or not target_id:
                raise RuntimeError("ChatGPT target id missing")
            attached = _rpc(ws, 2, "Target.attachToTarget", {"targetId": target_id, "flatten": True})
            session_id = attached.get("sessionId")
            if not isinstance(session_id, str) or not session_id:
                raise RuntimeError("CDP session missing")
            return callback(ws, session_id, target)
    except Exception as exc:
        return _error("CDP_CALL_FAILED", type(exc).__name__ + ": " + str(exc))


def _composer_state(ws: Any, session_id: str, operation: str) -> dict[str, Any]:
    result = _rpc(ws, 10, "Runtime.evaluate", {
        "expression": _COMPOSER_STATE_EXPRESSION,
        "returnByValue": True,
        "awaitPromise": False,
    }, session_id=session_id)
    value = ((result.get("result") or {}).get("value"))
    if not isinstance(value, dict) or not value.get("found"):
        raise RuntimeError("ChatGPT composer not found")
    text = value.get("text") if isinstance(value.get("text"), str) else ""
    return {
        "capability": CAPABILITY,
        "ok": True,
        "operation": operation,
        "found": True,
        "tag": str(value.get("tag") or ""),
        "contenteditable": value.get("contenteditable"),
        "empty": text == "",
        "char_count": len(text),
        "sha256": hashlib.sha256(text.encode("utf-8")).hexdigest(),
    }


def _discover(_: Any, __: str, target: dict[str, Any]) -> str:
    return _ok("DISCOVER_CHATGPT_TARGET", found=True, target_type="page", title=target["title"], origin=target["origin"])


def _state(ws: Any, session_id: str, _: dict[str, Any]) -> str:
    return json.dumps(_composer_state(ws, session_id, "GET_COMPOSER_STATE"), separators=(",", ":"))


def _prefill(ws: Any, session_id: str, _: dict[str, Any], text: str) -> str:
    before = _composer_state(ws, session_id, "PREFILL_SINGLE_LINE")
    if not before["empty"]:
        return _error("COMPOSER_NOT_EMPTY")
    focused = _rpc(ws, 11, "Runtime.evaluate", {
        "expression": _COMPOSER_FOCUS_EXPRESSION,
        "returnByValue": True,
        "awaitPromise": False,
    }, session_id=session_id)
    if not (((focused.get("result") or {}).get("value") or {}).get("found")):
        return _error("COMPOSER_NOT_FOUND")
    _rpc(ws, 12, "Input.insertText", {"text": text}, session_id=session_id)
    after = _composer_state(ws, session_id, "PREFILL_SINGLE_LINE")
    return json.dumps({
        "capability": CAPABILITY,
        "ok": True,
        "operation": "PREFILL_SINGLE_LINE",
        "char_count": after["char_count"],
        "sha256": after["sha256"],
        "exact_input_hash": hashlib.sha256(text.encode("utf-8")).hexdigest(),
    }, separators=(",", ":"))


def _clear(ws: Any, session_id: str, _: dict[str, Any]) -> str:
    focused = _rpc(ws, 20, "Runtime.evaluate", {
        "expression": _COMPOSER_FOCUS_EXPRESSION,
        "returnByValue": True,
        "awaitPromise": False,
    }, session_id=session_id)
    if not (((focused.get("result") or {}).get("value") or {}).get("found")):
        return _error("COMPOSER_NOT_FOUND")
    events = (
        ("keyDown", "Control", "ControlLeft", 17, 0),
        ("keyDown", "a", "KeyA", 65, 2),
        ("keyUp", "a", "KeyA", 65, 2),
        ("keyUp", "Control", "ControlLeft", 17, 0),
        ("keyDown", "Backspace", "Backspace", 8, 0),
        ("keyUp", "Backspace", "Backspace", 8, 0),
    )
    for event_type, key, code, vk, modifiers in events:
        _rpc(ws, 20 + vk + (1 if event_type == "keyUp" else 0), "Input.dispatchKeyEvent", {
            "type": event_type,
            "key": key,
            "code": code,
            "windowsVirtualKeyCode": vk,
            "nativeVirtualKeyCode": vk,
            "modifiers": modifiers,
        }, session_id=session_id)
    after = _composer_state(ws, session_id, "CLEAR_COMPOSER")
    if not after["empty"]:
        return _error("CLEAR_FAILED")
    return _ok("CLEAR_COMPOSER", empty=True, char_count=0, sha256=after["sha256"])


def _validate(operation: Any, text: Any) -> tuple[str | None, str | None]:
    if not isinstance(operation, str) or operation not in OPERATIONS:
        return None, "UNSUPPORTED_OPERATION"
    if operation == "PREFILL_SINGLE_LINE":
        if not isinstance(text, str) or not text:
            return None, "TEXT_REQUIRED"
        if len(text) > MAX_PREFILL_LENGTH:
            return None, "TEXT_TOO_LONG"
        if "\r" in text or "\n" in text:
            return None, "MULTILINE_TEXT_REJECTED"
        if any(ord(ch) < 0x20 and ch not in "\t" for ch in text):
            return None, "CONTROL_CHARACTER_REJECTED"
    elif text is not None:
        return None, "UNEXPECTED_TEXT"
    return operation, None


def handle(**kwargs: Any) -> str:
    """MCP adapter entry point used by the hash-guarded Hermes overlay."""
    if set(kwargs) - {"operation", "text"}:
        return _error("UNEXPECTED_ARGUMENT")
    operation, error = _validate(kwargs.get("operation"), kwargs.get("text"))
    if error:
        return _error(error)
    if operation == "DISCOVER_CHATGPT_TARGET":
        return _with_page(operation, _discover)
    if operation == "GET_COMPOSER_STATE":
        return _with_page(operation, _state)
    if operation == "PREFILL_SINGLE_LINE":
        text = kwargs["text"]
        return _with_page(operation, lambda ws, sid, target: _prefill(ws, sid, target, text))
    return _with_page(operation, _clear)
