import { descendants } from "../model/bindModel";
import { ModelElement, ModelSnapshot } from "../model/types";
import { ResolvedView, ViewCursor, ViewKind } from "./viewKind";

const DRAWING_SKIP = new Set(["view", "viewDef", "connection", "succession", "transition"]);

export class ViewResolver {
  resolve(snapshot: ModelSnapshot, cursor?: ViewCursor, preferKind?: ViewKind): ResolvedView {
    const explicit = cursor ? viewAtCursor(snapshot, cursor) : undefined;
    if (explicit) {
      return fromView(snapshot, explicit);
    }
    const root = cursor ? enclosingPackage(snapshot, cursor) : snapshot.elements.find((element) => element.kind === "package");
    const parts = root
      ? descendants(snapshot.elements, root.id, undefined).filter((element) => element.kind === "part")
      : snapshot.elements.filter((element) => element.kind === "part");
    return {
      kind: preferKind ?? "interconnection",
      title: root?.name ?? "Diagram",
      implicit: true,
      rootId: root?.id,
      elementIds: parts.map((element) => element.id),
    };
  }
}

function fromView(snapshot: ModelSnapshot, view: ModelElement): ResolvedView {
  const exposed = (view.meta?.expose ?? []).flatMap((pattern) => collectExpose(snapshot, pattern, view.meta?.depth));
  const filtered = applyFilter(exposed, view.meta?.filter).filter((element) => !DRAWING_SKIP.has(element.kind));
  return {
    kind: kindOf(view),
    title: view.name,
    implicit: false,
    rootId: view.parentId,
    elementIds: filtered.map((element) => element.id),
    fileName: view.meta?.fileName,
    fileType: view.meta?.fileType,
  };
}

function collectExpose(snapshot: ModelSnapshot, pattern: string, depth: number | undefined): ModelElement[] {
  if (pattern === "*") {
    return snapshot.elements.filter((element) => !element.parentId);
  }
  if (pattern === "**") {
    return snapshot.elements;
  }
  const recursive = pattern.endsWith("::**");
  const direct = pattern.endsWith("::*");
  const head = pattern.replace(/::\*\*$/, "").replace(/::\*$/, "");
  const root = snapshot.elements.find((element) => element.qualifiedName === (recursive || direct ? head : pattern));
  if (!root) {
    return [];
  }
  if (direct) {
    return descendants(snapshot.elements, root.id, 1);
  }
  if (recursive) {
    return descendants(snapshot.elements, root.id, depth);
  }
  return [root];
}

function applyFilter(elements: ModelElement[], filter: string | undefined): ModelElement[] {
  if (!filter) {
    return elements;
  }
  const leaf = filter.split("::").pop() ?? filter;
  const kinds: Record<string, string[]> = {
    PartUsage: ["part"],
    PartDefinition: ["partDef"],
    PortUsage: ["port"],
    StateUsage: ["state"],
    ActionUsage: ["action"],
  };
  const allowed = kinds[leaf];
  return allowed ? elements.filter((element) => allowed.includes(element.kind)) : elements;
}

function kindOf(view: ModelElement): ViewKind {
  const blob = `${view.meta?.viewType ?? ""} ${view.meta?.render ?? ""}`.toLowerCase();
  if (blob.includes("state")) {
    return "state";
  }
  if (blob.includes("action")) {
    return "actionFlow";
  }
  if (blob.includes("general") || blob.includes("tree")) {
    return "general";
  }
  return "interconnection";
}

function viewAtCursor(snapshot: ModelSnapshot, cursor: ViewCursor): ModelElement | undefined {
  const views = snapshot.elements.filter(
    (element) =>
      element.kind === "view" &&
      element.range.uri === cursor.uri &&
      element.range.start <= cursor.offset &&
      cursor.offset <= element.range.end,
  );
  views.sort((left, right) => left.range.end - left.range.start - (right.range.end - right.range.start));
  return views[0];
}

function enclosingPackage(snapshot: ModelSnapshot, cursor: ViewCursor): ModelElement | undefined {
  const containing = snapshot.elements.filter(
    (element) =>
      element.range.uri === cursor.uri && element.range.start <= cursor.offset && cursor.offset <= element.range.end,
  );
  containing.sort((left, right) => right.range.end - right.range.start - (left.range.end - left.range.start));
  for (const element of containing) {
    let current: ModelElement | undefined = element;
    while (current) {
      if (current.kind === "package") {
        return current;
      }
      current = snapshot.elements.find((candidate) => candidate.id === current?.parentId);
    }
  }
  return snapshot.elements.find((element) => element.kind === "package" && element.range.uri === cursor.uri);
}
