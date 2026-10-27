# JayOd Studios

The studio website for **JayOd Studios**, an independent web development studio.

A single-page static site: no build step, no framework, and no third-party
requests at runtime. The two animation libraries are vendored locally, so the
page never loads anything it does not serve itself.

Live at <https://jayod-studios.github.io/JayOd-Studios/>.

## The honest bit

JayOd Studios has no shipped client work yet, so this site does not pretend
otherwise. The Work section is six deliberately badged **sample** entries with
drawn previews — real headlines, real prices, real chart values, photographs as
tonal plates — and no links. They are drawings rather than screenshots, so
nothing there impersonates someone else's product, and no blank box ever stands
in for a word. Replace them as real projects ship; the moment an entry has a real
URL the badge disappears. No invented testimonials, client logos or project
counts anywhere. Please keep it that way.

## The hero stage

The homepage opens on the lab, filling the screen. It is an editor: the markup
that builds a page on the left, the page it produces on the right, the build
strip underneath. It holds that size for the first slice of scroll, then docks
into the card it lives in for the rest of the page — while 56 code glyphs crowd
the margin around it.

### The morph

- The opening frame is **drawn by the stylesheet** and read back from the element
  by `motion.js`. That is what lets the panel be the right size on the very first
  paint with no module having run, and what lets `icons-boot.js` place the glyph
  field against the real frame instead of a second copy of the same arithmetic.
  `--frame-inset-x` is `clamp(28px, 7.5vw, 140px)` and `--frame-inset-y` is
  `clamp(20px, 6vh, 88px)`, exactly as before — they simply live in one place now.
- `theme-boot.js` puts `hero-mega` on `<html>` before the first paint, so the
  full-screen hero is decided before the page renders rather than after GSAP has
  downloaded.
- `heroMorph()` scrubs one number from 0 to 1. The first **14%** of the hero's
  scroll is a hold, so the opening frame sits still; a smoothstep then carries
  width, height and top down to the docked frame.
- Width, height and top are animated rather than a transform, on purpose:
  scaling the frame would render 13px labels at 8px when docked and blur the
  type when open. `contain: layout` keeps that reflow inside the panel, and
  writes are skipped when the value has not moved.
- The docked frame is fitted to what is actually left — under the measured copy,
  above the caption. A longer headline shortens the panel instead of sliding
  underneath it.
- `hero-live` confirms the morph is running. If `motion.js` never arrives (blocked
  module, failed import) the class is pulled after 2.8s and the hero falls back to
  the plain stacked layout it ships without JavaScript.
- The scrub runs both ways: scrolling up returns the frame to full screen and
  scrolling down docks it again, as many times as you like, with no reload.
- Below 620px of viewport height there is not enough room for both states, so the
  morph is skipped and the stacked hero is used.
- Reduced motion gets no `hero-mega` at all: stacked hero, copy visible, no scrub.

### The bubble

Widescreen keeps the frame off the edges rather than bleeding it to the viewport:
inset 7.5% of the width (capped at 140px) and 6% of the height (capped at 88px),
starting under the measured masthead, with the corner radius closing from
`--radius-xl` (28px) to `--radius-md` (14px) as the frame shrinks. The margin that
leaves is not decoration: it is where the glyph field lives, which is why the
geometry and the look are one decision — and now one place, the stylesheet.

Below 1024px of width the stylesheet hides the field and the inset collapses
toward a few pixels. The docked card is `min(900px, 100% - 32px)` wide, so at a
900–1000px viewport it comes within 34px of both edges and there is no margin to
float in. **That number is measured, not guessed** — the bands were checked at
900, 960, 1024, 1280, 1440 and 2560 wide in both frame states.

### The glyph field

56 code glyphs crowd the margin the frame leaves: 16 down each side, 12 across
the top and 12 underneath. `icons.js` is a small physics simulation — a **home
spring** pulls each glyph back to its slot so the arrangement never degrades into
a heap; **pointer repulsion** opens the field around the cursor and lets it close
again from the outside in; and **glyph-to-glyph repulsion** — 1,540 pair checks a
frame — is what makes it read as fluid rather than scripted, because a glyph
pushed aside pushes its neighbour in turn. A press on the hero that is *not* on a
link or a control sends a shockwave through the field; nothing is captured, so a
drag still selects text and a button still clicks.

**Where the glyphs go is not decided in `icons.js`.** It is `icons-boot.js`, a
classic script, so that it runs while the parser is still at the hero — before the
first paint. Laying the field out from the module meant the browser painted every
glyph at its fallback slot first and then jumped: the module's imports are not
resolved until after the page has been shown. Same arithmetic, earlier clock.
`icons.js` reads the layout back through `window.JayodField.layout()` once a
frame and owns the motion.

The layout itself is four steps, and each one exists because a simpler version was
wrong:

