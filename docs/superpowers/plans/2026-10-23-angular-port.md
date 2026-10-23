# Angular Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn this React shadcn-registry UI library into an Angular 22 one with the same 39
registry items, the same look, and the same `npx shadcn add @koderi/<name>` install.

**Architecture:** The repo becomes an Angular CLI workspace. `src/ui/**` stays the registry
source and `src/demo/**` the showcase. Primitives are Zard UI components vendored and restyled.
Composites are built on them, and framework-free `.ts` logic carries over with its tests.
The React source moves to `reference/react/` while porting so each task can read the original,
and is deleted in the last task.

**Tech Stack:** Angular 22.2 (standalone, signals, zoneless), `@angular/cdk` 22.2,
Tailwind 4.1, class-variance-authority, `@tanstack/angular-table` 9.3.1,
`@headless-tree/core` 1.8.0, `ngx-echarts` 22 + `echarts` 6.1, `ngx-sonner` 3.1,
`@ng-icons/core` + `@ng-icons/lucide` 36.1, Vitest 4, angular-eslint 22, shadcn CLI 4.

**Spec:** `docs/superpowers/specs/2026-10-23-angular-port-design.md`

## Global Constraints

- Angular `^22.2.0`, zoneless (`provideZonelessChangeDetection()`), standalone only, `ChangeDetectionStrategy.OnPush` on every component.
- Inputs/outputs use `input()`, `input.required()`, `output()`, `model()`; templates use `@if`/`@for`/`@switch`. No `NgModule`, no `@Input()` decorators.
- Selector prefix: `ko-` for components, `ko` for attribute directives (`button[koButton]`). Class names are `Ko` + name (`KoButton`, `KoDialog`).
- File naming: components and directives are `*.component.ts` or `*.directive.ts` and export only that class; logic lives in plain `.ts`. Node-environment logic tests are `name.test.ts`; Angular TestBed (jsdom) tests are `name.spec.ts`. Both sit beside the file they test.
- `ReactNode` props become content slots: a single slot is `<ng-content>`, and named slots use attribute selectors (`<ng-content select="[koActions]">`). Render-function props (`(x) => ReactNode`) become `TemplateRef` inputs or `ng-template` content children with an `$implicit` context.
- Icons: anywhere React took a `LucideIcon`, Angular takes `string`, the SVG string exported by `@ng-icons/lucide` (e.g. `import { lucideActivity } from "@ng-icons/lucide"`), rendered with `<ng-icon [svg]="icon" />`. No app-level `provideIcons` is needed.
- Every vendored Zard file starts with `// Adapted from Zard UI 1.1.1 (MIT) — https://github.com/zard-ui/zardui` and uses our `cn` from `@/ui/utils`, never Zard's `core` or `mergeClasses`.
- Class strings and design tokens are copied from the React file being ported. The React version is the visual reference.
- Imports use the `@/*` → `src/*` path alias, the same as the React repo.
- Browser globals (`window`, `localStorage`, `matchMedia`) are touched only behind `isPlatformBrowser(inject(PLATFORM_ID))` or inside `afterNextRender`.
- `npm run lint` has zero warnings. `npm run format:check` passes.

## Review Focus

1. **Blocked or full `localStorage`** (Safari private mode, quota): `persisted` and the column widths keep working in memory for the page's lifetime and never throw. Test in Task 12.
2. **Server rendering / no `window`**: `persisted` returns the initial value and reads nothing, and no component touches `window` during construction. Test in Task 12.
3. **Rows replaced by a new array with the same ids** (every refetch): the grid keeps selection, column widths and the shift-click anchor. Test in Task 10.
4. **Gaps in chart data** (`null` values, empty `rows`): `TimeChart` draws a gap, not a zero, and shows `emptyLabel` when there are no rows. Test in Task 11.
5. **Inputs changing while an overlay is open** (zoneless): a `ko-confirm-dialog` whose `pending` flips to `true` after opening disables its confirm button without any other trigger. Test in Task 8.

---

### Task 1: Registry spike — does `shadcn add` install Angular files?

Throwaway. Nothing from this task is committed except the result note.

**Files:**

- Create (scratchpad, not committed): a scratch Angular 22 app and a one-item registry
- Modify: `docs/superpowers/specs/2026-10-23-angular-port-design.md` (append the result under "Order of work")

- [ ] **Step 1: Create a scratch app.** In the session scratchpad run `npx @angular/cli@22 new scratch --style=css --ssr=false --skip-git --defaults`, add `"@/*": ["src/*"]` to `tsconfig.json` `paths`, and add a `components.json` with `"tsx": false`, `"tailwind": { "css": "src/styles.css", "config": "" }` and the alias block from this repo's `components.json`.
- [ ] **Step 2: Build a one-item registry.** In a scratch folder, write `registry.json` with one item, `spike`, `type: "registry:ui"`. It has two files, `src/ui/primitives/spike.component.ts` (a trivial standalone component importing `cn` from `@/ui/utils`) and `src/ui/primitives/spike.component.html`, both `type: "registry:file"` with explicit `target`s, and `dependencies: ["clsx@^2.1.1"]`. Run `npx shadcn@4 build` and serve the output on `:5181` using this repo's `scripts/serve-registry.mjs`.
- [ ] **Step 3: Install it.** In the scratch app run `npx shadcn@4 add http://localhost:5181/r/spike.json`.
      Expected: both files land at their targets unchanged (diff them), `clsx` is added to `package.json`, and `ng build` succeeds.
- [ ] **Step 4: Record the result.** Append to the spec's "Order of work" a line `Spike result (2026-10-23): shadcn add works / does not work for Angular files — <one-line reason>`. If it does not work, Task 14 adds the fallback `scripts/koderi-add.mjs`. Run `git commit -am "docs: record registry spike result"`.

---

### Task 2: Angular workspace and the logic files

**Files:**

