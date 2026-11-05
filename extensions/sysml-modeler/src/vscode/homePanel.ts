import * as vscode from "vscode";
import { homeCopy, newModelTemplate } from "../content/copy";
import { isModelPath } from "../files/filePolicy";
import { shellStyle } from "../theme/shellCss";

export function registerHome(context: vscode.ExtensionContext): void {
  const open = vscode.commands.registerCommand("sysml.showHome", () => showHome(context));
  context.subscriptions.push(open);
  if (vscode.workspace.getConfiguration("sysml").get<boolean>("openHomeOnStartup")) {
    void bootstrapWorkspace(context);
  }
}

async function bootstrapWorkspace(context: vscode.ExtensionContext): Promise<void> {
  await dismissVsCodeWelcome();
  const model = await findFirstModel();
  if (model) {
    const document = await vscode.workspace.openTextDocument(model);
    await vscode.window.showTextDocument(document, { preview: false });
    await vscode.commands.executeCommand("sysml.showDiagram");
    return;
  }
  if (!vscode.window.activeTextEditor) {
    showHome(context);
  }
}

async function dismissVsCodeWelcome(): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const welcome = vscode.window.tabGroups.all
      .flatMap((group) => group.tabs)
      .find((tab) => /welcome/i.test(tab.label) || String(tab.input).includes("GettingStarted"));
    if (!welcome) {
      return;
    }
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
    await delay(80);
  }
}

async function findFirstModel(): Promise<vscode.Uri | undefined> {
  const matches = await vscode.workspace.findFiles("**/*.{sysml,kerml}", "**/{node_modules,.git}/**", 20);
  return matches.sort((left, right) => left.path.localeCompare(right.path)).find((uri) => isModelPath(uri.path));
}

function showHome(context: vscode.ExtensionContext): void {
  const panel = vscode.window.createWebviewPanel("sysml.home", "Home", vscode.ViewColumn.One, { enableScripts: true });
  const nonce = Math.random().toString(36).slice(2);
  panel.webview.html = `<!DOCTYPE html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';"/><style>${shellStyle()}</style></head>
    <body>
      <h1>${homeCopy.title}</h1>
      <p>${homeCopy.lede}</p>
      <p><button id="new" type="button">${homeCopy.newModel}</button><button id="diagram" type="button">${homeCopy.openDiagram}</button><button id="guide" type="button">${homeCopy.openGuide}</button></p>
      <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        document.getElementById("new").addEventListener("click", () => vscode.postMessage({ type: "new" }));
        document.getElementById("diagram").addEventListener("click", () => vscode.postMessage({ type: "diagram" }));
        document.getElementById("guide").addEventListener("click", () => vscode.postMessage({ type: "guide" }));
      </script>
    </body></html>`;
  panel.webview.onDidReceiveMessage(async (message: { type: string }) => {
    if (message.type === "new") {
      await createModel();
    } else if (message.type === "diagram") {
      await vscode.commands.executeCommand("sysml.showDiagram");
    } else if (message.type === "guide") {
      await vscode.commands.executeCommand("sysml.openGuide");
    }
  });
  context.subscriptions.push(panel);
}

async function createModel(): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0]?.uri;
  const uri = await vscode.window.showSaveDialog({
    defaultUri: folder ? vscode.Uri.joinPath(folder, "NewModel.sysml") : undefined,
    filters: { SysML: ["sysml"] },
  });
  if (!uri) {
    return;
  }
  await vscode.workspace.fs.writeFile(uri, Buffer.from(newModelTemplate, "utf8"));
  const document = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(document);
  await vscode.commands.executeCommand("sysml.showDiagram");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
