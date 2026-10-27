/* JayOd Studios — theme boot.
 *
 * Runs synchronously in <head>, before the stylesheet is parsed, so the page
 * never paints the wrong theme and then flips. Deliberately a classic script:
 * an inline one would be blocked by the Content-Security-Policy, and a module
 * would run too late to prevent the flash.
 */
(function () {
  var html = document.documentElement;
  var THEME_KEY = "jayod-theme";

  var stored = null;
  try {
    stored = window.localStorage.getItem(THEME_KEY);
  } catch (error) {
    /* Storage can be blocked; the page still works, it just will not remember. */
  }

  var systemLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  var theme = stored === "light" || stored === "dark" ? stored : systemLight ? "light" : "dark";

  html.setAttribute("data-theme", theme);

  /* Scripting is on. The stylesheet uses this to hold the glyph field back until
     icons-boot.js has placed it — a visitor without JavaScript gets the slots
     instead, which is a legitimate arrangement rather than a flash. */
  html.classList.add("js");

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    html.classList.add("intro-done");
  } else {
    /* The hero intro hides its own copy until motion.js runs the timeline.
       This fail-safe releases it even if that module never loads. */
    html.classList.add("motion-ok");

    /* The hero opens as a full-screen stage, and this has to be on the <html>
       before the first paint. Setting it from motion.js meant the page painted
       the small stacked hero first and snapped to the full-bleed one once GSAP
       had downloaded — a visible jump on every cold load. motion.js confirms
       with `hero-live`; if it never arrives (blocked module, failed import, no
       ScrollTrigger) the class is pulled and the hero falls back to the plain
       stacked layout it ships without JS. */
    /* Only when there is height for both a full-screen stage and a panel below
       the copy. motion.js applies the same cut-off. */
    if (window.innerHeight >= 620) {
      html.classList.add("hero-mega");
    }

    window.setTimeout(function () {
      html.classList.add("intro-done");
      if (!html.classList.contains("hero-live")) {
        html.classList.remove("hero-mega");
      }
      /* The same fail-safe for the field: icons-boot.js normally confirms in the
         same tick it places the glyphs, so this only ever fires if that file is
         missing or threw. Unhidden, the glyphs stand at the stylesheet's slots. */
      html.classList.add("icons-ready");
    }, 2800);
  }
})();
