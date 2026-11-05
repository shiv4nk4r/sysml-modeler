import { ModelElement, ModelSnapshot } from "../../model/types";

const uri = "fixture://vehicle.sysml";

function element(id: string, kind: ModelElement["kind"], name: string, qualifiedName: string, parentId?: string): ModelElement {
  return {
    id,
    kind,
    name,
    qualifiedName,
    parentId,
    range: { uri, start: 0, end: 1 },
    nameRange: { uri, start: 0, end: 1 },
  };
}

export function interconnectionFixture(): ModelSnapshot {
  const elements = [
    element("pkg", "package", "Vehicle", "Vehicle"),
    element("tank", "part", "tank", "Vehicle::tank", "pkg"),
    element("fuelOut", "port", "fuelOut", "Vehicle::tank::fuelOut", "tank"),
    element("engine", "part", "engine", "Vehicle::engine", "pkg"),
    element("fuelIn", "port", "fuelIn", "Vehicle::engine::fuelIn", "engine"),
  ];
  return {
    documents: [{ uri, text: "package Vehicle {}" }],
    elements,
    relationships: [
      {
        id: "wire",
        kind: "connection",
        sourceId: "fuelOut",
        targetId: "fuelIn",
        label: "tank.fuelOut to engine.fuelIn",
        range: { uri, start: 0, end: 1 },
        elementId: "wire-element",
      },
    ],
    diagnostics: [],
  };
}
