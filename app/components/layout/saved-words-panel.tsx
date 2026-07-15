"use client";

import { X } from "lucide-react";
import { cardo } from "../../fonts";
import type { HomeState } from "../../hooks/use-home";

type SavedWordsPanelProps = Pick<
  HomeState,
  "savedWords" | "savedOpen" | "setSavedOpen" | "savedMenuRef" | "saveWords" | "loadSavedWord"
>;

export function SavedWordsPanel({
  savedWords,
  savedOpen,
  setSavedOpen,
  savedMenuRef,
  saveWords,
  loadSavedWord,
}: SavedWordsPanelProps) {
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
      {savedOpen ? (
        <div className="saved-panel" id="saved-words">
          <p className="saved-heading">Saved words</p>
          {savedWords.length ? (
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
          ) : (
            <p className="saved-empty">Words you like will appear here.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
