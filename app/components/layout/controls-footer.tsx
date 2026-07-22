"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import Link from "next/link";
import type { HomeState } from "../../hooks/use-home";
import { AboutDrawer } from "../layout/about-drawer";
import { SavedWordsPanel } from "../layout/saved-words-panel";
import { ColorwaySwitcher } from "../ui/colorway-switcher";
import { SoundToggle } from "../ui/sound-toggle";
import { TypographyControls } from "../ui/typography-controls";
import { sounds } from "../../lib/sounds";

export type ControlsFooterProps = Pick<
  HomeState,
  | "appMode"
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
  | "nameDisplayMode"
>;

export function ControlsFooter(props: ControlsFooterProps) {
  const {
    appMode,
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
    nameDisplayMode,
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
            Left
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
            Right
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
          <div className="mobile-style-left-actions">
            <ColorwaySwitcher />
            <SavedWordsPanel
              savedWords={savedWords}
              savedOpen={savedOpen}
              setSavedOpen={setSavedOpen}
              savedMenuRef={savedMenuRef}
              saveWords={saveWords}
              loadSavedWord={loadSavedWord}
              like={{
                liked: combinedSplitIsSaved,
                disabled: !displayedCombinedWord,
                onToggle: toggleCombinedSaved,
              }}
            />
          </div>
          <TypographyControls compact />
          <div className="mobile-style-right-actions">
            <SoundToggle />
            <AboutDrawer />
            <Link className="drops-nav-link" href="/drops">Get Drops <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      ) : null}
      <div className="controls-bar">
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
            <button
              type="button"
              onClick={() => {
                sounds.drop();
                resetAllDiscoverSettings();
              }}
            >
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
          null
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
            <div className="sound-about-actions desktop-layout-only">
              <Link className="drops-nav-link" href="/drops">Get Drops <span aria-hidden="true">↗</span></Link>
              <SoundToggle />
              <AboutDrawer />
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
