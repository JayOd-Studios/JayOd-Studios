# JayOd Studios

The studio website for **JayOd Studios**, an independent web development studio.

A single-page static site: no build step, no framework, and no third-party requests at runtime. The two animation libraries are vendored locally, so the page still loads nothing it does not serve itself.

## The honest bit

JayOd Studios has no portfolio websites yet, so this site does not pretend otherwise. The Work section says so plainly and turns it into the founding-client offer. There are no invented case studies, client logos, testimonials or project counts anywhere on the page — please keep it that way until there is real work to show.

## Design

An editorial "studio index" layout rather than a stack of cards:

- A sticky left rail numbers each section (`01 — Services` … `05 — Contact`); content sits in the wide column beside it.
- Services and the process are hairline-ruled rows, not a uniform card grid.
- The hero is a typographic statement with a ruled four-column fact strip, not a floating call-to-action card.
- Instrument Serif for display, Inter for everything else, on paper `#F5F1E8` with navy `#14213D` (from the logo) and terracotta `#C0432A`.

### Tokens

Everything visual is a custom property at the top of `styles.css`:

| Group | Examples |
| --- | --- |
| Primitives | `--paper`, `--ink`, `--accent`, `--line` |
| Semantic colour | `--surface`, `--text`, `--text-muted`, `--border`, `--on-dark`, `--danger` |
| Spacing | `--space-1` … `--space-32`, named by px/4 (4px steps) |
| Radius | `--radius-xs`, `--radius-sm` |

Dark sections opt into the inverse palette by adding `.on-dark`, which re-points the semantic tokens so descendants need no special cases. No raw hex or rgba appears in any rule — only in the token definitions.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole page |
| `styles.css` | Tokens, layout, components, responsive rules |
| `script.js` | Mobile nav, header state, active-section tracking, contact form |
| `motion-reveal.js` | Scroll reveals, animated with Motion |
| `anime-fx.js` | Arrow redraw, availability pulse, invalid-form bump, animated with Anime.js |
| `vendor/` | Locally built copies of Motion and Anime.js, their licences and rebuild instructions |
| `logo.jpg` | Full logo lockup on white (social previews only) |
| `logo-mark.png` | Transparent JO monogram for the masthead and footer |
| `robots.txt` | Crawl rules and sitemap pointer |
| `sitemap.xml` | Single-URL sitemap |

## Motion

Two animation libraries, each given a job rather than both doing everything:

- **Motion** (`motion/mini`, 3.4 KB gzipped) runs the scroll reveals. Observation stays with a plain `IntersectionObserver` in the module, so the animation engine is never a precondition for content appearing — Motion only supplies the tween, through the Web Animations API.
- **Anime.js** (17.2 KB gzipped) runs the interactive moments: the CTA arrow redrawing itself on hover and keyboard focus, the slow pulse on the availability dot, and a short bump on the fields of an invalid form.

Both are deferred ES modules and both are optional. Without JavaScript the page is fully readable; if the modules fail to load, the CSS leaves every `[data-reveal]` element visible. `motion-reveal.js` never hides content in the first viewport, only animates what is still below the fold, clears its inline styles when a tween finishes, and keeps a timed failsafe so an animation that silently fails to run can never leave a section invisible. Reduced-motion is read live, not once at load: switching it on mid-session settles everything immediately and stops the pulse.

`vendor/README.md` records the pinned versions, the esbuild commands that produced each file, and why Kokonut UI and Bklit UI are not vendored — both are shadcn registries of React components, so they need a React + Tailwind build rather than a script tag.

### What the animation layer costs

It is the largest weight the page carries, and worth knowing before keeping it:

| Layer | Raw | gzip |
| --- | --- | --- |
| `motion-reveal.js` + `anime-fx.js` | 6.0 KB | 2.7 KB |
| `vendor/motion-14.6.0.js` | 8.4 KB | 3.4 KB |
| `vendor/anime-4.5.0.js` | 43.1 KB | 17.2 KB |
| **Total** | **57.6 KB** | **23.3 KB** |

