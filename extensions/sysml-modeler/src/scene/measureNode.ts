import { NodeKind } from "./sceneTypes";

export function measureNode(kind: NodeKind, label: string): { width: number; height: number } {
  const text = Math.max(120, label.length * 8 + 32);
  switch (kind) {
    case "port":
      return { width: 12, height: 12 };
    case "state":
      return { width: Math.max(140, text), height: 48 };
    case "action":
      return { width: Math.max(140, text), height: 42 };
    case "package":
    case "partDef":
    case "interface":
      return { width: Math.max(180, text), height: 64 };
    default:
      return { width: Math.max(168, text), height: 72 };
  }
}
