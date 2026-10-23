import { toast } from "sonner";

function message(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

/** The toasts the app shows, so the wording is the same on every page. */
export const notify = {
  success(text: string) {
    toast.success(text);
  },
  saved(label?: string) {
    toast.success(label ? `${label} saved` : "Saved");
  },
  created(label: string) {
    toast.success(`${label} created`);
  },
  deleted(label: string) {
    toast.success(`${label} deleted`);
  },
  copied(label = "Copied to clipboard") {
    toast.success(label);
  },
  error(err: unknown, fallback = "Something went wrong") {
    toast.error(message(err, fallback));
  },
};
