"use client";

import { useMemo } from "react";
import { getSyllableSegments, type MixSideSettings } from "../../syllables";

export function MixWordSyllables({ word, settings, syllableCount, className }: {
  word: string;
  settings: MixSideSettings;
  syllableCount?: number;
  className?: string;
}) {
  const segments = useMemo(
    () => getSyllableSegments(word, settings, syllableCount),
    [settings, syllableCount, word],
  );

  return (
    <span className={className}>
      {segments.map((segment, index) => (
        <span
          key={`${segment.text}-${index}`}
          className={segment.used ? "mix-syllable-used" : "mix-syllable-unused"}
        >
          {segment.text}
        </span>
      ))}
    </span>
  );
}
