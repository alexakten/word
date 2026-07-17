"use client";

import { MAX_SYLLABLE_FILTER } from "../../lib/constants";
import { normalizeSyllableSelection } from "../../lib/filters";
import type { LengthMode } from "../../lib/types";
import { FilterCountSetting } from "../ui/filter-count-setting";

export function SyllableCountSetting({ id, value, mode, onValueChange, onModeChange }: {
  id: string;
  value: string;
  mode: LengthMode;
  onValueChange: (value: string) => void;
  onModeChange: (value: LengthMode) => void;
}) {
  return (
    <FilterCountSetting
      id={id}
      className="syllable-count-setting"
      label="Syllables"
      modeLabel="Syllable count comparison"
      stepperGroupLabel="Syllable count"
      decreaseLabel="Decrease syllable count"
      increaseLabel="Increase syllable count"
      value={value}
      mode={mode}
      max={MAX_SYLLABLE_FILTER}
      normalize={normalizeSyllableSelection}
      onValueChange={onValueChange}
      onModeChange={onModeChange}
    />
  );
}
