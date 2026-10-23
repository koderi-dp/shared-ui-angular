# @koderi/ui npm Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the registry source under `src/ui` into the npm package `@koderi/ui` (five entry points, ng-packagr, tag-driven publish) and remove the shadcn registry.

**Architecture:** The library moves to `projects/ui` as an Angular CLI library with a primary entry and four secondary entries (`layout`, `data-grid`, `charts`, `tree`). The showcase and the tests compile against the library source through tsconfig paths; consumers get the built package from npm. The theme ships as `theme.css` in the package.

**Tech Stack:** Angular 22.2, ng-packagr 22.2.5 (`@angular/build:ng-packagr`), Tailwind 4, Vitest, publint, GitHub Actions with npm trusted publishing.

**Spec:** `docs/superpowers/specs/2026-10-23-npm-library-design.md`

## Global Constraints

- No component or behaviour changes. Files move with `git mv`; only import paths and public-API barrels change in them.
- Inside an entry point imports are relative; across entry points they are the package path (`@koderi/ui`); nothing under `projects/ui` uses the `@/*` alias.
- Each entry point has exactly one `src/public-api.ts`; it exports the components, directives, services, injectables, types and documented helpers of that entry, and everything the showcase imports from it. Internal helpers (`dialog-exit`, `dialog-panel`, `tree-props`, `sparkline-geometry`, `column-widths-state`, `KO_*` constants) are not exported unless another entry point imports them.
- Peer dependencies: `@angular/{core,common,forms,router,platform-browser,cdk}` `^22.2.0`, `rxjs` `^7.8.0`, `tailwindcss` `^4.1.0`, `tw-animate-css` `^1.4.0`, `@fontsource/ibm-plex-sans` and `@fontsource/ibm-plex-mono` `^5.3.0`, `@ng-icons/core` and `@ng-icons/lucide` `^36.1.0`, `ngx-sonner` `^3.1.0`, `class-variance-authority` `^0.7.1`, `clsx` `^2.1.1`, `tailwind-merge` `^3.7.0`; optional peers `@tanstack/angular-table` `^9.3.1`, `echarts` `^6.1.0`, `ngx-echarts` `^22.0.0`, `@headless-tree/core` `^1.8.0`. Package `version` `0.1.0`, `sideEffects: false`, `license: MIT`.
- Test counts stay 155 node tests and 145 specs. `npm run lint` has zero warnings; `npm run format:check` passes; `npm run typecheck`, `npm run build` and `npm run build:lib` succeed at the end of every task.
- The showcase keeps the `@/*` → `./src/*` alias for `@/demo/...` only.

## Review Focus

1. **A consumer installs `@koderi/ui` without the optional peers** and imports only `@koderi/ui` and `@koderi/ui/layout`: `ng build` must succeed. Test in Task 8 (app B).
2. **A consumer imports `@koderi/ui/charts` without `echarts`:** the build must fail with a module-not-found naming `echarts`, not succeed and crash at runtime. Test in Task 8 (app B).
3. **A consumer deep-imports an internal path** (`@koderi/ui/lib/...`, `@koderi/ui/src/...`): the `exports` map must refuse it. Test in Task 8.
4. **A release tag that is not `vX.Y.Z`** (`release-1`, `1.0.0`): the version script must exit non-zero and publish nothing. Test in Task 7.
5. **Fonts reach the consumer:** `@import "@koderi/ui/theme.css"` pulls `@fontsource` CSS from the consumer's `node_modules`; the built app must contain the IBM Plex font files. Test in Task 8 (app A).

---

### Task 1: Spike the three packaging risks

Throwaway, in the scratchpad. The only repo change is a "Spike results" section appended to the spec.

**Files:**

- Modify: `docs/superpowers/specs/2026-10-23-npm-library-design.md` (append)

