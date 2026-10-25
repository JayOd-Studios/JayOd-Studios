# JayOd Studios

The studio website for **JayOd Studios**, an independent web development studio.

A single-page static site: no build step, no framework, no runtime dependencies.

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
| `script.js` | Mobile nav, header state, active-section tracking, reveals, contact form |
| `logo.jpg` | Full logo lockup on white (social previews only) |
| `logo-mark.png` | Transparent JO monogram for the masthead and footer |
| `robots.txt` | Crawl rules and sitemap pointer |
| `sitemap.xml` | Single-URL sitemap |

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
| `index.html` | 18.5 KB | 5.1 KB |
| `styles.css` | 23.8 KB | 5.3 KB |
| `script.js` | 6.7 KB | 2.3 KB |
| `logo-mark.png` | 11.1 KB | — |

Three same-origin requests plus the font stylesheet and font files. The CSS is ~13% smaller than the previous build. Images carry explicit dimensions, the hero (the LCP region) is never hidden behind a reveal animation, and fonts load with `display=swap`.

Not measured: real Core Web Vitals. That needs a browser and Lighthouse against the deployed URL.

## Accessibility

Semantic landmarks and one `h1`; heading levels never skip. A skip link, visible focus styles, `aria-current="location"` on the active nav item, 44px menu button, labelled fields with inline errors tied through `aria-describedby`, `role="list"` where `list-style: none` would strip semantics, and full `prefers-reduced-motion` support. All text passes WCAG AA contrast (lowest measured pair: 4.57:1).

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
