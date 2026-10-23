type ShortcutEvent = Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "isComposing">;

/** Ctrl+K, or ⌘K on macOS; never while an IME is composing. */
export function isPaletteShortcut(event: ShortcutEvent, mac: boolean): boolean {
  if (event.isComposing || event.altKey || event.key.toLowerCase() !== "k") return false;
  return mac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
}

type PlatformInfo = { platform?: string; userAgentData?: { platform?: string } };

/** macOS and iOS, from `navigator.userAgentData` where the browser has it. */
export function isMacPlatform(navigator: PlatformInfo): boolean {
  const platform = navigator.userAgentData?.platform ?? navigator.platform ?? "";
  return /mac|iphone|ipad|ipod/i.test(platform);
}

/** The hint on the header's search button. */
export function shortcutLabel(mac: boolean): string {
  return mac ? "⌘K" : "Ctrl K";
}

/** The path of a router URL, without the query and the fragment. */
export function urlPath(url: string): string {
  return url.split(/[?#]/)[0] || "/";
}
