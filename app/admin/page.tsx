"use client";

import { Camera, Eye, EyeOff, Focus, LoaderCircle, RefreshCw, Type, ZoomIn, ZoomOut } from "lucide-react";
import { domToPng } from "modern-screenshot";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  defaultExportScaleForPreset,
  exportScalesForPreset,
  maxExportScaleForPreset,
  SOCIAL_PRESETS,
  type ExportScale,
  type SocialPreset,
} from "../lib/admin-presets";
import { clampColumnRem, EMBED_MESSAGE_TYPE } from "../lib/embed-bridge";

const DEFAULT_PRESET = SOCIAL_PRESETS[0]!;
const EMBED_SRC = "/?embed=1";
const MIN_ZOOM = 50;
const MAX_ZOOM = 400;
const ZOOM_STEP = 5;
const MIN_COLUMN_REM = 6;
const MAX_COLUMN_REM = 40;
const COLUMN_STEP = 1;
const DEFAULT_COLUMN_REM = 28;

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export default function AdminPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [presetId, setPresetId] = useState(DEFAULT_PRESET.id);
  const [exportScale, setExportScale] = useState<ExportScale>(() => defaultExportScaleForPreset(DEFAULT_PRESET));
  const [fitScale, setFitScale] = useState(0.35);
  const [contentZoomPercent, setContentZoomPercent] = useState(100);
  const [leftColumnRem, setLeftColumnRem] = useState(DEFAULT_COLUMN_REM);
  const [rightColumnRem, setRightColumnRem] = useState(DEFAULT_COLUMN_REM);
  const [focusMode, setFocusMode] = useState(true);
  const [hideDescriptions, setHideDescriptions] = useState(false);
  const [comboOnly, setComboOnly] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);
  const [error, setError] = useState("");
  const [frameKey, setFrameKey] = useState(0);

  const preset = SOCIAL_PRESETS.find((entry) => entry.id === presetId) ?? DEFAULT_PRESET;
  const contentZoom = contentZoomPercent / 100;
  const exportScaleOptions = exportScalesForPreset(preset);
  const maxScale = maxExportScaleForPreset(preset);
  const activeExportScale = Math.min(exportScale, maxScale);

  useEffect(() => {
    const nextDefault = defaultExportScaleForPreset(preset);
    setExportScale((current) => (current > maxScale ? nextDefault : current));
  }, [maxScale, preset]);

  const postEmbedState = useCallback((next?: {
    focusMode?: boolean;
    hideDescriptions?: boolean;
    comboOnly?: boolean;
    captureMode?: boolean;
    captureScale?: number;
    captureWidth?: number;
    captureHeight?: number;
    contentZoom?: number;
    leftColumnRem?: number;
    rightColumnRem?: number;
  }) => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;
    frame.postMessage(
      {
        type: EMBED_MESSAGE_TYPE,
        focusMode: next?.focusMode ?? focusMode,
        hideDescriptions: next?.hideDescriptions ?? hideDescriptions,
        comboOnly: next?.comboOnly ?? comboOnly,
        captureMode: next?.captureMode ?? false,
        captureScale: next?.captureScale ?? 1,
        captureWidth: next?.captureWidth ?? preset.width,
        captureHeight: next?.captureHeight ?? preset.height,
        contentZoom: next?.contentZoom ?? contentZoom,
        leftColumnRem: next?.leftColumnRem ?? leftColumnRem,
        rightColumnRem: next?.rightColumnRem ?? rightColumnRem,
      },
      window.location.origin,
    );
  }, [comboOnly, contentZoom, focusMode, hideDescriptions, leftColumnRem, preset.height, preset.width, rightColumnRem]);

  const updateFitScale = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const styles = getComputedStyle(stage);
    const padX = Number.parseFloat(styles.paddingLeft) + Number.parseFloat(styles.paddingRight);
    const padY = Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
    const availableWidth = Math.max(240, stage.clientWidth - padX);
    const availableHeight = Math.max(240, stage.clientHeight - padY);
    // Fill the stage; capture still uses the preset pixel size inside the iframe.
    const next = Math.min(availableWidth / preset.width, availableHeight / preset.height);
    setFitScale(Number.isFinite(next) && next > 0 ? next : 0.35);
  }, [preset.height, preset.width]);

  useEffect(() => {
    updateFitScale();
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateFitScale);
      return () => window.removeEventListener("resize", updateFitScale);
    }
    const observer = new ResizeObserver(() => updateFitScale());
    observer.observe(stage);
    return () => observer.disconnect();
  }, [updateFitScale]);

  useEffect(() => {
    setIframeReady(false);
    setError("");
  }, [presetId, frameKey]);

  useEffect(() => {
    if (!iframeReady) return;
    postEmbedState();
  }, [iframeReady, postEmbedState]);

  const reloadPreview = () => {
    setFrameKey((value) => value + 1);
  };

  const setZoom = (percent: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, percent));
    setContentZoomPercent(next);
    postEmbedState({ contentZoom: next / 100 });
  };

  const setLeftWidth = (rem: number) => {
    const next = clampColumnRem(rem);
    setLeftColumnRem(next);
    postEmbedState({ leftColumnRem: next });
  };

  const setRightWidth = (rem: number) => {
    const next = clampColumnRem(rem);
    setRightColumnRem(next);
    postEmbedState({ rightColumnRem: next });
  };

  const toggleFocusMode = () => {
    const next = !focusMode;
    setFocusMode(next);
    postEmbedState({ focusMode: next });
  };

  const toggleDescriptions = () => {
    const next = !hideDescriptions;
    setHideDescriptions(next);
    postEmbedState({ hideDescriptions: next });
  };

  const toggleComboOnly = () => {
    const next = !comboOnly;
    setComboOnly(next);
    postEmbedState({ comboOnly: next });
  };

  const capture = async () => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    const win = iframe?.contentWindow;
    const root = doc?.documentElement;
    if (!iframe || !doc || !win || !root) {
      setError("Preview is not ready yet.");
      return;
    }

    const scale = activeExportScale;
    const exportW = preset.width * scale;
    const exportH = preset.height * scale;
    const previousWidth = iframe.style.width;
    const previousHeight = iframe.style.height;
    const previousTransform = iframe.style.transform;

    setCapturing(true);
    setError("");
    try {
      // Expand the iframe to the export pixel grid and multiply real type sizes so
      // Chromium shapes glyphs at final resolution (deviceScaleFactor / DPI equivalent).
      iframe.style.width = `${exportW}px`;
      iframe.style.height = `${exportH}px`;
      iframe.style.transform = `scale(${fitScale / scale})`;
      postEmbedState({
        captureMode: true,
        focusMode: true,
        captureScale: scale,
        captureWidth: preset.width,
        captureHeight: preset.height,
      });
      await win.document.fonts.ready.catch(() => undefined);
      await new Promise((resolve) => {
        win.requestAnimationFrame(() => win.requestAnimationFrame(() => resolve(undefined)));
      });
      await new Promise((resolve) => window.setTimeout(resolve, 400));

      const backgroundColor = doc.body
        ? getComputedStyle(doc.body).backgroundColor || "#f9fafc"
        : "#f9fafc";

      // Rasterize 1:1 from the already high-res layout — do not pass scale>1 (that upscales soft bitmaps).
      const dataUrl = await domToPng(root, {
        width: exportW,
        height: exportH,
        scale: 1,
        backgroundColor,
      });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      downloadDataUrl(
        dataUrl,
        `spellsurf-${preset.id}-${exportW}x${exportH}-${stamp}.png`,
      );
    } catch (captureError) {
      console.error(captureError);
      setError("Capture failed. Try a lower scale or reload the preview.");
    } finally {
      iframe.style.width = previousWidth;
      iframe.style.height = previousHeight;
      iframe.style.transform = previousTransform;
      postEmbedState({
        captureMode: false,
        captureScale: 1,
        captureWidth: preset.width,
        captureHeight: preset.height,
        focusMode,
      });
      setCapturing(false);
    }
  };

  const frameWidth = preset.width * fitScale;
  const frameHeight = preset.height * fitScale;
  const exportWidth = preset.width * activeExportScale;
  const exportHeight = preset.height * activeExportScale;

  return (
    <div className="admin-studio">
      <header className="admin-toolbar">
        <div className="admin-toolbar-brand">
          <span className="admin-toolbar-title">Spellsurf Admin</span>
          <span className="admin-toolbar-meta">Screenshot studio</span>
        </div>

        <div className="admin-toolbar-group" role="group" aria-label="Aspect ratio">
          {SOCIAL_PRESETS.map((entry) => (
            <PresetButton
              key={entry.id}
              preset={entry}
              active={entry.id === preset.id}
              onSelect={() => setPresetId(entry.id)}
            />
          ))}
        </div>

        <div className="admin-toolbar-group" role="group" aria-label="Export scale">
          {exportScaleOptions.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={["admin-chip", activeExportScale === entry.id ? "is-active" : ""].filter(Boolean).join(" ")}
              onClick={() => setExportScale(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="admin-toolbar-group admin-zoom-group" role="group" aria-label="Content zoom">
          <button
            type="button"
            className="admin-icon-button"
            onClick={() => setZoom(contentZoomPercent - ZOOM_STEP)}
            aria-label="Zoom content out"
            title="Zoom content out"
            disabled={contentZoomPercent <= MIN_ZOOM}
          >
            <ZoomOut size={15} strokeWidth={1.8} />
          </button>
          <label className="admin-zoom-control">
            <span className="admin-toolbar-meta">{contentZoomPercent}%</span>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={ZOOM_STEP}
              value={contentZoomPercent}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
          <button
            type="button"
            className="admin-icon-button"
            onClick={() => setZoom(contentZoomPercent + ZOOM_STEP)}
            aria-label="Zoom content in"
            title="Zoom content in"
            disabled={contentZoomPercent >= MAX_ZOOM}
          >
            <ZoomIn size={15} strokeWidth={1.8} />
          </button>
          {[100, 160, 200, 250].map((percent) => (
            <button
              key={percent}
              type="button"
              className={["admin-chip", contentZoomPercent === percent ? "is-active" : ""].filter(Boolean).join(" ")}
              onClick={() => setZoom(percent)}
              title={`Set content zoom to ${percent}%`}
            >
              {percent}%
            </button>
          ))}
        </div>

        <div className="admin-toolbar-group admin-zoom-group" role="group" aria-label="Description column widths">
          <label className="admin-zoom-control" title="Left description column width">
            <span className="admin-toolbar-meta">L {leftColumnRem}rem</span>
            <input
              type="range"
              min={MIN_COLUMN_REM}
              max={MAX_COLUMN_REM}
              step={COLUMN_STEP}
              value={leftColumnRem}
              disabled={hideDescriptions || comboOnly}
              onChange={(event) => setLeftWidth(Number(event.target.value))}
            />
          </label>
          <label className="admin-zoom-control" title="Right description column width">
            <span className="admin-toolbar-meta">R {rightColumnRem}rem</span>
            <input
              type="range"
              min={MIN_COLUMN_REM}
              max={MAX_COLUMN_REM}
              step={COLUMN_STEP}
              value={rightColumnRem}
              disabled={hideDescriptions || comboOnly}
              onChange={(event) => setRightWidth(Number(event.target.value))}
            />
          </label>
          <button
            type="button"
            className="admin-chip"
            disabled={hideDescriptions || comboOnly}
            onClick={() => {
              setLeftColumnRem(DEFAULT_COLUMN_REM);
              setRightColumnRem(DEFAULT_COLUMN_REM);
              postEmbedState({
                leftColumnRem: DEFAULT_COLUMN_REM,
                rightColumnRem: DEFAULT_COLUMN_REM,
              });
            }}
            title="Reset column widths"
          >
            Reset
          </button>
        </div>

        <div className="admin-toolbar-group" role="group" aria-label="Composition">
          <button
            type="button"
            className={["admin-chip", focusMode ? "is-active" : ""].filter(Boolean).join(" ")}
            onClick={toggleFocusMode}
            title="Hide chrome and focus the word"
          >
            <Focus size={13} strokeWidth={1.9} />
            <span>Focus</span>
          </button>
          <button
            type="button"
            className={["admin-chip", comboOnly ? "is-active" : ""].filter(Boolean).join(" ")}
            onClick={toggleComboOnly}
            title={comboOnly ? "Show source words and info" : "Show only the combo word, centered"}
          >
            <Type size={13} strokeWidth={1.9} />
            <span>Combo only</span>
          </button>
          <button
            type="button"
            className={["admin-chip", hideDescriptions ? "is-active" : ""].filter(Boolean).join(" ")}
            onClick={toggleDescriptions}
            disabled={comboOnly}
            title={hideDescriptions ? "Show definition text" : "Hide definition text (keep pronunciation)"}
          >
            {hideDescriptions ? <EyeOff size={13} strokeWidth={1.9} /> : <Eye size={13} strokeWidth={1.9} />}
            <span>{hideDescriptions ? "No defs" : "Descriptions"}</span>
          </button>
        </div>

        <div className="admin-toolbar-actions">
          <span className="admin-toolbar-meta">
            {exportWidth}×{exportHeight}
          </span>
          <button
            type="button"
            className="admin-icon-button"
            onClick={reloadPreview}
            aria-label="Reload preview"
            title="Reload preview"
          >
            <RefreshCw size={15} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            className="admin-capture-button"
            onClick={() => void capture()}
            disabled={capturing || !iframeReady}
          >
            {capturing ? (
              <LoaderCircle className="admin-spinner" size={15} strokeWidth={1.8} />
            ) : (
              <Camera size={15} strokeWidth={1.8} />
            )}
            <span>{capturing ? "Capturing…" : "Capture PNG"}</span>
          </button>
        </div>
      </header>

      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-stage" ref={stageRef}>
        <div
          className="admin-frame"
          style={{ width: frameWidth, height: frameHeight }}
          data-platform={preset.platform}
        >
          <iframe
            key={`${preset.id}-${frameKey}`}
            ref={iframeRef}
            className="admin-frame-iframe"
            title="Spellsurf preview"
            src={EMBED_SRC}
            style={{
              width: preset.width,
              height: preset.height,
              transform: `scale(${fitScale})`,
            }}
            onLoad={() => {
              setIframeReady(true);
              window.setTimeout(() => postEmbedState(), 50);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function PresetButton({
  preset,
  active,
  onSelect,
}: {
  preset: SocialPreset;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={["admin-chip", active ? "is-active" : ""].filter(Boolean).join(" ")}
      onClick={onSelect}
      title={`${preset.width}×${preset.height}`}
    >
      <span>{preset.label}</span>
      <span className="admin-chip-ratio">{preset.ratio}</span>
    </button>
  );
}
