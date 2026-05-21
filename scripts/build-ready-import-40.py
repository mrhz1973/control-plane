#!/usr/bin/env python3
"""Build READY_IMPORT_40 JSON from redacted candidate 41 export."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SRC = REPO / "workflows/exports/2026-05-21_41-plan-handoff-file-candidate.redacted.json"
DST = REPO / "workflows/exports/READY_IMPORT_40-control-plane-active-with-credentials.json"

PROD_NAME = "40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE"
CHAT_ID = "472599368"
CRED_TELEGRAM = "CONTROL PLANE - Telegram Bot"
CRED_GITHUB = "GitHub account"


def walk(obj):
    if isinstance(obj, dict):
        for k, v in list(obj.items()):
            if k in ("pinData", "pinnedData", "executionData", "staticData", "lastExecution", "runData"):
                del obj[k]
            elif k == "webhookId":
                del obj[k]
            elif k == "chatId" and v == "__CONFIGURE_CHAT_ID_IN_N8N_UI__":
                obj[k] = CHAT_ID
            else:
                walk(v)
    elif isinstance(obj, list):
        for item in obj:
            walk(item)


def apply_credentials(node: dict) -> None:
    creds = node.get("credentials") or {}
    ntype = node.get("type", "")
    if ntype == "n8n-nodes-base.telegram" or "telegramApi" in creds:
        node["credentials"] = {"telegramApi": {"name": CRED_TELEGRAM}}
    if "githubApi" in creds or ntype in (
        "n8n-nodes-base.github",
        "n8n-nodes-base.githubTrigger",
    ):
        node["credentials"] = {**creds, "githubApi": {"name": CRED_GITHUB}}
        if "telegramApi" in node["credentials"]:
            node["credentials"]["telegramApi"] = {"name": CRED_TELEGRAM}


def main() -> int:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else SRC
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else DST
    data = json.loads(src.read_text(encoding="utf-8"))
    data["name"] = PROD_NAME
    data["active"] = True
    for key in ("id", "versionId", "meta"):
        data.pop(key, None)
    walk(data)
    for node in data.get("nodes", []):
        apply_credentials(node)
    text = json.dumps(data, indent=2, ensure_ascii=False)
    text = re.sub(
        r"api\.telegram\.org/bot[^\s\"']+",
        "__REDACTED_SECRET__",
        text,
        flags=re.I,
    )
    dst.write_text(text + "\n", encoding="utf-8")
    assert PROD_NAME in text
    assert '"active": true' in text
    assert "__CONFIGURE_CHAT_ID_IN_N8N_UI__" not in text
    assert CHAT_ID in text
    assert f'"name": "{CRED_TELEGRAM}"' in text
    assert "__REDACTED_N8N_CREDENTIAL_ID__" not in text
    tg = sum(1 for n in data["nodes"] if n.get("type") == "n8n-nodes-base.telegram")
    tg_cred = sum(
        1
        for n in data["nodes"]
        if n.get("type") == "n8n-nodes-base.telegram"
        and n.get("credentials", {}).get("telegramApi", {}).get("name") == CRED_TELEGRAM
    )
    print(f"written {dst}")
    print(f"telegram nodes {tg_cred}/{tg} with {CRED_TELEGRAM!r} (name only, no id)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
