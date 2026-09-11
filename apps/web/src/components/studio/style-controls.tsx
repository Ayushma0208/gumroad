import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function ChoiceRow<T extends string>({
  label,
  value,
  options,
  onChange,
  renderOption,
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[] | { id: T; label: string }[];
  onChange: (id: T) => void;
  renderOption?: (option: { id: T; label: string }, selected: boolean) => ReactNode;
}) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={selected}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm transition-colors",
                selected
                  ? "border-foreground bg-muted/60"
                  : "border-border hover:border-foreground/30",
              )}
            >
              {renderOption ? renderOption(option, selected) : option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FontChoice({
  label,
  value,
  options,
  onChange,
  stacks,
}: {
  label: string;
  value: string;
  options: readonly { id: string; label: string }[];
  onChange: (id: string) => void;
  stacks: Record<string, string>;
}) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={selected}
              className={cn(
                "rounded-xl border px-2 py-3 text-center transition-colors",
                selected
                  ? "border-foreground bg-muted/60"
                  : "border-border hover:border-foreground/30",
              )}
            >
              <span
                className="block text-2xl leading-none"
                style={{ fontFamily: stacks[option.id] }}
              >
                Ag
              </span>
              <span className="mt-2 block text-[11px] text-muted-foreground">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="mt-1.5 flex items-center gap-2">
        <input
          type="color"
          value={normalizeHex(value)}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="size-9 shrink-0 cursor-pointer rounded-lg border border-input bg-transparent p-0.5"
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-2 font-mono text-xs uppercase outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </span>
    </label>
  );
}

function normalizeHex(value: string) {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const chars = value.slice(1).split("");
    return `#${chars.map((char) => `${char}${char}`).join("")}`;
  }
  return "#000000";
}