1. **Carve the frame out of the field.** What is left is one band per side, which
   is where the band names come from. The frame is measured, so this follows it as
   it docks and as the viewport changes.
2. **Carve the copy's words out of the bands.** The rects come from a `Range`, so
   the keep-out hugs the text rather than the full-width block box — which is what
   leaves room for glyphs *beside* the headline instead of only above and below
   it.
3. **Deal each band's glyphs into the pieces it has left, by area.** A band that
   has no room hands its glyphs to the side nearer their home. That case is real:
   once the frame has docked, the strip above it is the gap under the copy and the
   strip below is the caption, and neither can hold a glyph.
4. **Pack each piece as a grid** — the column count that leaves the most air
   around the largest glyph standing in it — and add seeded jitter so the result
   reads as a drifting field rather than a table.

Two traps are worth naming, because both were shipped and seen:

- **A transform does not add to `left`.** The stylesheet's slots position the
  glyphs with `left`/`top`; the moment the field is scripted, the placement *is*
  the transform, and `left` has to be zeroed or every glyph is displaced by its
  own fallback slot — a few hundred pixels, for the ones down the right. That was
  the migration that looked like the page "loading in".
- **Nothing may depend on the copy's font metrics at load.** The layout treats the
  copy as a keep-out only while it is actually on screen, which in the opening
  state it is not, so the first arrangement depends on the frame alone and cannot
  shift when the webfont arrives.

The `--x`/`--y` slots in `styles.css` are the no-JavaScript arrangement, generated
from the glyph table by `tooling/build-icons.cjs`. **Re-run that rather than
nudging one by hand:** a slot inside the frame's footprint is invisible the moment
the frame opens, and the arithmetic that decides the real arrangement is checked —
see Checks below.

The field is decorative: `aria-hidden`, no pointer events, nothing on the
keyboard path. It pauses when the hero leaves the viewport and when the tab is
hidden, stands still under `prefers-reduced-motion`, and is hidden below its
breakpoint rather than crowding the frame.

### The controls

The strip along the bottom of the frame changes the demo site, not the page:
three accents, a dark variant, compact density, a wireframe switch, and two
section switches that remove whole sections from the mock. **Wireframe** is the
interesting one — it draws the finished page the way the work cards are drawn,
with type turned into bars. The bars take their width from the text they replace,
which is why the copy stays in the markup and only its colour goes: there is no
second set of placeholder blocks to keep in step with the first. Each control writes the declaration it
changed into the monospace readout on the right, announces the change through a
polite live region, and exposes its state with `aria-pressed`. They work the same
in both states — full screen and docked — because they are part of the frame.

They work by overriding tokens scoped to `.lab-preview`, plus the `hidden`
attribute for the sections, so no mock rule knows a control exists.

### One trap if you edit the previews

`animate(rect, { y: 12 })` on an SVG `<rect>` animates the **geometry
attribute**, not a transform — it resets every rectangle to `y="0"` and collapses
the drawing. Animate `opacity` on shapes; keep `x`/`y` for HTML elements.

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
- **`preview`** picks the layout drawn behind the badge — `dashboard | editorial |
  commerce | landing | docs | studio`; an unknown value falls back to `editorial`.

## Adding another sample project

The six previews are drawn in **`previews.js`**, one function per layout, in a fixed
320 x 200 space: `photo()` for a clipped photograph, `chart()` and `columns()` for
graphs, `stars()`, `avatar()` and `say()` for text. Every colour is a class from
the `--pv-*` tokens, so the artwork re-inks itself when the theme flips. Add a
layout to `LAYOUTS` and name it in a `portfolio.js` entry.

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
| Drawn previews | `--pv-ink`, `--pv-ink-soft`, `--pv-card`, `--pv-img-a`…`c` (photographs), `--pv-live`/`--pv-warn`, `--pv-tok-1`…`3` |
| Glyph field | `--chip-1` … `--chip-6` (the six tones), `--frame-inset-x`/`-y` (the opening frame) |
| Spacing | `--space-1` … `--space-32`, named by px/4 (4px steps) |
| Radius | `--radius-xs` … `--radius-lg` |

