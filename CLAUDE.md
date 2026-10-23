# shared-ui

`@koderi-dp/ui`, the shared Angular UI library for the koderi starters, and the showcase app
that runs every component. The library lives in `projects/ui`; the showcase in `src/demo`
consumes it through tsconfig paths, exactly as a consumer would.

## Commands

- `npm run dev` — `ng serve`, the showcase app (every component on one set of pages).
- `npm run build` — `ng build`, the showcase, into `dist/showcase`.
- `npm run build:lib` — `ng build ui`, the library, into `dist/ui`.
- `npm test` — Vitest in node for `*.test.ts`, then `ng test --no-watch` for the TestBed `*.spec.ts`.
- `npm run typecheck` — `tsc` over `src`, `projects/ui` and `scripts` tests with the strict settings.
- `npm run lint` — ESLint, zero warnings.
- `npm run format` / `npm run format:check` — Prettier.

## Layout

- `projects/ui/src/` — the primary entry point (`@koderi-dp/ui`): primitives, page frames, status, form controls.
- `projects/ui/<entry>/src/lib/` — a secondary entry point (`layout`, `data-grid`, `charts`, `tree`), published as `@koderi-dp/ui/<entry>`.
- `projects/ui/theme.css` — the Tailwind theme, shipped as `@koderi-dp/ui/theme.css`.
- `src/demo/` — the showcase app only. Nothing here is published.
- `scripts/` — `set-version.mjs` stamps the release version into `dist/ui/package.json`.

## Rules

- `public-api.ts` of each entry point (`src/public-api.ts`) is the API: whatever it does not export is private.
- Inside an entry, import with relative paths. Across entries, import `@koderi-dp/ui`
  (never a sibling's files), so each entry builds on the published surface.
- A `*.component.ts` / `*.directive.ts` exports components and directives, plus the tokens and
  constants tied to them (`KO_TREE_ITEM`, `KO_TOOLTIP_DELAY`). Logic lives in a plain `.ts`
  with its test beside it (`name.test.ts`, run by Vitest in node). TestBed tests are
  `name.spec.ts`. This is why `button-variants.ts` is separate from `button.component.ts`.
- The version in `projects/ui/package.json` is not authoritative; the published version comes from the git tag.

## Overlay and host gotchas

- A custom-element host is `display: inline` by default: give it explicit display classes.
- Never size `.cdk-overlay-pane` with Tailwind (the CDK injects unlayered CSS that wins); use the overlay config or an inner element.
- The app is zoneless: render from signals, not from mutated fields.

- Unit-test `include` paths resolve from the app's `sourceRoot`, hence `../projects/ui/**/*.spec.ts`.
- `projects/ui/LICENSE` and `projects/ui/README.md` are copies of the root files; a test keeps them identical, so edit the root ones and copy.
- The theme's `@source "./"` is what makes Tailwind generate the library's classes, so a consumer needs no `@source` line.

## Releasing

Tag `vX.Y.Z` on `main` and push the tag; `release.yml` checks, builds, stamps the version
from the tag, publishes to npm with provenance and creates the GitHub release.

`0.1.0` is published once by hand: `npm login`, `npm run build:lib`,
`node scripts/set-version.mjs v0.1.0`, `cd dist/ui && npm publish --access public`. After that,
configure the trusted publisher on npmjs.com (repo `koderi-dp/shared-ui-angular`, workflow `release.yml`).
