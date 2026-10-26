/* JayOd Studios — interaction motion, animated with Anime.js (animejs.com).
 *
 * Deliberately narrow: Anime.js runs the small, interactive moments (the arrow
 * redraw on hover/focus, the availability pulse, the invalid-form bump) rather
 * than the page's scroll reveals, which Motion owns. Nothing here is required
 * for the page to function.
 */

import { animate, svg, utils, cubicBezier } from "./vendor/anime-4.5.0.js";

const EASE_OUT = cubicBezier(0.22, 0.61, 0.36, 1);
const EASE_SOFT = cubicBezier(0.4, 0, 0.6, 1);

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ---------- Arrow redraw on primary buttons ---------- */

function setUpArrows() {
  document.querySelectorAll(".btn").forEach((btn) => {
    const path = btn.querySelector(".icon-arrow path");
    if (!path) return;

    let drawable;
    try {
      [drawable] = svg.createDrawable(path, 0, 1);
    } catch {
      return; // Not a measurable path — leave the static arrow alone.
    }
    if (!drawable) return;

    let tween = null;

    const redraw = () => {
      if (motionQuery.matches) return;
      tween?.cancel();
      utils.set(drawable, { draw: "0 0" });
      tween = animate(drawable, { draw: "0 1", duration: 420, ease: EASE_OUT });
    };

    const settle = () => {
      tween?.cancel();
      tween = null;
      utils.set(drawable, { draw: "0 1" });
    };

    btn.addEventListener("pointerenter", redraw);
    btn.addEventListener("pointerleave", settle);
    btn.addEventListener("focus", () => {
      if (btn.matches(":focus-visible")) redraw();
    });
    btn.addEventListener("blur", settle);
  });
}

/* ---------- Availability pulse ---------- */

const dots = document.querySelectorAll(".status-dot");
let pulse = null;

function startPulse() {
  if (!dots.length || pulse) return;
  pulse = animate(dots, {
    scale: [1, 1.26],
    opacity: [1, 0.72],
    duration: 1900,
    loop: true,
    alternate: true,
    ease: EASE_SOFT,
  });
}

function stopPulse() {
  pulse?.cancel();
  pulse = null;
  if (dots.length) utils.set(dots, { scale: 1, opacity: 1 });
}

/* ---------- Invalid form feedback ---------- */

document.addEventListener("jayod:invalid", () => {
  if (motionQuery.matches) return;
  const fields = document.querySelectorAll(".field.has-error");
  if (!fields.length) return;
  animate(fields, { x: [0, -4, 4, 0], duration: 340, ease: EASE_OUT });
});

/* ---------- Boot ---------- */

try {
  setUpArrows();
  if (!motionQuery.matches) startPulse();
} catch {
  // Motion is an enhancement; a failure here must never affect the page.
}

motionQuery.addEventListener("change", (event) => {
  if (event.matches) stopPulse();
  else startPulse();
});
