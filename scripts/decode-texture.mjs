#!/usr/bin/env node
// Decodes a Base64-encoded Unity texture dump (a ZIP holding tex.bytes + tex.header)
// into a PNG. Only TextureFormat 45 (ETC2_RGB) is supported.
//
// Usage:
//   node scripts/decode-texture.mjs <input.b64 | -> [--out <file.png>] [--no-flip]
// "-" reads Base64 from stdin. Default output: <input>.png (or texture.png for stdin).
// Unity stores rows bottom-up, so the image is flipped vertically unless --no-flip.
import fs from 'node:fs';
import zlib from 'node:zlib';

const ETC2_RGB = 45;
const MOD = [[2, 8], [5, 17], [9, 29], [13, 42], [18, 60], [24, 80], [33, 106], [47, 183]];
const DIST = [3, 6, 11, 16, 23, 32, 41, 64];

const cl = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
const e4 = (v) => (v << 4) | v;
const e5 = (v) => (v << 3) | (v >> 2);
const e6 = (v) => (v << 2) | (v >> 4);
const e7 = (v) => (v << 1) | (v >> 6);
const s3 = (v) => (v & 4 ? v - 8 : v);

// ---- ZIP (read via the central directory; supports stored + deflate) ----
function readZip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a ZIP archive (end-of-central-directory not found)');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = {};
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Corrupt ZIP central directory');
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const dataStart = localOff + 30 + buf.readUInt16LE(localOff + 26) + buf.readUInt16LE(localOff + 28);
    const raw = buf.subarray(dataStart, dataStart + csize);
    if (method === 0) files[name] = raw;
    else if (method === 8) files[name] = zlib.inflateRawSync(raw);
    else throw new Error(`Unsupported ZIP compression method ${method} for ${name}`);
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

// ---- tex.header: .NET BinaryFormatter ValueTuple<bool,TextureFormat,int,int> ----
// The record ends with: format(i32) width(i32) height(i32) 0x0B (MessageEnd).
function parseHeader(h) {
  if (h.length < 13 || h[h.length - 1] !== 0x0b) throw new Error('Unexpected tex.header layout');
  const o = h.length - 13;
  return { format: h.readInt32LE(o), width: h.readInt32LE(o + 4), height: h.readInt32LE(o + 8) };
}

// ---- ETC2 RGB block decoder (8 bytes -> 16 [r,g,b] pixels, index y*4+x) ----
function decodeBlock(b) {
  const lo = b.readUInt32BE(4);
  const idx = (x, y) => {
    const k = x * 4 + y;
    return (((lo >>> (16 + k)) & 1) << 1) | ((lo >>> k) & 1);
  };
  const out = new Array(16);
  const diff = (b[3] >> 1) & 1;
  const flip = b[3] & 1;
  let mode = 'ind';
  let R1, G1, B1, R2, G2, B2;
  if (diff) {
    R1 = b[0] >> 3; G1 = b[1] >> 3; B1 = b[2] >> 3;
    R2 = R1 + s3(b[0] & 7); G2 = G1 + s3(b[1] & 7); B2 = B1 + s3(b[2] & 7);
    if (R2 < 0 || R2 > 31) mode = 'T';
    else if (G2 < 0 || G2 > 31) mode = 'H';
    else if (B2 < 0 || B2 > 31) mode = 'P';
    else mode = 'diff';
  }

  if (mode === 'ind' || mode === 'diff') {
    const c1 = mode === 'ind' ? [e4(b[0] >> 4), e4(b[1] >> 4), e4(b[2] >> 4)] : [e5(R1), e5(G1), e5(B1)];
    const c2 = mode === 'ind' ? [e4(b[0] & 15), e4(b[1] & 15), e4(b[2] & 15)] : [e5(R2), e5(G2), e5(B2)];
    const cw1 = (b[3] >> 5) & 7;
    const cw2 = (b[3] >> 2) & 7;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const sub = flip ? y >= 2 : x >= 2;
        const c = sub ? c2 : c1;
        const [small, large] = MOD[sub ? cw2 : cw1];
        const m = [small, large, -small, -large][idx(x, y)];
        out[y * 4 + x] = [cl(c[0] + m), cl(c[1] + m), cl(c[2] + m)];
      }
    }
  } else if (mode === 'T') {
    R1 = (((b[0] >> 3) & 3) << 2) | (b[0] & 3);
    G1 = b[1] >> 4; B1 = b[1] & 15;
    R2 = b[2] >> 4; G2 = b[2] & 15; B2 = b[3] >> 4;
    const d = DIST[(((b[3] >> 2) & 3) << 1) | (b[3] & 1)];
    const c1 = [e4(R1), e4(G1), e4(B1)];
    const c2 = [e4(R2), e4(G2), e4(B2)];
    const paint = [c1, c2.map((v) => cl(v + d)), c2, c2.map((v) => cl(v - d))];
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) out[y * 4 + x] = paint[idx(x, y)];
  } else if (mode === 'H') {
    R1 = (b[0] >> 3) & 15;
    G1 = ((b[0] & 7) << 1) | ((b[1] >> 4) & 1);
    B1 = (b[1] & 8) | ((b[1] & 3) << 1) | ((b[2] >> 7) & 1);
    R2 = (b[2] >> 3) & 15;
    G2 = ((b[2] & 7) << 1) | (b[3] >> 7);
    B2 = (b[3] >> 3) & 15;
    const v1 = (R1 << 8) | (G1 << 4) | B1;
    const v2 = (R2 << 8) | (G2 << 4) | B2;
    const d = DIST[(((b[3] >> 2) & 1) << 2) | ((b[3] & 1) << 1) | (v1 >= v2 ? 1 : 0)];
    const c1 = [e4(R1), e4(G1), e4(B1)];
    const c2 = [e4(R2), e4(G2), e4(B2)];
    const paint = [c1.map((v) => cl(v + d)), c1.map((v) => cl(v - d)), c2.map((v) => cl(v + d)), c2.map((v) => cl(v - d))];
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) out[y * 4 + x] = paint[idx(x, y)];
  } else {
    const RO = (b[0] >> 1) & 0x3f;
    const GO = ((b[0] & 1) << 6) | ((b[1] >> 1) & 0x3f);
    const BO = ((b[1] & 1) << 5) | (b[2] & 0x18) | ((b[2] & 3) << 1) | (b[3] >> 7);
    const RH = ((b[3] & 0x7c) >> 1) | (b[3] & 1);
    const GH = (b[4] >> 1) & 0x7f;
    const BH = ((b[4] & 1) << 5) | (b[5] >> 3);
    const RV = ((b[5] & 7) << 3) | (b[6] >> 5);
    const GV = ((b[6] & 0x1f) << 2) | (b[7] >> 6);
    const BV = b[7] & 0x3f;
    const O = [e6(RO), e7(GO), e6(BO)];
    const Hh = [e6(RH), e7(GH), e6(BH)];
    const V = [e6(RV), e7(GV), e6(BV)];
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        out[y * 4 + x] = [0, 1, 2].map((c) => cl((x * (Hh[c] - O[c]) + y * (V[c] - O[c]) + 4 * O[c] + 2) >> 2));
      }
    }
  }
  return out;
}

