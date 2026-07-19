"use client";

import { sounds } from "../../lib/sounds";
import { useActiveTabClipPath } from "./use-active-tab-clip-path";

export function MixSegmentToggle<T extends string>({ value, label, options, disabled = false, className = "", onChange }: {
  value: T;
  label: string;
  options: { value: T; label: string }[];
  disabled?: boolean;
  className?: string;
  onChange: (value: T) => void;
}) {
  const { activeTabRef, containerRef } = useActiveTabClipPath(value);
  const rootClass = ["mix-segment-toggle", className, disabled ? "disabled" : ""].filter(Boolean).join(" ");

  return (
    <div className={rootClass} role="group" aria-label={label} aria-disabled={disabled}>
      <ul className="word-type-tab-list">
        {options.map((option) => (
          <li key={option.value}>
            <button
              ref={value === option.value ? activeTabRef : null}
              type="button"
              aria-pressed={value === option.value}
              disabled={disabled}
              onClick={() => {
                sounds.click();
                onChange(option.value);
              }}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="word-type-active-layer" aria-hidden="true" ref={containerRef}>
        <ul className="word-type-tab-list word-type-tab-list-overlay">
          {options.map((option) => (
            <li key={option.value}><button type="button" tabIndex={-1}>{option.label}</button></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
