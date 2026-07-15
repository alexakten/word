"use client";

import { wordTypes } from "../../lib/constants";
import type { WordTypeTabsProps } from "../../lib/types";
import { useActiveTabClipPath } from "./use-active-tab-clip-path";

export function WordTypeTabs({ value, label, className = "", onChange }: WordTypeTabsProps) {
  const { activeTabRef, containerRef } = useActiveTabClipPath(value);

  return (
    <div className={`word-type-tabs ${className}`.trim()} role="group" aria-label={label}>
      <ul className="word-type-tab-list">
        {wordTypes.map((type) => (
          <li key={type.value}>
            <button
              ref={value === type.value ? activeTabRef : null}
              type="button"
              aria-pressed={value === type.value}
              onClick={() => onChange(type.value)}
            >
              {type.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="word-type-active-layer" aria-hidden="true" ref={containerRef}>
        <ul className="word-type-tab-list word-type-tab-list-overlay">
          {wordTypes.map((type) => (
            <li key={type.value}><button type="button" tabIndex={-1}>{type.label}</button></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
