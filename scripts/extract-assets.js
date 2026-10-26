/**
 * Decodes `Screenshot 2026-10-25 183706.png` and crops the outer white screenshot border
 * to create a clean edge-to-edge `src/assets/welcome-scene.png`.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function decodePng(buf) {
  let offset = 8;
  let width = 0;
  let height = 0;
  const idat = [];
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    } else if (type === 'IDAT') {
      idat.push(data);
    }
    offset += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = width * bpp;
  const pixels = Buffer.alloc(height * stride);

  function paeth(a, b, c) {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
  }

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const rowIn = y * (stride + 1) + 1;
    const rowOut = y * stride;
    for (let i = 0; i < stride; i++) {
      const xByte = raw[rowIn + i];
      const a = i >= bpp ? pixels[rowOut + i - bpp] : 0;
      const b = y > 0 ? pixels[rowOut - stride + i] : 0;
      const c = y > 0 && i >= bpp ? pixels[rowOut - stride + i - bpp] : 0;
      let val = xByte;
      if (filter === 1) val = (xByte + a) & 0xff;
      else if (filter === 2) val = (xByte + b) & 0xff;
      else if (filter === 3) val = (xByte + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) val = (xByte + paeth(a, b, c)) & 0xff;
      pixels[rowOut + i] = val;
    }
  }
  return { width, height, pixels };
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, pixels) {
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // Filter 0 (None)
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const compressed = zlib.deflateSync(raw, { level: 6 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

function cropPixels(src, x0, y0, w, h) {
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    const srcStart = ((y0 + y) * src.width + x0) * 4;
    const dstStart = y * w * 4;
    src.pixels.copy(out, dstStart, srcStart, srcStart + w * 4);
  }
  return { width: w, height: h, pixels: out };
}

const inputPath = path.join(rootDir, 'Screenshot 2026-10-25 183706.png');
const assetsDir = path.join(rootDir, 'src', 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

const decoded = decodePng(fs.readFileSync(inputPath));

// Crop 4px from edges to remove the white screenshot frame
const cropX = 4;
const cropY = 4;
const cropW = decoded.width - 8;
const cropH = decoded.height - 8;
const welcomeCropped = cropPixels(decoded, cropX, cropY, cropW, cropH);
fs.writeFileSync(
  path.join(assetsDir, 'welcome-scene.png'),
  encodePng(welcomeCropped.width, welcomeCropped.height, welcomeCropped.pixels)
);

console.log(`Saved src/assets/welcome-scene.png (${welcomeCropped.width}x${welcomeCropped.height})`);

