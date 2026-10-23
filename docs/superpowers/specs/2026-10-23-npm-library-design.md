# @koderi-dp/ui as an npm library — design

Date: 2026-10-23

## Goal

Distribute shared-ui-angular the normal Angular way: an npm package, `@koderi-dp/ui`, installed
with `npm i` and imported like any library, versioned with semver, published to npmjs.org from
CI on a `v*` tag. The shadcn registry goes away. Components, tests and the dark theme stay as
they are; only the packaging, the repo layout and the docs change.

Consumers are the koderi starters and any Angular 22 app. They are consumers, not forks: they
want the shared look and the fixes, not a copy of the source.

## Decisions

| Question | Decision                                                                         |
| -------- | -------------------------------------------------------------------------------- |
| Package  | `@koderi-dp/ui` on npmjs.org, public, first version `0.1.0`                      |
| Shape    | One package, five entry points; heavy dependencies are optional peers            |
| Build    | ng-packagr (`ng build ui`) to `dist/ui`, Angular Package Format                  |
| Layout   | Library at `projects/ui`; the showcase app stays at the root                     |
| Theme    | Shipped as `@koderi-dp/ui/theme.css`; the consumer owns `@import "tailwindcss"`  |
| Release  | GitHub Actions on tag `v*`, npm trusted publishing (no token); `0.1.0` is manual |
| Registry | Removed entirely                                                                 |

## Entry points

| Import path               | Contents                                                                                                                                                                                                                                                       | Peer dependencies it adds                                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `@koderi-dp/ui`           | primitives (button … tooltip, dialog, sheet, tabs, table), composites (status, page-shell, page-header, form, list-filter-bar, settings-section, detail-shell, confirm-dialog), `cn` and formatters, `notify` + `KoToaster`, `persisted`, chart-format helpers | `@angular/cdk`, `@angular/forms`, `@ng-icons/core`, `@ng-icons/lucide`, `ngx-sonner`, `class-variance-authority`, `clsx`, `tailwind-merge` |
| `@koderi-dp/ui/layout`    | `KoAppShell`, `KoCommandPalette`, `injectCommands`, `NavConfig`, `Brand`, `nav.ts`, `command-search.ts`                                                                                                                                                        | `@angular/router`                                                                                                                          |
| `@koderi-dp/ui/data-grid` | `KoDataGrid`, `KoKeyValueTable`, column factories, cell components, `grid-layout`, `column-widths`                                                                                                                                                             | `@tanstack/angular-table` (optional)                                                                                                       |
| `@koderi-dp/ui/charts`    | `KoTimeChart`, `KoSparkline`, `KoStateTimeline`, `buildTimeChartOption`, chart types                                                                                                                                                                           | `echarts`, `ngx-echarts` (optional)                                                                                                        |
| `@koderi-dp/ui/tree`      | `KoTree` and its directives, `injectTreeController`, `tree-controller`, `tree-select`, `tree-focus`                                                                                                                                                            | `@headless-tree/core` (optional)                                                                                                           |

- Angular packages (`core`, `common`, `forms`, `router`, `platform-browser`, `cdk`) are peers
  at `^22.2.0`; `rxjs` at `^7.8.0`.
- `tailwindcss` (`^4.1.0`), `tw-animate-css`, `@fontsource/ibm-plex-sans` and
  `@fontsource/ibm-plex-mono` are peers because the consumer's CSS build resolves them.
- Optional means `peerDependenciesMeta: { "<name>": { "optional": true } }`.
- `sideEffects: false`.
- Each entry point has exactly one `public-api.ts`. What it exports is the public API; nothing
  else is reachable. Internal helpers (`dialog-exit`, `dialog-panel`, `tree-props`,
  `sparkline-geometry`, `column-widths-state`, the `KO_*` class constants) stay private unless
  another entry point needs them. Anything the showcase imports must be public.

## Theme delivery

- `projects/ui/theme.css` is the current `src/styles.css` minus the `@import "tailwindcss"`
  line: the font imports, `tw-animate-css`, the `@theme` tokens, the base and components
  layers, the toast overrides.
- ng-packagr copies it into `dist/ui/theme.css` and the package `exports` map has
  `"./theme.css"`.
- A consumer's `src/styles.css` is:

  ```css
  @import "tailwindcss";
  @import "@koderi-dp/ui/theme.css";
  @source "../node_modules/@koderi-dp/ui";
  ```

  The `@source` line makes Tailwind generate the classes used in the library's templates.
  Without it the components render unstyled.

