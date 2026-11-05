import ELK from "elkjs/lib/elk.bundled.js";
import { Scene, SceneNode } from "../scene/sceneTypes";
import { boundsOf, straightPoints } from "./geometry";
import { LayoutEngine } from "./layoutEngine";
import { PositionedEdge, PositionedNode, PositionedScene } from "../scene/sceneTypes";

interface ElkLike {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  children?: ElkLike[];
  ports?: { id: string; x?: number; y?: number; width?: number; height?: number }[];
  edges?: {
    id: string;
    sources: string[];
    targets: string[];
    sections?: { startPoint: { x: number; y: number }; endPoint: { x: number; y: number }; bendPoints?: { x: number; y: number }[] }[];
  }[];
  layoutOptions?: Record<string, string>;
}

export class ElkLayoutEngine implements LayoutEngine {
  private readonly elk = new ELK();

  async layout(scene: Scene): Promise<PositionedScene> {
    if (scene.nodes.length === 0) {
      return { ...scene, nodes: [], edges: [], width: 640, height: 240 };
    }
    const graph = toGraph(scene);
    const laidOut = (await this.elk.layout(graph)) as ElkLike;
    const positions = new Map<string, { x: number; y: number; width: number; height: number }>();
    const edgePoints = new Map<string, { x: number; y: number }[]>();
    walk(laidOut, laidOut.x ?? 0, laidOut.y ?? 0, positions, edgePoints, true);
    const nodes: PositionedNode[] = scene.nodes.map((node) => {
      const place = positions.get(node.id) ?? { x: 24, y: 24, width: node.width, height: node.height };
      return { ...node, x: place.x, y: place.y, width: place.width || node.width, height: place.height || node.height };
    });
    const edges: PositionedEdge[] = scene.edges.map((edge) => ({
      ...edge,
      points: edgePoints.get(edge.id) ?? straightPoints(nodes, edge),
    }));
    const bounds = boundsOf(nodes, edges);
    return { ...scene, nodes, edges, width: bounds.width, height: bounds.height };
  }
}

function toGraph(scene: Scene): ElkLike {
  const direction = scene.kind === "interconnection" ? "RIGHT" : "DOWN";
  const top = scene.nodes.filter((node) => !node.parentId);
  return {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction,
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.spacing.nodeNode": "48",
      "elk.layered.spacing.nodeNodeBetweenLayers": "64",
      "elk.padding": "[top=16,left=16,bottom=16,right=16]",
    },
    children: top.map((node) => toNode(node, scene.nodes)),
    edges: scene.edges.map((edge) => ({ id: edge.id, sources: [edge.sourceId], targets: [edge.targetId] })),
  };
}

function toNode(node: SceneNode, all: SceneNode[]): ElkLike {
  const children = all.filter((candidate) => candidate.parentId === node.id && candidate.kind !== "port");
  const ports = all.filter((candidate) => candidate.parentId === node.id && candidate.kind === "port");
  const compound = children.length > 0;
  return {
    id: node.id,
    width: node.width,
    height: node.height,
    layoutOptions: compound
      ? {
          "elk.algorithm": "layered",
          "elk.direction": "DOWN",
          "elk.padding": "[top=36,left=16,bottom=16,right=16]",
          "elk.spacing.nodeNode": "24",
        }
      : { "elk.portConstraints": "FREE" },
    children: children.map((child) => toNode(child, all)),
    ports: ports.map((port) => ({ id: port.id, width: port.width, height: port.height })),
  };
}

function walk(
  node: ElkLike,
  absoluteX: number,
  absoluteY: number,
  positions: Map<string, { x: number; y: number; width: number; height: number }>,
  edges: Map<string, { x: number; y: number }[]>,
  isRoot: boolean,
): void {
  if (!isRoot) {
    positions.set(node.id, {
      x: absoluteX,
      y: absoluteY,
      width: node.width ?? 0,
      height: node.height ?? 0,
    });
  }
  for (const port of node.ports ?? []) {
    positions.set(port.id, {
      x: absoluteX + (port.x ?? 0),
      y: absoluteY + (port.y ?? 0),
      width: port.width ?? 12,
      height: port.height ?? 12,
    });
  }
  for (const edge of node.edges ?? []) {
    const section = edge.sections?.[0];
    if (!section) {
      continue;
    }
    const points = [section.startPoint, ...(section.bendPoints ?? []), section.endPoint].map((point) => ({
      x: absoluteX + point.x,
      y: absoluteY + point.y,
    }));
    edges.set(edge.id, points);
  }
  for (const child of node.children ?? []) {
    walk(child, absoluteX + (child.x ?? 0), absoluteY + (child.y ?? 0), positions, edges, false);
  }
}
