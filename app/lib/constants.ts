import type { AdvancedMode, LengthMode, PartOfSpeech } from "./types";
import type { SliceMode } from "../syllables";

export const POS_VALUES = new Set<PartOfSpeech>(["any", "n", "v", "adj", "adv"]);
export const LENGTH_MODES = new Set<LengthMode>(["less", "exact", "more"]);
export const COUNT_LONG_VALUE = "+";
export const MAX_SYLLABLE_FILTER = 8;
export const MAX_LENGTH_FILTER = 22;

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
