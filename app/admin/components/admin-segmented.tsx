"use client";

import type { ReactNode } from "react";

export type AdminSegmentedOption<T extends string | number> = {
  value: T;
  label: ReactNode;
  title?: string;
  disabled?: boolean;
};

type AdminSegmentedProps<T extends string | number> = {
  label?: string;
  value: T;
  options: AdminSegmentedOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
};

export function AdminSegmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: AdminSegmentedProps<T>) {
  return (
    <div
      className={["admin-segmented-wrap", className].filter(Boolean).join(" ")}
      role="group"
      aria-label={ariaLabel}
    >
      {label ? <span className="admin-control-label">{label}</span> : null}
      <div className="admin-segmented">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={String(option.value)}
              type="button"
              className={["admin-segment", active ? "is-active" : ""].filter(Boolean).join(" ")}
              title={option.title}
              aria-pressed={active}
              disabled={option.disabled}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
