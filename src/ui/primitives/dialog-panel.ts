/** Points the surrounding `role="dialog"` panel at this element, so the title names the dialog. */
export function linkToPanel(
  host: HTMLElement,
  attribute: "aria-labelledby" | "aria-describedby",
): void {
  const panel = host.closest('[role="dialog"]');
  if (panel && !panel.hasAttribute(attribute)) panel.setAttribute(attribute, host.id);
}
