# JayOd Studios

The studio website for **JayOd Studios**, an independent web development studio.

A single-page static site: no build step, no framework, and no third-party
requests at runtime. The two animation libraries are vendored locally, so the
page never loads anything it does not serve itself.

Live at <https://jayod-studios.github.io/JayOd-Studios/>.

## The honest bit

JayOd Studios has no shipped client work yet, so this site does not pretend
otherwise. The Work section is six deliberately badged **sample** entries with
generated line-art previews and no links — never screenshots of someone else's
product. Replace them as real projects ship; the moment an entry has a real URL
the badge disappears. No invented testimonials, client logos or project counts
anywhere. Please keep it that way.

## The hero stage

The homepage opens on a browser frame that builds itself. Each cycle: the
wireframe's blocks cascade in, a ghost pointer tours the layout and "clicks",
everything dissolves, and the next of five site types is drawn — a dashboard,
an editorial journal, a storefront, documentation and a studio portfolio. The
URL in the chrome bar and the caption beneath change with each build.

- The drawings come from `wireframes.js`, the same definitions the work cards
  use, so there is one source of truth for the art.
- `app.js` paints the first frame before `hero.js` loads, so the stage is never
  empty while the module arrives — or if it never does.
- Under reduced motion the stage holds one static frame, the pointer effect is
  off and the live dot stops pulsing.
- The loop pauses when the tab is hidden and resumes when it returns.
- The stage is `aria-hidden`: it is decoration, and nothing exists only inside it.

### Two traps if you edit the animation

`animate(rect, { y: 12 })` on an SVG `<rect>` animates the **geometry
attribute**, not a transform — it resets every rectangle to `y="0"` and collapses
the drawing. Animate `opacity` on shapes; keep `x`/`y` for HTML elements.

`hero.js` removes only the old `<svg>` when switching layouts; the ghost cursor
lives in the same box, so `replaceChildren` there would delete it.

## Updating the work section

Everything in the Work section comes from **`portfolio.js`** — one array, no
markup to touch. Add, remove or reorder objects; the grid reflows on its own
(three across, two rows at six entries).

```js
{
  title: "Project name",
  sector: "One short line — what kind of work it was",
  year: "2026",
  summary: "Two or three specific sentences.",
  tags: ["React", "TypeScript", "Charts"],
  url: "https://example.com",   // leave "" to keep it a placeholder
  preview: "dashboard",         // dashboard | editorial | commerce | landing | docs | studio
}
```

- **`url` empty** → no link, "Sample" badge on the artwork, "Sample entry — no
  live site" in the footer.
- **`url` set** → the title and a "View site" link open it in a new tab, and the
  badge disappears. Nothing else needs changing.
- **`preview`** picks the wireframe drawn behind the badge; an unknown value
  falls back to `editorial`.

## Design

An editorial index on a near-black canvas, not a card stack:

- A sticky numbered index for each section (`01 — Selected work` … `05 — Contact`).
- Services and the process are hairline-ruled rows, not a uniform card grid.
- Instrument Serif for display, Inter for everything else, on ink `#05070A` with
  paper `#F5F1E8` and terracotta `#E2603F`.
- Motion is used for meaning: builds, reveals, and feedback — not decoration
  loops behind text.

### Tokens

Everything visual is a custom property at the top of `styles.css`:

| Group | Examples |
| --- | --- |
| Primitives | `--ink-1000`, `--paper`, `--terracotta` |
| Semantic colour | `--bg`, `--surface`, `--text`, `--text-muted`, `--border`, `--accent` |
| Wireframe art | `--pv-block`, `--pv-panel`, `--pv-accent`, `--pv-rule` |
| Spacing | `--space-1` … `--space-32`, named by px/4 (4px steps) |
| Radius | `--radius-xs`, `--radius-sm`, `--radius-md` |

No raw hex or rgba appears in any rule — only in the token definitions.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The page |
| `styles.css` | Tokens, layout, components, responsive and reduced-motion rules |
| `portfolio.js` | Work section data — the only file to edit for projects |
| `wireframes.js` | Generated wireframe art, shared by the work cards and the hero |
| `hero.js` | The hero stage: assembles, tours, dissolves and cycles five layouts |
| `app.js` | Nav, header state, section tracking, card rendering, contact form |
| `motion.js` | Motion: scroll reveals, reading progress, hero spotlight |
| `anime.js` | Anime.js: arrow redraw, availability pulse, card hover, form bump |
| `vendor/` | Tree-shaken Motion and Anime.js builds, licences, rebuild notes |
| `logo.jpg` | Full logo lockup on white (social previews only) |
| `logo-mark.png` | Transparent JO monogram for the masthead and footer |
| `robots.txt` / `sitemap.xml` | Crawl rules and the single-URL sitemap |