- [ ] **Step 1: Scaffold a throwaway workspace.** `npx @angular/cli@22 new spike --style=css --ssr=false --skip-git --defaults`, then `npx ng generate library ui` and add one secondary entry `projects/ui/extra/` (`ng-package.json` with `{"lib":{"entryFile":"src/public-api.ts"}}`, a `src/public-api.ts` exporting a component that imports a service from the primary via `import { X } from "ui"`). Add `projects/ui/theme.css` containing `@theme { --color-spike: #123456; } @layer base { body { color: var(--color-spike); } }`, list it under `"assets": ["theme.css"]` in `projects/ui/ng-package.json`, and add `"exports": { "./theme.css": { "default": "./theme.css" } }` to `projects/ui/package.json`.
- [ ] **Step 2: Risk 1 — theme export.** Run `npx ng build ui`. Expected: `dist/ui/theme.css` exists and `dist/ui/package.json` `exports` has `"./theme.css"` alongside `"."` and `"./extra"`. Then `npm pack dist/ui`, install the tarball in a second fresh app with Tailwind 4 (`.postcssrc.json` + `npm i -D tailwindcss @tailwindcss/postcss`), set its `src/styles.css` to `@import "tailwindcss"; @import "ui/theme.css"; @source "../node_modules/ui";`, use `bg-spike` in `app.html`, `ng build`. Expected: the built CSS contains `--color-spike` and a `.bg-spike` rule.
- [ ] **Step 3: Risk 2 — specs from the library in the app's test target.** Add `projects/ui/src/lib/spike.spec.ts` (one `expect(1).toBe(1)`), set the app's `test` target `include` to `["src/**/*.spec.ts", "projects/ui/**/*.spec.ts"]` and widen `tsconfig.spec.json` `include` to both trees. Run `npx ng test --no-watch`. Expected: the library spec runs and passes.
- [ ] **Step 4: Risk 3 — cross-entry import.** With root `tsconfig.json` `paths` `{"ui": ["./projects/ui/src/public-api.ts"], "ui/*": ["./projects/ui/*/src/public-api.ts"]}`, import the extra entry's component in the app and run `npx ng build` (source resolution) and `npx ng build ui` (package resolution). Expected: both succeed, and `dist/ui/fesm2022/ui-extra.mjs` imports from `'ui'`, not a relative path.
- [ ] **Step 5: Record.** Append to the spec under `## Spike results` three lines, one per risk: `works` / `works with <adjustment>` / `fails: <reason>`, plus the exact `exports` shape ng-packagr produced. If risk 1 fails, note the fallback: generate `exports` with a post-build script. Commit: `docs: record packaging spike results`.

---

### Task 2: Library project and the primary entry point

**Files:**

- Create: `projects/ui/ng-package.json`, `projects/ui/package.json`, `projects/ui/tsconfig.lib.json`, `projects/ui/src/public-api.ts`
- Move (`git mv`): `src/ui/primitives/*` except `tree*` → `projects/ui/src/lib/primitives/`; `src/ui/{confirm-dialog,detail-shell,form,list-filter-bar,page-header,page-shell,settings-section,status,toaster}.component.ts`, `notify.ts`, `persisted.ts`, `status-text.ts`, `utils.ts`, `chart-format.ts` and their `.spec.ts`/`.test.ts` → `projects/ui/src/lib/`
- Modify: `angular.json`, `tsconfig.json`, `tsconfig.spec.json`, `tsconfig.typecheck.json`, `vitest.config.ts`, `package.json` (scripts, `ng-packagr`, `publint` dev deps), `src/demo/**` (imports)
- Keep in place for now: `src/ui/layout/`, `src/ui/data-grid/`, the chart files, the tree files (they import the primary as `@koderi/ui` from this task on)

**Interfaces:**

- Produces: package `@koderi/ui` whose `public-api.ts` exports every primitive and composite class, `KoToaster`, `notify`, `persisted`, `cn`, `formatBytes`, `formatDuration`, `formatRelative`, `clampFixedPopoverPosition`, `statusTone`, `statusLabel`, `Tone`, `SERIES_COLORS`, `seriesColor`, `clockTime`, `timeTicks`, `RANGES`, `RangeId`, `fieldControlClass`, `fieldFocusClass`, `buttonVariants`, `KoCheckedState`, `KoDialogService`, `KoDialogConfig`, `KO_DIALOG_BACKDROP_CLASS` (the sheet in `layout` uses it).
- Produces: tsconfig paths `"@koderi/ui": ["./projects/ui/src/public-api.ts"]`, `"@koderi/ui/*": ["./projects/ui/*/src/public-api.ts"]`.
- Produces: `npm run build:lib` = `ng build ui`; `ng test` includes `projects/ui/**/*.spec.ts`; Vitest includes `projects/ui/**/*.test.ts`.

