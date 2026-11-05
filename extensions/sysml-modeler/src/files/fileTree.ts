export interface FileNode {
  name: string;
  path: string;
  kind: "file" | "directory";
  children: FileNode[];
}

export function buildFileTree(paths: string[]): FileNode[] {
  const root: FileNode = { name: "", path: "", kind: "directory", children: [] };
  const sorted = [...paths].filter((path) => path.length > 0).sort((left, right) => left.localeCompare(right));
  for (const filePath of sorted) {
    const parts = filePath.split("/").filter((part) => part.length > 0);
    let parent = root;
    let walked = "";
    parts.forEach((part, index) => {
      walked = walked ? `${walked}/${part}` : part;
      const kind = index === parts.length - 1 ? "file" : "directory";
      let child = parent.children.find((candidate) => candidate.name === part && candidate.kind === kind);
      if (!child) {
        child = { name: part, path: walked, kind, children: [] };
        parent.children.push(child);
      }
      parent = child;
    });
  }
  sortTree(root);
  return root.children;
}

function sortTree(node: FileNode): void {
  node.children.sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === "directory" ? -1 : 1;
    }
    return left.name.localeCompare(right.name);
  });
  node.children.forEach(sortTree);
}
