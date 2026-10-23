import { toast } from "ngx-sonner";
import { describe, expect, it, vi } from "vitest";
import { notify } from "./notify";

vi.mock("ngx-sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("notify", () => {
  it("words a saved toast with and without a label", () => {
    notify.saved("Agent");
    expect(toast.success).toHaveBeenCalledWith("Agent saved");
    notify.saved();
    expect(toast.success).toHaveBeenCalledWith("Saved");
  });

  it("uses an Error's message, else the fallback", () => {
    notify.error(new Error("boom"));
    expect(toast.error).toHaveBeenCalledWith("boom");
    notify.error(42);
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });
});
