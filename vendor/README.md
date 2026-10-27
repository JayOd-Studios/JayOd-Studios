# Vendored animation libraries

The two animation bundles are pre-built ES modules, committed so the site keeps
working without a build step and without a CDN. Neither uses `eval` or
`new Function`, so they run under the page's `script-src 'self'`
Content-Security-Policy unchanged.

| File | Package | Version | Minified | Gzipped |
| --- | --- | --- | --- | --- |
| `anime-4.5.0.js` | [`animejs`](https://animejs.com) | 4.5.0 | 43.1 KB | 17.2 KB |
| `motion-14.6.0.js` | [`motion`](https://motion.dev) (`motion/mini`) | 14.6.0 | 8.4 KB | 3.4 KB |

Both are MIT licensed — see `LICENSE-animejs.txt` and `LICENSE-motion.txt`.

## Why they are bundled rather than used from a CDN

The page has a strict `script-src 'self'` policy, so third-party script origins are
blocked on purpose. Committing tree-shaken bundles keeps that policy intact and
avoids a runtime dependency on a CDN.

## How these files were produced

The published bundles are large because they carry every feature. Each one here is
an entry file containing only the exports this site uses, bundled and tree-shaken
with esbuild:

```sh
npm install animejs@4.5.0 motion@14.6.0 esbuild

# anime-4.5.0.js — stagger is needed by the hero sequence and card hover
echo 'export { animate, svg, utils, cubicBezier, stagger } from "animejs";' > entry-anime.js
npx esbuild entry-anime.js --bundle --format=esm --minify --target=es2022 \
  --outfile=vendor/anime-4.5.0.js

# motion-14.6.0.js — mini carries animate(); inView/stagger live in full motion
echo 'export { animate } from "motion/mini";' > entry-motion.js
npx esbuild entry-motion.js --bundle --format=esm --minify --target=es2022 \
  --outfile=vendor/motion-14.6.0.js
```

`motion/mini` is used deliberately: the full `motion` entry is 25 KB gzipped, where
the mini build is 3.4 KB. Scroll observation stays in `motion.js` with a plain
`IntersectionObserver`, and Motion drives the animation through the Web Animations
API rather than replacing the observer.

To update a library, bump the version in the commands above, rename the output file
and update the import in `motion.js`, `anime.js` or `hero.js`.

## The React-only registries

These are not vendored here because none is a standalone library. All are
[shadcn/ui](https://ui.shadcn.com) registries that copy React components into a
React + Tailwind project:

- **Kokonut UI** — installs through the shadcn CLI; React, Tailwind and Motion.
- **Bklit UI** — the `@bklit` registry of chart and utility components.
- **React Bits** — 215+ components; GSAP-based; MIT plus Commons Clause.
- **Arc UI** — React 19, CSS modules, no Tailwind required; MIT.
- **Planes** — React 19 plus Tailwind v4.
- **Watermelon UI** — React 19, Tailwind v4 plus shadcn; MIT.
- **Motion Primitives** — React plus `motion`, Tailwind-styled; MIT; beta.

This site is hand-written HTML, CSS and vanilla JavaScript with no framework or
build step, so there is no component tree for any of them to render into. Using
them means converting the site to React plus Tailwind first, which is a rewrite
rather than a dependency install. Registry endpoints and install commands are
recorded in [`tooling/shadcn/README.md`](../tooling/shadcn/README.md).

Preline is the exception and is vendored above: its plugins are plain UMD bundles,
so they work here without React or Tailwind.

## Preline UI

`preline-5.0.0/accordion.js` is the accordion plugin from
[Preline UI](https://preline.co) 5.0.0, released 21 August 2026. It is the per-plugin
UMD build rather than `dist/preline.js`, because the full bundle is 428 KB and
carries every component where this one is 10.7 KB raw, 3.2 KB gzipped. Checksum
matches the published tarball.

Preline is HTML plus Tailwind, but **its plugins do not need Tailwind**. Verified by
running this bundle in a DOM harness against hand-written CSS: clicking a
`.hs-accordion-toggle` adds `active` to its `.hs-accordion`, sets
`aria-expanded="true"`, applies `display: block` to the content, and closes its
siblings. The behaviour and the ARIA state are Preline's; every visual state is ours.

Markup it expects:

```html
<div class="hs-accordion-group">
  <div class="hs-accordion">
    <button class="hs-accordion-toggle" aria-expanded="false" aria-controls="faq-1">
      Question
    </button>
    <div id="faq-1" class="hs-accordion-content">Answer</div>
  </div>
</div>
```

It auto-initialises on load. For markup inserted later, call
`window.HSStaticMethods.autoInit()`.

**Licence is dual: MIT *and* the Preline UI Fair Use License** — see `LICENSE.txt`.
Free for personal and commercial sites; the Fair Use terms restrict building a
competing UI kit out of it. Preline Pro is a separate paid product.

**Nothing references this file yet.** It is vendored so a component can be wired in
without adding a build step; the page does not load it, so page weight, CSP and the
deployed output are all unchanged. The other plugins are siblings in the same
release (`dropdown.js`, `carousel.js`, `tooltip.js`, …) — copy the one you need into
this folder alongside it.
