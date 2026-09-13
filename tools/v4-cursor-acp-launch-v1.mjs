import fs from "node:fs";
import path from "node:path";

/** Canonical official Windows Cursor Agent ACP launch specification. */
export function officialAcpLaunch(env = process.env) {
  const script = env.CURSOR_AGENT_CLI_PATH
    || path.join(env.LOCALAPPDATA || "", "cursor-agent", "agent.ps1");
  if (!fs.existsSync(script)) throw new Error("AGENT_CLI_SCRIPT_NOT_FOUND");
  return {
    command: "powershell.exe",
    args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, "acp"],
    options: { shell: false, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] },
  };
}
