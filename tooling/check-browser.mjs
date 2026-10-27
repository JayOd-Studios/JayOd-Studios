/* The glyph field, measured in a real browser rather than reasoned about.
 *
 *   NODE_PATH=/tmp/pw/node_modules node tooling/check-browser.mjs
 *
 * jsdom has no layout and tooling/check-field.cjs works from synthetic frames, so
 * neither can answer the two questions that actually matter here:
 *
 *   1. is the field where motion.js and icons-boot.js think it is — does any glyph
 *      land on the frame, and how much of each one is inside the viewport?
 *   2. does anything move after the first paint? The complaint this work answers
 *      was glyphs appearing at the stylesheet's slots and then jumping, so the
 *      check records every glyph's transform at the first animation frame and
 *      again two seconds later, and compares the two.
 *
 * Playwright is installed under /tmp (see the README's Checks section) because it
 * is a development tool, not a dependency of the site.
 */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = "/workspace/chats/4ecd652189b715e6263ad7a5";
const WIDTH = 1440;
const HEIGHT = 900;
const PORT = 3123;

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".xml": "application/xml",
  ".txt": "text/plain",
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://localhost:${PORT}`);
  const file = path.join(ROOT, decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname));

  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    response.writeHead(404).end("not found");
    return;
  }

  response.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(response);
});

await new Promise((resolve) => server.listen(PORT, resolve));

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: Boolean(ok), detail });

const probe = () => {
  const field = document.getElementById("iconField");
  const shell = document.getElementById("labShell");
  if (!field || !shell) return null;

  const fieldRect = field.getBoundingClientRect();
  const frame = shell.getBoundingClientRect();
  const frameBox = { x: frame.left - fieldRect.left, y: frame.top - fieldRect.top, w: frame.width, h: frame.height };
  const chips = [...field.querySelectorAll(".ip")];

  const measured = chips.map((chip) => {
    const rect = chip.getBoundingClientRect();
    const box = { x: rect.left - fieldRect.left, y: rect.top - fieldRect.top, w: rect.width, h: rect.height };
    const area = box.w * box.h || 1;
    const overlapW = Math.max(0, Math.min(box.x + box.w, frameBox.x + frameBox.w) - Math.max(box.x, frameBox.x));
    const overlapH = Math.max(0, Math.min(box.y + box.h, frameBox.y + frameBox.h) - Math.max(box.y, frameBox.y));
    const insideW = Math.max(0, Math.min(box.x + box.w, fieldRect.width) - Math.max(box.x, 0));
    const insideH = Math.max(0, Math.min(box.y + box.h, fieldRect.height) - Math.max(box.y, 0));

    return {
      band: chip.dataset.band,
      size: Number(chip.dataset.size),
      transform: chip.style.transform,
      left: getComputedStyle(chip).left,
      top: getComputedStyle(chip).top,
      visible: (insideW * insideH) / area,
      overFrame: (overlapW * overlapH) / area,
    };
  });

  return { fieldRect: { w: fieldRect.width, h: fieldRect.height }, frameBox, measured };
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });

const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(String(error)));

/* Every animation frame, from the first one Chrome produces — which can be
   *before* the parser has reached the end of the document, and is therefore the
   frame that used to show the field in the wrong place.

   The rule is not "placed at the first frame"; it is "never shown unplaced".
   Until icons-boot.js has run, the stylesheet keeps the field hidden, so an early
   frame shows nothing at all — and the check below asserts exactly that, rather
   than assuming when the parser will get there. */
