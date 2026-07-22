"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { relations, applyChunkCapitalization, pickRandomWordCapitalization } from "../lib/constants";
import { isBrandLogoId, nextBrandLogo, pickRandomBrandLogo, DEFAULT_BRAND_LOGO_ID, type BrandLogoId } from "../lib/brand-logos";
import {
  DISPLAY_FONT_EVENT,
  BRAND_DISPLAY_FONT_FAMILY,
  DEFAULT_DISPLAY_FONT_FAMILY,
  applyDisplayFontToDocument,
  displayFontPreset,
  pickRandomDisplayFont,
} from "../lib/display-fonts";
import { parseEmbedFontFamily } from "../lib/embed-bridge";
import { normalizeLengthSelection, normalizeSyllableSelection, resolveLengthFilter, resolveSyllableFilter } from "../lib/filters";
import {
  type ApiHealth,
  type LengthMode,
  type NameDisplayMode,
  type PartOfSpeech,
  type SplitHistoryEntry,
  type WordCapitalization,
  type WordCopyStatus,
  type WordResult,
} from "../lib/types";
import { parseMixSideSettings, parseSideSettings, syncDiscoverUrlParams } from "../lib/url-params";
import { sounds } from "../lib/sounds";
import { isAllowedWord } from "../lib/content-filter";
import { pickRandomTag } from "../lib/tags";
import { applyApiHealth, isFetchFailure, stripSplitFields } from "../lib/word-utils";
import { normalizePronunciation } from "../pronunciation";
import {
  type MixSideSettings,
  type SliceMode,
  defaultCustomMixLeftSettings,
  defaultCustomMixRightSettings,
  defaultMixLeftSettings,
  defaultMixRightSettings,
  DEFAULT_SLICE_MODE,
  effectiveMixSettings,
  inferSideSliceMode,
  mixWordParts,
  normalizeCustomMixSettings,
  parseSliceMode,
} from "../syllables";

type UseDiscoverOptions = {
  setApiHealth: (health: ApiHealth) => void;
  savedWords: WordResult[];
  saveWords: (words: WordResult[]) => void;
  setMessage: (message: string) => void;
};

const DEFAULT_SYLLABLES = "2";
const DEFAULT_WORD_SYLLABLE_MODE: LengthMode = "less";
const RESET_LEFT_WORD: WordResult = {
  word: "spell",
  definition: "Words or a formula supposed to have magical powers.",
  partOfSpeech: "noun",
  pronunciation: "spˈɛɫ",
  syllables: 1,
};
const RESET_RIGHT_WORD: WordResult = {
  word: "surf",
  definition: "An instance or session of riding a surfboard in the surf.",
  partOfSpeech: "noun",
  pronunciation: "sˈɝf",
  syllables: 1,
};

