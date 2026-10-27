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

## Light and dark

The site ships both themes. `theme-boot.js` runs in `<head>` (before the
stylesheet is parsed, so nothing flashes) and sets `data-theme` from the
visitor's saved choice, or from `prefers-color-scheme` on a first visit. The
switch in the masthead flips between them and remembers the choice in
`localStorage`.

- **Every colour is a token**, so the whole page re-renders from one attribute.
  `:root` holds the dark deck; `:root[data-theme="light"]` re-points every
  semantic token at paper.
- **The switch animates.** The change runs inside a View Transition and is
  revealed as a circle of the new page growing out of the button. Element
  transitions are disabled for the duration (`html.is-theming`) — otherwise the
  new snapshot catches every colour halfway through its fade and freezes it
  there. The knob's own spin plays *after* the wipe, because a snapshot would
  freeze it mid-click.
- **Browsers without View Transitions** switch instantly; the control still
  works. So does reduced motion, which also skips the wipe.
- The switch is a `<button>` whose `sr-only` label reads "Switch to light mode"
  or "Switch to dark mode", and the `theme-color` meta is rewritten so mobile
  browser chrome matches.

### The logo, backgroundless

The monogram is navy `#19224D` — 1.3:1 against any dark surface, so on a dark
background it is effectively invisible whatever the shade. Both marks therefore
use the PNG's alpha as a **CSS mask** and take their colour from `--logo-ink`:
the exact logo navy in the light theme, a pale tint of the same blue on the dark
deck. No white chip behind it in either theme. The dark deck itself is a lifted
navy-black (`#141824`), not pure black, so the whole page reads softer.

## Design

An editorial index, not a card stack:

- A sticky numbered index for each section (`01 — Selected work` … `06 — Contact`).
- Services and the process are hairline-ruled rows, not a uniform card grid.
- Instrument Serif for display, Inter for everything else, on the studio's own
  navy `#19224D` with paper `#F6F5F1`.
- Motion is used for meaning, and each section gets the motion its job needs:
  the hero lab inspects itself, work cards lift and draw their previews, the
  approach rail fills as you scroll past the four steps, the studio statement
  fills in word by word, contact fields rise into place.
- Every scroll animation is **reversible**: scrolling back up unwinds a section
  in the order it arrived and scrolling down replays it. Nothing is `once`, so
  no reload is needed to see an animation twice.

### Tokens

Everything visual is a custom property at the top of `styles.css`:

| Group | Examples |
| --- | --- |
| Primitives | `--blue-950` … `--blue-100` (a ramp anchored on the logo), `--paper` |
| Semantic colour | `--bg`, `--surface`, `--text`, `--text-muted`, `--border`, `--accent` |
| Text accent | `--accent-text` — the same blue, lightened in dark mode until it clears 4.5:1 |
| Brand | `--logo-ink`, `--theme-dark-bg`, `--theme-light-bg` |
| Wireframe art | `--pv-block`, `--pv-panel`, `--pv-accent`, `--pv-rule` |
| Spacing | `--space-1` … `--space-32`, named by px/4 (4px steps) |
| Radius | `--radius-xs` … `--radius-lg` |

No raw hex or rgba appears in any rule — only in the token definitions. Both
themes are sampled for contrast: body copy clears 4.5:1 and accent text clears
3:1 in each.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The page |
| `styles.css` | Tokens, layout, components, responsive and reduced-motion rules |
| `portfolio.js` | Work section data — the only file to edit for projects |
| `wireframes.js` | Generated wireframe art, shared by the work cards and the hero |
| `hero.js` | The hero lab: code/preview inspector linking, pointer tilt, and the build pipeline that runs on load and on demand |
| `app.js` | Nav, header state, section tracking, card rendering, contact form |
| `theme-boot.js` | Sets the theme in `<head>`, before first paint. Classic script — an inline one would be blocked by the CSP |
| `theme.js` | The theme switch: persists the choice, runs the wipe, updates the label and `theme-color` |
| `motion.js` | Scroll choreography: Lenis + GSAP ScrollTrigger, hero intro, reveals, card draw, approach rail, scrubbed statement, reading progress |
| `anime.js` | Anime.js: arrow redraw, availability pulse, card frame hover, form bump |
| `vendor/` | Tree-shaken Motion, Anime.js, Lenis and GSAP builds, licences, rebuild notes |
| `vendor/preline-5.0.0/` | Preline accordion plugin for the FAQ — the one component library that works without React or Tailwind |
| `logo.jpg` | Full logo lockup on white (social previews only) |
| `logo-mark.png` | Transparent JO monogram for the masthead and footer |
| `robots.txt` / `sitemap.xml` | Crawl rules and the single-URL sitemap |

