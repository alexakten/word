const vowels = new Set("aeiouy".split(""));

export const MAX_SYLLABLE_PICK = 8;
export const MAX_SYLLABLE_TAKE = 3;

export type RelativeSyllablePick = "start" | "middle" | "end";
export type SyllablePick = "full" | "random" | RelativeSyllablePick | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type SyllableTake = 1 | 2 | 3;

export type SliceMode = "none" | "random" | "custom";
export const DEFAULT_SLICE_MODE: SliceMode = "random";

export type MixSideSettings = {
  syllablePick: SyllablePick;
  syllableTake: SyllableTake;
};

export type SyllableSegment = { text: string; used: boolean };

const RELATIVE_PICKS = new Set<RelativeSyllablePick>(["start", "middle", "end"]);

function isVowelAt(word: string, index: number) {
  const char = word[index];
  if (!vowels.has(char)) return false;
  if (char === "y" && index > 0 && !vowels.has(word[index - 1])) return true;
  if (char === "y" && index === 0) return true;
  return char !== "y";
}

function vowelClusters(word: string) {
  const clusters: { start: number; end: number }[] = [];
  let index = 0;
  while (index < word.length) {
    if (!isVowelAt(word, index)) {
      index += 1;
      continue;
    }
    const start = index;
    while (index < word.length && isVowelAt(word, index)) index += 1;
    clusters.push({ start, end: index });
  }
  return clusters;
}

function splitBetweenVowels(between: string, betweenStart: number) {
  if (between.length <= 1) return betweenStart + between.length;
  if (between.length === 2) return betweenStart + 1;
  return betweenStart + Math.ceil(between.length / 2);
}

export function splitIntoSyllables(word: string): string[] {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!normalized) return [];
  const clusters = vowelClusters(normalized);
  if (clusters.length <= 1) return [normalized];

  const breaks = [0];
  for (let clusterIndex = 0; clusterIndex < clusters.length - 1; clusterIndex += 1) {
    const betweenStart = clusters[clusterIndex].end;
    const betweenEnd = clusters[clusterIndex + 1].start;
    const between = normalized.slice(betweenStart, betweenEnd);
    breaks.push(splitBetweenVowels(between, betweenStart));
  }
  breaks.push(normalized.length);

  const syllables: string[] = [];
  for (let index = 0; index < breaks.length - 1; index += 1) {
    const chunk = normalized.slice(breaks[index], breaks[index + 1]);
    if (chunk) syllables.push(chunk);
  }
  return syllables.length ? syllables : [normalized];
}

function splitPointInPart(part: string) {
  const clusters = vowelClusters(part);
  if (clusters.length >= 2) {
    const betweenStart = clusters[0].end;
    const betweenEnd = clusters[1].start;
    const between = part.slice(betweenStart, betweenEnd);
    const splitAt = splitBetweenVowels(between, betweenStart);
    if (splitAt > 0 && splitAt < part.length) return splitAt;
  }

  return Math.max(1, Math.ceil(part.length / 2));
}

function fitSyllableCount(parts: string[], targetCount: number) {
  if (targetCount < 1) return parts;

  const result = [...parts];

  while (result.length > targetCount) {
    let mergeIndex = 0;
    let smallest = Number.POSITIVE_INFINITY;
    for (let index = 0; index < result.length - 1; index += 1) {
      const combined = result[index].length + result[index + 1].length;
      if (combined < smallest) {
        smallest = combined;
        mergeIndex = index;
      }
    }
    result[mergeIndex] = result[mergeIndex] + result[mergeIndex + 1];
    result.splice(mergeIndex + 1, 1);
  }

  while (result.length < targetCount) {
    let splitIndex = 0;
    let longest = 0;
    for (let index = 0; index < result.length; index += 1) {
      if (result[index].length > longest) {
        longest = result[index].length;
        splitIndex = index;
      }
    }

    const part = result[splitIndex];
    if (part.length < 2) break;

    const splitAt = splitPointInPart(part);
    result.splice(splitIndex, 1, part.slice(0, splitAt), part.slice(splitAt));
  }

  return result;
}

function resolveSyllables(word: string, knownSyllableCount?: number) {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!normalized) return [];
  if (!knownSyllableCount || knownSyllableCount < 1) return splitIntoSyllables(word);
  if (knownSyllableCount === 1) return [normalized];

  const parts = splitIntoSyllables(word);
  const fitted = fitSyllableCount(parts, knownSyllableCount);
  return fitted.join("") === normalized ? fitted : parts;
}

