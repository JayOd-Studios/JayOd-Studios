/* JayOd Studios — scroll and entrance choreography.
 *
 * Everything here is an enhancement. The page is readable without this file,
 * and no element is hidden until this module has loaded and decided it is safe
 * to animate. Timed failsafes mean a tween that never runs can never leave
 * content invisible.
 *
 * Each section gets a motion that belongs to its job rather than one generic
 * fade: the hero assembles, the work previews draw, the approach rail fills as
 * you scroll past the steps, the studio statement rises word by word.
 */

import { animate as motionAnimate } from "./vendor/motion-14.6.0.js";
import { animate as tween, stagger, utils, cubicBezier } from "./vendor/anime-4.5.0.js";

const EASE = [0.22, 0.61, 0.36, 1];
const ANIME_EASE = cubicBezier(0.22, 0.61, 0.36, 1);
const DURATION = 0.62;
const STEP = 0.06;
const MAX_STEP = 4;

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const targets = Array.from(document.querySelectorAll("[data-reveal]"));

/* ---------- Hero intro ---------- */

const hero = document.querySelector(".hero");

function endIntro() {
  document.documentElement.classList.add("intro-done");
}

function heroIntro() {
  if (!hero) {
    endIntro();
    return;
  }

  if (motionQuery.matches) {
    endIntro();
    return;
  }

  const title = hero.querySelector(".hero-title");
  const lines = Array.from(hero.querySelectorAll(".hero-title .line-inner"));
  const copy = [".eyebrow", ".hero-lede", ".hero-actions"]
    .map((selector) => hero.querySelector(selector))
    .filter(Boolean);
  const visual = hero.querySelector(".hero-visual");

  try {
    tween(title, { opacity: [0, 1], duration: 260, ease: ANIME_EASE });
    tween(lines, {
      translateY: ["108%", "0%"],
      duration: 940,
      delay: stagger(105, { start: 90 }),
      ease: ANIME_EASE,
    });
    tween(copy, {
      opacity: [0, 1],
      translateY: ["14px", "0px"],
      duration: 640,
      delay: stagger(95, { start: 300 }),
      ease: ANIME_EASE,
    });
    if (visual) {
      tween(visual, {
        opacity: [0, 1],
        scale: [0.99, 1],
        translateY: ["20px", "0px"],
        duration: 900,
        delay: 340,
        ease: ANIME_EASE,
      });
    }
  } catch {
    /* If the tween cannot run the CSS release below still shows everything. */
  }

  window.setTimeout(endIntro, 1450);
}

/* ---------- Scroll reveals ---------- */

const staged = new Map();
let observer = null;

function settle(el) {
  el.style.opacity = "";
  el.style.transform = "";
}

function stage(el) {
  const siblings = el.parentElement
    ? Array.from(el.parentElement.querySelectorAll(":scope > [data-reveal]"))
    : [];
  const index = Math.min(Math.max(siblings.indexOf(el), 0), MAX_STEP);

  el.style.opacity = "0";
  el.style.transform = "translateY(16px)";
  staged.set(el, index * STEP);
}

function reveal(el) {
  const delay = staged.get(el) ?? 0;
  staged.delete(el);
  el.classList.add("is-visible");

  try {
    const controls = motionAnimate(
      el,
      { opacity: [0, 1], transform: ["translateY(16px)", "translateY(0px)"] },
      { duration: DURATION, delay, easing: EASE }
    );
    controls?.finished?.then(() => settle(el), () => settle(el));
  } catch {
    settle(el);
  }

  window.setTimeout(() => settle(el), (DURATION + delay) * 1000 + 400);
}

function revealAll() {
  staged.forEach((_delay, el) => {
    el.classList.add("is-visible");
    settle(el);
  });
  staged.clear();
  observer?.disconnect();
  observer = null;
}

function startReveals() {
  if (!targets.length || !("IntersectionObserver" in window)) return;

  targets.forEach((el) => {
    // Anything already on screen keeps its painted state — hiding it here would
    // flash the content out and back in after first paint.
    if (el.getBoundingClientRect().top <= window.innerHeight * 0.95) {
      el.classList.add("is-visible");
      return;
    }
    stage(el);
  });

  if (!staged.size) return;

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        reveal(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );

  staged.forEach((_delay, el) => observer.observe(el));
}

/* ---------- Section rules ---------- */

function startSections() {
  const sections = Array.from(document.querySelectorAll("main section"));
  if (!sections.length || !("IntersectionObserver" in window)) return;

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-entered");
        sectionObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.02, rootMargin: "-10% 0px -20% 0px" }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

/* ---------- Work cards draw themselves in ---------- */

