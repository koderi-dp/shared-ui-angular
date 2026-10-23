import {
  Activity,
  Boxes,
  FileText,
  FolderTree,
  LayoutPanelLeft,
  PanelsTopLeft,
  Settings,
  Table2,
} from "lucide-react";
import type { Brand } from "@/ui/layout/app-shell";
import type { NavConfig } from "@/ui/layout/nav";

/** The showcase is an app like any other: it gets its nav and brand the same way. */
export const demoNav: NavConfig = {
  primary: [
    { to: "/", label: "Overview", icon: Activity, keywords: ["home", "dashboard"] },
    { to: "/primitives", label: "Primitives", icon: Boxes, keywords: ["components", "atoms"] },
    { to: "/blocks", label: "Page blocks", icon: FileText, keywords: ["furniture", "list"] },
    { to: "/tree", label: "Tree", icon: FolderTree, keywords: ["hierarchy", "folders", "files"] },
    { to: "/data-grid", label: "Data grid", icon: Table2, keywords: ["table", "columns"] },
    { to: "/charts", label: "Charts", icon: LayoutPanelLeft, keywords: ["metrics", "timeline"] },
    { to: "/detail/itm-01", label: "Detail", icon: PanelsTopLeft, keywords: ["record", "item"] },
  ],
  secondary: [{ to: "/settings", label: "Settings", icon: Settings, keywords: ["preferences"] }],
};

export const demoBrand: Brand = { name: "Shared UI", tagline: "Showcase", icon: Boxes };