- [ ] **Step 1: Install and register the library.** `npm i -D ng-packagr@^22.2.5 publint`. Add project `ui` to `angular.json` (`projectType: "library"`, `root: "projects/ui"`, `sourceRoot: "projects/ui/src"`, `prefix: "ko"`, build target `@angular/build:ng-packagr` with `project: "projects/ui/ng-package.json"`, `tsConfig: "projects/ui/tsconfig.lib.json"`). `ng-package.json`: `dest: "../../dist/ui"`, `lib.entryFile: "src/public-api.ts"`, `assets: ["theme.css"]`. `tsconfig.lib.json`: extends `../../tsconfig.json`, `declaration`, `declarationMap`, `inlineSources`, `types: []`, excludes `**/*.spec.ts` and `**/*.test.ts`, `angularCompilerOptions.compilationMode: "partial"`. `package.json`: the Global Constraints values, `repository`, `homepage`, and `exports: { "./theme.css": { "default": "./theme.css" } }` (or the fallback the spike recorded). Add `"build:lib": "ng build ui"` to the root scripts.
- [ ] **Step 2: Write the failing build.** `projects/ui/src/public-api.ts` exports `KoButton` from `./lib/primitives/button.component`. Run `npm run build:lib`. Expected: FAIL (file not found), proving the path is wired.
- [ ] **Step 3: Move the files** listed above with `git mv`, including `button-variants.ts`, `field-control.ts`, `dialog-exit.ts`, `dialog-panel.ts`, `dialog.service.ts` and every spec/test beside them. Rewrite their imports: `@/ui/utils` → relative, and so on. Specs that read `src/styles.css` by path (the dialog spec did) read `projects/ui/theme.css` once Task 6 exists; for now point them at `src/styles.css` relative to the repo root as before.
- [ ] **Step 4: Fill `public-api.ts`** with the exports in Interfaces. Run `npm run build:lib`. Expected: PASS, `dist/ui/fesm2022/koderi-ui.mjs` exists.
- [ ] **Step 5: Wire tests and the showcase.** `vitest.config.ts` include `["projects/ui/**/*.test.ts", "src/**/*.test.ts"]`; app `test` target include both trees; `tsconfig.spec.json` and `tsconfig.typecheck.json` include both trees; root `tsconfig.json` gains the two `@koderi/ui` paths. In `src/demo/**` replace imports of moved modules with `from "@koderi/ui"`. In the files still under `src/ui` (layout, data-grid, charts, tree) replace imports of moved modules with `from "@koderi/ui"`.
- [ ] **Step 6: Verify.** `npm test` → 155 node tests and 145 specs pass; `npm run lint`, `npm run typecheck`, `npm run build`, `npm run build:lib`, `npm run format:check` all pass. `npx ng serve` renders the primitives page unchanged.
- [ ] **Step 7: Commit.** `feat(lib): @koderi/ui primary entry point from src/ui`

---

### Task 3: `layout` and `tree` entry points

**Files:**

- Create: `projects/ui/layout/ng-package.json`, `projects/ui/layout/src/public-api.ts`, `projects/ui/tree/ng-package.json`, `projects/ui/tree/src/public-api.ts`
- Move: `src/ui/layout/*` → `projects/ui/layout/src/lib/`; `src/ui/primitives/tree*` (`tree-adapter`, `tree-focus`, `tree-props`, `tree-select`, `tree.component.ts/.html`, their tests) and `src/ui/tree-controller.ts` + test → `projects/ui/tree/src/lib/`
- Modify: `src/demo/**` imports

**Interfaces:**

