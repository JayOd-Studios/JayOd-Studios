/* Structural + runtime smoke test for the redesign.
 * Not a browser: jsdom has no layout, so this proves the markup binds, the
 * modules load and the generated cards carry real content — not that the
 * animations look right.
 */
import fs from "node:fs";
import { JSDOM } from "jsdom";

const ROOT = "/workspace/chats/4ecd652189b715e6263ad7a5";
const html = fs.readFileSync(`${ROOT}/index.html`, "utf8");

const dom = new JSDOM(html, { pretendToBeVisual: true, url: "http://localhost/" });
const { window } = dom;

window.matchMedia = (query) => ({
  matches: false,
  media: query,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
});
window.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
window.IntersectionObserver = class {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
};
window.scrollTo = () => {};

globalThis.window = window;
globalThis.document = window.document;
globalThis.Window = window.Window;
globalThis.HTMLElement = window.HTMLElement;
globalThis.Element = window.Element;
globalThis.Node = window.Node;
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.ResizeObserver = window.ResizeObserver;
globalThis.IntersectionObserver = window.IntersectionObserver;
// Node has no rAF/cAF; a browser does, and GSAP's ticker expects them globally.
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: Boolean(ok), detail });

/* ---- classic scripts ---- */
for (const file of ["previews.js", "portfolio.js", "app.js", "theme-boot.js", "icons-boot.js"]) {
  try {
    window.eval(fs.readFileSync(`${ROOT}/${file}`, "utf8"));
    check(`eval ${file}`, true);
  } catch (error) {
    check(`eval ${file}`, false, error.message);
  }
}

const doc = window.document;
const css = fs.readFileSync(`${ROOT}/styles.css`, "utf8");

/* ---- hero lab ---- */
check("hero lab present", Boolean(doc.getElementById("lab")));
check("code lines rendered", doc.querySelectorAll("#codeLines li").length === 12, `${doc.querySelectorAll("#codeLines li").length} lines`);
check("mock nodes for inspection", doc.querySelectorAll("#lab [data-sel]").length >= 10, `${doc.querySelectorAll("#lab [data-sel]").length} nodes`);
check("build strip stages", doc.querySelectorAll("#labSteps li").length === 4);
check("rebuild control", Boolean(doc.getElementById("labRebuild")));
check("mock chart bars", doc.querySelectorAll(".mock-bars i").length === 9);
check("mock copy is real", /Every account/.test(doc.querySelector(".mock-hero h3")?.textContent || ""));
check("mock stats have numbers", /\$284,102/.test(doc.querySelector(".mock-stats")?.textContent || ""));

/* ---- hero stage and controls ---- */
check("hero stage + copy + shell", Boolean(doc.getElementById("heroStage") && doc.getElementById("heroCopy") && doc.getElementById("labShell")));
check("lab is announced, not hidden", !doc.getElementById("lab")?.hasAttribute("aria-hidden") && Boolean(doc.getElementById("lab")?.getAttribute("aria-label")));
check("preview stays decorative", doc.getElementById("labPreview")?.getAttribute("aria-hidden") === "true");
check("three accent swatches", doc.querySelectorAll("[data-accent]").length === 3, `${doc.querySelectorAll("[data-accent]").length}`);
check("swatches expose pressed state", [...doc.querySelectorAll("[data-accent]")].every((b) => b.hasAttribute("aria-pressed") && b.tagName === "BUTTON"));
check("preview toggles are buttons", doc.querySelectorAll("#mockTheme, #mockDensity").length === 2 && [...doc.querySelectorAll("#mockTheme, #mockDensity")].every((b) => b.tagName === "BUTTON" && b.hasAttribute("aria-pressed")));
check("rebuild is a button", doc.getElementById("labRebuild")?.tagName === "BUTTON");
check("live region for changes", doc.getElementById("labAnnounce")?.getAttribute("aria-live") === "polite");
check("css readout present", (doc.getElementById("labCss")?.textContent || "").includes("--accent"));
check(
  "section switches are buttons in a labelled group",
  ["mockStats", "mockChart"].every((id) => doc.getElementById(id)?.tagName === "BUTTON") &&
    doc.getElementById("mockStats")?.closest("[role=group]")?.getAttribute("aria-labelledby") === "toolSections"
);
check(
  "section switches start pressed",
  ["mockStats", "mockChart"].every((id) => doc.getElementById(id)?.getAttribute("aria-pressed") === "true")
);

