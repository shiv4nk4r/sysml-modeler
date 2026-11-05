import { addConnection } from "./addConnection";
import { addPart } from "./addPart";
import { addPort } from "./addPort";
import { addState } from "./addState";
import { addTransition } from "./addTransition";
import { renameElement } from "./renameElement";

export const modelEdits = {
  renameElement,
  addPart,
  addPort,
  addConnection,
  addState,
  addTransition,
};
