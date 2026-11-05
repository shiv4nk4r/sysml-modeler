# SysML v1 import boundary

SysML Diagram Modeler draws from a `ModelSnapshot`. The SysML v2 parser is the only producer in this version. A later SysML v1 importer must produce the same snapshot, or emit SysML v2 text that the parser already understands. The diagram pipeline does not learn a second model.

## Snapshot

`ModelSnapshot` lives in `extensions/sysml-modeler/src/model/types.ts`.

- `documents` keep the source text and URI. Edits and click-to-source use those offsets.
- `elements` are packages, part definitions, parts, ports, actions, states, views, and the link statements (`connection`, `succession`, `transition`).
- `relationships` are resolved links. A connection stores the port element ids at each end.
- `diagnostics` are parse and resolution messages. They are not a reason to invent elements.

Each element carries `qualifiedName`, `parentId`, `range`, and `nameRange`. Inherited ports copy the definition's range so a click opens the definition. They set `meta.inherited` so a rename is refused on the copy.

`ModelSource.parseDocuments` is the only way to build a snapshot. `ParsingModelSource` is the v2 implementation. A v1 importer implements the same interface, or it writes `.sysml` text and lets `ParsingModelSource` run.

## v1 mapping

The first importer should cover blocks, ports, connectors, and state machines saved as XMI. Everything else stays a diagnostic on the imported file and does not enter the snapshot.

| SysML v1 | Snapshot |
| --- | --- |
| Block, or a part property typed by a block | `partDef` for the block, `part` for the property |
| Flow port or proxy port on a block | `port` owned by that part or definition |
| Connector between two ports | `connection` element plus a `connection` relationship |
| State and transition | `state` and `transition` |
| Diagram layout | not imported into the text; optional `.sysmlview.json` positions |

Names become SysML v2 identifiers. Qualified names use `::`. A connector end that names `tank.fuelOut` becomes the text `connect tank.fuelOut to engine.fuelIn;` inside the owning package. The existing `bindModel` step resolves those paths, including ports inherited from a part definition.

Views are not in v1 XMI. After import, the generated text can add one interconnection view and one state view when those elements exist:

```sysml
view wiring : InterconnectionView {
  expose Package::*;
  render asInterconnectionDiagram;
}
```

No EMF runtime is part of this product. The importer, when it exists, reads XMI as XML and writes the snapshot or the text above.
