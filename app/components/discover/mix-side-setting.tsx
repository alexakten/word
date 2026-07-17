"use client";

import { useEffect, useMemo } from "react";
import { SLICE_MODE_OPTIONS } from "../../lib/constants";
import { parseSyllablePickValue, parseSyllableTakeValue } from "../../lib/syllable-parsers";
import {
  type MixSideSettings,
  type SliceMode,
  buildSyllablePickOptions,
  buildSyllableTakeOptions,
  maxTakeFromPick,
  normalizeSyllablePick,
  resolveRandomDisplaySettings,
  resolveWordSyllableCount,
} from "../../syllables";
import { MixSegmentToggle } from "../ui/mix-segment-toggle";

export function MixSideSetting({ labelPrefix, word, settings, sliceMode, syllableCount, hasWord, onChange, onSliceModeChange }: {
  labelPrefix: string;
  word: string;
  settings: MixSideSettings;
  sliceMode: SliceMode;
  syllableCount?: number;
  hasWord: boolean;
  onChange: (settings: MixSideSettings) => void;
  onSliceModeChange: (mode: SliceMode) => void;
}) {
  const resolvedSyllableCount = useMemo(
    () => resolveWordSyllableCount(word, syllableCount),
    [syllableCount, word],
  );
  const positionOptionsOnly = sliceMode === "custom" || sliceMode === "random";
  const syllablePick = normalizeSyllablePick(
    settings.syllablePick,
    "",
    undefined,
    resolvedSyllableCount,
    "exact",
  );
  const pickOptions = useMemo(
    () => buildSyllablePickOptions("", resolvedSyllableCount, "exact", positionOptionsOnly),
    [positionOptionsOnly, resolvedSyllableCount],
  );
  const maxTake = maxTakeFromPick(syllablePick, resolvedSyllableCount);
  const singleSyllableOnly = hasWord && resolvedSyllableCount === 1;
  const sliceDisabled = !hasWord || sliceMode !== "custom";
  const positionDisabled = sliceDisabled || singleSyllableOnly;
  const previewLocked = sliceMode === "random";
  const noneDisplaySettings = useMemo<MixSideSettings>(
    () => ({ syllablePick: "full", syllableTake: 1 }),
    [],
  );
  const randomPreview = useMemo(
    () => resolveRandomDisplaySettings(word, resolvedSyllableCount),
    [resolvedSyllableCount, word],
  );
  const displaySettings = sliceMode === "none"
    ? noneDisplaySettings
    : sliceMode === "random"
      ? randomPreview
      : settings;
  const displayPick = normalizeSyllablePick(
    displaySettings.syllablePick,
    "",
    undefined,
    resolvedSyllableCount,
    "exact",
  );
  const displayTakeOptions = useMemo(
    () => buildSyllableTakeOptions(displayPick, resolvedSyllableCount),
    [displayPick, resolvedSyllableCount],
  );
  const displayTakeValue = displaySettings.syllablePick === "full"
    ? displayTakeOptions[0]?.value ?? "1"
    : String(displaySettings.syllableTake);

  useEffect(() => {
    if (!hasWord || sliceMode !== "custom") return;

    const normalizedPick = normalizeSyllablePick(settings.syllablePick, "", undefined, resolvedSyllableCount, "exact");
    const nextSettings = normalizedPick !== settings.syllablePick
      ? { ...settings, syllablePick: normalizedPick }
      : settings;
    const nextMaxTake = maxTakeFromPick(normalizedPick, resolvedSyllableCount);
    if (nextSettings.syllableTake > nextMaxTake) {
      onChange({ ...nextSettings, syllableTake: nextMaxTake });
      return;
    }
    if (nextSettings !== settings) onChange(nextSettings);
  }, [hasWord, onChange, resolvedSyllableCount, settings, sliceMode]);

  useEffect(() => {
    if (!hasWord || sliceDisabled) return;
    if (settings.syllableTake > maxTake) {
      onChange({ ...settings, syllableTake: maxTake });
    }
  }, [hasWord, maxTake, onChange, settings, sliceDisabled]);

  return (
    <div className="mix-side-settings">
      <div className="mix-position-row">
        <MixSegmentToggle
          className="slice-mode-toggle"
          value={sliceMode}
          label={`${labelPrefix} slice mode`}
          options={SLICE_MODE_OPTIONS}
          onChange={onSliceModeChange}
        />
      </div>
      <div
        className={`mix-position-setting-wrap${sliceMode !== "none" ? " is-expanded" : ""}`}
        aria-hidden={sliceMode === "none"}
      >
        <div className="mix-position-setting-wrap-inner">
          <div className={`mix-position-setting${previewLocked ? " mix-position-setting-locked" : ""}`}>
            <div className="mix-position-row">
              <span className="mix-position-label">Slice start position</span>
              {singleSyllableOnly && sliceMode !== "none" ? (
                <div
                  className="mix-segment-toggle mix-syllable-amount-toggle mix-segment-toggle-message disabled"
                  role="group"
                  aria-label={`${labelPrefix} slice start position`}
                  aria-disabled="true"
                >
                  <span>Only 1 syllable available</span>
                </div>
              ) : (
                <MixSegmentToggle
                  className="mix-syllable-amount-toggle"
                  value={String(displayPick)}
                  label={`${labelPrefix} slice start position`}
                  options={pickOptions}
                  disabled={positionDisabled}
                  onChange={(pick) => onChange({ ...settings, syllablePick: parseSyllablePickValue(pick) })}
                />
              )}
            </div>
            <div className="mix-position-row">
              <span className="mix-position-label">Include</span>
              <MixSegmentToggle
                className="mix-syllable-count-toggle"
                value={displayTakeValue}
                label={`${labelPrefix} include`}
                options={displayTakeOptions}
                disabled={sliceDisabled || displaySettings.syllablePick === "full"}
                onChange={(take) => onChange({ ...settings, syllableTake: parseSyllableTakeValue(take) })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