export const SYLLABLE_LONG_VALUE = "+";

export function isSyllableLongFilter(filter: string | number) {
  return String(filter) === SYLLABLE_LONG_VALUE;
}

export function isSyllableFilterAny(filter: string | number) {
  if (isSyllableLongFilter(filter)) return false;
  return !(Number(filter) > 0);
}

export function isSingleSyllableFilter(filter: string | number) {
  return Number(filter) === 1;
}

export function maxSyllablePickFromFilter(filter: string | number): number {
  if (isSyllableLongFilter(filter)) return MAX_SYLLABLE_PICK;
  const count = Number(filter);
  return count > 0 ? Math.min(count, MAX_SYLLABLE_PICK) : MAX_SYLLABLE_PICK;
}

function ordinalLabel(value: number) {
  if (value === 1) return "1st";
  if (value === 2) return "2nd";
  if (value === 3) return "3rd";
  return `${value}th`;
}

function withFullAndRandom(options: { value: string; label: string }[]): { value: string; label: string }[] {
  return [
    { value: "full", label: "Full" },
    ...options,
    { value: "random", label: "Random" },
  ];
}

function syllablePickOptionsForCount(count: number): { value: string; label: string }[] {
  if (count <= 1) return withFullAndRandom([]);
  if (count === 2) {
    return withFullAndRandom([
      { value: "start", label: "Start" },
      { value: "end", label: "End" },
    ]);
  }
  if (count === 3) {
    return withFullAndRandom([
      { value: "start", label: "Start" },
      { value: "middle", label: "Middle" },
      { value: "end", label: "End" },
    ]);
  }

  const options: { value: string; label: string }[] = [{ value: "start", label: "Start" }];
  for (let pick = 2; pick < count; pick += 1) {
    options.push({ value: String(pick), label: ordinalLabel(pick) });
  }
  options.push({ value: "end", label: "End" });
  return withFullAndRandom(options);
}

function allowedPicksForCount(count: number): SyllablePick[] {
  if (count <= 1) return ["full", "random"];
  return syllablePickOptionsForCount(count).map((option) => {
    const pick = Number(option.value);
    return Number.isFinite(pick) ? (pick as SyllablePick) : (option.value as SyllablePick);
  });
}

export type SyllableFilterMode = "less" | "exact" | "more";

const GENERIC_PICK_OPTIONS: { value: string; label: string }[] = [
  { value: "full", label: "Full" },
  { value: "start", label: "Start" },
  { value: "middle", label: "Middle" },
  { value: "end", label: "End" },
  { value: "random", label: "Random" },
];

function isExactSyllableFilter(filter: string | number, mode: SyllableFilterMode = "exact") {
  return mode === "exact" && Number(filter) > 0 && !isSyllableLongFilter(filter);
}

export function sliceOptionSyllableCount(
  actualSyllables?: number,
  filter?: string | number,
  filterMode: SyllableFilterMode = "exact",
) {
  if (actualSyllables !== undefined && actualSyllables > 0) return actualSyllables;
  if (filter !== undefined && isExactSyllableFilter(filter, filterMode)) return Number(filter);
  return undefined;
}


function syllableAnchorIndex(pick: SyllablePick, total: number): number {
  if (pick === "start") return 0;
  if (pick === "middle") return Math.floor((total - 1) / 2);
  if (pick === "end") return Math.max(0, total - 1);
  if (typeof pick === "number") return Math.min(pick - 1, Math.max(0, total - 1));
  return 0;
}

function effectiveSliceTotal(actualSyllables?: number) {
  return actualSyllables && actualSyllables > 0 ? actualSyllables : MAX_SYLLABLE_PICK;
}

export function maxTakeFromPick(
  pick: SyllablePick,
  actualSyllables?: number,
): SyllableTake {
  const total = effectiveSliceTotal(actualSyllables);
  if (pick === "full" || total <= 1) return 1;

  if (pick === "random") {
    return Math.min(MAX_SYLLABLE_TAKE, total) as SyllableTake;
  }

  const anchor = syllableAnchorIndex(pick, total);
  const remaining = Math.max(1, total - anchor);
  return Math.min(MAX_SYLLABLE_TAKE, remaining) as SyllableTake;
}

