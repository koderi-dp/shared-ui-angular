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
  {
    path: "tree",
    loadComponent: () => import("@/demo/pages/tree.page").then((m) => m.KoTreePage),
  },
  {
    path: "data-grid",
    loadComponent: () => import("@/demo/pages/data-grid.page").then((m) => m.KoDataGridPage),
  },
  {
    path: "charts",
    loadComponent: () => import("@/demo/pages/charts.page").then((m) => m.KoChartsPage),
  },
];