Core behaviour (`app.js`) imports neither library, so a failed module never
breaks navigation, the form or the work grid.

## Motion, and what it costs

| Asset | Size | gzip |
| --- | --- | --- |
| `index.html` | 20.8 KB | 5.5 KB |
| `styles.css` | 30.5 KB | 6.3 KB |
| `app.js` | 9.9 KB | 3.2 KB |
| `hero.js` | 7.0 KB | 2.6 KB |
| `wireframes.js` | 5.5 KB | 1.9 KB |
| `motion.js` | 4.2 KB | 1.7 KB |
| `anime.js` | 3.5 KB | 1.4 KB |
| `portfolio.js` | 2.8 KB | 1.3 KB |
| `vendor/motion-14.6.0.js` | 8.4 KB | 3.4 KB |
| `vendor/anime-4.5.0.js` | 43.1 KB | 17.2 KB |
| `logo-mark.png` | 11.1 KB | — |

The page's own code is ~21 KB gzipped; the vendored animation engines add ~21 KB
more, three quarters of which is Anime.js. All animation modules are deferred
ES modules, so none of it blocks the first paint, and the hero `<h1>` is never
hidden behind an animation, so the LCP text paints immediately.

## Security

- A **Content-Security-Policy** in a `<meta>` tag: `default-src 'self'`, with
  Google Fonts allowed only for styles and font files. No third-party scripts.
- `referrer` is `strict-origin-when-cross-origin`.
- The contact form builds its fallback link with DOM nodes, not `innerHTML`.
- No secrets, no analytics, no cookies. The form stores nothing; it opens the
  visitor's mail app.

**Limitation:** GitHub Pages cannot send response headers, so the CSP lives in
the document and cannot use `frame-ancestors` or `report-uri`, and HSTS /
X-Content-Type-Options can't be set at all. A host with header control
(Cloudflare, Netlify) would be needed for those.

## Accessibility

Semantic landmarks and one `h1`; heading levels never skip. A skip link, visible
focus styles, `aria-current="location"` on the active nav item, 44px menu button
and form controls, labelled fields with inline errors tied through
`aria-describedby`, `role="list"` where `list-style: none` would strip
semantics, and full `prefers-reduced-motion` support — including a CSS rule that
forces every `[data-reveal]` element visible, so a motion preference can never
leave content hidden. All text passes WCAG AA contrast (lowest measured pair
clears 4.5:1).

The hero stage, the wireframe thumbnails and the decorative ticker are
`aria-hidden`; everything they convey is also stated in text.

## Contact form

Validates in the browser, then opens the visitor's email app with a prefilled
brief to `hello@jayodstudios.com`. Works on any static host with no backend.

For a real form endpoint (Formspree, Web3Forms, Netlify Forms), replace the
`const CONTACT_EMAIL` / `window.location.href = mailto:...` block near the end of
`app.js` with a `fetch()` POST — and add the endpoint to the CSP's `connect-src`.

## Things to fill in

- Email address `hello@jayodstudios.com` (masthead CTA target, contact section, footer, `CONTACT_EMAIL`)
- GitHub link in the footer
- The canonical / `og:url` / `og:image` values, plus `robots.txt` and `sitemap.xml`, if a custom domain replaces the Pages URL
- The specifics in the founding-client offer, reply time and support period
- Real projects in `portfolio.js` as they ship
- `sitemap.xml`'s `lastmod` whenever the page changes

## Running locally

```bash
python3 -m http.server 3000
```

Then open <http://localhost:3000>. Serve it over HTTP rather than opening the
file directly — ES modules and the CSP both need an origin.

## Hosting

GitHub Pages serves `main` from the repository root; `.nojekyll` keeps it a plain
static build.

When a custom domain is added, update the canonical, `og:url` and `og:image`
values in `index.html`, plus `robots.txt` and `sitemap.xml`.

## History

The previous navy-and-paper editorial design is still in git at `8ac69f9`, and
the dark edition was developed in `v2/` before being promoted to the root in the
commit that moved these files up.
