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
 *   sample    true keeps the "Sample" badge and the "View sample" CTA, even when
 *             the card has a live staging URL
 *   url       Staging or live site. LEAVE EMPTY to keep it unlinked.
 *   image     Optional local 1440x900 snapshot shown at the top of the card.
 *             Leave it out and the drawn preview from previews.js is used.
 *   imageAlt  Describe the snapshot for screen readers.
 *   preview   Fallback wireframe: dashboard | editorial | commerce |
 *             landing | docs | studio
 *   domain    The address shown over the fallback drawing
 *   word      The large word set over the fallback drawing
 *
 * The snapshots are screenshots of the staging builds, not client work. When a
 * sample becomes a real project, remove `sample: true`; the badge disappears and
 * the CTA changes to "View site".
 */

window.PORTFOLIO = [
  {
    title: "Northwind Ledger",
    sector: "Fintech dashboard",
    year: "2026",
    summary:
      "A reconciliation tool for a bookkeeping team: live balances, a searchable ledger and exports that match the accountant's format exactly.",
    tags: ["React", "TypeScript", "Charts"],
    sample: true,
    url: "https://jayod-studios.github.io/northwind-ledger/",
    image: "samples/northwind-ledger.jpg",
    imageAlt:
      "Northwind Ledger sample homepage with balance cards, a movement chart and the reconciliation ledger.",
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
    sample: true,
    url: "https://jayod-studios.github.io/field-notes/",
    image: "samples/field-notes.jpg",
    imageAlt:
      "Field Notes sample homepage with the lead essay, issue artwork and reading-first editorial layout.",
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
    sample: true,
    url: "https://jayod-studios.github.io/marrow-supply/",
    image: "samples/marrow-supply.jpg",
    imageAlt:
      "Marrow Supply sample storefront with product photography, collection filters and a working cart.",
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
    sample: true,
    url: "https://jayod-studios.github.io/signal-nine/",
    image: "samples/signal-nine.jpg",
    imageAlt:
      "Signal Nine sample product launch page with the screenless desk clock and preorder controls.",
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
    sample: true,
    url: "https://jayod-studios.github.io/atlas-docs/",
    image: "samples/atlas-docs.jpg",
    imageAlt:
      "Atlas Docs sample documentation page with the navigation rail, deploy guide and code block.",
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
    sample: true,
    url: "https://jayod-studios.github.io/studio-halden/",
    image: "samples/studio-halden.jpg",
    imageAlt:
      "Studio Halden sample architecture portfolio with the project index and architectural photography.",
    preview: "studio",
    domain: "halden.studio",
    word: "Halden",
  },
];