export function buildSyllablePickOptions(
  filter: string | number,
  actualSyllables?: number,
  filterMode: SyllableFilterMode = "exact",
  customOnly = false,
): { value: string; label: string }[] {
  const count = sliceOptionSyllableCount(actualSyllables, filter, filterMode);
  let options: { value: string; label: string }[];
  if (count !== undefined && count >= 1) {
    options = syllablePickOptionsForCount(count);
  } else if (isSyllableFilterAny(filter) || isSyllableLongFilter(filter) || filterMode !== "exact") {
    options = GENERIC_PICK_OPTIONS;
  } else {
    const filterCount = Number(filter);
    options = filterCount >= 2 ? syllablePickOptionsForCount(filterCount) : GENERIC_PICK_OPTIONS;
  }

  if (!customOnly) return options;
  return options.filter((option) => option.value !== "full" && option.value !== "random");
}

export const syllableTakeOptions: { value: string; label: string }[] = [
  { value: "1", label: "1 syllable" },
  { value: "2", label: "2 syllables" },
  { value: "3", label: "3 syllables" },
];

export function buildSyllableTakeOptions(
  pick: SyllablePick,
  actualSyllables?: number,
): { value: string; label: string }[] {
  if (pick === "full") {
    const total = actualSyllables && actualSyllables > 0 ? actualSyllables : 1;
    return [{ value: "1", label: total === 1 ? "1 syllable" : `${total} syllables` }];
  }

  const maxTake = maxTakeFromPick(pick, actualSyllables);
  const options = syllableTakeOptions.filter((option) => Number(option.value) <= maxTake);
  return options.length > 0 ? options : [{ value: "1", label: "1 syllable" }];
}

function normalizePickForCount(pick: SyllablePick, count: number): SyllablePick {
  const allowed = allowedPicksForCount(count);
  if (allowed.includes(pick)) return pick;

  if (pick === "full" || pick === "random") return pick;
  if (pick === "start" || pick === 1) return allowed.includes("start") ? "start" : allowed[0];
  if (pick === "end") return allowed.includes("end") ? "end" : allowed[allowed.length - 1];
  if (pick === "middle") {
    return allowed.includes("middle") ? "middle" : allowed[Math.floor(allowed.length / 2)];
  }

  if (typeof pick === "number") {
    if (pick === count && allowed.includes("end")) return "end";
    const numericAllowed = allowed.filter((value): value is 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 => typeof value === "number");
    if (numericAllowed.length) {
      return numericAllowed.reduce((best, value) => (
        Math.abs(value - pick) < Math.abs(best - pick) ? value : best
      ), numericAllowed[0]);
    }
  }

  return allowed[0];
}

export function normalizeSyllablePick(
  pick: SyllablePick,
  filter: string | number,
  previousFilter?: string | number,
  actualSyllables?: number,
  filterMode: SyllableFilterMode = "exact",
): SyllablePick {
  const count = sliceOptionSyllableCount(actualSyllables, filter, filterMode);
  if (count === 1) return pick === "random" ? "random" : "full";
  if (count !== undefined && count >= 2) {
    return normalizePickForCount(pick, count);
  }

  if (pick === "full" || pick === "random") return pick;
  if (RELATIVE_PICKS.has(pick as RelativeSyllablePick)) return pick;
  if (pick === 1) return "start";
  const previousMax = previousFilter !== undefined && isExactSyllableFilter(previousFilter)
    ? maxSyllablePickFromFilter(previousFilter)
    : MAX_SYLLABLE_PICK;
  if (typeof pick === "number" && pick >= previousMax) return "end";
  return "middle";
}

function hashWord(normalized: string, salt: number, modulus: number) {
  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash + normalized.charCodeAt(index) * (index + salt)) % modulus;
  }
  return hash;
}

function resolveRandomTake(totalSyllables: number, normalizedWord: string): SyllableTake {
  const maxTake = Math.min(MAX_SYLLABLE_TAKE, totalSyllables);
  if (maxTake <= 1) return 1;
  return (hashWord(normalizedWord, 9, maxTake) + 1) as SyllableTake;
}

function resolveStartIndex(
  totalSyllables: number,
  take: number,
  pick: SyllablePick,
  normalizedWord: string,
) {
  if (pick === "random") {
    const maxStart = Math.max(0, totalSyllables - take);
    return totalSyllables <= take ? 0 : hashWord(normalizedWord, 5, maxStart + 1);
  }

  const anchor = syllableAnchorIndex(pick, totalSyllables);
  return Math.min(anchor, Math.max(0, totalSyllables - take));
}

