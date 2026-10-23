# shared-ui-angular

[![The showcase's overview page: the app shell, metric cards, a status table and charts](.github/assets/showcase.png)](https://koderi-dp.github.io/shared-ui-angular/)

The shared UI for the koderi starters, published as a shadcn registry of Angular 22
components (standalone, signals, zoneless, Tailwind 4). It ships with a showcase app that
renders every item on one set of pages.

**Showcase:** https://koderi-dp.github.io/shared-ui-angular/

## Using it

In an Angular 22 project with Tailwind 4 (`.postcssrc.json` with `@tailwindcss/postcss`),
point `components.json` at the registry. `"tsx": true` is required, otherwise the CLI
transpiles the `.ts` files to `.js`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/ui",
    "utils": "@/ui/utils",
    "ui": "@/ui/primitives",
    "lib": "@/ui"
  },
  "registries": {
    "@koderi": "https://raw.githubusercontent.com/koderi-dp/shared-ui-angular/main/public/r/{name}.json"
  }
}
```

and add the path alias to `tsconfig.json`, with the `./` (without it TypeScript 6 rejects
the path):

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

```sh
npx shadcn add @koderi/starter   # everything
npx shadcn add @koderi/app-shell # one item, with the items it needs
```

### Setup the items assume

- `@koderi/theme` writes `src/styles.css`. `shadcn add` asks before overwriting an existing
  file, even with `-y`, so add it with `-o`: `npx shadcn add @koderi/theme -o`.
- `app-shell` and `command-palette` use the router: put `provideRouter(routes)` in
  `app.config.ts`.
- Mount `<ko-toaster />` once, in the root component, so `notify` has somewhere to render.
- Give a bare `ko-checkbox`, `ko-switch` or `ko-select` a name with `aria-label="..."`; it is
  forwarded to the inner control.

### Known differences from the React originals

The full list is in `docs/superpowers/specs/2026-10-23-angular-port-design.md`. The ones you
are most likely to meet:

- A dialog closes on Escape or a backdrop click even while a confirm is pending (there is no
  `disableClose`).
- Dialogs and sheets have no exit animation.
- The number input keeps the typed text while editing and clamps to `min` on blur.
- Chart tooltips are ECharts', not Recharts'.
- Tables clip, rather than scroll, on a very narrow viewport unless wrapped in a `koScrollArea`.

## Developing

```sh
npm install
npm run dev            # the showcase (ng serve)
npm run registry:build # rebuild public/r from registry.json
npm run registry:serve # serve the registry locally at :5181
```

Every push to `main` deploys the showcase to GitHub Pages (`.github/workflows/pages.yml`).

See `CLAUDE.md` for the layout and the rules.

## Credits

The primitives follow the shadcn/new-york look and are adapted from
[Zard UI](https://github.com/zard-ui/zardui) (MIT, see `LICENSE`).
