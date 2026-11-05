import { DiagramExporter, ExportFormat } from "./diagramExporter";
import { PdfExporter } from "./pdfExporter";
import { PngExporter } from "./pngExporter";
import { SvgExporter } from "./svgExporter";

export function createExporters(): Record<ExportFormat, DiagramExporter> {
  const svg = new SvgExporter();
  const png = new PngExporter();
  const pdf = new PdfExporter();
  return { svg, png, pdf };
}
