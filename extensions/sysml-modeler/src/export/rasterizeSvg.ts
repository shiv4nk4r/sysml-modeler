export interface Raster {
  width: number;
  height: number;
  rgba: Uint8Array;
}

const SCALE = 2;

export function rasterizeSvg(svg: string): Raster {
  const size = svg.match(/<svg\b[^>]*\bwidth="([\d.]+)"[^>]*\bheight="([\d.]+)"/);
  const width = Math.max(1, Math.min(4096, Math.ceil(Number(size?.[1] ?? 640))));
  const height = Math.max(1, Math.min(4096, Math.ceil(Number(size?.[2] ?? 240))));
  const rasterWidth = width * SCALE;
  const rasterHeight = height * SCALE;
  const rgba = new Uint8Array(rasterWidth * rasterHeight * 4);
  fill(rgba, [28, 33, 40, 255]);
  for (const match of svg.matchAll(/<rect\b([^>]*?)\/>/g)) {
    paintRect(rgba, rasterWidth, rasterHeight, attributes(match[1]));
  }
  for (const match of svg.matchAll(/<line\b([^>]*?)\/>/g)) {
    paintLine(rgba, rasterWidth, rasterHeight, attributes(match[1]));
  }
  for (const match of svg.matchAll(/<polyline\b([^>]*?)\/>/g)) {
    paintPolyline(rgba, rasterWidth, rasterHeight, attributes(match[1]));
  }
  for (const match of svg.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)) {
    paintText(rgba, rasterWidth, rasterHeight, attributes(match[1]), decodeXml(match[2]));
  }
  return { width: rasterWidth, height: rasterHeight, rgba };
}

function attributes(source: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const match of source.matchAll(/([A-Za-z0-9:-]+)="([^"]*)"/g)) {
    values[match[1]] = match[2];
  }
  return values;
}

function paintRect(rgba: Uint8Array, width: number, height: number, attrs: Record<string, string>): void {
  const x = numberAttr(attrs.x) * SCALE;
  const y = numberAttr(attrs.y) * SCALE;
  const rectWidth = numberAttr(attrs.width) * SCALE;
  const rectHeight = numberAttr(attrs.height) * SCALE;
  const fillColor = attrs.fill && attrs.fill !== "none" ? colorOf(attrs.fill) : undefined;
  const strokeColor = attrs.stroke && attrs.stroke !== "none" ? colorOf(attrs.stroke) : undefined;
  if (fillColor) {
    fillRect(rgba, width, height, x, y, rectWidth, rectHeight, fillColor);
  }
  if (strokeColor) {
    strokeRect(rgba, width, height, x, y, rectWidth, rectHeight, strokeColor);
  }
}

function paintLine(rgba: Uint8Array, width: number, height: number, attrs: Record<string, string>): void {
  drawLine(
    rgba,
    width,
    height,
    numberAttr(attrs.x1) * SCALE,
    numberAttr(attrs.y1) * SCALE,
    numberAttr(attrs.x2) * SCALE,
    numberAttr(attrs.y2) * SCALE,
    colorOf(attrs.stroke ?? "#9aa7b8"),
  );
}

function paintPolyline(rgba: Uint8Array, width: number, height: number, attrs: Record<string, string>): void {
  const points = (attrs.points ?? "")
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(",").map(Number))
    .filter((pair) => pair.length === 2 && pair.every((value) => Number.isFinite(value)));
  for (let index = 1; index < points.length; index += 1) {
    drawLine(
      rgba,
      width,
      height,
      points[index - 1][0] * SCALE,
      points[index - 1][1] * SCALE,
      points[index][0] * SCALE,
      points[index][1] * SCALE,
      colorOf(attrs.stroke ?? "#9aa7b8"),
    );
  }
}

function paintText(rgba: Uint8Array, width: number, height: number, attrs: Record<string, string>, text: string): void {
  const color = colorOf(attrs.fill ?? "#d7dde6");
  let x = numberAttr(attrs.x) * SCALE;
  const y = numberAttr(attrs.y) * SCALE;
  for (const char of text) {
    const code = char.charCodeAt(0);
    for (let row = 0; row < 7; row += 1) {
      for (let column = 0; column < 5; column += 1) {
        if ((code * (row + 3) + column * 13) % 4 === 0) {
          setPixel(rgba, width, height, x + column, y - 7 + row, color);
        }
      }
    }
    x += 6;
  }
}

function fill(rgba: Uint8Array, color: [number, number, number, number]): void {
  for (let index = 0; index < rgba.length; index += 4) {
    rgba[index] = color[0];
    rgba[index + 1] = color[1];
    rgba[index + 2] = color[2];
    rgba[index + 3] = color[3];
  }
}

function fillRect(
  rgba: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  rectWidth: number,
  rectHeight: number,
  color: [number, number, number, number],
): void {
  const left = Math.floor(x);
  const top = Math.floor(y);
  const right = Math.ceil(x + rectWidth);
  const bottom = Math.ceil(y + rectHeight);
  for (let py = top; py < bottom; py += 1) {
    for (let px = left; px < right; px += 1) {
      setPixel(rgba, width, height, px, py, color);
    }
  }
}

function strokeRect(
  rgba: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  rectWidth: number,
  rectHeight: number,
  color: [number, number, number, number],
): void {
  drawLine(rgba, width, height, x, y, x + rectWidth, y, color);
  drawLine(rgba, width, height, x, y + rectHeight, x + rectWidth, y + rectHeight, color);
  drawLine(rgba, width, height, x, y, x, y + rectHeight, color);
  drawLine(rgba, width, height, x + rectWidth, y, x + rectWidth, y + rectHeight, color);
}

function drawLine(
  rgba: Uint8Array,
  width: number,
  height: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: [number, number, number, number],
): void {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const endX = Math.round(x1);
  const endY = Math.round(y1);
  const dx = Math.abs(endX - x);
  const dy = Math.abs(endY - y);
  const stepX = x < endX ? 1 : -1;
  const stepY = y < endY ? 1 : -1;
  let error = dx - dy;
  for (let guard = 0; guard < width * height; guard += 1) {
    setPixel(rgba, width, height, x, y, color);
    if (x === endX && y === endY) {
      break;
    }
    const next = error * 2;
    if (next > -dy) {
      error -= dy;
      x += stepX;
    }
    if (next < dx) {
      error += dx;
      y += stepY;
    }
  }
}

function setPixel(
  rgba: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  color: [number, number, number, number],
): void {
  if (x < 0 || y < 0 || x >= width || y >= height) {
    return;
  }
  const index = (y * width + x) * 4;
  rgba[index] = color[0];
  rgba[index + 1] = color[1];
  rgba[index + 2] = color[2];
  rgba[index + 3] = color[3];
}

function colorOf(value: string): [number, number, number, number] {
  const hex = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return [Number.parseInt(hex.slice(1, 3), 16), Number.parseInt(hex.slice(3, 5), 16), Number.parseInt(hex.slice(5, 7), 16), 255];
  }
  return [215, 221, 230, 255];
}

function numberAttr(value: string | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function decodeXml(value: string): string {
  return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}