- Consumes: `@koderi/ui` exports from Task 2.
- Produces: `@koderi/ui/layout` exporting `KoAppShell`, `KoSidebarFooter` (`[koHeaderEnd]` is a content slot, not a class), `KoCommandPalette`, `KoCommandRegistry`, `injectCommands`, `Command`, `Brand`, `NavItem`, `NavConfig`, `navItems`, `isNavActive`, `headerChipClass`, `searchTokens`, `matchesTokens`.
- Produces: `@koderi/ui/tree` exporting `KoTree`, `KoTreeItem`, `KoTreeItemLabel`, `KoTreeDragLine`, `KoTreeDragHandle`, `KoTreeItemProps`, `KO_TREE_ITEM`, `injectTreeController`, `KoTreeHandle`, `TREE_ROOT`, `TreeControllerOptions`, `TreeAccessors`, `TreeIdentity`, `buildTreeConfig`, `createTreeIndex`, `treeFeatures`, `resolveRootId`, `selectOnClick`, `preventScrollFocusFeature`, and `ItemInstance`/`TreeInstance` re-exported from `@headless-tree/core`.

- [ ] **Step 1: Failing build.** Create both `ng-package.json` files (`{"lib":{"entryFile":"src/public-api.ts"}}`) and `public-api.ts` files exporting from the not-yet-moved paths. `npm run build:lib` → FAIL.
- [ ] **Step 2: Move and rewrite imports** (relative inside the entry; `@koderi/ui` for `cn`, `KoButton`, `KoDialog`, `KoSheet`, `KoTooltip`, `persisted`, `KO_DIALOG_BACKDROP_CLASS`). Update `src/demo/**` to `@koderi/ui/layout` and `@koderi/ui/tree`.
- [ ] **Step 3: Verify.** `npm run build:lib` → PASS with `dist/ui/fesm2022/koderi-ui-layout.mjs` and `koderi-ui-tree.mjs` importing from `'@koderi/ui'`. `npm test` counts unchanged; lint, typecheck, build, format pass.
- [ ] **Step 4: Commit**, one per entry: `feat(lib): @koderi/ui/layout entry point`, `feat(lib): @koderi/ui/tree entry point`.

---

### Task 4: `data-grid` and `charts` entry points

**Files:**

- Create: `projects/ui/data-grid/ng-package.json` + `src/public-api.ts`, `projects/ui/charts/ng-package.json` + `src/public-api.ts`
- Move: `src/ui/data-grid/**` → `projects/ui/data-grid/src/lib/`; `src/ui/{chart-types,charts,time-chart-options,time-chart.component,sparkline-geometry,sparkline.component,state-timeline.component}.ts` + tests → `projects/ui/charts/src/lib/`
- Delete: `src/ui/` (now empty), `src/ui/data-grid/index.ts` (its exports move into `public-api.ts`)
- Modify: `src/demo/**` imports

**Interfaces:**

- Produces: `@koderi/ui/data-grid` exporting what `src/ui/data-grid/index.ts` exported today, under the same names.
- Produces: `@koderi/ui/charts` exporting `KoTimeChart`, `KoSparkline`, `KoStateTimeline`, `ChartSeries`, `ChartRow`, `TimelineState`, `DEFAULT_TIMELINE_STATES`, `buildTimeChartOption`, `TimeChartTheme`, `hasChartData`.

- [ ] **Step 1: Failing build**, as in Task 3.
- [ ] **Step 2: Move, rewrite imports, fill the barrels.** `charts.ts` becomes the barrel content of `public-api.ts` and is deleted. `src/demo/data.ts` imports `ChartRow`, `TimelineState` from `@koderi/ui/charts`.
- [ ] **Step 3: Verify.** `ls src/ui` → no such directory. `npm run build:lib` → PASS with four secondary bundles. `npm test` counts unchanged; lint, typecheck, build, format pass.
- [ ] **Step 4: Commit**, one per entry.

---

### Task 5: Theme delivery and the showcase stylesheet

**Files:**

