/* JayOd Studios — the hero lab.
 *
 * The homepage centrepiece is a working-looking editor: real markup on the left,
 * the page it produces on the right, and a build strip underneath. Three things
 * make it interactive rather than decorative:
 *
 *   1. hovering anything in the preview highlights the code that made it, and
 *      hovering a line of code highlights what it renders — the same affordance
 *      as a browser's element inspector;
 *   2. the build runs on load and can be re-run with the Rebuild control, with
 *      each stage lighting up as it passes;
 *   3. the whole panel tilts towards the pointer.
 *
 * Everything is content, not lorem ipsum: the mock page is a real (fictional)
 * product with real copy, numbers and a chart, and the code beside it is the
 * code that would produce it.
 *
 * The panel is aria-hidden, because it is a demonstration of the studio's work
 * rather than information the page depends on — screen readers get the copy and
 * the buttons above it instead of a maze of fake UI.
 */

import { gsap } from "./vendor/gsap-3.15.0.js";

const lab = document.getElementById("lab");
const lines = Array.from(document.querySelectorAll("#codeLines li"));
const caret = document.getElementById("codeCaret");
const state = document.getElementById("labState");
const caption = document.getElementById("labCaption");
const rebuild = document.getElementById("labRebuild");
const steps = Array.from(document.querySelectorAll("#labSteps li"));
const bars = Array.from(document.querySelectorAll(".mock-bars i"));

const preview = document.getElementById("labPreview");
const cssOut = document.getElementById("labCss");
const announce = document.getElementById("labAnnounce");
const accentButtons = Array.from(document.querySelectorAll("[data-accent]"));
const themeButton = document.getElementById("mockTheme");
const densityButton = document.getElementById("mockDensity");
const statsButton = document.getElementById("mockStats");
const chartButton = document.getElementById("mockChart");
const statsNode = preview ? preview.querySelector(".mock-stats") : null;
const chartNode = preview ? preview.querySelector(".mock-chart") : null;

const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---------- The demo's own settings ----------
 *
 * These change the preview, not the page: the accents and the dark variant are
 * token overrides scoped to .lab-preview, so every mock rule picks the new value
 * up without being touched. The readout shows the declaration that changed.
 */

const PREVIEW = { accent: "navy", dark: false, compact: false, stats: true, chart: true };

const ACCENT_LIGHT = { navy: "#19224d", clay: "#b2603a", moss: "#3f7a4f" };
const ACCENT_DARK = { navy: "#8b9ef0", clay: "#e08a5a", moss: "#6fb583" };

function say(message) {
  if (announce) announce.textContent = message;
}

/* The readout shows the declaration the last control actually changed, so the
   panel is always demonstrating the CSS behind what just happened on screen. */
function renderCss(rule) {
  if (!cssOut) return;
  if (rule) {
    cssOut.textContent = rule;
    return;
  }
  const palette = PREVIEW.dark ? ACCENT_DARK : ACCENT_LIGHT;
  cssOut.textContent = `--accent: ${palette[PREVIEW.accent]};`;
}

function flashPreview() {
  if (!preview || reduceQuery.matches) return;
  gsap.fromTo(preview, { opacity: 0.55 }, { opacity: 1, duration: 0.42, ease: "power2.out" });
}

function applyPreview(rule) {
  if (preview) {
    preview.dataset.mockAccent = PREVIEW.accent;
    if (PREVIEW.dark) preview.dataset.theme = "dark";
    else delete preview.dataset.theme;
    if (PREVIEW.compact) preview.dataset.density = "compact";
    else delete preview.dataset.density;
  }

  accentButtons.forEach((button) => {
    const on = button.dataset.accent === PREVIEW.accent;
    button.setAttribute("aria-pressed", String(on));
    button.classList.toggle("is-active", on);
  });

  themeButton?.setAttribute("aria-pressed", String(PREVIEW.dark));
  densityButton?.setAttribute("aria-pressed", String(PREVIEW.compact));
  statsButton?.setAttribute("aria-pressed", String(PREVIEW.stats));
  chartButton?.setAttribute("aria-pressed", String(PREVIEW.chart));

  // `hidden` takes the section out of the layout and out of the a11y tree in one
  // move — the same thing `display: none` does, without a class to keep in sync.
  if (statsNode) statsNode.hidden = !PREVIEW.stats;
  if (chartNode) chartNode.hidden = !PREVIEW.chart;

  renderCss(rule);
}

accentButtons.forEach((button) => {
  button.addEventListener("click", () => {
    PREVIEW.accent = button.dataset.accent || "navy";
    applyPreview();
    flashPreview();
    say(`Demo accent set to ${button.querySelector(".sr-only")?.textContent || PREVIEW.accent}.`);
  });
});

themeButton?.addEventListener("click", () => {
  PREVIEW.dark = !PREVIEW.dark;
  applyPreview();
  flashPreview();
  say(PREVIEW.dark ? "Demo preview switched to dark." : "Demo preview switched to light.");
});

densityButton?.addEventListener("click", () => {
  PREVIEW.compact = !PREVIEW.compact;
  applyPreview();
  flashPreview();
  say(PREVIEW.compact ? "Demo spacing set to compact." : "Demo spacing set to comfortable.");
});

/* The two section switches change the mock itself rather than its palette: turn
   Stats off and the demo grey box is gone, along with its space in the page. */
statsButton?.addEventListener("click", () => {
  PREVIEW.stats = !PREVIEW.stats;
  applyPreview(`.mock-stats { display: ${PREVIEW.stats ? "grid" : "none"} }`);
  flashPreview();
  say(PREVIEW.stats ? "Stats section shown." : "Stats section hidden.");
});

