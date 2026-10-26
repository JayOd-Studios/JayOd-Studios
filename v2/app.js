/* JayOd Studios — core behaviour: nav, header, section tracking, work grid, form.
 *
 * Deliberately framework-free and independent of the animation modules: if
 * Motion or Anime.js fail to load, everything here still works and the page
 * still reads.
 */

const CONTACT_EMAIL = "hello@jayodstudios.com";

const header = document.getElementById("siteHeader");
const nav = document.getElementById("primaryNav");
const navToggle = document.getElementById("navToggle");
const navLinks = Array.from(document.querySelectorAll(".nav-list a"));

/* ---------- Mobile navigation ---------- */

function setNav(open) {
  if (!nav || !navToggle) return;
  nav.classList.toggle("is-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.querySelector(".sr-only").textContent = open ? "Close menu" : "Open menu";
}

navToggle?.addEventListener("click", () => {
  setNav(navToggle.getAttribute("aria-expanded") !== "true");
});

navLinks.forEach((link) => link.addEventListener("click", () => setNav(false)));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navToggle?.getAttribute("aria-expanded") === "true") {
    setNav(false);
    navToggle.focus();
  }
});

document.addEventListener("click", (event) => {
  if (navToggle?.getAttribute("aria-expanded") !== "true") return;
  if (nav?.contains(event.target) || navToggle.contains(event.target)) return;
  setNav(false);
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 940) setNav(false);
});

/* ---------- Header state ---------- */

function syncHeader() {
  header?.classList.toggle("is-stuck", window.scrollY > 8);
}

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

/* ---------- Active section in nav ---------- */

const sections = Array.from(document.querySelectorAll("main section[id]"));

if ("IntersectionObserver" in window && sections.length) {
  const visible = new Map();

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
      });

      let current = null;
      let best = 0;
      visible.forEach((ratio, id) => {
        if (ratio > best) {
          best = ratio;
          current = id;
        }
      });

      navLinks.forEach((link) => {
        const active = link.getAttribute("href") === `#${current}`;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.1, 0.25, 0.5] }
  );

  sections.forEach((section) => navObserver.observe(section));
}

/* ---------- Work grid ---------- */

const SVG_NS = "http://www.w3.org/2000/svg";

function node(name, attributes) {
  const element = document.createElementNS(SVG_NS, name);
  Object.keys(attributes).forEach((key) => element.setAttribute(key, String(attributes[key])));
  return element;
}

const block = (x, y, width, height, cls = "pv-block", radius = 3) =>
  node("rect", { x, y, width, height, rx: radius, class: cls });

const bar = (x, y, width, height = 4, cls = "pv-line") =>
  node("rect", { x, y, width, height, rx: height / 2, class: cls });

const dot = (cx, cy, r = 2.4, cls = "pv-dot") => node("circle", { cx, cy, r, class: cls });

/* Each preview is abstract line art of a layout archetype — never a screenshot
   of someone else's product, so a placeholder cannot impersonate real work. */
