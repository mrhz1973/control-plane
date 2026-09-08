import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const util = path.join(root, "reports", "runtime", "qwen-qualification", "qval2", "integer-summary.mjs");

let failures = 0;
function expect(name, input, want) {
  try {
    const stdout = execFileSync(process.execPath, [util, input], { encoding: "utf8" });
    if (want.ok) {
      if (stdout === want.stdout) {
        process.stdout.write("PASS " + name + "\n");
      } else {
        failures++;
        process.stdout.write("FAIL " + name + " got=" + JSON.stringify(stdout) + " want=" + JSON.stringify(want.stdout) + "\n");
      }
    } else {
      failures++;
      process.stdout.write("FAIL " + name + " expected non-zero exit, got 0\n");
    }
  } catch (e) {
    const stderr = e.stderr ? e.stderr.toString() : "";
    if (!want.ok) {
      if (e.status === 2 && stderr.trim() === "INVALID_INTEGER_ARRAY") {
        process.stdout.write("PASS " + name + "\n");
      } else {
        failures++;
        process.stdout.write("FAIL " + name + " status=" + e.status + " stderr=" + JSON.stringify(stderr) + "\n");
      }
    } else {
      failures++;
      process.stdout.write("FAIL " + name + " unexpected error: " + e.message + "\n");
    }
  }
}

expect("case1 [4,1,7]", "[4,1,7]", { ok: true, stdout: '{"count":3,"sum":12,"min":1,"max":7}\n' });
expect("case2 []", "[]", { ok: true, stdout: '{"count":0,"sum":0,"min":null,"max":null}\n' });
expect("case3 [2,-3,5]", "[2,-3,5]", { ok: true, stdout: '{"count":3,"sum":4,"min":-3,"max":5}\n' });
expect("case4 [1,2.5]", "[1,2.5]", { ok: false });
expect("case5 object", '{"a":1}', { ok: false });
expect("case6 malformed", "not-json", { ok: false });

if (failures === 0) {
  process.stdout.write("ALL PASSED\n");
  process.exit(0);
} else {
  process.stdout.write(failures + " FAILURES\n");
  process.exit(1);
}
