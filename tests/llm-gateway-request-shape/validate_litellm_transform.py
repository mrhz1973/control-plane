#!/usr/bin/env python3
"""
D-0024-W offline LiteLLM 1.98.0 transform validation — no network, no OAuth.
"""
from __future__ import annotations

import json
import os
import socket
import sys
from pathlib import Path
from typing import Any

ROOT = Path(os.environ.get("D0024_ROOT", Path(__file__).resolve().parents[2]))
CONSUMER_FIXTURE = ROOT / "tests/openclaw-consumer-roundtrip/fixtures/consumer-input-valid.json"
PACKET_SCHEMA = ROOT / "docs/contracts/execution-packet-v1.schema.json"

VENV_SITE = (
    Path(os.environ.get("LOCALAPPDATA", ""))
    / "ControlPlane/litellm-spike/venv/Lib/site-packages"
)
if VENV_SITE.is_dir():
    sys.path.insert(0, str(VENV_SITE))


def _forbid_network() -> None:
    original_connect = socket.socket.connect

    def guarded_connect(self, *args: Any, **kwargs: Any) -> None:
        raise RuntimeError("NETWORK_ACCESS_FORBIDDEN")

    socket.socket.connect = guarded_connect  # type: ignore[method-assign]


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8").replace("\ufeff", ""))


def _make_input(consumer: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "role": "user",
            "content": [{"type": "input_text", "text": json.dumps(consumer)}],
        }
    ]


def _make_tools() -> list[dict[str, Any]]:
    schema = _read_json(PACKET_SCHEMA)
    return [
        {
            "type": "function",
            "name": "emit_execution_packet",
            "description": "Emit one execution-packet-v1 object for deterministic validation and Cursor handoff.",
            "parameters": schema,
        }
    ]


def _role_of(message: Any) -> str | None:
    if isinstance(message, dict):
        role = message.get("role")
        return str(role) if role is not None else None
    role = getattr(message, "role", None)
    return str(role) if role is not None else None


def _content_of(message: Any) -> Any:
    if isinstance(message, dict):
        return message.get("content")
    return getattr(message, "content", None)


def validate_zai_transform(consumer: dict[str, Any]) -> str:
    from litellm.responses.litellm_completion_transformation.transformation import (
        LiteLLMCompletionResponsesConfig,
    )

    instructions = (
        "You are the planner for mrhz1973/control-plane.\n"
        "Return the packet only through the required emit_execution_packet function call."
    )
    input_param = _make_input(consumer)
    messages = LiteLLMCompletionResponsesConfig.transform_responses_api_input_to_messages(
        input=input_param,
        responses_api_request={
            "instructions": instructions,
            "tools": _make_tools(),
            "tool_choice": {"type": "function", "name": "emit_execution_packet"},
        },
    )
    if not isinstance(messages, list) or len(messages) < 2:
        raise AssertionError("zai transform must produce system+user messages list")
    user_messages = [m for m in messages if _role_of(m) == "user"]
    if not user_messages:
        raise AssertionError("zai transform missing user message")
    content = _content_of(user_messages[-1])
    if isinstance(content, dict):
        raise AssertionError("zai transform user content must not be raw consumer object")
    if content is None:
        raise AssertionError("zai transform user content is empty")
    return "PASS"


def validate_codex_transform(consumer: dict[str, Any]) -> str:
    from litellm.llms.openai.responses.transformation import OpenAIResponsesAPIConfig
    from litellm.types.router import GenericLiteLLMParams

    config = OpenAIResponsesAPIConfig()
    input_param = _make_input(consumer)
    optional = {
        "tools": _make_tools(),
        "tool_choice": {"type": "function", "name": "emit_execution_packet"},
        "stream": False,
        "instructions": "Planner instructions for emit_execution_packet only.",
    }
    request = config.transform_responses_api_request(
        model="gpt-5.6-sol",
        input=input_param,
        response_api_optional_request_params=optional,
        litellm_params=GenericLiteLLMParams(),
        headers={},
    )
    transformed_input = request.get("input")
    if not isinstance(transformed_input, list):
        raise AssertionError("codex transform input must be list-compatible")
    if len(transformed_input) != 1:
        raise AssertionError("codex transform input must contain one user item")
    first = transformed_input[0]
    if not isinstance(first, dict) or first.get("role") != "user":
        raise AssertionError("codex transform input item must be user role")
    content = first.get("content")
    if not isinstance(content, list):
        raise AssertionError("codex transform user content must be list-shaped")
    if not any(
        isinstance(block, dict) and block.get("type") == "input_text"
        for block in content
    ):
        raise AssertionError("codex transform missing input_text block")
    return "PASS"


def main() -> int:
    _forbid_network()
    base = _read_json(CONSUMER_FIXTURE)
    glm_consumer = dict(base)
    glm_consumer["planner_requested"] = "glm"
    codex_consumer = dict(base)
    codex_consumer["planner_requested"] = "codex"

    zai_status = validate_zai_transform(glm_consumer)
    codex_status = validate_codex_transform(codex_consumer)

    summary = {
        "ok": True,
        "classification": "PASS",
        "zai_transform_validation": zai_status,
        "codex_transform_validation": codex_status,
        "litellm_source_paths": [
            "litellm/responses/litellm_completion_transformation/transformation.py",
            "litellm/llms/openai/responses/transformation.py",
        ],
        "network_access": False,
        "provider_attempts_this_pass": 0,
        "inference_this_pass": 0,
    }
    print(json.dumps(summary))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(
            json.dumps(
                {
                    "ok": False,
                    "classification": "FAIL",
                    "error": str(exc),
                    "network_access": False,
                }
            )
        )
        raise SystemExit(1)