await page.addInitScript(() => {
  window.__frames = [];

  const snap = (label) => {
    const field = document.getElementById("iconField");
    const shell = document.getElementById("labShell");
    if (!field || !shell) return;

    const chips = [...field.querySelectorAll(".ip")];
    if (!chips.length) return;

    const fieldRect = field.getBoundingClientRect();
    const frame = shell.getBoundingClientRect();

    window.__frames.push({
      label,
      ready: document.documentElement.classList.contains("icons-ready"),
      visibility: getComputedStyle(field).visibility,
      frame: [
        Math.round(frame.left - fieldRect.left),
        Math.round(frame.top - fieldRect.top),
        Math.round(frame.width),
        Math.round(frame.height),
      ],
      placed: chips.filter((chip) => /translate\(/.test(chip.style.transform)).length,
      glyphs: chips.map((chip) => chip.style.transform),
    });
  };

  requestAnimationFrame(function loop() {
    snap("raf");
    if (window.__frames.length < 240) requestAnimationFrame(loop);
  });

  document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(() => snap("dom")));
});

await page.goto(`http://localhost:${PORT}/`, { waitUntil: "load" });
await page.waitForTimeout(2200);

const frames = await page.evaluate(() => window.__frames);
const atLoad = await page.evaluate(probe);
const firstFrame = frames[0];
const afterParse = frames.find((frame) => frame.label === "dom") || frames[frames.length - 1];
const early = frames.filter((frame) => !frame.ready);

check("no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
check(
  "no frame ever showed the field before it was placed",
  early.every((frame) => frame.visibility === "hidden"),
  `${early.length} unplaced frames, ${early.filter((f) => f.visibility !== "hidden").length} of them visible`
);
check(
  "the field is fully placed by the first frame after parsing",
  afterParse && afterParse.ready && afterParse.placed === 56,
  `${afterParse?.placed} of 56, ready=${afterParse?.ready}`
);
/* The frame's box is measured inside the field, and the field itself starts below
   the masthead — so a small positive y here is already *under* the header. What
   matters is that the bubble is inset on all four sides and lands inside the
   field, not that its y clears some absolute threshold. */
const isBubble = (frame) =>
  Boolean(frame) &&
  frame[0] > 20 &&
  frame[1] >= 20 &&
  frame[2] < WIDTH - 20 &&
  frame[1] + frame[3] <= Math.round(HEIGHT - 61) + 1;

check("the opening frame is the bubble, below the masthead", isBubble(afterParse?.frame), JSON.stringify(afterParse?.frame));
check(
  "the frame was already the bubble on the very first frame",
  isBubble(firstFrame?.frame),
  JSON.stringify(firstFrame?.frame)
);
check("the glyph count the page actually renders", atLoad.measured.length === 56, `${atLoad.measured.length}`);
check(
  "no glyph sits over the frame at load",
  atLoad.measured.every((glyph) => glyph.overFrame < 0.02),
  `worst ${(Math.max(...atLoad.measured.map((g) => g.overFrame)) * 100).toFixed(1)}%`
);
check(
  "every glyph is at least 78% inside the field at load",
  atLoad.measured.every((glyph) => glyph.visible > 0.78),
  `worst ${(Math.min(...atLoad.measured.map((g) => g.visible)) * 100).toFixed(1)}%`
);
check(
  "the stylesheet's slot is not added to the transform",
  atLoad.measured.every((glyph) => glyph.left === "0px" && glyph.top === "0px"),
  `${atLoad.measured.filter((g) => g.left !== "0px").length} glyphs still carry a slot offset`
);
check(
  "nothing moved after the first paint",
  afterParse &&
    afterParse.glyphs.every((before, index) => {
      const after = atLoad.measured[index].transform;
      if (!before || !after) return false;
      const [bx, by] = before.match(/-?[\d.]+/g).map(Number);
      const [ax, ay] = after.match(/-?[\d.]+/g).map(Number);
      return Math.abs(bx - ax) < 12 && Math.abs(by - ay) < 12;
    }),
  "the field would be migrating from its fallback slots"
);

await page.screenshot({ path: `${ROOT}/artifacts/field-open.png` });

/* Mid-morph and docked: the same questions, with the frame in its other state
   and the copy's words on screen. */
await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.45));
await page.waitForTimeout(1400);
const mid = await page.evaluate(probe);
await page.screenshot({ path: `${ROOT}/artifacts/field-mid.png` });