export function useDiscover({ setApiHealth, savedWords, saveWords, setMessage }: UseDiscoverOptions) {
  const [wordType, setWordType] = useState<PartOfSpeech>("any");
  const [nameDisplayMode, setNameDisplayModeState] = useState<NameDisplayMode>("word");
  const [selectedTld, setSelectedTld] = useState(".com");
  const [logoEnabled, setLogoEnabled] = useState(false);
  const [brandLogoId, setBrandLogoId] = useState<BrandLogoId>(DEFAULT_BRAND_LOGO_ID);
  const [wordCapitalization, setWordCapitalization] = useState<WordCapitalization>("lower");
  const [brandStyleRandomizeOnGenerate, setBrandStyleRandomizeOnGenerate] = useState(false);
  const [leftSliceMode, setLeftSliceMode] = useState<SliceMode>(DEFAULT_SLICE_MODE);
  const [rightSliceMode, setRightSliceMode] = useState<SliceMode>(DEFAULT_SLICE_MODE);
  const [mixLeftSettings, setMixLeftSettings] = useState<MixSideSettings>(defaultCustomMixLeftSettings);
  const [mixRightSettings, setMixRightSettings] = useState<MixSideSettings>(defaultCustomMixRightSettings);
  const [wordCopyStatus, setWordCopyStatus] = useState<WordCopyStatus>("idle");
  const [wordSyllables, setWordSyllables] = useState(DEFAULT_SYLLABLES);
  const [wordSyllableMode, setWordSyllableMode] = useState<LengthMode>(DEFAULT_WORD_SYLLABLE_MODE);
  const [wordStartsWith, setWordStartsWith] = useState("");
  const [wordEndsWith, setWordEndsWith] = useState("");
  const [wordLetters, setWordLetters] = useState("");
  const [wordLengthMode, setWordLengthMode] = useState<LengthMode>("exact");
  const [wordRelatedTo, setWordRelatedTo] = useState("");
  const [secondaryWordType, setSecondaryWordType] = useState<PartOfSpeech>("any");
  const [secondaryWordSyllables, setSecondaryWordSyllables] = useState(DEFAULT_SYLLABLES);
  const [secondaryWordSyllableMode, setSecondaryWordSyllableMode] = useState<LengthMode>(DEFAULT_WORD_SYLLABLE_MODE);
  const [secondaryWordStartsWith, setSecondaryWordStartsWith] = useState("");
  const [secondaryWordEndsWith, setSecondaryWordEndsWith] = useState("");
  const [secondaryWordLetters, setSecondaryWordLetters] = useState("");
  const [secondaryWordLengthMode, setSecondaryWordLengthMode] = useState<LengthMode>("exact");
  const [secondaryWordRelatedTo, setSecondaryWordRelatedTo] = useState("");
  const [result, setResult] = useState<WordResult>(RESET_LEFT_WORD);
  const [secondaryResult, setSecondaryResult] = useState<WordResult>(RESET_RIGHT_WORD);
  const [leftWordDraft, setLeftWordDraft] = useState("");
  const [rightWordDraft, setRightWordDraft] = useState("");
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [splitBatchLoading, setSplitBatchLoading] = useState(false);
  const [splitHistoryRevision, setSplitHistoryRevision] = useState(0);
  const requestRef = useRef<AbortController | null>(null);
  const secondaryRequestRef = useRef<AbortController | null>(null);
  const splitBatchRequestRef = useRef(0);
  const wordCopyTimerRef = useRef(0);
  const wordHistoryRef = useRef<WordResult[]>([RESET_LEFT_WORD]);
  const historyIndexRef = useRef(0);
  const splitHistoryRef = useRef<SplitHistoryEntry[]>([]);
  const splitHistoryIndexRef = useRef(-1);
  const splitHistoryBatchDepthRef = useRef(0);
  const settingsUrlSyncedRef = useRef(false);

  const setNameDisplayMode = useCallback((mode: NameDisplayMode) => {
    setNameDisplayModeState(mode);
    if (mode === "brand") {
      setLogoEnabled(true);
      window.dispatchEvent(new CustomEvent(DISPLAY_FONT_EVENT, { detail: { fontFamily: BRAND_DISPLAY_FONT_FAMILY } }));
    } else {
      window.dispatchEvent(new CustomEvent(DISPLAY_FONT_EVENT, { detail: { fontFamily: DEFAULT_DISPLAY_FONT_FAMILY } }));
    }
    setWordSyllables(DEFAULT_SYLLABLES);
    setWordSyllableMode(DEFAULT_WORD_SYLLABLE_MODE);
    setSecondaryWordSyllables(DEFAULT_SYLLABLES);
    setSecondaryWordSyllableMode(DEFAULT_WORD_SYLLABLE_MODE);
  }, []);

  const randomizeBrandLogo = useCallback(() => {
    setBrandLogoId((current) => nextBrandLogo(current));
    setLogoEnabled(true);
  }, []);

  const randomizeBrandStyle = useCallback(() => {
    const logoId = pickRandomBrandLogo(brandLogoId);
    const capitalization = pickRandomWordCapitalization(wordCapitalization);
    const currentFont = parseEmbedFontFamily(document.documentElement.getAttribute("data-display-font"));
    const fontFamily = pickRandomDisplayFont(currentFont);

    setBrandLogoId(logoId);
    setLogoEnabled(true);
    setWordCapitalization(capitalization);
    applyDisplayFontToDocument(displayFontPreset(fontFamily));
    window.dispatchEvent(new CustomEvent(DISPLAY_FONT_EVENT, { detail: { fontFamily } }));
  }, [brandLogoId, wordCapitalization]);

  const setBrandLogo = useCallback((id: BrandLogoId) => {
    if (!isBrandLogoId(id)) return;
    setBrandLogoId(id);
  }, []);

  const resetPrimaryFilters = useCallback(() => {
    setWordRelatedTo("");
    setWordType("any");
    setWordSyllables(DEFAULT_SYLLABLES);
    setWordSyllableMode(DEFAULT_WORD_SYLLABLE_MODE);
    setWordStartsWith("");
    setWordEndsWith("");
    setWordLetters("");
    setWordLengthMode("exact");
  }, []);

  const resetSecondaryFilters = useCallback(() => {
    setSecondaryWordRelatedTo("");
    setSecondaryWordType("any");
    setSecondaryWordSyllables(DEFAULT_SYLLABLES);
    setSecondaryWordSyllableMode(DEFAULT_WORD_SYLLABLE_MODE);
    setSecondaryWordStartsWith("");
    setSecondaryWordEndsWith("");
    setSecondaryWordLetters("");
    setSecondaryWordLengthMode("exact");
  }, []);

  const resetLeftSliceSettings = useCallback(() => {
    setLeftSliceMode(DEFAULT_SLICE_MODE);
    setMixLeftSettings({ ...defaultCustomMixLeftSettings });
  }, []);

  const resetRightSliceSettings = useCallback(() => {
    setRightSliceMode(DEFAULT_SLICE_MODE);
    setMixRightSettings({ ...defaultCustomMixRightSettings });
  }, []);

  const resetSliceSettings = useCallback(() => {
    resetLeftSliceSettings();
    resetRightSliceSettings();
  }, [resetLeftSliceSettings, resetRightSliceSettings]);

  const handleLeftSliceModeChange = useCallback((mode: SliceMode) => {
    setLeftSliceMode(mode);
    if (mode === "custom") {
      setMixLeftSettings((current) => normalizeCustomMixSettings(current));
    }
  }, []);

  const handleRightSliceModeChange = useCallback((mode: SliceMode) => {
    setRightSliceMode(mode);
    if (mode === "custom") {
      setMixRightSettings((current) => normalizeCustomMixSettings(current));
    }
  }, []);

  const resetPrimarySettings = useCallback(() => {
    wordHistoryRef.current = [RESET_LEFT_WORD];
    historyIndexRef.current = 0;
    setLeftWordDraft("");
    resetPrimaryFilters();
    setResult(RESET_LEFT_WORD);
  }, [resetPrimaryFilters]);

  const resetSecondarySettings = useCallback(() => {
    setRightWordDraft("");
    resetSecondaryFilters();
    setSecondaryResult(RESET_RIGHT_WORD);
  }, [resetSecondaryFilters]);

  const resetAllDiscoverSettings = useCallback(() => {
    requestRef.current?.abort();
    requestRef.current = null;
    secondaryRequestRef.current?.abort();
    secondaryRequestRef.current = null;
    splitBatchRequestRef.current += 1;
    setLoading(false);
    setSecondaryLoading(false);
    setSplitBatchLoading(false);
    resetPrimaryFilters();
    resetSecondaryFilters();
    resetSliceSettings();
    wordHistoryRef.current = [RESET_LEFT_WORD];
    historyIndexRef.current = 0;
    splitHistoryRef.current = [];
    splitHistoryIndexRef.current = -1;
    setLeftWordDraft("");
    setRightWordDraft("");
    setResult(RESET_LEFT_WORD);
    setSecondaryResult(RESET_RIGHT_WORD);
    setMessage("");
  }, [resetPrimaryFilters, resetSecondaryFilters, resetSliceSettings, setMessage]);

  const commitWord = useCallback((word: WordResult) => {
    const currentBranch = wordHistoryRef.current.slice(0, historyIndexRef.current + 1);
    const updatedHistory = [...currentBranch, word].slice(-100);
    wordHistoryRef.current = updatedHistory;
    historyIndexRef.current = updatedHistory.length - 1;
    setResult(word);
  }, []);

  const displayedPronunciation = normalizePronunciation(result.pronunciation);
  const secondaryPronunciation = normalizePronunciation(secondaryResult.pronunciation);
  const leftWordValue = result.word;
  const rightWordValue = secondaryResult.word;
  const effectiveMixLeftSettings = useMemo(
    () => effectiveMixSettings(leftSliceMode, mixLeftSettings),
    [leftSliceMode, mixLeftSettings],
  );
  const effectiveMixRightSettings = useMemo(
    () => effectiveMixSettings(rightSliceMode, mixRightSettings),
    [mixRightSettings, rightSliceMode],
  );
  const mixedWordParts = useMemo(
    () => mixWordParts(
      leftWordValue,
      rightWordValue,
      effectiveMixLeftSettings,
      effectiveMixRightSettings,
      result.syllables,
      secondaryResult.syllables,
    ),
    [effectiveMixLeftSettings, effectiveMixRightSettings, leftWordValue, rightWordValue, result.syllables, secondaryResult.syllables],
  );
  const displayedCombinedWord = mixedWordParts.mixed;
  const brandLeftChunk = nameDisplayMode === "brand"
    ? applyChunkCapitalization(mixedWordParts.leftChunk, wordCapitalization)
    : mixedWordParts.leftChunk;
  const brandRightChunk = nameDisplayMode === "brand"
    ? applyChunkCapitalization(
      mixedWordParts.rightChunk,
      wordCapitalization === "title" ? "lower" : wordCapitalization,
    )
    : mixedWordParts.rightChunk;
  const brandCombinedWord = nameDisplayMode === "brand"
    ? `${brandLeftChunk}${brandRightChunk}`
    : displayedCombinedWord;
  const displayedHandleBase = displayedCombinedWord
    ? displayedCombinedWord.replace(/\s+/g, "").toLowerCase()
    : "";
  const displayedDomain = displayedHandleBase
    ? `${displayedHandleBase}${selectedTld}`
    : "";
  const displayedHandle = displayedHandleBase ? `@${displayedHandleBase}` : "";
  const displayedName = nameDisplayMode === "domain"
    ? displayedDomain
    : nameDisplayMode === "handle"
      ? displayedHandle
      : nameDisplayMode === "brand"
        ? brandCombinedWord
        : displayedCombinedWord;
  const combinedSplitIsSaved = Boolean(displayedCombinedWord)
    && savedWords.some((item) => item.word.toLowerCase() === displayedCombinedWord);

  const toggleCombinedSaved = useCallback(() => {
    if (!displayedCombinedWord) return;
    if (combinedSplitIsSaved) {
      saveWords(savedWords.filter((item) => item.word.toLowerCase() !== displayedCombinedWord));
      return;
    }
    const definition = `A coined word mixing “${mixedWordParts.leftChunk}” from “${leftWordValue}” with “${mixedWordParts.rightChunk}” from “${rightWordValue}”.`;
    saveWords([{
      word: displayedCombinedWord,
      definition,
      partOfSpeech: "combined word",
      splitLeft: stripSplitFields(result),
      splitRight: stripSplitFields(secondaryResult),
    }, ...savedWords]);
    sounds.successMinimal();
  }, [combinedSplitIsSaved, displayedCombinedWord, leftWordValue, mixedWordParts.leftChunk, mixedWordParts.rightChunk, result, rightWordValue, saveWords, savedWords, secondaryResult]);

  const copyDisplayedWord = useCallback(async (word: string) => {
    if (!word) return;
    try {
      await navigator.clipboard.writeText(word.replace(/\s+/g, "").toLowerCase());
      sounds.successMinimal();
      window.clearTimeout(wordCopyTimerRef.current);
      setWordCopyStatus("copied");
      wordCopyTimerRef.current = window.setTimeout(() => setWordCopyStatus("hidden"), 2000);
    } catch {
      // Clipboard access can be denied outside a secure browser context.
    }
  }, []);

  useEffect(() => () => window.clearTimeout(wordCopyTimerRef.current), []);
  const findWord = useCallback(
    async (
      relation?: (typeof relations)[number],
      requestedType: PartOfSpeech = wordType,
      options?: { apply?: boolean },
    ): Promise<WordResult | undefined> => {
      const apply = options?.apply !== false;
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      setLoading(true);
      setMessage("");

      const params = new URLSearchParams({ pos: requestedType });
      if (relation) {
        params.set("relation", relation.code);
        params.set("word", result.word);
      } else {
        if (wordSyllables) {
          const syllableFilter = resolveSyllableFilter(wordSyllables, wordSyllableMode);
          if (syllableFilter) {
            params.set("syllables", syllableFilter.syllables);
            params.set("syllablesMode", syllableFilter.mode);
          }
        }
        if (wordStartsWith) params.set("startsWith", wordStartsWith);
        if (wordEndsWith) params.set("endsWith", wordEndsWith);
        if (wordLetters) {
          const lengthFilter = resolveLengthFilter(wordLetters, wordLengthMode);
          if (lengthFilter) {
            params.set("length", lengthFilter.length);
            params.set("lengthMode", lengthFilter.mode);
          }
        }
      }

      try {
        let next: WordResult;
        const fixedWord = relation ? undefined : pickRandomTag(leftWordDraft, result.word);
        if (fixedWord) {
          const response = await fetch(`/api/word?lookup=${encodeURIComponent(fixedWord)}`, { signal: controller.signal });
          applyApiHealth(response, setApiHealth);
          next = response.ok
            ? await response.json() as WordResult
            : { word: fixedWord, definition: "A custom word.", partOfSpeech: "word" };
        } else if (!relation && wordRelatedTo.trim()) {
          const response = await fetch(`/api/forge?idea=${encodeURIComponent(wordRelatedTo.trim())}`, { signal: controller.signal });
          applyApiHealth(response, setApiHealth);
          if (!response.ok) throw new Error("No word found");
          const partName = requestedType === "any"
            ? undefined
            : { n: "noun", v: "verb", adj: "adjective", adv: "adverb" }[requestedType];
          const candidates = (await response.json() as WordResult[]).filter((word) => {
            if (partName && word.partOfSpeech !== partName) return false;
            if (wordSyllables && !word.syllables) return false;
            const syllableFilter = resolveSyllableFilter(wordSyllables, wordSyllableMode);
            if (syllableFilter) {
              const syllableCount = word.syllables!;
              const targetSyllables = Number(syllableFilter.syllables);
              if (syllableFilter.mode === "exact" && syllableCount !== targetSyllables) return false;
              if (syllableFilter.mode === "less" && syllableCount > targetSyllables) return false;
              if (syllableFilter.mode === "more" && syllableCount < targetSyllables) return false;
            }
            if (wordStartsWith && !word.word.toLowerCase().startsWith(wordStartsWith.toLowerCase())) return false;
            if (wordEndsWith && !word.word.toLowerCase().endsWith(wordEndsWith.toLowerCase())) return false;
            const lengthFilter = resolveLengthFilter(wordLetters, wordLengthMode);
            if (lengthFilter) {
              const wordLength = word.word.length;
              const targetLength = Number(lengthFilter.length);
              if (lengthFilter.mode === "exact" && wordLength !== targetLength) return false;
              if (lengthFilter.mode === "less" && wordLength > targetLength) return false;
              if (lengthFilter.mode === "more" && wordLength < targetLength) return false;
            }
            return true;
          });
          if (!candidates.length) throw new Error("No word found");
          const alternatives = candidates.filter((word) => word.word !== result.word);
          const pool = alternatives.length ? alternatives : candidates;
          next = pool[Math.floor(Math.random() * pool.length)];
        } else {
          const response = await fetch(`/api/word?${params}`, { signal: controller.signal });
          applyApiHealth(response, setApiHealth);
          if (!response.ok) throw new Error("No word found");
          next = (await response.json()) as WordResult;
        }
        if (controller.signal.aborted || requestRef.current !== controller) return;
        if (apply) {
          commitWord(next);
          setMessage(relation ? `${relation.label} to “${result.word}”` : "");
        }
        return next;
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          if (isFetchFailure(error)) applyApiHealth(null, setApiHealth);
          setMessage(relation ? `No ${relation.missing} found` : "The dictionary is quiet — try again");
        }
      } finally {
        if (requestRef.current === controller) setLoading(false);
      }
    },
    [commitWord, leftWordDraft, result.word, setApiHealth, setMessage, wordEndsWith, wordLengthMode, wordLetters, wordRelatedTo, wordStartsWith, wordSyllableMode, wordSyllables, wordType],
  );

  const findSecondaryWord = useCallback(async (
    requestedType: PartOfSpeech = secondaryWordType,
    options?: { apply?: boolean },
  ): Promise<WordResult | undefined> => {
    const apply = options?.apply !== false;
    secondaryRequestRef.current?.abort();
    const controller = new AbortController();
    secondaryRequestRef.current = controller;
    setSecondaryLoading(true);
    const params = new URLSearchParams({ pos: requestedType });
    if (secondaryWordSyllables) {
      const syllableFilter = resolveSyllableFilter(secondaryWordSyllables, secondaryWordSyllableMode);
      if (syllableFilter) {
        params.set("syllables", syllableFilter.syllables);
        params.set("syllablesMode", syllableFilter.mode);
      }
    }
    if (secondaryWordStartsWith) params.set("startsWith", secondaryWordStartsWith);
    if (secondaryWordEndsWith) params.set("endsWith", secondaryWordEndsWith);
    if (secondaryWordLetters) {
      const lengthFilter = resolveLengthFilter(secondaryWordLetters, secondaryWordLengthMode);
      if (lengthFilter) {
        params.set("length", lengthFilter.length);
        params.set("lengthMode", lengthFilter.mode);
      }
    }

    try {
      let next: WordResult;
      const fixedWord = pickRandomTag(rightWordDraft, secondaryResult.word);
      if (fixedWord) {
        const response = await fetch(`/api/word?lookup=${encodeURIComponent(fixedWord)}`, { signal: controller.signal });
        applyApiHealth(response, setApiHealth);
        next = response.ok
          ? await response.json() as WordResult
          : { word: fixedWord, definition: "A custom word.", partOfSpeech: "word" };
      } else if (secondaryWordRelatedTo.trim()) {
        const response = await fetch(`/api/forge?idea=${encodeURIComponent(secondaryWordRelatedTo.trim())}`, { signal: controller.signal });
        applyApiHealth(response, setApiHealth);
        if (!response.ok) throw new Error("No word found");
        const partName = requestedType === "any"
          ? undefined
          : { n: "noun", v: "verb", adj: "adjective", adv: "adverb" }[requestedType];
        const candidates = (await response.json() as WordResult[]).filter((word) => {
          if (partName && word.partOfSpeech !== partName) return false;
          if (secondaryWordSyllables && !word.syllables) return false;
          const syllableFilter = resolveSyllableFilter(secondaryWordSyllables, secondaryWordSyllableMode);
          if (syllableFilter) {
            const syllableCount = word.syllables!;
            const targetSyllables = Number(syllableFilter.syllables);
            if (syllableFilter.mode === "exact" && syllableCount !== targetSyllables) return false;
            if (syllableFilter.mode === "less" && syllableCount > targetSyllables) return false;
            if (syllableFilter.mode === "more" && syllableCount < targetSyllables) return false;
          }
          if (secondaryWordStartsWith && !word.word.toLowerCase().startsWith(secondaryWordStartsWith.toLowerCase())) return false;
          if (secondaryWordEndsWith && !word.word.toLowerCase().endsWith(secondaryWordEndsWith.toLowerCase())) return false;
          const lengthFilter = resolveLengthFilter(secondaryWordLetters, secondaryWordLengthMode);
          if (lengthFilter) {
            const wordLength = word.word.length;
            const targetLength = Number(lengthFilter.length);
            if (lengthFilter.mode === "exact" && wordLength !== targetLength) return false;
            if (lengthFilter.mode === "less" && wordLength > targetLength) return false;
            if (lengthFilter.mode === "more" && wordLength < targetLength) return false;
          }
          return true;
        });
        if (!candidates.length) throw new Error("No word found");
        const alternatives = candidates.filter((word) => word.word !== secondaryResult.word);
        const pool = alternatives.length ? alternatives : candidates;
        next = pool[Math.floor(Math.random() * pool.length)];
      } else {
        const response = await fetch(`/api/word?${params}`, { signal: controller.signal });
        applyApiHealth(response, setApiHealth);
        if (!response.ok) throw new Error("No word found");
        next = await response.json() as WordResult;
      }
      if (controller.signal.aborted || secondaryRequestRef.current !== controller) return;
      if (apply) setSecondaryResult(next);
      return next;
    } catch (error) {
      if ((error as Error).name !== "AbortError" && secondaryRequestRef.current === controller) {
        if (isFetchFailure(error)) applyApiHealth(null, setApiHealth);
        const fallback = { word: "", definition: "No word matches these settings.", partOfSpeech: "word" };
        if (apply) setSecondaryResult(fallback);
        return fallback;
      }
    } finally {
      if (secondaryRequestRef.current === controller) setSecondaryLoading(false);
    }
  }, [rightWordDraft, secondaryResult.word, secondaryWordEndsWith, secondaryWordLengthMode, secondaryWordLetters, secondaryWordRelatedTo, secondaryWordStartsWith, secondaryWordSyllableMode, secondaryWordSyllables, secondaryWordType, setApiHealth]);

  const handleLeftWordDraftChange = useCallback((value: string) => {
    setLeftWordDraft(value);
    if (value.trim()) resetPrimaryFilters();
  }, [resetPrimaryFilters]);

  const handleRightWordDraftChange = useCallback((value: string) => {
    setRightWordDraft(value);
    if (value.trim()) resetSecondaryFilters();
  }, [resetSecondaryFilters]);

  const generateVisibleWords = useCallback((requestedType: PartOfSpeech = wordType) => {
    const batchRequest = splitBatchRequestRef.current + 1;
    splitBatchRequestRef.current = batchRequest;
    setSplitBatchLoading(true);
    splitHistoryBatchDepthRef.current += 1;

    void (async () => {
      try {
        const maxAttempts = 6;
        let left: WordResult | undefined;
        let right: WordResult | undefined;
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          [left, right] = await Promise.all([
            findWord(undefined, requestedType, { apply: false }),
            findSecondaryWord(secondaryWordType, { apply: false }),
          ]);
          if (splitBatchRequestRef.current !== batchRequest) return;
          if (!left || !right) break;
          const mixed = mixWordParts(
            left.word,
            right.word,
            effectiveMixSettings(leftSliceMode, mixLeftSettings),
            effectiveMixSettings(rightSliceMode, mixRightSettings),
            left.syllables,
            right.syllables,
          ).mixed;
          if (isAllowedWord(mixed)) break;
          left = undefined;
          right = undefined;
        }
        if (splitBatchRequestRef.current !== batchRequest) return;
        const commitBatch = () => {
          if (left) {
            commitWord(left);
            setMessage("");
          }
          if (right) setSecondaryResult(right);
        };
        if ((left || right) && nameDisplayMode === "brand" && brandStyleRandomizeOnGenerate) {
          flushSync(() => {
            randomizeBrandStyle();
            commitBatch();
          });
        } else {
          commitBatch();
        }
      } finally {
        if (splitBatchRequestRef.current === batchRequest) setSplitBatchLoading(false);
        splitHistoryBatchDepthRef.current = Math.max(0, splitHistoryBatchDepthRef.current - 1);
        if (splitHistoryBatchDepthRef.current === 0) {
          setSplitHistoryRevision((revision) => revision + 1);
        }
      }
    })();
  }, [
    brandStyleRandomizeOnGenerate,
    commitWord,
    findSecondaryWord,
    findWord,
    leftSliceMode,
    mixLeftSettings,
    mixRightSettings,
    nameDisplayMode,
    randomizeBrandStyle,
    rightSliceMode,
    secondaryWordType,
    setMessage,
    wordType,
  ]);

  const moveThroughSplitHistory = useCallback((direction: -1 | 1) => {
    const nextIndex = splitHistoryIndexRef.current + direction;
    const entry = splitHistoryRef.current[nextIndex];
    if (!entry) return;
    splitHistoryIndexRef.current = nextIndex;
    setLeftWordDraft("");
    setRightWordDraft("");
    setResult(entry.left);
    setSecondaryResult(entry.right);
    setMessage("");
  }, [setMessage]);
  /* eslint-disable react-hooks/set-state-in-effect -- URL parameters are an external source that must hydrate before paint. */
  useLayoutEffect(() => {
    const search = new URLSearchParams(window.location.search);

    const mixLeftEffective = parseMixSideSettings(search, "ml");
    const mixRightEffective = parseMixSideSettings(search, "mr");
    const mixLeftCustom = parseMixSideSettings(search, "mlCustom");
    const mixRightCustom = parseMixSideSettings(search, "mrCustom");
    const legacySliceMode = parseSliceMode(search.get("slice"));
    const inferredLeftSliceMode = inferSideSliceMode({ ...defaultMixLeftSettings, ...mixLeftEffective });
    const inferredRightSliceMode = inferSideSliceMode({ ...defaultMixRightSettings, ...mixRightEffective });
    const nextLeftSliceMode = parseSliceMode(search.get("mlSlice"))
      ?? legacySliceMode
      ?? (inferredLeftSliceMode === "none" ? DEFAULT_SLICE_MODE : inferredLeftSliceMode);
    const nextRightSliceMode = parseSliceMode(search.get("mrSlice"))
      ?? legacySliceMode
      ?? (inferredRightSliceMode === "none" ? DEFAULT_SLICE_MODE : inferredRightSliceMode);

    const nextLeftSettings = nextLeftSliceMode === "custom"
      ? normalizeCustomMixSettings({
        ...defaultCustomMixLeftSettings,
        ...mixLeftEffective,
        ...mixLeftCustom,
      })
      : {
        ...defaultCustomMixLeftSettings,
        syllableTake: mixLeftCustom.syllableTake
          ?? mixLeftEffective.syllableTake
          ?? defaultCustomMixLeftSettings.syllableTake,
      };
    const nextRightSettings = nextRightSliceMode === "custom"
      ? normalizeCustomMixSettings({
        ...defaultCustomMixRightSettings,
        ...mixRightEffective,
        ...mixRightCustom,
      })
      : {
        ...defaultCustomMixRightSettings,
        syllableTake: mixRightCustom.syllableTake
          ?? mixRightEffective.syllableTake
          ?? defaultCustomMixRightSettings.syllableTake,
      };

    setMixLeftSettings(nextLeftSettings);
    setMixRightSettings(nextRightSettings);
    setLeftSliceMode(nextLeftSliceMode);
    setRightSliceMode(nextRightSliceMode);

    const left = parseSideSettings(search, "l");
    if (left.text !== undefined) setLeftWordDraft(left.text);
    if (left.related !== undefined) setWordRelatedTo(left.related);
    if (left.pos !== undefined) setWordType(left.pos);
    if (left.syllables !== undefined) setWordSyllables(left.syllables);
    if (left.syllableMode !== undefined) setWordSyllableMode(left.syllableMode);
    if (left.startsWith !== undefined) setWordStartsWith(left.startsWith);
    if (left.endsWith !== undefined) setWordEndsWith(left.endsWith);
    if (left.letters !== undefined) setWordLetters(left.letters);
    if (left.lengthMode !== undefined) setWordLengthMode(left.lengthMode);

    const right = parseSideSettings(search, "r");
    if (right.text !== undefined) setRightWordDraft(right.text);
    if (right.related !== undefined) setSecondaryWordRelatedTo(right.related);
    if (right.pos !== undefined) setSecondaryWordType(right.pos);
    if (right.syllables !== undefined) setSecondaryWordSyllables(right.syllables);
    if (right.syllableMode !== undefined) setSecondaryWordSyllableMode(right.syllableMode);
    if (right.startsWith !== undefined) setSecondaryWordStartsWith(right.startsWith);
    if (right.endsWith !== undefined) setSecondaryWordEndsWith(right.endsWith);
    if (right.letters !== undefined) setSecondaryWordLetters(right.letters);
    if (right.lengthMode !== undefined) setSecondaryWordLengthMode(right.lengthMode);

    settingsUrlSyncedRef.current = true;
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!settingsUrlSyncedRef.current) return;
    syncDiscoverUrlParams({
      text: leftWordDraft,
      related: wordRelatedTo,
      pos: wordType,
      syllables: normalizeSyllableSelection(wordSyllables),
      syllableMode: wordSyllableMode,
      startsWith: wordStartsWith,
      endsWith: wordEndsWith,
      letters: normalizeLengthSelection(wordLetters),
      lengthMode: wordLengthMode,
    }, {
      text: rightWordDraft,
      related: secondaryWordRelatedTo,
      pos: secondaryWordType,
      syllables: normalizeSyllableSelection(secondaryWordSyllables),
      syllableMode: secondaryWordSyllableMode,
      startsWith: secondaryWordStartsWith,
      endsWith: secondaryWordEndsWith,
      letters: normalizeLengthSelection(secondaryWordLetters),
      lengthMode: secondaryWordLengthMode,
    }, mixLeftSettings, mixRightSettings, leftSliceMode, rightSliceMode);
  }, [
    leftWordDraft,
    wordRelatedTo,
    wordType,
    wordSyllables,
    wordSyllableMode,
    wordStartsWith,
    wordEndsWith,
    wordLetters,
    wordLengthMode,
    rightWordDraft,
    secondaryWordRelatedTo,
    secondaryWordType,
    secondaryWordSyllables,
    secondaryWordSyllableMode,
    secondaryWordStartsWith,
    secondaryWordEndsWith,
    secondaryWordLetters,
    secondaryWordLengthMode,
    mixLeftSettings,
    mixRightSettings,
    leftSliceMode,
    rightSliceMode,
  ]);

  useEffect(() => {
    if (splitHistoryBatchDepthRef.current > 0 || !result.word || !secondaryResult.word) return;
    const current = splitHistoryRef.current[splitHistoryIndexRef.current];
    const entry = { left: result, right: secondaryResult };
    if (current?.left.word === result.word && current?.right.word === secondaryResult.word) {
      splitHistoryRef.current[splitHistoryIndexRef.current] = entry;
      return;
    }
    const branch = splitHistoryRef.current.slice(0, splitHistoryIndexRef.current + 1);
    splitHistoryRef.current = [...branch, entry].slice(-100);
    splitHistoryIndexRef.current = splitHistoryRef.current.length - 1;
  }, [result, secondaryResult, splitHistoryRevision]);

  const leftSyllablesApplied = wordSyllables !== DEFAULT_SYLLABLES
    || wordSyllableMode !== DEFAULT_WORD_SYLLABLE_MODE;
  const rightSyllablesApplied = secondaryWordSyllables !== DEFAULT_SYLLABLES
    || secondaryWordSyllableMode !== DEFAULT_WORD_SYLLABLE_MODE;
  const leftSettingsCount = [
    Boolean(leftWordDraft.trim()),
    Boolean(wordRelatedTo.trim()),
    wordType !== "any",
    leftSyllablesApplied,
    Boolean(wordStartsWith),
    Boolean(wordEndsWith),
    Boolean(wordLetters),
  ].filter(Boolean).length;
  const rightSettingsCount = [
    Boolean(rightWordDraft.trim()),
    Boolean(secondaryWordRelatedTo.trim()),
    secondaryWordType !== "any",
    rightSyllablesApplied,
    Boolean(secondaryWordStartsWith),
    Boolean(secondaryWordEndsWith),
    Boolean(secondaryWordLetters),
  ].filter(Boolean).length;
  const mixLeftApplied = leftSliceMode !== DEFAULT_SLICE_MODE
    || mixLeftSettings.syllablePick !== defaultCustomMixLeftSettings.syllablePick
    || mixLeftSettings.syllableTake !== defaultCustomMixLeftSettings.syllableTake;
  const mixRightApplied = rightSliceMode !== DEFAULT_SLICE_MODE
    || mixRightSettings.syllablePick !== defaultCustomMixRightSettings.syllablePick
    || mixRightSettings.syllableTake !== defaultCustomMixRightSettings.syllableTake;
  const sliceSettingsCount = [
    leftSliceMode !== DEFAULT_SLICE_MODE,
    mixLeftSettings.syllablePick !== defaultCustomMixLeftSettings.syllablePick,
    mixLeftSettings.syllableTake !== defaultCustomMixLeftSettings.syllableTake,
    rightSliceMode !== DEFAULT_SLICE_MODE,
    mixRightSettings.syllablePick !== defaultCustomMixRightSettings.syllablePick,
    mixRightSettings.syllableTake !== defaultCustomMixRightSettings.syllableTake,
  ].filter(Boolean).length;
  const sliceSettingsApplied = sliceSettingsCount > 0;
  const leftSettingsApplied = leftSettingsCount > 0;
  const rightSettingsApplied = rightSettingsCount > 0;

  return {
    wordType,
    setWordType,
    nameDisplayMode,
    setNameDisplayMode,
    selectedTld,
    setSelectedTld,
    logoEnabled,
    setLogoEnabled,
    brandLogoId,
    setBrandLogo,
    randomizeBrandLogo,
    randomizeBrandStyle,
    brandStyleRandomizeOnGenerate,
    setBrandStyleRandomizeOnGenerate,
    wordCapitalization,
    setWordCapitalization,
    leftSliceMode,
    rightSliceMode,
    mixLeftSettings,
    setMixLeftSettings,
    mixRightSettings,
    setMixRightSettings,
    wordCopyStatus,
    setWordCopyStatus,
    wordSyllables,
    setWordSyllables,
    wordSyllableMode,
    setWordSyllableMode,
    wordStartsWith,
    setWordStartsWith,
    wordEndsWith,
    setWordEndsWith,
    wordLetters,
    setWordLetters,
    wordLengthMode,
    setWordLengthMode,
    wordRelatedTo,
    setWordRelatedTo,
    secondaryWordType,
    setSecondaryWordType,
    secondaryWordSyllables,
    setSecondaryWordSyllables,
    secondaryWordSyllableMode,
    setSecondaryWordSyllableMode,
    secondaryWordStartsWith,
    setSecondaryWordStartsWith,
    secondaryWordEndsWith,
    setSecondaryWordEndsWith,
    secondaryWordLetters,
    setSecondaryWordLetters,
    secondaryWordLengthMode,
    setSecondaryWordLengthMode,
    secondaryWordRelatedTo,
    setSecondaryWordRelatedTo,
    result,
    secondaryResult,
    leftWordDraft,
    rightWordDraft,
    secondaryLoading,
    loading,
    splitBatchLoading,
    displayedPronunciation,
    secondaryPronunciation,
    leftWordValue,
    rightWordValue,
    effectiveMixLeftSettings,
    effectiveMixRightSettings,
    mixedWordParts,
    displayedCombinedWord,
    brandLeftChunk,
    brandRightChunk,
    displayedDomain,
    displayedHandle,
    displayedHandleBase,
    displayedName,
    combinedSplitIsSaved,
    toggleCombinedSaved,
    copyDisplayedWord,
    findWord,
    findSecondaryWord,
    handleLeftWordDraftChange,
    handleRightWordDraftChange,
    generateVisibleWords,
    resetPrimarySettings,
    resetSecondarySettings,
    resetAllDiscoverSettings,
    resetSliceSettings,
    resetLeftSliceSettings,
    resetRightSliceSettings,
    handleLeftSliceModeChange,
    handleRightSliceModeChange,
    commitWord,
    moveThroughSplitHistory,
    sliceSettingsApplied,
    leftSliceSettingsApplied: mixLeftApplied,
    rightSliceSettingsApplied: mixRightApplied,
    leftSettingsApplied,
    rightSettingsApplied,
    leftSettingsCount,
    rightSettingsCount,
    sliceSettingsCount,
    setResult,
    setSecondaryResult,
    setLeftWordDraft,
    setRightWordDraft,
    setLoading,
    setSecondaryLoading,
  };
}
