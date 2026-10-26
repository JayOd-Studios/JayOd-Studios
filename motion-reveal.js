/* JayOd Studios — scroll reveals, animated with Motion (motion.dev).
 *
 * Progressive enhancement: nothing here is required for the page to work. The
 * markup is fully visible without this file, and elements are only hidden once
 * this module has loaded and decided it is safe to animate them, so a failed or
 * blocked module leaves the page readable rather than blank.
 *
 * Motion handles the tween through the Web Animations API; observation stays
 * with IntersectionObserver so the animation engine is never a precondition for
 * content appearing.
 */

import { animate } from "./vendor/motion-14.6.0.js";

const EASE = [0.22, 0.61, 0.36, 1];
const DURATION = 0.62;
const STEP = 0.06;
const MAX_STEP = 4;

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const targets = Array.from(document.querySelectorAll("[data-reveal]"));

/** Elements this module is responsible for un-hiding. */
const staged = new Map();
let observer = null;

function stage(el) {
  const siblings = el.parentElement
    ? Array.from(el.parentElement.querySelectorAll(":scope > [data-reveal]"))
    : [];
  const index = Math.min(Math.max(siblings.indexOf(el), 0), MAX_STEP);

  el.style.opacity = "0";
  el.style.transform = "translateY(14px)";
  staged.set(el, index * STEP);
}

/** Drop the inline hidden state, leaving the element at its natural style. */
function settle(el) {
  el.style.opacity = "";
  el.style.transform = "";
}

function reveal(el) {
  const delay = staged.get(el) ?? 0;
  staged.delete(el);

  try {
    const controls = animate(
      el,
      { opacity: [0, 1], transform: ["translateY(14px)", "translateY(0px)"] },
      { duration: DURATION, delay, easing: EASE }
    );
    controls?.finished?.then(() => settle(el), () => settle(el));
  } catch {
    settle(el);
  }

  // Last resort: an element must never stay invisible because an animation
  // silently failed to run or resolve. Clearing the inline state after the
  // animation should have finished leaves the page readable either way.
  window.setTimeout(() => settle(el), (DURATION + delay) * 1000 + 400);
}

function revealAll() {
  staged.forEach((_delay, el) => settle(el));
  staged.clear();
  observer?.disconnect();
  observer = null;
}

function start() {
  if (!targets.length || !("IntersectionObserver" in window)) return;

  targets.forEach((el) => {
    // Anything already on screen at load keeps its painted state: hiding it here
    // would flash the content out and back in after first paint.
    if (el.getBoundingClientRect().top <= window.innerHeight * 0.95) return;
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
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  staged.forEach((_delay, el) => observer.observe(el));
}

if (!motionQuery.matches) start();

// Someone can switch reduced motion on mid-session; settle everything instead of
// leaving content stranded at opacity 0 behind an animation that will not run.
motionQuery.addEventListener("change", (event) => {
  if (event.matches) revealAll();
});