- The showcase's `src/styles.css` is those same three lines, with `@source` pointing at
  `../projects/ui`, so the showcase exercises the consumer path.

## Workspace layout and imports

- `projects/ui/` holds `ng-package.json`, `package.json` (name, version, peers, `sideEffects`),
  `src/public-api.ts` (primary entry) and the secondary entries `layout/`, `data-grid/`,
  `charts/`, `tree/`, each with `ng-package.json` and `src/public-api.ts`.
- `src/ui/**` moves there with `git mv`, so history survives: primitives and composites under
  `projects/ui/src/lib/`, the rest under their entry's `src/lib/`.
- Inside an entry point, imports are relative. Across entry points they use the package path
  (`@koderi-dp/ui`), never a relative path that crosses an entry boundary.
- The root `tsconfig.json` maps `@koderi-dp/ui` and `@koderi-dp/ui/*` to the library source, so the
  showcase and the tests compile against source with live reload.
- The `@/*` → `./src/*` alias stays for the showcase app only (`@/demo/...`); nothing under
  `projects/ui` uses it, so the published package has no alias to resolve.
- The showcase's imports switch from `@/ui/...` to the package paths.

## Tests and checks

- `npm test` is unchanged for a developer: Vitest (node, `*.test.ts`) then `ng test` (jsdom,
  `*.spec.ts`). Vitest includes `projects/ui/**/*.test.ts` and `src/**/*.test.ts`; the app's
  `ng test` target includes `projects/ui/**/*.spec.ts` and `src/**/*.spec.ts`.
- `npm run typecheck` covers `src/**` and `projects/ui/**`.
- `npm run build:lib` (`ng build ui`) is added and runs in CI.
- Tests do not ship: ng-packagr compiles only what `public-api.ts` reaches.
- The test counts after the move equal the counts before it (155 node, 145 specs).

## Build and release

- `ng build ui` writes `dist/ui`: FESM2022 bundles, `.d.ts`, `theme.css`, and a `package.json`
  whose `exports` has one entry per entry point plus `./theme.css`.
- The version is set from the git tag in CI (`v0.1.0` → `0.1.0`). Nobody edits it by hand.
- `.github/workflows/release.yml`, on `push` of tags `v*`:
  1. typecheck, lint, format check, tests, `ng build ui`;
  2. set the version from the tag in `dist/ui/package.json`;
  3. `npm publish --provenance --access public` from `dist/ui`, with `id-token: write`, using
     npm trusted publishing (no `NPM_TOKEN`);
  4. create a GitHub Release for the tag with the `npm pack` tarball attached.
- One-time setup, by the owner: the npm user `koderi-dp` owns the `@koderi-dp` scope, so no org is needed; publish `0.1.0` once
  from a logged-in machine (`npm publish --access public` from `dist/ui`); then on the package's
  npm settings add `koderi-dp/shared-ui-angular` + `release.yml` as a trusted publisher. CI
  publishes from `0.1.1`.
- `pages.yml` keeps deploying the showcase on pushes to `main`; it drops the registry
  freshness step and adds `ng build ui` to its check job.

## Removed

`registry.json`, `public/r/**`, `components.json`, `scripts/serve-registry.mjs`, the `shadcn`
dev dependency, the `registry:build` and `registry:serve` scripts and justfile recipes. Kept:
`.github/assets/showcase.png`, the Zard credit and LICENSE notice, the showcase.

## Docs

- `README.md` "Using it": `npm i @koderi-dp/ui` plus the peers for the entries used, a table of
  entry point → packages to install, the three-line stylesheet, `provideRouter` and
  `<ko-toaster />`, the first-app example importing from `@koderi-dp/ui` and `@koderi-dp/ui/layout`,
  a check step. "Known differences" and "Credits" stay. The registry sections go.
- `CLAUDE.md`: the library layout, "`public-api.ts` is the API", the overlay/host gotchas,
  the commands (`build:lib`), and the release procedure.

## Definition of done

- All tests pass with the same counts as before the move; lint, typecheck, format and both
  builds (`ng build`, `ng build ui`) are green.
- `dist/ui` passes `npx publint`, and its `package.json` `exports` lists the five entry points
  and `./theme.css`.