Core behaviour (`app.js`) imports neither library, so a failed module never
breaks navigation, the form or the work grid.

## Motion, and what it costs

| Asset | Size | gzip |
| --- | --- | --- |
| `index.html` | 31.4 KB | 7.5 KB |
| `styles.css` | 53.4 KB | 10.7 KB |
| `motion.js` | 12.0 KB | 3.8 KB |
| `app.js` | 9.8 KB | 3.1 KB |
| `hero.js` | 6.5 KB | 2.3 KB |
| `wireframes.js` | 5.4 KB | 1.9 KB |
| `theme.js` | 5.1 KB | 2.1 KB |
| `anime.js` | 3.7 KB | 1.4 KB |
| `portfolio.js` | 3.2 KB | 1.4 KB |
| `theme-boot.js` | 1.2 KB | 0.7 KB |
| `vendor/gsap-3.15.0.js` | 119.8 KB | 47.2 KB |
| `vendor/anime-4.5.0.js` | 42.1 KB | 16.9 KB |
| `vendor/lenis-1.3.27.js` | 18.3 KB | 5.3 KB |
| `vendor/motion-14.6.0.js` | 8.2 KB | 3.3 KB |
| `vendor/preline-5.0.0/accordion.js` | 10.5 KB | 3.2 KB |
| `logo-mark.png` | 10.9 KB | — |

The page's own code is ~32 KB gzipped; the five vendored engines add ~76 KB, and
**GSAP alone is 47 KB of that** — the single largest thing the site loads. It buys
ScrollTrigger's reversible, scrubbed timelines and SplitText's per-character and
per-word splitting, which is what the scroll choreography is built on. If that
weight ever needs cutting, GSAP is the place to start: dropping the SplitText
plugins and hand-splitting text would recover most of a third of it.

All animation modules are deferred ES modules and `theme-boot.js` is 1.2 KB, so
nothing meaningfully blocks the first paint. The hero `<h1>` is never hidden behind
an animation: the intro holds its copy for at most 2.8 s and a fail-safe releases
it even if `motion.js` never loads. With `prefers-reduced-motion` the page loads
no Lenis, no ScrollTrigger timelines and no split text — only static content.

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
focus styles, `aria-current="location"` on the active nav item, 44px targets on
every control and link (inline links inside a sentence excepted), labelled
fields with inline errors tied through `aria-describedby`, `role="list"` where
`list-style: none` would strip semantics, and full `prefers-reduced-motion`
support — including a CSS rule that forces every `[data-reveal]` element visible,
so a motion preference can never leave content hidden. All text passes WCAG AA
contrast in **both** themes (lowest measured pair clears 4.5:1).

The theme switch announces its next action ("Switch to light mode") rather than
its current state, and the studio statement is split into words at runtime
without `aria-hidden` or a duplicate label, so screen readers still read it as
one sentence.

The hero stage, the wireframe thumbnails and the decorative ticker are
`aria-hidden`; everything they convey is also stated in text.

## Contact form

Validates in the browser, then opens the visitor's email app with a prefilled
brief to `jayodstudios@gmail.com`. Works on any static host with no backend.
Every enquiry route — the form, the contact list, the footer and the "Email us"
fallback — points at that one address (`CONTACT_EMAIL` in `app.js`).

For a real form endpoint (Formspree, Web3Forms, Netlify Forms), replace the
`const CONTACT_EMAIL` / `window.location.href = mailto:...` block near the end of
`app.js` with a `fetch()` POST — and add the endpoint to the CSP's `connect-src`.

## Things to fill in

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
commit that moved these files up. The light theme and the centred hero arrived
after that, along with the blue accent taken from the logo.
