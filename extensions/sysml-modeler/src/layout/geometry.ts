import { Point, PositionedEdge, PositionedNode, PositionedScene, SceneEdge } from "../scene/sceneTypes";

export function nodeCenter(node: PositionedNode): Point {
  return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
}

export function straightPoints(nodes: PositionedNode[], edge: SceneEdge): Point[] {
  const source = nodes.find((node) => node.id === edge.sourceId);
  const target = nodes.find((node) => node.id === edge.targetId);
  if (!source || !target) {
    return [];
  }
  return [nodeCenter(source), nodeCenter(target)];
}

export function boundsOf(nodes: PositionedNode[], edges: PositionedEdge[]): { width: number; height: number } {
  let width = 320;
  let height = 180;
  for (const node of nodes) {
    width = Math.max(width, node.x + node.width + 32);
    height = Math.max(height, node.y + node.height + 32);
  }
  for (const edge of edges) {
    for (const point of edge.points) {
      width = Math.max(width, point.x + 32);
      height = Math.max(height, point.y + 32);
    }
  }
  return { width, height };
}
