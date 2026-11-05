import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  CODE_OSS_TAG,
  deepMerge,
  disableTopMenu,
  readJson,
  registerShellImport,
  repoRoot,
  skipVsCodeWelcome,
  stripBuiltinExtensions,
  validateFeatures,
  validateOverlay,
} from "./productBuild.mjs";

const root = repoRoot();
const checkOnly = process.argv.includes("--check");
const features = validateFeatures(readJson(path.join(root, "ide/features.json")));
const overlay = validateOverlay(readJson(path.join(root, "ide/product.overlay.json")));
const contribution = fs.readFileSync(path.join(root, "ide/workbench/sysmlShell.contribution.ts"), "utf8");
for (const label of features.activityBarHiddenLabels) {
  if (!contribution.includes(`'${label}'`)) {
    throw new Error(`Shell contribution is missing hidden activity label ${label}.`);
  }
}
for (const patch of fs.readdirSync(path.join(root, "ide/patches"))) {
  const text = fs.readFileSync(path.join(root, "ide/patches", patch), "utf8");
  if (!text.includes("[SysML Diagram Modeler]")) {
    throw new Error(`${patch} is missing the modeler tag.`);
  }
}

if (checkOnly) {
  console.log(`SysML Diagram Modeler product check passed for Code-OSS ${CODE_OSS_TAG}.`);
  process.exit(0);
}

const vendor = path.join(root, "ide/vendor/vscode");
if (!fs.existsSync(path.join(vendor, "package.json"))) {
  fs.mkdirSync(path.dirname(vendor), { recursive: true });
  const clone = spawnSync("git", ["clone", "--depth", "1", "--branch", CODE_OSS_TAG, "https://github.com/microsoft/vscode.git", vendor], {
    stdio: "inherit",
  });
  if (clone.status !== 0) {
    process.exit(clone.status ?? 1);
  }
}

const productPath = path.join(vendor, "product.json");
const merged = stripBuiltinExtensions(deepMerge(readJson(productPath), overlay), features.skipBuiltinExtensions);
fs.writeFileSync(productPath, `${JSON.stringify(merged, null, "\t")}\n`);

const shellTarget = path.join(vendor, "src/vs/workbench/contrib/sysmlShell/browser");
fs.mkdirSync(shellTarget, { recursive: true });
fs.copyFileSync(path.join(root, "ide/workbench/sysmlShell.contribution.ts"), path.join(shellTarget, "sysmlShell.contribution.ts"));

const workbenchMain = path.join(vendor, "src/vs/workbench/workbench.desktop.main.ts");
fs.writeFileSync(workbenchMain, registerShellImport(fs.readFileSync(workbenchMain, "utf8")));
const menuFile = path.join(vendor, "src/vs/workbench/browser/parts/titlebar/menubar.contribution.ts");
let menus = fs.readFileSync(menuFile, "utf8");
for (const submenu of ["MenubarSelectionMenu", "MenubarViewMenu", "MenubarGoMenu", "MenubarTerminalMenu"]) {
  menus = disableTopMenu(menus, submenu);
}
fs.writeFileSync(menuFile, menus);
const debugFile = path.join(vendor, "src/vs/workbench/contrib/debug/browser/debug.contribution.ts");
fs.writeFileSync(debugFile, disableTopMenu(fs.readFileSync(debugFile, "utf8"), "MenubarDebugMenu"));
const startupPage = path.join(vendor, "src/vs/workbench/contrib/welcomeGettingStarted/browser/startupPage.ts");
fs.writeFileSync(startupPage, skipVsCodeWelcome(fs.readFileSync(startupPage, "utf8")));

// Keep skipped built-ins on disk so Code-OSS postinstall/dirs.ts still resolve.
// The shell and product defaults hide them; packaging can prune later if needed.

const extensionRoot = path.join(root, "extensions/sysml-modeler");
run("npm", ["install"], extensionRoot);
run("npm", ["run", "compile"], extensionRoot);
const destination = path.join(vendor, "extensions/sysml-modeler");
fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination, { recursive: true });
for (const relative of ["package.json", "language-configuration.json", "dist", "media", "syntaxes", "themes", "node_modules"]) {
  const from = path.join(extensionRoot, relative);
  if (fs.existsSync(from)) {
    fs.cpSync(from, path.join(destination, relative), { recursive: true });
  }
}

console.log(`Prepared ${vendor}`);
console.log("Next:");
console.log("  npm run ide:install   # once, installs Code-OSS deps (Node 24.22.1)");
console.log("  npm run ide:watch     # compile + watch in one terminal");
console.log("  npm run ide:run       # launch SysML Diagram Modeler in another");

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
