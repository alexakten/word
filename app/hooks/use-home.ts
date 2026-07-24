"use client";

import { useCallback, useState } from "react";
import { emptyWordResult, type ApiHealth, type WordResult } from "../lib/types";
import { applyApiHealth, isFetchFailure, parseCombinedParts } from "../lib/word-utils";
import { useAdvancedSearch } from "./use-advanced-search";
import { useAppMode } from "./use-app-mode";
import { useDiscover } from "./use-discover";
import { useForge } from "./use-forge";
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";
import { useMobileLayout } from "./use-mobile-layout";
import { useSavedWords } from "./use-saved-words";

export function useHome() {
  const [apiHealth, setApiHealth] = useState<ApiHealth>("online");
  const mobile = useMobileLayout();
  const saved = useSavedWords(mobile.isMobileLayout);
  const app = useAppMode({ setMobileDiscoverPanel: mobile.setMobileDiscoverPanel });
  const discover = useDiscover({
    setApiHealth,
    savedWords: saved.savedWords,
    saveWords: saved.saveWords,
    setMessage: app.setMessage,
  });
  const advanced = useAdvancedSearch({ setApiHealth });
  const forge = useForge({
    setApiHealth,
    savedWords: saved.savedWords,
    saveWords: saved.saveWords,
  });

  useKeyboardShortcuts({
    appMode: app.appMode,
    focusMode: app.focusMode,
    setFocusMode: app.setFocusMode,
    mobileDiscoverPanel: mobile.mobileDiscoverPanel,
    isMobileLayout: mobile.isMobileLayout,
    setMobileDiscoverPanel: mobile.setMobileDiscoverPanel,
    generateVisibleWords: discover.generateVisibleWords,
    randomizeSlices: discover.randomizeSlices,
    findWord: discover.findWord,
    findSecondaryWord: discover.findSecondaryWord,
    moveThroughSplitHistory: discover.moveThroughSplitHistory,
    resetAllDiscoverSettings: discover.resetAllDiscoverSettings,
    toggleCombinedSaved: discover.toggleCombinedSaved,
    actions: {
      runAdvancedSearch: advanced.runAdvancedSearch,
      runForgePrimary: forge.runForgePrimary,
      toggleForgedSaved: forge.toggleForgedSaved,
      moveThroughForgeHistory: forge.moveThroughForgeHistory,
    },
  });

  const loadSavedWord = useCallback(async (savedWord: WordResult) => {
    app.setMessage("From your saved words");
    saved.setSavedOpen(false);
    mobile.setMobileDiscoverPanel(null);
    app.selectAppMode("discover");

    if (savedWord.partOfSpeech === "combined word") {
      const parts = parseCombinedParts(savedWord);
      if (parts) {
        const [left, right] = parts;
        discover.setLeftWordDraft("");
        discover.setRightWordDraft("");
        const hasStoredDefinitions = savedWord.splitLeft && savedWord.splitRight
          && savedWord.splitLeft.definition
          && savedWord.splitRight.definition
          && !savedWord.splitLeft.definition.startsWith("A coined word combining ")
          && !savedWord.splitRight.definition.startsWith("A coined word combining ")
          && savedWord.splitLeft.definition !== savedWord.definition
          && savedWord.splitRight.definition !== savedWord.definition;

        if (hasStoredDefinitions) {
          discover.setResult(savedWord.splitLeft!);
          discover.setSecondaryResult(savedWord.splitRight!);
          return;
        }

        discover.setLoading(true);
        discover.setSecondaryLoading(true);
        try {
          const lookupSide = async (word: string): Promise<WordResult> => {
            try {
              const response = await fetch(`/api/word?lookup=${encodeURIComponent(word)}`);
              applyApiHealth(response, setApiHealth);
              if (response.ok) return await response.json() as WordResult;
            } catch (error) {
              if (isFetchFailure(error)) applyApiHealth(null, setApiHealth);
            }
            return { word, definition: "No definition available.", partOfSpeech: "word" };
          };
          const [leftWord, rightWord] = await Promise.all([lookupSide(left), lookupSide(right)]);
          discover.setResult(leftWord);
          discover.setSecondaryResult(rightWord);
        } finally {
          discover.setLoading(false);
          discover.setSecondaryLoading(false);
        }
        return;
      }
    }

    discover.commitWord(savedWord);
    discover.setSecondaryResult(emptyWordResult);
    discover.setLeftWordDraft("");
    discover.setRightWordDraft("");
  }, [app, discover, mobile, saved, setApiHealth]);

  return {
    ...app,
    ...mobile,
    ...saved,
    ...discover,
    ...advanced,
    ...forge,
    apiHealth,
    loadSavedWord,
    setMessage: app.setMessage,
    commitWord: discover.commitWord,
    selectAppMode: app.selectAppMode,
  };
}

export type HomeState = ReturnType<typeof useHome>;