export function selectSyllableIndices(
  totalSyllables: number,
  settings: MixSideSettings,
  normalizedWord: string,
): number[] {
  if (totalSyllables <= 0) return [];
  if (settings.syllablePick === "full") {
    return Array.from({ length: totalSyllables }, (_, index) => index);
  }

  const take = settings.syllablePick === "random"
    ? resolveRandomTake(totalSyllables, normalizedWord)
    : Math.min(settings.syllableTake, totalSyllables);
  const startIndex = resolveStartIndex(totalSyllables, take, settings.syllablePick, normalizedWord);
  const actualTake = Math.min(take, totalSyllables - startIndex);
  return Array.from({ length: actualTake }, (_, index) => startIndex + index);
}

export function selectSyllables(
  syllables: string[],
  settings: MixSideSettings,
  normalizedWord: string,
): string[] {
  const indices = selectSyllableIndices(syllables.length, settings, normalizedWord);
  return indices.map((index) => syllables[index]).filter(Boolean);
}

export function getSyllableSegments(
  word: string,
  settings: MixSideSettings,
  knownSyllableCount?: number,
): SyllableSegment[] {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, "");
  const syllables = resolveSyllables(word, knownSyllableCount);
  if (!syllables.length) return [{ text: word, used: true }];

  const used = new Set(selectSyllableIndices(syllables.length, settings, normalized));
  const letters = word.replace(/[^a-zA-Z]/g, "");
  let offset = 0;
  return syllables.map((syllable, index) => {
    const text = letters.slice(offset, offset + syllable.length);
    offset += syllable.length;
    return { text, used: used.has(index) };
  });
}

export function extractSyllableChunk(
  word: string,
  settings: MixSideSettings,
  knownSyllableCount?: number,
) {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, "");
  const syllables = resolveSyllables(word, knownSyllableCount);
  return selectSyllables(syllables, settings, normalized).join("");
}

export function mixWordParts(
  leftWord: string,
  rightWord: string,
  left: MixSideSettings,
  right: MixSideSettings,
  leftSyllables?: number,
  rightSyllables?: number,
) {
  const leftChunk = extractSyllableChunk(leftWord, left, leftSyllables);
  const rightChunk = extractSyllableChunk(rightWord, right, rightSyllables);
  return {
    mixed: `${leftChunk}${rightChunk}`.replace(/\s+/g, "").toLowerCase(),
    leftChunk,
    rightChunk,
  };
}

function parseSyllablePick(value: string | null): SyllablePick | undefined {
  if (value === "full" || value === "random") return value;
  if (value === "start" || value === "middle" || value === "end") return value;
  if (value === "beginning") return "start";
  const pick = Number(value);
  if (pick >= 1 && pick <= MAX_SYLLABLE_PICK) return pick as SyllablePick;
  return undefined;
}

function parseSyllableTake(value: string | null): SyllableTake | undefined {
  const take = Number(value);
  if (take >= 1 && take <= MAX_SYLLABLE_TAKE) return take as SyllableTake;
  return undefined;
}

export function migrateLegacyMixSettings(count?: number, pick?: string): Partial<MixSideSettings> {
  const settings: Partial<MixSideSettings> = {};
  if (count !== undefined && count >= 1) {
    settings.syllableTake = Math.min(count, MAX_SYLLABLE_TAKE) as SyllableTake;
  }

  if (!pick) return settings;

  if (pick === "first" || pick === "start") settings.syllablePick = "start";
  else if (pick === "last" || pick === "end") settings.syllablePick = "end";
  else if (pick === "middle") settings.syllablePick = "middle";
  else settings.syllablePick = "start";

  return settings;
}

export function parseMixSideSettingsFromUrl(search: URLSearchParams, prefix: string): Partial<MixSideSettings> {
  const position = search.get(`${prefix}Pos`);
  const amountRaw = search.get(`${prefix}Amt`);
  const settings: Partial<MixSideSettings> = {};

  const pick = parseSyllablePick(position);
  if (pick !== undefined) settings.syllablePick = pick;

  const take = parseSyllableTake(amountRaw);
  if (take !== undefined) settings.syllableTake = take;
  else {
    const legacyAmount = parseSyllablePick(amountRaw);
    if (legacyAmount !== undefined && legacyAmount !== "full" && legacyAmount !== "random") {
      settings.syllablePick = legacyAmount;
    } else if (amountRaw === "full") settings.syllablePick = "full";
    else if (amountRaw === "random") settings.syllablePick = "random";
  }

  if (settings.syllablePick !== undefined || settings.syllableTake !== undefined) {
    return settings;
  }

  return migrateLegacyMixSettings(
    Number(search.get(`${prefix}Count`)),
    search.get(`${prefix}Pick`) ?? undefined,
  );
}

