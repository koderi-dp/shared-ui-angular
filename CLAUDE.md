# shared-ui

The shared UI for the koderi starters, published as a shadcn registry. `src/ui/**` is the
real code the showcase runs and the source of every registry item; `registry.json` lists the
items and points at those same files.

## Commands

- `npm run dev` — the showcase app (every item on one set of pages).
- `npm run build` — type-check and build the showcase.
- `npm test` — Vitest, node environment, `*.test.ts` beside the file it tests.
- `npm run lint` — ESLint, zero warnings.
- `npm run format` / `npm run format:check` — Prettier.
- `npm run registry:build` — `shadcn build`, writes `public/r/*.json` from `registry.json`.
- `npm run registry:serve` — serve `public/r` at `http://localhost:5181/r/{name}.json`.

## Layout

- `src/ui/` — the registry source. `primitives/` are the shadcn/new-york set; the rest are
  the page frames, charts, status, form controls and the app shell.
- `src/ui/layout/` — the app shell, command palette and nav.
- `src/demo/` — the showcase app only. Nothing here ships in the registry.
- `registry.json` — the source of truth for the registry. `public/r/*.json` is built from it
  and committed.

## Rules

- A `.tsx` file exports only components. Logic lives in a `.ts` with its test beside it
  (`name.test.ts`). This is why `button-variants.ts` is separate from `button.tsx`.
- Every registry item declares its npm `dependencies` and its `registryDependencies`.
  `registryDependencies` must be namespaced `@koderi/<name>` — the CLI resolves bare names
  against shadcn's own registry.
- When a file changes, run `npm run registry:build` and commit the rebuilt `public/r/*.json`.

## Adding an item

1. Add the code under `src/ui/` (and its test).
2. Add an entry to `registry.json` with `name`, `type`, `title`, `description`,
   `dependencies`, `registryDependencies` and `files` (each file has a `target`).
3. Run `npm run registry:build`, then `npm run lint`, `npm test` and `npm run build`.
4. Verify in a scratch app: `npx shadcn add @koderi/<name>`.