const PREVIEWS = {
  dashboard() {
    return [
      block(0, 22, 58, 178, "pv-panel", 0),
      bar(10, 40, 38),
      bar(10, 54, 28),
      bar(10, 68, 34),
      block(70, 34, 74, 38, "pv-panel"),
      block(152, 34, 74, 38, "pv-panel"),
      block(234, 34, 74, 38, "pv-panel"),
      bar(78, 44, 30, 4),
      bar(160, 44, 26, 4),
      bar(242, 44, 34, 4),
      block(70, 82, 238, 106, "pv-panel"),
      ...Array.from({ length: 9 }, (_, index) =>
        block(82 + index * 24, 150 - index * 6, 14, 30 + index * 6, index % 3 === 0 ? "pv-accent" : "pv-block", 2)
      ),
    ];
  },
  editorial() {
    return [
      bar(20, 34, 54, 5, "pv-accent"),
      block(20, 48, 176, 16, "pv-head"),
      block(20, 70, 132, 16, "pv-head"),
      bar(20, 100, 150),
      bar(20, 110, 168),
      bar(20, 120, 96),
      block(212, 40, 88, 60, "pv-panel"),
      bar(212, 110, 88),
      bar(212, 120, 64),
      block(20, 144, 280, 1, "pv-rule", 0),
      bar(20, 158, 120, 6),
      bar(20, 172, 168),
    ];
  },
  commerce() {
    const tiles = [];
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const x = 16 + col * 100;
        const y = 62 + row * 70;
        tiles.push(block(x, y, 88, 44, "pv-panel"));
        tiles.push(bar(x, y + 50, 56));
        tiles.push(bar(x, y + 58, 30, 3, "pv-accent"));
      }
    }
    return [
      block(0, 22, 320, 30, "pv-panel", 0),
      bar(12, 33, 40, 6),
      bar(232, 34, 26),
      bar(266, 34, 26),
      dot(300, 36, 5, "pv-accent"),
      ...tiles,
    ];
  },
  landing() {
    return [
      block(46, 40, 228, 16, "pv-head"),
      block(86, 64, 148, 10),
      bar(120, 82, 80, 4),
      block(104, 96, 50, 16, "pv-accent"),
      block(162, 96, 50, 16, "pv-outline"),
      block(16, 132, 92, 50, "pv-panel"),
      block(114, 132, 92, 50, "pv-panel"),
      block(212, 132, 92, 50, "pv-panel"),
      bar(26, 144, 40, 4),
      bar(124, 144, 40, 4),
      bar(222, 144, 40, 4),
    ];
  },
  docs() {
    return [
      block(0, 22, 70, 178, "pv-panel", 0),
      bar(12, 40, 44),
      bar(12, 54, 34),
      bar(12, 68, 46),
      bar(12, 82, 30),
      block(86, 36, 150, 12, "pv-head"),
      bar(86, 58, 210),
      bar(86, 68, 186),
      bar(86, 78, 200),
      block(86, 94, 218, 74, "pv-code"),
      bar(96, 106, 70, 4, "pv-accent"),
      bar(96, 120, 120),
      bar(96, 132, 90),
      bar(96, 144, 140),
    ];
  },
  studio() {
    return [
      block(20, 46, 232, 18, "pv-head"),
      block(20, 72, 156, 18, "pv-head"),
      block(20, 106, 280, 1, "pv-rule", 0),
      block(20, 122, 80, 54, "pv-panel"),
      block(112, 122, 80, 54, "pv-panel"),
      block(204, 122, 80, 54, "pv-panel"),
      bar(20, 186, 60, 4),
      bar(112, 186, 48, 4),
    ];
  },
};

function buildPreview(kind) {
  const svg = node("svg", {
    class: "preview",
    viewBox: "0 0 320 200",
    "aria-hidden": "true",
    focusable: "false",
    preserveAspectRatio: "xMidYMid slice",
  });

  svg.append(
    node("rect", { x: 0, y: 0, width: 320, height: 200, class: "pv-bg" }),
    node("rect", { x: 0, y: 0, width: 320, height: 22, class: "pv-chrome" }),
    dot(11, 11, 2.6),
    dot(20, 11, 2.6),
    dot(29, 11, 2.6),
    node("rect", { x: 116, y: 6, width: 88, height: 10, rx: 5, class: "pv-url" })
  );

  (PREVIEWS[kind] || PREVIEWS.editorial)().forEach((shape) => svg.append(shape));

  return svg;
}

