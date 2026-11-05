import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createExporters } from "../export/createExporters";
import { ParsingModelSource } from "../parse/parsingModelSource";
import { ElkLayoutEngine } from "../layout/elkLayoutEngine";
import { moveNode, sidecarPathFor } from "../layout/layoutSidecar";
import { SidecarLayoutEngine } from "../layout/sidecarLayoutEngine";
import { renderDiagram } from "../pipeline/renderDiagram";
import { createSvgRenderer } from "../render/svgRenderer";
import { createSceneRegistry } from "../scene/sceneBuilderRegistry";
import { interconnectionFixture } from "../scene/fixtures/interconnectionFixture";
import { ViewResolver } from "../view/viewResolver";
import { buildFileTree } from "../files/fileTree";
import { isSupportedPath, UNSUPPORTED_NOTICE } from "../files/filePolicy";

test("renders the interconnection fixture through layout and SVG export", async () => {
  const exporters = createExporters();
  const rendered = await renderDiagram({
    snapshot: interconnectionFixture(),
    resolver: new ViewResolver(),
    builders: createSceneRegistry(),
    layout: new ElkLayoutEngine(),
    renderer: createSvgRenderer(),
  });
  assert.equal(rendered.view.kind, "interconnection");
  assert.match(rendered.svg, /engine/);
  assert.match(rendered.svg, /tank/);
  assert.match(rendered.svg, /#3d8bfd/);
  const png = exporters.png.exportBytes(rendered.svg);
  assert.equal(png[0], 137);
  assert.equal(png[1], 80);
  assert.equal(png[2], 78);
  assert.equal(png[3], 71);
  const pdf = exporters.pdf.exportBytes(rendered.svg);
  assert.equal(Buffer.from(pdf.subarray(0, 5)).toString("utf8"), "%PDF-");
  assert.ok(Buffer.from(pdf).toString("utf8").includes("startxref"));
});

test("manual sidecar positions override automatic layout", async () => {
  const auto = new ElkLayoutEngine();
  const sidecar = moveNode({ positions: {} }, "Vehicle::engine", 400, 20);
  const rendered = await renderDiagram({
    snapshot: interconnectionFixture(),
    resolver: new ViewResolver(),
    builders: createSceneRegistry(),
    layout: new SidecarLayoutEngine(auto, sidecar),
    renderer: createSvgRenderer(),
  });
  const engine = rendered.scene.nodes.find((node) => node.qualifiedName === "Vehicle::engine");
  assert.equal(engine?.x, 400);
  assert.equal(engine?.y, 20);
  assert.equal(sidecarPathFor("/models/vehicle.sysml"), "/models/vehicle.sysmlview.json");
});

test("renders state and action-flow views to SVG and PDF", async () => {
  const source = new ParsingModelSource();
  const exporters = createExporters();
  for (const [folder, file, label] of [
    ["modes", "modes.sysml", "off"],
    ["startup", "startup.sysml", "start"],
  ] as const) {
    const text = fs.readFileSync(path.resolve(__dirname, "../../../../examples", folder, file), "utf8");
    const uri = `file:///${file}`;
    const snapshot = source.parseDocuments([{ uri, text }]);
    const rendered = await renderDiagram({
      snapshot,
      cursor: { uri, offset: text.indexOf("view ") },
      resolver: new ViewResolver(),
      builders: createSceneRegistry(),
      layout: new ElkLayoutEngine(),
      renderer: createSvgRenderer(),
    });
    assert.match(rendered.svg, new RegExp(label));
    assert.equal(Buffer.from(exporters.pdf.exportBytes(rendered.svg).subarray(0, 5)).toString("utf8"), "%PDF-");
  }
});

test("lists only SysML and README paths in the model tree", () => {
  assert.equal(isSupportedPath("/work/README.md"), true);
  assert.equal(isSupportedPath("/work/model.kerml"), true);
  assert.equal(isSupportedPath("/work/notes.txt"), false);
  assert.match(UNSUPPORTED_NOTICE, /SysML models and README files/);
  const tree = buildFileTree(["vehicle/vehicle.sysml", "vehicle/README.md", "modes/modes.sysml"]);
  assert.equal(tree.length, 2);
  assert.equal(tree[1].children.length, 2);
});
