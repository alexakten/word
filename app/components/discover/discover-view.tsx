"use client";

import { RefreshCw, X } from "lucide-react";
import { AffixSettings } from "../discover/affix-settings";
import { DiscoverStartPrompt } from "../discover/discover-start-prompt";
import { MixSourceWord } from "../discover/mix-source-word";
import { RelatedToSetting } from "../discover/related-to-setting";
import { SliceSettingsPanel, SliceSidePanel } from "../discover/slice-settings-panel";
import { SplitDescription } from "../discover/split-description";
import { SyllableCountSetting } from "../discover/syllable-count-setting";
import { WordCopyHint } from "../discover/word-copy-hint";
import { WordLengthSetting } from "../discover/word-length-setting";
import { WordTypeTabs } from "../ui/word-type-tabs";
import { cardo } from "../../fonts";
import type { HomeState } from "../../hooks/use-home";

export type DiscoverViewProps = Pick<
  HomeState,
  | "isMobileLayout"
  | "mobileDiscoverPanel"
  | "closeMobileDiscoverPanel"
  | "leftSettingsApplied"
  | "rightSettingsApplied"
  | "resetPrimarySettings"
  | "resetSecondarySettings"
  | "leftWordDraft"
  | "rightWordDraft"
  | "handleLeftWordDraftChange"
  | "handleRightWordDraftChange"
  | "setExplicitSplitWord"
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
  | "discoverHasNoWords"
  | "wordCopyStatus"
  | "setWordCopyStatus"
  | "leftWordValue"
  | "rightWordValue"
  | "displayedCombinedWord"
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
>;

