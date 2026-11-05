import { sceneFrom } from "./sceneFrom";
import { SceneBuilder } from "./sceneBuilder";

export class ActionFlowSceneBuilder implements SceneBuilder {
  readonly kind = "actionFlow" as const;

  build(snapshot: Parameters<SceneBuilder["build"]>[0], view: Parameters<SceneBuilder["build"]>[1]) {
    return sceneFrom(snapshot, view, ["action"], "succession");
  }
}
