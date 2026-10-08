// Builds the social images and icons from SVG sources.
// Run: npm install && npm run build:social
// Needs the fonts installed on the machine that renders: IM Fell English and Hanken Grotesk
// (both OFL; woff2 files are in /fonts, install the TTFs locally or convert with fonttools).
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
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
  await sharp(Buffer.from(svg), { density: 72 }).png({ compressionLevel: 9 }).toFile(out(`assets/${file}.png`));
}

// Stripe checkout product image: 1024x1024 square, no text (Stripe shows the title beside it).
{
  const S = 1024, ah = 800, aw = 640, ax = (S - aw) / 2, ay = 112;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <radialGradient id="glow" cx="0.5" cy="0.45" r="0.75"><stop offset="0" stop-color="#2e2335"/><stop offset="1" stop-color="${C.ink}"/></radialGradient>
    <radialGradient id="silver" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#f4f1f7"/><stop offset="0.55" stop-color="#bdb6c6"/><stop offset="1" stop-color="#7d7388"/></radialGradient>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#glow)"/>
  <svg x="${ax}" y="${ay}" width="${aw}" height="${ah}" viewBox="0 0 400 500">${inner}</svg>
  <g transform="translate(250 806)">
    <circle r="112" fill="url(#silver)" stroke="#4a3f54" stroke-width="4"/>
    <circle r="92" fill="none" stroke="#6b6075" stroke-width="3"/>
    <path d="M14 -52a52 52 0 1 0 34 66a40 40 0 1 1 -34 -66Z" fill="#6b6075"/>
  </g>
</svg>`;
  writeFileSync(out("assets/stripe-checkout.svg"), svg);
  await sharp(Buffer.from(svg), { density: 72 }).png({ compressionLevel: 9 }).toFile(out("assets/stripe-checkout.png"));
}

// Icons from favicon.svg
const fav = readFileSync(out("favicon.svg"));
for (const [file, size] of [["favicon-32.png", 32], ["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512]]) {
  await sharp(fav, { density: 384 }).resize(size, size).png().toFile(out(file === "favicon-32.png" ? file : `assets/${file}`));
}
console.log("social images and icons built");
