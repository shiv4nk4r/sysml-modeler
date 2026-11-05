import fs from "node:fs";
import path from "node:path";

export const CODE_OSS_TAG = "1.145.0";

export function deepMerge(base, overlay) {
  if (Array.isArray(overlay)) {
    return overlay.slice();
  }
  if (isObject(base) && isObject(overlay)) {
    const merged = { ...base };
    for (const [key, value] of Object.entries(overlay)) {
      merged[key] = key in merged ? deepMerge(merged[key], value) : value;
    }
    return merged;
  }
  return overlay;
}

export function stripBuiltinExtensions(product, names) {
  const skip = new Set(names);
  if (!Array.isArray(product.builtInExtensions)) {
    return product;
  }
  return {
    ...product,
    builtInExtensions: product.builtInExtensions.filter((entry) => !skip.has(entry.name)),
  };
}

export function disableTopMenu(source, submenuId) {
  const already = new RegExp(
    `if \\(false\\) MenuRegistry\\.appendMenuItem\\(MenuId\\.MenubarMainMenu, \\{ // \\[SysML Diagram Modeler\\]\\r?\\n(\\s*)submenu: MenuId\\.${submenuId},`,
  );
  if (already.test(source)) {
    return source;
  }
  const pattern = new RegExp(`MenuRegistry\\.appendMenuItem\\(MenuId\\.MenubarMainMenu, \\{\\r?\\n(\\s*)submenu: MenuId\\.${submenuId},`);
  if (!pattern.test(source)) {
    throw new Error(`Could not find menubar registration for ${submenuId}.`);
  }
  return source.replace(pattern, `if (false) MenuRegistry.appendMenuItem(MenuId.MenubarMainMenu, { // [SysML Diagram Modeler]\n$1submenu: MenuId.${submenuId},`);
}

export function registerShellImport(source) {
  const needle = "import './workbench.common.main.js';\n";
  const insert = "import './contrib/sysmlShell/browser/sysmlShell.contribution.js'; // [SysML Diagram Modeler]\n";
  if (source.includes(insert)) {
    return source;
  }
  if (!source.includes(needle)) {
    throw new Error("Could not find the workbench common import.");
  }
  return source.replace(needle, needle + insert);
}

export function skipVsCodeWelcome(source) {
  const marker = "// [SysML Diagram Modeler] Never show the VS Code first-run onboarding overlay.";
  if (source.includes(marker)) {
    return source;
  }
  const needle = "\tprivate tryShowOnboarding(): void {\n";
  if (!source.includes(needle)) {
    throw new Error("Could not find tryShowOnboarding in startupPage.ts.");
  }
  return source.replace(
    needle,
    `${needle}\t\t${marker}\n\t\tif (this.productService.nameShort === 'SysML Diagram Modeler') {\n\t\t\treturn;\n\t\t}\n\n`,
  );
}

export function validateFeatures(features) {
  for (const required of ["sysml", "kerml", "readme"]) {
    if (!features.files?.includes(required)) {
      throw new Error(`features.json must allow ${required} files.`);
    }
  }
  for (const capability of ["debug", "terminal", "scm", "extensions", "remote", "notebooks", "testing"]) {
    if (features.capabilities?.[capability] !== false) {
      throw new Error(`Capability ${capability} must be off.`);
    }
  }
  if (!features.activityBarHiddenLabels?.includes("Run and Debug")) {
    throw new Error("The Run and Debug activity entry must be hidden.");
  }
  if (!Array.isArray(features.skipBuiltinExtensions) || features.skipBuiltinExtensions.length === 0) {
    throw new Error("features.json needs skipBuiltinExtensions.");
  }
  return features;
}

export function validateOverlay(overlay) {
  for (const key of ["nameShort", "applicationName", "dataFolderName", "urlProtocol", "extensionsGallery"]) {
    if (!overlay[key]) {
      throw new Error(`product overlay is missing ${key}.`);
    }
  }
  if (String(overlay.extensionsGallery.serviceUrl).includes("marketplace.visualstudio.com")) {
    throw new Error("The product gallery must point at Open VSX.");
  }
  if (overlay.configurationDefaults?.["sysml.productMode"] !== true) {
    throw new Error("The product overlay must enable sysml.productMode.");
  }
  if (overlay.configurationDefaults?.["workbench.colorTheme"] !== "SysML Modeler Graphite") {
    throw new Error("The product overlay must select the modeler theme.");
  }
  if (overlay.configurationDefaults?.["workbench.startupEditor"] !== "none") {
    throw new Error("The product overlay must disable the VS Code welcome startup editor.");
  }
  if (overlay.configurationDefaults?.["workbench.welcomePage.experimentalOnboarding"] !== false) {
    throw new Error("The product overlay must disable the VS Code onboarding overlay.");
  }
  return overlay;
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function repoRoot() {
  return path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
}

function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
