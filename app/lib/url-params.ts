import {
  effectiveMixSettings,
  parseMixSideSettingsFromUrl,
  type MixSideSettings,
  type SliceMode,
} from "../syllables";
import { COUNT_LONG_VALUE, LENGTH_MODES, POS_VALUES } from "./constants";
import { normalizeLengthSelection, normalizeSyllableSelection } from "./filters";
import { normalizeTags } from "./tags";
import type { LengthMode, PartOfSpeech, SideSettings } from "./types";

export function parseMixSideSettings(search: URLSearchParams, prefix: string): Partial<MixSideSettings> {
  return parseMixSideSettingsFromUrl(search, prefix);
}

export function parsePartOfSpeech(value: string | null): PartOfSpeech | null {
  return value && POS_VALUES.has(value as PartOfSpeech) ? value as PartOfSpeech : null;
}

export function parseLengthMode(value: string | null): LengthMode | null {
  return value && LENGTH_MODES.has(value as LengthMode) ? value as LengthMode : null;
}

export function parseSideSettings(search: URLSearchParams, prefix: "l" | "r"): Partial<SideSettings> {
  const get = (key: string) => search.get(`${prefix}${key}`);
  const settings: Partial<SideSettings> = {};
  const text = get("Text");
  const related = get("Related");
  const pos = parsePartOfSpeech(get("Pos"));
  const syllables = get("Syl");
  const syllableMode = parseLengthMode(get("SylMode"));
  const startsWith = get("Start")?.replace(/[^a-z]/gi, "").slice(0, 12);
  const endsWith = get("End")?.replace(/[^a-z]/gi, "").slice(0, 12);
  const letters = get("Len");
  const lengthMode = parseLengthMode(get("LenMode"));

  if (text) settings.text = normalizeTags(text);
  if (related) settings.related = related;
  if (pos) settings.pos = pos;
  if (syllables === COUNT_LONG_VALUE) {
    settings.syllables = "6";
    settings.syllableMode = "more";
  } else if (syllables) {
    const normalizedSyllables = normalizeSyllableSelection(syllables);
    if (normalizedSyllables) {
      settings.syllables = normalizedSyllables;
      if (syllableMode) settings.syllableMode = syllableMode;
    }
  } else if (syllableMode) {
    settings.syllableMode = syllableMode;
  }
  if (startsWith) settings.startsWith = startsWith;
  if (endsWith) settings.endsWith = endsWith;
  if (letters === COUNT_LONG_VALUE) {
    settings.letters = "9";
    settings.lengthMode = "more";
  } else if (letters) {
    const normalizedLetters = normalizeLengthSelection(letters);
    if (normalizedLetters) {
      settings.letters = normalizedLetters;
      if (lengthMode) settings.lengthMode = lengthMode;
    }
  } else if (lengthMode) {
    settings.lengthMode = lengthMode;
  }
  return settings;
}

export function writeSideSettings(params: URLSearchParams, prefix: "l" | "r", settings: SideSettings) {
  const entries: [string, string | null][] = [
    ["Text", settings.text || null],
    ["Related", settings.related || null],
    ["Pos", settings.pos !== "any" ? settings.pos : null],
    ["Syl", settings.syllables || null],
    ["SylMode", settings.syllableMode !== "exact" ? settings.syllableMode : null],
    ["Start", settings.startsWith || null],
    ["End", settings.endsWith || null],
    ["Len", settings.letters || null],
    ["LenMode", settings.lengthMode !== "exact" ? settings.lengthMode : null],
  ];

  for (const [key, value] of entries) {
    const param = `${prefix}${key}`;
    if (value) params.set(param, value);
    else params.delete(param);
  }
}

export function syncDiscoverUrlParams(
  left: SideSettings,
  right: SideSettings,
  mixLeft: MixSideSettings,
  mixRight: MixSideSettings,
  leftSliceMode: SliceMode,
  rightSliceMode: SliceMode,
) {
  const url = new URL(window.location.href);
  url.searchParams.delete("view");
  writeSideSettings(url.searchParams, "l", left);
  writeSideSettings(url.searchParams, "r", right);
  url.searchParams.set("mlSlice", leftSliceMode);
  url.searchParams.set("mrSlice", rightSliceMode);
  url.searchParams.delete("slice");
  const effectiveLeft = effectiveMixSettings(leftSliceMode, mixLeft);
  const effectiveRight = effectiveMixSettings(rightSliceMode, mixRight);
  url.searchParams.set("mlPos", String(effectiveLeft.syllablePick));
  url.searchParams.set("mlAmt", String(effectiveLeft.syllableTake));
  url.searchParams.set("mrPos", String(effectiveRight.syllablePick));
  url.searchParams.set("mrAmt", String(effectiveRight.syllableTake));
  url.searchParams.set("mlCustomPos", String(mixLeft.syllablePick));
  url.searchParams.set("mlCustomAmt", String(mixLeft.syllableTake));
  url.searchParams.set("mrCustomPos", String(mixRight.syllablePick));
  url.searchParams.set("mrCustomAmt", String(mixRight.syllableTake));
  url.searchParams.delete("mlCount");
  url.searchParams.delete("mlPick");
  url.searchParams.delete("mrCount");
  url.searchParams.delete("mrPick");
  window.history.replaceState(window.history.state, "", url);
}
