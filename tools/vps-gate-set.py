#!/usr/bin/env python3
import json
from pathlib import Path

path = Path("/root/local-files/handoff-runtime/control-plane/configs/planner/primary-remote-runtime-gate.json")
closed = {
    "schema": "primary-remote-runtime-gate-v1",
    "enabled": False,
    "provider_calls_authorized_per_event": 0,
    "allowed_planners": ["glm", "codex"],
    "required_fallback_policy": "gate_only",
    "require_empty_fallback": True,
    "provider_state": {
        "qwen": {"available": False, "resource_pressure": "unknown"},
        "glm": {"available": True, "quota_state": "healthy"},
        "codex": {"available": True, "quota_state": "healthy"},
    },
    "notes": ["Restored CLOSED."],
}
opened = dict(closed)
opened["enabled"] = True
opened["provider_calls_authorized_per_event"] = 1
opened["notes"] = ["Temporary one-event arm for WF40 PG live 005."]

mode = __import__("sys").argv[1] if len(__import__("sys").argv) > 1 else "closed"
payload = opened if mode == "open" else closed
path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print(mode, payload["enabled"], payload["provider_calls_authorized_per_event"])
