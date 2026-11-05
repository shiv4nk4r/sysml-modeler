export const UNSUPPORTED_NOTICE = "SysML Diagram Modeler edits SysML models and README files.";

export function fileNameOf(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const slash = normalized.lastIndexOf("/");
  return slash === -1 ? normalized : normalized.slice(slash + 1);
}

export function isReadmePath(filePath: string): boolean {
  return /^readme(\.md)?$/i.test(fileNameOf(filePath));
}

export function isModelPath(filePath: string): boolean {
  return /\.(sysml|kerml)$/i.test(fileNameOf(filePath));
}

export function isSupportedPath(filePath: string): boolean {
  return isModelPath(filePath) || isReadmePath(filePath);
}
