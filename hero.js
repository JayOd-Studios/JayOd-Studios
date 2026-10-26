/* JayOd Studios — hero stage.
 *
 * The homepage's centrepiece: a browser frame whose contents assemble
 * themselves, hold, dissolve, and rebuild as a different kind of site. It is
 * the studio's pitch made literal — websites being built properly — rather than
 * a decorative gradient behind text.
 *
 * All four drawings come from wireframes.js, the same source the work cards
 * use. The stage is decorative (aria-hidden), so it never carries information
 * that only motion reveals.
 */

import { animate, stagger, utils, cubicBezier } from "./vendor/anime-4.5.0.js";

const EASE = cubicBezier(0.22, 0.61, 0.36, 1);
const HOLD = 1100;
const TOUR_STEP = 430;
const BUILD = 620;
const DISSOLVE = 320;

const LAYOUTS = [
  { kind: "dashboard", url: "northwind.app/ledger", label: "Ledger dashboard — React, TypeScript" },
  { kind: "editorial", url: "fieldnotes.co", label: "Editorial journal — Next.js, MDX" },
  { kind: "commerce", url: "marrowsupply.com", label: "Storefront — Shopify, custom theme" },
  { kind: "documentation", url: "docs.atlas.dev", label: "Documentation — search, versioning" },
  { kind: "studio", url: "halden.studio", label: "Studio portfolio — HTML, CSS" },
];

const stage = document.getElementById("stage");
const frame = document.getElementById("stageFrame");
const canvas = document.getElementById("stageCanvas");
const urlEl = document.getElementById("stageUrl");
const labelEl = document.getElementById("stageLabel");
const cursor = document.getElementById("stageCursor");

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let running = false;
let generation = 0;
let index = 0;
// app.js paints the first frame before this module runs, so start in sync.
let rendered = 0;

/* `documentation` is the real layout key; keep the data readable above. */
function kindOf(layout) {
  return layout.kind === "documentation" ? "docs" : layout.kind;
}

function paint(layout) {
  if (!canvas || !window.buildWireframe) return [];
  const svg = window.buildWireframe(kindOf(layout), {
    chrome: false,
    className: "preview preview--stage",
  });
  // Replace only the drawing: the ghost cursor lives in the same box.
  canvas.querySelectorAll("svg").forEach((old) => old.remove());
  canvas.append(svg);

  if (urlEl) urlEl.textContent = layout.url;
  if (labelEl) labelEl.textContent = layout.label;

  return Array.from(svg.children);
}

function shapesNow() {
  const svg = canvas?.querySelector("svg");
  return svg ? Array.from(svg.children) : [];
}

function svgRoot() {
  return canvas?.querySelector("svg") || null;
}

function show(shapes) {
  try {
    utils.set(shapes, { opacity: 1 });
  } catch {
    /* Nothing to settle. */
  }
}

async function build(shapes) {
  // Only opacity is animated per shape. On an SVG <rect>, "y" is the geometry
  // attribute — animating it would reset every rectangle to y=0 and collapse
  // the drawing. The scale lives on the <svg> root instead.
  utils.set(shapes, { opacity: 0 });

  const root = svgRoot();
  if (root) {
    animate(root, { scale: [0.992, 1], duration: BUILD + 160, ease: EASE });
  }

  try {
    await animate(shapes, {
      opacity: [0, 1],
      duration: BUILD,
      delay: stagger(16),
      ease: EASE,
    });
  } catch {
    show(shapes);
  }
}

/* The pointer visits a few points of the layout and "clicks" once. On an HTML
   element x/y are transforms, so this is safe — unlike on an SVG rect. */
async function cursorTour() {
  if (!cursor || !canvas || motionQuery.matches) return;

  const box = canvas.getBoundingClientRect();
  const route = [
    [0.14, 0.32],
    [0.42, 0.2],
    [0.68, 0.58],
    [0.46, 0.78],
  ];

  try {
    utils.set(cursor, { x: 0, y: 0, scale: 0.6, opacity: 0 });
    await animate(cursor, { opacity: [0, 1], scale: [0.6, 1], duration: 240, ease: EASE });

    for (const [x, y] of route) {
      await animate(cursor, {
        x: box.width * x,
        y: box.height * y,
        duration: TOUR_STEP,
        ease: EASE,
      });
    }

    await animate(cursor, { scale: [1, 1.6, 1], duration: 300, ease: EASE });
    await animate(cursor, { opacity: [1, 0], duration: 220, ease: EASE });
  } catch {
    utils.set(cursor, { opacity: 0 });
  }
}

async function dissolve(shapes) {
  try {
    await animate(shapes, {
      opacity: [1, 0],
      duration: DISSOLVE,
      delay: stagger(5, { from: "last" }),
      ease: EASE,
    });
  } catch {
    show(shapes);
  }
}

async function run() {
  const mine = ++generation;
  running = true;

  while (running && mine === generation) {
    if (rendered !== index) {
      paint(LAYOUTS[index]);
      rendered = index;
    }

    const shapes = shapesNow();
    if (!shapes.length) {
      running = false;
      return;
    }

    await build(shapes);
    if (!running || mine !== generation) {
      show(shapes);
      return;
    }

    await cursorTour();
    if (!running || mine !== generation) {
      show(shapes);
      return;
    }

    await sleep(HOLD);
    if (!running || mine !== generation) {
      show(shapes);
      return;
    }

    await dissolve(shapes);
    if (!running || mine !== generation) {
      show(shapes);
      return;
    }

    index = (index + 1) % LAYOUTS.length;
    rendered = -1;
  }
}

/* ---------- Pointer tilt ---------- */

function setUpTilt() {
  if (!stage || !frame || !canHover) return;

  let frameRequest = 0;
  let tiltX = 0;
  let tiltY = 0;

  frame.addEventListener(
    "pointermove",
    (event) => {
      if (motionQuery.matches) return;
      const rect = frame.getBoundingClientRect();
      tiltY = ((event.clientX - rect.left) / rect.width - 0.5) * 7;
      tiltX = -((event.clientY - rect.top) / rect.height - 0.5) * 6;

      if (frameRequest) return;
      frameRequest = window.requestAnimationFrame(() => {
        frame.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
        frame.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
        frameRequest = 0;
      });
    },
    { passive: true }
  );

  frame.addEventListener("pointerleave", () => {
    frame.style.setProperty("--tilt-x", "0deg");
    frame.style.setProperty("--tilt-y", "0deg");
  });
}

/* ---------- Boot ---------- */

if (canvas && window.buildWireframe) {
  if (motionQuery.matches) {
    // One static frame, no loop.
    const layout = LAYOUTS[index];
    if (!canvas.querySelector("svg")) paint(layout);
    show(shapesNow());
  } else {
    setUpTilt();
    run();
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    running = false;
    generation += 1;
  } else if (!motionQuery.matches) {
    run();
  }
});

motionQuery.addEventListener("change", (event) => {
  if (event.matches) {
    running = false;
    generation += 1;
    show(shapesNow());
  } else if (!document.hidden) {
    run();
  }
});
