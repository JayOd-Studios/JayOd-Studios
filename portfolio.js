/* JayOd Studios — portfolio entries.
 *
 * This is the only file you edit to update the Work section. Add, remove or
 * reorder objects; the page renders whatever is in this array, newest first.
 *
 *   title     Project name
 *   sector    One short line: what kind of work it was
 *   year      Year, or anything short — it sits beside the sector
 *   summary   Two or three sentences. Keep it specific.
 *   tags      Three or four technologies, rendered as pills
 *   url       Live site. LEAVE EMPTY to keep it a placeholder — a card with no
 *             url renders without a link and carries the "sample" badge.
 *   preview   Which wireframe to draw: dashboard | editorial | commerce |
 *             landing | docs | studio
 *   domain    The address shown over the preview, e.g. "northwind.app"
 *   word      The large word set over the preview, e.g. "Ledger"
 *
 * The previews are generated line art, not screenshots, so a placeholder never
 * claims to be a real product. When you add a real project with a real url,
 * the badge disappears by itself.
 */

window.PORTFOLIO = [
  {
    title: "Northwind Ledger",
    sector: "Fintech dashboard",
    year: "2026",
    summary:
      "A reconciliation tool for a bookkeeping team: live balances, a searchable ledger and exports that match the accountant's format exactly.",
    tags: ["React", "TypeScript", "Charts"],
    url: "",
    preview: "dashboard",
    domain: "northwind.app",
    word: "Ledger",
  },
  {
    title: "Field Notes",
    sector: "Editorial publication",
    year: "2026",
    summary:
      "A long-form journal with a reading-first layout, keyboard-friendly navigation and an editor workflow the writers actually enjoy.",
    tags: ["Next.js", "MDX", "Typography"],
    url: "",
    preview: "editorial",
    domain: "fieldnotes.co",
    word: "Field Notes",
  },
  {
    title: "Marrow Supply",
    sector: "E-commerce",
    year: "2026",
    summary:
      "Storefront for a small goods brand: catalogue, variants and a one-page checkout, rebuilt from a theme that leaked sales on mobile.",
    tags: ["Shopify", "Liquid", "CRO"],
    url: "",
    preview: "commerce",
    domain: "marrowsupply.com",
    word: "Marrow",
  },
  {
    title: "Signal Nine",
    sector: "Product launch",
    year: "2026",
    summary:
      "A single-scroll launch page for a hardware product, with a scroll-linked story and a performance budget it ships inside.",
    tags: ["React", "Motion", "GSAP"],
    url: "",
    preview: "landing",
    domain: "signalnine.io",
    word: "Signal Nine",
  },
  {
    title: "Atlas Docs",
    sector: "Documentation",
    year: "2026",
    summary:
      "Developer documentation with search, versioned content and code samples pulled from the test suite so they can't drift.",
    tags: ["TypeScript", "Search", "A11y"],
    url: "",
    preview: "docs",
    domain: "docs.atlas.dev",
    word: "Atlas",
  },
  {
    title: "Studio Halden",
    sector: "Portfolio",
    year: "2026",
    summary:
      "A two-person architecture practice's portfolio: large plates, quiet type and a project index that loads instantly on site visits.",
    tags: ["HTML", "CSS", "Imagery"],
    url: "",
    preview: "studio",
    domain: "halden.studio",
    word: "Halden",
  },
];
