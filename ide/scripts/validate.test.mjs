import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { deepMerge, disableTopMenu, stripBuiltinExtensions, validateFeatures, validateOverlay } from "./productBuild.mjs";

test("merges product defaults and drops disabled built-ins", () => {
  const merged = stripBuiltinExtensions(
    deepMerge({ nameShort: "Code - OSS", configurationDefaults: { "editor.fontSize": 14 }, builtInExtensions: [{ name: "git" }, { name: "markdown-language-features" }] }, { nameShort: "SysML Diagram Modeler", configurationDefaults: { "sysml.productMode": true } }),
    ["git"],
  );
  assert.equal(merged.nameShort, "SysML Diagram Modeler");
  assert.equal(merged.configurationDefaults["editor.fontSize"], 14);
  assert.equal(merged.configurationDefaults["sysml.productMode"], true);
  assert.deepEqual(merged.builtInExtensions, [{ name: "markdown-language-features" }]);
});

test("disables a top-level menubar registration", () => {
  const source = "MenuRegistry.appendMenuItem(MenuId.MenubarMainMenu, {\n\tsubmenu: MenuId.MenubarTerminalMenu,\n\torder: 7\n});\n";
  const next = disableTopMenu(source, "MenubarTerminalMenu");
  assert.match(next, /if \(false\) MenuRegistry.appendMenuItem/);
  assert.match(next, /\[SysML Diagram Modeler\]/);
});

test("skips the VS Code onboarding overlay for this product", async () => {
  const { skipVsCodeWelcome } = await import("./productBuild.mjs");
  const source = "\tprivate tryShowOnboarding(): void {\n\t\tif (this.environmentService.skipWelcome) {\n";
  const next = skipVsCodeWelcome(source);
  assert.match(next, /nameShort === 'SysML Diagram Modeler'/);
  assert.equal(skipVsCodeWelcome(next), next);
});

test("the checked-in feature manifest and overlay are valid", () => {
  const features = validateFeatures(JSON.parse(readFileSync(fileURLToPath(new URL("../features.json", import.meta.url)), "utf8")));
  const overlay = validateOverlay(JSON.parse(readFileSync(fileURLToPath(new URL("../product.overlay.json", import.meta.url)), "utf8")));
  assert.equal(features.capabilities.diagram, true);
  assert.equal(overlay.applicationName, "sysml-diagram-modeler");
});
