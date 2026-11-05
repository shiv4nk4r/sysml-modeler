import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { deepMerge, readJson, repoRoot, stripBuiltinExtensions, validateFeatures, validateOverlay } from "./productBuild.mjs";

const root = repoRoot();
const vendor = path.join(root, "ide/vendor/vscode");
const examples = path.join(root, "examples/vehicle");
const userData = path.join(root, "ide/.user-data");
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
  refreshProductOverlay();
  ensureUserData();
  const electron = resolveElectronBinary();
  const env = {
    ...process.env,
    NODE_ENV: "development",
    VSCODE_DEV: "1",
    VSCODE_CLI: "1",
    ELECTRON_ENABLE_LOGGING: "1",
  };
  const args = [
    examples,
    `--user-data-dir=${userData}`,
    "--skip-welcome",
    "--skip-release-notes",
    "--disable-extension=vscode.vscode-api-tests",
  ];
  const child = spawn(electron, args, { cwd: vendor, stdio: "inherit", env });
  child.on("exit", (code) => process.exit(code ?? 1));
} else if (command === "package") {
  const target = packageTarget();
  exit(spawnSync("npm", ["run", "gulp", "--", target], { cwd: vendor, stdio: "inherit", env: process.env }));
} else {
  console.error(`Unknown command '${command}'. Use install | watch | run | package.`);
  process.exit(1);
}

function refreshProductOverlay() {
  const features = validateFeatures(readJson(path.join(root, "ide/features.json")));
  const overlay = validateOverlay(readJson(path.join(root, "ide/product.overlay.json")));
  const productPath = path.join(vendor, "product.json");
  const merged = stripBuiltinExtensions(deepMerge(readJson(productPath), overlay), features.skipBuiltinExtensions);
  fs.writeFileSync(productPath, `${JSON.stringify(merged, null, "\t")}\n`);
}

function ensureUserData() {
  const userDir = path.join(userData, "User");
  fs.mkdirSync(userDir, { recursive: true });
  const settingsPath = path.join(userDir, "settings.json");
  const defaults = {
    "workbench.startupEditor": "none",
    "workbench.welcomePage.experimentalOnboarding": false,
    "workbench.welcomePage.walkthroughs.openOnInstall": false,
    "workbench.colorTheme": "SysML Modeler Graphite",
    "sysml.productMode": true,
    "sysml.openHomeOnStartup": true,
    "telemetry.telemetryLevel": "off",
    "update.showReleaseNotes": false,
  };
  let current = {};
  if (fs.existsSync(settingsPath)) {
    try {
      current = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    } catch {
      current = {};
    }
  }
  fs.writeFileSync(settingsPath, `${JSON.stringify({ ...current, ...defaults }, null, 2)}\n`);
}

function resolveElectronBinary() {
  const product = readJson(path.join(vendor, "product.json"));
  if (process.platform === "darwin") {
    const candidate = path.join(vendor, ".build/electron", `${product.nameLong}.app/Contents/MacOS/${product.nameShort}`);
    if (!fs.existsSync(candidate)) {
      console.error(`Electron binary missing at ${candidate}. Keep npm run ide:watch running once, then retry.`);
      process.exit(1);
    }
    return candidate;
  }
  if (process.platform === "win32") {
    return path.join(vendor, ".build/electron", `${product.nameShort}.exe`);
  }
  return path.join(vendor, ".build/electron", product.applicationName);
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
