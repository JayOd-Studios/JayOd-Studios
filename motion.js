/* JayOd Studios — scroll choreography.
 *
 * Three libraries, one owner each:
 *
 *   Lenis        smooths the scroll itself;
 *   ScrollTrigger drives everything scroll-linked (this file);
 *   GSAP         animates, and SplitText splits the type;
 *   Anime.js     keeps the pointer-level moments (arrows, pulses, card hover).
 *
 * Every scroll animation here is reversible on purpose. `toggleActions` ends in
 * `reverse`, scrubs are bidirectional, and nothing uses `once`, so scrolling back
 * up unwinds a section in the order it arrived and scrolling down again replays
 * it. No reload is needed to see an animation a second time.
 *
 * All of it is an enhancement: with reduced motion, or if any of this fails to
 * load, the page is complete and readable.
 */

import { gsap, ScrollTrigger, SplitText } from "./vendor/gsap-3.15.0.js";
import { Lenis } from "./vendor/lenis-1.3.27.js";

gsap.registerPlugin(ScrollTrigger, SplitText);

const html = document.documentElement;
const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* Play forward on the way down, backwards on the way up, and allow both to
   happen as often as the visitor likes. */
const BOTH_WAYS = "play none none reverse";

let lenis = null;
let built = false;

/* ---------- Smooth scroll ---------- */

function startLenis() {
  if (lenis) return;

  try {
    lenis = new Lenis({
      duration: 1.05,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      smoothWheel: true,
      syncTouch: false,
    });
  } catch {
    lenis = null;
    return;
  }

  // ScrollTrigger reads scroll position from the window; Lenis keeps that
  // native value accurate, so the two stay in step.
  lenis.on("scroll", () => {
    ScrollTrigger.update();
    skewTicker(lenis.velocity ?? 0);
  });

  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function stopLenis() {
  if (!lenis) return;
  try {
    lenis.destroy();
  } catch {
    /* Already gone. */
  }
  lenis = null;
}

/* ---------- Section reveals ---------- */

function buildReveals() {
  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    // Headlines are handled by buildHeadings() and cards by buildCards(); two
    // tweens on one element would fight over the same property.
    if (el.matches(".section-head h2, .card")) return;

    gsap.fromTo(
      el,
      { opacity: 0, y: 28 },
      {
        opacity: 1,
        y: 0,
        duration: 0.72,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          end: "top 62%",
          toggleActions: BOTH_WAYS,
        },
      }
    );
  });
}

/* ---------- Headlines, line by line ---------- */

function buildHeadings() {
  gsap.utils.toArray(".section-head h2").forEach((heading) => {
    let lines = null;

    try {
      const split = new SplitText(heading, { type: "lines", linesClass: "split-line" });
      lines = split.lines;
    } catch {
      lines = null;
    }

    if (!lines || !lines.length) {
      // Fall back to the whole heading rather than leaving it unanimated.
      gsap.fromTo(
        heading,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: heading, start: "top 88%", toggleActions: BOTH_WAYS },
        }
      );
      return;
    }

    gsap.fromTo(
      lines,
      { yPercent: 112 },
      {
        yPercent: 0,
        duration: 0.95,
        ease: "power3.out",
        stagger: 0.07,
        scrollTrigger: {
          trigger: heading,
          start: "top 88%",
          end: "top 58%",
          toggleActions: BOTH_WAYS,
        },
      }
    );
  });
}

/* ---------- Hero ---------- */

