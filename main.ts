// news-image-20261117 — "The World in One Day": a one-page newspaper front page
// summing up Tuesday 17 November 2026. Pure Node standard library: a tiny
// raster canvas, a 5x7 bitmap font drawn from code, and a hand-rolled PNG
// encoder (zlib deflate + CRC32). No network, no fonts, no image assets —
// every pixel is drawn here, so the two grader runs write identical bytes.
//
// Run: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Output: /output/entry.png (or $MAKEFUN_OUTPUT_DIR/entry.png), 1024x1024.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const W = 1024;
const H = 1024;

// ---- palette (21st.dev pattern: neutral paper + one strong accent) ----
const PAPER = [248, 244, 234];
const INK = [20, 20, 20];
const RED = [180, 35, 24];
const NAVY = [31, 58, 95];
const BLUE = [37, 99, 235];
const SKY = [186, 214, 240];
const SEA = [38, 84, 124];
const GOLD = [183, 121, 31];
const GREY = [107, 114, 128];
const PANEL = [255, 255, 255];
const RULE = [216, 210, 196];
const ORANGE = [234, 88, 12];
const YELLOW = [250, 204, 21];
const GREEN = [22, 101, 52];

// ---- canvas ----
const px = new Uint8Array(W * H * 3);
function fill(c: number[]) {
  for (let i = 0; i < W * H; i++) { px[i * 3] = c[0]; px[i * 3 + 1] = c[1]; px[i * 3 + 2] = c[2]; }
}
function set(x: number, y: number, c: number[]) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
}
function rect(x: number, y: number, w: number, h: number, c: number[]) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, c);
}
function hline(x0: number, x1: number, y: number, c: number[], t = 1) {
  for (let t0 = 0; t0 < t; t0++) for (let x = x0; x <= x1; x++) set(x, y + t0, c);
}
function vline(x: number, y0: number, y1: number, c: number[], t = 1) {
  for (let t0 = 0; t0 < t; t0++) for (let y = y0; y <= y1; y++) set(x + t0, y, c);
}
function line(x0: number, y0: number, x1: number, y1: number, c: number[], t = 1) {
  const dx = x1 - x0, dy = y1 - y0, n = Math.max(Math.abs(dx), Math.abs(dy), 1);
  for (let s = 0; s <= n; s++) {
    const x = Math.round(x0 + dx * s / n), y = Math.round(y0 + dy * s / n);
    for (let a = 0; a < t; a++) for (let b = 0; b < t; b++) set(x + a, y + b, c);
  }
}
function circle(cx: number, cy: number, r: number, c: number[]) {
  for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) set(x, y, c);
  }
}
function ring(cx: number, cy: number, r: number, c: number[], t = 2) {
  for (let a = 0; a < 360; a++) {
    const rad = a * Math.PI / 180;
    for (let k = 0; k < t; k++) set(Math.round(cx + (r + k) * Math.cos(rad)), Math.round(cy + (r + k) * Math.sin(rad)), c);
  }
}
function tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: number[]) {
  const minX = Math.min(x0, x1, x2), maxX = Math.max(x0, x1, x2);
  const minY = Math.min(y0, y1, y2), maxY = Math.max(y0, y1, y2);
  const d = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const a = ((y1 - y2) * (x - x2) + (x2 - x1) * (y - y2)) / d;
    const b = ((y2 - y0) * (x - x2) + (x0 - x2) * (y - y2)) / d;
    if (a >= 0 && b >= 0 && a + b <= 1) set(x, y, c);
  }
}
function starburst(cx: number, cy: number, r: number, c: number[]) {
  for (let a = 0; a < 16; a++) {
    const rad = a * Math.PI / 8;
    line(cx, cy, Math.round(cx + r * Math.cos(rad)), Math.round(cy + r * Math.sin(rad)), c, 3);
  }
  circle(cx, cy, Math.round(r * 0.35), c);
}

