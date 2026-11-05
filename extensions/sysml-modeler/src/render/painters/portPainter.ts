import { SymbolPainter } from "../symbolPainter";

export class PortPainter implements SymbolPainter {
  readonly kind = "port" as const;

  paint(node: Parameters<SymbolPainter["paint"]>[0], tokens: Parameters<SymbolPainter["paint"]>[1]): string {
    return `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" fill="${tokens.accent}" stroke="${tokens.accent}"/>`;
  }
}
