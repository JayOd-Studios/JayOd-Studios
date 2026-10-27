# Vendored animation libraries

The four animation bundles are pre-built ES modules, committed so the site keeps
working without a build step and without a CDN. None uses `eval` or
`new Function`, so they run under the page's `script-src 'self'`
Content-Security-Policy unchanged.

| File | Package | Version | Minified | Gzipped |
| --- | --- | --- | --- | --- |
| `anime-4.5.0.js` | [`animejs`](https://animejs.com) | 4.5.0 | 43.1 KB | 17.2 KB |
| `motion-14.6.0.js` | [`motion`](https://motion.dev) (`motion/mini`) | 14.6.0 | 8.4 KB | 3.4 KB |
| `lenis-1.3.27.js` | [`lenis`](https://lenis.dev) | 1.3.27 | 18.3 KB | 5.3 KB |
| `gsap-3.15.0.js` | [`gsap`](https://gsap.com) (core + ScrollTrigger + SplitText) | 3.15.0 | 119.8 KB | 47.2 KB |

Anime.js, Motion and Lenis are MIT licensed — see `LICENSE-animejs.txt`,
`LICENSE-motion.txt` and `LICENSE-lenis.txt`. **GSAP is not open source**: it uses
the proprietary Standard "No Charge" licence since 3.13 (April 2025), which covers
commercial sites but forbids redistributing it as a library or building a competing
animation tool from it. See `LICENSE-gsap.txt`.

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

# lenis-1.3.27.js — the class only; the /react and /vue builds are not bundled
npm install lenis@1.3.27
echo 'export { default as Lenis } from "lenis";' > entry-lenis.js
npx esbuild entry-lenis.js --bundle --format=esm --minify --target=es2022 \
  --outfile=vendor/lenis-1.3.27.js

# gsap-3.15.0.js — core plus the two plugins this kind of page needs
echo 'export { gsap } from "gsap";
     export { ScrollTrigger } from "gsap/ScrollTrigger";
     export { SplitText } from "gsap/SplitText";' > entry-gsap.js
npx esbuild entry-gsap.js --bundle --format=esm --minify --target=es2022 \
  --outfile=vendor/gsap-3.15.0.js
```

`motion/mini` is used deliberately: the full `motion` entry is 25 KB gzipped, where
the mini build is 3.4 KB. Scroll observation stays in `motion.js` with a plain
`IntersectionObserver`, and Motion drives the animation through the Web Animations
API rather than replacing the observer.

To update a library, bump the version in the commands above, rename the output file
and update the import in `motion.js`, `anime.js` or `hero.js`.

## GSAP and Lenis

Both are committed and **neither is loaded by the page yet**, so page weight, CSP
and the deployed output are unchanged.

`gsap-3.15.0.js` exports `gsap`, `ScrollTrigger` and `SplitText`. Register the
plugins once before use:

```js
import { gsap, ScrollTrigger, SplitText } from "./vendor/gsap-3.15.0.js";
gsap.registerPlugin(ScrollTrigger, SplitText);
```

Checked in a DOM harness: `gsap.set` writes the style, and
`new SplitText(el, { type: "words" })` split a headline into three spans while
leaving the text content intact.

GSAP is the largest file here at 47.2 KB gzipped — around a quarter of the entire
current page. It also covers ground Anime.js and Motion already cover, so it is an
alternative rather than an addition: reaching for it means deciding which of the
three owns animation, ideally dropping the other.

`lenis-1.3.27.js` exports `Lenis`, the smooth-scroll module:

```js
import { Lenis } from "./vendor/lenis-1.3.27.js";
const lenis = new Lenis({ autoRaf: true });
```

Checked the same way: it instantiates, exposes a numeric `scroll` and survives a
manual `raf()`. jsdom lacks `matchMedia`, `ResizeObserver` and `Window`, so those
were stubbed for the test — the library itself needs no shims in a browser.

Two caveats before wiring Lenis in. It takes over scrolling for the whole document,
which changes the feel of every scroll-driven effect in `motion.js`: the reveal
thresholds and the approach-rail progress both assume native scroll. And it must
not initialise at all under `prefers-reduced-motion`.

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

## Considered and not vendored: a physics engine

The hero's floating glyph field (`icons.js` at the repo root) needed mutual
repulsion between 22 bodies, a soft spring home, a pointer repulsor and a
rectangle push-out. That is a physics problem, so it was searched rather than
assumed, and the candidates were measured rather than guessed at:

| Candidate | Licence | Measured | Verdict |
| --- | --- | --- | --- |
| `matter-js` 0.20.0 | MIT | 84.7 KB raw, **27.6 KB gzipped**, with only `Engine`, `Composite`, `Bodies`, `Body`, `Constraint`, `Vector`, `Events` and `Common` bundled and tree-shaken | Solves it — and would be the second-largest asset on a page whose own code is 51 KB gzipped, carrying Euler integration |
| `particles.js` | MIT | ~10 KB gzipped | Canvas particles with a pointer *repulse* mode, but **no particle-to-particle repulsion** — the effect that was actually asked for |
| `tsParticles` v3 | MIT | modular, ~40 KB+ | Same gap: `attract` and `collide` modes, no mutual repulsion |
| Chipmunk2D, LittleJS, Box2D-as-WASM | MIT / zlib | C, or a whole game engine | Not a fit for 22 glyphs of DOM |

Every force the field needs is custom, so an engine would only be carrying the
integrator. One thing was worth checking before even considering `matter-js`:
the server bundle contains **no `eval` and no `new Function`**, so it runs under
the page's `script-src 'self'` policy (no `unsafe-eval`) unchanged — which is
what made it the realistic candidate rather than one of the others.

**If the field ever needs real rigid bodies** — collisions, stacking, joints —
coming back to `matter-js` is one command:

```sh
npm install matter-js@0.20.0 esbuild
echo 'export { Engine, Composite, Bodies, Body, Constraint, Vector, Events } from "matter-js";' > entry-matter.js
npx esbuild entry-matter.js --bundle --format=esm --minify --target=es2022 \
  --outfile=vendor/matter-0.20.0.js
```

Then add it to the deploy copy step in the README, and put its licence
(`LICENSE-matterjs.txt`) here beside the others. Nothing needs it yet, so it is
not committed — 27.6 KB gzipped of unused engine is exactly the kind of weight
this file exists to keep out.

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
