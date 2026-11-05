export type ExportFormat = "svg" | "png" | "pdf";

export interface DiagramExporter {
  readonly format: ExportFormat;
  readonly fileExtension: string;
  exportBytes(svg: string): Uint8Array;
}
