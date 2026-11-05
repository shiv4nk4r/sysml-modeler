import { DiagramExporter } from "./diagramExporter";
import { encodePng } from "./encodePng";
import { rasterizeSvg } from "./rasterizeSvg";

export class PngExporter implements DiagramExporter {
  readonly format = "png" as const;
  readonly fileExtension = "png";

  exportBytes(svg: string): Uint8Array {
    return encodePng(rasterizeSvg(svg));
  }
}