/* ---- the hero opens full-screen, decided before the modules load ---- */
const root = doc.documentElement;
check("theme-boot sets the full-screen hero class early", root.classList.contains("hero-mega"));
check("theme-boot keeps the intro fail-safe", root.classList.contains("motion-ok"));

/* ---- FAQ ---- */
check("faq group", Boolean(doc.getElementById("faqGroup")));
check("faq items", doc.querySelectorAll(".hs-accordion").length === 4, `${doc.querySelectorAll(".hs-accordion").length} items`);
check(
  "faq toggles wired to panels",
  [...doc.querySelectorAll(".faq-toggle")].every((b) => doc.getElementById(b.getAttribute("aria-controls")))
);
check("faq panels have text", [...doc.querySelectorAll(".faq-panel")].every((p) => (p.textContent || "").trim().length > 60));

/* ---- work cards ---- */
const cards = [...doc.querySelectorAll(".card")];
check("six cards built", cards.length === 6, `${cards.length} cards`);
check(
  "every card has a preview overlay with content",
  cards.every((c) => {
    const overlay = c.querySelector(".preview-overlay");
    return overlay && (overlay.querySelector(".preview-domain")?.textContent || "").includes(".") && (overlay.querySelector(".preview-word")?.textContent || "").trim().length > 2;
  })
);
check("every card has tags", cards.every((c) => c.querySelectorAll(".card-tags li").length >= 3));
check("every card has a summary", cards.every((c) => (c.querySelector(".card-summary")?.textContent || "").length > 40));
/* The artwork is the six sample sites, drawn: not blank boxes, not type-as-bars. */
const previews = cards.map((c) => c.querySelector("svg.preview"));
const drawn = cards.map((c) => (c.querySelector("svg.preview")?.textContent || ""));
const PREVIEW_COPY = ["$284,102", "The long walk home", "$48", "Meet Signal Nine", "atlas", "HALDEN"];

check("previews are drawn", previews.every(Boolean));
check(
  "every preview draws a whole page",
  previews.every((p) => p.querySelectorAll("*").length >= 24),
  previews.map((p) => p.querySelectorAll("*").length).join(",")
);
check(
  "every preview carries real words",
  previews.every((p) => p.querySelectorAll("text").length >= 8),
  previews.map((p) => p.querySelectorAll("text").length).join(",")
);
check(
  "the copy belongs to the sample project, not a placeholder",
  PREVIEW_COPY.every((marker, index) => drawn[index].includes(marker)),
  drawn.map((t) => t.trim().slice(0, 14)).join(" | ")
);
check(
  "photographs are drawn and clipped to their frames",
  previews.filter((p) => p.querySelectorAll("clipPath").length).length >= 3,
  previews.map((p) => p.querySelectorAll("clipPath").length).join(",")
);

/* ---- sections and numbering ---- */
const ids = [...doc.querySelectorAll("main section[id]")].map((s) => s.id);
check("section ids", ids.join(",") === "top,work,services,faq,approach,studio,contact", ids.join(","));
const numbers = [...doc.querySelectorAll(".section-head .index")].map((p) => (p.textContent || "").trim().split(" ")[0]);
check("section numbering sequential", numbers.join(",") === "01,02,03,04,05,06", numbers.join(","));
check("faq in footer nav", Boolean(doc.querySelector('.footer-nav a[href="#faq"]')));

/* ---- modules ---- */
for (const file of ["motion.js", "hero.js", "icons.js"]) {
  try {
    await import(`${ROOT}/${file}`);
    check(`import ${file}`, true);
  } catch (error) {
    check(`import ${file}`, false, error.message.split("\n")[0]);
  }
}

/* ---- morph boot: the module confirms the opening frame ---- */
const shell = doc.getElementById("labShell");
const motionSrc = fs.readFileSync(`${ROOT}/motion.js`, "utf8");
check("motion module confirms the full-screen hero", root.classList.contains("hero-live"));
/* jsdom has no layout, so the frame cannot be measured here. What it can prove is
   that the frame is the stylesheet's, at the right scale, and that motion.js
   reads that box instead of recomputing a second copy of the same arithmetic —
   which is what puts the panel in the right place on the very first paint. The
   measured version of this lives in tooling/check-field.cjs and the browser check. */