- Scratch app A, a fresh `ng new`: install the `npm pack` tarball and all peers, the
  three-line stylesheet, the README's first app; `ng build` succeeds and `ng serve` shows the
  shell, the Save toast and Ctrl+K.
- Scratch app B: install the tarball with only the `@koderi-dp/ui` and `@koderi-dp/ui/layout` peers
  (no echarts, ngx-echarts, @tanstack/angular-table, @headless-tree/core); `ng build` succeeds.
  This proves the optional peers are optional.
- The showcase deploys and matches the live React site as before.

## Risks checked first

Each gets a small spike at the start of the plan:

1. ng-packagr copies `theme.css` and exposes `./theme.css` in `exports`, and a consumer's
   Tailwind resolves `@import "@koderi-dp/ui/theme.css"` and applies its `@theme` block.
2. `@angular/build:unit-test` on the app target runs specs from `projects/ui` through
   `include`.
3. Cross-entry imports (`@koderi-dp/ui/data-grid` → `@koderi-dp/ui`) resolve to source in tests and
   the dev server, and to the package in `ng build ui`.

## Out of scope

No component or behaviour changes; no light theme; no SSR work; no Angular range beyond
`^22.2.0`; no second npm package; no changelog tooling (release notes are written by hand).

## Spike results

Run 2026-10-24 in a throwaway workspace (Angular CLI 22.2.4, ng-packagr 22.2.5, TypeScript 6.0.3,
Tailwind 4.3.3, Node 24, npm 12).

1. Theme export: works. ng-packagr copies `theme.css` (listed under `assets`) and keeps the hand-written
   `"./theme.css"` entry, merged with the entries it generates. A consumer's Tailwind resolves
   `@import "<pkg>/theme.css"` and the built CSS has `--color-spike` and `.bg-spike`. Pack with
   `npm pack ./dist/ui`: npm 12 reads `dist/ui` without `./` as a GitHub shorthand and refuses it.
2. Library specs in the app's test target: works with `include` paths relative to the app's sourceRoot.
   `@angular/build:unit-test` resolves `include` from the sourceRoot (`src`), so `projects/ui/**/*.spec.ts`
   silently matches nothing; `"../projects/ui/**/*.spec.ts"` runs the library specs. Widening
   `tsconfig.spec.json` `include` is not needed for the run, only for type-checking.
3. Cross-entry imports: works. With `paths` pointing at the sources, `ng build`, `ng serve` and `ng test`
   resolve the secondary → primary import from source, and `ng build ui` emits the bare package specifier
   (`import { SpikeService } from "@koderi-dp/ui"` in `fesm2022/koderi-dp-ui-extra.mjs`), not a relative path.

`exports` ng-packagr produced (scoped name `@koderi-dp/ui`, one secondary entry `extra`):

```json
{
  "./theme.css": { "default": "./theme.css" },
  "./package.json": { "default": "./package.json" },
  ".": { "types": "./types/koderi-dp-ui.d.ts", "default": "./fesm2022/koderi-dp-ui.mjs" },
  "./extra": {
    "types": "./types/koderi-dp-ui-extra.d.ts",
    "default": "./fesm2022/koderi-dp-ui-extra.mjs"
  }
}
```

No post-build `exports` script is needed.

## Verified

The packed tarball (`npm pack ./dist/ui`, version 0.1.0) is 178.5 kB (961.7 kB unpacked, 22 files),
installed into two fresh `ng new` apps (Angular 22, Tailwind 4).

- **App A (every peer and optional peer):** `ng build` succeeds. The stylesheet is two lines,
  `@import "tailwindcss"; @import "@koderi-dp/ui/theme.css";`; the theme's own `@source "./"` is
  enough. The built CSS contains `--color-popover`, `.bg-popover` and `cursor-col-resize` (used
  only by the data grid), and `dist/app-a/browser/media` holds 28 IBM Plex `.woff2` files.
- **App B (required peers only, no echarts, ngx-echarts, tanstack or headless-tree):** importing
  only `@koderi-dp/ui` and `@koderi-dp/ui/layout`, `ng build` succeeds. Adding
  `KoTimeChart` from `@koderi-dp/ui/charts` fails with `Could not resolve "echarts/renderers"` and
  `Could not resolve "ngx-echarts"`.
- **Deep imports:** `require.resolve('@koderi-dp/ui/lib/primitives/button.component')` and
  `require.resolve('@koderi-dp/ui/src/public-api')` both throw `ERR_PACKAGE_PATH_NOT_EXPORTED`.