function heroIntro() {
  const hero = document.querySelector(".hero");
  if (!hero) {
    html.classList.add("intro-done");
    return;
  }

  const lede = hero.querySelector(".hero-lede");
  const actions = hero.querySelector(".hero-actions");
  const eyebrow = hero.querySelector(".eyebrow");
  const visual = hero.querySelector(".hero-visual");
  const lines = Array.from(hero.querySelectorAll(".hero-title .line-inner"));

  const timeline = gsap.timeline({
    defaults: { ease: "power3.out" },
    onComplete: () => html.classList.add("intro-done"),
  });

  if (eyebrow) timeline.fromTo(eyebrow, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, 0);

  lines.forEach((line, index) => {
    let chars = null;
    try {
      chars = new SplitText(line, { type: "chars" }).chars;
    } catch {
      chars = null;
    }

    if (chars && chars.length) {
      timeline.fromTo(
        chars,
        { yPercent: 118, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.85, stagger: 0.018 },
        0.12 + index * 0.16
      );
    } else {
      timeline.fromTo(line, { yPercent: 110 }, { yPercent: 0, duration: 0.9 }, 0.12 + index * 0.16);
    }
  });

  if (lede) timeline.fromTo(lede, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, 0.55);
  if (actions)
    timeline.fromTo(actions, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6 }, 0.66);

  if (visual) {
    timeline.fromTo(
      visual,
      { opacity: 0, y: 30, scale: 0.985 },
      { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power2.out" },
      0.42
    );

    // The lab drifts a little slower than the page, which reads as depth. It is
    // applied to the wrapper because the panel's own transform carries the tilt.
    gsap.to(visual, {
      yPercent: -7,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 },
    });
  }

  // Safety net: theme-boot already releases the copy after 2.8s, this just makes
  // sure the class lands even if the timeline is interrupted.
  window.setTimeout(() => html.classList.add("intro-done"), 2400);
}

/* ---------- Work ---------- */

function buildCards() {
  const grid = document.getElementById("workGrid");
  if (!grid) return;

  const cards = gsap.utils.toArray(".card", grid);
  if (!cards.length) return;

  gsap.fromTo(
    cards,
    { opacity: 0, y: 46, rotateX: -5, transformOrigin: "50% 100%" },
    {
      opacity: 1,
      y: 0,
      rotateX: 0,
      duration: 0.85,
      ease: "power3.out",
      stagger: 0.09,
      scrollTrigger: {
        trigger: grid,
        start: "top 86%",
        end: "bottom 60%",
        toggleActions: BOTH_WAYS,
      },
    }
  );

  // Each thumbnail draws itself shape by shape. Opacity only, so Anime.js can
  // scale the frame on hover without the two fighting over the same property.
  cards.forEach((card) => {
    const shapes = card.querySelectorAll(".preview > *");
    if (!shapes.length) return;

    gsap.fromTo(
      shapes,
      { opacity: 0.12 },
      {
        opacity: 1,
        duration: 0.5,
        ease: "power1.out",
        stagger: 0.015,
        scrollTrigger: { trigger: card, start: "top 88%", toggleActions: BOTH_WAYS },
      }
    );
  });
}

/* ---------- Approach rail ---------- */

function buildRail() {
  const rail = document.getElementById("stepsRail");
  const track = document.querySelector(".steps-track");
  if (!rail || !track) return;

  gsap.set(rail, { scaleX: 0, transformOrigin: "0% 50%" });

  gsap.to(rail, {
    scaleX: 1,
    ease: "none",
    scrollTrigger: {
      trigger: track,
      start: "top 78%",
      end: "bottom 68%",
      scrub: 0.35,
    },
  });

  gsap.utils.toArray(".step").forEach((step) => {
    ScrollTrigger.create({
      trigger: step,
      start: "top 72%",
      end: "bottom 44%",
      toggleClass: { targets: step, className: "is-passed" },
    });
  });
}

/* ---------- Studio statement ---------- */

function buildStatement() {
  const statement = document.getElementById("studioStatement");
  if (!statement) return;

  let words = null;
  try {
    words = new SplitText(statement, { type: "words", wordsClass: "split-word" }).words;
  } catch {
    return;
  }
  if (!words || !words.length) return;

  // Scrubbed rather than triggered: the sentence fills in as you scroll past and
  // empties again on the way back, which is the point of a scrub.
  gsap.fromTo(
    words,
    { opacity: 0.14 },
    {
      opacity: 1,
      ease: "none",
      stagger: 0.4,
      scrollTrigger: {
        trigger: statement,
        start: "top 84%",
        end: "bottom 58%",
        scrub: 0.5,
      },
    }
  );
}