- Move: every `src/**/*.tsx`, `src/main.tsx`, `src/vite-env.d.ts`, `src/ui/use-persisted.ts`, `src/ui/data-grid/use-column-widths.ts`, `src/ui/layout/command-palette-state.ts`, `src/ui/data-grid/types.ts`, `src/ui/data-grid/columns/column-factories.ts`, `src/ui/data-grid/index.ts`, `index.html`, `vite.config.ts` → `reference/react/<same path>` (via `git mv`)
- Create: `angular.json`, `tsconfig.app.json`, `tsconfig.spec.json`, `src/index.html`, `src/main.ts`, `src/demo/app.component.ts`, `src/demo/app.config.ts`, `src/demo/routes.ts`
- Modify: `package.json`, `tsconfig.json`, `vitest.config.ts`, `eslint.config.mjs`, `components.json`, `.prettierignore` (add `reference/`), `src/ui/tree-controller.ts`, `src/ui/layout/nav.ts`, `src/ui/layout/nav.test.ts`, `src/ui/primitives/button.test.ts`
- Test: all existing `*.test.ts` under `src/`

**Interfaces:**

- Produces: `npm test` = `vitest run && ng test --no-watch`. Vitest (node) picks up `src/**/*.test.ts`. `ng test` (`@angular/build:unit-test`, runner `vitest`, jsdom) picks up `src/**/*.spec.ts`.
- Produces: `NavItem.icon: string`, the SVG string per Global Constraints. `NavItem` and `NavConfig` are otherwise unchanged.
- Produces: `tree-controller.ts` without `useTreeController` and without the `@headless-tree/react` import. `buildTreeConfig`, `createTreeIndex`, `treeFeatures`, `resolveRootId`, `TREE_ROOT` and the types are unchanged.

- [ ] **Step 1: Move the React-only files** to `reference/react/` with `git mv`, keeping their paths. Add `reference/` to the `ignores` in `eslint.config.mjs`, to `exclude` in `tsconfig.json`, and to `.prettierignore`.
- [ ] **Step 2: Replace dependencies.** In `package.json`, remove `react`, `react-dom`, every `@radix-ui/*`, `@tanstack/react-*`, `@headless-tree/react`, `cmdk`, `lucide-react`, `recharts`, `sonner`, `@vitejs/plugin-react`, `@types/react*`, `eslint-plugin-react-*` and `@tailwindcss/vite`. Add the Tech Stack packages at the versions listed, plus `@angular/{core,common,compiler,forms,platform-browser,router}@^22.2.0`, `@angular/cdk@^22.2.0`, `rxjs@^7.8.2`, `tslib`, and dev `@angular/build@^22.2.0`, `@angular/cli@^22.2.0`, `@angular/compiler-cli@^22.2.0`, `@tailwindcss/postcss@^4.1.14`, `postcss`, `jsdom@^30`, `angular-eslint@^22.6.0`. Keep `@fontsource/*`, `tw-animate-css`, `clsx`, `tailwind-merge`, `class-variance-authority`, `shadcn`, `prettier`, `vitest`, `typescript`.
- [ ] **Step 3: Set the scripts.** `dev: ng serve`, `build: ng build`, `typecheck: tsc -p tsconfig.app.json --noEmit`, `test: vitest run && ng test --no-watch`, `test:watch: vitest`, `lint: eslint . --max-warnings 0`. Keep `format`, `format:check`, `registry:build` and `registry:serve` as they are.
- [ ] **Step 4: Write `angular.json`.** One application project, `shared-ui`, with `root: ""`, `sourceRoot: "src"`, `browser: "src/main.ts"`, `index: "src/index.html"`, `styles: ["src/styles.css"]`, `tsConfig: "tsconfig.app.json"`, `outputPath: "dist"`. The `test` target uses `@angular/build:unit-test` with `runner: "vitest"`, `tsConfig: "tsconfig.spec.json"`, `include: ["src/**/*.spec.ts"]`. Add `.postcssrc.json` with `{ "plugins": { "@tailwindcss/postcss": {} } }`. Remove `@import "sonner/dist/styles.css"` from `src/styles.css` (Task 3 handles toast styles).
- [ ] **Step 5: Write the bootstrap.** `src/main.ts` calls `bootstrapApplication(KoDemoApp, appConfig)`. `app.config.ts` provides `provideZonelessChangeDetection()` and `provideRouter(routes)`. `routes.ts` starts as `[]`. `KoDemoApp` (selector `ko-demo-app`) renders `<router-outlet />` plus a placeholder heading.
- [ ] **Step 6: Point `vitest.config.ts` at logic tests only:** `environment: "node"`, `include: ["src/**/*.test.ts"]`, with the `@` alias resolved to `src`.
- [ ] **Step 7: Make the logic files framework-free.** Delete `useTreeController` and its import from `tree-controller.ts`. Change `NavItem.icon` to `string` in `nav.ts`, and in `nav.test.ts` replace the `lucide-react` imports with `lucideActivity`/`lucideSettings` from `@ng-icons/lucide`. In `button.test.ts`, keep only the first test (variant geometry) and drop the React imports. The rendering tests move to `button.spec.ts` in Task 4.
- [ ] **Step 8: Write `eslint.config.mjs`** from `typescript-eslint` + `angular-eslint`'s `tsRecommended` and `templateRecommended`/`templateAccessibility` configs, with `@angular-eslint/component-selector` prefix `ko` (kebab, element) and `directive-selector` prefix `ko` (camel, attribute). Keep `eslint-config-prettier` last.
- [ ] **Step 9: Update `components.json`.** Set `"tsx": false` and remove the `@reui` registry. Keep the aliases.
- [ ] **Step 10: Run everything.**
      Run: `npm install && npm test && npm run lint && npm run build`
      Expected: every ported `*.test.ts` passes unchanged except for the edits in Step 7, `ng test` reports no spec files without failing (set `passWithNoTests` if needed), lint is clean, and the build succeeds.
