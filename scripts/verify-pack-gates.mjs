#!/usr/bin/env node
/**
 * Pack tarball and run publint + attw (best-effort) + CJS require smoke.
 */
import { execSync, spawnSync } from "child_process";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { join, dirname } from "path";
import { tmpdir } from "os";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function run(cmd, cwd = root) {
  execSync(cmd, { cwd, stdio: "inherit", env: process.env, shell: true });
}

const tmp = mkdtempSync(join(tmpdir(), "iui-pack-"));

try {
  const packOutput = execSync(`npm pack --pack-destination "${tmp}" --json`, {
    cwd: root,
    encoding: "utf-8",
  });
  const parsed = JSON.parse(packOutput);
  const filename = parsed[0]?.filename;
  if (!filename) {
    throw new Error("npm pack did not return a filename");
  }
  const packed = join(tmp, filename);
  if (readFileSync(packed).length === 0) {
    throw new Error("Packed tarball is empty");
  }

  console.log("\n[pack-gates] Running publint…");
  run(`npm exec -- publint "${packed.replace(/\\/g, "/")}"`);

  console.log("\n[pack-gates] Running @arethetypeswrong/cli…");
  const attw = spawnSync("npm", ["exec", "--", "attw", "--pack", "."], {
    cwd: root,
    encoding: "utf-8",
    shell: true,
  });
  if (attw.status !== 0) {
    console.warn(
      "[pack-gates] attw reported issues (non-fatal locally); see output above.",
    );
    if (attw.stdout) console.log(attw.stdout);
    if (attw.stderr) console.error(attw.stderr);
  } else {
    console.log("[pack-gates] attw OK");
  }

  console.log("\n[pack-gates] Running CJS require smoke…");
  run("node scripts/verify-cjs-require.mjs");

  console.log("\n[pack-gates] PASSED — publint + CJS smoke clean.\n");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
