#!/usr/bin/env python3
import json
import subprocess
import sys

sha = sys.argv[1]
subprocess.check_call(
    ["curl", "-fsS", f"https://api.github.com/repos/mrhz1973/control-plane/commits/{sha}", "-o", "/tmp/commit.json"]
)
c = json.load(open("/tmp/commit.json", encoding="utf-8"))
files = [f["filename"] for f in c.get("files", [])]
bl = [f for f in files if f.startswith("docs/runtime/BACKLOG_")]
print("file_count", len(files))
print("backlog_files", bl)
