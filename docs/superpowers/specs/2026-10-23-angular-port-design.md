# Angular port of shared-ui — design

Date: 2026-10-23

## Goal

Port the koderi shared UI library from React to Angular, keeping it a shadcn-style registry:
Angular starters pull items with `npx shadcn add @koderi/<name>` and own the copied source,
exactly as the React starters do today. The React library stays the reference for the look
and behaviour.

## Decisions

| Question         | Decision                                                                         |
| ---------------- | -------------------------------------------------------------------------------- |
| Distribution     | shadcn-style registry, `public/r/*.json` built from `registry.json`              |
| Primitive layer  | Zard UI components vendored into `src/ui/primitives/`, restyled to our theme     |
| Angular version  | 22 only; standalone, signals (`input`/`output`/`model`), zoneless                |
| TimeChart engine | ECharts via `ngx-echarts`, tree-shaken `echarts/core`                            |
| Repo             | Convert this repo in place; React code and tooling are removed                   |
| Selector prefix  | `ko-` for components, `ko` for directives (`<ko-data-grid>`, `button[koButton]`) |

### Why vendor Zard rather than depend on it

- Zard's registry items use their own schema (`files: [{ name, content }]`, an `icons`
  block, no `path`/`type`/`target`), so `shadcn`'s `registryDependencies` cannot resolve
  them. Depending on Zard would make every consumer run `zard-cli` and `shadcn` side by side.
- Our primitives are already custom (own tokens, sizes, `loading`/`icon`, `IconButton`), so
  a Zard component would be edited on arrival anyway.
- It mirrors the React repo, whose `primitives/` are a copied and restyled shadcn new-york set.

Each vendored file starts with a header naming the Zard version it came from. Zard is MIT;
the README and LICENSE credit it. Upstream fixes are pulled by hand when wanted. Only the
Zard components we need are vendored.

## Stack mapping

| React                                     | Angular                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------- |
| Radix primitives                          | Vendored Zard components on `@angular/cdk`                                             |
| `@radix-ui/react-slot` / `asChild`        | Attribute selectors on native elements (`button[koButton]`, `a[koButton]`)             |
| `lucide-react`                            | `@ng-icons/core` + `@ng-icons/lucide`                                                  |
| `sonner` (`toaster.tsx`, `notify.ts`)     | `ngx-sonner`; `notify.ts` keeps its API                                                |
| `@tanstack/react-table`                   | `@tanstack/angular-table`                                                              |
| `@headless-tree/react`                    | `@headless-tree/core` with a small signals adapter                                     |
| `cmdk`                                    | Own command palette on CDK Listbox + Overlay, ranked by `command-search.ts`            |
| Recharts                                  | ECharts (`ngx-echarts`) for `TimeChart`; plain SVG/div `Sparkline` and `StateTimeline` |
| `@tanstack/react-router` (demo, `nav.ts`) | Angular Router; `nav.ts` stays framework-free                                          |
| `use-persisted.ts` hook                   | `persisted<T>(key, initial)`: a writable signal backed by `localStorage`               |
| Tailwind v4, `styles.css`, cva, `cn`      | Unchanged                                                                              |

Framework-free files carry over with their tests unchanged: `utils`, `chart-format`,
`column-widths`, `chip-fit`, `progress-level`, `tones`, `grid-layout`, `command-search`,
`nav`, `status-text`, `tree-controller`, `tree-select`, `field-control`, `button-variants`.
Three edits are allowed: `tree-controller` loses its React hook (`useTreeController`), `nav`'s
`icon` becomes a `string`, and `button.test.ts` keeps only its non-rendering test.

Icons: wherever React took a `LucideIcon` (nav items, commands, brand, detail actions,
settings sections), Angular takes the SVG string `@ng-icons/lucide` exports
(`lucideActivity`), rendered with `<ng-icon [svg]="icon" />`. Consumers pass icons the same
way React consumers pass components, and nothing needs registering.

## Items and files

- All 39 registry item names stay, so consumers and the `starter` bundle keep working.
  `registryDependencies` stay the same unless an Angular file actually needs something
  different, and stay namespaced `@koderi/<name>`.
- A `.tsx` becomes one `*.component.ts` with an inline template and styles. Big templates
  (data grid, app shell, command palette, tree) get a sibling `.html`.
- House rule, replacing the `.tsx` rule: a `*.component.ts` exports only its component or
  directive; logic lives in a plain `.ts` with its `name.test.ts` (Vitest, node) beside it.
  Tests that need Angular's TestBed are `name.spec.ts` (Angular unit-test builder, jsdom).
- Examples:
  - `button` → `primitives/button.component.ts` (`KoButton`, `KoIconButton`) +
    `button-variants.ts` + `button.test.ts`.
  - `charts` → `time-chart.component.ts`, `sparkline.component.ts`,
    `state-timeline.component.ts`, `chart-format.ts` + test.
  - `data-grid` → same folder; `column-factories.ts` returns TanStack column defs;
    status, progress and tags cells are small components rendered via `flexRender`.
  - `use-persisted` → `persisted.ts` + `persisted.spec.ts` (new test).

### Primitive API style

