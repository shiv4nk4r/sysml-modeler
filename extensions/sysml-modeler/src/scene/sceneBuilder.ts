import { ModelSnapshot } from "../model/types";
import { ResolvedView, ViewKind } from "../view/viewKind";
import { Scene } from "./sceneTypes";

export interface SceneBuilder {
  readonly kind: ViewKind;
  build(snapshot: ModelSnapshot, view: ResolvedView): Scene;
}