- [ ] **Step 11: Commit.** `git add -A && git commit -m "chore: switch the workspace to Angular 22, keep the logic and its tests"`

---

### Task 3: Theme, icons and toast

**Files:**

- Modify: `src/styles.css`, `src/ui/notify.ts`
- Create: `src/ui/toaster.component.ts`, `src/ui/notify.test.ts`

**Interfaces:**

- Consumes: `cn` from `@/ui/utils`.
- Produces: `notify` with the same methods and messages (`success`, `saved`, `created`, `deleted`, `copied`, `error`), calling `toast` from `ngx-sonner`.
- Produces: `KoToaster`, selector `ko-toaster`, no inputs. It renders `<ngx-sonner-toaster>` with the same options `AppToaster` passed in `reference/react/src/ui/toaster.tsx`.

- [ ] **Step 1: Write `notify.test.ts`.** Mock `ngx-sonner` with `vi.mock`, then assert `notify.saved("Agent")` → `toast.success("Agent saved")`, `notify.saved()` → `toast.success("Saved")`, `notify.error(new Error("boom"))` → `toast.error("boom")`, and `notify.error(42)` → `toast.error("Something went wrong")`.
- [ ] **Step 2: Run it.** `npx vitest run src/ui/notify.test.ts`. Expected: FAIL (`sonner` cannot be resolved).
- [ ] **Step 3: Switch `notify.ts`'s import** to `ngx-sonner`.
- [ ] **Step 4: Run it.** Expected: PASS.
- [ ] **Step 5: Implement `KoToaster`.** Put it in the demo app root. Run `npm run dev`, trigger a toast from a temporary button, and compare it with the React showcase. If ngx-sonner does not style itself to match, copy the needed rules from `node_modules/ngx-sonner` into the toast section of `styles.css` (the theme's `[data-sonner-toast]` overrides stay as they are). Remove the temporary button.
- [ ] **Step 6: Commit.** `git commit -am "feat: toast on ngx-sonner"` (add the new files first).

---

### Task 4: Static primitives — button, badge, card, input, textarea, label, separator, skeleton, table, scroll-area

Each one is ported from `reference/react/src/ui/primitives/<name>.tsx`, using Zard's version of the same component as the starting point where Zard has one. Zard has none for `label` or `scroll-area`, so those are written directly.

**Files:**

- Create in `src/ui/primitives/`: `button.component.ts`, `badge.component.ts`, `card.component.ts`, `input.directive.ts`, `textarea.directive.ts`, `label.directive.ts`, `separator.component.ts`, `skeleton.component.ts`, `table.directive.ts`, `scroll-area.directive.ts`, `button.spec.ts`, `input.spec.ts`
- Keep: `button-variants.ts`, `field-control.ts`, `button.test.ts`

**Interfaces:**

- Produces: `KoButton`, selector `button[koButton], a[koButton]`. Inputs: `variant`, `size` (the `buttonVariants` keys), `icon?: string`, `loading = false`, `disabled = false`, `class?: string`. On an `<a>`, `disabled` sets `aria-disabled="true"` and `tabindex="-1"`. It replaces `asChild`.
- Produces: `KoIconButton`, selector `button[koIconButton]`. Inputs: `icon: string` (required), `label: string` (required). Size `icon-sm`; sets `aria-label` and `title` from `label`.
- Produces: `KoBadge`, selector `ko-badge` (inputs `variant`, `class`). `KoCard`, `KoCardHeader`, `KoCardTitle`, `KoCardDescription`, `KoCardContent` as `ko-card*` elements.
- Produces: attribute directives that apply classes only: `input[koInput]`, `textarea[koTextarea]` (both use `fieldControlClass`, and work with `ngModel`/`formControl` because the element is native), `label[koLabel]`, `div[koScrollArea]`, and `table[koTable]` with `thead[koTableHeader]`, `tbody[koTableBody]`, `tr[koTableRow]`, `th[koTableHead]`, `td[koTableCell]`.
- Produces: `KoSeparator`, `ko-separator` (input `orientation: "horizontal" | "vertical"`, `role="separator"`). `KoSkeleton`, `ko-skeleton`.

- [ ] **Step 1: Write `button.spec.ts`,** porting the React rendering tests one to one:
  - `<button koButton [icon]="lucideSave" [loading]="true">Save record</button>` has `disabled`, `aria-busy="true"`, one `<svg>`, `animate-spin`, the text "Save record", and no "Saving".
  - `<button koButton [loading]="true">Continue</button>` keeps "Continue" with an `opacity-0` wrapper and no `invisible`.
  - `<button koIconButton [icon]="lucideRefreshCw" label="Refresh connections">` has `aria-label` and `title` set to "Refresh connections" and the class `size-8`.
  - `<a koButton href="/assets" [disabled]="true">Assets</a>` has `aria-disabled="true"` and `tabindex="-1"`, and contains no `<button>`.
  - `<button koIconButton>` with no `label` fails to compile. Document this as a type-check note in the spec file; there's nothing to assert at runtime.
- [ ] **Step 2: Run it.** `npx ng test --no-watch --include src/ui/primitives/button.spec.ts`. Expected: FAIL (`KoButton` not found).
- [ ] **Step 3: Implement `KoButton` and `KoIconButton`.** Start from Zard's `button.component.ts` and apply `buttonVariants` through `host: { "[class]": ... }`.
- [ ] **Step 4: Run it.** Expected: PASS.
- [ ] **Step 5: Write `input.spec.ts`** for the CVA round-trip on the native directive. With `<input koInput [formControl]="c">`, `c.setValue("a")` puts `"a"` in the element, typing `"b"` changes `c.value` to `"b"`, and `c.disable()` sets the `disabled` attribute. Run it: FAIL. Implement the input and textarea directives. Run it: PASS.
- [ ] **Step 6: Port the rest of the files in this task.** Copy the class strings from the React files. Add a "Primitives" page to the demo route showing each one, and compare it with the React showcase's primitives page.
- [ ] **Step 7: Verify and commit.** Run `npm test && npm run lint && npm run build`, all passing, then `git add src/ui/primitives src/demo && git commit -m "feat: static primitives"`.

---

### Task 5: Form-control primitives — checkbox, switch, select

**Files:**

- Create in `src/ui/primitives/`: `checkbox.component.ts`, `switch.component.ts`, `select.component.ts`, `form-controls.spec.ts`

**Interfaces:**

- Produces: `KoCheckbox`, `ko-checkbox`. `checked = model<boolean | "indeterminate">(false)`, `disabled = input(false)`, `ariaLabel = input<string>()`. Implements `ControlValueAccessor`. Space toggles it, `role="checkbox"`, and `aria-checked` is `"mixed"` when indeterminate.
- Produces: `KoSwitch`, `ko-switch`. `checked = model(false)`, `disabled`, `ariaLabel`. CVA, `role="switch"`.
- Produces: `KoSelect`, `ko-select`. `value = model<string>()`, `options = input.required<{ value: string; label: string }[]>()`, `placeholder = input<string>()`, `disabled`. CVA. It mirrors the React `select.tsx` API: a native `<select>` styled with `fieldControlClass` if the React one is native; otherwise Zard's select on a CDK overlay. Read the React file to decide, and keep the same behaviour.

- [ ] **Step 1: Write `form-controls.spec.ts`.** For each control, bound to a `FormControl`:
  - `setValue` reflects in the DOM (`aria-checked` or the selected option).
  - A user click or change updates `control.value`.
  - `control.disable()` blocks interaction.

  Also: a checkbox with `checked="indeterminate"` renders `aria-checked="mixed"`, and Space toggles a focused switch.

- [ ] **Step 2: Run it.** Expected: FAIL.
- [ ] **Step 3: Implement the three controls** from Zard's checkbox, switch and select, restyled to the React class strings.
- [ ] **Step 4: Run it.** Expected: PASS.
- [ ] **Step 5: Add them to the demo Primitives page and commit:** `git commit -m "feat: checkbox, switch and select with forms support"`.

---

### Task 6: Dialog and sheet

**Files:**

- Create in `src/ui/primitives/`: `dialog.component.ts`, `dialog.service.ts`, `sheet.component.ts`, `dialog.spec.ts`

**Interfaces:**

- Produces: declarative `KoDialog`, `ko-dialog`. `open = model(false)`. The content goes in `<ng-template koDialogContent>`, which renders through a CDK `Dialog` overlay with the React `DialogContent` classes. Also `KoDialogHeader`, `KoDialogTitle`, `KoDialogDescription`, `KoDialogFooter` (`ko-dialog-*` elements), `button[koDialogClose]`, and `[koDialogTrigger]`.
- Produces: `KoDialogService` (`providedIn: "root"`): `open<C, D, R>(component: Type<C>, config?: { data?: D; ariaLabel?: string }): DialogRef<R, C>`, a thin wrapper over CDK `Dialog` that applies our panel and backdrop classes.
- Produces: `KoSheet`, `ko-sheet`, the same shape as `KoDialog` plus `side = input<"left" | "right">("right")`. Also `KoSheetTitle`, `KoSheetDescription`, `button[koSheetClose]`, `[koSheetTrigger]`.

- [ ] **Step 1: Write `dialog.spec.ts`:**
  - Opening via `[koDialogTrigger]` moves focus inside the dialog.
  - Tab cycles within it.
  - Escape closes it and returns focus to the trigger.
  - A backdrop click closes it.
  - `open.set(false)` from outside closes it.
  - The panel has `role="dialog"` and `aria-labelledby` pointing at `ko-dialog-title`.
  - The same focus-trap and return test for `KoSheet`.
- [ ] **Step 2: Run it.** Expected: FAIL.
- [ ] **Step 3: Implement** from Zard's `dialog/` and `sheet/` folders, merged into the files listed above, using our classes and `cn`.
- [ ] **Step 4: Run it.** Expected: PASS.
- [ ] **Step 5: Add them to the demo page and commit:** `git commit -m "feat: dialog and sheet"`.

---

### Task 7: Popover, tooltip, dropdown menu, tabs

**Files:**

- Create in `src/ui/primitives/`: `popover.component.ts`, `tooltip.directive.ts`, `dropdown-menu.component.ts`, `tabs.component.ts`, `overlays.spec.ts`

**Interfaces:**

- Produces: `KoPopover` (`ko-popover`, `open = model(false)`), `[koPopoverTrigger]`, and `<ng-template koPopoverContent>`, on a CDK `Overlay` with a flexible connected position and outside-click close.
- Produces: `KoTooltip`, an attribute `[koTooltip]="text"` with `koTooltipSide: "top" | "right" | "bottom" | "left" = "top"`. It shows on hover and focus after the React delay, and sets `aria-describedby`. It replaces `TooltipProvider`; there's nothing to provide.
- Produces: `[koDropdownTrigger]="menuTpl"` using CDK Menu (`cdkMenuTriggerFor`), with `KoDropdownMenu` (`ko-dropdown-menu`, wraps `cdkMenu`), `button[koDropdownItem]` (`cdkMenuItem`, input `variant: "default" | "destructive"`), `ko-dropdown-label`, `ko-dropdown-separator`.
- Produces: `KoTabs` (`ko-tabs`, `value = model.required<string>()`), `KoTabsList`, `button[koTabsTrigger]` (input `value`), `KoTabsContent` (`ko-tabs-content`, input `value`). It follows the ARIA tabs pattern: arrow keys move between tabs and activate them.

- [ ] **Step 1: Write `overlays.spec.ts`:**
  - Dropdown: Enter on the trigger opens the menu with the first item focused; ArrowDown/ArrowUp move focus and wrap; Escape closes it and refocuses the trigger; activating an item emits and closes.
  - Tabs: ArrowRight moves to and activates the next tab; `aria-selected` and `aria-controls` are wired.
  - Tooltip: focus shows it and sets `aria-describedby`; blur hides it.
  - Popover: an outside click closes it.
- [ ] **Step 2: Run it.** Expected: FAIL.
- [ ] **Step 3: Implement** from Zard's popover, tooltip, dropdown and tabs.
- [ ] **Step 4: Run it.** Expected: PASS.
- [ ] **Step 5: Add them to the demo page, compare with React, and commit:** `git commit -m "feat: popover, tooltip, dropdown menu and tabs"`.

---

### Task 8: Composites — status, page frames, form, filter bar, settings, detail shell, confirm dialog

Each one is ported from the matching file in `reference/react/src/ui/`, applying the ReactNode → slot rule from Global Constraints.

**Files:**

- Create in `src/ui/`: `status.component.ts`, `page-shell.component.ts`, `page-header.component.ts`, `form.component.ts`, `list-filter-bar.component.ts`, `settings-section.component.ts`, `detail-shell.component.ts`, `confirm-dialog.component.ts`, `confirm-dialog.spec.ts`, `form.spec.ts`
- Keep: `status-text.ts` and its test

**Interfaces:**

- Produces: `KoStatusDot` (`ko-status-dot`, `state: string`) and `KoStatusBadge` (`ko-status-badge`, `state: string`), using `statusTone` and `statusLabel`.
- Produces: `KoPageShell` (`ko-page-shell`, `gap: "default" | "loose"`). `KoPageHeader` (`ko-page-header`, inputs `kicker?`, `title`, `description?`, slot `[koActions]`).
- Produces: in `form.component.ts`:
  - `KoField` (`ko-field`, `label`, `hint?`, `error?`; projects the control)
  - `KoNumberInput` (`ko-number-input`, CVA, `min?`, `max?`)
  - `KoSwitchField` (`ko-switch-field`, `checked = model(false)`, `label`, `description?`, `disabled`)
  - `KoDisclosure` (`ko-disclosure`, `title`, `defaultOpen`, `forceOpen`)
  - `KoChoiceCards<T extends string>` (`ko-choice-cards`, `value = model.required<T>()`, `options: { id: T; label: string; description: string; icon: string }[]`)
- Produces: `KoListFilterBar` (`ko-list-filter-bar`, `value = model("")`, `placeholder?`) and `KoSelectionToolbar` (`ko-selection-toolbar`, `count`, `alwaysVisible`, output `clear`).
- Produces: `SettingsSectionDefinition<Id>` with `icon: string`, `KoSettingsSectionLayout` (`ko-settings-section-layout`, `label`, `sections`, `activeSection = model.required<Id>()`), and `KoSettingsSaveFooter` (`ko-settings-save-footer`, `dirty`, `isSaving`, `submitLabel?`, `note?`, output `cancel`).
- Produces: `DetailAction` with `icon: string` and `run: () => void` (renamed from `onClick`), `DetailTabDefinition<Id>`, and:
  - `KoDetailShell` (`ko-detail-shell`, `icon: string`, `title`, `tabs`, `activeTab = model.required<Id>()`, `actions`, output `refresh`, slots `[koSubtitle]`, `[koBadge]`, `[koFooter]`)
  - `KoOverviewRow` (`ko-overview-row`, `label`, `value?`, `copy?`, `mono`)
  - `KoOverviewPanel`, `KoDetailSection` (`title`, slot `[koAction]`), `KoDetailEmpty`
- Produces: `KoConfirmDialog` (`ko-confirm-dialog`), built on `KoDialog`. `open = model(false)`, `title`, `description`, `confirmLabel = "Confirm"`, `cancelLabel = "Cancel"`, `destructive = false`, `pending = false`, output `confirm`. Extra body is projected.

- [ ] **Step 1: Write `confirm-dialog.spec.ts`:**
  - Clicking confirm emits `confirm` once.
  - Cancel sets `open` to false.
  - **Review Focus 5:** open it, then set `pending` to `true` on the host and call `fixture.whenStable()`. The confirm button is `disabled` and has `aria-busy="true"`, with no other trigger.
  - `destructive` applies the destructive button variant.
- [ ] **Step 2: Write `form.spec.ts`:**
  - `KoNumberInput` clamps a typed value above `max` to `max` on blur.
  - `KoField` with `error` renders it with `role="alert"` and links it to the control via `aria-describedby`.
  - `KoDisclosure` with `forceOpen` cannot be closed.
- [ ] **Step 3: Run them.** Expected: FAIL.
- [ ] **Step 4: Implement** every file in this task.
- [ ] **Step 5: Run them.** Expected: PASS. Then run `npm test && npm run lint`.
- [ ] **Step 6: Port the demo pages that use these** (`settings`, `detail`, and the composite parts of `blocks`) from `reference/react/src/demo/pages/`, compare them with React, and commit: `git commit -m "feat: composites"`.

---

### Task 9: Tree

**Files:**

- Create: `src/ui/primitives/tree-adapter.ts`, `src/ui/primitives/tree.component.ts`, `src/ui/primitives/tree.component.html`, `src/ui/primitives/tree.spec.ts`
- Keep: `tree-controller.ts`, `tree-focus.ts`, `tree-select.ts` and their tests

**Interfaces:**

- Consumes: `buildTreeConfig<T>(options: TreeControllerOptions<T>): TreeConfig<T>` and `selectOnClick<T>(item, e)`.
- Produces: `injectTreeController<T>(options: () => TreeControllerOptions<T>): KoTreeHandle<T>`. It must be called in an injection context. `KoTreeHandle<T> = { tree: TreeInstance<T>; items: Signal<ItemInstance<T>[]>; rebuild(): void }`. Internally, `createTree` keeps its state in a `signal`, and `setState` writes to that signal and bumps a version. `items` is a `computed` over that version reading `tree.getItems()`. `tree.setMounted(true)` runs in `afterNextRender`, and the tree is destroyed through `DestroyRef`.
- Produces: `KoTree` (`ko-tree`, `handle = input.required<KoTreeHandle<T>>()`, `indent = 12`, `toggleIconType: "chevron" | "plus-minus" = "chevron"`) and an item template via `<ng-template koTreeItem let-item>`. Also `KoTreeItemLabel` (`ko-tree-item-label`, `item`), `KoTreeDragLine`, `[koTreeDragHandle]`. It spreads `item.getProps()` onto each row through a small `[koTreeItemProps]` directive that sets the attributes and listeners headless-tree returns.

- [ ] **Step 1: Write `tree.spec.ts`,** using a flat list of 6 items (2 folders):
  - ArrowDown moves focus to the next visible item.
  - ArrowRight on a closed folder expands it, and its children appear.
  - ArrowLeft collapses it.
  - With `selectable: true`, a click selects (`aria-selected="true"`) and a Ctrl+click adds to the selection.
  - After replacing `items` and calling `rebuild()`, the new item renders.
- [ ] **Step 2: Run it.** Expected: FAIL.
- [ ] **Step 3: Implement** the adapter and components, porting the classes and structure from `reference/react/src/ui/primitives/tree.tsx`.
- [ ] **Step 4: Run it.** Expected: PASS.
- [ ] **Step 5: Port the demo tree page** (`src/demo/file-tree.ts` and its test stay as they are), compare it with React, and commit: `git commit -m "feat: tree on headless-tree core with a signals adapter"`.

---

### Task 10: Data grid

**Files:**

- Create in `src/ui/data-grid/`: `types.ts`, `column-widths-state.ts`, `data-grid.component.ts`, `data-grid.component.html`, `resize-handle.component.ts`, `key-value-table.component.ts`, `columns/column-factories.ts`, `columns/progress-cell.component.ts`, `columns/status-cell.component.ts`, `columns/chip-list.component.ts`, `index.ts`, `data-grid.spec.ts`
- Keep: `column-widths.ts`, `grid-layout.ts`, `columns/chip-fit.ts`, `columns/progress-level.ts`, `columns/tones.ts` and their tests

**Interfaces:**

- Produces in `types.ts`, the same as `reference/react/src/ui/data-grid/types.ts` except that:
  - `header: string | TemplateRef<unknown>`
  - `cell: (row: T) => CellContent`, where `CellContent = string | number | null | TemplateRef<{ $implicit: T }> | ReturnType<typeof flexRenderComponent>`
  - `cellProps` is unchanged
  - `DataGridClassNames<T>` is unchanged
- Produces: `columnWidthsState(storageKey: Signal<string>, columns: Signal<ColumnLimits[]>): { widths: Signal<ColumnWidths>; setWidth(id: string, width: number): void; resetWidth(id: string): void }`. It reads and writes with `parseStoredWidths`/`serializeWidths` under `widthsStorageKey`, wraps every `localStorage` access in try/catch with an in-memory fallback, and goes through `isPlatformBrowser`.
- Produces: `KoDataGrid<T>` (`ko-data-grid`):
  - Inputs: `storageKey`, `rows`, `getRowId`, `columns`, `layout = "auto"`, `resizable = false`, `stickyHeader = false`, `loading = false`, `emptyRow = false`, `classNames?`, `class?`, `selection?: ReadonlySet<string>`, `selectionLabel?`, `hasRowDetail?: (row: T) => boolean`.
  - Outputs: `rowClick: T`, `rowDoubleClick: T`, `rowContextMenu: { row: T; event: MouseEvent }`, `selectionChange: Set<string>`.
  - Content templates: `<ng-template koGridMobileCard let-row>`, `<ng-template koGridRowDetail let-row>`, `<ng-template koGridEmpty>`.
  - Selection is on when `selection` is bound. Behaviour (breakpoint hiding through `matchMedia`, pinning, sorting with `compareSortValues`, interactive-target guard, shift-range selection) follows the React `data-grid.tsx` and the JSDoc in its `types.ts`. Copy that JSDoc across, adjusted to the template names.
- Produces: `progressColumn`, `statusColumn` and `tagsColumn`, with the same options as React except `header: string`. They return `DataGridColumn<T>` whose `cell` uses `flexRenderComponent(KoProgressCell | KoStatusCell | KoChipList, { inputs })`.
- Produces: `KoKeyValueTable` (`ko-key-value-table`, `caption`, `columns: KeyValueColumn[]` with `header: string`, `classNames?`; rows projected as `<tr>`).
- Produces: `index.ts`, re-exporting everything the React `index.ts` did under the `Ko` names, plus `CHIP`, `ChipColor`, `StatusTone`, `ProgressVariant` and the types.

- [ ] **Step 1: Write `data-grid.spec.ts`:**
  - Clicking a sortable header sorts ascending, then descending, and `null`s sort last both ways.
  - `rowClick` fires on a row click but not when the click lands on a `<button>` inside the row.
  - The header checkbox selects all rows; a Shift+click on the 4th row checkbox after the 1st selects rows 1–4.
  - **Review Focus 3:** replace `rows` with a new array of copies with the same ids. `selection` is unchanged, the shift anchor still works, and a column width set before the swap is kept.
  - Resize: dragging the handle by +40px widens the column by 40 within `maxSize`. Double-clicking the handle resets it. The width survives a re-create with the same `storageKey`.
  - **Review Focus 1 (grid part):** with `localStorage.setItem` stubbed to throw, resizing still changes the width and nothing throws.
  - `emptyRow: true` with no rows renders the header plus one row spanning every visible column, holding the `koGridEmpty` template.
  - A column with `hideBelow: "lg"` is absent when `matchMedia("(min-width: 1024px)")` is false.
- [ ] **Step 2: Run it.** Expected: FAIL.
- [ ] **Step 3: Implement `types.ts`, `column-widths-state.ts`, the cell components, the factories and `KoKeyValueTable`.**
- [ ] **Step 4: Implement `KoDataGrid`** with `injectTable` from `@tanstack/angular-table` and `createSortedRowModel()`. Render cells with the `FlexRender` directive.
- [ ] **Step 5: Run it.** Expected: PASS. Then run `npm test && npm run lint`.
- [ ] **Step 6: Port the demo data-grid page,** compare it with React (sorting, resize, pinning, mobile cards at 375px), and commit: `git commit -m "feat: data grid on angular-table"`.

---

### Task 11: Charts

**Files:**

- Create in `src/ui/`: `time-chart-options.ts`, `time-chart-options.test.ts`, `time-chart.component.ts`, `sparkline.component.ts`, `state-timeline.component.ts`, `charts.ts` (re-exports and the types)
- Keep: `chart-format.ts` and its test

**Interfaces:**

- Produces in `charts.ts`: `ChartSeries`, `ChartRow` and `TimelineState`, unchanged, plus `DEFAULT_TIMELINE_STATES` (the React `running`/`starting`/`reconnecting`/`failed` map, exported).
- Produces: `buildTimeChartOption(input: { rows: ChartRow[]; series: ChartSeries[]; from: number; to: number; format: (v: number) => string; formatAxis?: (v: number) => string; reference?: { value: number; label: string }[]; fill?: boolean }): EChartsCoreOption`. This is pure. X is a `time` axis with `min: from`, `max: to`, and labels from `timeTicks`/`clockTime`. There's one `line` series per `ChartSeries` with `connectNulls: false`, `showSymbol: false`, the color from `series.color`, and an `areaStyle` when `fill`. `reference` lines become `markLine` entries. Tooltip and axis colors use the theme's CSS variables, read once through `getComputedStyle` in the component and passed in.
- Produces: `KoTimeChart` (`ko-time-chart`), with the same inputs as the React `TimeChart` except `icon: string`, plus `emptyLabel = "No data"`. It uses the `echarts` directive from `ngx-echarts`. `provideEchartsCore({ echarts })` is set up in the component's `providers` with `echarts/core` registering only `LineChart`, `GridComponent`, `TooltipComponent`, `MarkLineComponent` and `CanvasRenderer`. When `rows` is empty, it renders the empty label and no chart.
- Produces: `KoSparkline` (`ko-sparkline`, `values: (number | null)[]`, `label`) as an inline SVG `polyline` with `role="img"` and `aria-label`. `KoStateTimeline` (`ko-state-timeline`, with the same inputs as React's `StateTimeline`) as divs, the same as React.

- [ ] **Step 1: Write `time-chart-options.test.ts`:**
  - 2 series produce 2 `line` series with their colors.
  - **Review Focus 4:** a row with `cpu: null` keeps `null` in that series' data, and `connectNulls` is `false`.
  - `fill: true` sets `areaStyle` on every series.
  - `reference: [{ value: 80, label: "Limit" }]` produces one `markLine` datum, `yAxis: 80`.
  - The axis `min`/`max` equal `from`/`to`.
- [ ] **Step 2: Run it.** `npx vitest run src/ui/time-chart-options.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `buildTimeChartOption`.**
- [ ] **Step 4: Run it.** Expected: PASS.
- [ ] **Step 5: Implement the three components.** Port the demo charts page, compare it with React (the difference in tooltip look is expected; write it in the commit message), and run `npm run build`. Check that the bundle report shows only the registered ECharts parts.
- [ ] **Step 6: Commit:** `git commit -m "feat: charts on echarts, sparkline and state timeline"`.

---

### Task 12: Layout — persisted state, command palette, app shell

**Files:**

- Create in `src/ui/`: `persisted.ts`, `persisted.spec.ts`
- Create in `src/ui/layout/`: `command-registry.ts`, `command-palette.component.ts`, `command-palette.component.html`, `app-shell.component.ts`, `app-shell.component.html`, `layout.spec.ts`
- Keep: `layout/nav.ts`, `layout/command-search.ts` and their tests

**Interfaces:**

- Produces: `persisted<T>(key: string, initial: T): WritableSignal<T>`. It must be called in an injection context. It reads `localStorage` (JSON) once in the browser. `set`/`update` write JSON and dispatch a `persisted-change` window event. It listens for `storage` and `persisted-change`, so two signals with the same key stay in sync, and it removes its listeners via `DestroyRef`. Read and write failures fall back to a module-level in-memory `Map`. On the server it returns `signal(initial)` and touches nothing.
- Produces: `Command` with `icon?: string`, otherwise as in React. `KoCommandRegistry` (`@Injectable({ providedIn: "root" })`) has `register(owner: string, commands: Command[]): void`, `unregister(owner: string): void` and `commands: Signal<Command[]>`. `injectCommands(commands: Command[] | Signal<Command[]>): void` registers for the caller's lifetime.
- Produces: `KoCommandPalette` (`ko-command-palette`, `open = model(false)`, `nav: NavConfig`, `commands: Command[]`, `placeholder = "Search…"`), built on `KoDialog` + CDK `Listbox`. Filtering uses `searchTokens`/`matchesTokens` over label, group, description and keywords. Nav items navigate via `Router.navigateByUrl`. Ctrl/Cmd+K toggles it, registered on `document` by the app shell.
- Produces: `Brand` with `icon: string`, and `KoAppShell` (`ko-app-shell`):
  - Inputs: `nav: NavConfig`, `brand: Brand`, `fullHeight?: (path: string) => boolean`, `storageKey = "app-shell"`.
  - Slots: `[koHeaderEnd]`, and `<ng-template koSidebarFooter let-collapsed>`. The routed page is projected as the default content.
  - The current path comes from `Router` events via `toSignal`. The collapsed state is `persisted(storageKey + ":collapsed", false)`. The mobile nav is a `KoSheet`. Collapsed nav items get a `koTooltip`. `isNavActive` decides the active item.

- [ ] **Step 1: Write `persisted.spec.ts`:**
  - It returns `initial` when nothing is stored.
  - `set(v)` writes JSON to `localStorage`, and a new `persisted` with the same key reads `v`.
  - Two signals with the same key: setting one updates the other.
  - **Review Focus 1:** with `localStorage.getItem`/`setItem` stubbed to throw, `set(v)` still updates the signal and a second `persisted(key)` reads `v` from memory.
  - **Review Focus 2:** with `PLATFORM_ID` set to `"server"`, it returns `initial` and `localStorage.getItem` is never called.
- [ ] **Step 2: Write `layout.spec.ts`:**
  - Palette: typing "sett" leaves only the items matching "sett"; ArrowDown then Enter runs the second match's `run` (or navigates for a nav item) and closes the palette; Escape closes it.
  - Registry: a component using `injectCommands` adds its commands, and destroying it removes them.
  - Shell: Ctrl+K opens the palette; the nav item whose `to` matches the current route has `aria-current="page"`; the collapse toggle persists across a re-create.
- [ ] **Step 3: Run them.** Expected: FAIL.
- [ ] **Step 4: Implement `persisted`, then the registry, palette and shell.** Port the classes from `reference/react/src/ui/layout/*.tsx`.
- [ ] **Step 5: Run them.** Expected: PASS. Then run `npm test && npm run lint`.
- [ ] **Step 6: Commit:** `git commit -m "feat: persisted state, command palette and app shell"`.

---

### Task 13: Showcase

**Files:**

- Create: `src/demo/shell.component.ts`, `src/demo/header.component.ts`, `src/demo/pages/{overview,primitives,blocks,charts,data-grid,detail,settings,tree}.page.ts` (finishing the pages started in Tasks 4–11)
- Modify: `src/demo/routes.ts`, `src/demo/nav.ts` (icons → `@ng-icons/lucide` strings), `src/demo/data.ts` (imports from `@/ui/charts`), `.github/workflows/pages.yml`, `justfile`

**Interfaces:**

- Consumes: `KoAppShell`, `NavConfig`, `Brand` (Task 12), and every component from Tasks 3–11.

- [ ] **Step 1: Port each remaining page** from `reference/react/src/demo/`, with routes matching the React paths, inside `KoAppShell` with the demo `nav` and `brand`.
- [ ] **Step 2: Check parity.** Run `npm run dev` and the React showcase (https://koderi-dp.github.io/shared-ui/) side by side in the browser pane, at desktop width and at 375px. For each page, fix differences or list the intentional ones in `docs/superpowers/specs/2026-10-23-angular-port-design.md` under a new "Known differences" heading.
- [ ] **Step 3: Update `pages.yml`.** The build step is `npx ng build --base-href /shared-ui-angular/`. The 404 copy and upload `path` use `dist/browser`.
- [ ] **Step 4: Verify and commit.** Run `npm run build` (succeeds) and `npx http-server dist/browser -p 4300`, then load `/` and a deep route. Commit: `git commit -m "feat: showcase on the Angular components"`.

---

### Task 14: Registry, docs and cleanup

**Files:**

- Modify: `registry.json`, `CLAUDE.md`, `README.md`, `LICENSE`
- Regenerate: `public/r/*.json`
- Delete: `reference/`
- Create (only if Task 1 failed): `scripts/koderi-add.mjs`

**Interfaces:**

- Consumes: every file from Tasks 2–12.

- [ ] **Step 1: Rewrite each of the 39 items in `registry.json`.** Keep `name`, `type`, `title` and `registryDependencies` (namespaced `@koderi/…`), and update `description` where the API wording changed. `files` lists the Angular files with `target` equal to `path`. `dependencies` lists the Angular packages the files import, at the versions in `package.json`; `@angular/*` packages are listed only where a file imports something beyond `@angular/core`/`@angular/common` (e.g. `@angular/cdk@^22.2.0`, `@angular/forms@^22.2.0`). `theme` drops `sonner` and `@tailwindcss/vite`, and adds `@tailwindcss/postcss@^4.1.14` to `devDependencies`. `use-persisted` ships `src/ui/persisted.ts` and `persisted.spec.ts`. `charts` ships the four chart files plus `chart-format.ts` and its test. `starter` keeps its list.
- [ ] **Step 2: If Task 1 recorded a failure,** write `scripts/koderi-add.mjs <name> [--registry <url>]`. It fetches `<registry>/<name>.json`, resolves `registryDependencies` recursively (stripping `@koderi/`), writes each file's `content` to its `target`, and prints the `npm install` line for the collected `dependencies`. Document it in the README in place of `npx shadcn add`.
- [ ] **Step 3: Build and check.** Run `npm run registry:build && npm run lint && npm test && npm run build && npm run format:check`. All must pass.
- [ ] **Step 4: Verify in a scratch app.** Create a fresh Angular 22 app (as in Task 1 Step 1), point `components.json` at `npm run registry:serve`, and run `npx shadcn add @koderi/starter` (or `koderi-add starter`). Write `src/app/app.ts` using `ko-app-shell`, `ko-data-grid` with 3 rows and `ko-time-chart` with 2 series. Expected: `ng build` succeeds and `ng serve` renders all three with the theme applied. Then, for each item individually, `shadcn add @koderi/<name>` into a fresh copy and `ng build`. Expected: every item compiles on its own.
- [ ] **Step 5: Update the docs.**
  - `CLAUDE.md`: commands (`ng serve`/`ng build`/`ng test`); layout (no `.tsx`); the rule becomes "a `*.component.ts`/`*.directive.ts` exports only its class; logic in a `.ts` with `name.test.ts` (node) beside it; TestBed tests are `name.spec.ts`".
  - `README.md`: the Angular consumer setup line `"paths": { "@/*": ["src/*"] }`, the showcase URL, and a Zard UI credit.
  - `LICENSE`: append Zard UI's MIT notice.
- [ ] **Step 6: Delete `reference/` and commit.** Run `git rm -r reference && git add -A && git commit -m "feat: Angular registry items; drop the React reference"`.
