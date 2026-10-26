# Vendored animation libraries

Both files are pre-built ES modules, committed so the site keeps working without a
build step and without a CDN. Neither uses `eval` or `new Function`, so they run
under the page's `script-src 'self'` Content-Security-Policy unchanged.

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

## Kokonut UI and Bklit UI

Neither is vendored here because neither is a standalone library. Both are
[shadcn/ui](https://ui.shadcn.com) registries that copy React components into a
React + Tailwind project: Kokonut UI installs through the shadcn CLI and depends on
React, Tailwind and Motion, and Bklit UI is the `@bklit` registry of chart and
utility components. This site is hand-written HTML, CSS and vanilla JavaScript with
no framework or build step, so there is no component tree for either to render
into. Using them means converting the site to React + Tailwind first, which is a
rewrite rather than a dependency install.
