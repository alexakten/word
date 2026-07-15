import { COUNT_LONG_VALUE, MAX_LENGTH_FILTER, MAX_SYLLABLE_FILTER } from "./constants";
import type { LengthMode } from "./types";

export function normalizeSyllableSelection(value: string): string {
  if (!value || value === "any") return "";
  if (value === COUNT_LONG_VALUE) return "6";
  const count = Number(value);
  if (!Number.isFinite(count) || count < 1) return "";
  return String(Math.min(Math.floor(count), MAX_SYLLABLE_FILTER));
}

export function resolveSyllableFilter(value: string, mode: LengthMode): { syllables: string; mode: LengthMode } | null {
  const normalized = normalizeSyllableSelection(value);
  if (!normalized) return null;
  return { syllables: normalized, mode };
}

export function normalizeLengthSelection(value: string): string {
  if (!value || value === "any") return "";
  if (value === COUNT_LONG_VALUE) return "9";
  const count = Number(value);
  if (!Number.isFinite(count) || count < 1) return "";
  return String(Math.min(Math.floor(count), MAX_LENGTH_FILTER));
}

export function resolveLengthFilter(value: string, mode: LengthMode): { length: string; mode: LengthMode } | null {
  const normalized = normalizeLengthSelection(value);
  if (!normalized) return null;
  return { length: normalized, mode };
}
