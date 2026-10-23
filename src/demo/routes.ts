import type { Routes } from "@angular/router";

export const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "primitives" },
  {
    path: "primitives",
    loadComponent: () => import("@/demo/pages/primitives.page").then((m) => m.KoPrimitivesPage),
  },
];
