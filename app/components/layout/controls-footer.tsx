"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Heart } from "lucide-react";
import type { HomeState } from "../../hooks/use-home";
import { AboutDrawer } from "../layout/about-drawer";
import { SavedWordsPanel } from "../layout/saved-words-panel";
import { ColorwaySwitcher } from "../ui/colorway-switcher";
import { TypographyControls } from "../ui/typography-controls";

export type ControlsFooterProps = Pick<
  HomeState,
  | "appMode"
  | "isMobileLayout"
  | "mobileDiscoverPanel"
  | "toggleMobileDiscoverPanel"
  | "leftSettingsApplied"
  | "sliceSettingsApplied"
  | "rightSettingsApplied"
  | "leftSettingsCount"
  | "sliceSettingsCount"
  | "rightSettingsCount"
  | "generateVisibleWords"
  | "setFocusMode"
  | "resetAllDiscoverSettings"
  | "findWord"
  | "findSecondaryWord"
  | "combinedSplitIsSaved"
  | "displayedCombinedWord"
  | "toggleCombinedSaved"
  | "runForgePrimary"
  | "forgeSourcesReady"
  | "forgedIsSaved"
  | "forgeReady"
  | "toggleForgedSaved"
  | "runAdvancedSearch"
  | "savedWords"
  | "savedOpen"
  | "setSavedOpen"
  | "savedMenuRef"
  | "saveWords"
  | "loadSavedWord"
>;

