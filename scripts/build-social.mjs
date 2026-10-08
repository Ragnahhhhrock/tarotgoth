// Builds the social images and icons from SVG sources.
// Run: npm install && npm run build:social
// Needs the fonts installed on the machine that renders: IM Fell English and Hanken Grotesk
// (both OFL; woff2 files are in /fonts, install the TTFs locally or convert with fonttools).
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const avatar = readFileSync(join(root, "assets/vesper.svg"), "utf8");
const inner = avatar.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

const C = { ink: "#140E17", crypt: "#1F1724", bone: "#EDE4D6", ash: "#B0A4B8", rose: "#EE8CA0", gilt: "#C4A265" };

function card(W, H) {
  // Avatar arch on the left, copy on the right. Key content sits inside a 60px safe margin.
  const m = 60;
  const ah = H - m * 2;
  const aw = ah * 0.8;
  const ax = m + 10;
  const tx = ax + aw + 64;
  const cy = H / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="0.2" cy="0.5" r="0.8">
      <stop offset="0" stop-color="#2e2335"/>
      <stop offset="1" stop-color="${C.ink}"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <svg x="${ax}" y="${m}" width="${aw}" height="${ah}" viewBox="0 0 400 500">${inner}</svg>
  <text x="${tx}" y="${cy - 36}" font-family="IM FELL English" font-size="128" fill="${C.bone}">tarotgoth</text>
  <text x="${tx + 4}" y="${cy + 36}" font-family="IM FELL English" font-style="italic" font-size="50" fill="${C.rose}">Your cards. Her opinion.</text>
  <text font-family="Hanken Grotesk" font-size="28" fill="${C.ash}">
    <tspan x="${tx + 4}" y="${cy + 100}">Photograph your tarot spread and get</tspan>
    <tspan x="${tx + 4}" y="${cy + 138}">a reading with teeth.</tspan>
  </text>
  <text x="${tx + 4}" y="${H - m - 8}" font-family="Hanken Grotesk" font-weight="600" font-size="26" fill="${C.gilt}">tarotgoth.com</text>
</svg>`;
}

const out = (f) => join(root, f);

// Open Graph: 1.91:1 (1200x630). Twitter summary_large_image: 2:1 (1200x600).
for (const [file, W, H] of [["og-image", 1200, 630], ["twitter-card", 1200, 600]]) {
  const svg = card(W, H);
  writeFileSync(out(`assets/${file}.svg`), svg);
  await sharp(Buffer.from(svg), { density: 96 }).png({ compressionLevel: 9 }).toFile(out(`assets/${file}.png`));
}

// Icons from favicon.svg
const fav = readFileSync(out("favicon.svg"));
for (const [file, size] of [["favicon-32.png", 32], ["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512]]) {
  await sharp(fav, { density: 384 }).resize(size, size).png().toFile(out(file === "favicon-32.png" ? file : `assets/${file}`));
}
console.log("social images and icons built");
