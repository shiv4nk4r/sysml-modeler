import * as vscode from "vscode";
import { isModelPath, isReadmePath } from "../files/filePolicy";
import { WorkspaceModelIndex } from "../model/workspaceModelIndex";
import { ModelSnapshot } from "../model/types";

export async function loadWorkspaceSnapshot(index: WorkspaceModelIndex): Promise<ModelSnapshot> {
  const files = await vscode.workspace.findFiles("**/*.{sysml,kerml}");
  const documents: { uri: string; text: string }[] = [];
  for (const uri of files) {
    const document = await vscode.workspace.openTextDocument(uri);
    documents.push({ uri: uri.toString(), text: document.getText() });
  }
  const active = vscode.window.activeTextEditor?.document;
  if (active && (isModelPath(active.uri.path) || isModelPath(active.fileName)) && !documents.some((document) => document.uri === active.uri.toString())) {
    documents.push({ uri: active.uri.toString(), text: active.getText() });
  }
  return index.fromDocuments(documents);
}

export function activeCursor(): { uri: string; offset: number } | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor || !isModelPath(editor.document.uri.path)) {
    return undefined;
  }
  return { uri: editor.document.uri.toString(), offset: editor.document.offsetAt(editor.selection.active) };
}

export function activeIsReadme(): boolean {
  const editor = vscode.window.activeTextEditor;
  return !!editor && isReadmePath(editor.document.uri.path);
}
