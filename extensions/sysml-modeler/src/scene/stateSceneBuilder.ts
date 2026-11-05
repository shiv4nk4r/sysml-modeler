import { sceneFrom } from "./sceneFrom";
import { SceneBuilder } from "./sceneBuilder";

export class StateSceneBuilder implements SceneBuilder {
  readonly kind = "state" as const;

  build(snapshot: Parameters<SceneBuilder["build"]>[0], view: Parameters<SceneBuilder["build"]>[1]) {
    return sceneFrom(snapshot, view, ["state"], "transition");
  }
}
