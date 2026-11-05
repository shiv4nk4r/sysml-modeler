import { escapeXml } from "../escapeXml";
import { EdgePainter } from "../edgePainter";

export class ConnectionEdgePainter implements EdgePainter {
  readonly kind = "connection" as const;

  paint(edge: Parameters<EdgePainter["paint"]>[0], tokens: Parameters<EdgePainter["paint"]>[1]): string {
    return drawEdge(edge.points, tokens.edge, edge.label);
  }
}

export class SuccessionEdgePainter implements EdgePainter {
  readonly kind = "succession" as const;

  paint(edge: Parameters<EdgePainter["paint"]>[0], tokens: Parameters<EdgePainter["paint"]>[1]): string {
    return drawEdge(edge.points, tokens.edge, edge.label);
  }
}

export class TransitionEdgePainter implements EdgePainter {
  readonly kind = "transition" as const;

  paint(edge: Parameters<EdgePainter["paint"]>[0], tokens: Parameters<EdgePainter["paint"]>[1]): string {
    return drawEdge(edge.points, tokens.accent, edge.label);
  }
}

function drawEdge(points: { x: number; y: number }[], stroke: string, label?: string): string {
  if (points.length === 0) {
    return "";
  }
  const rendered = points.map((point) => `${point.x},${point.y}`).join(" ");
  const mid = points[Math.floor(points.length / 2)];
  const text = label
    ? `<text x="${mid.x + 6}" y="${mid.y - 6}" fill="${stroke}" font-family="system-ui, sans-serif" font-size="11">${escapeXml(label)}</text>`
    : "";
  return `<polyline points="${rendered}" fill="none" stroke="${stroke}" stroke-width="1.4"/>${text}`;
}
