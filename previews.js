/* JayOd Studios — the artwork in the work cards.
 *
 * Each sample project is drawn as the site it would be: a real headline, real
 * prices, real chart values, real navigation, and photographs as tonal plates with
 * shapes in them. They are drawings rather than screenshots, so nothing here can
 * impersonate a real product — but they are pages, not wireframes. There are no
 * blank boxes standing in for copy, and no placeholder bars where a word belongs.
 *
 *   buildPreview(kind, { chrome: true }) -> <svg>
 *
 * A fixed 320 x 200 drawing space; the SVG scales with the box it is placed in, so
 * one drawing serves the card. The browser chrome occupies the top 22 units (and
 * is cropped out of the viewBox when the caller draws its own). Colours are CSS
 * classes only — every fill comes from the token deck in styles.css, so the
 * artwork re-inks itself when the theme flips and no rule here carries a raw
 * value. Photographs are clipped groups: a plate in one of three tones, a light, a
 * horizon and a slope, which is enough to read as a picture at card size without
 * ever looking like a specific real image.
 */

(function () {
  const NS = "http://www.w3.org/2000/svg";
  let uid = 0;

  function node(name, attributes, children) {
    const element = document.createElementNS(NS, name);
    if (attributes) {
      Object.keys(attributes).forEach((key) => element.setAttribute(key, String(attributes[key])));
    }
    if (children) children.forEach((child) => child && element.append(child));
    return element;
  }

  const rect = (x, y, w, h, cls, r) =>
    node("rect", { x, y, width: w, height: h, rx: r === undefined ? 3 : r, class: cls || "pv-panel" });

  const circle = (cx, cy, r, cls) => node("circle", { cx, cy, r, class: cls || "pv-block" });

  const shape = (d, cls) => node("path", { d, class: cls || "pv-block" });

  const rule = (x, y, w, cls) => node("rect", { x, y, width: w, height: 1, class: cls || "pv-rule" });

  /* SVG text. `cls` carries the fill *and* the type style, e.g. "pv-ink pv-display". */
  const say = (x, y, value, cls, size, anchor, weight) =>
    node(
      "text",
      {
        x,
        y,
        class: cls || "pv-ink",
        "font-size": size || 9,
        "text-anchor": anchor || "start",
        "font-weight": weight || 500,
      },
      [document.createTextNode(value)]
    );

  /* A photograph: a tonal plate, a low sun, a horizon and a slope, clipped to its
     own frame so nothing spills over the layout. */
  function photo(x, y, w, h, plate, seed) {
    const id = `pv-clip-${(uid += 1)}`;
    const sunX = x + w * (seed % 2 === 0 ? 0.24 : 0.72);
    const sunY = y + h * (seed % 3 === 0 ? 0.3 : 0.42);

    const clip = node("clipPath", { id }, [node("rect", { x, y, width: w, height: h, rx: 3 })]);

    const art = [
      rect(x, y, w, h, `pv-img-${plate}`, 3),
      circle(sunX, sunY, Math.max(2.4, Math.min(w, h) * 0.13), "pv-fig-light"),
      shape(
        `M${x} ${y + h} L${x} ${y + h * 0.72} L${x + w * 0.34} ${y + h * 0.4} L${x + w * 0.62} ${y + h * 0.74} L${x + w * 0.82} ${y + h * 0.56} L${x + w} ${y + h * 0.78} L${x + w} ${y + h} Z`,
        "pv-fig"
      ),
      shape(`M${x - w * 0.1} ${y + h * 1.02} L${x + w * 0.46} ${y + h * 0.24} L${x + w * 1.05} ${y + h * 1.02} Z`, "pv-fig-soft"),
    ];

    return node("g", { "clip-path": `url(#${id})` }, [clip].concat(art));
  }

  /* Avatars: an initials disc, which is what a real small team uses. */
  const avatar = (cx, cy, r, initials, tone) =>
    node("g", null, [
      circle(cx, cy, r, `pv-av-${tone}`),
      say(cx, cy + r * 0.34, initials, "pv-av-ink", Math.round(r * 1.15), "middle", 600),
    ]);

  /* A filled area chart from values 0..1, and its line. */
  function chart(x, y, w, h, values, cls) {
    const step = w / (values.length - 1);
    const points = values.map((value, index) => [x + index * step, y + h - value * h]);
    const line = points.map(([px, py], index) => `${index ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");

    return [
      shape(`${line} L${(x + w).toFixed(1)} ${y + h} L${x} ${y + h} Z`, cls || "pv-area"),
      node("path", { d: line, class: "pv-stroke", fill: "none" }),
      circle(points[points.length - 1][0], points[points.length - 1][1], 2.2, "pv-accent"),
    ];
  }

  /* Column chart: `values` are 0..1. */
  function columns(x, y, w, h, values, accentAt) {
    const gap = 4;
    const barW = (w - gap * (values.length - 1)) / values.length;

    return values.map((value, index) =>
      rect(
        x + index * (barW + gap),
        y + h - Math.max(3, value * h),
        barW,
        Math.max(3, value * h),
        index === accentAt ? "pv-accent" : "pv-line",
        2
      )
    );
  }

  function star(cx, cy, r, cls) {
    const points = [];
    for (let i = 0; i < 10; i += 1) {
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const radius = i % 2 === 0 ? r : r * 0.46;
      points.push(`${(cx + Math.cos(angle) * radius).toFixed(2)} ${(cy + Math.sin(angle) * radius).toFixed(2)}`);
    }
    return shape(`M${points.join(" L")} Z`, cls || "pv-star");
  }

  const stars = (x, y, count, full, r) => {
    const out = [];
    for (let i = 0; i < 5; i += 1) {
      out.push(star(x + i * r * 2.4, y, r, i < count || (i === count && full) ? "pv-star" : "pv-star-off"));
    }
    return out;
  };

  const LAYOUTS = {
    /* A reconciliation dashboard: sidebar, live figures, a chart with a marked
       point, and a ledger table with real amounts and statuses. */
    dashboard() {
      const out = [
        rect(0, 22, 58, 178, "pv-side", 0),
        circle(12, 36, 4.4, "pv-accent"),
        say(20, 39, "Ledger", "pv-ink pv-mono", 8, "start", 600),
      ];

      ["Overview", "Ledger", "Reports", "Team", "Settings"].forEach((item, index) => {
        const y = 54 + index * 13;
        if (index === 1) out.push(rect(6, y - 7, 46, 11, "pv-chip", 3));
        out.push(say(12, y + 1, item, index === 1 ? "pv-accent" : "pv-ink-soft", 7.2));
      });

      out.push(
        rect(66, 30, 108, 13, "pv-card", 4),
        say(73, 39, "Search accounts", "pv-ink-soft", 7.2),
        circle(166, 36.5, 3.4, "pv-line"),
        avatar(232, 36, 6.4, "JO", "b"),
        say(244, 39, "Jay O.", "pv-ink", 7.4)
      );

      const stats = [
        ["Balance", "$284,102", "+12.4%", "pv-live"],
        ["Unmatched", "3", "needs review", "pv-warn"],
        ["Cleared", "1,204", "this month", "pv-ink-soft"],
      ];

      stats.forEach(([label, value, note, tone], index) => {
        const x = 66 + index * 82;
        out.push(
          rect(x, 50, 76, 34, "pv-card", 4),
          say(x + 7, 61, label, "pv-ink-soft", 7),
          say(x + 7, 73, value, "pv-ink pv-display", 13, "start", 600),
          say(x + 7, 80, note, tone, 6.4)
        );
      });

      out.push(rect(66, 90, 248, 66, "pv-card", 4), say(73, 101, "Net movement · 9 weeks", "pv-ink-soft", 7));

      [0.24, 0.5, 0.74].forEach((line) => {
        out.push(rule(73, 108 + line * 40, 234, "pv-grid-line"));
      });

      out.push(...chart(73, 106, 234, 42, [0.3, 0.44, 0.38, 0.6, 0.52, 0.72, 0.66, 0.85, 0.95], "pv-area"));

      const rows = [
        ["Northwind Ltd", "$48,200", "Matched", "pv-live"],
        ["Hopwood & Co", "$12,940", "Matched", "pv-live"],
        ["Ridgeway", "$3,410", "Review", "pv-warn"],
        ["Carrow Studio", "$860", "Matched", "pv-live"],
      ];

      rows.forEach(([name, amount, status, tone], index) => {
        const y = 163 + index * 9.6;
        // The status is a word in a pill, never a colour on its own.
        const wide = status === "Review" ? 30 : 34;
        const pillX = 300 - wide;

        out.push(
          circle(71, y - 2.2, 2, "pv-dot"),
          say(77, y, name, "pv-ink", 7),
          say(196, y, amount, "pv-ink pv-mono", 7, "end"),
          rect(pillX, y - 7.4, wide, 9.4, "pv-card", 4.7),
          say(pillX + wide / 2, y - 0.6, status, tone, 6, "middle")
        );
      });

      return out;
    },

    /* A reading-first journal: a masthead, one large plate, a headline with a
       byline, body copy, a pull quote and two teasers. */
    editorial() {
      const body = [0.86, 0.92, 0.78, 0.9, 0.62].map((width, index) =>
        rect(16, 132 + index * 7.4, (width * 168).toFixed(1), 2.6, "pv-line", 1.3)
      );

      return [
        say(16, 34, "FIELD NOTES", "pv-ink pv-mono", 9, "start", 700),
        say(304, 34, "Issue 14 · Autumn", "pv-ink-soft", 7.2, "end"),
        rule(16, 40, 288, "pv-rule"),
        photo(16, 46, 168, 74, "a", 1),
        say(20, 116, "Stone walls, Rhosgoch", "pv-fig-note", 6.4),
        say(196, 52, "The long walk home", "pv-ink pv-display", 15, "start", 600),
        say(196, 64, "Forty miles of coast path, and the", "pv-ink-soft", 6.6),
        say(196, 72, "villages that are no longer there.", "pv-ink-soft", 6.6),
        avatar(203, 84, 6, "ME", "c"),
        say(213, 86.5, "Maya Ellis · 6 min", "pv-ink", 6.6),
        ...body,
        rect(196, 132, 1.4, 42, "pv-accent", 0),
        say(203, 141, "“The road was there.", "pv-ink pv-display", 8.4, "start", 400),
        say(203, 151, "The village was not.”", "pv-ink pv-display", 8.4, "start", 400),
        say(203, 164, "— from chapter two", "pv-ink-soft", 6.2),
        rule(16, 176, 288, "pv-rule"),
        photo(16, 182, 44, 14, "b", 2),
        say(66, 190, "A ferry to nowhere", "pv-ink", 7.4, "start", 600),
        say(66, 197, "Notes from the Sound", "pv-ink-soft", 6.4),
        photo(196, 182, 44, 14, "c", 3),
        say(246, 190, "Salt and signal", "pv-ink", 7.4, "start", 600),
        say(246, 197, "Fifteen years of fog", "pv-ink-soft", 6.4),
      ];
    },

    /* A small-batch storefront: navigation with a cart, a promo band, and a
       product grid with prices, one rating and a sale badge. */
    commerce() {
      const products = [
        ["Cedar Tray", "$48", "a", 4, true],
        ["Linen Throw", "$129", "b", 5, false],
        ["Stone Carafe", "$36", "c", 4, true],
      ];

      const out = [
        say(14, 34, "MARROW", "pv-ink pv-display", 11, "start", 600),
        say(80, 34, "Shop", "pv-ink-soft", 7),
        say(102, 34, "Journal", "pv-ink-soft", 7),
        say(130, 34, "Stockists", "pv-ink-soft", 7),
        say(268, 34, "Search", "pv-ink-soft", 7),
        circle(300, 31.6, 7, "pv-chip"),
        say(300, 34, "2", "pv-acc", 7, "middle", 600),
        rect(0, 40, 320, 30, "pv-band", 0),
        say(16, 55, "Winter drop — 20% off until Sunday", "pv-band-ink", 8.6, "start", 600),
        rect(232, 47, 72, 16, "pv-accent", 4),
        say(268, 58, "Shop the drop", "pv-btn-ink", 7.2, "middle", 600),
      ];

      products.forEach(([name, price, plate, rating, sale], index) => {
        const x = 16 + index * 100;
        out.push(photo(x, 80, 88, 58, plate, index + 1));

        if (sale) {
          out.push(rect(x + 4, 84, 26, 10, "pv-warn", 3), say(x + 17, 91.4, "Sale", "pv-warn-ink", 6.2, "middle", 600));
        }

        out.push(
          say(x, 149, name, "pv-ink", 8.4, "start", 600),
          say(x + 88, 149, price, "pv-ink pv-mono", 8.4, "end", 600),
          ...stars(x + 2.6, 158, rating, false, 2.4),
          say(x + 62, 158.8, "12 in stock", "pv-ink-soft", 6.2)
        );
      });

      out.push(
        rule(16, 170, 288, "pv-rule"),
        say(16, 183, "Free shipping over $60", "pv-ink-soft", 6.8),
        say(304, 183, "Returns within 30 days", "pv-ink-soft", 6.8, "end")
      );

      return out;
    },

    /* A hardware launch page: dark band, headline, two calls to action, the
       product itself, press row and three features. */
    landing() {
      const out = [
        rect(0, 22, 320, 76, "pv-band", 0),
        say(16, 38, "SIGNAL NINE", "pv-band-ink pv-mono", 8, "start", 700),
        say(206, 38, "Overview", "pv-band-soft", 7),
        say(244, 38, "Specs", "pv-band-soft", 7),
        rect(276, 30, 30, 11, "pv-band-btn", 3),
        say(291, 38, "Order", "pv-band-ink", 6.6, "middle", 600),
        say(16, 62, "Meet Signal Nine", "pv-band-ink pv-display", 17, "start", 600),
        say(16, 74, "A desk companion that keeps time without a screen.", "pv-band-soft", 7),
        rect(16, 80, 44, 13, "pv-accent", 4),
        say(38, 89, "Preorder", "pv-btn-ink", 6.8, "middle", 600),
        rect(66, 80, 44, 13, "pv-outline-btn", 4),
        say(88, 89, "Watch film", "pv-band-ink", 6.8, "middle", 600),
      ];

      out.push(
        rect(196, 50, 108, 42, "pv-device", 5),
        rect(202, 56, 96, 30, "pv-device-screen", 3),
        ...columns(208, 60, 84, 22, [0.3, 0.55, 0.4, 0.75, 0.5, 0.9, 0.62, 0.36, 0.7], 5),
        circle(292, 62, 2.4, "pv-accent")
      );

      ["OFF-GRID", "FIELD JOURNAL", "SIGNAL POST"].forEach((name, index) => {
        out.push(say(24 + index * 96, 116, name, "pv-ink-soft pv-mono", 7, "start", 600));
      });

      const features = [
        ["72-hour battery", "A week of desk life per charge."],
        ["Silent sync", "No account, no cloud, no noise."],
        ["Machined body", "One piece of aluminium, 380g."],
      ];

      features.forEach(([title, copy], index) => {
        const x = 16 + index * 100;
        out.push(
          circle(x + 9, 136, 9, "pv-chip"),
          shape(
            `M${x + 4.6} ${136} h3 l2 2.4 2.4-4.6 2 2.2 h3`,
            "pv-acc-stroke"
          ),
          say(x, 158, title, "pv-ink", 7.6, "start", 600),
          say(x, 168, copy, "pv-ink-soft", 6.4),
          rule(x, 176, 88, "pv-rule")
        );
      });

      out.push(rect(16, 186, 288, 10, "pv-card", 4), say(20, 193.4, "Shipping March · $180", "pv-ink", 7));

      return out;
    },

    /* Developer documentation: versioned sidebar, search, prose, a code block
       with real tokens and a pager. */
    docs() {
      return [
        rect(0, 22, 76, 178, "pv-side", 0),
        say(10, 36, "ATLAS", "pv-ink pv-mono", 8, "start", 700),
        rect(8, 42, 60, 12, "pv-card", 3),
        circle(15, 48, 2.6, "pv-line"),
        say(20, 50.5, "Search", "pv-ink-soft", 6.4),
        say(10, 66, "Getting started", "pv-accent", 7),
        say(14, 78, "Install", "pv-ink-soft", 6.8),
        say(14, 89, "Deploy", "pv-ink-soft", 6.8),
        say(14, 100, "Regions", "pv-ink-soft", 6.8),
        say(10, 114, "API", "pv-ink", 7, "start", 600),
        say(14, 126, "atlas.deploy()", "pv-ink-soft pv-mono", 6.4),
        say(14, 137, "Errors", "pv-ink-soft", 6.8),
        say(14, 148, "Webhooks", "pv-ink-soft", 6.8),
        say(10, 166, "v2.4 · older", "pv-ink-soft pv-mono", 6.4),
        say(88, 40, "Docs / Getting started", "pv-ink-soft", 6.6),
        say(88, 56, "Deploy your first app", "pv-ink pv-display", 14, "start", 600),
        say(88, 68, "One command ships a build to the region you name,", "pv-ink-soft", 6.8),
        say(88, 76, "then keeps the previous release live until traffic moves.", "pv-ink-soft", 6.8),
        rect(88, 86, 216, 58, "pv-code", 4),
        say(96, 99, "import", "pv-tok-3", 7, "start", 500),
        say(118, 99, "{ atlas }", "pv-ink", 7, "start", 500),
        say(96, 111, "atlas", "pv-tok-1", 7),
        say(114, 111, ".deploy({", "pv-ink-soft", 7),
        say(104, 123, "region: ", "pv-ink-soft", 7),
        say(134, 123, '"eu-west"', "pv-tok-2", 7),
        say(96, 135, "})", "pv-ink-soft", 7),
        circle(94, 152, 3.2, "pv-accent"),
        say(101, 154.4, "Use --dry-run to preview the change set.", "pv-ink", 6.6),
        rule(88, 166, 216, "pv-rule"),
        say(88, 178, "Install", "pv-ink-soft", 6.8),
        say(304, 178, "Regions", "pv-accent", 6.8, "end")
      ];
    },

    /* An architecture practice: quiet type, a project index with plates. */
    studio() {
      const works = [
        ["01", "Church in Voise", "2019", "a"],
        ["02", "House on the Hill", "2022", "b"],
        ["03", "Atelier Nord", "2024", "c"],
      ];

      const out = [
        say(16, 36, "HALDEN", "pv-ink pv-display", 13, "start", 600),
        say(304, 34, "Architecture · Oslo", "pv-ink-soft", 6.8, "end"),
        rule(16, 42, 288, "pv-rule"),
        photo(16, 50, 178, 100, "a", 5),
        say(20, 144, "Church in Voise — rebuilt nave, 2019", "pv-ink-soft", 6.4),
        say(206, 58, "Selected works", "pv-ink pv-display", 11, "start", 600),
        say(206, 68, "2019 — 2026", "pv-ink-soft pv-mono", 6.6),
      ];

      works.forEach(([number, name, year, plate], index) => {
        const y = 84 + index * 30;
        out.push(
          say(206, y, number, "pv-accent pv-mono", 7),
          say(220, y, name, "pv-ink", 8, "start", 600),
          say(304, y, year, "pv-ink-soft", 6.4, "end"),
          photo(206, y + 5, 98, 18, plate, index + 2),
          rule(206, y + 26, 98, "pv-rule")
        );
      });

      out.push(
        rule(16, 172, 288, "pv-rule"),
        say(16, 188, "Studio Halden · Bygdøy allé 12, Oslo", "pv-ink-soft", 6.6),
        say(304, 188, "hello@halden.studio", "pv-ink", 6.6, "end")
      );

      return out;
    },
  };

  function buildPreview(kind, options) {
    const settings = options || {};
    const withChrome = settings.chrome !== false;
    const build = LAYOUTS[kind] || LAYOUTS.editorial;

    const svg = node("svg", {
      class: settings.className || "preview",
      // Without drawn chrome the stage has an HTML bar, so crop the empty band
      // the chrome used to occupy and let the artwork fill the frame.
      viewBox: withChrome ? "0 0 320 200" : "0 22 320 178",
      "aria-hidden": "true",
      focusable: "false",
      preserveAspectRatio: "xMidYMid slice",
    });

    svg.append(rect(0, 0, 320, 200, "pv-bg", 0));

    if (withChrome) {
      svg.append(
        rect(0, 0, 320, 22, "pv-chrome", 0),
        circle(11, 11, 2.6, "pv-dot"),
        circle(20, 11, 2.6, "pv-dot"),
        circle(29, 11, 2.6, "pv-dot"),
        rect(116, 6, 88, 10, "pv-url", 5)
      );
    }

    build().forEach((element) => svg.append(element));

    return svg;
  }

  window.buildPreview = buildPreview;
  window.PREVIEW_KINDS = Object.keys(LAYOUTS);
})();
