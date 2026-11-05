import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "./productBuild.mjs";

const root = repoRoot();
const vendor = path.join(root, "ide/vendor/vscode");
const examples = path.join(root, "examples/vehicle");
const command = process.argv[2] ?? "run";

if (!fs.existsSync(path.join(vendor, "package.json"))) {
  console.error("Code-OSS is not prepared. Run: npm run ide:bootstrap");
  process.exit(1);
}

if (command === "install") {
  exit(spawnSync("npm", ["install"], { cwd: vendor, stdio: "inherit", env: process.env }));
}

if (command === "watch") {
  exit(spawnSync("npm", ["run", "watch"], { cwd: vendor, stdio: "inherit", env: process.env }));
}

if (command === "run") {
  const script = process.platform === "win32" ? "scripts\\code.bat" : "./scripts/code.sh";
  const child = spawn(script, [examples], {
    cwd: vendor,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  child.on("exit", (code) => process.exit(code ?? 1));
} else if (command === "package") {
  const target = packageTarget();
  exit(spawnSync("npm", ["run", "gulp", "--", target], { cwd: vendor, stdio: "inherit", env: process.env }));
} else {
  console.error(`Unknown command '${command}'. Use install | watch | run | package.`);
  process.exit(1);
}

function packageTarget() {
  if (process.platform === "darwin") {
    return process.arch === "arm64" ? "vscode-darwin-arm64" : "vscode-darwin-x64";
  }
  if (process.platform === "win32") {
    return process.arch === "arm64" ? "vscode-win32-arm64" : "vscode-win32-x64";
  }
  return process.arch === "arm64" ? "vscode-linux-arm64" : "vscode-linux-x64";
}

function exit(result) {
  process.exit(result.status ?? 1);
}