function decodeEtc2Rgb(data, w, h) {
  const bw = w >> 2;
  const bh = h >> 2;
  if (data.length < bw * bh * 8) throw new Error(`tex.bytes too short: ${data.length} < ${bw * bh * 8}`);
  const rgb = Buffer.alloc(w * h * 3);
  for (let by = 0; by < bh; by++) {
    for (let bx = 0; bx < bw; bx++) {
      const px = decodeBlock(data.subarray((by * bw + bx) * 8, (by * bw + bx) * 8 + 8));
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          const o = ((by * 4 + y) * w + bx * 4 + x) * 3;
          rgb[o] = px[y * 4 + x][0]; rgb[o + 1] = px[y * 4 + x][1]; rgb[o + 2] = px[y * 4 + x][2];
        }
      }
    }
  }
  return rgb;
}

// ---- PNG writer ----
function encodePng(rgb, w, h, flip) {
  const stride = w * 3;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    const src = (flip ? h - 1 - y : y) * stride;
    raw[y * (stride + 1)] = 0;
    rgb.copy(raw, y * (stride + 1) + 1, src, src + stride);
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- CLI ----
function main() {
  const args = process.argv.slice(2);
  const flip = !args.includes('--no-flip');
  const outIdx = args.indexOf('--out');
  const outArg = outIdx >= 0 ? args[outIdx + 1] : undefined;
  const input = args.find((a, i) => (a === '-' || !a.startsWith('--')) && i !== outIdx + 1);
  if (!input) {
    console.error('Usage: node scripts/decode-texture.mjs <input.b64 | -> [--out file.png] [--no-flip]');
    process.exit(1);
  }
  const b64 = fs.readFileSync(input === '-' ? 0 : input, 'utf8').replace(/\s+/g, '');
  const files = readZip(Buffer.from(b64, 'base64'));
  if (!files['tex.bytes'] || !files['tex.header']) throw new Error('Archive must contain tex.bytes and tex.header');
  const { format, width, height } = parseHeader(files['tex.header']);
  if (format !== ETC2_RGB) throw new Error(`Unsupported TextureFormat ${format} (only ${ETC2_RGB} = ETC2_RGB)`);
  if (width % 4 || height % 4) throw new Error(`Size ${width}x${height} is not a multiple of 4`);
  const png = encodePng(decodeEtc2Rgb(files['tex.bytes'], width, height), width, height, flip);
  const out = outArg ?? (input === '-' ? 'texture.png' : input.replace(/\.[^./]+$/, '') + '.png');
  fs.writeFileSync(out, png);
  console.log(`${out}: ${width}x${height} ETC2_RGB`);
}

try {
  main();
} catch (e) {
  console.error(`decode-texture: ${e.message}`);
  process.exit(1);
}
