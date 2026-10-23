import * as React from "react";
import { cn } from "@/ui/utils";
import { fieldControlClass, fieldFocusClass } from "@/ui/primitives/field-control";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-24 w-full px-3 py-2 text-sm placeholder:text-muted-foreground/70",
        fieldControlClass,
        fieldFocusClass,
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea };
