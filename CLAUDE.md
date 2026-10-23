# shared-ui

The shared UI for the koderi starters, published as a shadcn registry. `src/ui/**` is the
real Angular code the showcase runs and the source of every registry item; `registry.json`
lists the items and points at those same files.

## Commands

- `npm run dev` — `ng serve`, the showcase app (every item on one set of pages).
- `npm run build` — `ng build`, the showcase.
- `npm test` — Vitest in node for `*.test.ts`, then `ng test --no-watch` for the TestBed `*.spec.ts`.
- `npm run typecheck` — `tsc` over `src` with the strict settings.
- `npm run lint` — ESLint, zero warnings.
- `npm run format` / `npm run format:check` — Prettier.
- `npm run registry:build` — `shadcn build`, writes `public/r/*.json` from `registry.json`.
- `npm run registry:serve` — serve `public/r` at `http://localhost:5181/r/{name}.json`.

## Layout

- `src/ui/` — the registry source. `primitives/` are the shadcn/new-york set; the rest are
  the page frames, charts, status, form controls and the app shell. No `.tsx`: components are
  standalone Angular components with signals, `*.component.ts` plus an optional `.html`.
- `src/ui/layout/` — the app shell, command palette and nav.
- `src/demo/` — the showcase app only. Nothing here ships in the registry.
- `registry.json` — the source of truth for the registry. `public/r/*.json` is built from it
  and committed.

## Rules

- A `*.component.ts` / `*.directive.ts` exports only its class. Logic lives in a plain `.ts`
  with its test beside it (`name.test.ts`, run by Vitest in node). TestBed tests are
  `name.spec.ts`. This is why `button-variants.ts` is separate from `button.component.ts`.
- Every registry item declares its npm `dependencies` and its `registryDependencies`.
  `registryDependencies` must be namespaced `@koderi/<name>` — the CLI resolves bare names
  against shadcn's own registry. List `@angular/*` only beyond `core`/`common`.
- Every file under `src/ui` belongs to exactly one item, and each file's `target` equals its
  `path` (the CLI needs an explicit target to place `.ts`/`.html` files).
- A consumer's `components.json` needs `"tsx": true` (else the CLI transpiles `.ts` to
  `.js`) and its tsconfig needs `"paths": { "@/*": ["./src/*"] }` (keep the `./`).
- When a file changes, run `npm run registry:build` and commit the rebuilt `public/r/*.json`.

## Overlay and host gotchas

- A custom-element host is `display: inline` by default: give it explicit display classes.
- Never size `.cdk-overlay-pane` with Tailwind (the CDK injects unlayered CSS that wins); use the overlay config or an inner element.
- The app is zoneless: render from signals, not from mutated fields.

## Adding an item

1. Add the code under `src/ui/` (and its `.test.ts` / `.spec.ts`).
2. Add an entry to `registry.json` with `name`, `type`, `title`, `description`,
   `dependencies`, `registryDependencies` and `files` (each file has a `target`).
3. Run `npm run registry:build`, then `npm run lint`, `npm test` and `npm run build`.
4. Verify in a scratch Angular app: `npx shadcn add @koderi/<name>`, then `ng build`.
