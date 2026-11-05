import * as vscode from "vscode";
import { buildFileTree, FileNode } from "../files/fileTree";
import { isSupportedPath } from "../files/filePolicy";

export class ModelTreeProvider implements vscode.TreeDataProvider<FileNode>, vscode.Disposable {
  private readonly change = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.change.event;
  private nodes: FileNode[] = [];
  private readonly watcher = vscode.workspace.createFileSystemWatcher("**/*.{sysml,kerml,md}");

  constructor() {
    this.watcher.onDidCreate(() => void this.reload());
    this.watcher.onDidDelete(() => void this.reload());
    void this.reload();
  }

  dispose(): void {
    this.watcher.dispose();
    this.change.dispose();
  }

  async reload(): Promise<void> {
    const files = await vscode.workspace.findFiles("**/*.{sysml,kerml,md}");
    const relative = files
      .map((uri) => vscode.workspace.asRelativePath(uri))
      .filter((path) => isSupportedPath(path));
    this.nodes = buildFileTree(relative);
    this.change.fire();
  }

  getTreeItem(element: FileNode): vscode.TreeItem {
    const item = new vscode.TreeItem(element.name, element.kind === "directory" ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None);
    if (element.kind === "file") {
      item.command = { command: "sysml.openModelFile", title: "Open", arguments: [element.path] };
      item.resourceUri = vscode.Uri.joinPath(this.folder(), ...element.path.split("/"));
    }
    return item;
  }

  getChildren(element?: FileNode): FileNode[] {
    return element ? element.children : this.nodes;
  }

  private folder(): vscode.Uri {
    return vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file("");
  }
}