- Wherever a native element exists, the primitive is a directive on it: `button[koButton]`,
  `input[koInput]`, `textarea[koTextarea]`, `table[koTable]`, so forms, a11y and
  `routerLink` work without wrappers.
- Compound primitives (dialog, sheet, dropdown-menu, popover, tooltip, tabs, select) follow
  Zard's shape: a trigger directive, a content template rendered through a CDK overlay, and a
  service for opening from code (`KoDialog.open(...)`, which also backs `confirm-dialog`).
- `select`, `checkbox` and `switch` implement `ControlValueAccessor`. `input` and
  `textarea` are directives on the native element, so Angular's built-in value accessor
  already covers them. `form` becomes field/label/error helpers on top of reactive forms.

### Aliases

`components.json` keeps `@/ui`, `@/ui/primitives` and `@/ui/utils`. The unused `@reui`
registry entry is removed. Consumer setup is one tsconfig line: `"paths": { "@/*": ["src/*"] }`.

## Showcase and tooling

- Angular CLI workspace (`@angular/build`), app in `src/demo`, routes matching the React
  pages: overview, primitives, blocks, charts, data-grid, detail, settings, tree. It is
  built with `app-shell` itself.
- GitHub Pages deploy stays in `pages.yml`, building with
  `ng build --base-href /shared-ui-angular/`.
- npm scripts keep their names (`dev`, `build`, `test`, `lint`, `format`, `format:check`,
  `registry:build`, `registry:serve`) and switch to Angular tooling. ESLint uses
  `angular-eslint`, zero warnings. `CLAUDE.md` is updated to match.

## Testing

- Logic: every framework-free `.ts` keeps its `*.test.ts` on Vitest in a node environment.
  Ported tests must pass unchanged; a failing one means the port changed behaviour.
- Components: jsdom tests via Angular's Vitest unit-test builder, only for behaviour a user
  would notice breaking:
  - focus trap and return in dialog and sheet
  - keyboard navigation in dropdown-menu, command palette and tree
  - `ControlValueAccessor` round-trips in input, select, checkbox and switch
  - column resize in the data grid
  - `IconButton`'s required accessible name

  No snapshot tests.

- Visual parity: each showcase page is compared side by side with the React showcase.
  Differences are fixed or recorded as intentional (e.g. ECharts' tooltip versus Recharts').

## Known differences

Intentional differences between the Angular showcase and the React one, found by reading the
code. Visual findings from the side-by-side pass are added below.

- Chart tooltips are ECharts' (axis tooltip, its own styling), not Recharts'.
- Dialogs and sheets have no exit animation: the CDK overlay detaches on close, so only the
  enter animation plays (React's Radix content fades out).
- The number input keeps the typed text while editing and clamps to `min` on blur, so a value
  below the minimum shows until the field loses focus (React clamped as it was typed).
- The sheet is a fixed `18rem` wide (React's primitives page asked for `w-80`); the CDK
  dialog config sets the width, not a class.
- Primitives page: the popover, checkbox and tab demos that the Angular port had added before
  are gone, so the page mirrors React's sections exactly.
- An unknown path shows a bare "Not Found" paragraph, as TanStack Router's default does.
- Tables sit in an `overflow-hidden` wrapper without React's inner `overflow-x-auto` div (a
  directive cannot add a wrapper), so a very narrow viewport clips a wide table instead of
  scrolling it, unless it is put in a `koScrollArea`.

## Definition of done

Per item:

- Files listed in `registry.json` with Angular `dependencies` and namespaced
  `registryDependencies`.
- `registry:build`, `lint`, `test` and `build` all pass.
- `npx shadcn add @koderi/<name>` into a scratch Angular 22 app compiles there.

Whole port: `npx shadcn add @koderi/starter` into a fresh Angular 22 app installs
everything, and a page using `ko-app-shell`, `ko-data-grid` and `ko-time-chart` builds
and renders.

## Order of work

1. Registry spike: confirm `shadcn add` installs Angular `.ts`/`.html` files with explicit
   targets into an Angular app. If it does not, write a small `koderi add` script that reads
   the same `public/r/*.json`. The consumer ends up with the same files either way, so nothing
   else in this design depends on the result.
   Spike result (2026-10-23): shadcn add works for Angular files — explicit `target`s install the .ts and .html byte-identical and add clsx; needs `"tsx": true` in components.json (false rewrites .ts to .js) and `./src/*` (not `src/*`) in tsconfig paths.
2. Scaffold the Angular workspace; carry over the logic files with green tests.
3. Theme and primitives.
4. Composites: status, page-shell, page-header, detail-shell, settings-section,
   list-filter-bar, form, confirm-dialog, toast.
5. Tree, data grid, charts.
6. Layout: nav, command palette, app shell, use-persisted.
7. Showcase pages and Pages deploy.
8. Rebuild the registry; verify `@koderi/starter` in a scratch app.

## Out of scope

- Automatic sync from the React repo; future changes are ported by hand.
- New components beyond the existing 39 items.
- A light theme (the React library is dark-only).
- SSR work beyond not breaking it: `localStorage`/`window` access is guarded with
  `isPlatformBrowser`.
- Zard components we do not use.
