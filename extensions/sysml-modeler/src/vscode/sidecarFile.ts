import * as vscode from "vscode";
import { emptySidecar, LayoutSidecar, sidecarPathFor } from "../layout/layoutSidecar";

export function sidecarUriFor(model: vscode.Uri): vscode.Uri {
  return vscode.Uri.file(sidecarPathFor(model.fsPath));
}

export async function readSidecar(model: vscode.Uri): Promise<LayoutSidecar> {
  try {
    const bytes = await vscode.workspace.fs.readFile(sidecarUriFor(model));
    const parsed = JSON.parse(Buffer.from(bytes).toString("utf8")) as LayoutSidecar;
    return parsed?.positions ? parsed : emptySidecar();
  } catch {
    return emptySidecar();
  }
}

export async function writeSidecar(model: vscode.Uri, sidecar: LayoutSidecar): Promise<void> {
  const bytes = Buffer.from(`${JSON.stringify(sidecar, null, 2)}\n`, "utf8");
  await vscode.workspace.fs.writeFile(sidecarUriFor(model), bytes);
}
