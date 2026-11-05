import { PositionedEdge } from "../scene/sceneTypes";
import { ThemeTokens } from "../theme/tokens";

export interface EdgePainter {
  readonly kind: PositionedEdge["kind"];
  paint(edge: PositionedEdge, tokens: ThemeTokens): string;
}
