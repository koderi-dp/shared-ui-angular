/*
 * The primary entry point of @koderi-dp/ui: primitives, page frames, form controls,
 * status, the toaster and the helpers they share.
 */

// Primitives
export { KoBadge } from "./lib/primitives/badge.component";
export { buttonVariants } from "./lib/primitives/button-variants";
export { KoButton, KoIconButton } from "./lib/primitives/button.component";
export {
  KoCard,
  KoCardContent,
  KoCardDescription,
  KoCardHeader,
  KoCardTitle,
} from "./lib/primitives/card.component";
export { KoCheckbox, type KoCheckedState } from "./lib/primitives/checkbox.component";
export {
  KoDialog,
  KoDialogClose,
  KoDialogContent,
  KoDialogDescription,
  KoDialogFooter,
  KoDialogHeader,
  KoDialogTitle,
  KoDialogTrigger,
} from "./lib/primitives/dialog.component";
export { KoDialogService, type KoDialogConfig } from "./lib/primitives/dialog.service";
export {
  KoDropdownItem,
  KoDropdownLabel,
  KoDropdownMenu,
  KoDropdownSeparator,
  KoDropdownTrigger,
} from "./lib/primitives/dropdown-menu.component";
export { fieldControlClass, fieldFocusClass } from "./lib/primitives/field-control";
export { KoInput } from "./lib/primitives/input.directive";
export { KoLabel } from "./lib/primitives/label.directive";
export { KoPopover, KoPopoverContent, KoPopoverTrigger } from "./lib/primitives/popover.component";
export { KoScrollArea } from "./lib/primitives/scroll-area.directive";
export { KoSelect, type KoSelectOption } from "./lib/primitives/select.component";
export { KoSeparator } from "./lib/primitives/separator.component";
export {
  KoSheet,
  KoSheetClose,
  KoSheetContent,
  KoSheetDescription,
  KoSheetTitle,
  KoSheetTrigger,
} from "./lib/primitives/sheet.component";
export { KoSkeleton } from "./lib/primitives/skeleton.component";
export { KoSwitch } from "./lib/primitives/switch.component";
export {
  KoTable,
  KoTableBody,
  KoTableCell,
  KoTableHead,
  KoTableHeader,
  KoTableRow,
} from "./lib/primitives/table.component";
export { KoTabs, KoTabsContent, KoTabsList, KoTabsTrigger } from "./lib/primitives/tabs.component";
export { KoTextarea } from "./lib/primitives/textarea.directive";
export {
  KoTooltip,
  KoTooltipContent,
  type KoTooltipSide,
} from "./lib/primitives/tooltip.directive";

// Page frames and composites
export { KoConfirmDialog } from "./lib/confirm-dialog.component";
export {
  KoDetailEmpty,
  KoDetailSection,
  KoDetailShell,
  KoOverviewPanel,
  KoOverviewRow,
  type DetailAction,
  type DetailTabDefinition,
} from "./lib/detail-shell.component";
export {
  KoChoiceCards,
  KoDisclosure,
  KoField,
  KoNumberInput,
  KoSwitchField,
  type ChoiceCardOption,
} from "./lib/form.component";
export { KoListFilterBar, KoSelectionToolbar } from "./lib/list-filter-bar.component";
export { KoPageHeader } from "./lib/page-header.component";
export { KoPageShell } from "./lib/page-shell.component";
export {
  KoSettingsSaveFooter,
  KoSettingsSectionLayout,
  type SettingsSectionDefinition,
} from "./lib/settings-section.component";

// Status and notifications
export { KoStatusBadge, KoStatusDot } from "./lib/status.component";
export { statusLabel, statusTone, type Tone } from "./lib/status-text";
export { KoToaster } from "./lib/toaster.component";
export { notify } from "./lib/notify";

// Helpers
export { persisted } from "./lib/persisted";
export {
  clampFixedPopoverPosition,
  cn,
  formatBytes,
  formatDuration,
  formatRelative,
  type ViewportSize,
} from "./lib/utils";
export {
  clockTime,
  RANGES,
  seriesColor,
  SERIES_COLORS,
  timeTicks,
  type RangeId,
} from "./lib/chart-format";
