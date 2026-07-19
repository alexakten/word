"use client";

import { Minus, Plus } from "lucide-react";
import { sounds } from "../../lib/sounds";

export function FilterCountStepper({ id, groupLabel, decreaseLabel, increaseLabel, count, max, onChange }: {
  id: string;
  groupLabel: string;
  decreaseLabel: string;
  increaseLabel: string;
  count: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="filter-count-stepper" id={id} role="group" aria-label={groupLabel}>
      <button
        type="button"
        className="filter-count-step"
        disabled={count === 0}
        aria-label={decreaseLabel}
        onClick={() => {
          sounds.click();
          onChange(count - 1);
        }}
      >
        <Minus size={16} strokeWidth={2} color="currentColor" aria-hidden="true" />
      </button>
      <output
        className={["filter-count-value", count === 0 && "is-unset"].filter(Boolean).join(" ")}
        aria-live="polite"
      >
        {count === 0 ? "—" : count}
      </output>
      <button
        type="button"
        className="filter-count-step"
        disabled={count >= max}
        aria-label={increaseLabel}
        onClick={() => {
          sounds.click();
          onChange(count + 1);
        }}
      >
        <Plus size={16} strokeWidth={2} color="currentColor" aria-hidden="true" />
      </button>
    </div>
  );
}
