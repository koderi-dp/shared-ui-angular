import { ChevronRight } from "lucide-react";
import { cloneElement, isValidElement, useEffect, useId, useState, type ReactNode } from "react";
import { Input } from "@/ui/primitives/input";
import { cn } from "@/ui/utils";

/** Label above the control, unit in the label, hint or error below. */
export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  const messageId = useId();
  // The control is marked invalid and pointed at the message, so the error is more than red text.
  const control = isValidElement<ControlAria>(children)
    ? cloneElement(children, {
        "aria-invalid": error ? true : children.props["aria-invalid"],
        "aria-describedby": error || hint ? messageId : children.props["aria-describedby"],
      })
    : children;
  return (
    <label className={cn("grid content-start gap-1.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {control}
      {error ? (
        <span id={messageId} role="alert" className="text-xs text-danger-fg">
          {error}
        </span>
      ) : hint ? (
        <span id={messageId} className="text-xs text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

type ControlAria = { "aria-invalid"?: boolean; "aria-describedby"?: string };

/**
 * Whole-number input. Keeps the typed text while it is being edited so the field
 * can be emptied and retyped, and reports a number only when the text is one.
 */
export function NumberInput({
  value,
  onChange,
  min,
  max,
  disabled,
  className,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
} & ControlAria) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    setText((current) => (Number(current) === value && current !== "" ? current : String(value)));
  }, [value]);
  return (
    <Input
      inputMode="numeric"
      aria-label={ariaLabel}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
      className={cn("tabular-nums", className)}
      value={text}
      onChange={(event) => {
        const next = event.target.value.replace(/[^\d]/g, "");
        setText(next);
        if (next !== "") {
          let parsed = Number(next);
          if (max != null) parsed = Math.min(parsed, max);
          onChange(parsed);
        }
      }}
      onBlur={() => {
        const parsed = text === "" ? (min ?? 0) : Math.max(min ?? 0, Number(text));
        setText(String(parsed));
        if (parsed !== value) onChange(parsed);
      }}
    />
  );
}

/** A switch with its label and description beside it. */
export function SwitchField({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        id={id}
        aria-label={label}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "mt-0.5 inline-flex h-6 w-10 shrink-0 items-center rounded-full shadow-[var(--shadow-border)] transition-[background-color] duration-150 disabled:opacity-40",
          checked ? "bg-primary" : "bg-secondary",
        )}
      >
        <span
          className={cn(
            "block size-5 rounded-full transition-transform duration-150",
            checked ? "translate-x-4 bg-primary-foreground" : "translate-x-0.5 bg-foreground",
          )}
        />
      </button>
      <label htmlFor={id} className="grid cursor-pointer gap-0.5">
        <span className="text-sm">{label}</span>
        {description ? <span className="text-xs text-muted-foreground">{description}</span> : null}
      </label>
    </div>
  );
}

/** Advanced fields sit behind this, closed by default. */
export function Disclosure({
  title,
  children,
  defaultOpen = false,
  forceOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Keeps it open while a field inside has an error to show. */
  forceOpen?: boolean;
}) {
  const [chosen, setOpen] = useState(defaultOpen);
  const open = chosen || forceOpen;
  return (
    <div className="rounded-lg shadow-[var(--shadow-border)]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
        {title}
      </button>
      {open ? <div className="grid gap-4 border-t border-border px-3 py-4">{children}</div> : null}
    </div>
  );
}

/** A choice between a few options drawn as cards, for the first step of the create flow. */
export function ChoiceCards<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { id: T; label: string; description: string; icon: ReactNode }[];
}) {
  return (
    <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex items-start gap-3 rounded-lg px-3 py-3 text-left transition-[background-color,box-shadow]",
              active
                ? "bg-secondary shadow-[var(--shadow-border-hover)]"
                : "shadow-[var(--shadow-border)] hover:bg-secondary/50",
            )}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-inset text-muted-foreground shadow-[var(--shadow-border)] [&_svg]:size-4">
              {option.icon}
            </span>
            <span className="grid gap-0.5">
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
