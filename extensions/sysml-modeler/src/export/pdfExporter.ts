import { DiagramExporter } from "./diagramExporter";
import { encodePdf } from "./encodePdf";
import { rasterizeSvg } from "./rasterizeSvg";

export class PdfExporter implements DiagramExporter {
  readonly format = "pdf" as const;
  readonly fileExtension = "pdf";

  exportBytes(svg: string): Uint8Array {
    return encodePdf(rasterizeSvg(svg));
  }
}
