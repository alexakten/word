"use client";

import { RefreshCw, X } from "lucide-react";
import { sounds } from "../../lib/sounds";
import type { MixSideSettings, SliceMode } from "../../syllables";
import { MixSideSetting } from "./mix-side-setting";
import { SettingsPanelScroll } from "./settings-panel-scroll";

type SliceSide = "left" | "right";

function SlicePanelHeader({ title, settingsApplied, onReset, onMobileClose }: {
  title: string;
  settingsApplied: boolean;
  onReset: () => void;
  onMobileClose?: () => void;
}) {
  return (
    <div className="settings-panel-header">
      <p>{title}</p>
      <div className="settings-panel-header-actions">
        <button
          className={settingsApplied ? undefined : "settings-reset-placeholder"}
          type="button"
          aria-hidden={!settingsApplied}
          tabIndex={settingsApplied ? undefined : -1}
          onClick={() => {
            sounds.drop();
            onReset();
          }}
        >
          <RefreshCw size={12} strokeWidth={1.5} aria-hidden="true" />
          Reset
        </button>
        {onMobileClose ? (
          <button className="mobile-panel-close" type="button" aria-label={`Close ${title.toLowerCase()}`} onClick={onMobileClose}>
            <X size={14} strokeWidth={1.5} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function SliceSidePanel({ side, word, sliceMode, settings, syllables, onSliceModeChange, onChange, onReset, settingsApplied }: {
  side: SliceSide;
  word: string;
  sliceMode: SliceMode;
  settings: MixSideSettings;
  syllables?: number;
  onSliceModeChange: (mode: SliceMode) => void;
  onChange: (settings: MixSideSettings) => void;
  onReset: () => void;
  settingsApplied: boolean;
}) {
  const labelPrefix = side === "left" ? "Left word" : "Right word";
  const title = side === "left" ? "Slice left" : "Slice right";

  return (
    <aside
      className={`split-slice-panel ${side} rounded-[32px]`} /* corner-squircle */
      aria-label={`${labelPrefix} slice settings`}
    >
      <SlicePanelHeader title={title} settingsApplied={settingsApplied} onReset={onReset} />
      <SettingsPanelScroll>
        <MixSideSetting
          labelPrefix={labelPrefix}
          word={word}
          settings={settings}
          sliceMode={sliceMode}
          syllableCount={syllables}
          hasWord={Boolean(word)}
          onChange={onChange}
          onSliceModeChange={onSliceModeChange}
        />
      </SettingsPanelScroll>
    </aside>
  );
}

export function SliceSettingsPanel({ leftWord, rightWord, leftSliceMode, rightSliceMode, leftSettings, rightSettings, leftSyllables, rightSyllables, onLeftSliceModeChange, onRightSliceModeChange, onLeftChange, onRightChange, onReset, settingsApplied, mobileActive = false, onMobileClose }: {
  leftWord: string;
  rightWord: string;
  leftSliceMode: SliceMode;
  rightSliceMode: SliceMode;
  leftSettings: MixSideSettings;
  rightSettings: MixSideSettings;
  leftSyllables?: number;
  rightSyllables?: number;
  onLeftSliceModeChange: (mode: SliceMode) => void;
  onRightSliceModeChange: (mode: SliceMode) => void;
  onLeftChange: (settings: MixSideSettings) => void;
  onRightChange: (settings: MixSideSettings) => void;
  onReset: () => void;
  settingsApplied: boolean;
  mobileActive?: boolean;
  onMobileClose?: () => void;
}) {
  return (
    <aside
      className={["split-slice-panel mobile-slice-panel rounded-[32px]", /* "corner-squircle", */ mobileActive ? "mobile-panel-active" : ""].filter(Boolean).join(" ")}
      aria-label="Slice settings"
      aria-hidden={onMobileClose ? !mobileActive : undefined}
    >
      <SlicePanelHeader
        title="Slice left"
        settingsApplied={settingsApplied}
        onReset={onReset}
        onMobileClose={onMobileClose}
      />
      <SettingsPanelScroll>
        <div className="slice-settings-grid">
          <div className="slice-settings-side">
            <MixSideSetting
              labelPrefix="Left word"
              word={leftWord}
              settings={leftSettings}
              sliceMode={leftSliceMode}
              syllableCount={leftSyllables}
              hasWord={Boolean(leftWord)}
              onChange={onLeftChange}
              onSliceModeChange={onLeftSliceModeChange}
            />
          </div>
          <div className="slice-settings-side">
            <div className="settings-panel-header slice-side-title">
              <p>Slice right</p>
            </div>
            <MixSideSetting
              labelPrefix="Right word"
              word={rightWord}
              settings={rightSettings}
              sliceMode={rightSliceMode}
              syllableCount={rightSyllables}
              hasWord={Boolean(rightWord)}
              onChange={onRightChange}
              onSliceModeChange={onRightSliceModeChange}
            />
          </div>
        </div>
      </SettingsPanelScroll>
    </aside>
  );
}
