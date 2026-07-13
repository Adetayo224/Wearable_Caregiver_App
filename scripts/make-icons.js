/* Generates simple flat PNG icons without external deps.
   Draws a black rounded square with a white heart shape. */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function pngFromRGBA(width, height, rgba) {
  const rowSize = width * 4 + 1;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0;
    rgba.copy(raw, y * rowSize + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });

  const crcTable = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c >>> 0;
    }
    return t;
  })();
  const crc32 = (buf) => {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, "ascii");
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
    return Buffer.concat([len, t, data, crc]);
  };

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", compressed), chunk("IEND", Buffer.alloc(0))]);
}

function heartField(size, cornerRadius, bg, fg, padPct) {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const pad = size * padPct;
  const inner = size - pad * 2;
  const hs = inner * 0.85;
  const hx = cx;
  const hy = cy - hs * 0.02;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let color = [255, 255, 255, 0];
      const inRounded =
        (x >= cornerRadius && x < size - cornerRadius) ||
        (y >= cornerRadius && y < size - cornerRadius) ||
        (x < cornerRadius && y < cornerRadius && Math.hypot(cornerRadius - x, cornerRadius - y) <= cornerRadius) ||
        (x >= size - cornerRadius && y < cornerRadius && Math.hypot(x - (size - cornerRadius), cornerRadius - y) <= cornerRadius) ||
        (x < cornerRadius && y >= size - cornerRadius && Math.hypot(cornerRadius - x, y - (size - cornerRadius)) <= cornerRadius) ||
        (x >= size - cornerRadius && y >= size - cornerRadius && Math.hypot(x - (size - cornerRadius), y - (size - cornerRadius)) <= cornerRadius);

      if (inRounded) color = bg;

      const nx = (x - hx) / (hs / 2);
      const ny = (y - hy) / (hs / 2);
      const f = Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny;
      if (f <= 0 && inRounded) color = fg;

      const i = (y * size + x) * 4;
      rgba[i] = color[0];
      rgba[i + 1] = color[1];
      rgba[i + 2] = color[2];
      rgba[i + 3] = color[3];
    }
  }
  return rgba;
}

function writeIcon(size, out, maskable = false) {
  const bg = [10, 10, 10, 255];
  const fg = [255, 255, 255, 255];
  const cornerRadius = maskable ? 0 : Math.round(size * 0.18);
  const padPct = maskable ? 0.22 : 0.14;
  const rgba = heartField(size, cornerRadius, bg, fg, padPct);
  const png = pngFromRGBA(size, size, rgba);
  fs.writeFileSync(out, png);
  console.log("wrote", out);
}

const dir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(dir, { recursive: true });
writeIcon(192, path.join(dir, "icon-192.png"));
writeIcon(512, path.join(dir, "icon-512.png"));
writeIcon(512, path.join(dir, "icon-maskable-512.png"), true);
