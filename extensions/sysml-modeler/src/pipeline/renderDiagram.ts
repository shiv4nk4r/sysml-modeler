import { LayoutEngine } from "../layout/layoutEngine";
import { SceneBuilderRegistry } from "../scene/sceneBuilderRegistry";
import { PositionedScene } from "../scene/sceneTypes";
import { SvgRenderer } from "../render/svgRenderer";
import { ModelSnapshot } from "../model/types";
import { ResolvedView, ViewCursor, ViewKind } from "../view/viewKind";
import { ViewResolver } from "../view/viewResolver";

export interface RenderRequest {
  snapshot: ModelSnapshot;
  cursor?: ViewCursor;
  preferKind?: ViewKind;
  resolver: ViewResolver;
  builders: SceneBuilderRegistry;
  layout: LayoutEngine;
  renderer: SvgRenderer;
}

export interface RenderResult {
  view: ResolvedView;
  scene: PositionedScene;
  svg: string;
}

export async function renderDiagram(request: RenderRequest): Promise<RenderResult> {
  const view = request.resolver.resolve(request.snapshot, request.cursor, request.preferKind);
  const scene = request.builders.get(view.kind).build(request.snapshot, view);
  const positioned = await request.layout.layout(scene);
  return { view, scene: positioned, svg: request.renderer.render(positioned) };
}
