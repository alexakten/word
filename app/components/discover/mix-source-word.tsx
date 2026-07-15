"use client";

import type { MixSideSettings } from "../../syllables";
import { MixWordSyllables } from "./mix-word-syllables";

export function MixSourceWord({ word, settings, syllableCount, className }: {
  word: string;
  settings: MixSideSettings;
  syllableCount?: number;
  className: string;
}) {
  return (
    <h2 className={`split-source-word mix-source-word ${className}`}>
      <MixWordSyllables word={word} settings={settings} syllableCount={syllableCount} />
    </h2>
  );
}
