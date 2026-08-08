"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type SelectOption = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  value: string;
  options: SelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
};

export function CustomSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-col rounded-xl px-1 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <span className="mt-0.5 flex items-center justify-between gap-2 text-sm text-muted">
          <span className="truncate">
            {selected?.label || placeholder || "—"}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+6px)] left-0 z-50 max-h-64 w-full min-w-[12rem] overflow-auto rounded-xl border border-border bg-white py-1 shadow-[0_8px_28px_rgba(0,0,0,0.12)]"
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value || "__empty"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-surface ${
                    active ? "font-semibold text-foreground" : "text-foreground"
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                  {active ? <Check className="h-4 w-4 text-brand" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
