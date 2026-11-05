import { PositionedNode, PositionedScene } from "../scene/sceneTypes";
import { themeTokens, ThemeTokens } from "../theme/tokens";
import { ConnectionEdgePainter, SuccessionEdgePainter, TransitionEdgePainter } from "./edges/edgePainters";
import { EdgePainter } from "./edgePainter";
import { escapeXml } from "./escapeXml";
import { ActionPainter } from "./painters/actionPainter";
import { InterfacePainter, PartDefPainter } from "./painters/definitionPainters";
import { PackagePainter } from "./painters/packagePainter";
import { PartPainter } from "./painters/partPainter";
import { PortPainter } from "./painters/portPainter";
import { StatePainter } from "./painters/statePainter";
import { SymbolPainter } from "./symbolPainter";

const ORIGIN_X = 24;
const ORIGIN_Y = 48;

export class SvgRenderer {
  constructor(
    private readonly symbols: SymbolPainter[],
    private readonly edges: EdgePainter[],
    private readonly tokens: ThemeTokens = themeTokens,
  ) {}

  render(scene: PositionedScene): string {
    const nodes = scene.nodes.map((node) => shift(node));
    const width = Math.max(640, scene.width + ORIGIN_X + 24);
    const height = Math.max(240, scene.height + ORIGIN_Y + 24);
    const grid = gridLines(width, height, this.tokens.grid);
    const edgeMarkup = scene.edges
      .map((edge) => {
        const painter = this.edges.find((candidate) => candidate.kind === edge.kind);
        const moved = { ...edge, points: edge.points.map((point) => ({ x: point.x + ORIGIN_X, y: point.y + ORIGIN_Y })) };
        return painter ? painter.paint(moved, this.tokens) : "";
      })
      .join("");
    const nodeMarkup = nodes
      .map((node) => {
        const painter = this.symbols.find((candidate) => candidate.kind === node.kind);
        const body = painter ? painter.paint(node, this.tokens) : "";
        return `<g class="node" data-id="${escapeXml(node.elementId)}" data-qn="${escapeXml(node.qualifiedName)}" data-kind="${node.kind}">${body}</g>`;
      })
      .join("");
    const empty = nodes.length === 0 ? `<text x="32" y="96" fill="${this.tokens.muted}" font-family="${this.tokens.font}" font-size="14">Nothing to draw in this view.</text>` : "";
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect class="canvas" x="0" y="0" width="${width}" height="${height}" fill="${this.tokens.canvas}"/>
  ${grid}
  <text class="title" x="24" y="28" fill="${this.tokens.title}" font-family="${this.tokens.font}" font-size="13">${escapeXml(scene.title)}</text>
  ${edgeMarkup}
  ${nodeMarkup}
  ${empty}
</svg>`;
  }
}

function shift(node: PositionedNode): PositionedNode {
  return { ...node, x: node.x + ORIGIN_X, y: node.y + ORIGIN_Y };
}

function gridLines(width: number, height: number, color: string): string {
  const lines: string[] = [];
  for (let x = 24; x < width; x += 24) {
    lines.push(`<line x1="${x}" y1="40" x2="${x}" y2="${height}" stroke="${color}" stroke-width="1"/>`);
  }
  for (let y = 40; y < height; y += 24) {
    lines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${color}" stroke-width="1"/>`);
  }
  return lines.join("");
}

export function createSvgRenderer(): SvgRenderer {
  return new SvgRenderer(
    [new PartPainter(), new PortPainter(), new StatePainter(), new ActionPainter(), new PackagePainter(), new PartDefPainter(), new InterfacePainter()],
    [new ConnectionEdgePainter(), new SuccessionEdgePainter(), new TransitionEdgePainter()],
  );
}
