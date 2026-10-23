# shared-ui-angular

[![The showcase's overview page: the app shell, metric cards, a status table and charts](.github/assets/showcase.png)](https://koderi-dp.github.io/shared-ui-angular/)

The shared UI for the koderi starters, published to npm as `@koderi-dp/ui`: Angular 22
components (standalone, signals, zoneless, Tailwind 4). It ships with a showcase app that
renders every component on one set of pages.

**Showcase:** https://koderi-dp.github.io/shared-ui-angular/

## Using it

`@koderi-dp/ui` is an npm package. Requirements: Angular 22 and Tailwind 4. Zone.js apps work
too; nothing needs zoneless.

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

3. Install the library and the packages it needs:

   ```sh
   npm i @koderi-dp/ui @angular/cdk @ng-icons/core @ng-icons/lucide ngx-sonner \
     class-variance-authority clsx tailwind-merge tw-animate-css \
     @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono
   ```

   The entry points beyond the main one are optional, and so are their packages. Install the
   extras only for the entry points you import:

   | Entry point               | Extra packages              |
   | ------------------------- | --------------------------- |
   | `@koderi-dp/ui`           | none                        |
   | `@koderi-dp/ui/layout`    | none                        |
   | `@koderi-dp/ui/data-grid` | `@tanstack/angular-table`   |
   | `@koderi-dp/ui/charts`    | `echarts` and `ngx-echarts` |
   | `@koderi-dp/ui/tree`      | `@headless-tree/core`       |

4. Replace `src/styles.css` with the theme: fonts, the colour tokens and the base styles.
   The theme scans the library for the Tailwind classes it uses, so nothing else is needed:

   ```css
   @import "tailwindcss";
   @import "@koderi-dp/ui/theme.css";
   ```

5. Put the shell around the router and a page inside it. Replace `src/app/app.ts`:

   ```ts
   import { Component } from "@angular/core";
   import { RouterOutlet } from "@angular/router";
   import { lucideBoxes, lucideLayoutDashboard } from "@ng-icons/lucide";
   import { KoToaster } from "@koderi-dp/ui";
   import { KoAppShell, type Brand, type NavConfig } from "@koderi-dp/ui/layout";

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
   import { KoButton, KoPageHeader, KoPageShell, notify } from "@koderi-dp/ui";

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

   Delete the generated `src/app/app.html`, `app.css` and `app.spec.ts`; `app.ts` no longer
   uses them.

6. Check it:

   ```sh
   ng serve
   ```

   Open http://localhost:4200. You should see the dark shell: "My app" in the sidebar (on a
   narrow window it sits behind the menu button), the search box in the header (Ctrl+K opens
   the command palette) and the Overview page. Clicking **Save** shows a "Saved" toast.

### Existing project

Follow steps 2 to 4 above, with these differences:

- **The two imports are your whole base layer:** fonts, the colour tokens and the base styles.
  Keep your own rules below them.
- **SCSS projects:** add the same two `@import` lines to a `.css` file and list it in `styles`
  in `angular.json`, next to `styles.scss`.
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

## Developing

```sh
npm install
npm run dev        # the showcase (ng serve)
npm run build:lib  # build the package to dist/ui
```

To release, tag `main` and push the tag:

```sh
git tag v0.2.0
git push origin v0.2.0
```

`.github/workflows/release.yml` takes the version from the tag, publishes to npm with
provenance and creates the GitHub release. It publishes through npm trusted publishing, so no
token is stored anywhere.

The first release (`0.1.0`) needs a token once, because trusted publishing is set up on the
package's npm page and that page exists only after the first publish:

1. On npmjs.com, create a granular access token: read and write on packages, scoped to
   `@koderi-dp`, expiring in 1 day, with "bypass two-factor authentication" on.
2. Add it to this repo as the Actions secret `NPM_TOKEN`.
3. Push the tag: `git tag v0.1.0 && git push origin v0.1.0`.
4. Once `@koderi-dp/ui` is on npm: on its npmjs.com settings, add the trusted publisher (repo
   `koderi-dp/shared-ui-angular`, workflow `release.yml`), then delete the `NPM_TOKEN` secret
   and revoke the token. Without the secret, the workflow uses trusted publishing.

Every push to `main` deploys the showcase to GitHub Pages (`.github/workflows/pages.yml`).

See `CLAUDE.md` for the layout and the rules.

## Credits

The primitives follow the shadcn/new-york look and are adapted from
[Zard UI](https://github.com/zard-ui/zardui) (MIT, see `LICENSE`).
