#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PUBLIC_DIR = resolve(ROOT, "public");
const LOGO_PATH = resolve(PUBLIC_DIR, "images/logo.png");
const OUT_PATH = resolve(PUBLIC_DIR, "og-image.jpg");
const TMP_SVG = resolve(ROOT, ".og-image.tmp.svg");
const TMP_BG = resolve(ROOT, ".og-image.bg.png");

const WIDTH = 1200;
const HEIGHT = 630;

const COLORS = {
  cream: "#FAF9F6",
  yaleBlue: "#0F4D92",
  yaleBlueDark: "#0A3A70",
  ink: "#1B2433",
  gold: "#E0AB4A",
  muted: "#5B677A",
};

const TITLE = "Math Made Simple";
const PRODUCT = "selectNsolve Basic\u2122";
const TAGLINE = "Solve equations together in Google Sheets\u2122";
const SUBLINE = "Built for students, teachers, and engineers.";
const BRAND = "My Engineering Project";
const URL_LINE = "myengineeringproject.com";

if (!existsSync(LOGO_PATH)) {
  console.error(`Logo not found at ${LOGO_PATH}`);
  process.exit(1);
}

const FONT = "DejaVu Sans, Inter, Helvetica, Arial, sans-serif";

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${COLORS.cream}"/>
      <stop offset="100%" stop-color="#F3EFE3"/>
    </linearGradient>
    <linearGradient id="leftPanel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${COLORS.yaleBlue}"/>
      <stop offset="100%" stop-color="${COLORS.yaleBlueDark}"/>
    </linearGradient>
    <radialGradient id="leftGlow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#1A60AE" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#0F4D92" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad)"/>

  <!-- Top accent bar (gold) -->
  <rect x="0" y="0" width="${WIDTH}" height="10" fill="${COLORS.gold}"/>
  <!-- Bottom accent bar (Yale blue) -->
  <rect x="0" y="${HEIGHT - 10}" width="${WIDTH}" height="10" fill="${COLORS.yaleBlue}"/>

  <!-- Left brand panel -->
  <rect x="0" y="10" width="450" height="${HEIGHT - 20}" fill="url(#leftPanel)"/>
  <rect x="0" y="10" width="450" height="${HEIGHT - 20}" fill="url(#leftGlow)"/>

  <!-- Decorative gold rings on left panel -->
  <circle cx="225" cy="315" r="180" fill="none" stroke="${COLORS.gold}" stroke-width="2" stroke-opacity="0.35"/>
  <circle cx="225" cy="315" r="150" fill="none" stroke="${COLORS.gold}" stroke-width="1.5" stroke-opacity="0.25"/>

  <!-- Cream disc that will hold the compass logo (composited later) -->
  <circle cx="225" cy="315" r="135" fill="${COLORS.cream}"/>

  <!-- Eyebrow / product tag -->
  <g transform="translate(495, 130)">
    <rect x="0" y="0" rx="22" ry="22" width="320" height="44"
          fill="${COLORS.cream}" stroke="${COLORS.gold}" stroke-width="2"/>
    <circle cx="22" cy="22" r="6" fill="${COLORS.gold}"/>
    <text x="40" y="29" font-family="${FONT}"
          font-size="18" font-weight="700" fill="${COLORS.yaleBlue}"
          letter-spacing="1.5">${PRODUCT}</text>
  </g>

  <!-- Headline -->
  <text x="495" y="270" font-family="${FONT}"
        font-size="64" font-weight="700" fill="${COLORS.ink}"
        textLength="640" lengthAdjust="spacingAndGlyphs">${TITLE}</text>

  <!-- Tagline -->
  <text x="495" y="335" font-family="${FONT}"
        font-size="26" font-weight="400" fill="${COLORS.muted}">${TAGLINE}</text>
  <text x="495" y="372" font-family="${FONT}"
        font-size="22" font-weight="400" fill="${COLORS.muted}">${SUBLINE}</text>

  <!-- Divider -->
  <rect x="495" y="430" width="60" height="4" fill="${COLORS.gold}"/>

  <!-- Brand wordmark + URL -->
  <text x="495" y="490" font-family="${FONT}"
        font-size="34" font-weight="700" fill="${COLORS.yaleBlue}">${BRAND}</text>
  <text x="495" y="525" font-family="${FONT}"
        font-size="20" font-weight="400" fill="${COLORS.muted}">${URL_LINE}</text>
</svg>
`;

mkdirSync(PUBLIC_DIR, { recursive: true });
writeFileSync(TMP_SVG, svg, "utf8");

try {
  // 1) Render SVG background to PNG.
  execFileSync(
    "magick",
    [
      "-density",
      "144",
      "-background",
      COLORS.cream,
      TMP_SVG,
      "-resize",
      `${WIDTH}x${HEIGHT}`,
      TMP_BG,
    ],
    { stdio: "inherit" },
  );

  // 2) Composite the compass logo on top of the cream disc.
  //    Disc is centered at (225, 315) with radius 135, so logo box is 240x240
  //    centered there: x=105, y=195.
  execFileSync(
    "magick",
    [
      TMP_BG,
      "(",
      LOGO_PATH,
      "-fuzz",
      "8%",
      "-transparent",
      "white",
      "-resize",
      "230x230",
      ")",
      "-geometry",
      "+110+200",
      "-composite",
      "-quality",
      "92",
      "-strip",
      "-interlace",
      "Plane",
      "-sampling-factor",
      "4:2:0",
      "-colorspace",
      "sRGB",
      OUT_PATH,
    ],
    { stdio: "inherit" },
  );

  console.log(`Wrote ${OUT_PATH}`);
} finally {
  for (const p of [TMP_SVG, TMP_BG]) {
    if (existsSync(p)) unlinkSync(p);
  }
}