/* ---------- Contact ---------- */

function buildContact() {
  const form = document.getElementById("projectForm");
  if (!form) return;

  const blocks = form.querySelectorAll(".form-row, .field, .form-note, .btn-block");

  gsap.fromTo(
    blocks,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power2.out",
      stagger: 0.06,
      scrollTrigger: { trigger: form, start: "top 84%", toggleActions: BOTH_WAYS },
    }
  );
}

/* ---------- Ship list ---------- */

function buildShip() {
  const list = document.querySelector(".ship-list");
  if (!list) return;

  gsap.fromTo(
    list.children,
    { opacity: 0, x: -14 },
    {
      opacity: 1,
      x: 0,
      duration: 0.55,
      ease: "power2.out",
      stagger: 0.07,
      scrollTrigger: { trigger: list, start: "top 86%", toggleActions: BOTH_WAYS },
    }
  );
}

/* ---------- Section entry ---------- */

function buildSections() {
  gsap.utils.toArray("main section").forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: "top 82%",
      end: "bottom 22%",
      toggleClass: { targets: section, className: "is-entered" },
    });
  });
}

/* ---------- Reading progress ---------- */

function buildProgress() {
  const bar = document.getElementById("progressBar");
  if (!bar) return;

  gsap.set(bar, { scaleX: 0, transformOrigin: "0% 50%" });

  gsap.to(bar, {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.2 },
  });
}

/* ---------- Ticker reacts to scroll speed ---------- */

let tickerTarget = null;

function skewTicker(velocity) {
  if (!tickerTarget || reduceQuery.matches) return;
  const lean = gsap.utils.clamp(-6, 6, velocity * -0.25);
  gsap.to(tickerTarget, { skewX: lean, duration: 0.45, ease: "power2.out", overwrite: true });
}

function buildTicker() {
  tickerTarget = document.querySelector(".ticker-track");
}

/* ---------- Scroll-hint arrow ---------- */

function buildHint() {
  const hint = document.querySelector(".hero-hint");
  if (!hint) return;

  gsap.to(hint, {
    y: 7,
    repeat: -1,
    yoyo: true,
    duration: 1.1,
    ease: "sine.inOut",
  });
}

/* ---------- Boot ---------- */

function build() {
  if (built) return;
  built = true;

  html.classList.add("motion-ready");

  startLenis();
  heroIntro();
  buildReveals();
  buildHeadings();
  buildCards();
  buildRail();
  buildSections();
  buildProgress();
  buildStatement();
  buildContact();
  buildShip();
  buildTicker();
  buildHint();

  // Fonts and generated cards change the layout, which moves every trigger.
  window.addEventListener("load", () => ScrollTrigger.refresh());
  document.fonts?.ready?.then(() => ScrollTrigger.refresh()).catch(() => {});

  // Anything already on screen when the page opens should not wait for a scroll
  // event that may never come.
  ScrollTrigger.refresh();
}

function teardown() {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  gsap.globalTimeline.clear();
  stopLenis();
  built = false;
}

if (reduceQuery.matches) {
  html.classList.add("intro-done");
} else {
  build();
}

/* Someone flips the OS setting mid-session: stop animating and leave the page
   exactly as a no-motion visitor would see it. */
reduceQuery.addEventListener("change", (event) => {
  if (event.matches) {
    teardown();
    html.classList.add("intro-done");
  } else if (!built) {
    build();
    ScrollTrigger.refresh();
  }
});

/* Only run the scroll engine while the tab is visible. */
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    lenis?.stop();
  } else {
    lenis?.start();
    ScrollTrigger.update();
  }
});
