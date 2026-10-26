/* JayOd Studios — core behaviour: nav, header, section tracking, work grid, form.
 *
 * Deliberately framework-free and independent of the animation modules: if
 * Motion or Anime.js fail to load, everything here still works and the page
 * still reads.
 */

const CONTACT_EMAIL = "jayodstudios@gmail.com";

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

/* Wireframe art lives in wireframes.js so the work cards and the hero stage
   draw from the same definitions. */
function buildPreview(kind) {
  return window.buildWireframe
    ? window.buildWireframe(kind)
    : document.createElement("svg");
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

/* ---------- Hero stage first frame ---------- */

/* Painted here, not in the module, so the stage is never empty while (or if)
   hero.js loads. The animation picks this frame up and continues from it. */
const stageCanvas = document.getElementById("stageCanvas");

if (stageCanvas && !stageCanvas.querySelector("svg") && window.buildWireframe) {
  stageCanvas.append(
    window.buildWireframe("dashboard", { chrome: false, className: "preview preview--stage" })
  );
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