Colour lives in the token definitions, not in the rules. Three rules carry a raw
value and each has a reason: a highlight sweep over `rgba(255, 255, 255, …)`, which
is a glaze rather than a colour; the focus ring's mask, where
`linear-gradient(#000 0 0)` needs an opaque colour and any token would be an
arbitrary one; and one shadow under the hero panel. Both themes are sampled for
contrast: body copy clears 4.5:1 and accent text clears 3:1 in each.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The page |
| `styles.css` | Tokens, layout, components, responsive and reduced-motion rules |
| `portfolio.js` | Work section data — the only file to edit for projects |
| `previews.js` | The drawn previews on the work cards: real copy, charts, photographs as clipped plates |
| `hero.js` | The hero lab: code/preview inspector linking, pointer tilt, the demo's accent/theme/density/wireframe/section controls, and the build pipeline |
| `icons-boot.js` | The glyph field's layout engine, run as a classic script so it places all 56 glyphs before the first paint |
| `icons.js` | The glyph field's motion: the home spring, pointer and glyph-to-glyph repulsion, the click shockwave |
| `app.js` | Nav, header state, section tracking, card rendering, contact form |
| `theme-boot.js` | Sets the theme in `<head>`, before first paint. Classic script — an inline one would be blocked by the CSP |
| `theme.js` | The theme switch: persists the choice, runs the wipe, updates the label and `theme-color` |
| `motion.js` | Scroll choreography: Lenis + GSAP ScrollTrigger, the hero's full-screen-to-docked morph, reveals, card draw, approach rail, scrubbed statement, reading progress |
| `anime.js` | Anime.js: arrow redraw, availability pulse, card frame hover, form bump |
| `vendor/` | Tree-shaken Motion, Anime.js, Lenis and GSAP builds, licences, rebuild notes |
| `vendor/preline-5.0.0/` | Preline accordion plugin for the FAQ — the one component library that works without React or Tailwind |
| `logo.jpg` | Full logo lockup on white (social previews only) |
| `logo-mark.png` | Transparent JO monogram for the masthead and footer |
| `robots.txt` / `sitemap.xml` | Crawl rules and the single-URL sitemap |
| `manifest.json` / `index.js` | Freebuff Sites deploy manifest and its assets-only Worker — see Publishing |

Core behaviour (`app.js`) imports neither library, so a failed module never
breaks navigation, the form or the work grid.

## Motion, and what it costs

| Asset | Size | gzip |
| --- | --- | --- |
| `index.html` | 49.9 KB | 10.4 KB |
| `styles.css` | 77.9 KB | 17.7 KB |
| `previews.js` | 17.7 KB | 6.2 KB |
| `motion.js` | 17.3 KB | 5.9 KB |
| `icons-boot.js` | 16.4 KB | 5.5 KB |
| `icons.js` | 12.9 KB | 4.6 KB |
| `hero.js` | 11.4 KB | 3.8 KB |
| `app.js` | 10.2 KB | 3.3 KB |
| `theme.js` | 5.1 KB | 2.1 KB |
| `anime.js` | 3.7 KB | 1.4 KB |
| `portfolio.js` | 3.2 KB | 1.4 KB |
| `theme-boot.js` | 2.6 KB | 1.2 KB |
| `vendor/gsap-3.15.0.js` | 119.8 KB | 47.2 KB |
| `vendor/anime-4.5.0.js` | 42.1 KB | 16.9 KB |
| `vendor/lenis-1.3.27.js` | 18.3 KB | 5.3 KB |
| `vendor/motion-14.6.0.js` | 8.2 KB | 3.3 KB |
| `vendor/preline-5.0.0/accordion.js` | 10.5 KB | 3.2 KB |
| `logo-mark.png` | 10.9 KB | — |

The page's own code is ~64 KB gzipped; the five vendored engines add ~76 KB, so
the page ships around 140 KB. Of that growth, ~10 KB of `index.html` is the 56
glyph drawings and ~5 KB of `previews.js` is the artwork being pages rather than
bars — both are the price of the two things they buy, and both are static text
that compresses well. **GSAP alone is 47 KB** of the vendored weight — the single
largest thing the site loads. It buys
ScrollTrigger's reversible, scrubbed timelines and SplitText's per-character and
per-word splitting, which is what the scroll choreography is built on. If that
weight ever needs cutting, GSAP is the place to start: dropping the SplitText
plugins and hand-splitting text would recover most of a third of it.

All animation modules are deferred ES modules, and the two classic scripts in the
document are small — except `icons-boot.js`, which is deliberately blocking. It
costs one layout read before the first paint and buys a field that is never seen
in the wrong place; the alternative, as shipped, was a visible jump on every load. Only the `<h1>`'s *links* are taken
out of reach while the hero copy is faded behind the full-screen frame (`inert`),
and the heading itself stays in the accessibility tree the whole time. The copy
is released after at most 2.8 s by a fail-safe even if `motion.js` never loads.
With `prefers-reduced-motion` the page loads no Lenis, no ScrollTrigger timelines
and no split text — only static content.

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
every control (including the lab's four-way tool strip) and link (inline links
inside a sentence excepted), labelled
fields with inline errors tied through `aria-describedby`, `role="list"` where
`list-style: none` would strip semantics, and full `prefers-reduced-motion`
support — including a CSS rule that forces every `[data-reveal]` element visible,
so a motion preference can never leave content hidden. All text passes WCAG AA
contrast in **both** themes (lowest measured pair clears 4.5:1).