function buildCard(project, index) {
  const card = document.createElement("article");
  card.className = "card";
  card.setAttribute("data-reveal", "");
  card.dataset.index = String(index);

  const media = document.createElement("div");
  media.className = "card-media";
  media.append(buildPreview(project.preview));

  const live = Boolean(project.url);

  if (!live) {
    const badge = document.createElement("span");
    badge.className = "card-badge";
    badge.textContent = "Sample";
    media.append(badge);
  }

  const body = document.createElement("div");
  body.className = "card-body";

  const meta = document.createElement("p");
  meta.className = "card-meta";
  const sector = document.createElement("span");
  sector.textContent = project.sector || "Project";
  const year = document.createElement("span");
  year.className = "card-year";
  year.textContent = project.year || "";
  meta.append(sector, year);

  const title = document.createElement("h3");
  title.className = "card-title";

  if (live) {
    const link = document.createElement("a");
    link.className = "card-link";
    link.href = project.url;
    link.rel = "noopener noreferrer";
    link.target = "_blank";
    link.textContent = project.title;
    title.append(link);
  } else {
    title.textContent = project.title;
  }

  const summary = document.createElement("p");
  summary.className = "card-summary";
  summary.textContent = project.summary || "";

  const tags = document.createElement("ul");
  tags.className = "card-tags";
  tags.setAttribute("role", "list");
  (project.tags || []).forEach((tag) => {
    const item = document.createElement("li");
    item.textContent = tag;
    tags.append(item);
  });

  const foot = document.createElement("p");
  foot.className = "card-foot";

  if (live) {
    const open = document.createElement("a");
    open.className = "card-cta";
    open.href = project.url;
    open.rel = "noopener noreferrer";
    open.target = "_blank";
    open.textContent = "View site";
    const arrow = document.createElement("span");
    arrow.className = "card-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";
    open.append(arrow);
    foot.append(open);
  } else {
    const placeholder = document.createElement("span");
    placeholder.className = "card-cta is-placeholder";
    placeholder.textContent = "Sample entry — no live site";
    foot.append(placeholder);
  }

  body.append(meta, title, summary, tags, foot);
  card.append(media, body);

  return card;
}

const grid = document.getElementById("workGrid");
const projects = Array.isArray(window.PORTFOLIO) ? window.PORTFOLIO : [];

if (grid) {
  if (!projects.length) {
    const empty = document.createElement("p");
    empty.className = "work-fallback";
    empty.textContent = "No projects yet — add entries to portfolio.js and they appear here.";
    grid.append(empty);
  } else {
    projects.forEach((project, index) => grid.append(buildCard(project, index)));
  }
}

/* ---------- Year ---------- */

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

/* ---------- Contact form ---------- */

const form = document.getElementById("projectForm");

if (form) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
  const statusEl = document.getElementById("formStatus");

  const fields = [
    {
      input: form.elements.name,
      error: document.getElementById("name-error"),
      validate: (value) => (value.trim().length >= 2 ? "" : "Please add your name."),
    },
    {
      input: form.elements.email,
      error: document.getElementById("email-error"),
      validate: (value) => {
        if (!value.trim()) return "Please add an email so we can reply.";
        return emailPattern.test(value.trim()) ? "" : "That email address looks incomplete.";
      },
    },
    {
      input: form.elements.message,
      error: document.getElementById("message-error"),
      validate: (value) =>
        value.trim().length >= 10 ? "" : "A sentence or two about the project is plenty.",
    },
  ];

  function showError(field, message) {
    const wrap = field.input.closest(".field");
    field.input.setAttribute("aria-invalid", message ? "true" : "false");
    if (field.error) {
      field.error.textContent = message;
      field.error.hidden = !message;
    }
    wrap?.classList.toggle("has-error", Boolean(message));
  }

  fields.forEach((field) => {
    field.input?.addEventListener("input", () => {
      if (field.input.getAttribute("aria-invalid") === "true") showError(field, "");
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    let firstInvalid = null;

    fields.forEach((field) => {
      if (!field.input) return;
      const message = field.validate(field.input.value);
      showError(field, message);
      if (message && !firstInvalid) firstInvalid = field.input;
    });

    if (firstInvalid) {
      statusEl.textContent = "Almost there — please check the highlighted fields.";
      statusEl.className = "form-status is-error";
      firstInvalid.focus();
      form.dispatchEvent(new CustomEvent("jayod:invalid", { bubbles: true }));
      return;
    }

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const projectType = String(data.get("projectType") || "Not specified");
    const budget = String(data.get("budget") || "Not specified");
    const message = String(data.get("message") || "").trim();

    const subject = `Project enquiry — ${projectType}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Project: ${projectType}`,
      `Budget: ${budget}`,
      "",
      "About the project:",
      message,
    ].join("\n");

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    const fallbackLink = document.createElement("a");
    fallbackLink.href = `mailto:${CONTACT_EMAIL}`;
    fallbackLink.textContent = CONTACT_EMAIL;
    statusEl.textContent = "Opening your email app with the brief filled in. If nothing opens, send it to ";
    statusEl.append(fallbackLink, document.createTextNode(" instead."));
    statusEl.className = "form-status is-success";
  });
}
