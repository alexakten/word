"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { savedWordsKey } from "../lib/constants";
import type { WordResult } from "../lib/types";

export function useSavedWords(isMobileLayout: boolean) {
  const [savedWords, setSavedWords] = useState<WordResult[]>([]);
  const [savedOpen, setSavedOpen] = useState(false);
  const savedMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadSavedWords = () => {
      try {
        const stored = window.localStorage.getItem(savedWordsKey);
        setSavedWords(stored ? (JSON.parse(stored) as WordResult[]) : []);
      } catch {
        setSavedWords([]);
      }
    };

    const frame = window.requestAnimationFrame(loadSavedWords);
    window.addEventListener("storage", loadSavedWords);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("storage", loadSavedWords);
    };
  }, []);

  useEffect(() => {
    if (!savedOpen || isMobileLayout) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!savedMenuRef.current?.contains(event.target as Node)) setSavedOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [isMobileLayout, savedOpen]);

  const saveWords = useCallback((words: WordResult[]) => {
    setSavedWords(words);
    try {
      window.localStorage.setItem(savedWordsKey, JSON.stringify(words));
    } catch {
      // The UI still works for this session if browser storage is unavailable.
    }
  }, []);

  return {
    savedWords,
    savedOpen,
    setSavedOpen,
    savedMenuRef,
    saveWords,
  };
}
