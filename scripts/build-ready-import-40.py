#!/usr/bin/env python3
"""Build READY_IMPORT_40 JSON from redacted candidate 41 export.

Requires real n8n credential ids (env or local gitignored file).
Fails fast if ids are missing — never emits name-only credentials.
"""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SRC = REPO / "workflows/exports/2026-05-21_41-plan-handoff-file-candidate.redacted.json"
DST = REPO / "workflows/exports/READY_IMPORT_40-control-plane-active-with-credentials.json"
LOCAL_IDS = REPO / ".n8n-credential-ids.local.json"

PROD_NAME = "40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE"
CHAT_ID = "472599368"
CRED_TELEGRAM = "CONTROL PLANE - Telegram Bot"
CRED_GITHUB = "GitHub account"

FORBIDDEN_ID = frozenset(
    {
        "",
        "__REDACTED_N8N_CREDENTIAL_ID__",
        "REDACTED_TELEGRAM_CREDENTIAL_ID",
        "REDACTED_GITHUB_CREDENTIAL_ID",
    }
)


def load_credential_ids() -> tuple[str, str]:
    tg = os.environ.get("TELEGRAM_CREDENTIAL_ID", "").strip()
    gh = os.environ.get("GITHUB_CREDENTIAL_ID", "").strip()
    if LOCAL_IDS.is_file():
        data = json.loads(LOCAL_IDS.read_text(encoding="utf-8"))
        tg = tg or str(data.get("telegramCredentialId", "")).strip()
        gh = gh or str(data.get("githubCredentialId", "")).strip()
    return tg, gh


def validate_id(label: str, value: str) -> str:
    if not value or value in FORBIDDEN_ID:
        raise SystemExit(
            f"ERROR: missing or invalid {label}. "
            "Set TELEGRAM_CREDENTIAL_ID and GITHUB_CREDENTIAL_ID, or create "
            f"{LOCAL_IDS.name} (gitignored). See docs/OPERATING_MEMORY.md."
        )
    if not re.fullmatch(r"[A-Za-z0-9]{8,64}", value):
        raise SystemExit(f"ERROR: {label} does not look like a real n8n credential id.")
    return value


def walk(obj) -> None:
    if isinstance(obj, dict):
        for k, v in list(obj.items()):
            if k in (
                "pinData",
                "pinnedData",
                "executionData",
                "staticData",
                "lastExecution",
                "runData",
            ):
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


def apply_credentials(node: dict, tg_id: str, gh_id: str) -> None:
    creds = node.get("credentials") or {}
    ntype = node.get("type", "")
    if ntype == "n8n-nodes-base.telegram" or "telegramApi" in creds:
        node["credentials"] = {
            "telegramApi": {"id": tg_id, "name": CRED_TELEGRAM}
        }
    if "githubApi" in creds or ntype in (
        "n8n-nodes-base.github",
        "n8n-nodes-base.githubTrigger",
    ):
        merged = dict(node.get("credentials") or {})
        merged["githubApi"] = {"id": gh_id, "name": CRED_GITHUB}
        node["credentials"] = merged


def assert_output(text: str, data: dict, tg_id: str, gh_id: str) -> None:
    if PROD_NAME not in text:
        raise SystemExit("ERROR: production name missing")
    if '"active": true' not in text:
        raise SystemExit("ERROR: active must be true")
    if "__CONFIGURE_CHAT_ID_IN_N8N_UI__" in text:
        raise SystemExit("ERROR: chat_id placeholder remains")
    if "__REDACTED_N8N_CREDENTIAL_ID__" in text:
        raise SystemExit("ERROR: redacted credential id in output")
    if CHAT_ID not in text:
        raise SystemExit("ERROR: chat_id missing")
    # name-only guard: every telegram/github cred block must include id
    for node in data.get("nodes", []):
        creds = node.get("credentials") or {}
        if "telegramApi" in creds:
            t = creds["telegramApi"]
            if "id" not in t or t.get("id") in FORBIDDEN_ID:
                raise SystemExit(
                    f"ERROR: name-only telegram credential on node {node.get('name')!r}"
                )
            if t["id"] != tg_id:
                raise SystemExit("ERROR: inconsistent telegram credential id")
        if "githubApi" in creds:
            g = creds["githubApi"]
            if "id" not in g or g.get("id") in FORBIDDEN_ID:
                raise SystemExit(
                    f"ERROR: name-only github credential on node {node.get('name')!r}"
                )
            if g["id"] != gh_id:
                raise SystemExit("ERROR: inconsistent github credential id")


def main() -> int:
    tg_raw, gh_raw = load_credential_ids()
    tg_id = validate_id("TELEGRAM_CREDENTIAL_ID", tg_raw)
    gh_id = validate_id("GITHUB_CREDENTIAL_ID", gh_raw)

    src = Path(sys.argv[1]) if len(sys.argv) > 1 else SRC
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else DST
    data = json.loads(src.read_text(encoding="utf-8"))
    data["name"] = PROD_NAME
    data["active"] = True
    for key in ("id", "versionId", "meta"):
        data.pop(key, None)
    walk(data)
    for node in data.get("nodes", []):
        apply_credentials(node, tg_id, gh_id)
    text = json.dumps(data, indent=2, ensure_ascii=False)
    text = re.sub(
        r"api\.telegram\.org/bot[^\s\"']+",
        "__REDACTED_SECRET__",
        text,
        flags=re.I,
    )
    assert_output(text, data, tg_id, gh_id)
    dst.write_text(text + "\n", encoding="utf-8")
    tg_nodes = sum(1 for n in data["nodes"] if n.get("type") == "n8n-nodes-base.telegram")
    gh_nodes = sum(1 for n in data["nodes"] if (n.get("credentials") or {}).get("githubApi"))
    print(f"written {dst}")
    print(f"telegram {tg_nodes}/{tg_nodes} with id+name bound")
    print(f"github {gh_nodes} nodes with id+name bound")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