That is roughly triple the 12.6 KB gzipped the rest of the page ships, and Anime.js is three quarters of it. Its jobs could be done with ~40 lines of CSS and `requestAnimationFrame`, but the library was requested. `anime-fx.js` is self-contained: deleting it, its script tag and `vendor/anime-4.5.0.js` removes every trace without touching the reveals.

## Security

- A **Content-Security-Policy** is set in a `<meta>` tag: `default-src 'self'`, with Google Fonts allowed only for styles and font files. No third-party scripts.
- `referrer` is `strict-origin-when-cross-origin`.
- The contact form builds its fallback link with DOM nodes, not `innerHTML`.
- No secrets, no analytics, no cookies. The form stores nothing; it opens the visitor's mail app.

**Limitation:** GitHub Pages cannot send response headers, so the CSP lives in the document and cannot use `frame-ancestors` or `report-uri`, and HSTS/X-Content-Type-Options can't be set at all. A host with header control (Cloudflare, Netlify) would be needed for those.

## Performance

Measured at deploy time, uncompressed → gzip:

| Asset | Size | gzip |
| --- | --- | --- |
| `index.html` | 18.6 KB | 5.1 KB |
| `styles.css` | 24.0 KB | 5.3 KB |
| `script.js` | 6.1 KB | 2.2 KB |
| `motion-reveal.js` | 3.3 KB | 1.6 KB |
| `anime-fx.js` | 2.7 KB | 1.1 KB |
| `vendor/motion-14.6.0.js` | 8.4 KB | 3.4 KB |
| `vendor/anime-4.5.0.js` | 43.1 KB | 17.2 KB |
| `logo-mark.png` | 11.1 KB | — |

Same-origin requests only, plus the font stylesheet and font files. The animation modules are deferred, so they never block the first paint, and the hero (the LCP region) is never hidden behind a reveal. Images carry explicit dimensions and fonts load with `display=swap`.

Not measured: real Core Web Vitals. That needs a browser and Lighthouse against the deployed URL.

## Accessibility

Semantic landmarks and one `h1`; heading levels never skip. A skip link, visible focus styles, `aria-current="location"` on the active nav item, 44px menu button, labelled fields with inline errors tied through `aria-describedby`, `role="list"` where `list-style: none` would strip semantics, and full `prefers-reduced-motion` support — including a CSS rule that forces `[data-reveal]` visible, so a motion preference can never leave content hidden. All text passes WCAG AA contrast (lowest measured pair: 4.57:1).

## Contact form

Validates in the browser, then opens the visitor's email app with a prefilled brief to `hello@jayodstudios.com`. Works on any static host with no backend.

For a real form endpoint (Formspree, Web3Forms, Netlify Forms), replace the `const CONTACT_EMAIL` / `window.location.href = mailto:...` block at the bottom of `script.js` with a `fetch()` POST — and add the endpoint to the CSP's `connect-src`.

## Things to fill in

- Email address `hello@jayodstudios.com` (masthead CTA target, contact section, footer, `CONTACT_EMAIL`)
- GitHub link in the footer
- The canonical / `og:url` / `og:image` values, plus `robots.txt` and `sitemap.xml`, if a custom domain replaces the Pages URL
- The specifics in the founding-client offer, reply time and support period
- Real case studies in the Work section as projects ship

## Running locally

```bash
python3 -m http.server 3000
```

Then open <http://localhost:3000>.

## Hosting

GitHub Pages serves `main` from the repository root; `.nojekyll` keeps it a plain static build.

Live at <https://jayod-studios.github.io/JayOd-Studios/>.

When a custom domain is added, update the canonical, `og:url` and `og:image` values in `index.html`, plus `robots.txt` and `sitemap.xml`.
