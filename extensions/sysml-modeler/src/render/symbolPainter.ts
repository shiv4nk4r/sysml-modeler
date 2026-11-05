import { PositionedNode } from "../scene/sceneTypes";
import { ThemeTokens } from "../theme/tokens";

export interface SymbolPainter {
  readonly kind: PositionedNode["kind"];
  paint(node: PositionedNode, tokens: ThemeTokens): string;
}
