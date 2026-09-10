#!/usr/bin/env python3
"""Apply, verify, or rollback the governed Hermes composer capability.

The installed Hermes transport is treated as an external dependency.  The
exact original hash, Hermes version, target path, and patch markers are checked
before any write.  The backup contains source code only and lives outside the
repository; rollback restores the original bytes exactly.
"""

from __future__ import annotations

import argparse
import hashlib
import os
import re
import tempfile
from pathlib import Path


HERMES_VERSION = "0.21.0"
EXPECTED_ORIGINAL_SHA256 = "F643189A1F4BA4CDC159CC9CB2F8421E963F3C6D0F9B175C18E4790AD6F0DA15"
PATCH_START = "# CONTROL_PLANE_GOVERNED_CDP_V1_START"
PATCH_END = "# CONTROL_PLANE_GOVERNED_CDP_V1_END"
TOOL_NAME = "control_plane_chatgpt_composer_cdp"
RAW_TOOL_NAME = "browser_cdp"
CONFIG_ENV_KEY = "CONTROL_PLANE_GOVERNED_ADAPTER_ROOT"
MCP_GRACE_KEY = "mcp_optional_startup_grace_ms"
MIGRATION_MARKER = "# managed by hermes-agent"

PATCH_IMPORT = f'''{PATCH_START}
_CONTROL_PLANE_GOVERNED_ADAPTER = None
_CONTROL_PLANE_GOVERNED_SCHEMA = None
try:
    _adapter_root = os.environ.get("CONTROL_PLANE_GOVERNED_ADAPTER_ROOT", "").strip()
    if _adapter_root:
        _adapter_path = os.path.join(_adapter_root, "tools", "hermes_governed_cdp_composer_v1.py")
        _adapter_spec = importlib.util.spec_from_file_location("control_plane_hermes_governed_cdp", _adapter_path)
        if _adapter_spec and _adapter_spec.loader:
            _adapter_module = importlib.util.module_from_spec(_adapter_spec)
            _adapter_spec.loader.exec_module(_adapter_module)
            _CONTROL_PLANE_GOVERNED_ADAPTER = _adapter_module.handle
            _CONTROL_PLANE_GOVERNED_SCHEMA = _adapter_module.TOOL_SCHEMA["parameters"]
except Exception:
    _CONTROL_PLANE_GOVERNED_ADAPTER = None
    _CONTROL_PLANE_GOVERNED_SCHEMA = None
{PATCH_END}'''

PATCH_DISPATCH = f'''{PATCH_START}_DISPATCH
                if tool_name == "{TOOL_NAME}" and _CONTROL_PLANE_GOVERNED_ADAPTER is not None:
                    return _CONTROL_PLANE_GOVERNED_ADAPTER(**kwargs)
{PATCH_END}_DISPATCH'''

PATCH_DEFS = f'''{PATCH_START}_DEFS
    if _CONTROL_PLANE_GOVERNED_SCHEMA is not None:
        all_defs["{TOOL_NAME}"] = {{"name": "{TOOL_NAME}", "parameters": _CONTROL_PLANE_GOVERNED_SCHEMA,
                                    "description": "Governed ChatGPT composer capability; no raw CDP."}}
{PATCH_END}_DEFS'''


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest().upper()


def read_version(hermes_root: Path) -> str:
    text = (hermes_root / "pyproject.toml").read_text(encoding="utf-8")
    match = re.search(r'^version\s*=\s*["\']([^"\']+)', text, re.MULTILINE)
    return match.group(1) if match else ""


def target_for(hermes_root: Path, target_file: Path | None) -> Path:
    target = target_file or (hermes_root / "agent" / "transports" / "hermes_tools_mcp_server.py")
    target = target.resolve()
    if target.name != "hermes_tools_mcp_server.py":
        raise SystemExit("FAIL_CLOSED: target filename mismatch")
    return target


def structural_original(text: str) -> bool:
    return (
        "EXPOSED_TOOLS: tuple[str, ...]" in text
        and '"browser_snapshot"' in text
        and '"browser_cdp"' not in text.split("EXPOSED_TOOLS", 1)[1].split(")", 1)[0]
        and "def _make_handler" in text
        and PATCH_START not in text
    )