function startCardDraw() {
  const cards = Array.from(document.querySelectorAll(".card"));
  if (!cards.length || !("IntersectionObserver" in window) || motionQuery.matches) return;

  const draw = (card) => {
    const shapes = card.querySelectorAll(".preview > *");
    if (!shapes.length) return;
    try {
      utils.set(shapes, { opacity: 0 });
      tween(shapes, {
        opacity: [0, 1],
        duration: 560,
        delay: stagger(9),
        ease: ANIME_EASE,
      });
    } catch {
      utils.set(shapes, { opacity: 1 });
    }
  };

  const cardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        cardObserver.unobserve(entry.target);
        draw(entry.target);
      });
    },
    { threshold: 0.25, rootMargin: "0px 0px -60px 0px" }
  );

  cards.forEach((card) => cardObserver.observe(card));
}

/* ---------- Approach rail ---------- */

const rail = document.getElementById("stepsRail");
const stepsTrack = document.querySelector(".steps-track");
const steps = Array.from(document.querySelectorAll(".step"));

function updateRail() {
  if (!rail || !stepsTrack) return;

  const rect = stepsTrack.getBoundingClientRect();
  const start = window.innerHeight * 0.82;
  const end = window.innerHeight * 0.42;
  const total = rect.height + (start - end);
  const travelled = start - rect.top;
  const progress = total > 0 ? Math.min(1, Math.max(0, travelled / total)) : 0;

  rail.style.transform = `scaleX(${progress.toFixed(3)})`;

  const span = 1 / Math.max(steps.length, 1);
  steps.forEach((step, index) => {
    step.classList.toggle("is-passed", progress >= index * span + 0.02);
  });
}

/* ---------- Studio statement, word by word ---------- */

function startStatement() {
  const statement = document.getElementById("studioStatement");
  if (!statement || motionQuery.matches) return;

  const text = statement.textContent.replace(/\s+/g, " ").trim();
  if (!text) return;

  // Wrapping words in spans keeps the sentence intact for screen readers and
  // for copy/paste: the spaces between them stay real text nodes.
  const words = text.split(" ");
  statement.textContent = "";

  const nodes = words.map((word, index) => {
    const span = document.createElement("span");
    span.className = "word";
    span.textContent = word;
    statement.append(span);
    if (index < words.length - 1) statement.append(document.createTextNode(" "));
    return span;
  });

  try {
    utils.set(nodes, { opacity: 0, translateY: "0.45em" });
  } catch {
    return;
  }

  const wordObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        wordObserver.disconnect();
        try {
          tween(nodes, {
            opacity: [0, 1],
            translateY: ["0.45em", "0em"],
            duration: 620,
            delay: stagger(13),
            ease: ANIME_EASE,
          });
        } catch {
          /* Falls through to the fail-safe below. */
        }
        // Words must never stay invisible, whatever happened above.
        window.setTimeout(() => utils.set(nodes, { opacity: 1, translateY: "0em" }), 2400);
      });
    },
    { threshold: 0.3 }
  );

  wordObserver.observe(statement);
}

/* ---------- Reading progress ---------- */

const progressBar = document.getElementById("progressBar");

function updateProgress() {
  if (!progressBar) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  progressBar.style.transform = `scaleX(${ratio})`;
}

/* ---------- Hero spotlight ---------- */

const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

function startSpotlight() {
  if (!hero || !canHover) return;
  let frame = 0;
  let nextX = 50;
  let nextY = 38;

  hero.addEventListener(
    "pointermove",
    (event) => {
      const rect = hero.getBoundingClientRect();
      nextX = ((event.clientX - rect.left) / rect.width) * 100;
      nextY = ((event.clientY - rect.top) / rect.height) * 100;

      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        hero.style.setProperty("--mx", `${nextX}%`);
        hero.style.setProperty("--my", `${nextY}%`);
        frame = 0;
      });
    },
    { passive: true }
  );
}

/* ---------- Boot ---------- */

if (!motionQuery.matches) {
  heroIntro();
  startReveals();
  startSections();
  startCardDraw();
  startStatement();
  startSpotlight();
} else {
  endIntro();
}

if (rail) {
  updateRail();
}

let railFrame = 0;
function onScroll() {
  updateProgress();
  if (!rail || railFrame) return;
  railFrame = window.requestAnimationFrame(() => {
    updateRail();
    railFrame = 0;
  });
}

onScroll();
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);

// Someone can switch reduced motion on mid-session: settle everything and stop
// the pointer effect rather than leaving content stranded behind a dead tween.
motionQuery.addEventListener("change", (event) => {
  if (!event.matches) return;
  revealAll();
  endIntro();
  if (rail) rail.style.transform = "scaleX(1)";
  steps.forEach((step) => step.classList.add("is-passed"));
});
