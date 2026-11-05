import { escapeXml } from "../escapeXml";
import { SymbolPainter } from "../symbolPainter";

export class PackagePainter implements SymbolPainter {
  readonly kind = "package" as const;

  paint(node: Parameters<SymbolPainter["paint"]>[0], tokens: Parameters<SymbolPainter["paint"]>[1]): string {
    return `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" fill="${tokens.nodeFill}" stroke="${tokens.muted}" stroke-dasharray="4 3"/>
      <text x="${node.x + 14}" y="${node.y + 28}" fill="${tokens.label}" font-family="${tokens.font}" font-size="14">${escapeXml(node.label)}</text>`;
  }
}
