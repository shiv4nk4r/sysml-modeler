import { DiagramExporter } from "./diagramExporter";

export class SvgExporter implements DiagramExporter {
  readonly format = "svg" as const;
  readonly fileExtension = "svg";

  exportBytes(svg: string): Uint8Array {
    return new TextEncoder().encode(svg);
  }
}
