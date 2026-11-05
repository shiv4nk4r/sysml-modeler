import * as vscode from "vscode";
import { isSupportedPath, UNSUPPORTED_NOTICE } from "../files/filePolicy";

const SCHEME = "sysml-guard";

export function registerFileGuard(context: vscode.ExtensionContext): void {
  const provider = vscode.workspace.registerTextDocumentContentProvider(SCHEME, {
    provideTextDocumentContent: () => `${UNSUPPORTED_NOTICE}\n`,
  });
  const listener = vscode.workspace.onDidOpenTextDocument((document) => {
    void guard(document);
  });
  context.subscriptions.push(provider, listener);
}

async function guard(document: vscode.TextDocument): Promise<void> {
  if (!vscode.workspace.getConfiguration("sysml").get<boolean>("productMode")) {
    return;
  }
  if (document.uri.scheme !== "file" || isSupportedPath(document.uri.path)) {
    return;
  }
  const notice = vscode.Uri.parse(`${SCHEME}:/notice`);
  await vscode.window.showTextDocument(notice, { preview: false });
  const editors = vscode.window.visibleTextEditors.filter((editor) => editor.document.uri.toString() === document.uri.toString());
  for (const editor of editors) {
    await vscode.window.showTextDocument(editor.document, editor.viewColumn);
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  }
}
