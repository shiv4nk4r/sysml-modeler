import { Scene } from "../scene/sceneTypes";
import { boundsOf, straightPoints } from "./geometry";
import { LayoutEngine } from "./layoutEngine";
import { LayoutSidecar } from "./layoutSidecar";
import { PositionedScene } from "../scene/sceneTypes";

export class SidecarLayoutEngine implements LayoutEngine {
  constructor(
    private readonly auto: LayoutEngine,
    private readonly sidecar: LayoutSidecar,
  ) {}

  async layout(scene: Scene): Promise<PositionedScene> {
    const positioned = await this.auto.layout(scene);
    let moved = false;
    const nodes = positioned.nodes.map((node) => {
      const next = this.sidecar.positions[node.qualifiedName];
      if (!next) {
        return node;
      }
      moved = true;
      return { ...node, x: next.x, y: next.y };
    });
    if (!moved) {
      return positioned;
    }
    const edges = positioned.edges.map((edge) => ({ ...edge, points: straightPoints(nodes, edge) }));
    const bounds = boundsOf(nodes, edges);
    return { ...positioned, nodes, edges, width: bounds.width, height: bounds.height };
  }
}