await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.1));
await page.waitForTimeout(1600);
const docked = await page.evaluate(probe);
await page.screenshot({ path: `${ROOT}/artifacts/field-docked.png` });

const dockedFrame = docked.frameBox;
check("the frame docked as it scrolled", dockedFrame.w < atLoad.frameBox.w - 100, `${Math.round(dockedFrame.w)} vs ${Math.round(atLoad.frameBox.w)}`);
check(
  "no glyph sits over the docked frame either",
  docked.measured.every((glyph) => glyph.overFrame < 0.02),
  `worst ${(Math.max(...docked.measured.map((g) => g.overFrame)) * 100).toFixed(1)}%`
);
check(
  "every glyph is still at least 78% visible when docked",
  docked.measured.every((glyph) => glyph.visible > 0.78),
  `worst ${(Math.min(...docked.measured.map((g) => g.visible)) * 100).toFixed(1)}%`
);
check(
  "the copy is on screen when docked",
  (await page.evaluate(() => Number(getComputedStyle(document.getElementById("heroCopy")).opacity))) > 0.9
);
check(
  "mid-morph is between the two frames",
  mid.frameBox.w < atLoad.frameBox.w && mid.frameBox.w > dockedFrame.w,
  `${Math.round(atLoad.frameBox.w)} -> ${Math.round(mid.frameBox.w)} -> ${Math.round(dockedFrame.w)}`
);

/* The six drawn previews, in both themes — the part of this that is judged by
   eye rather than by number. The theme is set explicitly rather than assumed:
   headless Chrome reports `prefers-color-scheme: light`, so a run that does not
   say which deck it wants gets light twice and compares nothing. */
async function capture(theme) {
  await page.evaluate((value) => localStorage.setItem("jayod-theme", value), theme);
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(1500);
  // Centre the grid and let the reveal finish: the card previews draw themselves
  // in shape by shape, and a screenshot taken mid-stagger shows the second row
  // still at 12% — which says nothing about the artwork.
  await page.evaluate(() => document.getElementById("workGrid").scrollIntoView({ block: "center" }));
  await page.waitForTimeout(2800);
  await page.locator("#workGrid").screenshot({ path: `${ROOT}/artifacts/previews-${theme}.png` });

  return page.evaluate(() => {
    const photo = document.querySelector("svg.preview .pv-img-a");
    const words = document.querySelector("svg.preview text");
    return {
      theme: document.documentElement.dataset.theme,
      photo: photo ? getComputedStyle(photo).fill : "none",
      words: words ? getComputedStyle(words).fill : "none",
    };
  });
}

const darkShot = await capture("dark");
const lightShot = await capture("light");

check(
  "the artwork is inked from the tokens in the dark deck",
  darkShot.theme === "dark" && darkShot.photo !== "none" && darkShot.photo !== "rgba(0, 0, 0, 0)" && darkShot.words !== "none",
  `${darkShot.theme}: ${darkShot.photo} / ${darkShot.words}`
);
check(
  "and re-inks itself in the light deck",
  lightShot.theme === "light" && lightShot.photo !== "none" && lightShot.photo !== darkShot.photo,
  `${lightShot.theme}: ${lightShot.photo} (dark was ${darkShot.photo})`
);

console.log(`viewport ${WIDTH}x${HEIGHT}, ${atLoad.measured.length} glyphs\n`);

let failed = 0;
for (const result of results) {
  if (!result.ok) failed += 1;
  console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.name}${result.detail ? `  (${result.detail})` : ""}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
console.log(`screenshots: artifacts/field-open.png, field-mid.png, field-docked.png, previews-dark.png, previews-light.png`);

await browser.close();
server.close();
process.exit(failed ? 1 : 0);
