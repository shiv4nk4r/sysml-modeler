import * as vscode from "vscode";
import { positionAt } from "../model/textPosition";
import { TextChange } from "../model/types";

export async function applyTextEdit(change: TextChange): Promise<boolean> {
  const uri = vscode.Uri.parse(change.uri);
  const document = await vscode.workspace.openTextDocument(uri);
  const start = positionAt(document.getText(), change.start);
  const end = positionAt(document.getText(), change.end);
  const edit = new vscode.WorkspaceEdit();
  edit.replace(uri, new vscode.Range(start.line, start.character, end.line, end.character), change.text);
  return vscode.workspace.applyEdit(edit);
}
