# Component registries — React Bits, Arc UI, Planes

Setup for three animated-component libraries, kept here so they can be pulled into a
React project later. **Nothing in this folder is part of the published site**, and
`index.html`, `styles.css` and the JS modules are untouched.

## Why there is no `npm install` here

All three are **React source registries**, not runtime packages. Each component is
delivered as `.jsx`/`.tsx` files copied into your project through the shadcn CLI. The
live site is plain HTML/CSS/ES modules with no bundler, so none of them can drop in —
they need React 19 and a build step.

Two of the five libraries in the original request are not libraries at all, and cannot
be installed anywhere:

| | What it is | Install |
|---|---|---|
| [React Bits](https://reactbits.dev) | 215+ animated React components, JS or TS, CSS or Tailwind variants | `npx shadcn@latest add @react-bits/<Name>-<JS\|TS>-<CSS\|TW>` |
| [Arc UI](https://uiarc.dev) | Animated React 19 components, CSS modules, **no Tailwind required** | `npx shadcn@latest add @uiarc/button` |
| [Planes](https://useplanes.com) | Animated React 19 components, requires **Tailwind v4** | `npx shadcn@latest add @planes/segmented-control` |
| [Animos](https://animos.app) | Hosted browser tool for turning images/video into motion showcases | Nothing — it is a website |
| [Swishy](https://swishy.ai) | Hosted AI motion-graphics app | Nothing — it is a website |

`vendor/` in the repo root is the site's own vendoring (anime.js, Motion). That is a
different mechanism: hand-written effects against a vendored runtime, not these
registries.

## Using the registry config

`.mcp.json` at the repo root starts the shadcn MCP server, which exposes the registry
tools (`list_items_in_registries`, `search_items_in_registries`,
`get_add_command_for_items`, …). Clients that read `.mcp.json` — Claude Code, Cursor,
Codex — pick it up automatically. Restart the client after first opening the repo.

The registry endpoints themselves live in `registries.json`. Paste that block into a
React project's `components.json`:

```json
{
  "registries": {
    "@react-bits": "https://reactbits.dev/r/{name}.json",
    "@uiarc": "https://uiarc.dev/r/{name}.json",
    "@planes": "https://useplanes.com/r/{name}.json"
  }
}
```

Then, inside that project:

```bash
npx shadcn@latest view @uiarc          # list a registry's items
npx shadcn@latest add @uiarc/button    # copy one in
```

Registry tools need a project with `components.json` and a `tsconfig.json`. Running
them in this repo fails on purpose — that is the guard against writing React files
into a static site.

**Dependencies to expect:** React Bits components pull `gsap` (plus `@gsap/react`);
Arc and Planes pull `motion`, which the site already vendors. Planes also expects
Tailwind v4.

## Verified

Checked against the live registries, not just the docs: the MCP server boots and
lists all seven tools, `get_project_registries` enumerates `@shadcn`, `@react-bits`,
`@uiarc` and `@planes`, and `https://reactbits.dev/r/SplitText-JS-CSS.json`,
`https://uiarc.dev/r/button.json` and `https://useplanes.com/r/segmented-control.json`
each return a real component manifest.

## Traps

- **`npm install react-bits` installs the wrong thing.** That package is an unrelated
  2017 React Native kit by another author. There is no React Bits npm package.
- **Licences differ.** Arc's free library is MIT. React Bits is **MIT + Commons
  Clause**, so its components may be used in your site but not redistributed as a
  component library. Planes' free items publish no explicit open-source licence —
  worth confirming before committing their source to a public repo.
- **Paid tiers need your account.** Arc Pro and Planes Pro are licensed per account
  with registry keys. Keys belong in `components.json`, so keep that file out of
  version control if you add one — and never commit the key.
- **The Freebuff Publish button uploads the whole folder.** This repo is deployed from
  a curated staging directory instead, which is why `README.md`, `artifacts/` and
  `skills-lock.json` already return 404 on the live site.
