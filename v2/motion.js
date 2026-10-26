/* JayOd Studios — Motion layer: scroll reveals, reading progress, hero spotlight.
 *
 * Everything here is an enhancement. The page is readable without this file,
 * and no element is hidden until this module has loaded and decided it is safe
 * to animate. Timed failsafes mean a tween that never runs can never leave
 * content invisible.
 */

import { animate } from "./vendor/motion-14.6.0.js";

const EASE = [0.22, 0.61, 0.36, 1];
const DURATION = 0.62;
const STEP = 0.06;
const MAX_STEP = 4;

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const targets = Array.from(document.querySelectorAll("[data-reveal]"));

/* ---------- Reveals ---------- */

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
    const controls = animate(
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

/* ---------- Reading progress ---------- */

const progressBar = document.getElementById("progressBar");

function updateProgress() {
  if (!progressBar) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  progressBar.style.transform = `scaleX(${ratio})`;
}

/* ---------- Hero spotlight ---------- */

const hero = document.querySelector(".hero");
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

function startSpotlight() {
  if (!hero || !canHover) return;
  let frame = 0;
  let nextX = 50;
  let nextY = 40;

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
  startReveals();
  startSpotlight();
}

if (progressBar) {
  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
}

// Someone can switch reduced motion on mid-session: settle everything and stop
// the pointer effect rather than leaving content stranded behind a dead tween.
motionQuery.addEventListener("change", (event) => {
  if (event.matches) revealAll();
});