- Create: `projects/ui/theme.css`
- Modify: `src/styles.css`, `projects/ui/package.json` (`exports`, if the spike's fallback is needed), the dialog spec that reads the stylesheet
- Test: `projects/ui/theme.test.ts` (node)

**Interfaces:**

- Produces: `dist/ui/theme.css` and the `./theme.css` export.
- Produces: showcase `src/styles.css` = `@import "tailwindcss" source("./");` / `@import "../projects/ui/theme.css";` / `@source "../projects/ui";` (the showcase imports the file relatively because the package is not in its `node_modules`; `source("./")` keeps scanning `src/`).

- [ ] **Step 1: Write the failing test** `theme.test.ts`: reads `projects/ui/theme.css`; asserts it does not contain `@import "tailwindcss"`, does contain `@theme`, `@import "tw-animate-css"`, both `@fontsource` families, and the `[data-sonner-toast]` overrides. Run `npx vitest run projects/ui/theme.test.ts` → FAIL (file missing).
- [ ] **Step 2: Create `theme.css`** as `src/styles.css` minus the `@import "tailwindcss" source("./")` line, and reduce `src/styles.css` to the three lines above. Run the test → PASS.
- [ ] **Step 3: Verify the showcase still gets every class.** `npm run build`, then grep the built CSS in `dist/browser` for `.cdk-overlay-pane`-independent markers: `bg-popover`, `animate-out`, `slide-out-to-right`, `size-2`. All present. `npx ng serve` and the primitives page look unchanged. `npm run build:lib` → `dist/ui/theme.css` exists and `dist/ui/package.json` has the `./theme.css` export. `npx publint dist/ui` → no errors.
- [ ] **Step 4: Commit.** `feat(lib): ship the theme as @koderi/ui/theme.css`

---

### Task 6: Remove the registry; rewrite CLAUDE.md

**Files:**

- Delete: `registry.json`, `public/r/`, `components.json`, `scripts/serve-registry.mjs`
- Modify: `package.json` (remove `shadcn`, `registry:build`, `registry:serve`), `justfile`, `.github/workflows/pages.yml` (drop the registry freshness step; add `npm run build:lib` to `check`), `CLAUDE.md`, `.prettierignore`/`eslint.config.mjs` if they mention removed paths

- [ ] **Step 1: Remove** the files and scripts; `npm uninstall shadcn`. Grep the repo for `registry`, `shadcn`, `components.json`, `public/r`, `@/ui` → the only hits are the spec/plan docs, the Zard credit and `CLAUDE.md` text you are about to rewrite.
- [ ] **Step 2: Rewrite `CLAUDE.md`:** what the repo is (the `@koderi/ui` library and its showcase); commands (`dev`, `build`, `build:lib`, `test`, `lint`, `typecheck`, `format`); layout (`projects/ui/<entry>/src/lib`, `src/demo`); rules: `public-api.ts` is the API, relative imports inside an entry and `@koderi/ui` across entries, the `*.component.ts`/`.ts`/`.test.ts`/`.spec.ts` rule, the overlay/host gotchas, the version comes from the tag; release procedure (tag `vX.Y.Z`, push, CI publishes; `0.1.0` was manual).
- [ ] **Step 3: Verify.** `npm test`, lint, typecheck, build, build:lib, format:check pass. `git status` clean apart from `.omc/`.
- [ ] **Step 4: Commit.** `chore: drop the shadcn registry`

---

### Task 7: Release workflow and version-from-tag

**Files:**

- Create: `scripts/set-version.mjs`, `scripts/set-version.test.ts`, `.github/workflows/release.yml`
- Modify: `vitest.config.ts` (include `scripts/**/*.test.ts`), `tsconfig.typecheck.json` if it must include `scripts/`

**Interfaces:**

- Produces: `node scripts/set-version.mjs <tag> [packageJsonPath=dist/ui/package.json]`: for a tag matching `/^v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/` writes `version` = the capture into the package.json and prints it; otherwise prints `Not a release tag: <tag>` to stderr and exits 1.

- [ ] **Step 1: Write the failing tests** in `set-version.test.ts` (node; run the script with `execFileSync` on a temp copy of a package.json): `v0.1.0` → file version `0.1.0`, stdout `0.1.0`; `v1.2.3-beta.1` → `1.2.3-beta.1`; `release-1` → exit code 1, file unchanged; `1.0.0` → exit code 1. Run → FAIL.
- [ ] **Step 2: Implement** the script. Run → PASS.
- [ ] **Step 3: Write `release.yml`.** `on: push: tags: ["v*"]`; `permissions: contents: write, id-token: write`; one job: checkout, setup-node 24 with npm cache, `npm ci`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build:lib`, `node scripts/set-version.mjs "$GITHUB_REF_NAME"`, `npx publint dist/ui`, `npm i -g npm@latest` (trusted publishing needs npm ≥ 11.5), `cd dist/ui && npm publish --provenance --access public`, `npm pack dist/ui` into `koderi-ui-<version>.tgz`, `gh release create "$GITHUB_REF_NAME" koderi-ui-*.tgz --generate-notes`. Use the same action versions as `pages.yml`.
- [ ] **Step 4: Verify locally** what can be: `npm run build:lib && node scripts/set-version.mjs v0.1.0 && grep '"version": "0.1.0"' dist/ui/package.json && npx publint dist/ui`. `npx prettier --check .github/workflows/release.yml`. Lint and tests pass.
- [ ] **Step 5: Commit.** `ci: publish @koderi/ui on a v* tag`

---

### Task 8: Verify the package in two fresh apps

Throwaway apps in the scratchpad; the only repo change is a short "Verified" note in the spec if something had to change.

- [ ] **Step 1: Pack.** `npm run build:lib && node scripts/set-version.mjs v0.1.0 && npm pack ./dist/ui` → `koderi-ui-0.1.0.tgz`.
- [ ] **Step 2: App A (everything).** `ng new app-a --style=css --ssr=false`; Tailwind 4 (`.postcssrc.json`, `npm i -D tailwindcss @tailwindcss/postcss`); `npm i ./koderi-ui-0.1.0.tgz` plus every peer and optional peer; `src/styles.css` = `@import "tailwindcss"; @import "@koderi/ui/theme.css"; @source "../node_modules/@koderi/ui";`; the README first app (Task 9 writes it; use the same code: `App` with `KoAppShell` from `@koderi/ui/layout`, `KoToaster` from `@koderi/ui`, an `Overview` page with `KoPageShell`, `KoPageHeader`, `KoButton`, `notify`). `ng build` → success; the built CSS contains `--color-popover` and `.bg-popover`; `dist/app-a/browser` contains `*.woff2` files for IBM Plex (Review Focus 5). `ng serve`, open it: the shell, "Saved" toast on Save, Ctrl+K palette.
- [ ] **Step 3: App B (optional peers really optional).** Same, but install only the required peers plus `@angular/router`; import only `@koderi/ui` and `@koderi/ui/layout`. `ng build` → success (Review Focus 1). Then add `import { KoTimeChart } from "@koderi/ui/charts"` to a component: `ng build` → fails, and the error names `echarts` or `ngx-echarts` (Review Focus 2). Then `node -e "require.resolve('@koderi/ui/lib/primitives/button.component')"` and `.../src/public-api` → both throw `ERR_PACKAGE_PATH_NOT_EXPORTED` (Review Focus 3).
- [ ] **Step 4: Record.** If any step needed a change in the repo, make it, re-run, and commit `fix(lib): <what>`. Append the outcome as `## Verified` to the spec: the tarball size, app A and B results. Commit `docs: record package verification`.

---

### Task 9: README

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Rewrite "Using it"** for the library, keeping the structure of the current walkthrough: requirements (Angular 22, Tailwind 4); install `npm i @koderi/ui` + the required peers in one command; a table "entry point → extra packages" for `layout`, `data-grid`, `charts`, `tree`; the three-line stylesheet with the `@source` line explained in one sentence; `provideRouter` and `<ko-toaster />`; the first app exactly as verified in Task 8 (`App` + `Overview` + `app.routes.ts`); the check step. Keep "Icons", "Good to know", "Known differences", "Developing" (now `build:lib` and the release procedure) and "Credits". Remove every registry mention.
- [ ] **Step 2: Verify** `npx prettier --check README.md`; grep the README for `shadcn`, `registry`, `components.json` → no hits except the Credits line.
- [ ] **Step 3: Commit.** `docs: README for the npm library`
