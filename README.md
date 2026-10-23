# shared-ui-angular

[![The showcase's overview page: the app shell, metric cards, a status table and charts](.github/assets/showcase.png)](https://koderi-dp.github.io/shared-ui-angular/)

The shared UI for the koderi starters, published as a shadcn registry of Angular 22
components (standalone, signals, zoneless, Tailwind 4). It ships with a showcase app that
renders every item on one set of pages.

**Showcase:** https://koderi-dp.github.io/shared-ui-angular/

## Using it

The items are copied into your project as source, under `src/ui/`, by the shadcn CLI. You
own them from then on. Requirements: Angular 22 and Tailwind 4. Zone.js apps work too;
nothing needs zoneless.

### New project

1. Create the app:

   ```sh
   ng new my-app --style=css --ssr=false
   cd my-app
   ```

2. Add Tailwind 4. Angular's build picks up `.postcssrc.json` on its own:

   ```sh
   npm i -D tailwindcss @tailwindcss/postcss
   ```

   `.postcssrc.json`:

   ```json
   { "plugins": { "@tailwindcss/postcss": {} } }
   ```

3. Create `components.json` in the project root. `"tsx": true` is required, otherwise the
   CLI transpiles the `.ts` files to `.js`:

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

4. Add the path alias to `tsconfig.json`, with the `./` (without it TypeScript 6 rejects the
   path):

   ```json
   {
     "compilerOptions": {
       "paths": { "@/*": ["./src/*"] }
     }
   }
   ```

5. Add the items. `-o` lets the theme replace the empty `src/styles.css` that `ng new`
   made; without it the CLI stops to ask:

   ```sh
   npx shadcn add @koderi/starter -o
   ```

   This writes `src/ui/**` and installs the npm packages the items need.

6. Put the shell around the router and a page inside it. Replace `src/app/app.ts`:

   ```ts
   import { Component } from "@angular/core";
   import { RouterOutlet } from "@angular/router";
   import { lucideBoxes, lucideLayoutDashboard } from "@ng-icons/lucide";
   import { KoAppShell, type Brand } from "@/ui/layout/app-shell.component";
   import type { NavConfig } from "@/ui/layout/nav";
   import { KoToaster } from "@/ui/toaster.component";

   @Component({
     selector: "app-root",
     imports: [RouterOutlet, KoAppShell, KoToaster],
     template: `
       <ko-app-shell [nav]="nav" [brand]="brand">
         <router-outlet />
       </ko-app-shell>
       <ko-toaster />
     `,
   })
   export class App {
     readonly brand: Brand = { name: "My app", tagline: "Admin", icon: lucideBoxes };
     readonly nav: NavConfig = {
       primary: [{ to: "/", label: "Overview", icon: lucideLayoutDashboard }],
     };
   }
   ```

   `src/app/overview.ts`:

   ```ts
   import { Component } from "@angular/core";
   import { notify } from "@/ui/notify";
   import { KoPageHeader } from "@/ui/page-header.component";
   import { KoPageShell } from "@/ui/page-shell.component";
   import { KoButton } from "@/ui/primitives/button.component";

   @Component({
     selector: "app-overview",
     imports: [KoPageShell, KoPageHeader, KoButton],
     template: `
       <ko-page-shell>
         <ko-page-header kicker="Home" title="Overview" description="It works." />
         <div><button koButton (click)="save()">Save</button></div>
       </ko-page-shell>
     `,
   })
   export class Overview {
     save() {
       notify.saved();
     }
   }
   ```

   `src/app/app.routes.ts`:

   ```ts
   import { Routes } from "@angular/router";
   import { Overview } from "./overview";

   export const routes: Routes = [{ path: "", component: Overview }];
   ```

7. Check it:

   ```sh
   ng serve
   ```

   Open http://localhost:4200. You should see the dark shell: "My app" in the sidebar (on a
   narrow window it sits behind the menu button), the search box in the header (Ctrl+K opens
   the command palette) and the Overview page. Clicking **Save** shows a "Saved" toast.

### Existing project

Follow steps 2 to 5 above, with these differences:

- **`src/styles.css` is replaced.** The theme is the whole base layer: fonts, the Tailwind
  import, the colour tokens and the base styles. Copy your own rules somewhere safe first,
  then paste them back in under the theme's.
- **SCSS projects:** the theme still writes `src/styles.css`, which a project created with
  `--style=scss` never loads. Add it to `styles` in `angular.json`, next to `styles.scss`.
- **The `@/` alias** must resolve to `src/`; the items import each other as `@/ui/...`. If
  you already use `@/` for another folder, that is the one thing to untangle first.
- **Pick items instead of everything:** `npx shadcn add @koderi/data-grid` adds the grid
  and the items it depends on, and nothing else. `@koderi/theme` is the one every item
  assumes; `-o` is only needed for it.
- **Wire the two things the shell needs:** `provideRouter(routes)` in `app.config.ts` (apps
  made by `ng new` already have it), and `<ko-toaster />` once in the root component so
  `notify` has somewhere to render.

### Icons

Wherever an item takes an icon (nav items, the brand, detail actions, settings sections,
`[icon]` on a button), pass the SVG string exported by `@ng-icons/lucide`, the way the React
version took a `LucideIcon` component:

```ts
import { lucideActivity } from "@ng-icons/lucide";
```

There is nothing to register.

### Good to know

- Give a bare `ko-checkbox`, `ko-switch` or `ko-select` a name with `aria-label="..."`; it is
  forwarded to the inner control.
- `ko-dialog` takes `disableClose` to ignore Escape and backdrop clicks; `ko-confirm-dialog`
  sets it while `pending`. `ko-sheet` takes `width` (default `18rem`).

### Known differences from the React originals

- The number input keeps the typed text while editing and clamps to `min` on blur.
- Charts are drawn by ECharts, styled to match Recharts' crosshair, hover dot and tooltip. The
  x-axis gets the same tick list, but ECharts thins overlapping labels differently from
  Recharts' `minTickGap`, so a narrow chart can show a different subset. The y-axis uses
  round steps (0, 50, 100, …) where Recharts split the range into five equal ticks.

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
