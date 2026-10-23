import {
  lucideActivity,
  lucideBoxes,
  lucideFileText,
  lucideFolderTree,
  lucideLayoutPanelLeft,
  lucidePanelsTopLeft,
  lucideSettings,
  lucideTable2,
} from "@ng-icons/lucide";
import type { Brand } from "@/ui/layout/app-shell.component";
import type { NavConfig } from "@/ui/layout/nav";

/** The showcase is an app like any other: it gets its nav and brand the same way. */
export const demoNav: NavConfig = {
  primary: [
    { to: "/", label: "Overview", icon: lucideActivity, keywords: ["home", "dashboard"] },
    {
      to: "/primitives",
      label: "Primitives",
      icon: lucideBoxes,
      keywords: ["components", "atoms"],
    },
    { to: "/blocks", label: "Page blocks", icon: lucideFileText, keywords: ["furniture", "list"] },
    {
      to: "/tree",
      label: "Tree",
      icon: lucideFolderTree,
      keywords: ["hierarchy", "folders", "files"],
    },
    { to: "/data-grid", label: "Data grid", icon: lucideTable2, keywords: ["table", "columns"] },
    {
      to: "/charts",
      label: "Charts",
      icon: lucideLayoutPanelLeft,
      keywords: ["metrics", "timeline"],
    },
    {
      to: "/detail/itm-01",
      label: "Detail",
      icon: lucidePanelsTopLeft,
      keywords: ["record", "item"],
    },
  ],
  secondary: [
    { to: "/settings", label: "Settings", icon: lucideSettings, keywords: ["preferences"] },
  ],
};

export const demoBrand: Brand = { name: "Shared UI", tagline: "Showcase", icon: lucideBoxes };

/** The detail page scrolls its own panes, so it gets a fixed-height main. */
export const demoFullHeight = (path: string): boolean => path.startsWith("/detail");
