"use client";

import { MAX_LENGTH_FILTER } from "../../lib/constants";
import { normalizeLengthSelection } from "../../lib/filters";
import type { LengthMode } from "../../lib/types";
import { FilterCountSetting } from "../ui/filter-count-setting";

export function WordLengthSetting({ id, value, mode, onValueChange, onModeChange }: {
  id: string;
  value: string;
  mode: LengthMode;
  onValueChange: (value: string) => void;
  onModeChange: (value: LengthMode) => void;
}) {
  return (
    <FilterCountSetting
      id={id}
      className="word-length-setting"
      label="Length"
      modeLabel="Length comparison"
      stepperGroupLabel="Word length"
      decreaseLabel="Decrease word length"
      increaseLabel="Increase word length"
      value={value}
      mode={mode}
      max={MAX_LENGTH_FILTER}
      normalize={normalizeLengthSelection}
      onValueChange={onValueChange}
      onModeChange={onModeChange}
    />
  );
}
