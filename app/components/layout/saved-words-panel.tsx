"use client";

import { useEffect, useState, type AnimationEvent } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import type { HomeState } from "../../hooks/use-home";
import type { WordResult } from "../../lib/types";
import { SaveHeartButton } from "../ui/save-heart-button";

type SavedWordsPanelProps = Pick<
  HomeState,
  "savedWords" | "savedOpen" | "setSavedOpen" | "savedMenuRef" | "saveWords" | "loadSavedWord"
> & {
  like?: {
    liked: boolean;
    disabled?: boolean;
    onToggle: () => void;
  };
};

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
            <span>{saved.word}</span>
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
  like,
}: SavedWordsPanelProps) {
  const [mounted, setMounted] = useState(savedOpen);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (savedOpen) {
      setMounted(true);
      setLeaving(false);
      return;
    }
    if (mounted) setLeaving(true);
  }, [savedOpen, mounted]);

  const closeSaved = () => setSavedOpen(false);

  const finishLeave = (event: AnimationEvent<HTMLElement>) => {
    if (!leaving) return;
    if (event.animationName !== "modalOverlayExit") return;
    setMounted(false);
    setLeaving(false);
  };

  const savedToggle = (
    <button
      className={savedOpen ? "saved-toggle active" : "saved-toggle"}
      type="button"
      aria-expanded={savedOpen}
      aria-controls="saved-words"
      aria-label={like ? `Saved words, ${savedWords.length}` : undefined}
      onClick={() => setSavedOpen((open) => !open)}
    >
      {like ? null : "Saved "}
      <span>{savedWords.length}</span>
    </button>
  );

  return (
    <div className="saved-menu" ref={savedMenuRef}>
      {like ? (
        <div
          className={[
            "saved-like-control",
            savedOpen ? "is-open" : "",
            like.liked ? "liked" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {savedToggle}
          <SaveHeartButton
            liked={like.liked}
            disabled={like.disabled}
            onToggle={like.onToggle}
          />
        </div>
      ) : (
        savedToggle
      )}
      {mounted
        ? createPortal(
          <>
            <button
              className={["modal-overlay saved-modal-backdrop", leaving ? "is-leaving" : ""].filter(Boolean).join(" ")}
              type="button"
              aria-label="Close saved words"
              onClick={closeSaved}
              onAnimationEnd={finishLeave}
            />
            <div
              className={["saved-modal", leaving ? "is-leaving" : ""].filter(Boolean).join(" ")}
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
