import { ViewKind } from "../view/viewKind";
import { ActionFlowSceneBuilder } from "./actionFlowSceneBuilder";
import { GeneralSceneBuilder } from "./generalSceneBuilder";
import { InterconnectionSceneBuilder } from "./interconnectionSceneBuilder";
import { SceneBuilder } from "./sceneBuilder";
import { StateSceneBuilder } from "./stateSceneBuilder";

export class SceneBuilderRegistry {
  constructor(private readonly builders: SceneBuilder[]) {}

  get(kind: ViewKind): SceneBuilder {
    const builder = this.builders.find((candidate) => candidate.kind === kind);
    if (!builder) {
      throw new Error(`No scene builder for ${kind}.`);
    }
    return builder;
  }
}

export function createSceneRegistry(): SceneBuilderRegistry {
  return new SceneBuilderRegistry([
    new InterconnectionSceneBuilder(),
    new GeneralSceneBuilder(),
    new StateSceneBuilder(),
    new ActionFlowSceneBuilder(),
  ]);
}
