import { deflateSync } from "zlib";
import { Raster } from "./rasterizeSvg";

export function encodePdf(raster: Raster): Uint8Array {
  const rgb = new Uint8Array(raster.width * raster.height * 3);
  for (let pixel = 0; pixel < raster.width * raster.height; pixel += 1) {
    rgb[pixel * 3] = raster.rgba[pixel * 4];
    rgb[pixel * 3 + 1] = raster.rgba[pixel * 4 + 1];
    rgb[pixel * 3 + 2] = raster.rgba[pixel * 4 + 2];
  }
  const image = deflateSync(rgb);
  const content = `q\n${raster.width} 0 0 ${-raster.height} 0 ${raster.height} cm\n/Im0 Do\nQ\n`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj\n",
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${raster.width} ${raster.height}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >> endobj\n`,
    `4 0 obj << /Length ${content.length} >> stream\n${content}endstream\nendobj\n`,
    `5 0 obj << /Type /XObject /Subtype /Image /Width ${raster.width} /Height ${raster.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${image.length} >> stream\n`,
  ];
  const header = new TextEncoder().encode("%PDF-1.4\n");
  const chunks: Uint8Array[] = [header];
  const offsets: number[] = [0];
  let cursor = header.length;
  objects.forEach((object, index) => {
    offsets.push(cursor);
    const bytes = new TextEncoder().encode(object);
    chunks.push(bytes);
    cursor += bytes.length;
    if (index === objects.length - 1) {
      chunks.push(image);
      cursor += image.length;
      const tail = new TextEncoder().encode("\nendstream\nendobj\n");
      chunks.push(tail);
      cursor += tail.length;
    }
  });
  const xrefAt = cursor;
  let xref = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    xref += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer << /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;
  chunks.push(new TextEncoder().encode(xref));
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(length);
  let writeAt = 0;
  for (const chunk of chunks) {
    output.set(chunk, writeAt);
    writeAt += chunk.length;
  }
  return output;
}
