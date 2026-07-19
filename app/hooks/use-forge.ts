"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sounds } from "../lib/sounds";
import type { ApiHealth, ForgeHistoryEntry, ForgeSlot, WordResult } from "../lib/types";
import { applyApiHealth, emptyForgeSlot, isFetchFailure } from "../lib/word-utils";

type UseForgeOptions = {
  setApiHealth: (health: ApiHealth) => void;
  savedWords: WordResult[];
  saveWords: (words: WordResult[]) => void;
};

export function useForge({ setApiHealth, savedWords, saveWords }: UseForgeOptions) {
  const [forgeSlots, setForgeSlots] = useState<ForgeSlot[]>([emptyForgeSlot(), emptyForgeSlot()]);
  const [forgeSyllables, setForgeSyllables] = useState("");
  const [forgeTotalLetters, setForgeTotalLetters] = useState("");
  const [forgeCopied, setForgeCopied] = useState(false);
  const [forgeRemixing, setForgeRemixing] = useState(false);

  const forgeHistoryRef = useRef<ForgeHistoryEntry[]>([]);
  const forgeHistoryIndexRef = useRef(-1);

  const updateForgeSlot = (slotIndex: number, changes: Partial<ForgeSlot>) => {
    setForgeSlots((slots) => slots.map((slot, index) => index === slotIndex ? { ...slot, ...changes } : slot));
  };

  const fitsForgeSlotConstraints = (word: WordResult, slotIndex: number) => {
    const limit = Number(forgeSlots[slotIndex].maxLetters);
    const exactLetters = Number(forgeSlots[slotIndex].letters);
    const syllables = Number(forgeSlots[slotIndex].syllables);
    const letterCount = word.word.replace(/[^a-z]/gi, "").length;
    const lettersMatch = (!limit || letterCount <= limit) && (!exactLetters || letterCount === exactLetters);
    const syllablesMatch = !syllables || word.syllables === syllables;
    return lettersMatch && syllablesMatch;
  };

  const matchesForgeSyllables = (left: WordResult, right: WordResult) => {
    const target = Number(forgeSyllables);
    const letterTarget = Number(forgeTotalLetters);
    const syllablesMatch = !target || Boolean(left.syllables && right.syllables && left.syllables + right.syllables === target);
    const lettersMatch = !letterTarget || left.word.length + right.word.length === letterTarget;
    return syllablesMatch && lettersMatch;
  };

  const findForgeWords = async (slotIndex: number) => {
    const seed = forgeSlots[slotIndex].seed.trim();
    updateForgeSlot(slotIndex, { loading: true, error: "", candidates: [], pinned: false });

    try {
      const otherIndex = slotIndex === 0 ? 1 : 0;
      const otherWord = forgeSlots[otherIndex].candidates[forgeSlots[otherIndex].index];
      const params = new URLSearchParams(seed ? { idea: seed } : { random: "1" });
      const requiredSyllables = forgeSlots[slotIndex].syllables
        || (Number(forgeSyllables) && otherWord?.syllables
          ? String(Number(forgeSyllables) - otherWord.syllables)
          : "");
      const requiredLetters = forgeSlots[slotIndex].letters
        || (Number(forgeTotalLetters) && otherWord
          ? String(Number(forgeTotalLetters) - otherWord.word.length)
          : "");
      if (Number(requiredSyllables) > 0) params.set("syllables", requiredSyllables);
      if (forgeSlots[slotIndex].maxLetters) params.set("maxLetters", forgeSlots[slotIndex].maxLetters);
      if (Number(requiredLetters) > 0) params.set("letters", requiredLetters);
      const response = await fetch(`/api/forge?${params}`);
      applyApiHealth(response, setApiHealth);
      const connected = response.ok ? (await response.json()) as WordResult[] : [];
      const seen = new Set<string>();
      const candidates = connected.filter((word): word is WordResult => {
        if (!/^[a-z]+$/i.test(word.word) || !fitsForgeSlotConstraints(word, slotIndex)) return false;
        const key = word.word.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (!candidates.length) throw new Error("No related words");
      const hasCombinedTarget = Number(forgeSyllables) || Number(forgeTotalLetters);
      const matchingIndex = hasCombinedTarget && otherWord
        ? candidates.findIndex((candidate) => slotIndex === 0
          ? matchesForgeSyllables(candidate, otherWord)
          : matchesForgeSyllables(otherWord, candidate))
        : 0;
      if (matchingIndex < 0) throw new Error("No words match the combined target");
      updateForgeSlot(slotIndex, { candidates, index: matchingIndex, loading: false });
    } catch (error) {
      const message = error instanceof Error && error.message === "No words match the combined target"
        ? error.message
        : seed ? "No connected words found" : "No random words match these limits";
      updateForgeSlot(slotIndex, { loading: false, error: message });
    }
  };

  const lockForgeSeedWord = async (slotIndex: number) => {
    const seed = forgeSlots[slotIndex].seed.trim();
    if (!/^[a-z]+$/i.test(seed)) {
      updateForgeSlot(slotIndex, { error: "Enter one word to lock it" });
      return;
    }

    updateForgeSlot(slotIndex, { loading: true, error: "" });
    try {
      const [wordResponse, connectionsResponse] = await Promise.all([
        fetch(`/api/word?lookup=${encodeURIComponent(seed)}`),
        fetch(`/api/forge?idea=${encodeURIComponent(seed)}`),
      ]);
      applyApiHealth(wordResponse, setApiHealth);
      applyApiHealth(connectionsResponse, setApiHealth);
      if (!wordResponse.ok) throw new Error("Word not found");
      const exact = await wordResponse.json() as WordResult;
      if (!fitsForgeSlotConstraints(exact, slotIndex)) throw new Error("Word does not match this half’s limits");
      const connections = connectionsResponse.ok ? await connectionsResponse.json() as WordResult[] : [];
      const seen = new Set([exact.word.toLowerCase()]);
      const candidates = [
        { ...exact, relation: "exact" },
        ...connections.filter((word) => {
          const key = word.word.toLowerCase();
          if (!/^[a-z]+$/i.test(word.word) || !fitsForgeSlotConstraints(word, slotIndex) || seen.has(key)) return false;
          seen.add(key);
          return true;
        }),
      ];
      updateForgeSlot(slotIndex, { candidates, index: 0, pinned: true, loading: false, error: "" });
    } catch (error) {
      if (isFetchFailure(error)) applyApiHealth(null, setApiHealth);
      updateForgeSlot(slotIndex, {
        loading: false,
        error: error instanceof Error ? error.message : "Word not found",
      });
    }
  };

  const cycleForgeWord = (slotIndex: number) => {
    const slot = forgeSlots[slotIndex];
    if (slot.pinned || slot.candidates.length < 2) return;
    const otherIndex = slotIndex === 0 ? 1 : 0;
    const otherWord = forgeSlots[otherIndex].candidates[forgeSlots[otherIndex].index];

    for (let offset = 1; offset < slot.candidates.length; offset += 1) {
      const index = (slot.index + offset) % slot.candidates.length;
      const candidate = slot.candidates[index];
      const syllablesMatch = !otherWord || (slotIndex === 0
        ? matchesForgeSyllables(candidate, otherWord)
        : matchesForgeSyllables(otherWord, candidate));
      if (fitsForgeSlotConstraints(candidate, slotIndex) && syllablesMatch) {
        updateForgeSlot(slotIndex, { index, error: "" });
        return;
      }
    }

    updateForgeSlot(slotIndex, { error: "No other word matches these limits" });
  };

  const remixForgePair = async () => {
    const currentWords = forgeSlots.map((slot) => slot.candidates[slot.index]);
    const ideas = forgeSlots.map((slot) => slot.seed.trim());
    const remixIndexes = forgeSlots
      .map((slot, index) => slot.pinned ? -1 : index)
      .filter((index) => index >= 0);
    if (forgeRemixing || !remixIndexes.length || currentWords.some((word) => !word)) return;

    setForgeRemixing(true);
    setForgeSlots((slots) => slots.map((slot) => ({ ...slot, error: "" })));

    try {
      const maxAttempts = remixIndexes.some((slotIndex) => !ideas[slotIndex]) ? 4 : 1;
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const results = await Promise.all(remixIndexes.map(async (slotIndex) => {
          const params = new URLSearchParams(ideas[slotIndex] ? { idea: ideas[slotIndex] } : { random: "1" });
          const otherIndex = slotIndex === 0 ? 1 : 0;
          const fixedOtherWord = forgeSlots[otherIndex].pinned ? currentWords[otherIndex] : undefined;
          const requiredSyllables = forgeSlots[slotIndex].syllables
            || (Number(forgeSyllables) && fixedOtherWord?.syllables
              ? String(Number(forgeSyllables) - fixedOtherWord.syllables)
              : "");
          const requiredLetters = forgeSlots[slotIndex].letters
            || (Number(forgeTotalLetters) && fixedOtherWord
              ? String(Number(forgeTotalLetters) - fixedOtherWord.word.length)
              : "");
          if (Number(requiredSyllables) > 0) params.set("syllables", requiredSyllables);
          if (forgeSlots[slotIndex].maxLetters) params.set("maxLetters", forgeSlots[slotIndex].maxLetters);
          if (Number(requiredLetters) > 0) params.set("letters", requiredLetters);
          const response = await fetch(`/api/forge?${params}`);
          applyApiHealth(response, setApiHealth);
          if (!response.ok) throw new Error("Could not remix pair");
          return response.json() as Promise<WordResult[]>;
        }));
        const candidateLists = new Map(remixIndexes.map((slotIndex, resultIndex) => {
          const words = results[resultIndex];
          const seen = new Set<string>();
          const idea = ideas[slotIndex].toLowerCase();
          const currentWord = currentWords[slotIndex]?.word.toLowerCase();

          const candidates = words.filter((word) => {
            const key = word.word.toLowerCase();
            if (!/^[a-z]+$/i.test(word.word) || !fitsForgeSlotConstraints(word, slotIndex) || key === idea || key === currentWord || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          return [slotIndex, candidates] as const;
        }));

        if ([...candidateLists.values()].some((words) => !words.length)) continue;
        const choices = forgeSlots.map((slot, slotIndex) => {
          const words = slot.pinned ? [currentWords[slotIndex]] : candidateLists.get(slotIndex) ?? [];
          return words.filter((word): word is WordResult => Boolean(word && fitsForgeSlotConstraints(word, slotIndex)));
        });
        const validPairs = choices[0].flatMap((left) => (
          choices[1].filter((right) => matchesForgeSyllables(left, right)).map((right) => [left, right] as const)
        ));
        if (!validPairs.length) continue;
        const selectedPair = validPairs[Math.floor(Math.random() * validPairs.length)];

        setForgeSlots((slots) => slots.map((slot, slotIndex) => {
          const candidates = candidateLists.get(slotIndex);
          if (!candidates) return slot;
          const index = candidates.findIndex((word) => word.word === selectedPair[slotIndex].word);
          return { ...slot, candidates, index, error: "" };
        }));
        return;
      }
      throw new Error("No pair matches these limits");
    } catch (error) {
      const message = error instanceof Error && error.message === "No pair matches these limits"
        ? error.message
        : "Couldn’t remix this pair";
      setForgeSlots((slots) => slots.map((slot) => ({ ...slot, error: message })));
    } finally {
      setForgeRemixing(false);
    }
  };

  const runForgePrimary = async () => {
    const unexplored = forgeSlots
      .map((slot, index) => !slot.candidates.length ? index : -1)
      .filter((index) => index >= 0);
    if (unexplored.length) {
      await Promise.all(unexplored.map((slotIndex) => findForgeWords(slotIndex)));
      return;
    }
    if (forgeSlots.every((slot) => slot.candidates.length)) await remixForgePair();
  };

  const toggleForgedSaved = () => {
    const words = forgeSlots.map((slot) => slot.candidates[slot.index]);
    if (!words[0] || !words[1] || !matchesForgeSyllables(words[0], words[1])) return;
    if (!words.every((word, slotIndex) => fitsForgeSlotConstraints(word, slotIndex))) return;
    const word = words.map((item) => item.word.replace(/\s+/g, "").toLowerCase()).join("");
    const exists = savedWords.some((saved) => saved.word.toLowerCase() === word);
    if (exists) {
      saveWords(savedWords.filter((saved) => saved.word.toLowerCase() !== word));
      return;
    }
    saveWords([...savedWords, {
      word,
      definition: `A coined word combining “${words[0].word}” and “${words[1].word}”.`,
      partOfSpeech: "coined word",
    }]);
    sounds.successMinimal();
  };

  const moveThroughForgeHistory = useCallback((direction: -1 | 1) => {
    const nextIndex = forgeHistoryIndexRef.current + direction;
    const entry = forgeHistoryRef.current[nextIndex];
    if (!entry) return;

    forgeHistoryIndexRef.current = nextIndex;
    setForgeSlots((slots) => slots.map((slot, slotIndex) => {
      const savedSlot = entry.slots[slotIndex];
      const existingIndex = slot.candidates.findIndex((word) => word.word === savedSlot.word.word);
      const candidates = existingIndex >= 0 ? slot.candidates : [savedSlot.word, ...slot.candidates];
      return {
        ...slot,
        seed: savedSlot.seed,
        maxLetters: savedSlot.maxLetters,
        letters: savedSlot.letters,
        syllables: savedSlot.syllables,
        pinned: savedSlot.pinned,
        candidates,
        index: existingIndex >= 0 ? existingIndex : 0,
        error: "",
      };
    }));
  }, []);
  const forgeWords = forgeSlots.map((slot) => slot.candidates[slot.index]);
  const forgedWord = forgeWords.every(Boolean)
    ? forgeWords.map((word) => word!.word.replace(/\s+/g, "").toLowerCase()).join("")
    : "";
  const forgeLetterCounts = forgeWords.map((word) => word?.word.replace(/[^a-z]/gi, "").length ?? 0);
  const forgeSyllableCount = forgeWords.every((word) => word?.syllables)
    ? forgeWords.reduce((total, word) => total + word!.syllables!, 0)
    : null;
  const forgeLetterLimitsMet = forgeWords.every((word, slotIndex) => !word || fitsForgeSlotConstraints(word, slotIndex));
  const forgeSyllablesMet = !Number(forgeSyllables) || forgeSyllableCount === Number(forgeSyllables);
  const forgeTotalLettersMet = !Number(forgeTotalLetters)
    || forgeLetterCounts.reduce((total, count) => total + count, 0) === Number(forgeTotalLetters);
  const forgeSourcesReady = Boolean(forgedWord);
  const forgeReady = forgeSourcesReady
    && forgeLetterLimitsMet
    && forgeSyllablesMet
    && forgeTotalLettersMet;
  const forgedIsSaved = Boolean(forgedWord) && savedWords.some((saved) => saved.word.toLowerCase() === forgedWord);
  useEffect(() => {
    if (!forgedWord || !forgeWords[0] || !forgeWords[1]) return;
    const current = forgeHistoryRef.current[forgeHistoryIndexRef.current];
    const entry: ForgeHistoryEntry = {
      combined: forgedWord,
      slots: [0, 1].map((slotIndex) => ({
        seed: forgeSlots[slotIndex].seed,
        maxLetters: forgeSlots[slotIndex].maxLetters,
        letters: forgeSlots[slotIndex].letters,
        syllables: forgeSlots[slotIndex].syllables,
        pinned: forgeSlots[slotIndex].pinned,
        word: forgeWords[slotIndex]!,
      })) as ForgeHistoryEntry["slots"],
    };
    if (current?.combined === forgedWord) {
      forgeHistoryRef.current[forgeHistoryIndexRef.current] = entry;
      return;
    }
    const branch = forgeHistoryRef.current.slice(0, forgeHistoryIndexRef.current + 1);
    forgeHistoryRef.current = [...branch, entry].slice(-100);
    forgeHistoryIndexRef.current = forgeHistoryRef.current.length - 1;
  }, [forgedWord, forgeSlots, forgeWords]);

  return {
    forgeSlots,
    setForgeSlots,
    forgeSyllables,
    setForgeSyllables,
    forgeTotalLetters,
    setForgeTotalLetters,
    forgeCopied,
    setForgeCopied,
    forgeRemixing,
    updateForgeSlot,
    findForgeWords,
    lockForgeSeedWord,
    cycleForgeWord,
    runForgePrimary,
    toggleForgedSaved,
    moveThroughForgeHistory,
    forgeWords,
    forgedWord,
    forgeReady,
    forgeSourcesReady,
    forgedIsSaved,
  };
}
