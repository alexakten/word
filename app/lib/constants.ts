import type { SliceMode } from "../syllables";
import { PUBLIC_TLDS } from "./public-tlds";
import type { AdvancedMode, LengthMode, NameDisplayMode, PartOfSpeech, WordCapitalization } from "./types";

export const POS_VALUES = new Set<PartOfSpeech>(["any", "n", "v", "adj", "adv"]);
export const LENGTH_MODES = new Set<LengthMode>(["less", "exact", "more"]);
export const COUNT_LONG_VALUE = "+";
export const MAX_SYLLABLE_FILTER = 8;
export const MAX_LENGTH_FILTER = 22;

export const NAME_DISPLAY_MODE_OPTIONS: { value: NameDisplayMode; label: string }[] = [
  { value: "word", label: "Name" },
  { value: "domain", label: "Domain" },
  { value: "handle", label: "Handle" },
  { value: "brand", label: "Brand" },
];

export const WORD_CAPITALIZATION_OPTIONS: { value: WordCapitalization; label: string }[] = [
  { value: "lower", label: "aa" },
  { value: "title", label: "Aa" },
];

export function pickRandomWordCapitalization(exclude?: WordCapitalization | null): WordCapitalization {
  const options = WORD_CAPITALIZATION_OPTIONS.map((entry) => entry.value);
  let next = options[Math.floor(Math.random() * options.length)]!;
  if (exclude) {
    let guard = 0;
    while (next === exclude && guard < 8) {
      next = options[Math.floor(Math.random() * options.length)]!;
      guard += 1;
    }
  }
  return next;
}

export function applyWordCapitalization(text: string, mode: WordCapitalization) {
  if (!text) return text;
  if (mode === "lower") return text.toLowerCase();
  const lower = text.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Apply capitalization to a combo chunk. Title (`Aa`) only capitalizes the first chunk. */
export function applyChunkCapitalization(chunk: string, mode: WordCapitalization) {
  return applyWordCapitalization(chunk, mode);
}

/** Shown first in the TLD picker (fixed order). */
export const POPULAR_TLDS = [
  ".com",
  ".co",
  ".ai",
  ".app",
  ".xyz",
  ".dev",
  ".net",
  ".org",
  ".io",
  ".me",
  ".sh",
  ".fm",
  ".tv",
  ".so",
  ".tech",
  ".online",
  ".site",
  ".store",
] as const;

const popularTldSet = new Set<string>(POPULAR_TLDS);
const publicTldSet = new Set<string>(PUBLIC_TLDS);

/** Popular TLDs first (fixed order), then other publicly registerable TLDs A–Z. */
export const ALL_TLDS: readonly string[] = [
  ...POPULAR_TLDS.filter((tld) => publicTldSet.has(tld)),
  ...PUBLIC_TLDS
    .filter((tld) => !popularTldSet.has(tld))
    .slice()
    .sort((a, b) => a.localeCompare(b)),
];

export function filterTlds(query: string): string[] {
  const normalized = query.trim().toLowerCase().replace(/^\./, "");
  if (!normalized) return [...ALL_TLDS];

  const matches = ALL_TLDS.filter((tld) => tld.slice(1).includes(normalized));
  return matches.sort((a, b) => {
    const aLabel = a.slice(1);
    const bLabel = b.slice(1);
    const rank = (label: string) => {
      if (label === normalized) return 0;
      if (label.startsWith(normalized)) return 1;
      return 2;
    };
    const rankDiff = rank(aLabel) - rank(bLabel);
    if (rankDiff !== 0) return rankDiff;
    return ALL_TLDS.indexOf(a) - ALL_TLDS.indexOf(b);
  });
}

export const advancedModes: {
  value: AdvancedMode;
  label: string;
  fieldLabel: string;
  placeholder: string;
  description: string;
  example: string;
}[] = [
  { value: "ml", label: "Similar meaning", fieldLabel: "Meaning or idea", placeholder: "Describe a meaning", description: "Find words that express the same idea", example: "Example: ringing in the ears → tinnitus" },
  { value: "sl", label: "Similar sound", fieldLabel: "How it sounds", placeholder: "Type how it sounds", description: "Find words with a similar pronunciation", example: "Example: jirraf → giraffe" },
  { value: "spell", label: "Fix spelling", fieldLabel: "Word or misspelling", placeholder: "Enter a word", description: "Find likely spellings for an uncertain word", example: "Example: hipopatamus → hippopotamus" },
  { value: "pattern", label: "Letter pattern", fieldLabel: "Letter pattern", placeholder: "", description: "Find words by their beginning, ending, or length", example: "Example: begins with t, ends with k, 4 letters" },
  { value: "jjb", label: "Describe a noun", fieldLabel: "Noun", placeholder: "Enter a noun", description: "Find adjectives commonly used for a noun", example: "Example: ocean → vast, blue" },
  { value: "jja", label: "Nouns by adjective", fieldLabel: "Adjective", placeholder: "Enter an adjective", description: "Find nouns commonly described by an adjective", example: "Example: yellow → sun, flower" },
  { value: "trg", label: "Associated words", fieldLabel: "Word", placeholder: "Enter a word", description: "Find words that often appear in the same context", example: "Example: cow → milk, farm" },
  { value: "lc", label: "Comes after", fieldLabel: "Previous word", placeholder: "Enter the previous word", description: "Find words that commonly follow another word", example: "Example: drink → water" },
];

export const advancedModeGroups: { label: string; modes: AdvancedMode[] }[] = [
  { label: "Meaning", modes: ["ml", "trg"] },
  { label: "Sound & spelling", modes: ["sl", "spell", "pattern"] },
  { label: "How words are used", modes: ["jjb", "jja", "lc"] },
];

export const wordTypes: { value: PartOfSpeech; label: string }[] = [
  { value: "any", label: "All" },
  { value: "n", label: "Noun" },
  { value: "v", label: "Verb" },
  { value: "adj", label: "Adj" },
  { value: "adv", label: "Adv" },
];

export const relations = [
  { key: "r", code: "rel", label: "Related", missing: "related word" },
] as const;

export const savedWordsKey = "lexicon-saved-words";

export const SLICE_MODE_OPTIONS: { value: SliceMode; label: string }[] = [
  { value: "none", label: "None" },
  { value: "random", label: "Random" },
  { value: "custom", label: "Custom" },
];

export const LENGTH_MODE_OPTIONS: { value: LengthMode; label: string; symbol: string }[] = [
  { value: "less", label: "Less or equal", symbol: "≤" },
  { value: "exact", label: "Equal", symbol: "=" },
  { value: "more", label: "More or equal", symbol: "≥" },
];