check(
  "the bubble inset is a clamp on the same numbers",
  /--frame-inset-x: clamp\(28px, 7\.5vw, 140px\)/.test(css) && /--frame-inset-y: clamp\(20px, 6vh, 88px\)/.test(css)
);
check(
  "the opening frame is drawn by the stylesheet",
  /html\.hero-mega \.lab-shell \{[\s\S]*?width: calc\(100% - 2 \* var\(--frame-inset-x\)\)/.test(css)
);
check(
  "motion.js measures that frame rather than recomputing it",
  /const shellRect = shell\.getBoundingClientRect\(\)/.test(motionSrc) && !/const insetX =/.test(motionSrc)
);
check(
  "the frame is no longer hidden while it waits for a module",
  !/html\.hero-mega:not\(\.hero-live\) \.lab-shell/.test(css)
);
check(
  "opening frame opens on the bubble radius",
  parseFloat(shell?.style.getPropertyValue("--lab-radius") || "0") > 20,
  shell?.style.getPropertyValue("--lab-radius")
);
check(
  "invisible cta is not reachable",
  doc.querySelector(".hero-actions")?.hasAttribute("inert") === true &&
    doc.querySelector(".hero-actions")?.getAttribute("aria-hidden") === "true"
);
check("heading stays in the accessibility tree", !doc.getElementById("heroCopy")?.hasAttribute("aria-hidden"));

/* ---- controls actually change the demo ---- */
const preview = doc.getElementById("labPreview");
const cssOut = doc.getElementById("labCss");

doc.querySelector('.swatch[data-accent="clay"]').click();
check("accent control applies to preview", preview?.dataset.mockAccent === "clay", preview?.dataset.mockAccent);
check("accent control updates css readout", (cssOut?.textContent || "").includes("#b2603a"), cssOut?.textContent);
check(
  "accent control moves pressed state",
  doc.querySelector('.swatch[data-accent="clay"]')?.getAttribute("aria-pressed") === "true" &&
    doc.querySelector('.swatch[data-accent="navy"]')?.getAttribute("aria-pressed") === "false"
);

doc.getElementById("mockTheme").click();
check("dark toggle applies", preview?.dataset.theme === "dark", preview?.dataset.theme);
check("dark toggle updates readout", (cssOut?.textContent || "").includes("#e08a5a"), cssOut?.textContent);

doc.getElementById("mockDensity").click();
check("density toggle applies", preview?.dataset.density === "compact", preview?.dataset.density);
check("changes are announced", (doc.getElementById("labAnnounce")?.textContent || "").length > 4, doc.getElementById("labAnnounce")?.textContent);

doc.querySelector('.swatch[data-accent="moss"]').click();
check("accent switches again", preview?.dataset.mockAccent === "moss" && (cssOut?.textContent || "").includes("#6fb583"));

/* ---- feature switches remove real sections from the mock ---- */
const statsNode = preview.querySelector(".mock-stats");
const chartNode = preview.querySelector(".mock-chart");

doc.getElementById("mockStats").click();
check("stats switch hides the section", statsNode?.hidden === true);
check("stats switch reads out the rule", (cssOut?.textContent || "").includes(".mock-stats { display: none }"), cssOut?.textContent);
check("stats switch updates pressed state", doc.getElementById("mockStats")?.getAttribute("aria-pressed") === "false");
check("stats switch is announced", /Stats section hidden/.test(doc.getElementById("labAnnounce")?.textContent || ""));

doc.getElementById("mockChart").click();
check("chart switch hides the section", chartNode?.hidden === true);
check("chart switch reads out the rule", (cssOut?.textContent || "").includes(".mock-chart { display: none }"), cssOut?.textContent);

doc.getElementById("mockStats").click();
check("sections come back", statsNode?.hidden === false && /display: grid/.test(cssOut?.textContent || ""));

/* ---- the glyph field ---- */
const iconField = doc.getElementById("iconField");
const glyphs = [...doc.querySelectorAll("#iconField .ip")];
const bootSrc = fs.readFileSync(`${ROOT}/icons-boot.js`, "utf8");

check("glyph field is decorative", iconField?.getAttribute("aria-hidden") === "true");
check("glyph field sits inside the hero stage", iconField?.closest("#heroStage") === doc.getElementById("heroStage"));
check("56 glyphs, filling all four bands", glyphs.length === 56, `${glyphs.length}`);
check(
  "drawings and marks both count as glyphs",
  glyphs.every((g) => Boolean(g.querySelector("svg path, svg circle, svg rect, svg ellipse")) || g.classList.contains("ip--mark"))
);
check(
  "the four bands are all populated",
  ["left", "right", "top", "bottom"].every((band) => glyphs.filter((g) => g.dataset.band === band).length >= 12),
  ["left", "right", "top", "bottom"].map((band) => `${band}:${glyphs.filter((g) => g.dataset.band === band).length}`).join(" ")
);
check("every glyph has a tone", glyphs.every((g) => /^[1-6]$/.test(g.dataset.tone || "")));
check(
  "all six tones are used",
  new Set(glyphs.map((g) => g.dataset.tone)).size === 6,
  [...new Set(glyphs.map((g) => g.dataset.tone))].join("")
);
check(
  "every glyph size is on the 4px scale",
  glyphs.every((g) => [28, 32, 36, 44].includes(Number(g.dataset.size))),
  [...new Set(glyphs.map((g) => g.dataset.size))].join(",")
);
check("glyphs take no pointer events", /\.icon-field \{[^}]*pointer-events: none/.test(css));
check(
  "56 home slots are defined in CSS",
  (css.match(/\.ip:nth-child\(\d+\)/g) || []).length === 56,
  `${(css.match(/\.ip:nth-child\(\d+\)/g) || []).length}`
);
check(
  "the slots are generated, not hand-written",
  /ip-slots:start/.test(css) && /tooling\/build-icons\.cjs/.test(css)
);
check(
  "the field is hidden below its breakpoint",
  /max-width: 1023px\)[\s\S]{0,90}display: none/.test(css),
  "no max-width: 1023px rule hiding .icon-field"
);

