import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { addConnection } from "../edit/addConnection";
import { addPart } from "../edit/addPart";
import { renameElement } from "../edit/renameElement";
import { applyTextChange } from "../model/textPosition";
import { EditResult } from "../model/types";
import { ParsingModelSource } from "../parse/parsingModelSource";
import { ViewResolver } from "../view/viewResolver";

const source = new ParsingModelSource();
const resolver = new ViewResolver();

function readExample(...parts: string[]): string {
  return fs.readFileSync(path.resolve(__dirname, "../../../../examples", ...parts), "utf8");
}

test("parses the vehicle model, inherited ports, and both views", () => {
  const uri = "file:///vehicle.sysml";
  const text = readExample("vehicle", "vehicle.sysml");
  const snapshot = source.parseDocuments([{ uri, text }]);
  const names = snapshot.elements.map((element) => element.qualifiedName);
  assert.ok(names.includes("Vehicle::engine::fuelIn"));
  assert.ok(names.includes("Vehicle::tank::fuelOut"));
  assert.ok(names.includes("Vehicle::engine::piston"));
  const wire = snapshot.relationships.find((relationship) => relationship.kind === "connection");
  assert.ok(wire);
  assert.equal(snapshot.elements.find((element) => element.id === wire?.sourceId)?.name, "fuelOut");
  assert.equal(snapshot.elements.find((element) => element.id === wire?.targetId)?.name, "fuelIn");

  const wiring = resolver.resolve(snapshot, { uri, offset: text.indexOf("view wiring") });
  assert.equal(wiring.kind, "interconnection");
  assert.equal(wiring.fileName, "wiring");
  assert.equal(wiring.implicit, false);
  assert.ok(!wiring.elementIds.some((id) => snapshot.elements.find((element) => element.id === id)?.name === "piston"));

  const structure = resolver.resolve(snapshot, { uri, offset: text.indexOf("view structure") });
  assert.equal(structure.kind, "general");
  assert.ok(structure.elementIds.some((id) => snapshot.elements.find((element) => element.id === id)?.name === "piston"));
});

test("resolves state and action views", () => {
  const modes = readExample("modes", "modes.sysml");
  const modeSnapshot = source.parseDocuments([{ uri: "file:///modes.sysml", text: modes }]);
  const state = resolver.resolve(modeSnapshot, { uri: "file:///modes.sysml", offset: modes.indexOf("view modes") });
  assert.equal(state.kind, "state");
  assert.equal(modeSnapshot.relationships.filter((relationship) => relationship.kind === "transition").length, 1);

  const startup = readExample("startup", "startup.sysml");
  const actionSnapshot = source.parseDocuments([{ uri: "file:///startup.sysml", text: startup }]);
  const flow = resolver.resolve(actionSnapshot, { uri: "file:///startup.sysml", offset: startup.indexOf("view flow") });
  assert.equal(flow.kind, "actionFlow");
  assert.equal(actionSnapshot.relationships.filter((relationship) => relationship.kind === "succession").length, 1);
});

test("reports an unsupported construct without dropping the following package", () => {
  const text = "requirement def Safety {}\npackage Vehicle {\n  part tank;\n}\n";
  const snapshot = source.parseDocuments([{ uri: "file:///notes.sysml", text }]);
  assert.ok(snapshot.diagnostics.some((diagnostic) => diagnostic.message.includes("Unsupported construct 'requirement'")));
  assert.ok(snapshot.elements.some((element) => element.qualifiedName === "Vehicle::tank"));
});

test("round-trips rename, add part, and add connection through the text", () => {
  const uri = "file:///edit.sysml";
  let text = "package Vehicle {\n  part tank {\n    port fuelOut;\n  }\n  part engine {\n    port fuelIn;\n  }\n}\n";
  let snapshot = source.parseDocuments([{ uri, text }]);
  const tank = snapshot.elements.find((element) => element.name === "tank");
  assert.ok(tank);
  const renamed = requireOk(renameElement(snapshot, tank.id, "cell"));
  text = applyTextChange(text, renamed.start, renamed.end, renamed.text);
  snapshot = source.parseDocuments([{ uri, text }]);
  assert.ok(snapshot.elements.some((element) => element.name === "cell"));

  const pkg = snapshot.elements.find((element) => element.kind === "package");
  assert.ok(pkg);
  const added = addPart(snapshot, pkg.id, "wheel");
  assert.equal(added.ok, true);
  if (!added.ok) {
    return;
  }
  text = applyTextChange(text, added.change.start, added.change.end, added.change.text);
  snapshot = source.parseDocuments([{ uri, text }]);
  const fuelOut = snapshot.elements.find((element) => element.name === "fuelOut");
  const fuelIn = snapshot.elements.find((element) => element.name === "fuelIn");
  assert.ok(fuelOut && fuelIn);
  const connected = addConnection(snapshot, pkg.id, fuelOut.id, fuelIn.id);
  assert.equal(connected.ok, true);
  if (!connected.ok) {
    return;
  }
  text = applyTextChange(text, connected.change.start, connected.change.end, connected.change.text);
  snapshot = source.parseDocuments([{ uri, text }]);
  assert.equal(snapshot.relationships.length, 1);
});

function requireOk(result: EditResult): { start: number; end: number; text: string } {
  if (!result.ok) {
    throw new Error(result.message);
  }
  return result.change;
}
