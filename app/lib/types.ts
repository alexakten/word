import type { MixSideSettings } from "../syllables";

export type PartOfSpeech = "any" | "n" | "v" | "adj" | "adv";
export type LengthMode = "less" | "exact" | "more";
export type AppMode = "discover" | "combine" | "find";
export type WordCopyStatus = "idle" | "copied" | "hidden";

export type WordResult = {
  word: string;
  definition: string;
  partOfSpeech: string;
  pronunciation?: string;
  syllables?: number;
  relation?: string;
  splitLeft?: WordResult;
  splitRight?: WordResult;
};

export const emptyWordResult: WordResult = { word: "", definition: "", partOfSpeech: "" };

export type AdvancedMode = "ml" | "sl" | "spell" | "pattern" | "jjb" | "jja" | "trg" | "lc";

export type ForgeSlot = {
  seed: string;
  maxLetters: string;
  letters: string;
  syllables: string;
  candidates: WordResult[];
  index: number;
  pinned: boolean;
  loading: boolean;
  error: string;
};

export type ForgeHistoryEntry = {
  combined: string;
  slots: [
    Pick<ForgeSlot, "seed" | "maxLetters" | "letters" | "syllables" | "pinned"> & { word: WordResult },
    Pick<ForgeSlot, "seed" | "maxLetters" | "letters" | "syllables" | "pinned"> & { word: WordResult },
  ];
};

export type SplitHistoryEntry = {
  left: WordResult;
  right: WordResult;
};

export type SideSettings = {
  text: string;
  related: string;
  pos: PartOfSpeech;
  syllables: string;
  syllableMode: LengthMode;
  startsWith: string;
  endsWith: string;
  letters: string;
  lengthMode: LengthMode;
};

export type ApiHealth = "online" | "offline";

export type DiscoverMobilePanel = "left" | "slice" | "right";

export type WordTypeTabsProps = {
  value: PartOfSpeech;
  label: string;
  className?: string;
  onChange: (value: PartOfSpeech) => void;
};

export type { MixSideSettings };
