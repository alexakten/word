import type { ApiHealth, ForgeSlot, WordResult } from "./types";

export function applyApiHealth(response: Response | null, setApiHealth: (health: ApiHealth) => void) {
  if (!response || response.status === 502) setApiHealth("offline");
  else if (response.ok) setApiHealth("online");
}

export function isFetchFailure(error: unknown) {
  return error instanceof TypeError;
}

export function stripSplitFields(word: WordResult): WordResult {
  const { splitLeft, splitRight, ...clean } = word;
  return clean;
}

export function parseCombinedParts(saved: WordResult): [string, string] | null {
  if (saved.splitLeft?.word && saved.splitRight?.word) {
    return [saved.splitLeft.word, saved.splitRight.word];
  }
  const match = saved.definition.match(/combining [“"]([^”"]+)[”"] and [“"]([^”"]+)[”"]/);
  return match ? [match[1], match[2]] : null;
}

export const emptyForgeSlot = (): ForgeSlot => ({
  seed: "",
  maxLetters: "",
  letters: "",
  syllables: "",
  candidates: [],
  index: 0,
  pinned: false,
  loading: false,
  error: "",
});
