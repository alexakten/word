"use client";

import { useEffect, useRef } from "react";
import { relations } from "../lib/constants";
import { sounds } from "../lib/sounds";
import type { AppMode, DiscoverMobilePanel, PartOfSpeech, WordResult } from "../lib/types";

type KeyboardActions = {
  runAdvancedSearch: () => void | Promise<void>;
  runForgePrimary: () => void | Promise<void>;
  toggleForgedSaved: () => void;
  moveThroughForgeHistory: (direction: -1 | 1) => void;
};

type UseKeyboardShortcutsOptions = {
  appMode: AppMode;
  focusMode: boolean;
  setFocusMode: (value: boolean | ((current: boolean) => boolean)) => void;
  mobileDiscoverPanel: DiscoverMobilePanel | null;
  isMobileLayout: boolean;
  setMobileDiscoverPanel: (panel: DiscoverMobilePanel | null) => void;
  generateVisibleWords: () => void;
  randomizeSlices: () => void;
  findWord: (
    relation?: (typeof relations)[number],
    requestedType?: PartOfSpeech,
    options?: { apply?: boolean },
  ) => void | Promise<WordResult | undefined>;
  findSecondaryWord: (
    requestedType?: PartOfSpeech,
    options?: { apply?: boolean },
  ) => void | Promise<WordResult | undefined>;
  moveThroughSplitHistory: (direction: -1 | 1) => void;
  resetAllDiscoverSettings: () => void;
  toggleCombinedSaved: () => void;
  actions: KeyboardActions;
};

export function useKeyboardShortcuts({
  appMode,
  focusMode,
  setFocusMode,
  mobileDiscoverPanel,
  isMobileLayout,
  setMobileDiscoverPanel,
  generateVisibleWords,
  randomizeSlices,
  findWord,
  findSecondaryWord,
  moveThroughSplitHistory,
  resetAllDiscoverSettings,
  toggleCombinedSaved,
  actions,
}: UseKeyboardShortcutsOptions) {
  const actionsRef = useRef(actions);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.isContentEditable || target.closest("[contenteditable], .split-combined-edit-input")) return;

      if (
        !isMobileLayout
        && appMode === "discover"
        && event.shiftKey
        && !event.metaKey
        && !event.ctrlKey
        && !event.altKey
        && event.code === "Space"
        && !event.repeat
        && !target.matches("input, select, textarea")
      ) {
        event.preventDefault();
        sounds.tick();
        randomizeSlices();
        return;
      }

      if (focusMode) {
        event.preventDefault();
        if (event.code === "Space" || event.key === "Enter") {
          sounds.tick();
          generateVisibleWords();
          return;
        }
        if (event.key === "ArrowLeft") {
          sounds.tick();
          void findWord();
          return;
        }
        if (event.key === "ArrowRight") {
          sounds.tick();
          void findSecondaryWord();
          return;
        }
        if (event.key === "ArrowUp") {
          sounds.tick();
          moveThroughSplitHistory(-1);
          return;
        }
        if (event.key === "ArrowDown") {
          sounds.tick();
          moveThroughSplitHistory(1);
          return;
        }
        setFocusMode(false);
        return;
      }
      if (event.key === "Escape" && mobileDiscoverPanel) {
        event.preventDefault();
        setMobileDiscoverPanel(null);
        return;
      }
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      if (target.matches("button, input, select, textarea")) return;

      if (event.key.toLowerCase() === "f" && appMode === "discover") {
        event.preventDefault();
        sounds.tick();
        setMobileDiscoverPanel(null);
        setFocusMode((focused) => !focused);
        return;
      }

      if (event.code === "Space" || event.key === "Enter") {
        event.preventDefault();
        sounds.tick();
        if (appMode === "discover") generateVisibleWords();
        if (appMode === "combine") void actionsRef.current.runForgePrimary();
        if (appMode === "find") void actionsRef.current.runAdvancedSearch();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        sounds.tick();
        if (appMode === "discover") void findWord();
        else actionsRef.current.moveThroughForgeHistory(-1);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        sounds.tick();
        if (appMode === "discover") void findSecondaryWord();
        else actionsRef.current.moveThroughForgeHistory(1);
        return;
      }

      if (event.key === "ArrowUp" && appMode === "discover") {
        event.preventDefault();
        sounds.tick();
        moveThroughSplitHistory(-1);
        return;
      }

      if (event.key === "ArrowDown" && appMode === "discover") {
        event.preventDefault();
        sounds.tick();
        moveThroughSplitHistory(1);
        return;
      }

      if (event.key.toLowerCase() === "r" && appMode === "discover") {
        event.preventDefault();
        sounds.drop();
        resetAllDiscoverSettings();
        return;
      }

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (appMode === "discover") toggleCombinedSaved();
        if (appMode === "combine") actionsRef.current.toggleForgedSaved();
        return;
      }

      const relation = appMode === "discover" ? relations.find((item) => item.key === event.key.toLowerCase()) : undefined;
      if (relation) {
        sounds.tick();
        void findWord(relation);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    appMode,
    findSecondaryWord,
    findWord,
    focusMode,
    generateVisibleWords,
    isMobileLayout,
    mobileDiscoverPanel,
    moveThroughSplitHistory,
    randomizeSlices,
    resetAllDiscoverSettings,
    setFocusMode,
    setMobileDiscoverPanel,
    toggleCombinedSaved,
  ]);
}
