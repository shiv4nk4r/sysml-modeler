import { sceneFrom } from "./sceneFrom";
import { SceneBuilder } from "./sceneBuilder";

export class InterconnectionSceneBuilder implements SceneBuilder {
  readonly kind = "interconnection" as const;

  build(snapshot: Parameters<SceneBuilder["build"]>[0], view: Parameters<SceneBuilder["build"]>[1]) {
    return sceneFrom(snapshot, view, ["part"], "connection");
  }
}
