import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/ui/utils";
import { LoaderCircle, type LucideIcon } from "lucide-react";
import { buttonVariants } from "./button-variants";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Prefer icon + text for actions. Keep labels stable while loading. */
  icon?: LucideIcon;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      icon: Icon,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    // Slot must receive the caller's single child, without a wrapper.
    const content = asChild ? (
      children
    ) : (
      <>
        {Icon &&
          (loading ? (
            <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
          ) : (
            <Icon aria-hidden="true" />
          ))}
        {!Icon && loading ? (
          <>
            <span className="inline-flex items-center justify-center gap-2 opacity-0">
              {children}
            </span>
            <LoaderCircle
              aria-hidden="true"
              className="absolute animate-spin motion-reduce:animate-none"
            />
          </>
        ) : (
          children
        )}
      </>
    );
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          loading && "disabled:!opacity-100",
        )}
        ref={ref}
        {...props}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        aria-disabled={disabled || loading || undefined}
        tabIndex={asChild && (disabled || loading) ? -1 : props.tabIndex}
        onClickCapture={(event) => {
          if (disabled || loading) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          props.onClickCapture?.(event);
        }}
      >
        {content}
      </Comp>
    );
  },
);
Button.displayName = "Button";

/** Compact toolbar action with a required accessible name and native tooltip. */
const IconButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, "children" | "asChild" | "size" | "icon"> & {
    icon: LucideIcon;
    label: string;
    size?: "icon" | "icon-sm";
  }
>(({ label, size = "icon-sm", variant = "ghost", ...props }, ref) => (
  <Button {...props} ref={ref} size={size} variant={variant} aria-label={label} title={label} />
));
IconButton.displayName = "IconButton";

export { Button, IconButton };
