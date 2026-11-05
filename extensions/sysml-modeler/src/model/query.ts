import { ElementKind, ModelElement, ModelSnapshot } from "./types";

export function findElement(snapshot: ModelSnapshot, id: string): ModelElement | undefined {
  return snapshot.elements.find((element) => element.id === id);
}

export function childrenOf(snapshot: ModelSnapshot, parentId: string | undefined): ModelElement[] {
  return snapshot.elements.filter((element) => element.parentId === parentId);
}

export function parentOf(snapshot: ModelSnapshot, element: ModelElement): ModelElement | undefined {
  return element.parentId ? findElement(snapshot, element.parentId) : undefined;
}

export function ancestors(snapshot: ModelSnapshot, element: ModelElement): ModelElement[] {
  const chain: ModelElement[] = [];
  let current: ModelElement | undefined = element;
  while (current) {
    chain.push(current);
    current = parentOf(snapshot, current);
  }
  return chain;
}

const MEMBER_OWNERS = new Set<ElementKind>(["package", "part", "partDef", "interface", "state", "action"]);

export function memberOwner(snapshot: ModelSnapshot, elementId: string | undefined): ModelElement | undefined {
  let current = elementId ? findElement(snapshot, elementId) : undefined;
  while (current && !MEMBER_OWNERS.has(current.kind)) {
    current = parentOf(snapshot, current);
  }
  return current;
}

export function packageOwner(snapshot: ModelSnapshot, elementId: string | undefined): ModelElement | undefined {
  let current = elementId ? findElement(snapshot, elementId) : undefined;
  while (current && current.kind !== "package") {
    current = parentOf(snapshot, current);
  }
  return current ?? snapshot.elements.find((element) => element.kind === "package");
}

export function documentText(snapshot: ModelSnapshot, uri: string): string | undefined {
  return snapshot.documents.find((document) => document.uri === uri)?.text;
}
