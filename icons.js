/* JayOd Studios — the motion of the hero's floating code field.
 *
 * The layout is not decided here. icons-boot.js works out where every glyph
 * stands and places them before the first paint, and this module reads that back
 * through window.JayodField.layout() once per frame. The split is deliberate: a
 * classic script can lay the field out before the visitor sees anything, and a
 * module can import GSAP for the ticker. Doing the layout here meant the field
 * was painted at its no-JavaScript slots first and then jumped.
 *
 * What is left in this file is three forces and a shockwave:
 *
 *   1. a spring back to each glyph's home slot, so the arrangement never
 *      degrades into a heap in one corner;
 *   2. repulsion from the pointer;
 *   3. repulsion from every other glyph.
 *
 * (2) and (3) are what the visitor feels: sweep the pointer through the field and
 * it opens around the cursor and closes again from the outside in. 56 glyphs is
 * 1,540 pair checks a step, which is nothing; three steps a frame at most.
 *
 * The panel, and the copy's words once they are on screen, are keep-outs, so the
 * glyphs crowd the margin around the frame instead of drifting over the headline.
 *
 * Decorative, and treated as such: the field is aria-hidden and takes no pointer
 * events, so nothing here is on the keyboard path or in the reading order.
 * Reduced motion gets the glyphs standing still at their slots, and below the
 * field's breakpoint the stylesheet hides it entirely — a narrow viewport has no
 * margin to float in.
 */

import { gsap } from "./vendor/gsap-3.15.0.js";

const field = document.getElementById("iconField");
const stage = document.getElementById("heroStage");
const chips = field ? Array.from(field.querySelectorAll(".ip")) : [];
const layoutField = window.JayodField && typeof window.JayodField.layout === "function" ? window.JayodField : null;

const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* Tuning. The forces are accelerations in px/s², so none of this needs
   pixel-per-mass bookkeeping. The home spring is firm because the field is dense:
   with 56 glyphs the pair repulsion is always doing something, and a soft spring
   would let the grid dissolve into a crowd. */
const K_HOME = 4.2; // spring back to the slot
const K_BLOCK = 16; // push out of a keep-out rectangle
const DAMP = 3.1; // velocity lost per second
const IDLE = 3.2; // the drift that keeps an untouched field alive
const R_POINTER = 170; // pointer influence, px
const F_POINTER = 5400;
const R_PAIR = 72; // glyph-to-glyph influence, px
const F_PAIR = 2600;
const V_MAX = 780; // px/s, so a shockwave cannot fling glyphs off the field
const R_BURST = 300;
const F_BURST = 460;
const STEP = 1 / 60;

/* A fixed step, up to three per frame: a slow frame should not make the field
   explode, and a fast one should not make it stutter. */
const FRAME_MS = 16.7;

