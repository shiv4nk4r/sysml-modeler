import { escapeXml } from "../escapeXml";
import { SymbolPainter } from "../symbolPainter";

export class StatePainter implements SymbolPainter {
  readonly kind = "state" as const;

  paint(node: Parameters<SymbolPainter["paint"]>[0], tokens: Parameters<SymbolPainter["paint"]>[1]): string {
    return `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="18" fill="${tokens.nodeFill}" stroke="${tokens.nodeStroke}"/>
      <text x="${node.x + 16}" y="${node.y + 30}" fill="${tokens.label}" font-family="${tokens.font}" font-size="14">${escapeXml(node.label)}</text>`;
  }
}