export function ControlsFooter(props: ControlsFooterProps) {
  const {
    appMode,
    isMobileLayout,
    mobileDiscoverPanel,
    toggleMobileDiscoverPanel,
    leftSettingsApplied,
    sliceSettingsApplied,
    rightSettingsApplied,
    leftSettingsCount,
    sliceSettingsCount,
    rightSettingsCount,
    generateVisibleWords,
    setFocusMode,
    resetAllDiscoverSettings,
    findWord,
    findSecondaryWord,
    combinedSplitIsSaved,
    displayedCombinedWord,
    toggleCombinedSaved,
    runForgePrimary,
    forgeSourcesReady,
    forgedIsSaved,
    forgeReady,
    toggleForgedSaved,
    runAdvancedSearch,
    savedWords,
    savedOpen,
    setSavedOpen,
    savedMenuRef,
    saveWords,
    loadSavedWord,
  } = props;

  return (
    <footer className="controls">
      {appMode === "discover" ? (
        <div className="mobile-discover-toolbar" role="toolbar" aria-label="Word settings panels">
          <button
            className={["mobile-discover-toolbar-button", mobileDiscoverPanel === "left" ? "active" : "", leftSettingsApplied ? "has-settings" : ""].filter(Boolean).join(" ")}
            type="button"
            aria-expanded={mobileDiscoverPanel === "left"}
            onClick={() => toggleMobileDiscoverPanel("left")}
          >
            Left word
            {leftSettingsCount > 0 ? (
              <span className="mobile-discover-toolbar-count" aria-label={`${leftSettingsCount} active filters`}>
                {leftSettingsCount}
              </span>
            ) : null}
          </button>
          <button
            className={["mobile-discover-toolbar-button", mobileDiscoverPanel === "slice" ? "active" : "", sliceSettingsApplied ? "has-settings" : ""].filter(Boolean).join(" ")}
            type="button"
            aria-expanded={mobileDiscoverPanel === "slice"}
            onClick={() => toggleMobileDiscoverPanel("slice")}
          >
            Slice
            {sliceSettingsCount > 0 ? (
              <span className="mobile-discover-toolbar-count" aria-label={`${sliceSettingsCount} active filters`}>
                {sliceSettingsCount}
              </span>
            ) : null}
          </button>
          <button
            className={["mobile-discover-toolbar-button", mobileDiscoverPanel === "right" ? "active" : "", rightSettingsApplied ? "has-settings" : ""].filter(Boolean).join(" ")}
            type="button"
            aria-expanded={mobileDiscoverPanel === "right"}
            onClick={() => toggleMobileDiscoverPanel("right")}
          >
            Right word
            {rightSettingsCount > 0 ? (
              <span className="mobile-discover-toolbar-count" aria-label={`${rightSettingsCount} active filters`}>
                {rightSettingsCount}
              </span>
            ) : null}
          </button>
        </div>
      ) : null}
      {appMode === "discover" ? (
        <div className="mobile-style-toolbar">
          <ColorwaySwitcher />
          <TypographyControls />
        </div>
      ) : null}
      <div className="controls-bar">
        {appMode === "discover" && !isMobileLayout ? (
          <div className="desktop-bottom-left-actions">
            <SavedWordsPanel
              savedWords={savedWords}
              savedOpen={savedOpen}
              setSavedOpen={setSavedOpen}
              savedMenuRef={savedMenuRef}
              saveWords={saveWords}
              loadSavedWord={loadSavedWord}
            />
            <button
              className={["compact-save-word-button", combinedSplitIsSaved ? "liked" : ""].filter(Boolean).join(" ")}
              type="button"
              aria-label={combinedSplitIsSaved ? "Remove from saved words" : "Save word"}
              aria-pressed={combinedSplitIsSaved}
              disabled={!displayedCombinedWord}
              onClick={toggleCombinedSaved}
            >
              <Heart size={15} strokeWidth={1.6} fill={combinedSplitIsSaved ? "currentColor" : "none"} aria-hidden="true" />
            </button>
          </div>
        ) : null}
        {appMode === "discover" ? (
          <div className="shortcut-row" aria-label="Word exploration shortcuts">
            <button className="space-button" type="button" onClick={() => generateVisibleWords()}>
              <kbd>space</kbd>
              <span>Generate</span>
            </button>
            <button type="button" onClick={() => setFocusMode(true)}>
              <kbd>F</kbd>
              <span>Focus</span>
            </button>
            <button type="button" onClick={resetAllDiscoverSettings}>
              <kbd>R</kbd>
              <span>Reset</span>
            </button>
            <button type="button" onClick={() => void findWord()}>
              <kbd><ArrowLeft size={13} strokeWidth={1.5} aria-hidden="true" /></kbd>
              <span>Left</span>
            </button>
            <button type="button" onClick={() => void findSecondaryWord()}>
              <kbd><ArrowRight size={13} strokeWidth={1.5} aria-hidden="true" /></kbd>
              <span>Right</span>
            </button>
            <button
              className={combinedSplitIsSaved ? "save-legend liked" : "save-legend"}
              type="button"
              disabled={!displayedCombinedWord}
              aria-pressed={combinedSplitIsSaved}
              onClick={toggleCombinedSaved}
            >
              <kbd>S</kbd>
              <span>Save</span>
            </button>
            <span className="history-shortcut" aria-label="Use up and down arrow keys to browse pair history">
              <kbd><ArrowUp size={13} strokeWidth={1.5} aria-hidden="true" /></kbd>
              <kbd><ArrowDown size={13} strokeWidth={1.5} aria-hidden="true" /></kbd>
              <span>History</span>
            </span>
          </div>
        ) : null}
        {appMode === "combine" ? <div className="shortcut-row" aria-label="Word combination shortcuts">
          <button className="space-button" type="button" onClick={() => void runForgePrimary()}>
            <kbd>space</kbd>
            <span>{forgeSourcesReady ? "Remix" : "Generate"}</span>
          </button>
          <span className="history-shortcut" aria-label="Use left and right arrow keys to browse combination history">
            <kbd><ArrowLeft size={13} strokeWidth={1.5} aria-hidden="true" /></kbd>
            <kbd><ArrowRight size={13} strokeWidth={1.5} aria-hidden="true" /></kbd>
            <span>History</span>
          </span>
          <button
            className={forgedIsSaved ? "save-legend liked" : "save-legend"}
            type="button"
            disabled={!forgeReady}
            aria-pressed={forgedIsSaved}
            onClick={toggleForgedSaved}
          >
            <kbd>S</kbd>
            <span>{forgedIsSaved ? "Saved" : "Save word"}</span>
          </button>
        </div> : null}
        {appMode === "find" ? <div className="shortcut-row" aria-label="Word search shortcuts">
          <button className="space-button" type="button" onClick={() => void runAdvancedSearch()}>
            <kbd>space</kbd>
            <span>Find words</span>
          </button>
        </div> : null}
        {appMode === "discover" ? (
          <AboutDrawer />
        ) : (
          <div className="controls-end">
            <SavedWordsPanel
              savedWords={savedWords}
              savedOpen={savedOpen}
              setSavedOpen={setSavedOpen}
              savedMenuRef={savedMenuRef}
              saveWords={saveWords}
              loadSavedWord={loadSavedWord}
            />
            {!isMobileLayout ? <AboutDrawer /> : null}
          </div>
        )}
      </div>
    </footer>
  );
}
