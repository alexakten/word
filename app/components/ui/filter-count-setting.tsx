"use client";

import type { LengthMode } from "../../lib/types";
import { FilterCountStepper } from "./filter-count-stepper";
import { LengthModeDropdown } from "./length-mode-dropdown";

export function FilterCountSetting({ id, className = "", label, modeLabel, stepperGroupLabel, decreaseLabel, increaseLabel, value, mode, max, normalize, onValueChange, onModeChange }: {
  id: string;
  className?: string;
  label: string;
  modeLabel: string;
  stepperGroupLabel: string;
  decreaseLabel: string;
  increaseLabel: string;
  value: string;
  mode: LengthMode;
  max: number;
  normalize: (value: string) => string;
  onValueChange: (value: string) => void;
  onModeChange: (value: LengthMode) => void;
}) {
  const count = Number(normalize(value)) || 0;
  const hasCount = count > 0;

  const setCount = (next: number) => {
    if (next <= 0) {
      onModeChange("exact");
      onValueChange("");
      return;
    }
    onValueChange(String(Math.min(next, max)));
  };

  return (
    <div className={["filter-count-setting", className].filter(Boolean).join(" ")}>
      <span className="counter-with-mode-name">{label}</span>
      <LengthModeDropdown
        inline
        value={mode}
        label={modeLabel}
        disabled={!hasCount}
        onChange={onModeChange}
      />
      <FilterCountStepper
        id={id}
        groupLabel={stepperGroupLabel}
        decreaseLabel={decreaseLabel}
        increaseLabel={increaseLabel}
        count={count}
        max={max}
        onChange={setCount}
      />
    </div>
  );
}
