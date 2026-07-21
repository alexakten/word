"use client";

import { ArrowLeft, ArrowRight, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AffixSettings } from "../discover/affix-settings";
import { DomainAvailability } from "../discover/domain-availability";
import { HandleAvailability } from "../discover/handle-availability";
import { MixSourceWord } from "../discover/mix-source-word";
import { RelatedToSetting, TagEntrySetting } from "../discover/related-to-setting";
import { SliceSettingsPanel, SliceSidePanel } from "../discover/slice-settings-panel";
import { SettingsPanelScroll } from "../discover/settings-panel-scroll";
import { SplitDescription } from "../discover/split-description";
import { SyllableCountSetting } from "../discover/syllable-count-setting";
import { WordCopyHint } from "../discover/word-copy-hint";
import { WordLengthSetting } from "../discover/word-length-setting";
import { AboutDrawer } from "../layout/about-drawer";
import { SavedWordsPanel } from "../layout/saved-words-panel";
import { ApiHealthStatus } from "../ui/api-health-status";
import { ColorwaySwitcher } from "../ui/colorway-switcher";
import { DomainModeControls, TldDropdown } from "../ui/domain-mode-controls";
import { SaveHeartButton } from "../ui/save-heart-button";
import { SoundToggle } from "../ui/sound-toggle";
import { TypographyControls } from "../ui/typography-controls";
import { WordTypeTabs } from "../ui/word-type-tabs";
import type { HomeState } from "../../hooks/use-home";
import { useHistorySideTap } from "../../hooks/use-history-side-tap";
import { sounds } from "../../lib/sounds";
import { parseTags } from "../../lib/tags";

const SHOW_DESKTOP_TOOLTIPS = false;

function DesktopTooltip({ label, children }: { label: string; children: ReactNode }) {
  return SHOW_DESKTOP_TOOLTIPS
    ? <span className="desktop-top-tooltip" data-tooltip={label}>{children}</span>
    : <>{children}</>;
}

export type DiscoverViewProps = Pick<
  HomeState,
  | "mobileDiscoverPanel"
  | "isMobileLayout"
  | "moveThroughSplitHistory"
  | "closeMobileDiscoverPanel"
  | "leftSettingsApplied"
  | "rightSettingsApplied"
  | "resetPrimarySettings"
  | "resetSecondarySettings"
  | "leftWordDraft"
  | "rightWordDraft"
  | "handleLeftWordDraftChange"
  | "handleRightWordDraftChange"
  | "wordType"
  | "setWordType"
  | "wordRelatedTo"
  | "setWordRelatedTo"
  | "wordSyllables"
  | "setWordSyllables"
  | "wordSyllableMode"
  | "setWordSyllableMode"
  | "wordStartsWith"
  | "setWordStartsWith"
  | "wordEndsWith"
  | "setWordEndsWith"
  | "wordLetters"
  | "setWordLetters"
  | "wordLengthMode"
  | "setWordLengthMode"
  | "secondaryWordType"
  | "setSecondaryWordType"
  | "secondaryWordRelatedTo"
  | "setSecondaryWordRelatedTo"
  | "secondaryWordSyllables"
  | "setSecondaryWordSyllables"
  | "secondaryWordSyllableMode"
  | "setSecondaryWordSyllableMode"
  | "secondaryWordStartsWith"
  | "setSecondaryWordStartsWith"
  | "secondaryWordEndsWith"
  | "setSecondaryWordEndsWith"
  | "secondaryWordLetters"
  | "setSecondaryWordLetters"
  | "secondaryWordLengthMode"
  | "setSecondaryWordLengthMode"
  | "wordCopyStatus"
  | "setWordCopyStatus"
  | "leftWordValue"
  | "rightWordValue"
  | "displayedCombinedWord"
  | "displayedDomain"
  | "displayedHandleBase"
  | "displayedName"
  | "nameDisplayMode"
  | "setNameDisplayMode"
  | "selectedTld"
  | "setSelectedTld"
  | "copyDisplayedWord"
  | "mixedWordParts"
  | "loading"
  | "secondaryLoading"
  | "splitBatchLoading"
  | "result"
  | "secondaryResult"
  | "displayedPronunciation"
  | "secondaryPronunciation"
  | "effectiveMixLeftSettings"
  | "effectiveMixRightSettings"
  | "leftSliceMode"
  | "rightSliceMode"
  | "mixLeftSettings"
  | "mixRightSettings"
  | "handleLeftSliceModeChange"
  | "handleRightSliceModeChange"
  | "setMixLeftSettings"
  | "setMixRightSettings"
  | "resetSliceSettings"
  | "resetLeftSliceSettings"
  | "resetRightSliceSettings"
  | "sliceSettingsApplied"
  | "leftSliceSettingsApplied"
  | "rightSliceSettingsApplied"
  | "generateVisibleWords"
  | "findWord"
  | "findSecondaryWord"
  | "apiHealth"
  | "combinedSplitIsSaved"
  | "toggleCombinedSaved"
  | "savedWords"
  | "savedOpen"
  | "setSavedOpen"
  | "savedMenuRef"
  | "saveWords"
  | "loadSavedWord"
