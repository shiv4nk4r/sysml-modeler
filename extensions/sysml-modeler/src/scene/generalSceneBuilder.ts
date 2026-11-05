import { sceneFrom } from "./sceneFrom";
import { SceneBuilder } from "./sceneBuilder";

export class GeneralSceneBuilder implements SceneBuilder {
  readonly kind = "general" as const;

  build(snapshot: Parameters<SceneBuilder["build"]>[0], view: Parameters<SceneBuilder["build"]>[1]) {
    return sceneFrom(snapshot, view, ["package", "part", "partDef", "interface"]);
  }
}