/* ---- the field is placed before the first paint ---- */
check("icons-boot runs as a classic script", /<script src="icons-boot\.js"><\/script>/.test(html));
check(
  "it runs before the modules that animate the field",
  html.indexOf("icons-boot.js") < html.indexOf("icons.js") && html.indexOf("icons-boot.js") < html.indexOf("motion.js")
);
check("it confirms placement on <html>", root.classList.contains("icons-ready"));
check(
  "the field stays unpainted until it has been placed",
  /html\.js:not\(\.icons-ready\) \.icon-field \{[\s\S]{0,60}visibility: hidden/.test(css) &&
    /classList\.add\("js"\)/.test(fs.readFileSync(`${ROOT}/theme-boot.js`, "utf8"))
);
check(
  "a glyph is placed by its transform alone",
  /chip\.style\.left = "0px"/.test(bootSrc) && /chip\.style\.top = "0px"/.test(bootSrc),
  "the stylesheet slot would otherwise be added to the transform"
);
check(
  "the layout is derived from the measured frame",
  /function plan\(view\)/.test(bootSrc) && /inflate\(view\.shell, EDGE\)/.test(bootSrc)
);
check(
  "the copy's words are measured as rects, not as a full-width box",
  /range\.getClientRects\(\)/.test(bootSrc)
);
check(
  "icons.js reads that layout rather than inventing its own",
  /layoutField\.layout\(\)/.test(fs.readFileSync(`${ROOT}/icons.js`, "utf8"))
);

/* ---- the wireframe control ---- */
const wire = doc.getElementById("mockWire");
check("wireframe control is a button", wire?.tagName === "BUTTON" && wire.hasAttribute("aria-pressed"));
wire.click();
check("wireframe applies to the preview", preview?.dataset.wire === "on", preview?.dataset.wire);
check("wireframe reads out the declaration", (cssOut?.textContent || "").includes("[data-wire]"), cssOut?.textContent);
check("wireframe is announced", /wireframe/i.test(doc.getElementById("labAnnounce")?.textContent || ""));
check("wireframe mode has styles", /\.lab-preview\[data-wire="on"\]/.test(css));
wire.click();
check("wireframe toggles back off", preview?.dataset.wire === undefined && wire.getAttribute("aria-pressed") === "false");

/* ---- reduced motion never gets the full-screen hero ---- */
const reduced = new JSDOM(html, { url: "http://localhost/" });
reduced.window.matchMedia = (query) => ({
  matches: query.includes("prefers-reduced-motion"),
  media: query,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
});
/* jsdom's window.eval runs in Node's scope, so hand the boot script its own
   window and document explicitly — the same isolation the browser gives it. */
new Function("window", "document", fs.readFileSync(`${ROOT}/theme-boot.js`, "utf8"))(
  reduced.window,
  reduced.window.document
);
const rRoot = reduced.window.document.documentElement;
check("reduced motion skips the full-screen hero", !rRoot.classList.contains("hero-mega"));
check("reduced motion releases the intro copy", rRoot.classList.contains("intro-done"));

/* ---- report ---- */
let failed = 0;
for (const r of results) {
  if (!r.ok) failed += 1;
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  (${r.detail})` : ""}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
