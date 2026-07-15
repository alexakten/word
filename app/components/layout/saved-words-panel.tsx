"use client";

import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { cardo } from "../../fonts";
import type { HomeState } from "../../hooks/use-home";
import type { WordResult } from "../../lib/types";

type SavedWordsPanelProps = Pick<
  HomeState,
  "savedWords" | "savedOpen" | "setSavedOpen" | "savedMenuRef" | "saveWords" | "loadSavedWord" | "isMobileLayout"
>;

function SavedWordsList({
  savedWords,
  saveWords,
  loadSavedWord,
}: {
  savedWords: WordResult[];
  saveWords: (words: WordResult[]) => void;
  loadSavedWord: (word: WordResult) => void | Promise<void>;
}) {
  if (!savedWords.length) {
    return <p className="saved-empty">Words you like will appear here.</p>;
  }

  return (
    <ul>
      {savedWords.map((saved) => (
        <li key={saved.word.toLowerCase()}>
          <button
            className="saved-word"
            type="button"
            onClick={() => void loadSavedWord(saved)}
          >
            <span style={{ fontFamily: cardo.style.fontFamily }}>{saved.word}</span>
            <small>{saved.partOfSpeech}</small>
          </button>
          <button
            className="remove-saved"
            type="button"
            aria-label={`Remove ${saved.word}`}
            onClick={() => saveWords(savedWords.filter((item) => item.word !== saved.word))}
          >
            <X size={13} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export function SavedWordsPanel({
  savedWords,
  savedOpen,
  setSavedOpen,
  savedMenuRef,
  saveWords,
  loadSavedWord,
  isMobileLayout,
}: SavedWordsPanelProps) {
  const closeSaved = () => setSavedOpen(false);

  return (
    <div className="saved-menu" ref={savedMenuRef}>
      <button
        className={savedOpen ? "saved-toggle active" : "saved-toggle"}
        type="button"
        aria-expanded={savedOpen}
        aria-controls="saved-words"
        onClick={() => setSavedOpen((open) => !open)}
      >
        Saved <span>{savedWords.length}</span>
      </button>
      {savedOpen && !isMobileLayout
        ? createPortal(
          <>
            <button
              className="saved-modal-backdrop"
              type="button"
              aria-label="Close saved words"
              onClick={closeSaved}
            />
            <div
              className="saved-modal"
              id="saved-words"
              role="dialog"
              aria-modal="true"
              aria-labelledby="saved-words-title"
            >
              <div className="saved-modal-header settings-panel-header">
                <p id="saved-words-title">Saved words</p>
                <button type="button" aria-label="Close saved words" onClick={closeSaved}>
                  <X size={14} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
              <div className="saved-modal-body">
                <SavedWordsList
                  savedWords={savedWords}
                  saveWords={saveWords}
                  loadSavedWord={loadSavedWord}
                />
              </div>
            </div>
          </>,
          document.body,
        )
        : null}
    </div>
  );
}