export const defaultMixLeftSettings: MixSideSettings = { syllablePick: "full", syllableTake: 1 };
export const defaultMixRightSettings: MixSideSettings = { syllablePick: "full", syllableTake: 1 };
export const defaultCustomMixLeftSettings: MixSideSettings = { syllablePick: "start", syllableTake: 1 };
export const defaultCustomMixRightSettings: MixSideSettings = { syllablePick: "start", syllableTake: 1 };

export function pickRandomMixSettings(
  word: string,
  knownSyllableCount?: number,
): MixSideSettings {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, "");
  const syllables = resolveSyllables(word, knownSyllableCount);
  const total = syllables.length;
  if (!normalized || total <= 1) return { syllablePick: "full", syllableTake: 1 };

  const picks = allowedPicksForCount(total).filter(
    (pick): pick is Exclude<SyllablePick, "full" | "random"> => pick !== "full" && pick !== "random",
  );
  const candidates = picks.flatMap((syllablePick) => {
    const maxTake = maxTakeFromPick(syllablePick, total);
    return Array.from({ length: maxTake }, (_, index) => ({
      syllablePick,
      syllableTake: (index + 1) as SyllableTake,
    })).filter((settings) => selectSyllableIndices(total, settings, normalized).length < total);
  });

  return candidates[Math.floor(Math.random() * candidates.length)]
    ?? { syllablePick: "start", syllableTake: 1 };
}

function indexToDisplayPick(startIndex: number, total: number): SyllablePick {
  if (total <= 1) return "full";

  const picks = allowedPicksForCount(total).filter(
    (pick): pick is SyllablePick => pick !== "full" && pick !== "random",
  );

  for (const pick of picks) {
    if (syllableAnchorIndex(pick, total) === startIndex) return pick;
  }

  return "start";
}

export function resolveRandomDisplaySettings(
  word: string,
  knownSyllableCount?: number,
): MixSideSettings {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, "");
  const resolvedCount = resolveWordSyllableCount(word, knownSyllableCount);
  const syllables = resolveSyllables(word, resolvedCount);
  const total = syllables.length;
  if (!normalized || total <= 0) return { syllablePick: "start", syllableTake: 1 };

  const indices = selectSyllableIndices(total, { syllablePick: "random", syllableTake: 1 }, normalized);
  const startIndex = indices[0] ?? 0;
  return {
    syllablePick: indexToDisplayPick(startIndex, total),
    syllableTake: Math.max(1, indices.length) as SyllableTake,
  };
}

export function effectiveMixSettings(mode: SliceMode, settings: MixSideSettings): MixSideSettings {
  if (mode === "none") return { syllablePick: "full", syllableTake: 1 };
  if (mode === "random") return { syllablePick: "random", syllableTake: settings.syllableTake };
  return settings;
}

export function inferSliceMode(left: MixSideSettings, right: MixSideSettings): SliceMode {
  if (left.syllablePick === "full" && right.syllablePick === "full") return "none";
  if (left.syllablePick === "random" && right.syllablePick === "random") return "random";
  return "custom";
}

export function inferSideSliceMode(settings: MixSideSettings): SliceMode {
  if (settings.syllablePick === "full") return "none";
  if (settings.syllablePick === "random") return "random";
  return "custom";
}

export function resolveWordSyllableCount(word: string, knownSyllableCount?: number) {
  if (knownSyllableCount !== undefined && knownSyllableCount > 0) return knownSyllableCount;
  if (!word.trim()) return undefined;
  const syllables = splitIntoSyllables(word);
  return syllables.length > 0 ? syllables.length : undefined;
}

export function parseSliceMode(value: string | null): SliceMode | undefined {
  if (value === "none" || value === "random" || value === "custom") return value;
  return undefined;
}

export function normalizeCustomMixSettings(settings: MixSideSettings): MixSideSettings {
  if (settings.syllablePick === "full" || settings.syllablePick === "random") {
    return { syllablePick: "start", syllableTake: settings.syllableTake };
  }
  return settings;
}
