import { DiagramExporter, ExportFormat } from "./export/diagramExporter";
import { ElkLayoutEngine } from "./layout/elkLayoutEngine";
import { WorkspaceModelIndex } from "./model/workspaceModelIndex";
import { ParsingModelSource } from "./parse/parsingModelSource";
import { SvgRenderer } from "./render/svgRenderer";
import { SceneBuilderRegistry } from "./scene/sceneBuilderRegistry";
import { ViewResolver } from "./view/viewResolver";

export interface ModelerServices {
  index: WorkspaceModelIndex;
  source: ParsingModelSource;
  resolver: ViewResolver;
  builders: SceneBuilderRegistry;
  layout: ElkLayoutEngine;
  renderer: SvgRenderer;
  exporters: Record<ExportFormat, DiagramExporter>;
}