def patched_bytes(original: bytes) -> bytes:
    text = original.decode("utf-8")
    if not structural_original(text):
        raise SystemExit("FAIL_CLOSED: original structural invariant mismatch")
    text = text.replace("import inspect\n", "import inspect\nimport importlib.util\n", 1)
    text = text.replace("logger = logging.getLogger(__name__)\n", "logger = logging.getLogger(__name__)\n\n" + PATCH_IMPORT + "\n", 1)
    inventory_start = text.find("EXPOSED_TOOLS: tuple[str, ...] = (")
    inventory_end = text.find("\n\n\ndef _build_server", inventory_start)
    if inventory_start < 0 or inventory_end < 0:
        raise SystemExit("FAIL_CLOSED: exposed tool inventory insertion point missing")
    governed_inventory = (
        "EXPOSED_TOOLS: tuple[str, ...] = (\n"
        f'    "{TOOL_NAME}",\n'
        ")"
    )
    text = text[:inventory_start] + governed_inventory + text[inventory_end:]
    text = text.replace("        def _dispatch(**kwargs: Any) -> str:\n            try:\n",
                        "        def _dispatch(**kwargs: Any) -> str:\n            try:\n" + PATCH_DISPATCH + "\n", 1)
    text = text.replace("    all_defs = {\n", "    all_defs = {\n", 1)
    needle = '        if isinstance(td, dict) and td.get("type") == "function"\n    }\n\n'
    if needle not in text:
        raise SystemExit("FAIL_CLOSED: definitions insertion point missing")
    text = text.replace(needle, needle + PATCH_DEFS + "\n", 1)
    result = text.encode("utf-8")
    exposed = result.decode("utf-8").split("EXPOSED_TOOLS", 1)[1].split(")", 1)[0]
    if RAW_TOOL_NAME in exposed or re.search(r'"browser_[a-z_]+"', exposed):
        raise SystemExit("FAIL_CLOSED: ungoverned browser tool exposed")
    return result


def atomic_write(path: Path, data: bytes) -> None:
    fd, name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=str(path.parent))
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def _config_semantic_ok(config_path: Path, adapter_root: Path) -> bool:
    text = config_path.read_text(encoding="utf-8")
    marker = text.find(MIGRATION_MARKER)
    if marker < 0:
        return False
    prefix = text[:marker]
    escaped_root = str(adapter_root.resolve()).replace("\\", "\\\\").replace('"', '\\"')
    section = "[mcp_servers.hermes-tools]"
    start = text.find(section, marker)
    if start < 0:
        return False
    end = text.find("\n[", start + len(section))
    if end < 0:
        end = len(text)
    block = text[start:end]
    env_match = re.search(r"(?m)^env\s*=\s*\{([^\n]*)\}\s*$", block)
    return bool(
        re.search(rf"(?m)^{MCP_GRACE_KEY}\s*=\s*0\s*$", prefix)
        and env_match
        and re.search(rf'{CONFIG_ENV_KEY}\s*=\s*"{re.escape(escaped_root)}"', env_match.group(1))
        and re.search(r"(?m)^required\s*=\s*true\s*$", block)
        and re.search(rf'(?m)^enabled_tools\s*=\s*\[\s*"{re.escape(TOOL_NAME)}"\s*\]\s*$', block)
    )


