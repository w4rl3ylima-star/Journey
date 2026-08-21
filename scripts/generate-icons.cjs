// Generates PWA PNG icons from scratch using only Node's zlib (no image deps).
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function encodePNG(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idatData = zlib.deflateSync(raw, { level: 9 })

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// --- drawing helpers on an RGBA buffer ---
function makeCanvas(size) {
  const buf = Buffer.alloc(size * size * 4)
  return buf
}

function setPx(buf, size, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= size || y >= size) return
  const i = (y * size + x) * 4
  // simple alpha blend over existing
  const srcA = a / 255
  buf[i] = Math.round(r * srcA + buf[i] * (1 - srcA))
  buf[i + 1] = Math.round(g * srcA + buf[i + 1] * (1 - srcA))
  buf[i + 2] = Math.round(b * srcA + buf[i + 2] * (1 - srcA))
  buf[i + 3] = Math.min(255, Math.round(a + buf[i + 3] * (1 - srcA)))
}

function fillRoundedRect(buf, size, x0, y0, x1, y1, radius, color) {
  const [r, g, b, a] = color
  for (let y = Math.floor(y0); y < y1; y++) {
    for (let x = Math.floor(x0); x < x1; x++) {
      // distance from rounded corners
      let inside = true
      const cx = Math.min(Math.max(x, x0 + radius), x1 - radius)
      const cy = Math.min(Math.max(y, y0 + radius), y1 - radius)
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy > radius * radius) inside = false
      if (inside) setPx(buf, size, x, y, r, g, b, a)
    }
  }
}

function fillCircle(buf, size, cx, cy, radius, color) {
  const [r, g, b, a] = color
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
      const dx = x - cx
      const dy = y - cy
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d <= radius) {
        // slight AA at edge
        const edgeA = d > radius - 1 ? a * (radius - d) : a
        setPx(buf, size, x, y, r, g, b, Math.max(0, Math.min(255, edgeA)))
      }
    }
  }
}

function strokeCircle(buf, size, cx, cy, radius, width, color) {
  const [r, g, b, a] = color
  for (let y = Math.floor(cy - radius - width); y <= Math.ceil(cy + radius + width); y++) {
    for (let x = Math.floor(cx - radius - width); x <= Math.ceil(cx + radius + width); x++) {
      const dx = x - cx
      const dy = y - cy
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d >= radius - width / 2 && d <= radius + width / 2) {
        setPx(buf, size, x, y, r, g, b, a)
      }
    }
  }
}

function fillRect(buf, size, x0, y0, x1, y1, color) {
  const [r, g, b, a] = color
  for (let y = Math.floor(y0); y < y1; y++) {
    for (let x = Math.floor(x0); x < x1; x++) setPx(buf, size, x, y, r, g, b, a)
  }
}

// Draws the Journey mark: dark rounded square bg, mint-green upward "growth" chevron/arrow
// plus a small dot (voice/record cue), evoking spending trending down / savings trending up.
function drawIcon(size, { maskable = false } = {}) {
  const buf = makeCanvas(size)
  const bg = [15, 23, 42, 255] // slate-900
  const mint = [45, 212, 191, 255] // teal-400
  const mintSoft = [45, 212, 191, 120]

  const pad = maskable ? size * 0.16 : 0
  fillRoundedRect(buf, size, pad, pad, size - pad, size - pad, maskable ? size * 0.08 : size * 0.22, bg)

  const cx = size / 2
  const cy = size / 2

  // upward trend line (3-point polyline) drawn as thick segments, representing progress toward goals
  const pts = [
    [cx - size * 0.24, cy + size * 0.16],
    [cx - size * 0.02, cy - size * 0.06],
    [cx + size * 0.1, cy + size * 0.02],
    [cx + size * 0.26, cy - size * 0.2],
  ]
  const thickness = size * 0.045
  for (let i = 0; i < pts.length - 1; i++) {
    drawThickLine(buf, size, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], thickness, mint)
  }
  // arrow head at the end
  const [ex, ey] = pts[pts.length - 1]
  fillCircle(buf, size, ex, ey, size * 0.035, mint)

  // small dot cluster bottom-left evoking a coin / voice waveform
  fillCircle(buf, size, cx - size * 0.22, cy + size * 0.22, size * 0.045, mintSoft)

  return buf
}

function drawThickLine(buf, size, x0, y0, x1, y1, thickness, color) {
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = x0 + (x1 - x0) * t
    const y = y0 + (y1 - y0) * t
    fillCircle(buf, size, x, y, thickness, color)
  }
}

function writeIcon(size, filename, opts) {
  const buf = drawIcon(size, opts)
  const png = encodePNG(size, size, buf)
  const outDir = path.join(__dirname, '..', 'public', 'icons')
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, filename), png)
  console.log('wrote', filename, png.length, 'bytes')
}

writeIcon(192, 'icon-192.png')
writeIcon(512, 'icon-512.png')
writeIcon(192, 'icon-maskable-192.png', { maskable: true })
writeIcon(512, 'icon-maskable-512.png', { maskable: true })
writeIcon(180, 'apple-touch-icon.png')

// Favicon SVG (simple, matches the mark)
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0f172a"/>
  <polyline points="16,40 30,26 38,32 48,14" fill="none" stroke="#2dd4bf" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="48" cy="14" r="3.4" fill="#2dd4bf"/>
</svg>`
fs.writeFileSync(path.join(__dirname, '..', 'public', 'icons', 'favicon.svg'), favicon)
console.log('wrote favicon.svg')
