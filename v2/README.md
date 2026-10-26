# JayOd Studios — night edition (v2)

A from-scratch rebuild of the studio site: dark, motion-driven, same content and
same brand. It lives in `v2/` so the current site at the repository root keeps
running untouched while this one is reviewed. Nothing in the root site was
edited to make this work.

- Preview while the branch is deployed: `https://jayod-studios.github.io/JayOd-Studios/v2/`
- The page carries `<meta name="robots" content="noindex">` so a preview build
  never competes with the real site in search. Remove that line when promoting.

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

The card adapts to the data:

- **`url` empty** → no link, "Sample" badge on the artwork, "Sample entry — no
  live site" in the footer. This is deliberate: placeholders must never look
  like shipped client work.
- **`url` set** → the title and a "View site" link open it in a new tab, and the
  badge disappears. Nothing else needs changing.
- **`preview`** picks the wireframe drawn behind the badge. Previews are
  generated SVG line art, never screenshots, so a sample cannot impersonate
  someone else's product. An unknown value falls back to `editorial`.

The six entries currently in the file are samples, described as such in the
section copy. Replace them as real projects ship.

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

Core behaviour (`app.js`) does not import either library, so a failed module
never breaks navigation, the form or the grid.

## The hero stage

The homepage opens on a browser frame that builds itself. Each cycle: the
wireframe's blocks fade in on a stagger, a ghost pointer tours the layout and
"clicks", everything dissolves, and the next of five layouts is drawn — a
dashboard, an editorial journal, a storefront, documentation and a studio
portfolio. It is the studio's pitch made literal instead of a decorative
gradient behind a headline.

- The drawings come from `wireframes.js`, the same definitions the work cards
  use, so there is one source of truth for the art.
- `app.js` paints the first frame before `hero.js` loads, so the stage is never
  empty while the module arrives — or if it never does.
- Under reduced motion the stage renders one static frame, the pointer effect is
  off and the live dot stops pulsing. The stage is `aria-hidden`: it is
  decoration, and no information exists only inside it.
- The loop pauses when the tab is hidden and resumes on return.

### Two traps if you edit this

`animate(rect, { y: 12 })` on an SVG `<rect>` animates the **geometry
attribute**, not a transform — it resets every rectangle to `y="0"` and collapses
the drawing. Animate `opacity` on shapes and keep `x`/`y` for HTML elements.

`hero.js` removes only the old `<svg>` when switching layouts; the ghost cursor
lives in the same box, so `replaceChildren` there would delete it.

## Motion, and what it costs

| Layer | gzip |
| --- | --- |
| `motion.js` + `anime.js` | ~2.8 KB |
| `vendor/motion-14.6.0.js` | 3.4 KB |
| `vendor/anime-4.5.0.js` | 17.2 KB |

Motion drives anything scroll-based; Anime.js is limited to pointer and
keyboard interactions. Both are deferred modules. Without JavaScript the page is
fully readable, the grid renders a note pointing at `portfolio.js`, and the CSS
reduced-motion block forces every `[data-reveal]` element visible so nothing can
be stranded behind an animation that will not run.

## Promoting this to the root site

1. Move the files up: `index.html`, `styles.css`, `portfolio.js`, `app.js`,
   `motion.js`, `anime.js`, `vendor/`. Paths to `logo-mark.png` become local, so
   drop the `../` prefix in `index.html`.
2. Delete the `noindex` meta tag, and update `canonical`, `og:url` and
   `og:image` to the live URL (they currently point at `/v2/`).
3. Add the new sections to `sitemap.xml` if the URL list changes, and delete the
   old `script.js` and root `vendor/` once nothing references them.
4. Remove this `v2/` directory afterwards.

## Verified

Headless Chromium, 1440 / 1080 / 768 / 390 / 320 px, 41 checks: no console, CSP
or 404 errors; six cards render from `portfolio.js` with badges and no links;
the stage builds, tours, cycles to the next layout and changes its caption;
reveals interpolate and settle; reading progress tracks scroll; arrow redraw
completes; card hover animates the wireframe and settles; invalid submit marks
three fields; no horizontal overflow at any width; under reduced motion nothing
is hidden, the stage holds one static frame, the ticker is static and the
spotlight is off; every sampled text pair clears 4.5:1.