def configure_codex_env(config_path: Path, adapter_root: Path, backup: Path, *, rollback: bool = False) -> None:
    """Reconcile the repo adapter and fail-closed MCP settings with exact rollback."""
    current = config_path.read_bytes()
    if rollback:
        if not backup.exists():
            raise SystemExit("FAIL_CLOSED: Codex config backup missing")
        restored = backup.read_bytes()
        atomic_write(config_path, restored)
        if config_path.read_bytes() != restored:
            raise SystemExit("FAIL_CLOSED: Codex config rollback mismatch")
        backup.unlink()
        return
    text = current.decode("utf-8")
    marker = text.find(MIGRATION_MARKER)
    if marker < 0:
        raise SystemExit("FAIL_CLOSED: Hermes managed migration marker missing")
    prefix = text[:marker]
    grace_match = re.search(rf"(?m)^{MCP_GRACE_KEY}\s*=\s*(\S+)\s*$", prefix)
    if grace_match and grace_match.group(1) != "0":
        raise SystemExit("FAIL_CLOSED: MCP startup grace is not zero")
    if not grace_match:
        prefix = prefix.rstrip() + f"\n\n{MCP_GRACE_KEY} = 0\n\n"
        text = prefix + text[marker:]
    section = "[mcp_servers.hermes-tools]"
    start = text.find(section, marker)
    if start < 0:
        raise SystemExit("FAIL_CLOSED: Hermes MCP config section missing")
    end = text.find("\n[", start + len(section))
    if end < 0:
        end = len(text)
    block = text[start:end]
    env_match = re.search(r"(?m)^env\s*=\s*\{([^\n]*)\}\s*$", block)
    if not env_match:
        raise SystemExit("FAIL_CLOSED: Hermes MCP inline env missing")
    escaped_root = str(adapter_root.resolve()).replace("\\", "\\\\").replace('"', '\\"')
    env_body = env_match.group(1)
    if CONFIG_ENV_KEY in env_body:
        if re.search(rf'{CONFIG_ENV_KEY}\s*=\s*"{re.escape(escaped_root)}"', env_body):
            updated_block = block
        else:
            raise SystemExit("FAIL_CLOSED: existing adapter root mismatch")
    else:
        replacement = f'env = {{{env_body}, {CONFIG_ENV_KEY} = "{escaped_root}"}}'
        updated_block = block[:env_match.start()] + replacement + block[env_match.end():]

    def ensure_line(current_block: str, pattern: str, line: str) -> str:
        found = re.search(pattern, current_block, re.MULTILINE)
        if found:
            if found.group(0).strip() != line:
                raise SystemExit(f"FAIL_CLOSED: managed MCP setting mismatch: {line}")
            return current_block
        return current_block.rstrip() + "\n" + line + "\n"

    updated_block = ensure_line(updated_block, r"^required\s*=.*$", "required = true")
    updated_block = ensure_line(
        updated_block,
        rf'^enabled_tools\s*=.*$',
        f'enabled_tools = ["{TOOL_NAME}"]',
    )
    updated = (text[:start] + updated_block + text[end:]).encode("utf-8")
    if not backup.exists():
        atomic_write(backup, current)
    atomic_write(config_path, updated)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=("apply", "verify", "rollback"))
    parser.add_argument("--hermes-root", required=True)
    parser.add_argument("--target-file")
    parser.add_argument("--backup-path")
    parser.add_argument("--codex-config")
    parser.add_argument("--adapter-root")
    args = parser.parse_args()
    root = Path(args.hermes_root).resolve()
    target = target_for(root, Path(args.target_file) if args.target_file else None)
    if read_version(root) != HERMES_VERSION:
        raise SystemExit("FAIL_CLOSED: HERMES_VERSION mismatch")
    current = target.read_bytes()
    backup = Path(args.backup_path).resolve() if args.backup_path else (
        Path(tempfile.gettempdir()) / "control-plane-hermes-governed-cdp-v1.original.py"
    )
    config_path = Path(args.codex_config).resolve() if args.codex_config else None
    adapter_root = Path(args.adapter_root).resolve() if args.adapter_root else None
    config_backup = Path(tempfile.gettempdir()) / "control-plane-hermes-governed-cdp-v1.codex-config.original.toml"
    if bool(config_path) != bool(adapter_root):
        raise SystemExit("FAIL_CLOSED: --codex-config and --adapter-root must be paired")
    if args.action == "verify":
        text = current.decode("utf-8")
        exposed = text.split("EXPOSED_TOOLS", 1)[1].split(")", 1)[0]
        ok = (PATCH_START in text and PATCH_END in text and TOOL_NAME in exposed and
              RAW_TOOL_NAME not in exposed and not re.search(r'"browser_[a-z_]+"', exposed))
        config_ok = True
        if config_path and adapter_root:
            config_ok = _config_semantic_ok(config_path, adapter_root)
        print(f"VERIFY={'PASS' if ok and config_ok else 'STOP'}")
        print(f"TARGET_SHA256={digest(current)}")
        return 0 if ok and config_ok else 1
    if args.action == "apply":
        if PATCH_START.encode("utf-8") in current:
            if config_path and adapter_root:
                configure_codex_env(config_path, adapter_root, config_backup)
            print("APPLY=ALREADY_APPLIED")
            return 0
        if digest(current) != EXPECTED_ORIGINAL_SHA256:
            raise SystemExit("FAIL_CLOSED: EXPECTED_ORIGINAL_SHA256 mismatch")
        result = patched_bytes(current)
        if backup.exists() and digest(backup.read_bytes()) != EXPECTED_ORIGINAL_SHA256:
            raise SystemExit("FAIL_CLOSED: existing backup hash mismatch")
        if not backup.exists():
            atomic_write(backup, current)
        atomic_write(target, result)
        if config_path and adapter_root:
            configure_codex_env(config_path, adapter_root, config_backup)
        print("APPLY=PASS")
        print(f"ORIGINAL_SHA256={digest(current)}")
        print(f"PATCHED_SHA256={digest(result)}")
        print(f"BACKUP={backup}")
        return 0
    if PATCH_START.encode("utf-8") not in current:
        raise SystemExit("FAIL_CLOSED: target is not patched")
    if not backup.exists() or digest(backup.read_bytes()) != EXPECTED_ORIGINAL_SHA256:
        raise SystemExit("FAIL_CLOSED: valid source-only backup missing")
    original = backup.read_bytes()
    atomic_write(target, original)
    if digest(target.read_bytes()) != EXPECTED_ORIGINAL_SHA256:
        raise SystemExit("FAIL_CLOSED: rollback hash mismatch")
    backup.unlink()
    if config_path and adapter_root and config_backup.exists():
        configure_codex_env(config_path, adapter_root, config_backup, rollback=True)
    print("ROLLBACK=PASS")
    print(f"RESTORED_SHA256={digest(original)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
