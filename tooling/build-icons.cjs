/* Generates the hero's glyph field: the markup in index.html and the
 * no-JavaScript slot positions in styles.css, from one table.
 *
 *   node tooling/build-icons.cjs           # write
 *   node tooling/build-icons.cjs --check   # fail if the files are out of date
 *
 * Why a generator rather than 56 hand-written spans: the fallback slots and the
 * markup have to agree glyph for glyph, and the band/size assignment is what
 * tooling/check-field.cjs measures. Editing either by hand is how a glyph ends up
 * standing behind the frame. Run this, then run the check.
 *
 * The drawing space for a glyph is 24 x 24 with a 1.7px stroke, the same as the
 * rest of the page's line art; the mark glyphs (`</>`, `=>`) are set in the
 * monospace face instead of drawn.
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const HTML = path.join(ROOT, "index.html");
const CSS = path.join(ROOT, "styles.css");

const SVG_OPEN =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">';

/* ---------- The table ----------
 * 56 glyphs: 16 down each side, 12 across the top and 12 underneath. Bands are
 * explicit rather than positional so a glyph can be moved between them without
 * renumbering anything.
 */

const GLYPHS = [
  /* --- left, upper --- */
  { band: "left", svg: '<path d="M9 6 4 12l5 6M15 6l5 6-5 6"/>' }, // code
  { band: "left", svg: '<path d="M9.4 4c-1.8 0-1.8 2.4-1.8 4.2S5.6 12 4 12c1.6 0 3.6.9 3.6 3.8S7.6 20 9.4 20M14.6 4c1.8 0 1.8 2.4 1.8 4.2S18.4 12 20 12c-1.6 0-3.6.9-3.6 3.8S16.4 20 14.6 20"/>' }, // braces
  { band: "left", svg: '<path d="M4 7.5l4 4.5-4 4.5M12 17h7"/>' }, // terminal
  { band: "left", svg: '<circle cx="7" cy="6" r="2.2"/><circle cx="7" cy="18" r="2.2"/><circle cx="17" cy="8.6" r="2.2"/><path d="M7 8.2v7.6M9.2 6h5.8a2 2 0 0 1 2 2v.6"/>' }, // git branch
  { band: "left", svg: '<path d="M9.5 4 7 20M17 4l-2.5 16M4.5 9.5h15M4 15h15"/>' }, // hash
  { band: "left", svg: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>' }, // database
  { band: "left", svg: '<path d="M7 18h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.5-1A4.5 4.5 0 0 0 7 18Z"/>' }, // cloud
  { band: "left", svg: '<path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z"/>' }, // lightning

  /* --- left, lower --- */
  { band: "left", svg: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 13 9 5 9-5"/>' }, // layers
  { band: "left", svg: '<rect x="4" y="4" width="7" height="7" rx="1.8"/><rect x="13" y="4" width="7" height="7" rx="1.8"/><rect x="4" y="13" width="7" height="7" rx="1.8"/><rect x="13" y="13" width="7" height="7" rx="1.8"/>' }, // grid
  { band: "left", svg: '<circle cx="12" cy="12" r="1.9"/><ellipse cx="12" cy="12" rx="9.2" ry="3.8"/><ellipse cx="12" cy="12" rx="9.2" ry="3.8" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.2" ry="3.8" transform="rotate(-60 12 12)"/>' }, // react
  { band: "left", svg: '<path d="M6 3.5v15l4.1-4.3 2.5 5.1 2.6-1.3-2.5-5.1 5.9-.5L6 3.5Z"/>' }, // pointer
  { band: "left", svg: '<path d="M4.5 11.5a10.6 10.6 0 0 1 15 0M8 15a5.8 5.8 0 0 1 8 0M12 18.6h.01"/>' }, // wifi
  { band: "left", svg: '<circle cx="12" cy="12" r="8.4"/><path d="m8.2 12.4 2.7 2.7 4.9-5.3"/>' }, // shipped
  { band: "left", svg: '<path d="M4 12h14m-5.5-5.5L18 12l-5.5 5.5"/>' }, // arrow
  { band: "left", svg: '<circle cx="12" cy="12" r="3.4"/><path d="M12 3.2v3M12 17.8v3M3.2 12h3M17.8 12h3M6 6l2.1 2.1M15.9 15.9 18 18M18 6l-2.1 2.1M8.1 15.9 6 18"/>' }, // cog

  /* --- right, upper --- */
  { band: "right", svg: '<path d="M12 2.8 20.6 8v8L12 21.2 3.4 16V8L12 2.8Z"/><path d="M12 21.2V12l8.6-4M12 12 3.4 8"/>' }, // cube
  { band: "right", svg: '<path d="M8 7l-4 5 4 5M16 7l4 5-4 5"/>' }, // chevrons
  { band: "right", svg: '<path d="M10 3H7.6A2.6 2.6 0 0 0 5 5.6v3.8L3 12l2 2.6v3.8A2.6 2.6 0 0 0 7.6 21H10M14 3h2.4A2.6 2.6 0 0 1 19 5.6v3.8l2 2.6-2 2.6v3.8A2.6 2.6 0 0 1 16.4 21H14"/>' }, // template
  { band: "right", svg: '<rect x="3.2" y="4.6" width="17.6" height="14.8" rx="2.4"/><path d="M3.2 8.6h17.6"/><circle cx="6.2" cy="6.6" r=".6"/><circle cx="8.2" cy="6.6" r=".6"/>' }, // browser
  { band: "right", svg: '<rect x="3.2" y="5" width="17.6" height="14" rx="2.4"/><path d="M3.2 9h17.6M6.8 12.8l2.4 2-2.4 2M11.6 16.8h5"/>' }, // shell
  { band: "right", svg: '<rect x="4.6" y="10.6" width="14.8" height="9.8" rx="2.2"/><path d="M8.2 10.6V7.8a3.8 3.8 0 0 1 7.6 0v2.8M12 14.4v2.4"/>' }, // lock
  { band: "right", svg: '<circle cx="8.4" cy="15.6" r="3.4"/><path d="m10.9 13.1 7.6-7.6M16.2 7.8l2 2M18.4 5.6l2 2"/>' }, // key
  { band: "right", svg: '<path d="M12 3.4 19 6v6.1c0 4-3 6.6-7 8.5-4-1.9-7-4.5-7-8.5V6l7-2.6Z"/>' }, // shield

  /* --- right, lower --- */
  { band: "right", svg: '<path d="M8.4 4.4 10 6.6M15.6 4.4 14 6.6"/><rect x="7.4" y="8.4" width="9.2" height="11" rx="4.6"/><path d="M7 11.4H3.6M20.4 11.4H17M7 16.4l-3 1.8M17 16.4l3 1.8"/>' }, // bug
  { band: "right", svg: '<rect x="3.6" y="4.4" width="16.8" height="6" rx="1.8"/><rect x="3.6" y="13.6" width="16.8" height="6" rx="1.8"/><path d="M7 7.4h.01M7 16.6h.01"/>' }, // servers
  { band: "right", svg: '<rect x="7.4" y="7.4" width="9.2" height="9.2" rx="1.8"/><path d="M12 3.4v4M12 16.6v4M3.4 12h4M16.6 12h4M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18"/>' }, // chip
  { band: "right", svg: '<rect x="3.4" y="4.6" width="17.2" height="11.4" rx="2"/><path d="M9 20h6M12 16v4"/>' }, // monitor
  { band: "right", svg: '<rect x="7.4" y="3.2" width="9.2" height="17.6" rx="2.6"/><path d="M11 6.2h2M12 17.8h.01"/>' }, // phone
  { band: "right", svg: '<path d="M10.4 13.6a3.6 3.6 0 0 0 5.1 0l3-3a3.6 3.6 0 0 0-5.1-5.1l-1 1"/><path d="M13.6 10.4a3.6 3.6 0 0 0-5.1 0l-3 3a3.6 3.6 0 0 0 5.1 5.1l1-1"/>' }, // links
  { band: "right", svg: '<circle cx="12" cy="12" r="8.4"/><path d="M3.6 12h16.8M12 3.6c2.4 2.4 3.4 5.4 3.4 8.4s-1 6-3.4 8.4c-2.4-2.4-3.4-5.4-3.4-8.4s1-6 3.4-8.4Z"/>' }, // globe
  { band: "right", svg: '<circle cx="11" cy="11" r="6.4"/><path d="m15.8 15.8 4 4"/>' }, // search

  /* --- top --- */
  { band: "top", svg: '<path d="M4 8h6M14 8h6M4 16h10M18 16h2"/><circle cx="12" cy="8" r="2"/><circle cx="16" cy="16" r="2"/>' }, // tokens
  { band: "top", svg: '<path d="M4 20l1-4L16 5l3 3L8 19l-4 1Z"/><path d="m14 7 3 3"/>' }, // pencil
  { band: "top", svg: '<path d="M3.6 12.6 11.6 4.6h8.8v8.8l-8 8-8.8-8.8Z"/><circle cx="16.6" cy="7.4" r="1.4"/>' }, // tag
  { band: "top", svg: '<path d="M7 3.8h10v16.4l-5-4-5 4V3.8Z"/>' }, // bookmark
  { band: "top", svg: '<path d="M3.6 5.4h16.8l-6.6 7.2v6.6l-3.6 2v-8.6L3.6 5.4Z"/>' }, // funnel
  { band: "top", svg: '<path d="M11 3.6l1.6 4.4 4.4 1.6-4.4 1.6L11 15.6 9.4 11.2 5 9.6l4.4-1.6L11 3.6Z"/><path d="M17.6 15.2l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z"/>' }, // sparkle
  { band: "top", svg: '<path d="M12 3.6l2.6 5.4 5.8.8-4.2 4 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.2-4 5.8-.8L12 3.6Z"/>' }, // star
  { band: "top", svg: '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.4V12l3.2 2"/>' }, // clock
  { band: "top", mark: "</>" },
  { band: "top", mark: "{ }" },
  { band: "top", mark: "=>" },
  { band: "top", mark: "#!" },

  /* --- bottom --- */
  { band: "bottom", svg: '<path d="M3.4 6.6h6.2l2 2.4h9v10H3.4v-12.4Z"/>' }, // folder
  { band: "bottom", svg: '<path d="M6 3.6h7l5 5v11.8H6V3.6Z"/><path d="M13 3.6v5h5"/>' }, // file
  { band: "bottom", svg: '<rect x="3.6" y="4.6" width="16.8" height="14.8" rx="2"/><path d="M3.6 9.4h16.8M3.6 14.4h16.8M10 4.6v14.8"/>' }, // table
  { band: "bottom", svg: '<circle cx="12" cy="12" r="8.4"/><path d="M12 3.6V12h8.4"/>' }, // pie
  { band: "bottom", svg: '<path d="M12 3.2c3.2 2.2 4.8 5.4 4.8 9.2L18 15.6H6l1.2-3.2C7.2 8.6 8.8 5.4 12 3.2Z"/><path d="M9.6 15.6 8 20l4-1.6 4 1.6-1.6-4.4M12 9.6h.01"/>' }, // launch
  { band: "bottom", svg: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20.4 4.4V10h-5.6"/>' }, // rebuild
  { band: "bottom", svg: '<circle cx="12" cy="12" r="3.4"/><path d="M2.8 12h5.8M15.4 12h5.8"/>' }, // commit
  { band: "bottom", svg: '<circle cx="6" cy="6" r="2.2"/><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="12" r="2.2"/><path d="M8.2 6h4a2.4 2.4 0 0 1 2.4 2.4v2.2M8.2 18h4a2.4 2.4 0 0 0 2.4-2.4v-2.2"/>' }, // merge
  { band: "bottom", mark: "[ ]" },
  { band: "bottom", mark: "( )" },
  { band: "bottom", mark: ";" },
  { band: "bottom", mark: "//" },
];

/* Sizes come from the 4px scale; the strips above and below the frame are only
   ~30px tall once it is open, so nothing larger than 32px stands in them. */
const SIZES = {
  left: [44, 32, 36, 28],
  right: [28, 36, 32, 44],
  top: [28, 32, 28, 28],
  bottom: [28, 28, 32, 28],
};

const BAND_ORDER = ["left", "right", "top", "bottom"];

function sizeClass(size) {
  if (size === 28) return "ip ip--xs";
  if (size === 32) return "ip ip--s";
  if (size === 44) return "ip ip--l";
  return "ip";
}

function escapeMark(mark) {
  return mark.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function hash(n) {
  return ((n * 2654435761) % 1000) / 1000;
}

/* The no-JavaScript arrangement: a scatter around the hero rather than around the
   frame, because without scripting the hero is the stacked layout and the field
   covers the whole of it. Two columns beside the copy, a row over the top and a
   row along the bottom — the same shape the measured layout produces, without
   needing to measure anything. */
function slots() {
  const out = [];
  const counts = {};
  const round = (value) => Math.round(value * 10) / 10;

  GLYPHS.forEach((glyph, index) => {
    const position = counts[glyph.band] === undefined ? 0 : counts[glyph.band];
    counts[glyph.band] = position + 1;
    const band = glyph.band;
    let x;
    let y;

    if (band === "left" || band === "right") {
      const spread = position / 15;
      x = band === "left" ? 3 + 10 * hash(index + 3) : 87 + 10 * hash(index + 3);
      y = 4 + spread * 90 + (hash(index + 7) - 0.5) * 4;
    } else {
      const spread = position / 11;
      x = 8 + spread * 84;
      y = band === "top" ? 2 + 5 * hash(index + 5) : 93 + 5 * hash(index + 5);
    }

    out.push({ index, x: round(x), y: round(y) });
  });

  return out;
}

function markup() {
  const counts = {};
  const lines = ['      <div class="icon-field" id="iconField" aria-hidden="true">'];

  GLYPHS.forEach((glyph) => {
    const position = counts[glyph.band] === undefined ? 0 : counts[glyph.band];
    counts[glyph.band] = position + 1;

    const size = SIZES[glyph.band][position % SIZES[glyph.band].length];
    const tone = ((position * 5 + BAND_ORDER.indexOf(glyph.band)) % 6) + 1;
    const classes = sizeClass(size) + (glyph.mark ? " ip--mark" : "");
    const body = glyph.mark ? escapeMark(glyph.mark) : `${SVG_OPEN}${glyph.svg}</svg>`;

    lines.push(
      `        <span class="${classes}" data-band="${glyph.band}" data-size="${size}" data-tone="${tone}">${body}</span>`
    );
  });

  lines.push("      </div>");

  return lines.join("\n");
}

function cssBlock() {
  const lines = [
    "/* ip-slots:start — generated by tooling/build-icons.cjs from the glyph table.",
    " * The no-JavaScript arrangement, and what a visitor sees for the moment before",
    " * icons-boot.js runs. Do not hand-edit: re-run the generator. */",
  ];

  slots().forEach((slot) => {
    lines.push(`.ip:nth-child(${slot.index + 1}) {`, `  --x: ${slot.x}%;`, `  --y: ${slot.y}%;`, "}", "");
  });

  lines.push("/* ip-slots:end */");

  return lines.join("\n");
}

/* ---------- Apply ---------- */

const check = process.argv.includes("--check");
let html = fs.readFileSync(HTML, "utf8");
let css = fs.readFileSync(CSS, "utf8");
let changed = false;

const generated = markup();
/* The pattern includes the line's own indentation, and the replacement supplies
   it again. Leaving it outside the match is how a generator quietly adds six
   spaces to its own first line on every run. */
const fieldPattern = /\n[ \t]*<div class="icon-field" id="iconField" aria-hidden="true">[\s\S]*?\n[ \t]*<\/div>/;

if (!fieldPattern.test(html)) {
  console.error("index.html: could not find the icon field to replace");
  process.exit(1);
}

const before = html;
html = html.replace(fieldPattern, `\n${generated}`);
if (html !== before) changed = true;

const markerPattern = /\/\* ip-slots:start[\s\S]*?\/\* ip-slots:end \*\//;
const rulesPattern = /(?:\.ip:nth-child\(\d+\) \{\n  --x: [\d.]+%;\n  --y: [\d.]+%;\n\}\n\n)+/;
const block = cssBlock();

if (markerPattern.test(css)) {
  const beforeCss = css;
  css = css.replace(markerPattern, block);
  if (css !== beforeCss) changed = true;
} else if (rulesPattern.test(css)) {
  const beforeCss = css;
  const previousCount = (css.match(/\.ip:nth-child\(\d+\)/g) || []).length;
  css = css.replace(rulesPattern, block + "\n\n");
  if (css !== beforeCss) changed = true;
  console.log(`replaced ${previousCount} hand-written slots`);
} else {
  console.error("styles.css: could not find the slot block (no marker, no rules)");
  process.exit(1);
}

if (check) {
  if (changed) {
    console.error("the generated field is out of date — run: node tooling/build-icons.cjs");
    process.exit(1);
  }
  console.log("generated field is up to date");
  process.exit(0);
}

fs.writeFileSync(HTML, html);
fs.writeFileSync(CSS, css);

const counts = GLYPHS.reduce((acc, glyph) => {
  acc[glyph.band] = (acc[glyph.band] || 0) + 1;
  return acc;
}, {});

const sizes = GLYPHS.reduce((acc, glyph) => {
  const position = acc[glyph.band] ? acc[glyph.band] : 0;
  const size = SIZES[glyph.band][position % SIZES[glyph.band].length];
  acc[glyph.band] = position + 1;
  acc.sizes = acc.sizes || {};
  acc.sizes[size] = (acc.sizes[size] || 0) + 1;
  return acc;
}, {});

console.log(`${GLYPHS.length} glyphs written: ${JSON.stringify(counts)}`);
console.log(`sizes: ${JSON.stringify(sizes.sizes)}`);
console.log(`drawn: ${GLYPHS.filter((g) => g.svg).length}, marks: ${GLYPHS.filter((g) => g.mark).length}`);
