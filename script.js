/* JayOd Studios — site behaviour: nav, scroll state, reveals, contact form. */

const CONTACT_EMAIL = "hello@jayodstudios.com";

const header = document.getElementById("siteHeader");
const nav = document.getElementById("primaryNav");
const navToggle = document.getElementById("navToggle");
const navLinks = Array.from(document.querySelectorAll(".nav-list a"));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  if (window.innerWidth > 900) setNav(false);
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
    { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.1, 0.25, 0.5] }
  );

  sections.forEach((section) => navObserver.observe(section));
}

/* ---------- Scroll reveal (progressive enhancement) ---------- */

if (!reduceMotion && "IntersectionObserver" in window) {
  const targets = document.querySelectorAll(
    ".hero-copy, .hero-card, .section-head, .service, .steps > li, .work-lead, .work-panel, .studio-head, .studio-body, .contact-lead, .form"
  );

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  // Stagger comes from CSS (nth-child), keeping styles out of the markup.
  targets.forEach((target) => {
    target.classList.add("reveal");
    revealObserver.observe(target);
  });
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

    statusEl.innerHTML = `Opening your email app with the brief filled in. If nothing opens, send it to <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> instead.`;
    statusEl.className = "form-status is-success";
  });
}
