import type { Routes } from "@angular/router";

export const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "primitives" },
  {
    path: "primitives",
    loadComponent: () => import("@/demo/pages/primitives.page").then((m) => m.KoPrimitivesPage),
  },
  {
    path: "settings",
    loadComponent: () => import("@/demo/pages/settings.page").then((m) => m.KoSettingsPage),
  },
  {
    path: "detail",
    loadComponent: () => import("@/demo/pages/detail.page").then((m) => m.KoDetailPage),
  },
  {
    path: "detail/:id",
    loadComponent: () => import("@/demo/pages/detail.page").then((m) => m.KoDetailPage),
  },
  {
    path: "blocks",
    loadComponent: () => import("@/demo/pages/blocks.page").then((m) => m.KoBlocksPage),
  },
];
