import * as vscode from "vscode";
import { ExportFormat } from "../export/diagramExporter";
import { modelEdits } from "../edit/modelEdits";
import { isModelPath, isReadmePath } from "../files/filePolicy";
import { SidecarLayoutEngine } from "../layout/sidecarLayoutEngine";
import { moveNode } from "../layout/layoutSidecar";
import { findElement } from "../model/query";
import { positionAt } from "../model/textPosition";
import { ModelSnapshot } from "../model/types";
import { renderDiagram } from "../pipeline/renderDiagram";
import { ModelerServices } from "../services";
import { ViewKind } from "../view/viewKind";
import { applyTextEdit } from "./applyTextEdit";
import { diagramDocument } from "./diagramDocument";
import { readSidecar, writeSidecar } from "./sidecarFile";
import { activeCursor, loadWorkspaceSnapshot } from "./workspaceSnapshot";

export class DiagramController implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined;
  private snapshot: ModelSnapshot | undefined;
  private selection: string[] = [];
  private preferKind: ViewKind | undefined;
  private readonly subscriptions: vscode.Disposable[] = [];
  private timer: NodeJS.Timeout | undefined;
  private status: vscode.StatusBarItem;

  constructor(private readonly services: ModelerServices) {
    this.status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.status.show();
    this.subscriptions.push(this.status);
    void this.refresh();
    this.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (isModelPath(event.document.uri.path)) {
          this.schedule();
        }
      }),
      vscode.window.onDidChangeActiveTextEditor(() => this.schedule()),
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("sysml")) {
          this.schedule();
        }
      }),
    );
  }

  async show(): Promise<void> {
    this.ensurePanel();
    await this.refresh();
  }

  dispose(): void {
    this.panel?.dispose();
    this.subscriptions.forEach((item) => item.dispose());
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  private ensurePanel(): vscode.WebviewPanel {
    if (this.panel) {
      return this.panel;
    }
    const panel = vscode.window.createWebviewPanel("sysml.diagram", "Diagram", vscode.ViewColumn.Beside, {
      enableScripts: true,
      retainContextWhenHidden: true,
    });
    const nonce = Math.random().toString(36).slice(2);
    panel.webview.html = diagramDocument(nonce);
    panel.webview.onDidReceiveMessage((message) => this.onMessage(message));
    panel.onDidDispose(() => {
      this.panel = undefined;
    });
    this.panel = panel;
    return panel;
  }

  private schedule(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      void this.refresh();
    }, 180);
  }

  async refresh(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (editor && isReadmePath(editor.document.uri.path)) {
      this.status.text = "README";
      this.panel?.dispose();
      return;
    }
    if (editor && isModelPath(editor.document.uri.path)) {
      this.ensurePanel();
    }
    this.snapshot = await loadWorkspaceSnapshot(this.services.index);
    this.publishDiagnostics();
    if (!this.panel) {
      const issueCount = this.snapshot.diagnostics.length;
      this.status.text = issueCount === 0 ? "SysML" : `SysML · ${issueCount} issues`;
      return;
    }
    const manual = this.layoutMode() === "manual";
    const modelUri = editor && isModelPath(editor.document.uri.path) ? editor.document.uri : undefined;
    const sidecar = modelUri ? await readSidecar(modelUri) : { positions: {} };
    const layout = manual ? new SidecarLayoutEngine(this.services.layout, sidecar) : this.services.layout;
    const rendered = await renderDiagram({
      snapshot: this.snapshot,
      cursor: activeCursor(),
      preferKind: this.preferKind,
      resolver: this.services.resolver,
      builders: this.services.builders,
      layout,
      renderer: this.services.renderer,
    });
    const issues = this.snapshot.diagnostics.length;
    this.status.text = `${rendered.view.title} · ${labelKind(rendered.view.kind)} · ${issues} issues`;
    await this.panel.webview.postMessage({
      type: "render",
      svg: rendered.svg,
      title: rendered.view.title,
      kind: rendered.view.kind,
      implicit: rendered.view.implicit,
      experimental: this.experimental(),
      manual,
    });
    this.lastSvg = rendered.svg;
    this.lastFileName = rendered.view.fileName ?? rendered.view.title;
  }

  private lastSvg = "";
  private lastFileName = "diagram";

  private async onMessage(message: { type: string; [key: string]: unknown }): Promise<void> {
    switch (message.type) {
      case "ready":
        await this.refresh();
        return;
      case "reveal":
        await this.reveal(String(message.id));
        return;
      case "select":
        this.selection = Array.isArray(message.ids) ? message.ids.map(String) : [];
        return;
      case "kind":
        this.preferKind = message.kind as ViewKind;
        await this.refresh();
        return;
      case "export":
        await this.exportDiagram(message.format as ExportFormat);
        return;
      case "rename":
        await this.renameSelection();
        return;
      case "create":
        await this.create(String(message.gesture));
        return;
      case "connect":
        await this.connectSelection();
        return;
      case "transition":
        await this.transitionSelection();
        return;
      case "layout":
        await this.toggleLayout();
        return;
      case "move":
        await this.move(String(message.qualifiedName), Number(message.x), Number(message.y));
        return;
      default:
        return;
    }
  }

  private async reveal(id: string): Promise<void> {
    if (!this.snapshot) {
      return;
    }
    const element = findElement(this.snapshot, id);
    if (!element) {
      return;
    }
    const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(element.range.uri));
    const start = positionAt(document.getText(), element.nameRange.start);
    const end = positionAt(document.getText(), element.nameRange.end);
    const editor = await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.One, preserveFocus: true });
    editor.selection = new vscode.Selection(new vscode.Position(start.line, start.character), new vscode.Position(end.line, end.character));
    editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenter);
  }

  private async exportDiagram(format: ExportFormat): Promise<void> {
    const exporter = this.services.exporters[format];
    if (!exporter || !this.lastSvg) {
      return;
    }
    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(this.lastFileName.replace(/\s+/g, "-") + "." + exporter.fileExtension),
      filters: { Diagram: [exporter.fileExtension] },
    });
    if (!uri) {
      return;
    }
    await vscode.workspace.fs.writeFile(uri, this.services.exporters[format].exportBytes(this.lastSvg));
    vscode.window.showInformationMessage(`Exported ${uri.fsPath}`);
  }

  private async renameSelection(): Promise<void> {
    const id = this.selection[0];
    if (!this.snapshot || !id) {
      vscode.window.showInformationMessage("Select one element to rename.");
      return;
    }
    const element = findElement(this.snapshot, id);
    const next = await vscode.window.showInputBox({ prompt: "Rename element", value: element?.name });
    if (!next) {
      return;
    }
    const result = modelEdits.renameElement(this.snapshot, id, next);
    await this.finishEdit(result);
  }

  private async create(gesture: string): Promise<void> {
    if (!this.snapshot) {
      return;
    }
    const name = await vscode.window.showInputBox({ prompt: `New ${gesture} name` });
    if (!name) {
      return;
    }
    const ownerId = this.selection[0];
    const result =
      gesture === "port"
        ? modelEdits.addPort(this.snapshot, ownerId, name)
        : gesture === "state"
          ? modelEdits.addState(this.snapshot, ownerId, name)
          : modelEdits.addPart(this.snapshot, ownerId, name);
    await this.finishEdit(result);
  }

  private async connectSelection(): Promise<void> {
    if (!this.snapshot || this.selection.length < 2) {
      vscode.window.showInformationMessage("Select two ports, then Connect.");
      return;
    }
    const result = modelEdits.addConnection(this.snapshot, this.selection[0], this.selection[0], this.selection[1]);
    await this.finishEdit(result);
  }

  private async transitionSelection(): Promise<void> {
    if (!this.snapshot || this.selection.length < 2) {
      vscode.window.showInformationMessage("Select two states, then Transition.");
      return;
    }
    const result = modelEdits.addTransition(this.snapshot, this.selection[0], this.selection[0], this.selection[1]);
    await this.finishEdit(result);
  }

  private async finishEdit(result: { ok: true; change: { uri: string; start: number; end: number; text: string } } | { ok: false; message: string }): Promise<void> {
    if (!result.ok) {
      vscode.window.showWarningMessage(result.message);
      return;
    }
    await applyTextEdit(result.change);
    await this.refresh();
  }

  private async toggleLayout(): Promise<void> {
    const next = this.layoutMode() === "manual" ? "auto" : "manual";
    await vscode.workspace.getConfiguration("sysml").update("layoutMode", next, vscode.ConfigurationTarget.Workspace);
    await this.refresh();
  }

  private async move(qualifiedName: string, x: number, y: number): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !this.experimental()) {
      return;
    }
    const sidecar = moveNode(await readSidecar(editor.document.uri), qualifiedName, x, y);
    await writeSidecar(editor.document.uri, sidecar);
    if (this.layoutMode() !== "manual") {
      await vscode.workspace.getConfiguration("sysml").update("layoutMode", "manual", vscode.ConfigurationTarget.Workspace);
    }
    await this.refresh();
  }

  private publishDiagnostics(): void {
    const collection = diagnosticCollection();
    collection.clear();
    if (!this.snapshot) {
      return;
    }
    const byUri = new Map<string, vscode.Diagnostic[]>();
    for (const diagnostic of this.snapshot.diagnostics) {
      const document = this.snapshot.documents.find((item) => item.uri === diagnostic.uri);
      const start = positionAt(document?.text ?? "", diagnostic.start);
      const end = positionAt(document?.text ?? "", diagnostic.end);
      const item = new vscode.Diagnostic(
        new vscode.Range(start.line, start.character, end.line, end.character),
        diagnostic.message,
        diagnostic.severity === "warning" ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Error,
      );
      const list = byUri.get(diagnostic.uri) ?? [];
      list.push(item);
      byUri.set(diagnostic.uri, list);
    }
    for (const [uri, items] of byUri) {
      collection.set(vscode.Uri.parse(uri), items);
    }
  }

  private experimental(): boolean {
    return vscode.workspace.getConfiguration("sysml").get<boolean>("experimental.canvas") === true;
  }

  private layoutMode(): "auto" | "manual" {
    return vscode.workspace.getConfiguration("sysml").get<string>("layoutMode") === "manual" ? "manual" : "auto";
  }
}

const diagnostics = vscode.languages.createDiagnosticCollection("sysml");

function diagnosticCollection(): vscode.DiagnosticCollection {
  return diagnostics;
}

function labelKind(kind: ViewKind): string {
  switch (kind) {
    case "interconnection":
      return "Interconnection";
    case "general":
      return "General";
    case "state":
      return "State";
    case "actionFlow":
      return "Action flow";
  }
}
