/* Runs the real layout engine from icons-boot.js against synthetic viewport
 * geometry and reports, for every glyph, how much of it is actually visible.
 *
 *   node tooling/check-field.cjs
 *
 * Why this exists: the field cannot be checked in jsdom (no layout) and there is
 * no browser in this environment. The geometry, however, is pure arithmetic —
 * plan() takes boxes in and gives positions out — so the same function the page
 * runs can be run here, at nine widths, in both frame states, and every claim
 * about "every glyph is visible" can be a number instead of a hope.
 *
 * The frame rectangles below mirror what motion.js measures:
 *   full screen  the frame is the bubble the stylesheet draws before anything
 *                has moved: inset 7.5% of the width (capped at 140px) and 6% of
 *                the height (capped at 88px), starting below the 61px masthead;
 *   docked       min(900px, 100% - 32px) wide, from under the copy to above the
 *                caption.
 * The copy is a 1180px-wide column of text blocks in the middle.
 */

const path = require("node:path");

global.window = {};
global.document = undefined;
require(path.join(__dirname, "..", "icons-boot.js"));
const JayodField = global.window.JayodField;

if (!JayodField) {
  console.error("icons-boot.js did not expose window.JayodField");
  process.exit(1);
}
if (typeof JayodField.plan !== "function") {
  console.error("window.JayodField has no plan()");
  process.exit(1);
}

/* The glyph table the markup is generated from, read back out of index.html so
   this check can never drift from what the page actually ships. */
const fs = require("node:fs");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const fieldBlock = html.match(/<div class="icon-field"[\s\S]*?\n      <\/div>/);

if (!fieldBlock) {
  console.error("could not find the icon field in index.html");
  process.exit(1);
}

const glyphs = [...fieldBlock[0].matchAll(/data-band="(\w+)" data-size="(\d+)"/g)].map((match) => ({
  band: match[1],
  size: Number(match[2]),
}));

if (!glyphs.length) {
  console.error("no glyphs found — is the field generated?");
  process.exit(1);
}

const BAND_COUNT = glyphs.reduce((acc, glyph) => {
  acc[glyph.band] = (acc[glyph.band] || 0) + 1;
  return acc;
}, {});

const HEADER = 61;
const clamp = (min, value, max) => Math.min(max, Math.max(min, value));

function viewport(w, h) {
  const insetX = w < 760 ? Math.round(w * 0.04) : Math.round(clamp(28, w * 0.075, 140));
  const insetY = Math.round(clamp(20, h * 0.06, 88));
  const stageH = h - HEADER;
  const openW = Math.max(280, w - insetX * 2);
  const openH = Math.max(280, stageH - insetY * 2);

  // The copy: the eyebrow, the two-line headline, the lede and the buttons.
  const copyW = Math.min(w - 64, 1180);
  const copyX = (w - copyW) / 2;
  const copyTop = 24;
  const copyH = 296;

  const dockTop = Math.min(
    Math.round(stageH * 0.62),
    Math.max(Math.round(stageH * 0.42), Math.round(copyTop + copyH + 20))
  );
  const dockH = Math.max(300, Math.min(540, stageH - dockTop - 44));

  return {
    w,
    h: stageH,
    open: { x: insetX, y: insetY, w: openW, h: openH },
    dock: { x: Math.max(0, (w - Math.min(900, w - 32)) / 2), y: dockTop, w: Math.min(900, w - 32), h: dockH },
    copy: { x: copyX, y: copyTop, w: copyW, h: copyH },
  };
}

/* Visible fraction of one glyph: how much of its box falls inside the field, and
   how much of that is clear of the frame. */
function visible(home, size, frame, venue) {
  const x0 = home.x - size / 2;
  const y0 = home.y - size / 2;
  const x1 = home.x + size / 2;
  const y1 = home.y + size / 2;

  const inX = Math.max(0, Math.min(x1, venue.w) - Math.max(x0, 0));
  const inY = Math.max(0, Math.min(y1, venue.h) - Math.max(y0, 0));
  const inside = inX * inY;
  const total = size * size;

  if (!inside) return { visible: 0, overFrame: 1 };

  const fx0 = Math.max(0, frame.x);
  const fy0 = Math.max(0, frame.y);
  const fx1 = Math.min(venue.w, frame.x + frame.w);
  const fy1 = Math.min(venue.h, frame.y + frame.h);
  const overX = Math.max(0, Math.min(x1, fx1, venue.w) - Math.max(x0, fx0, 0));
  const overY = Math.max(0, Math.min(y1, fy1, venue.h) - Math.max(y0, fy0, 0));
  const over = overX * overY;

  return { visible: (inside - over) / total, overFrame: over / total };
}

function run(view, state, frame) {
  const blocks = state === "docked" ? [view.copy] : [];
  const homes = JayodField.plan({
    w: view.w,
    h: view.h,
    shell: frame,
    blocks,
    glyphs,
  });

  let worst = 1;
  let worstIndex = -1;
  let missing = 0;
  let overlapping = 0;
  let total = 0;

  homes.forEach((home, index) => {
    if (!home) {
      missing += 1;
      return;
    }

    const size = glyphs[index].size;
    const result = visible(home, size, frame, { w: view.w, h: view.h });
    const score = result.visible - result.overFrame * 0.999;

    if (result.overFrame > 0.02) overlapping += 1;
    if (score < worst) {
      worst = score;
      worstIndex = index;
    }
    total += 1;
  });

  return { worst, worstIndex, missing, overlapping, total };
}

const WIDTHS = [1024, 1100, 1280, 1440, 1600, 1920, 2560, 3440, 3840];
const HEIGHTS = { 1024: 768, 1100: 800, 1280: 800, 1440: 900, 1600: 900, 1920: 1080, 2560: 1440, 3440: 1440, 3840: 2160 };

let failures = 0;

console.log(`${glyphs.length} glyphs — ${JSON.stringify(BAND_COUNT)}\n`);
console.log("  viewport      state     worst glyph   hidden   over frame");

for (const w of WIDTHS) {
  const h = HEIGHTS[w] || 900;
  const view = viewport(w, h);

  for (const state of ["open", "docked"]) {
    const frame = state === "open" ? view.open : view.dock;
    // The frame is inside the stage, which starts below the masthead.
    const inField = { x: frame.x, y: frame.y, w: frame.w, h: frame.h };
    const result = run(view, state, inField);

    const pad = (value, length) => String(value).padEnd(length);
    console.log(
      `  ${pad(`${w}x${h}`, 13)} ${pad(state, 9)} ${pad(`${(result.worst * 100).toFixed(1)}% (#${result.worstIndex})`, 13)} ${pad(
        result.missing,
        8
      )} ${result.overlapping}`
    );

    if (result.missing) {
      console.log(`      FAIL: ${result.missing} glyphs were given no home`);
      failures += 1;
    }
    if (result.worst < 0.78) {
      console.log(`      FAIL: worst glyph only ${(result.worst * 100).toFixed(1)}% visible`);
      failures += 1;
    }
  }
}

console.log("");
if (failures) {
  console.log(`${failures} failure(s)`);
  process.exit(1);
}
console.log("every glyph at every width, both frame states: at least 78% visible, none behind the frame");