The theme switch announces its next action ("Switch to light mode") rather than
its current state, and the studio statement is split into words at runtime
without `aria-hidden` or a duplicate label, so screen readers still read it as
one sentence.

The hero stage, the glyph field, the drawn previews and the decorative
ticker are `aria-hidden`; everything they convey is also stated in text. The
field takes no pointer events either, so it is not on the keyboard path, and it
stops running when the hero leaves the viewport.

## Contact form

Validates in the browser, then opens the visitor's email app with a prefilled
brief to `jayodstudios@gmail.com`. Works on any static host with no backend.
Every enquiry route — the form, the contact list, the footer and the "Email us"
fallback — points at that one address (`CONTACT_EMAIL` in `app.js`).

For a real form endpoint (Formspree, Web3Forms, Netlify Forms), replace the
`const CONTACT_EMAIL` / `window.location.href = mailto:...` block near the end of
`app.js` with a `fetch()` POST — and add the endpoint to the CSP's `connect-src`.

## Checks

Three of them, because they answer three different questions. Each is run from
the project root.

```sh
node tooling/check-field.cjs     # the layout engine, 9 viewports x both frame states
node tooling/build-icons.cjs --check   # are the generated field and slots current?
node artifacts/smoke.mjs         # the whole page's structure, in jsdom (needs jsdom)
```

- **`tooling/check-field.cjs`** runs the real `plan()` from `icons-boot.js` against
  synthetic viewport geometry and prints the *visible fraction* of the worst glyph
  at each size, in both frame states. It reads the glyph table back out of
  `index.html`, so it cannot drift from what ships. Every glyph is at least 78%
  visible at every width from 1024 to 3840, and none sits over the frame — that
  promise is the output of this script, not an opinion about the code.
- **`artifacts/smoke.mjs`** is jsdom, so it has no layout: it proves the markup
  binds, the modules load, the cards carry real copy and the wiring is right. It
  cannot prove anything about pixels.
- **`tooling/check-browser.mjs`** is the one that can, and it wants Chromium:

```sh
npm install --prefix /tmp/pw playwright && npx --prefix /tmp/pw playwright install chromium
NODE_PATH=/tmp/pw/node_modules node tooling/check-browser.mjs
```

  It loads the page in a real browser at 1440x900 and asserts what the other two
  cannot: that every glyph is inside the viewport and clear of the frame in both
  states, that the frame actually docks as it scrolls, and — the point of the
  exercise — that no frame ever showed the field before it had been placed, and
  that the glyphs are in the same place after parsing as they are two seconds
  later. It writes `artifacts/field-open.png`, `field-mid.png`, `field-docked.png`
  and `previews-dark.png` / `previews-light.png`.

  It has already earned its place twice: it caught a `RangeError: Maximum call
  stack size exceeded` from a helper that shared a name with the global it called
  — jsdom runs scripts through `eval`, so the culprit was not even a global there
  and the structural suite passed — and it is the only thing that can tell you
  whether the layout the other two check arithmetically is the layout a browser
  actually paints.

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

### Publishing to Freebuff Sites

The Freebuff site is deployed from a **curated staging folder**, never the repo
root: `README.md`, `artifacts/`, `tooling/` and the dev configs are not part of the
site and 404 from the live origin.

```sh
mkdir -p public/vendor/preline-5.0.0
cp index.html styles.css app.js motion.js hero.js icons-boot.js icons.js anime.js \
   portfolio.js previews.js theme.js theme-boot.js logo-mark.png logo.jpg \
   robots.txt sitemap.xml public/
cp vendor/{anime-4.5.0,motion-14.6.0,lenis-1.3.27,gsap-3.15.0}.js public/vendor/
cp vendor/preline-5.0.0/accordion.js public/vendor/preline-5.0.0/
# then deploy with manifest.json, which points at ./public
```

Two things that cost hours to find, both worth knowing before touching this:

1. **The deploy manifest must be named `manifest.json`.** The same bytes in a file
   called `deploy.json` are rejected with `invalid_site_request: invalid_type` —
   no field name, no useful message. A public bug report (#1529) describes the
   same failure with nine different manifest shapes, so the filename is the
   thing that actually matters.
2. **`spa` must be `false`.** With SPA fallback on, every missing path returns
   `index.html` with a 200 — so `/README.md` looks exposed and mistyped URLs
   soft-404. Off, they return a real 404.

`manifest.json` and `index.js` (an assets-only Worker) are committed for this
reason. `public/` is a build artefact and is gitignored.

## History

The previous navy-and-paper editorial design is still in git at `8ac69f9`, and
the dark edition was developed in `v2/` before being promoted to the root in the
commit that moved these files up. The light theme and the centred hero arrived
after that, along with the blue accent taken from the logo.
