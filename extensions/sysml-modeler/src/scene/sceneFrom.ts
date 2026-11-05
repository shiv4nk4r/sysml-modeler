import { ModelElement, ModelSnapshot } from "../model/types";
import { ResolvedView } from "../view/viewKind";
import { measureNode } from "./measureNode";
import { EdgeKind, NodeKind, Scene, SceneEdge, SceneNode } from "./sceneTypes";

export function sceneFrom(
  snapshot: ModelSnapshot,
  view: ResolvedView,
  kinds: NodeKind[],
  edgeKind?: EdgeKind,
): Scene {
  const allowed = new Set(kinds);
  const chosen = snapshot.elements.filter((element) => view.elementIds.includes(element.id) && allowed.has(element.kind as NodeKind));
  const extras = edgeKind === "connection" ? portsOf(snapshot, chosen) : [];
  const drawn = [...chosen, ...extras];
  const ids = new Set(drawn.map((element) => element.id));
  const nodes = drawn.map((element) => toNode(element, ids));
  const edges = edgeKind
    ? snapshot.relationships
        .filter((relationship) => relationship.kind === edgeKind && ids.has(relationship.sourceId) && ids.has(relationship.targetId))
        .map<SceneEdge>((relationship) => ({
          id: relationship.id,
          kind: relationship.kind,
          sourceId: relationship.sourceId,
          targetId: relationship.targetId,
          label: relationship.label,
        }))
    : [];
  return { id: view.rootId ?? view.title, kind: view.kind, title: view.title, nodes, edges };
}

function portsOf(snapshot: ModelSnapshot, parents: ModelElement[]): ModelElement[] {
  const parentIds = new Set(parents.map((element) => element.id));
  return snapshot.elements.filter((element) => element.kind === "port" && element.parentId && parentIds.has(element.parentId));
}

function toNode(element: ModelElement, ids: Set<string>): SceneNode {
  const size = measureNode(element.kind as NodeKind, element.name);
  return {
    id: element.id,
    elementId: element.id,
    kind: element.kind as NodeKind,
    label: element.name,
    qualifiedName: element.qualifiedName,
    parentId: element.parentId && ids.has(element.parentId) ? element.parentId : undefined,
    width: size.width,
    height: size.height,
  };
}
