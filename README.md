# JayOd Studios

The studio website for **JayOd Studios**, an independent web development studio.

A single-page, static site: no build step, no framework, no dependencies. Open `index.html` and it runs.

## The honest bit

JayOd Studios has no portfolio websites yet, so this site does not pretend otherwise. The Work section says so plainly and turns it into the founding-client offer. There are no invented case studies, client logos, testimonials or project counts anywhere on the page — please keep it that way until there is real work to show.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole page: hero, tools, services, work, approach, studio, contact, footer |
| `styles.css` | Design system — paper/navy/terracotta palette, type scale, layout, responsive rules |
| `script.js` | Mobile nav, header state, active-section tracking, scroll reveals, contact form |
| `logo.jpg` | Full logo lockup — monogram plus wordmark, on white (used for social previews) |
| `logo-mark.png` | The JO monogram cut out on transparency, used in the header, hero card and footer |

## Sections

1. **Hero** — positioning, availability, founding-client card
2. **Tools** — the stack the studio builds with
3. **Services** — six service areas
4. **Work** — an honest pre-portfolio statement plus what every project ships with
5. **Approach** — scope, design, build, launch and care
6. **Studio** — who the studio is, plus studio facts
7. **Contact** — direct contact details and a project brief form

## Design notes

- **Palette**: paper `#F5F1E8`, navy `#14213D` (taken from the logo), terracotta accent `#C0432A`.
- **Logo**: `logo-mark.png` has no background and sits directly on the page. In the dark footer it is flipped to light with a CSS filter, so one asset covers both themes.
- **Type**: Instrument Serif for display, Inter for everything else, both loaded from Google Fonts with system fallbacks.
- Change the whole look by editing the custom properties at the top of `styles.css`.

## Contact form

The form validates in the browser and then opens the visitor's email app with a prefilled project brief addressed to `hello@jayodstudios.com`. Nothing is sent or stored by the site itself, so it works on any static host with no backend.

To use a real form endpoint instead (Formspree, Web3Forms, Netlify Forms, etc.), replace the `const CONTACT_EMAIL` / `window.location.href = mailto:...` block at the bottom of `script.js` with a `fetch()` POST to that endpoint.

## Things to fill in

These are placeholders or unsigned claims — confirm or replace before launch:

- Email address `hello@jayodstudios.com` (nav card, contact section, footer, `CONTACT_EMAIL` in `script.js`)
- The GitHub link in the footer
- The `https://jayodstudios.com/` canonical and `og:image` values in the `<head>`
- The specifics in the founding-client offer, reply time and support period
- Real case studies in the Work section as projects ship

## Running locally

```bash
python3 -m http.server 3000
```

Then open <http://localhost:3000>.

## Hosting

Any static host works — GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3.

This repo is set up for GitHub Pages from the `main` branch, root folder. Once Pages is switched on in **Settings → Pages**, the site is live at:

<https://jayod-studios.github.io/JayOd-Studios/>

When a custom domain is added, update the `canonical`, `og:url` and `og:image` values in `index.html` to match it.

## Accessibility

Semantic landmarks, a skip link, visible focus styles, labelled form fields with inline errors announced through `aria-live`, keyboard-operable navigation that closes on `Escape`, and full support for `prefers-reduced-motion`.