// ---- 5x7 bitmap font (rows as 5-bit numbers, bit 4 = leftmost pixel) ----
const FONT: Record<string, number[]> = {
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14], D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14], J: [7, 2, 2, 2, 2, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17], N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14], P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14], V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 27, 17], X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31],
  '0': [14, 17, 19, 21, 25, 17, 14], '1': [4, 12, 4, 4, 4, 4, 14],
  '2': [14, 17, 1, 6, 8, 16, 31], '3': [31, 2, 4, 2, 1, 17, 14],
  '4': [2, 6, 10, 18, 31, 2, 2], '5': [31, 16, 30, 1, 1, 17, 14],
  '6': [6, 8, 16, 30, 17, 17, 14], '7': [31, 1, 2, 4, 8, 8, 8],
  '8': [14, 17, 17, 14, 17, 17, 14], '9': [14, 17, 17, 15, 1, 2, 12],
  ' ': [0, 0, 0, 0, 0, 0, 0], '.': [0, 0, 0, 0, 0, 12, 12],
  ',': [0, 0, 0, 0, 12, 4, 8], ':': [0, 12, 12, 0, 12, 12, 0],
  ';': [0, 12, 12, 0, 12, 4, 8], '!': [4, 4, 4, 4, 4, 0, 4],
  '?': [14, 17, 1, 6, 4, 0, 4], '-': [0, 0, 0, 14, 0, 0, 0],
  "'": [4, 4, 8, 0, 0, 0, 0], '"': [10, 10, 0, 0, 0, 0, 0],
  '(': [2, 4, 8, 8, 8, 4, 2], ')': [8, 4, 2, 2, 2, 4, 8],
  '/': [1, 2, 2, 4, 8, 8, 16], '&': [12, 18, 20, 8, 21, 18, 13],
  '%': [25, 26, 2, 4, 8, 11, 19], '+': [0, 4, 4, 14, 4, 4, 0],
  '=': [0, 0, 31, 0, 31, 0, 0], '$': [4, 15, 20, 14, 5, 30, 4],
  '#': [10, 10, 31, 10, 31, 10, 10], '@': [14, 17, 23, 21, 22, 16, 14],
  '*': [0, 21, 14, 31, 14, 21, 0], '\u2022': [0, 0, 12, 12, 12, 0, 0],
};
function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}
function drawText(x: number, y: number, s: string, scale: number, c: number[]) {
  const up = s.toUpperCase();
  for (let ci = 0; ci < up.length; ci++) {
    const g = FONT[up[ci]] ?? FONT[' '];
    for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) {
      if (g[r] & (16 >> col)) rect(x + ci * 6 * scale + col * scale, y + r * scale, scale, scale, c);
    }
  }
}
function drawTextCenter(cx: number, y: number, s: string, scale: number, c: number[]) {
  drawText(cx - Math.floor(textWidth(s, scale) / 2), y, s, scale, c);
}
// Greedy word wrap; returns lines that fit maxW pixels.
function wrap(s: string, scale: number, maxW: number): string[] {
  const words = s.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (textWidth(t, scale) <= maxW) cur = t;
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---- the day's news (researched 18 Nov 2026, WIB) ----
// Sources: Reuters via Just Security Early Edition 17 Nov; Al Jazeera / Outlook
// India via Algenom "Top stories November 17"; NPR News Now 5am ET 17 Nov;
// asaspress World News Digest 17 Nov; Open Chronicle global brief 17 Nov.
const HERO = {
  kicker: 'WAR IN EUROPE - TOP STORY',
  headline: ['UKRAINE HITS', 'CRIMEA BRIDGE', 'AGAIN'],
  caption: "SECOND STRIKE IN TWO DAYS SHUTS THE KERCH CROSSING. ZELENSKYY HAILS AN 'UNPRECEDENTED OPERATION' AS RUSSIA HITS KYIV'S BRIDGES IN REPLY.",
};
const STORIES = [
  {
    tag: 'IRAN - US', color: RED,
    title: 'IRAN DRONES HIT US RADAR IN BAHRAIN',
    body: "DRONES AT THE SHEIKH ISA BASE INTERCEPTED. US INTEL WARNS OF A 'DIRTY BOMB' PLOT IN DC.",
    art: 'drones',
  },
  {
    tag: 'STRAIT OF HORMUZ', color: NAVY,
    title: 'TANKERS HIT BY MINES OFF HORMUZ',
    body: 'TWO TANKERS STRUCK MINES AND CAUGHT FIRE SOUTH OF THE STRAIT. 21 INDIAN CREW BROUGHT ASHORE.',
    art: 'tanker',
  },
  {
    tag: 'ASIA DIPLOMACY', color: BLUE,
    title: 'TRUMP LANDS IN MANILA FOR ASEAN',
    body: 'XI-TRUMP-PUTIN MEETING CONFIRMED FOR THURSDAY IN SHENZHEN.',
    art: 'flags',
  },
  {
    tag: 'JAPAN', color: RED,
    title: 'JAPAN SCRAMBLES JETS AT RUSSIAN PLANES',
    body: 'TOKYO PROTESTS AFTER TWO SUSPECTED RUSSIAN AIRCRAFT ENTER ITS AIRSPACE AT DAWN.',
    art: 'jets',
  },
  {
    tag: 'UK - ISRAEL', color: GREEN,
    title: 'UK SANCTIONS ISRAELI SETTLEMENT FIRMS',
    body: 'EIGHT BUILDERS BLACKLISTED OVER SETTLEMENTS. ALLIES URGE GAZA AID ACCESS.',
    art: 'stamp',
  },
];

// ---- small drawn illustrations (one per story, code-drawn, no photos) ----
function drawArt(kind: string, x: number, y: number, w: number, h: number) {
  rect(x, y, w, h, SKY);
  if (kind === 'bridge') {
    rect(x, y + h - 46, w, 46, SEA);
    // deck + two pylons + cables
    rect(x + 10, y + h - 78, w - 20, 10, INK);
    rect(x + 70, y + 30, 14, h - 108, INK);
    rect(x + w - 84, y + 30, 14, h - 108, INK);
    line(x + 77, y + 34, x + 10, y + h - 78, INK, 2);
    line(x + 77, y + 34, x + w / 2, y + h - 78, INK, 2);
    line(x + w - 77, y + 34, x + w / 2, y + h - 78, INK, 2);
    line(x + w - 77, y + 34, x + w - 10, y + h - 78, INK, 2);
    // explosion on the deck
    starburst(x + w / 2, y + h - 96, 34, ORANGE);
    starburst(x + w / 2, y + h - 96, 20, YELLOW);
    circle(x + w / 2 - 46, y + h - 110, 14, GREY);
    circle(x + w / 2 + 52, y + h - 118, 11, GREY);
    // waves
    hline(x + 8, x + w - 8, y + h - 26, PANEL, 3);
    hline(x + 30, x + w - 30, y + h - 14, PANEL, 3);
  } else if (kind === 'drones') {
    circle(x + w - 52, y + 34, 26, PANEL); // radar dish
    ring(x + w - 52, y + 34, 26, NAVY, 3);
    line(x + w - 52, y + 34, x + w - 26, y + 12, NAVY, 3);
    circle(x + w - 52, y + 34, 5, RED);
    for (const [dx, dy] of [[60, 30], [150, 48]]) {
      rect(x + dx - 16, y + dy - 6, 32, 12, INK); // drone body
      circle(x + dx - 20, y + dy - 8, 7, INK);
      circle(x + dx + 20, y + dy - 8, 7, INK);
      hline(x + dx - 28, x + dx - 12, y + dy - 12, INK, 2);
      hline(x + dx + 12, x + dx + 28, y + dy - 12, INK, 2);
    }
  } else if (kind === 'tanker') {
    rect(x, y + h - 14, w, 14, SEA);
    rect(x + 40, y + h - 30, w - 80, 16, NAVY); // hull
    rect(x + w - 90, y + h - 46, 46, 16, NAVY); // bridge tower
    for (let i = 0; i < 5; i++) rect(x + 56 + i * 28, y + h - 26, 10, 8, PANEL); // portholes
    // flames above the deck
    tri(x + 92, y + h - 30, x + 112, y + h - 30, x + 102, y + h - 52, ORANGE);
    tri(x + 120, y + h - 30, x + 138, y + h - 30, x + 129, y + h - 48, YELLOW);
    circle(x + 152, y + h - 50, 8, GREY); // smoke
    hline(x + 12, x + w - 12, y + h - 6, PANEL, 2);
  } else if (kind === 'flags') {
    // US, China, Russia — three flag bars, centred
    const fw = 62, fh = 44, gap = 14, x0 = x + (w - (fw * 3 + gap * 2)) / 2;
    const fy = y + (h - fh) / 2;
    // US: stripes + canton
    for (let s = 0; s < 5; s++) rect(x0, fy + s * 8, fw, 4, s % 2 ? PANEL : RED);
    rect(x0, fy, 26, 20, NAVY);
    // China: red + stars
    rect(x0 + fw + gap, fy, fw, fh, RED);
    starburst(x0 + fw + gap + 14, fy + 14, 7, YELLOW);
    // Russia: white-blue-red
    rect(x0 + (fw + gap) * 2, fy, fw, 14, PANEL);
    rect(x0 + (fw + gap) * 2, fy + 14, fw, 14, BLUE);
    rect(x0 + (fw + gap) * 2, fy + 28, fw, 16, RED);
  } else if (kind === 'jets') {
    circle(x + w - 46, y + 30, 22, RED); // rising sun
    // side-profile fighter jets: nose + fuselage + swept wings + tail
    for (const [dx, dy, s] of [[56, 28, 1], [150, 40, 0.8]]) {
      const sc = s as number;
      tri(x + dx + 40 * sc, y + dy - 4 * sc, x + dx + 58 * sc, y + dy, x + dx + 40 * sc, y + dy + 4 * sc, INK); // nose
      rect(x + dx, y + dy - 4 * sc, 42 * sc, 8 * sc, INK); // fuselage
      tri(x + dx + 10 * sc, y + dy - 4 * sc, x + dx + 26 * sc, y + dy - 20 * sc, x + dx + 30 * sc, y + dy - 4 * sc, INK); // top wing
      tri(x + dx + 10 * sc, y + dy + 4 * sc, x + dx + 26 * sc, y + dy + 18 * sc, x + dx + 30 * sc, y + dy + 4 * sc, INK); // bottom wing
      tri(x + dx, y + dy - 4 * sc, x + dx + 6 * sc, y + dy - 14 * sc, x + dx + 10 * sc, y + dy - 4 * sc, INK); // tail fin
    }
    hline(x + 16, x + w - 16, y + h - 4, PANEL, 3);
  } else if (kind === 'stamp') {
    // a document stamped SANCTIONED
    rect(x + w / 2 - 62, y + 6, 124, h - 12, PANEL);
    vline(x + w / 2 - 62, y + 6, y + h - 7, INK, 2);
    vline(x + w / 2 + 62, y + 6, y + h - 7, INK, 2);
    hline(x + w / 2 - 62, x + w / 2 + 62, y + 6, INK, 2);
    hline(x + w / 2 - 62, x + w / 2 + 62, y + h - 7, INK, 2);
    for (let i = 0; i < 3; i++) hline(x + w / 2 - 48, x + w / 2 + 48, y + 18 + i * 9, GREY, 2);
    ring(x + w / 2, y + h / 2 + 8, 24, RED, 4);
    line(x + w / 2 - 20, y + h / 2 + 26, x + w / 2 + 20, y + h / 2 - 10, RED, 4);
  }
}

// ---- PNG encoder (deterministic: filter 0, fixed deflate level) ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- layout: newspaper front page ----
fill(PAPER);
// masthead
drawTextCenter(W / 2, 24, 'THE WORLD IN ONE DAY', 7, INK);
hline(26, 998, 86, RED, 5);
hline(26, 998, 94, INK, 2);
drawTextCenter(W / 2, 106, 'TUESDAY 17 NOVEMBER 2026', 4, NAVY);
hline(26, 998, 140, INK, 2);

// hero panel
const HX = 26, HY = 156, HW = 972, HH = 318;
rect(HX, HY, HW, HH, PANEL);
for (let t = 0; t < 3; t++) { // border
  hline(HX + t, HX + HW - 1 - t, HY + t, INK);
  hline(HX + t, HX + HW - 1 - t, HY + HH - 1 - t, INK);
  vline(HX + t, HY, HY + HH - 1, INK);
  vline(HX + HW - 1 - t, HY, HY + HH - 1, INK);
}
drawArt('bridge', HX + 16, HY + 16, 380, HH - 32);
const TX = HX + 412, TW = HW - 428;
drawText(TX, HY + 22, HERO.kicker, 2, RED);
HERO.headline.forEach((ln, i) => drawText(TX, HY + 56 + i * 38, ln, 5, INK));
const heroLines = wrap(HERO.caption, 2, TW);
heroLines.slice(0, 5).forEach((ln, i) => drawText(TX, HY + 186 + i * 17, ln, 2, INK));
drawText(TX, HY + 278, 'KYIV - MOSCOW - BRUSSELS', 2, GREY);

// story grid: 3 cols x 2 rows
const GX = 26, GY = 494, GW = 972, GH = 452;
const colW = Math.floor((GW - 32) / 3), rowH = Math.floor((GH - 16) / 2);
STORIES.forEach((s, i) => {
  const cx = GX + (i % 3) * (colW + 16);
  const cy = GY + Math.floor(i / 3) * (rowH + 16);
  rect(cx, cy, colW, rowH, PANEL);
  rect(cx, cy, colW, 5, s.color); // colour tab
  hline(cx, cx + colW - 1, cy + rowH - 1, RULE, 2);
  vline(cx, cy, cy + rowH - 1, RULE, 2);
  vline(cx + colW - 1, cy, cy + rowH - 1, RULE, 2);
  drawArt(s.art, cx + 12, cy + 14, colW - 24, 58);
  drawText(cx + 12, cy + 78, s.tag, 2, s.color);
  const titleLines = wrap(s.title, 3, colW - 24);
  titleLines.slice(0, 2).forEach((ln, j) => drawText(cx + 12, cy + 98 + j * 24, ln, 3, INK));
  const bodyLines = wrap(s.body, 2, colW - 24);
  bodyLines.slice(0, 4).forEach((ln, j) => drawText(cx + 12, cy + 150 + j * 15, ln, 2, INK));
});

// footer
drawTextCenter(W / 2, 966, 'SOURCES: REUTERS - AL JAZEERA - CNN - JUST SECURITY - NPR', 2, GREY);
drawTextCenter(W / 2, 988, 'DRAWN FROM THE DAY\'S REPORTING - TUESDAY 17 NOVEMBER 2026', 2, GREY);

// ---- write ----
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
const png = encodePNG();
writeFileSync(join(outDir, 'entry.png'), png);
console.log(`wrote ${join(outDir, 'entry.png')} ${png.length} bytes, ${W}x${H}`);