chartButton?.addEventListener("click", () => {
  PREVIEW.chart = !PREVIEW.chart;
  applyPreview(`.mock-chart { display: ${PREVIEW.chart ? "block" : "none"} }`);
  flashPreview();
  say(PREVIEW.chart ? "Chart section shown." : "Chart section hidden.");
});

const CAPTIONS = {
  idle: "built, checked and shipped in one pass",
  compile: "compiling the stylesheet — nothing above 30 KB",
  bundle: "bundling the script, one module at a time",
  audit: "checking contrast, focus order and landmarks",
  deploy: "shipping to the edge in under a second",
  done: "live — 41 ms to first paint on a cold cache",
};

let running = false;
let timer = 0;

const wait = (ms) =>
  new Promise((resolve) => {
    timer = window.setTimeout(resolve, reduceQuery.matches ? 0 : ms);
  });

function setCaption(text) {
  if (caption) caption.textContent = text;
}

function setState(text, building) {
  if (!state) return;
  state.textContent = text;
  state.classList.toggle("is-building", Boolean(building));
}

/* ---------- Hover linking ---------- */

function highlight(selector, on) {
  if (!selector) return;
  lab?.querySelectorAll(`[data-sel="${selector}"]`).forEach((node) => {
    node.classList.toggle("is-lit", on);
  });
}

function setUpInspector() {
  if (!lab) return;

  lab.querySelectorAll("[data-sel]").forEach((node) => {
    const selector = node.getAttribute("data-sel");

    node.addEventListener("pointerenter", (event) => {
      event.stopPropagation();
      highlight(selector, true);
    });

    node.addEventListener("pointerleave", () => highlight(selector, false));
  });
}

/* ---------- Pointer tilt ---------- */

function setUpTilt() {
  if (!lab || !canHover) return;

  let frame = 0;
  let nextX = 0;
  let nextY = 0;

  lab.addEventListener(
    "pointermove",
    (event) => {
      if (reduceQuery.matches) return;
      const rect = lab.getBoundingClientRect();
      nextY = ((event.clientX - rect.left) / rect.width - 0.5) * 6;
      nextX = -((event.clientY - rect.top) / rect.height - 0.5) * 5;

      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        lab.style.setProperty("--tilt-x", `${nextX.toFixed(2)}deg`);
        lab.style.setProperty("--tilt-y", `${nextY.toFixed(2)}deg`);
        frame = 0;
      });
    },
    { passive: true }
  );

  lab.addEventListener("pointerleave", () => {
    lab.style.setProperty("--tilt-x", "0deg");
    lab.style.setProperty("--tilt-y", "0deg");
  });
}

/* ---------- The build ---------- */

async function typeCode() {
  if (!lines.length) return;

  if (reduceQuery.matches) {
    gsap.set(lines, { opacity: 1, x: 0 });
    return;
  }

  caret?.classList.add("is-typing");
  gsap.set(lines, { opacity: 0, x: -8 });

  await new Promise((resolve) => {
    gsap.to(lines, {
      opacity: 1,
      x: 0,
      duration: 0.26,
      ease: "power1.out",
      stagger: 0.035,
      onComplete: resolve,
    });
  });

  caret?.classList.remove("is-typing");
}

async function runBuild() {
  if (running) return;
  running = true;

  // Reset the strip, then walk it: each stage marks itself active, then done.
  steps.forEach((step) => step.classList.remove("is-active", "is-done"));

  if (rebuild) rebuild.style.pointerEvents = "none";

  setState("building", true);

  for (const step of steps) {
    const name = step.dataset.step;

    step.classList.add("is-active");
    setCaption(CAPTIONS[name] || CAPTIONS.idle);
    setState(name, true);

    // Each stage does something visible, so the strip is not the only feedback.
    if (name === "compile") {
      gsap.fromTo(
        bars,
        { scaleY: 0.06 },
        {
          scaleY: 1,
          duration: reduceQuery.matches ? 0 : 0.5,
          ease: "power2.out",
          stagger: reduceQuery.matches ? 0 : 0.03,
          transformOrigin: "50% 100%",
        }
      );
    }

    if (name === "bundle") {
      gsap.fromTo(
        ".mock-hero h3, .mock-hero p",
        { opacity: 0.3 },
        { opacity: 1, duration: reduceQuery.matches ? 0 : 0.45, stagger: 0.06 }
      );
    }

    if (name === "audit") {
      gsap.fromTo(
        ".mock-stat",
        { opacity: 0.35 },
        { opacity: 1, duration: reduceQuery.matches ? 0 : 0.4, stagger: 0.07 }
      );
    }

    await wait(520);

    step.classList.remove("is-active");
    step.classList.add("is-done");
  }

  setState("live", false);
  setCaption(CAPTIONS.done);

  if (rebuild) rebuild.style.pointerEvents = "";
  running = false;
}

/* ---------- Boot ---------- */

if (lab) {
  applyPreview();
  setUpInspector();
  setUpTilt();

  if (!reduceQuery.matches) {
    typeCode().then(runBuild);
  } else {
    setCaption(CAPTIONS.idle);
  }

  rebuild?.addEventListener("click", () => {
    if (running) return;
    setCaption(CAPTIONS.idle);
    typeCode().then(runBuild);
  });
}

reduceQuery.addEventListener("change", (event) => {
  if (!event.matches) return;
  window.clearTimeout(timer);
  running = false;
  caret?.classList.remove("is-typing");
  lines.forEach((line) => line.classList.remove("is-lit"));
  if (lab) {
    lab.style.setProperty("--tilt-x", "0deg");
    lab.style.setProperty("--tilt-y", "0deg");
  }
});
