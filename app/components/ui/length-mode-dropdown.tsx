"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { LENGTH_MODE_OPTIONS } from "../../lib/constants";
import type { LengthMode } from "../../lib/types";

export function LengthModeDropdown({ value, label = "Comparison", disabled = false, inline = false, onChange }: {
  value: LengthMode;
  label?: string;
  disabled?: boolean;
  inline?: boolean;
  onChange: (value: LengthMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = LENGTH_MODE_OPTIONS.find((option) => option.value === value) ?? LENGTH_MODE_OPTIONS[1];

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  const selectOption = (nextValue: LengthMode) => {
    onChange(nextValue);
    setOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div
      className={[
        "length-mode-dropdown",
        inline ? "length-mode-dropdown-inline" : "",
        disabled ? "disabled" : "",
        open ? "open" : "",
      ].filter(Boolean).join(" ")}
      ref={rootRef}
    >
      <button
        type="button"
        className="length-mode-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${selected.label}`}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (open) {
            setOpen(false);
            setActiveIndex(-1);
          } else {
            setOpen(true);
            setActiveIndex(Math.max(0, LENGTH_MODE_OPTIONS.findIndex((option) => option.value === value)));
          }
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex(Math.max(0, LENGTH_MODE_OPTIONS.findIndex((option) => option.value === value)));
          } else if (event.key === "Escape") {
            setOpen(false);
            setActiveIndex(-1);
          }
        }}
      >
        <span>{selected.label}</span>
        <ChevronDown size={12} strokeWidth={1.6} aria-hidden="true" />
      </button>
      {open ? (
        <ul className="length-mode-dropdown-menu" role="listbox" aria-label={label}>
          {LENGTH_MODE_OPTIONS.map((option, index) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-label={option.label}
                aria-selected={value === option.value}
                className={[
                  value === option.value ? "selected" : "",
                  activeIndex === index ? "active" : "",
                ].filter(Boolean).join(" ") || undefined}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(option.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActiveIndex((current) => Math.min(current + 1, LENGTH_MODE_OPTIONS.length - 1));
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActiveIndex((current) => Math.max(current - 1, 0));
                  } else if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectOption(option.value);
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    setOpen(false);
                    setActiveIndex(-1);
                  }
                }}
              >
                <span>{option.label}</span>
                <span className="length-mode-option-symbol" aria-hidden="true">{option.symbol}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
