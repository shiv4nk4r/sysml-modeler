import * as vscode from "vscode";
import { createExporters } from "./export/createExporters";
import { ElkLayoutEngine } from "./layout/elkLayoutEngine";
import { WorkspaceModelIndex } from "./model/workspaceModelIndex";
import { ParsingModelSource } from "./parse/parsingModelSource";
import { createSvgRenderer } from "./render/svgRenderer";
import { createSceneRegistry } from "./scene/sceneBuilderRegistry";
import { ModelerServices } from "./services";
import { ViewResolver } from "./view/viewResolver";
import { DiagramController } from "./vscode/diagramController";
import { DiagramRailProvider } from "./vscode/diagramRail";
import { registerFileGuard } from "./vscode/fileGuard";
import { openGuide, GuideViewProvider } from "./vscode/guideView";
import { registerHome } from "./vscode/homePanel";
import { ModelTreeProvider } from "./vscode/modelTree";
import { registerSymbols } from "./vscode/symbols";

export function activate(context: vscode.ExtensionContext): void {
  const source = new ParsingModelSource();
  const services: ModelerServices = {
    index: new WorkspaceModelIndex(source),
    source,
    resolver: new ViewResolver(),
    builders: createSceneRegistry(),
    layout: new ElkLayoutEngine(),
    renderer: createSvgRenderer(),
    exporters: createExporters(),
  };
  const diagrams = new DiagramController(services);
  const models = new ModelTreeProvider();
  context.subscriptions.push(diagrams, models);
  context.subscriptions.push(vscode.window.registerTreeDataProvider("sysml.modelView", models));
  context.subscriptions.push(
      vscode.window.registerWebviewViewProvider("sysml.guideView", new GuideViewProvider()),
      vscode.window.registerWebviewViewProvider("sysml.diagramView", new DiagramRailProvider(diagrams)),
    );
  context.subscriptions.push(
    vscode.commands.registerCommand("sysml.showDiagram", () => diagrams.show()),
    vscode.commands.registerCommand("sysml.openGuide", () => openGuide()),
    vscode.commands.registerCommand("sysml.openModelFile", async (relativePath: string) => {
      const folder = vscode.workspace.workspaceFolders?.[0]?.uri;
      if (!folder) {
        return;
      }
      const document = await vscode.workspace.openTextDocument(vscode.Uri.joinPath(folder, ...relativePath.split("/")));
      await vscode.window.showTextDocument(document);
      if (document.languageId === "sysml") {
        await diagrams.show();
      }
    }),
    vscode.commands.registerCommand("sysml.toggleCanvas", async () => {
      const config = vscode.workspace.getConfiguration("sysml");
      const next = config.get<boolean>("experimental.canvas") !== true;
      await config.update("experimental.canvas", next, vscode.ConfigurationTarget.Workspace);
      vscode.window.showInformationMessage(next ? "Experimental canvas is on." : "Experimental canvas is off.");
    }),
  );
  registerSymbols(context, source);
  registerFileGuard(context);
  registerHome(context);
  void vscode.commands.executeCommand("setContext", "sysml.ready", true);
}

export function deactivate(): void {}
