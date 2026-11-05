import * as vscode from "vscode";
import { renderReadme } from "../guide/renderReadme";
import { shellStyle } from "../theme/shellCss";

export class GuideViewProvider implements vscode.WebviewViewProvider {
  resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = { enableScripts: false };
    void this.render(webviewView);
    const watcher = vscode.workspace.createFileSystemWatcher("**/README.md");
    webviewView.onDidDispose(() => watcher.dispose());
    watcher.onDidChange(() => void this.render(webviewView));
  }

  private async render(webviewView: vscode.WebviewView): Promise<void> {
    const readme = await findReadme();
    const body = readme ? renderReadme(readme) : "<p>Add a README.md beside the model. The guide rail renders that file.</p>";
    webviewView.webview.html = `<!DOCTYPE html><html><head><style>${shellStyle()}</style></head><body>${body}</body></html>`;
  }
}

async function findReadmeUri(): Promise<vscode.Uri | undefined> {
  const matches = await vscode.workspace.findFiles("**/README.md", "**/{node_modules,.git}/**", 20);
  return matches.sort((left, right) => left.path.split("/").length - right.path.split("/").length)[0];
}

async function findReadme(): Promise<string | undefined> {
  const uri = await findReadmeUri();
  if (!uri) {
    return undefined;
  }
  const bytes = await vscode.workspace.fs.readFile(uri);
  return Buffer.from(bytes).toString("utf8");
}

export async function openGuide(): Promise<void> {
  const uri = await findReadmeUri();
  if (!uri) {
    vscode.window.showInformationMessage("This workspace has no README.md yet.");
    return;
  }
  await vscode.window.showTextDocument(uri, { preview: false });
  await vscode.commands.executeCommand("markdown.showPreview", uri);
}
