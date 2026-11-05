import { deflateSync } from "zlib";
import { crc32 } from "./crc32";
import { Raster } from "./rasterizeSvg";

export function encodePng(raster: Raster): Uint8Array {
  const raw = new Uint8Array((raster.width * 4 + 1) * raster.height);
  for (let y = 0; y < raster.height; y += 1) {
    const rowStart = y * (raster.width * 4 + 1);
    raw[rowStart] = 0;
    raw.set(raster.rgba.subarray(y * raster.width * 4, (y + 1) * raster.width * 4), rowStart + 1);
  }
  const compressed = deflateSync(raw);
  const signature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, raster.width);
  view.setUint32(4, raster.height);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return concat([signature, chunk("IHDR", ihdr), chunk("IDAT", compressed), chunk("IEND", new Uint8Array())]);
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const body = new Uint8Array(8 + data.length + 4);
  const view = new DataView(body.buffer);
  view.setUint32(0, data.length);
  body.set(new TextEncoder().encode(type), 4);
  body.set(data, 8);
  const crc = crc32(body.subarray(4, 8 + data.length));
  view.setUint32(8 + data.length, crc);
  return body;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}
