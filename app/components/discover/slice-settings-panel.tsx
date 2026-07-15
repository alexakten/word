"use client";

import { RefreshCw, X } from "lucide-react";
import type { MixSideSettings, SliceMode } from "../../syllables";
import { MixSideSetting } from "./mix-side-setting";

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
      className={["split-slice-panel rounded-3xl", mobileActive ? "mobile-panel-active" : ""].filter(Boolean).join(" ")}
      aria-label="Slice settings"
      aria-hidden={onMobileClose ? !mobileActive : undefined}
    >
      <div className="settings-panel-header">
        <p>Slice words</p>
        <div className="settings-panel-header-actions">
          <button
            className={settingsApplied ? undefined : "settings-reset-placeholder"}
            type="button"
            aria-hidden={!settingsApplied}
            tabIndex={settingsApplied ? undefined : -1}
            onClick={onReset}
          >
            <RefreshCw size={12} strokeWidth={1.5} aria-hidden="true" />
            Reset
          </button>
          {onMobileClose ? (
            <button className="mobile-panel-close" type="button" aria-label="Close slice settings" onClick={onMobileClose}>
              <X size={14} strokeWidth={1.5} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
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
    </aside>
  );
}