> & {
  /** Admin embed: replace the mixed combo word with this text when non-empty. */
  embedOverrideText?: string | null;
};

export function DiscoverView(props: DiscoverViewProps) {
  const {
    mobileDiscoverPanel,
    isMobileLayout,
    moveThroughSplitHistory,
    closeMobileDiscoverPanel,
    leftSettingsApplied,
    rightSettingsApplied,
    resetPrimarySettings,
    resetSecondarySettings,
    leftWordDraft,
    rightWordDraft,
    handleLeftWordDraftChange,
    handleRightWordDraftChange,
    wordType,
    setWordType,
    wordRelatedTo,
    setWordRelatedTo,
    wordSyllables,
    setWordSyllables,
    wordSyllableMode,
    setWordSyllableMode,
    wordStartsWith,
    setWordStartsWith,
    wordEndsWith,
    setWordEndsWith,
    wordLetters,
    setWordLetters,
    wordLengthMode,
    setWordLengthMode,
    secondaryWordType,
    setSecondaryWordType,
    secondaryWordRelatedTo,
    setSecondaryWordRelatedTo,
    secondaryWordSyllables,
    setSecondaryWordSyllables,
    secondaryWordSyllableMode,
    setSecondaryWordSyllableMode,
    secondaryWordStartsWith,
    setSecondaryWordStartsWith,
    secondaryWordEndsWith,
    setSecondaryWordEndsWith,
    secondaryWordLetters,
    setSecondaryWordLetters,
    secondaryWordLengthMode,
    setSecondaryWordLengthMode,
    wordCopyStatus,
    setWordCopyStatus,
    leftWordValue,
    rightWordValue,
    displayedCombinedWord,
    displayedDomain,
    displayedHandleBase,
    displayedName,
    nameDisplayMode,
    setNameDisplayMode,
    selectedTld,
    setSelectedTld,
    copyDisplayedWord,
    mixedWordParts,
    loading,
    secondaryLoading,
    splitBatchLoading,
    result,
    secondaryResult,
    displayedPronunciation,
    secondaryPronunciation,
    effectiveMixLeftSettings,
    effectiveMixRightSettings,
    leftSliceMode,
    rightSliceMode,
    mixLeftSettings,
    mixRightSettings,
    handleLeftSliceModeChange,
    handleRightSliceModeChange,
    setMixLeftSettings,
    setMixRightSettings,
    resetSliceSettings,
    resetLeftSliceSettings,
    resetRightSliceSettings,
    sliceSettingsApplied,
    leftSliceSettingsApplied,
    rightSliceSettingsApplied,
    generateVisibleWords,
    findWord,
    findSecondaryWord,
    apiHealth,
    combinedSplitIsSaved,
    toggleCombinedSaved,
    savedWords,
    savedOpen,
    setSavedOpen,
    savedMenuRef,
    saveWords,
    loadSavedWord,
    embedOverrideText,
  } = props;
  const leftIsGenerating = loading || splitBatchLoading;
  const rightIsGenerating = secondaryLoading || splitBatchLoading;
  const overrideWord = embedOverrideText?.trim() ?? "";
  const hasOverrideWord = overrideWord.length > 0;
  const effectiveDisplayedName = hasOverrideWord ? overrideWord : displayedName;

  useHistorySideTap({
    enabled: isMobileLayout && !mobileDiscoverPanel,
    onBack: () => moveThroughSplitHistory(-1),
    onForward: () => moveThroughSplitHistory(1),
  });

  const leftSettingsContent = (idPrefix: string) => (
    <>
      <div className="settings-panel-header">
        <p>Left word</p>
        <div className="settings-panel-header-actions">
          <button
            className={leftSettingsApplied ? undefined : "settings-reset-placeholder"}
            type="button"
            aria-hidden={!leftSettingsApplied}
            tabIndex={leftSettingsApplied ? undefined : -1}
            onClick={() => {
              sounds.drop();
              resetPrimarySettings();
            }}
          >
            <RefreshCw size={12} strokeWidth={1.5} aria-hidden="true" />
            Reset
          </button>
          <button className="mobile-panel-close" type="button" aria-label="Close left word settings" onClick={closeMobileDiscoverPanel}>
            <X size={14} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>
      <SettingsPanelScroll>
        <div className="settings-group">
          <TagEntrySetting
            id={`${idPrefix}split-left-text`}
            label="Text"
            value={leftWordDraft}
            placeholder="Add fixed words to randomize"
            onChange={handleLeftWordDraftChange}
          />
        </div>
        <fieldset className="settings-filter-set" disabled={parseTags(leftWordDraft).length > 0}>
          <div className="settings-group">
            <WordTypeTabs className="split-side-types" value={wordType} label="Left word type" onChange={setWordType} />
          </div>
          <div className="settings-group">
            <RelatedToSetting id={`${idPrefix}split-left-related`} value={wordRelatedTo} onChange={setWordRelatedTo} />
          </div>
          <div className="settings-group">
            <SyllableCountSetting
              id={`${idPrefix}left-syllable-count`}
              value={wordSyllables}
              mode={wordSyllableMode}
              onValueChange={setWordSyllables}
              onModeChange={setWordSyllableMode}
            />
          </div>
          <div className="settings-group">
            <AffixSettings startsWith={wordStartsWith} endsWith={wordEndsWith} onStartsChange={setWordStartsWith} onEndsChange={setWordEndsWith} />
            <WordLengthSetting id={`${idPrefix}left-word-length`} value={wordLetters} mode={wordLengthMode} onValueChange={setWordLetters} onModeChange={setWordLengthMode} />
          </div>
        </fieldset>
      </SettingsPanelScroll>
    </>
  );

  const rightSettingsContent = (idPrefix: string) => (
    <>
      <div className="settings-panel-header">
        <p>Right word</p>
        <div className="settings-panel-header-actions">
          <button
            className={rightSettingsApplied ? undefined : "settings-reset-placeholder"}
            type="button"
            aria-hidden={!rightSettingsApplied}
            tabIndex={rightSettingsApplied ? undefined : -1}
            onClick={() => {
              sounds.drop();
              resetSecondarySettings();
            }}
          >
            <RefreshCw size={12} strokeWidth={1.5} aria-hidden="true" />
            Reset
          </button>
          <button className="mobile-panel-close" type="button" aria-label="Close right word settings" onClick={closeMobileDiscoverPanel}>
            <X size={14} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>
      <SettingsPanelScroll>
        <div className="settings-group">
          <TagEntrySetting
            id={`${idPrefix}split-right-text`}
            label="Text"
            value={rightWordDraft}
            placeholder="Add fixed words to randomize"
            onChange={handleRightWordDraftChange}
          />
        </div>
        <fieldset className="settings-filter-set" disabled={parseTags(rightWordDraft).length > 0}>
          <div className="settings-group">
            <WordTypeTabs className="split-side-types" value={secondaryWordType} label="Right word type" onChange={setSecondaryWordType} />
          </div>
          <div className="settings-group">
            <RelatedToSetting id={`${idPrefix}split-right-related`} value={secondaryWordRelatedTo} onChange={setSecondaryWordRelatedTo} />
          </div>
          <div className="settings-group">
            <SyllableCountSetting
              id={`${idPrefix}right-syllable-count`}
              value={secondaryWordSyllables}
              mode={secondaryWordSyllableMode}
              onValueChange={setSecondaryWordSyllables}
              onModeChange={setSecondaryWordSyllableMode}
            />
          </div>
          <div className="settings-group">
            <AffixSettings startsWith={secondaryWordStartsWith} endsWith={secondaryWordEndsWith} onStartsChange={setSecondaryWordStartsWith} onEndsChange={setSecondaryWordEndsWith} />
            <WordLengthSetting id={`${idPrefix}right-word-length`} value={secondaryWordLetters} mode={secondaryWordLengthMode} onValueChange={setSecondaryWordLetters} onModeChange={setSecondaryWordLengthMode} />
          </div>
        </fieldset>
      </SettingsPanelScroll>
    </>
  );

  return (
    <>
      <div className="discover-top-brand">
        <div className="style-toolbar">
          <div className="style-toolbar-actions style-toolbar-actions-left">
            <DesktopTooltip label="Change theme">
              <ColorwaySwitcher />
            </DesktopTooltip>
            <DesktopTooltip label="Saved words">
              <SavedWordsPanel
                savedWords={savedWords}
                savedOpen={savedOpen}
                setSavedOpen={setSavedOpen}
                savedMenuRef={savedMenuRef}
                saveWords={saveWords}
                loadSavedWord={loadSavedWord}
              />
            </DesktopTooltip>
            <DesktopTooltip label={combinedSplitIsSaved ? "Remove saved word" : "Save this word"}>
              <SaveHeartButton
                liked={combinedSplitIsSaved}
                disabled={!displayedCombinedWord}
                onToggle={toggleCombinedSaved}
              />
            </DesktopTooltip>
          </div>
          <DesktopTooltip label="Name format">
            <DomainModeControls
              className="top-domain-mode-controls"
              displayMode={nameDisplayMode}
              selectedTld={selectedTld}
              onDisplayModeChange={setNameDisplayMode}
              onTldChange={setSelectedTld}
            />
          </DesktopTooltip>
          <div className="style-toolbar-actions style-toolbar-actions-right">
            <DesktopTooltip label="Switch font">
              <TypographyControls />
            </DesktopTooltip>
            <DesktopTooltip label="Toggle sound">
              <SoundToggle />
            </DesktopTooltip>
            <DesktopTooltip label="About Spellsurf">
              <AboutDrawer />
            </DesktopTooltip>
            <DesktopTooltip label="Spellsurf Drops newsletter">
              <Link className="drops-nav-link" href="/drops">Get Drops <span aria-hidden="true">↗</span></Link>
            </DesktopTooltip>
          </div>
        </div>
        {nameDisplayMode === "domain" && displayedDomain ? (
          <DomainAvailability className="top-domain-availability" domain={displayedDomain} />
        ) : null}
        {nameDisplayMode === "handle" && displayedHandleBase ? (
          <HandleAvailability className="top-domain-availability" handle={displayedHandleBase} />
        ) : null}
        <ApiHealthStatus health={apiHealth} />
      </div>
      <section className="split-word-stage" id="top" aria-live="polite">
        <div className="split-sidebar-stack left">
          <aside
            className="split-settings-panel left rounded-[32px] desktop-layout-only" /* corner-squircle */
            aria-label="Left word settings"
          >
            {leftSettingsContent("desktop-")}
          </aside>
          <SliceSidePanel
            side="left"
            word={leftWordValue}
            sliceMode={leftSliceMode}
            settings={mixLeftSettings}
            syllables={result.syllables}
            onSliceModeChange={handleLeftSliceModeChange}
            onChange={setMixLeftSettings}
            onReset={resetLeftSliceSettings}
            settingsApplied={leftSliceSettingsApplied}
          />
        </div>

        <div className="split-word-anchor">
          <div className="copyable-word-wrap split-copyable-word-wrap">
                <WordCopyHint status={wordCopyStatus} />
                <button
                  className="split-combined-word copyable-word mix-combined-word"
                  type="button"
                  disabled={
                    hasOverrideWord
                      ? false
                      : !leftWordValue || !rightWordValue || loading || secondaryLoading || splitBatchLoading
                  }
                  aria-label={`Copy ${effectiveDisplayedName}`}
                  onClick={() => void copyDisplayedWord(effectiveDisplayedName)}
                  onPointerEnter={() => {
                    if (wordCopyStatus === "hidden") setWordCopyStatus("idle");
                  }}
                >
                  {hasOverrideWord ? (
                    <span className="mix-word-part" key={`override-${overrideWord}`}>
                      {overrideWord}
                    </span>
                  ) : (
                    <>
                      {nameDisplayMode === "handle" && displayedCombinedWord ? (
                        <span className="handle-at" aria-hidden="true">@</span>
                      ) : null}
                      <span
                        className={`mix-word-part${leftIsGenerating ? " is-generating" : ""}`}
                        key={`mix-left-${mixedWordParts.leftChunk}`}
                      >
                        {mixedWordParts.leftChunk || "——"}
                      </span>
                      <span
                        className={`mix-word-part${rightIsGenerating ? " is-generating" : ""}`}
                        data-view-transition-word
                        key={`mix-right-${mixedWordParts.rightChunk}`}
                      >
                        {mixedWordParts.rightChunk || "——"}
                      </span>
                      {nameDisplayMode === "domain" && displayedCombinedWord ? (
                        <span className="domain-tld">{selectedTld}</span>
                      ) : null}
                    </>
                  )}
                </button>
          </div>
          <div className="split-definitions">
            {[{ word: result, pronunciation: displayedPronunciation }, { word: secondaryResult, pronunciation: secondaryPronunciation }].map((item, index) => (
              <article
                data-view-transition-card={index === 1 ? "" : undefined}
                key={index}
              >
                {item.word.word ? <div
                  className={`split-word-details${(index === 0 ? leftIsGenerating : rightIsGenerating) ? " is-generating" : ""}`}
                  key={`${index}-${item.word.word}`}
                >
                  <MixSourceWord
                    word={item.word.word}
                    settings={index === 0 ? effectiveMixLeftSettings : effectiveMixRightSettings}
                    syllableCount={item.word.syllables}
                    className=""
                  />
                  <p className="split-eyebrow">
                    {index === 0 && item.pronunciation ? <><span className="pronunciation-inline">{item.pronunciation}</span><span>·</span></> : null}
                    {item.word.partOfSpeech || "word"}
                    {index === 1 && item.pronunciation ? <><span>·</span><span className="pronunciation-inline">{item.pronunciation}</span></> : null}
                  </p>
                  <div className="rule" aria-hidden="true" />
                  <SplitDescription>
                    {item.word.definition || "Generate a word to begin."}
                  </SplitDescription>
                </div> : null}
              </article>
            ))}
          </div>
        </div>

        <div className="split-sidebar-stack right">
          <aside
            className="split-settings-panel right rounded-[32px] desktop-layout-only" /* corner-squircle */
            aria-label="Right word settings"
          >
            {rightSettingsContent("desktop-")}
          </aside>
          <SliceSidePanel
            side="right"
            word={rightWordValue}
            sliceMode={rightSliceMode}
            settings={mixRightSettings}
            syllables={secondaryResult.syllables}
            onSliceModeChange={handleRightSliceModeChange}
            onChange={setMixRightSettings}
            onReset={resetRightSliceSettings}
            settingsApplied={rightSliceSettingsApplied}
          />
        </div>
      </section>

      <div className="mobile-layout-only">
        <aside
          className={["split-settings-panel left rounded-[32px]", /* "corner-squircle", */ mobileDiscoverPanel === "left" ? "mobile-panel-active" : ""].filter(Boolean).join(" ")}
          aria-label="Left word settings"
        >
          {leftSettingsContent("mobile-")}
        </aside>
        <SliceSettingsPanel
          leftWord={leftWordValue}
          rightWord={rightWordValue}
          leftSliceMode={leftSliceMode}
          rightSliceMode={rightSliceMode}
          leftSettings={mixLeftSettings}
          rightSettings={mixRightSettings}
          leftSyllables={result.syllables}
          rightSyllables={secondaryResult.syllables}
          onLeftSliceModeChange={handleLeftSliceModeChange}
          onRightSliceModeChange={handleRightSliceModeChange}
          onLeftChange={setMixLeftSettings}
          onRightChange={setMixRightSettings}
          onReset={resetSliceSettings}
          settingsApplied={sliceSettingsApplied}
          mobileActive={mobileDiscoverPanel === "slice"}
          onMobileClose={closeMobileDiscoverPanel}
        />
        <aside
          className={["split-settings-panel right rounded-[32px]", /* "corner-squircle", */ mobileDiscoverPanel === "right" ? "mobile-panel-active" : ""].filter(Boolean).join(" ")}
          aria-label="Right word settings"
        >
          {rightSettingsContent("mobile-")}
        </aside>
      </div>

      <div className="mobile-bottom-bar">
        {nameDisplayMode === "domain" ? (
          <div className="mobile-domain-availability-row">
            {displayedDomain ? (
              <DomainAvailability className="mobile-domain-availability" domain={displayedDomain} />
            ) : null}
            <TldDropdown value={selectedTld} onChange={setSelectedTld} />
          </div>
        ) : null}
        {nameDisplayMode === "handle" && displayedHandleBase ? (
          <div className="mobile-domain-availability-row">
            <HandleAvailability className="mobile-domain-availability" handle={displayedHandleBase} />
          </div>
        ) : null}
        <div className="mobile-bottom-meta-row">
          <DomainModeControls
            className="mobile-bottom-domain-mode-controls"
            displayMode={nameDisplayMode}
            selectedTld={selectedTld}
            hideTld
            onDisplayModeChange={setNameDisplayMode}
            onTldChange={setSelectedTld}
          />
        </div>
        <div className="mobile-generate-wrap">
          <ApiHealthStatus health={apiHealth} />
          <div className="mobile-generate-row">
            <button
              className="mobile-generate-button mobile-side-generate-button"
              type="button"
              aria-label="Generate left word"
              onClick={() => {
                sounds.tick();
                void findWord();
              }}
            >
              <ArrowLeft size={20} strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              className="mobile-generate-button"
              type="button"
              onClick={() => {
                sounds.tick();
                generateVisibleWords();
              }}
            >
              Generate
            </button>
            <button
              className="mobile-generate-button mobile-side-generate-button"
              type="button"
              aria-label="Generate right word"
              onClick={() => {
                sounds.tick();
                void findSecondaryWord();
              }}
            >
              <ArrowRight size={20} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
