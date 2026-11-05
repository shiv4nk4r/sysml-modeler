import { childrenOf, findElement } from "../model/query";
import { ModelElement, ModelSnapshot, Relationship } from "../model/types";

export function bindModel(snapshot: ModelSnapshot): ModelSnapshot {
  const elements = snapshot.elements.map((element) => ({ ...element, meta: element.meta ? { ...element.meta } : undefined }));
  inheritPorts(elements);
  const relationships: Relationship[] = [];
  const diagnostics = [...snapshot.diagnostics];

  for (const element of elements) {
    if (element.kind !== "connection" && element.kind !== "succession" && element.kind !== "transition") {
      continue;
    }
    const ownerId = element.parentId;
    if (!ownerId || !element.meta?.from || !element.meta.to) {
      continue;
    }
    const sourceId = resolvePath(elements, ownerId, element.meta.from);
    const targetId = resolvePath(elements, ownerId, element.meta.to);
    if (!sourceId || !targetId) {
      diagnostics.push({
        uri: element.range.uri,
        start: element.range.start,
        end: element.range.end,
        message: `Could not resolve '${element.meta.from}' to '${element.meta.to}'.`,
        severity: "warning",
      });
      continue;
    }
    relationships.push({
      id: `${element.id}:rel`,
      kind: element.kind === "connection" ? "connection" : element.kind === "succession" ? "succession" : "transition",
      sourceId,
      targetId,
      label: element.name,
      range: element.range,
      elementId: element.id,
    });
  }

  return { ...snapshot, elements, relationships, diagnostics };
}

function inheritPorts(elements: ModelElement[]): void {
  const usages = elements.filter((element) => element.kind === "part" && element.meta?.typeName);
  for (const usage of usages) {
    const hasOwnPort = elements.some((element) => element.parentId === usage.id && element.kind === "port");
    if (hasOwnPort) {
      continue;
    }
    const definition = findDefinition(elements, usage);
    if (!definition) {
      continue;
    }
    for (const port of elements.filter((element) => element.parentId === definition.id && element.kind === "port")) {
      elements.push({
        id: `${usage.id}::${port.name}`,
        kind: "port",
        name: port.name,
        qualifiedName: `${usage.qualifiedName}::${port.name}`,
        parentId: usage.id,
        range: port.range,
        nameRange: port.nameRange,
        meta: { inherited: true },
      });
    }
  }
}

function findDefinition(elements: ModelElement[], usage: ModelElement): ModelElement | undefined {
  const typeName = usage.meta?.typeName;
  if (!typeName) {
    return undefined;
  }
  const matches = elements.filter(
    (element) =>
      (element.kind === "partDef" || element.kind === "interface") &&
      (element.name === typeName || element.qualifiedName === typeName || element.qualifiedName.endsWith(`::${typeName}`)),
  );
  return matches.find((element) => element.parentId === usage.parentId) ?? matches[0];
}

function resolvePath(elements: ModelElement[], ownerId: string, path: string): string | undefined {
  const segments = path.split(".");
  let current = ownerId;
  for (const segment of segments) {
    const next = elements.find((element) => element.parentId === current && element.name === segment);
    if (!next) {
      const owner = findElement({ elements, relationships: [], diagnostics: [], documents: [] }, ownerId);
      if (owner && owner.name === segment && segments.length === 1) {
        return owner.id;
      }
      return undefined;
    }
    current = next.id;
  }
  return current;
}

export function descendants(elements: ModelElement[], rootId: string, depth: number | undefined): ModelElement[] {
  const found: ModelElement[] = [];
  const walk = (parentId: string, level: number) => {
    if (depth !== undefined && level > depth) {
      return;
    }
    for (const child of childrenOf({ elements, relationships: [], diagnostics: [], documents: [] }, parentId)) {
      found.push(child);
      walk(child.id, level + 1);
    }
  };
  walk(rootId, 1);
  return found;
}