export function DiscoverView(props: DiscoverViewProps) {
  const {
    isMobileLayout,
    mobileDiscoverPanel,
    closeMobileDiscoverPanel,
    leftSettingsApplied,
    rightSettingsApplied,
    resetPrimarySettings,
    resetSecondarySettings,
    leftWordDraft,
    rightWordDraft,
    handleLeftWordDraftChange,
    handleRightWordDraftChange,
    setExplicitSplitWord,
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
    discoverHasNoWords,
    wordCopyStatus,
    setWordCopyStatus,
    leftWordValue,
    rightWordValue,
    displayedCombinedWord,
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
  } = props;

  const leftSettingsContent = (
    <>
      <div className="settings-panel-header">
        <p>Left word</p>
        <div className="settings-panel-header-actions">
          <button
            className={leftSettingsApplied ? undefined : "settings-reset-placeholder"}
            type="button"
            aria-hidden={!leftSettingsApplied}
            tabIndex={leftSettingsApplied ? undefined : -1}
            onClick={resetPrimarySettings}
          >
            <RefreshCw size={12} strokeWidth={1.5} aria-hidden="true" />
            Reset
          </button>
          {isMobileLayout ? (
            <button className="mobile-panel-close" type="button" aria-label="Close left word settings" onClick={closeMobileDiscoverPanel}>
              <X size={14} strokeWidth={1.5} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
      <div className="settings-panel-scroll">
        <div className="settings-group">
          <label className="split-setting-field boxed-setting-field">
            <span>Text</span>
            <input
              value={leftWordDraft}
              placeholder="Optional fixed text"
              maxLength={40}
              onChange={(event) => handleLeftWordDraftChange(event.target.value)}
              onBlur={() => void setExplicitSplitWord("left", leftWordDraft)}
              onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
            />
          </label>
        </div>
        <fieldset className="settings-filter-set" disabled={Boolean(leftWordDraft.trim())}>
          <div className="settings-group">
            <WordTypeTabs className="split-side-types" value={wordType} label="Left word type" onChange={setWordType} />
          </div>
          <div className="settings-group">
            <RelatedToSetting id="split-left-related" value={wordRelatedTo} onChange={setWordRelatedTo} />
          </div>
          <div className="settings-group">
            <SyllableCountSetting
              id="left-syllable-count"
              value={wordSyllables}
              mode={wordSyllableMode}
              onValueChange={setWordSyllables}
              onModeChange={setWordSyllableMode}
            />
          </div>
          <div className="settings-group">
            <AffixSettings startsWith={wordStartsWith} endsWith={wordEndsWith} onStartsChange={setWordStartsWith} onEndsChange={setWordEndsWith} />
            <WordLengthSetting id="left-word-length" value={wordLetters} mode={wordLengthMode} onValueChange={setWordLetters} onModeChange={setWordLengthMode} />
          </div>
        </fieldset>
      </div>
    </>
  );

  const rightSettingsContent = (
    <>
      <div className="settings-panel-header">
        <p>Right word</p>
        <div className="settings-panel-header-actions">
          <button
            className={rightSettingsApplied ? undefined : "settings-reset-placeholder"}
            type="button"
            aria-hidden={!rightSettingsApplied}
            tabIndex={rightSettingsApplied ? undefined : -1}
            onClick={resetSecondarySettings}
          >
            <RefreshCw size={12} strokeWidth={1.5} aria-hidden="true" />
            Reset
          </button>
          {isMobileLayout ? (
            <button className="mobile-panel-close" type="button" aria-label="Close right word settings" onClick={closeMobileDiscoverPanel}>
              <X size={14} strokeWidth={1.5} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
      <div className="settings-panel-scroll">
        <div className="settings-group">
          <label className="split-setting-field boxed-setting-field">
            <span>Text</span>
            <input
              value={rightWordDraft}
              placeholder="Optional fixed text"
              maxLength={40}
              onChange={(event) => handleRightWordDraftChange(event.target.value)}
              onBlur={() => void setExplicitSplitWord("right", rightWordDraft)}
              onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
            />
          </label>
        </div>
        <fieldset className="settings-filter-set" disabled={Boolean(rightWordDraft.trim())}>
          <div className="settings-group">
            <WordTypeTabs className="split-side-types" value={secondaryWordType} label="Right word type" onChange={setSecondaryWordType} />
          </div>
          <div className="settings-group">
            <RelatedToSetting id="split-right-related" value={secondaryWordRelatedTo} onChange={setSecondaryWordRelatedTo} />
          </div>
          <div className="settings-group">
            <SyllableCountSetting
              id="right-syllable-count"
              value={secondaryWordSyllables}
              mode={secondaryWordSyllableMode}
              onValueChange={setSecondaryWordSyllables}
              onModeChange={setSecondaryWordSyllableMode}
            />
          </div>
          <div className="settings-group">
            <AffixSettings startsWith={secondaryWordStartsWith} endsWith={secondaryWordEndsWith} onStartsChange={setSecondaryWordStartsWith} onEndsChange={setSecondaryWordEndsWith} />
            <WordLengthSetting id="right-word-length" value={secondaryWordLetters} mode={secondaryWordLengthMode} onValueChange={setSecondaryWordLetters} onModeChange={setSecondaryWordLengthMode} />
          </div>
        </fieldset>
      </div>
    </>
  );

  return (
    <>
      <section className="split-word-stage" id="top" aria-live="polite">
        {isMobileLayout ? (
          <aside
            className={[
              "split-settings-panel left rounded-3xl",
              mobileDiscoverPanel === "left" ? "mobile-panel-active" : "",
            ].filter(Boolean).join(" ")}
            aria-label="Left word settings"
            aria-hidden={mobileDiscoverPanel !== "left"}
          >
            {leftSettingsContent}
          </aside>
        ) : (
          <div className="split-sidebar-stack left">
            <aside className="split-settings-panel left rounded-3xl" aria-label="Left word settings">
              {leftSettingsContent}
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
        )}

        <div className="split-word-anchor">
          {discoverHasNoWords ? (
            <DiscoverStartPrompt />
          ) : (
            <>
              <div className="copyable-word-wrap split-copyable-word-wrap">
                <WordCopyHint status={wordCopyStatus} />
                <button
                  className={`split-combined-word copyable-word mix-combined-word ${cardo.className}`}
                  type="button"
                  disabled={!leftWordValue || !rightWordValue}
                  aria-label={`Copy ${displayedCombinedWord}`}
                  onClick={() => void copyDisplayedWord(displayedCombinedWord)}
                  onPointerEnter={() => {
                    if (wordCopyStatus === "hidden") setWordCopyStatus("idle");
                  }}
                >
                  <span className={`mix-word-part${(loading || splitBatchLoading) && mixedWordParts.leftChunk ? " loading" : ""}`} key={`mix-left-${mixedWordParts.leftChunk}`}>{mixedWordParts.leftChunk || "——"}</span>
                  <span className={`mix-word-part${(secondaryLoading || splitBatchLoading) && mixedWordParts.rightChunk ? " loading" : ""}`} data-view-transition-word key={`mix-right-${mixedWordParts.rightChunk}`}>{mixedWordParts.rightChunk || "——"}</span>
                </button>
              </div>
              <div className="split-definitions">
                {[{ word: result, pronunciation: displayedPronunciation }, { word: secondaryResult, pronunciation: secondaryPronunciation }].map((item, index) => (
                  <article
                    className={item.word.word && (splitBatchLoading || (index === 0 ? loading : secondaryLoading)) ? "loading" : ""}
                    data-view-transition-card={index === 1 ? "" : undefined}
                    key={index}
                  >
                    {item.word.word ? <div className="split-word-details" key={`${index}-${item.word.word}`}>
                      <MixSourceWord
                        word={item.word.word}
                        settings={index === 0 ? effectiveMixLeftSettings : effectiveMixRightSettings}
                        syllableCount={item.word.syllables}
                        className={cardo.className}
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
            </>
          )}
        </div>

        {isMobileLayout ? (
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
        ) : null}

        {isMobileLayout ? (
          <aside
            className={[
              "split-settings-panel right rounded-3xl",
              mobileDiscoverPanel === "right" ? "mobile-panel-active" : "",
            ].filter(Boolean).join(" ")}
            aria-label="Right word settings"
            aria-hidden={mobileDiscoverPanel !== "right"}
          >
            {rightSettingsContent}
          </aside>
        ) : (
          <div className="split-sidebar-stack right">
            <aside className="split-settings-panel right rounded-3xl" aria-label="Right word settings">
              {rightSettingsContent}
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
        )}
      </section>

      {isMobileLayout ? (
        <div className="mobile-bottom-bar">
          <button className="mobile-generate-button" type="button" onClick={() => generateVisibleWords()}>
            {discoverHasNoWords ? "Start exploring" : "Generate"}
          </button>
        </div>
      ) : null}
    </>
  );
}
