"use client";

import { useEffect, useRef } from "react";
import { relations } from "../lib/constants";
import type { AppMode, DiscoverMobilePanel } from "../lib/types";

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
  setMobileDiscoverPanel: (panel: DiscoverMobilePanel | null) => void;
  generateVisibleWords: () => void;
  findWord: (relation?: (typeof relations)[number]) => void | Promise<void>;
  findSecondaryWord: () => void | Promise<void>;
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
  setMobileDiscoverPanel,
  generateVisibleWords,
  findWord,
  findSecondaryWord,
  moveThroughSplitHistory,
  resetAllDiscoverSettings,
  toggleCombinedSaved,
  actions,
}: UseKeyboardShortcutsOptions) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (focusMode) {
        event.preventDefault();
        if (event.code === "Space") generateVisibleWords();
        else setFocusMode(false);
        return;
      }
      if (event.key === "Escape" && mobileDiscoverPanel) {
        event.preventDefault();
        setMobileDiscoverPanel(null);
        return;
      }
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.matches("button, input, select, textarea")) return;

      if (event.key.toLowerCase() === "f" && appMode === "discover") {
        event.preventDefault();
        setMobileDiscoverPanel(null);
        setFocusMode((focused) => !focused);
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        if (appMode === "discover") generateVisibleWords();
        if (appMode === "combine") void actionsRef.current.runForgePrimary();
        if (appMode === "find") void actionsRef.current.runAdvancedSearch();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (appMode === "discover") void findWord();
        else actionsRef.current.moveThroughForgeHistory(-1);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (appMode === "discover") void findSecondaryWord();
        else actionsRef.current.moveThroughForgeHistory(1);
        return;
      }

      if (event.key === "ArrowUp" && appMode === "discover") {
        event.preventDefault();
        moveThroughSplitHistory(-1);
        return;
      }

      if (event.key === "ArrowDown" && appMode === "discover") {
        event.preventDefault();
        moveThroughSplitHistory(1);
        return;
      }

      if (event.key.toLowerCase() === "r" && appMode === "discover") {
        event.preventDefault();
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
      if (relation) void findWord(relation);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    appMode,
    findSecondaryWord,
    findWord,
    focusMode,
    generateVisibleWords,
    mobileDiscoverPanel,
    moveThroughSplitHistory,
    resetAllDiscoverSettings,
    setFocusMode,
    setMobileDiscoverPanel,
    toggleCombinedSaved,
  ]);
}
