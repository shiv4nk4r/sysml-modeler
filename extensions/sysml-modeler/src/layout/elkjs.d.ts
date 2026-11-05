declare module "elkjs/lib/elk.bundled.js" {
  interface ElkNode {
    id: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    children?: ElkNode[];
    ports?: ElkPort[];
    edges?: ElkEdge[];
    layoutOptions?: Record<string, string>;
  }

  interface ElkPort {
    id: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    layoutOptions?: Record<string, string>;
  }

  interface ElkEdge {
    id: string;
    sources: string[];
    targets: string[];
    sections?: { startPoint: { x: number; y: number }; endPoint: { x: number; y: number }; bendPoints?: { x: number; y: number }[] }[];
  }

  export default class ELK {
    layout(graph: ElkNode): Promise<ElkNode>;
  }
}
