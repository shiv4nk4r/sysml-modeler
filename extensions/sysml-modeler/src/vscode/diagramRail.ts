import * as vscode from "vscode";
import { DiagramController } from "./diagramController";

export class DiagramRailProvider implements vscode.WebviewViewProvider {
  constructor(private readonly diagrams: DiagramController) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.html = `<!DOCTYPE html><html><body style="background:#1c2128;color:#d7dde6;font-family:system-ui,sans-serif;padding:16px;line-height:1.5">
      <p>The diagram opens beside the SysML text.</p>
      <p style="color:#8b97a8">Use the toolbar there to change the view, export, or turn on the experimental canvas.</p>
    </body></html>`;
    void this.diagrams.show();
  }
}
