import { ViewKind } from "../view/viewKind";

export type NodeKind = "package" | "part" | "partDef" | "port" | "action" | "state" | "interface";
export type EdgeKind = "connection" | "succession" | "transition";

export interface SceneNode {
  id: string;
  elementId: string;
  kind: NodeKind;
  label: string;
  qualifiedName: string;
  parentId?: string;
  width: number;
  height: number;
}

export interface SceneEdge {
  id: string;
  kind: EdgeKind;
  sourceId: string;
  targetId: string;
  label?: string;
}

export interface Scene {
  id: string;
  kind: ViewKind;
  title: string;
  nodes: SceneNode[];
  edges: SceneEdge[];
}

export interface Point {
  x: number;
  y: number;
}

export interface PositionedNode extends SceneNode {
  x: number;
  y: number;
}

export interface PositionedEdge extends SceneEdge {
  points: Point[];
}

export interface PositionedScene extends Scene {
  nodes: PositionedNode[];
  edges: PositionedEdge[];
  width: number;
  height: number;
}
