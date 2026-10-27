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
  const shell = document.getElementById("labShell");

  if (!shell) {
    html.classList.add("intro-done");
    return;
  }

  // The lab is the first thing on screen, so the intro is its arrival and
  // nothing else. The copy is revealed by heroMorph() as the lab steps back.
  gsap.fromTo(shell, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "power2.out" });
  window.setTimeout(() => html.classList.add("intro-done"), 900);
}

/* ---------- Hero: full-screen to docked ---------- */

/* The lab opens filling the screen — inset from the edges, so it reads as a
   bubble on the page rather than a bleed — and steps back into its slot once the
   visitor has actually started reading, not the instant the wheel moves. A hold
   zone at the start does that: the first 14% of the hero's scroll changes
   nothing, so the opening frame sits still, and the remaining 86% carries the
   whole morph.

   Width, height and top are animated rather than a transform, deliberately:
   scaling the same frame would render 13px labels at 8px in the docked state,
   which is unreadable, and upscaling blurs the type in the opening state. The
   cost is a reflow per frame on one element for ~55svh of scroll; `contain:
   layout` on the shell keeps that reflow inside the panel, and the writes are
   skipped when the value has not moved. It starts from the box the stylesheet
   drew for the opening state, which is why the panel is correct at first paint.

   Nothing here is one-shot: the scrub runs both ways, so scrolling back up
   returns the panel to full-screen and scrolls down again docks it, for as many
   passes as the visitor wants. */

function heroMorph() {
  const hero = document.querySelector(".hero");
  const stage = document.getElementById("heroStage");
  const shell = document.getElementById("labShell");
  const copy = document.getElementById("heroCopy");
  const actions = copy ? copy.querySelector(".hero-actions") : null;
  if (!hero || !stage || !shell || !copy) return;

  const HOLD = 0.14;
  const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

  // Under ~620px there is not enough height for a full-screen stage *and* a
  // docked frame. Keep the plain stacked hero rather than squeezing both in.
  if (stage.clientHeight && stage.clientHeight < 620) {
    html.classList.remove("hero-mega");
    html.classList.add("hero-live");
    return;
  }

  const state = { p: 0 };
  let metrics = null;
  const painted = { p: -1, c: -1, reachable: null };

  const measure = () => {
    // The stage is exactly the visible viewport, so read it: innerHeight
    // overstates the screen while a mobile URL bar is showing.
    const vw = stage.clientWidth || window.innerWidth || 1;
    const vh = stage.clientHeight || window.innerHeight || 1;

    // The masthead is fixed over the page. The opening frame starts below it,
    // otherwise the lab's own title bar sits under the site's nav and two rows
    // of chrome fight for the same 60px.
    const header = document.getElementById("siteHeader");
    const top = header ? Math.round(header.getBoundingClientRect().height) : 0;

    // The copy offsets itself from the masthead rather than from the viewport,
    // so its own height measure below accounts for the real header.
    if (top) html.style.setProperty("--masthead-h", `${top}px`);

    /* The opening frame is not computed here — it is drawn by the stylesheet and
       read back from the element. That is what lets the panel be the right size
       on the very first paint without any module having run, and what lets
       icons-boot.js place the glyph field against the real frame rather than
       against a second copy of the same arithmetic.

       Clearing the inline geometry is what makes this read the *opening* box
       while the frame is docked, and it costs nothing: the change only takes
       effect at the next layout, and render() writes the morphed values back in
       this same turn. */
    shell.style.width = "";
    shell.style.height = "";
    shell.style.top = "";

    const stageRect = stage.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();

    // The docked frame is fitted to what is actually left: under the copy, and
    // above the caption. Measuring the copy means a longer headline shortens the
    // panel instead of sliding underneath it.
    const copyBottom = copy.offsetTop + copy.offsetHeight;
    const dockTop = Math.min(
      Math.round(vh * 0.62),
      Math.max(Math.round(vh * 0.42), Math.round(copyBottom + 20))
    );
    const dockH = Math.min(540, vh - dockTop - 44);

    metrics = {
      vw,
      vh: vh - top,
      top,
      openTop: shellRect.top - stageRect.top,
      openW: shellRect.width,
      openH: shellRect.height,
      dockTop,
      w: Math.min(900, vw - 32),
      h: Math.max(300, Math.round(dockH)),
    };
  };

  const render = (raw) => {
    if (!metrics) return;

    // Dead zone first, then smoothstep: slow to leave the full-screen state,
    // slow to settle into the slot, quick in between.
    const q = clamp01((raw - HOLD) / (1 - HOLD));
    const p = q * q * (3 - 2 * q);

    if (Math.abs(p - painted.p) > 0.0005) {
      const w = metrics.openW + (metrics.w - metrics.openW) * p;
      const h = metrics.openH + (metrics.h - metrics.openH) * p;
      const y = metrics.openTop + (metrics.dockTop - metrics.openTop) * p;

      shell.style.width = `${w.toFixed(1)}px`;
      shell.style.height = `${h.toFixed(1)}px`;
      shell.style.top = `${y.toFixed(1)}px`;
      // Drives the frame's own radius. It closes from the bubble's corner
      // (`--radius-xl`) to the docked card's (`--radius-md`) as the frame shrinks.
      shell.style.setProperty("--lab-radius", `${(28 - 14 * p).toFixed(1)}px`);
      painted.p = p;
    }

    // The copy arrives once the lab has mostly docked, so the opening screen is
    // the product and the screen after it is the pitch.
    const c = clamp01((raw - 0.55) / 0.35);

    if (Math.abs(c - painted.c) > 0.001) {
      copy.style.opacity = c.toFixed(3);
      copy.style.transform = `translateY(${(22 * (1 - c)).toFixed(1)}px)`;
      copy.style.pointerEvents = c > 0.5 ? "auto" : "none";
      painted.c = c;
    }

    // An invisible CTA must not be reachable: a focus ring landing on a button
    // the visitor cannot see is worse than no button. Only the links go inert —
    // the heading and lede stay in the accessibility tree throughout.
    const reachable = c > 0.5;
    if (actions && reachable !== painted.reachable) {
      actions.toggleAttribute("inert", !reachable);
      if (reachable) actions.removeAttribute("aria-hidden");
      else actions.setAttribute("aria-hidden", "true");
      painted.reachable = reachable;
    }
  };

  measure();
  render(0);

  gsap.to(state, {
    p: 1,
    ease: "none",
    onUpdate: () => render(state.p),
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.45,
      invalidateOnRefresh: true,
      onRefresh: () => {
        measure();
        painted.p = -1;
        render(state.p);
      },
    },
  });

  // Tells theme-boot's fail-safe the morph is alive, so the full-screen hero is
  // not pulled out from under it.
  html.classList.add("hero-live");
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
  // Also set by theme-boot before the first paint; repeated here for the case
  // where motion is switched on mid-session, after theme-boot already ran.
  html.classList.add("hero-mega");

  startLenis();
  heroIntro();
  heroMorph();
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
