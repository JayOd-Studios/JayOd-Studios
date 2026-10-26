/* JayOd Studios — light / dark switch.
 *
 * The theme itself is applied by theme-boot.js before first paint; this module
 * owns the switch.
 *
 * Changing the theme re-renders the whole page — every colour is a token — so
 * the swap runs inside a View Transition and is revealed as a circle of the new
 * page growing out of the switch that was pressed. Two details make that work:
 *
 *   1. element transitions are switched off for the duration, otherwise the new
 *      snapshot captures every colour halfway through its fade and freezes it
 *      like that;
 *   2. the snapshot freezes the switch itself, so its flourish plays after the
 *      wipe rather than during it.
 *
 * Browsers without View Transitions switch instantly. The control still works.
 */

const html = document.documentElement;
const button = document.getElementById("themeToggle");
const label = document.getElementById("themeToggleLabel");
const THEME_KEY = "jayod-theme";

const WIPE_MS = 640;

const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const systemQuery = window.matchMedia("(prefers-color-scheme: light)");

let switching = false;

function current() {
  return html.getAttribute("data-theme") === "light" ? "light" : "dark";
}

/* One meta tag, rewritten in place. The two media-scoped ones in <head> only
   exist so the browser chrome is right before this script runs. */
function syncChrome(theme) {
  const colour = getComputedStyle(html)
    .getPropertyValue(theme === "light" ? "--theme-light-bg" : "--theme-dark-bg")
    .trim();

  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.remove());

  const meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.content = colour || (theme === "light" ? "#f6f5f1" : "#141824");
  document.head.append(meta);
}

function syncControl(theme) {
  if (!button) return;
  const next = theme === "light" ? "dark" : "light";
  button.setAttribute("data-theme-current", theme);
  if (label) label.textContent = `Switch to ${next} mode`;
}

function commit(theme) {
  html.setAttribute("data-theme", theme);
  syncChrome(theme);
  syncControl(theme);
  document.dispatchEvent(new CustomEvent("jayod:theme", { detail: { theme } }));
}

function store(theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    /* Private mode or blocked storage — the choice just will not persist. */
  }
}

/* The switch's own flourish: the knob spins round and overshoots. Its position
   is held by `translate`, which this animation never touches. */
function bump() {
  if (!button || reduceQuery.matches) return;
  button.classList.remove("is-flipping");
  // Restart the CSS animation even on a rapid second click.
  void button.offsetWidth;
  button.classList.add("is-flipping");
  window.setTimeout(() => button.classList.remove("is-flipping"), 720);
}

function commitQuietly(theme) {
  html.classList.add("is-theming");
  commit(theme);
}

function setTheme(theme, origin) {
  if (theme === current() || switching) return;

  if (!document.startViewTransition || reduceQuery.matches || !origin) {
    commit(theme);
    return;
  }

  switching = true;

  const x = origin.x;
  const y = origin.y;
  // Furthest corner from the switch: the circle has to cover the viewport.
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const transition = document.startViewTransition(() => commitQuietly(theme));

  transition.ready
    .then(() => {
      html.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
        },
        {
          duration: WIPE_MS,
          easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    })
    .catch(() => {
      /* The reveal is decoration; the theme is already applied. */
    });

  transition.finished
    .catch(() => {
      /* An interrupted transition still has to leave the page usable. */
    })
    .finally(() => {
      html.classList.remove("is-theming");
      switching = false;
      // Now that the snapshots are gone, the switch itself can perform.
      bump();
    });
}

if (button) {
  syncControl(current());

  button.addEventListener("click", (event) => {
    const next = current() === "light" ? "dark" : "light";
    store(next);
    const sweeping = Boolean(document.startViewTransition) && !reduceQuery.matches;
    if (!sweeping) bump();
    setTheme(next, { x: event.clientX, y: event.clientY });
  });
}

/* Another tab changed the theme. */
window.addEventListener("storage", (event) => {
  if (event.key !== THEME_KEY) return;
  if (event.newValue !== "light" && event.newValue !== "dark") return;
  commitQuietly(event.newValue);
  window.setTimeout(() => html.classList.remove("is-theming"), 40);
});

/* Follow the system only while the visitor has not chosen for themselves. */
systemQuery.addEventListener("change", (event) => {
  try {
    if (window.localStorage.getItem(THEME_KEY)) return;
  } catch (error) {
    /* No stored preference either way. */
  }
  commit(event.matches ? "light" : "dark");
});
