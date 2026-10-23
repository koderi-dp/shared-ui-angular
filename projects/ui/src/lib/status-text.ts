export type Tone = "live" | "warn" | "danger" | "outline";

/**
 * The tone each state word is drawn in. States that are not listed are drawn as
 * outline. Add the app's own states here, so that every badge and dot agrees.
 */
const TONES: Record<string, Tone> = {
  running: "live",
  online: "live",
  active: "live",
  healthy: "live",
  starting: "warn",
  stopping: "warn",
  pending: "warn",
  connecting: "warn",
  reconnecting: "warn",
  degraded: "warn",
  failed: "danger",
  error: "danger",
  offline: "danger",
  stopped: "outline",
  idle: "outline",
  disabled: "outline",
};

/** States whose word on screen is not the state name itself. */
const LABELS: Record<string, string> = {};

export function statusTone(state: string): Tone {
  return TONES[state.toLowerCase()] ?? "outline";
}

export function statusLabel(state: string): string {
  const key = state.toLowerCase();
  return LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}
