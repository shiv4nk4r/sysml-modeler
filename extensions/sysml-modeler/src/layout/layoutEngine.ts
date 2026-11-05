import { Scene, PositionedScene } from "../scene/sceneTypes";

export interface LayoutEngine {
  layout(scene: Scene): Promise<PositionedScene>;
}