function start() {
  const items = chips.map((chip) => {
    const style = window.getComputedStyle(chip);
    const hx = parseFloat(style.getPropertyValue("--x"));
    const hy = parseFloat(style.getPropertyValue("--y"));

    return {
      chip,
      size: chip.offsetWidth || parseFloat(chip.getAttribute("data-size")) || 32,
      /* Only used when icons-boot.js never ran (a blocked file, an error): the
         field still works, positioned from the stylesheet's own slots. */
      hx: Number.isFinite(hx) ? hx / 100 : 0.5,
      hy: Number.isFinite(hy) ? hy / 100 : 0.5,
      x: 0,
      y: 0,
      tx: 0,
      ty: 0,
      vx: 0,
      vy: 0,
      rot: 0,
      lit: 0,
      phase: index * 1.7,
    };
  });

  const venue = { w: 0, h: 0 };
  const ax = new Float64Array(items.length);
  const ay = new Float64Array(items.length);
  const pointer = { x: -1e4, y: -1e4, active: false };
  let fieldRect = null;
  let blocks = [];
  let clock = 0;

  const measure = () => {
    venue.w = field.clientWidth || window.innerWidth || 1200;
    venue.h = field.clientHeight || window.innerHeight - 80 || 720;
  };

  /* One layout read per frame, in the field's own coordinates. The keep-outs are
     the frame the morph is resizing and the copy's words — both come back from
     the layout module, which measures the copy with Range rects so a glyph may
     stand beside the headline rather than only outside its full-width column. */
  const sample = () => {
    if (layoutField) {
      const view = layoutField.layout();
      if (!view) return;
      venue.w = view.venue.w;
      venue.h = view.venue.h;
      fieldRect = view.fieldRect;
      blocks = [];

      if (view.shell) blocks.push(view.shell);
      view.blocks.forEach((block) => blocks.push(block));

      view.homes.forEach((home, index) => {
        const item = items[index];
        if (!item || !home) return;
        item.tx = home.x;
        item.ty = home.y;
      });

      return;
    }

    /* No layout module: the stylesheet's slots, read as fractions of the field.
       The `left`/`top` they also set have to go, or every glyph would be placed
       once by the slot and again by the transform. */
    measure();
    fieldRect = field.getBoundingClientRect();
    blocks = [];
    items.forEach((item) => {
      item.tx = item.hx * venue.w;
      item.ty = item.hy * venue.h;
      item.chip.style.left = "0px";
      item.chip.style.top = "0px";
    });
  };

  const settle = () => {
    items.forEach((item) => {
      item.x = item.tx;
      item.y = item.ty;
      item.vx = 0;
      item.vy = 0;
      item.rot = 0;
      item.lit = 0;
    });
  };

  const paint = () => {
    items.forEach((item) => {
      const half = item.size / 2;
      item.chip.style.transform = `translate(${(item.x - half).toFixed(1)}px, ${(
        item.y - half
      ).toFixed(1)}px) rotate(${item.rot.toFixed(2)}deg)`;
      if (canHover) item.chip.style.opacity = (0.46 + item.lit * 0.46).toFixed(2);
    });
  };

  const step = (dt) => {
    clock += dt;
    const n = items.length;
    const px = pointer.x - (fieldRect ? fieldRect.left : 0);
    const py = pointer.y - (fieldRect ? fieldRect.top : 0);
    const near = pointer.active && canHover;

    ax.fill(0);
    ay.fill(0);

    for (let i = 0; i < n; i += 1) {
      const item = items[i];

      ax[i] += (item.tx - item.x) * K_HOME;
      ay[i] += (item.ty - item.y) * K_HOME;

      ax[i] += Math.sin(clock * 0.62 + item.phase) * IDLE;
      ay[i] += Math.cos(clock * 0.48 + item.phase * 1.4) * IDLE;

      if (near) {
        const dx = item.x - px;
        const dy = item.y - py;
        const d = Math.hypot(dx, dy) || 1;
        if (d < R_POINTER) {
          const f = (1 - d / R_POINTER) ** 2 * F_POINTER;
          ax[i] += (dx / d) * f;
          ay[i] += (dy / d) * f;
          item.lit = Math.max(item.lit, 1 - d / R_POINTER);
        }
      }

      for (let b = 0; b < blocks.length; b += 1) {
        const r = blocks[b];
        const left = item.x - r.x;
        const right = r.x + r.w - item.x;
        const top = item.y - r.y;
        const bottom = r.y + r.h - item.y;
        if (left <= 0 || right <= 0 || top <= 0 || bottom <= 0) continue;

        const m = Math.min(left, right, top, bottom);
        if (m === left) ax[i] -= K_BLOCK * left;
        else if (m === right) ax[i] += K_BLOCK * right;
        else if (m === top) ay[i] -= K_BLOCK * top;
        else ay[i] += K_BLOCK * bottom;
      }
    }

    /* Every pair, both ways. A glyph pushed aside pushes its neighbour in turn,
       and that chain is what makes the motion read as fluid rather than scripted. */
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const a = items[i];
        const b = items[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d >= R_PAIR) continue;

        const f = (1 - d / R_PAIR) ** 2 * F_PAIR;
        const ux = (dx / d) * f;
        const uy = (dy / d) * f;
        ax[i] -= ux;
        ay[i] -= uy;
        ax[j] += ux;
        ay[j] += uy;
      }
    }

    for (let i = 0; i < n; i += 1) {
      const item = items[i];
      const damp = Math.max(0, 1 - DAMP * dt);
      const half = item.size / 2;

      item.vx = (item.vx + ax[i] * dt) * damp;
      item.vy = (item.vy + ay[i] * dt) * damp;

      const speed = Math.hypot(item.vx, item.vy);
      if (speed > V_MAX) {
        item.vx = (item.vx / speed) * V_MAX;
        item.vy = (item.vy / speed) * V_MAX;
      }

      item.x += item.vx * dt;
      item.y += item.vy * dt;

      /* Soft walls: the field owns its rectangle, so a glyph that reaches an edge
         turns around instead of leaving the hero. */
      if (item.x < half) {
        item.x = half;
        item.vx = Math.abs(item.vx) * 0.5;
      } else if (item.x > venue.w - half) {
        item.x = venue.w - half;
        item.vx = -Math.abs(item.vx) * 0.5;
      }
      if (item.y < half) {
        item.y = half;
        item.vy = Math.abs(item.vy) * 0.5;
      } else if (item.y > venue.h - half) {
        item.y = venue.h - half;
        item.vy = -Math.abs(item.vy) * 0.5;
      }

      // Lean into the direction of travel, then settle upright.
      const target = Math.max(-15, Math.min(15, item.vx * 0.035));
      item.rot += (target - item.rot) * Math.min(1, 6 * dt);
      item.lit = Math.max(0, item.lit - 2.2 * dt);
    }
  };

  let acc = 0;

  const tick = (time, delta) => {
    const frame = Number.isFinite(delta) ? Math.min(delta, 50) : FRAME_MS;
    sample();
    acc += frame;

    let steps = 0;
    while (acc >= FRAME_MS && steps < 3) {
      step(STEP);
      acc -= FRAME_MS;
      steps += 1;
    }
    if (steps === 3) acc = 0;

    paint();
  };

  let running = false;
  let onScreen = true;

  const run = () => {
    if (running || !onScreen || document.hidden) return;
    running = true;
    gsap.ticker.add(tick);
  };

  const halt = () => {
    if (!running) return;
    running = false;
    gsap.ticker.remove(tick);
  };

  const reset = () => {
    sample();
    settle();
    paint();
  };

  const burst = (clientX, clientY) => {
    if (!fieldRect) return;
    const x = clientX - fieldRect.left;
    const y = clientY - fieldRect.top;

    items.forEach((item) => {
      const dx = item.x - x;
      const dy = item.y - y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > R_BURST) return;
      const f = (1 - d / R_BURST) * F_BURST;
      item.vx += (dx / d) * f;
      item.vy += (dy / d) * f;
    });
  };

  reset();

  /* Reduced motion gets the glyphs standing still, where icons-boot.js already
     put them. So does a viewport narrower than the field's breakpoint, where the
     stylesheet hides it — there is no margin to float in there, which is exactly
     why it is hidden. */
  if (reduceQuery.matches || window.getComputedStyle(field).display === "none") {
    window.addEventListener("resize", reset);
    return;
  }

  stage.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    },
    { passive: true }
  );

  const release = () => {
    pointer.active = false;
  };
  stage.addEventListener("pointerleave", release);
  stage.addEventListener("pointercancel", release);

  // A press on the hero itself — not on a link, a control or the form — ripples
  // the field away from the point. Nothing is captured, so a drag still selects
  // text and a click on a button still clicks it.
  stage.addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (target && typeof target.closest === "function") {
      if (target.closest("a, button, input, textarea, select, label, summary")) return;
    }
    burst(event.clientX, event.clientY);
  });

  if ("IntersectionObserver" in window) {
    // Starting optimistically means a page opened at the top animates from its
    // first frame; the observer's first callback corrects it either way.
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        onScreen = entry.isIntersecting;
        if (onScreen) run();
        else halt();
      });
    });
    observer.observe(stage);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) halt();
    else run();
  });

  /* Crossing the field's breakpoint has to stop the loop, not leave it running
     against a hidden element. A resize also re-reads the layout, because the bands
     the frame leaves have just changed. */
  window.addEventListener("resize", () => {
    reset();

    if (window.getComputedStyle(field).display === "none") halt();
    else run();
  });

  reduceQuery.addEventListener("change", (event) => {
    if (!event.matches) return;
    halt();
    reset();
  });

  run();
}

if (field && chips.length && stage) {
  try {
    start();
  } catch (error) {
    /* The field is decoration: a failure here must not cost the page anything.
       icons-boot.js has already placed the glyphs; they simply stand still. */
  }
}
