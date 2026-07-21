"use client";

import { Camera, Check, Copy, Crop, Eye, EyeOff, Focus, ImagePlus, LoaderCircle, RefreshCw, Settings2, Type, X } from "lucide-react";
import { domToPng } from "modern-screenshot";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type PointerEvent, type WheelEvent } from "react";
import { AdminMenu } from "./components/admin-menu";
import { AdminSegmented } from "./components/admin-segmented";
import { AdminStepper } from "./components/admin-stepper";
import { AdminToggle } from "./components/admin-toggle";
import {
  BUILTIN_COLOR_COMBOS,
  findMatchingColorCombo,
  parseColorCombo,
  readLocalColorCombos,
  serializeColorCombo,
  upsertLocalColorCombo,
  slugifyComboId,
  type AdminColorCombo,
} from "../lib/admin-color-combos";
import {
  defaultExportScaleForPreset,
  exportScalesForPreset,
  maxExportScaleForPreset,
  SOCIAL_PRESETS,
  type ExportScale,
} from "../lib/admin-presets";
import { clampColumnRem, clampFontWeight, clampLetterSpacing, DEFAULT_EMBED_BACKGROUND, DEFAULT_EMBED_FONT, DEFAULT_EMBED_FONT_WEIGHT, DEFAULT_EMBED_LETTER_SPACING, DEFAULT_EMBED_TEXT, EMBED_FONT_OPTIONS, EMBED_FONT_WEIGHTS, EMBED_MESSAGE_TYPE, fontWeightLabel, isImageFile, MAX_EMBED_LETTER_SPACING, MIN_EMBED_LETTER_SPACING, normalizeHexColor, type EmbedFontFamily } from "../lib/embed-bridge";

const EMBED_FONT_FAMILY_CSS: Record<EmbedFontFamily, string> = {
  openRunde: "var(--font-open-runde), system-ui, sans-serif",
  inter: "var(--font-inter), system-ui, sans-serif",
  newsreader: "var(--font-serif), Georgia, serif",
  playfair: "var(--font-playfair), Georgia, serif",
  caveat: "var(--font-caveat), cursive",
  parabolica: "var(--font-parabolica), system-ui, sans-serif",
  aboreto: "var(--font-aboreto), Georgia, serif",
  afacad: "var(--font-afacad), system-ui, sans-serif",
  calSans: "var(--font-cal-sans), system-ui, sans-serif",
  instrumentSerif: "var(--font-instrument-serif), Georgia, serif",
  redaction: "var(--font-redaction), Georgia, serif",
  redaction10: "var(--font-redaction-10), Georgia, serif",
  redaction20: "var(--font-redaction-20), Georgia, serif",
  redaction35: "var(--font-redaction-35), Georgia, serif",
  redaction50: "var(--font-redaction-50), Georgia, serif",
  redaction70: "var(--font-redaction-70), Georgia, serif",
  redaction100: "var(--font-redaction-100), Georgia, serif",
};

const DEFAULT_PRESET = SOCIAL_PRESETS[0]!;
const EMBED_SRC = "/?embed=1";
const MIN_ZOOM = 50;
const MAX_ZOOM = 400;
const ZOOM_STEP = 5;
const MIN_COLUMN_REM = 6;
const MAX_COLUMN_REM = 40;
const COLUMN_STEP = 1;
const DEFAULT_COLUMN_REM = 28;
const MAX_BACKGROUND_IMAGE_BYTES = 4 * 1024 * 1024;

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
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_EMBED_BACKGROUND);
  const [textColor, setTextColor] = useState(DEFAULT_EMBED_TEXT);
  const [fontFamily, setFontFamilyState] = useState<EmbedFontFamily>(DEFAULT_EMBED_FONT);
  const [fontWeight, setFontWeightState] = useState(DEFAULT_EMBED_FONT_WEIGHT);
  const [letterSpacing, setLetterSpacingState] = useState(DEFAULT_EMBED_LETTER_SPACING);
  const [overrideText, setOverrideTextState] = useState("");
  const [backgroundHexDraft, setBackgroundHexDraft] = useState(DEFAULT_EMBED_BACKGROUND);
  const [textHexDraft, setTextHexDraft] = useState(DEFAULT_EMBED_TEXT);
  const [localColorCombos, setLocalColorCombos] = useState<AdminColorCombo[]>([]);
  const [copiedCombo, setCopiedCombo] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundImageName, setBackgroundImageName] = useState("");
  const [backgroundImageScale, setBackgroundImageScale] = useState(1);
  const [backgroundImageX, setBackgroundImageX] = useState(0);
  const [backgroundImageY, setBackgroundImageY] = useState(0);
  const [dragOverFrame, setDragOverFrame] = useState(false);
  const [fileDragActive, setFileDragActive] = useState(false);
  const [panningImage, setPanningImage] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [isNarrowLayout, setIsNarrowLayout] = useState(false);
  const backgroundImageInputRef = useRef<HTMLInputElement>(null);
  const panDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);
  const [error, setError] = useState("");
  const [frameKey, setFrameKey] = useState(0);

  const preset = SOCIAL_PRESETS.find((entry) => entry.id === presetId) ?? DEFAULT_PRESET;
  const contentZoom = contentZoomPercent / 100;
  const exportScaleOptions = exportScalesForPreset(preset);
  const maxScale = maxExportScaleForPreset(preset);
  const activeExportScale = Math.min(exportScale, maxScale);
  const colorCombos = useMemo(() => {
    const builtinIds = new Set(BUILTIN_COLOR_COMBOS.map((entry) => entry.id));
    const extras = localColorCombos.filter((entry) => !builtinIds.has(entry.id));
    return [...BUILTIN_COLOR_COMBOS, ...extras];
  }, [localColorCombos]);
  const activeColorCombo = findMatchingColorCombo(colorCombos, backgroundColor, textColor);

  useEffect(() => {
    setLocalColorCombos(readLocalColorCombos());
  }, []);

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
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: EmbedFontFamily;
    fontWeight?: number;
    letterSpacing?: number;
    overrideText?: string | null;
    backgroundImage?: string | null;
    backgroundImageScale?: number;
    backgroundImageX?: number;
    backgroundImageY?: number;
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
        backgroundColor: next?.backgroundColor ?? backgroundColor,
        textColor: next?.textColor ?? textColor,
        fontFamily: next?.fontFamily ?? fontFamily,
        fontWeight: next?.fontWeight ?? fontWeight,
        letterSpacing: next?.letterSpacing ?? letterSpacing,
        overrideText: next && "overrideText" in next
          ? next.overrideText ?? ""
          : overrideText,
        backgroundImage: next && "backgroundImage" in next
          ? next.backgroundImage ?? null
          : backgroundImage,
        backgroundImageScale: next?.backgroundImageScale ?? backgroundImageScale,
        backgroundImageX: next?.backgroundImageX ?? backgroundImageX,
        backgroundImageY: next?.backgroundImageY ?? backgroundImageY,
      },
      window.location.origin,
    );
  }, [
    backgroundColor,
    backgroundImage,
    backgroundImageScale,
    backgroundImageX,
    backgroundImageY,
    comboOnly,
    contentZoom,
    focusMode,
    fontFamily,
    fontWeight,
    hideDescriptions,
    leftColumnRem,
    letterSpacing,
    overrideText,
    preset.height,
    preset.width,
    rightColumnRem,
    textColor,
  ]);

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

  const setBackground = (value: string) => {
    setBackgroundColor(value);
    setBackgroundHexDraft(value);
    postEmbedState({ backgroundColor: value });
  };

  const setText = (value: string) => {
    setTextColor(value);
    setTextHexDraft(value);
    postEmbedState({ textColor: value });
  };

  const setFont = (value: EmbedFontFamily) => {
    const nextWeight = clampFontWeight(value, fontWeight);
    setFontFamilyState(value);
    setFontWeightState(nextWeight);
    postEmbedState({ fontFamily: value, fontWeight: nextWeight });
  };

  const setWeight = (value: number) => {
    const next = clampFontWeight(fontFamily, value);
    setFontWeightState(next);
    postEmbedState({ fontWeight: next });
  };

  const setLetterSpacing = (value: number) => {
    const next = clampLetterSpacing(value);
    setLetterSpacingState(next);
    postEmbedState({ letterSpacing: next });
  };

  const setOverrideText = (value: string) => {
    setOverrideTextState(value);
    postEmbedState({ overrideText: value });
  };

  const commitBackgroundHex = (raw: string) => {
    const next = normalizeHexColor(raw);
    if (!next) {
      setBackgroundHexDraft(backgroundColor);
      return;
    }
    setBackground(next);
  };

  const commitTextHex = (raw: string) => {
    const next = normalizeHexColor(raw);
    if (!next) {
      setTextHexDraft(textColor);
      return;
    }
    setText(next);
  };

  const resetColors = () => {
    setBackground(DEFAULT_EMBED_BACKGROUND);
    setText(DEFAULT_EMBED_TEXT);
  };

  const applyColorCombo = (combo: AdminColorCombo) => {
    setBackgroundColor(combo.background);
    setTextColor(combo.text);
    setBackgroundHexDraft(combo.background);
    setTextHexDraft(combo.text);
    postEmbedState({
      backgroundColor: combo.background,
      textColor: combo.text,
    });
  };

  const copyColorCombo = async () => {
    const line = serializeColorCombo({
      name: activeColorCombo?.name ?? "Custom",
      background: backgroundColor,
      text: textColor,
    });
    try {
      await navigator.clipboard.writeText(line);
      setCopiedCombo(true);
      window.setTimeout(() => setCopiedCombo(false), 1600);
    } catch {
      setError("Could not copy combo. Copy it manually from the hex fields.");
    }
  };

  const saveColorCombo = () => {
    const suggested = activeColorCombo?.name ?? "Custom";
    const name = window.prompt("Name this color combo", suggested)?.trim();
    if (!name) return;
    const combo: AdminColorCombo = {
      id: slugifyComboId(name, backgroundColor, textColor),
      name,
      background: backgroundColor,
      text: textColor,
    };
    setLocalColorCombos(upsertLocalColorCombo(combo));
  };

  const importColorCombo = (raw: string) => {
    const combo = parseColorCombo(raw);
    if (!combo) {
      setError("Paste a combo like: spellsurf-combo: Blue | #3b82f5 | #ffffff");
      return;
    }
    setError("");
    applyColorCombo(combo);
    setLocalColorCombos(upsertLocalColorCombo(combo));
  };

  const clearBackgroundImage = () => {
    setBackgroundImage(null);
    setBackgroundImageName("");
    setBackgroundImageScale(1);
    setBackgroundImageX(0);
    setBackgroundImageY(0);
    setCropMode(false);
    setPanningImage(false);
    panDragRef.current = null;
    if (backgroundImageInputRef.current) backgroundImageInputRef.current.value = "";
    postEmbedState({
      backgroundImage: null,
      backgroundImageScale: 1,
      backgroundImageX: 0,
      backgroundImageY: 0,
    });
  };

  const applyBackgroundImageFile = useCallback((file: File, label?: string) => {
    if (!isImageFile(file)) {
      setError("Drop or choose an image file (PNG, JPG, WebP, etc.).");
      return;
    }
    if (file.size > MAX_BACKGROUND_IMAGE_BYTES) {
      setError("Background image must be under 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result || (!result.startsWith("data:image/") && !result.startsWith("data:application/octet-stream"))) {
        setError("Could not read that image.");
        return;
      }
      // Some drops report empty MIME and read as octet-stream — normalize to an image data URL when possible.
      const dataUrl = result.startsWith("data:image/")
        ? result
        : result.replace(/^data:application\/octet-stream/, "data:image/png");

      setError("");
      setBackgroundImage(dataUrl);
      setBackgroundImageName(label?.trim() || file.name || "Background image");
      setBackgroundImageScale(1);
      setBackgroundImageX(0);
      setBackgroundImageY(0);
      try {
        postEmbedState({
          backgroundImage: dataUrl,
          backgroundImageScale: 1,
          backgroundImageX: 0,
          backgroundImageY: 0,
        });
      } catch (error) {
        console.error(error);
        setError("Could not apply that image to the preview.");
      }
    };
    reader.onerror = () => setError("Could not read that image.");
    reader.readAsDataURL(file);
  }, [postEmbedState]);
  const setBackgroundImageZoom = (scale: number) => {
    const next = Math.min(3, Math.max(1, Number(scale.toFixed(2))));
    setBackgroundImageScale(next);
    postEmbedState({ backgroundImageScale: next });
  };

  const setBackgroundImagePan = (x: number, y: number) => {
    const nextX = Math.min(50, Math.max(-50, x));
    const nextY = Math.min(50, Math.max(-50, y));
    setBackgroundImageX(nextX);
    setBackgroundImageY(nextY);
    postEmbedState({ backgroundImageX: nextX, backgroundImageY: nextY });
  };

  const resetBackgroundImageFrame = () => {
    setBackgroundImageScale(1);
    setBackgroundImageX(0);
    setBackgroundImageY(0);
    postEmbedState({
      backgroundImageScale: 1,
      backgroundImageX: 0,
      backgroundImageY: 0,
    });
  };

  const onFrameDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (![...event.dataTransfer.types].includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragOverFrame(true);
  };

  const onFrameDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setDragOverFrame(false);
  };

  const onFrameDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOverFrame(false);
    setFileDragActive(false);
    const file = Array.from(event.dataTransfer.files).find(isImageFile);
    if (!file) {
      setError("Drop an image file onto the frame.");
      return;
    }
    applyBackgroundImageFile(file);
  };

  const onFramePanPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!cropMode || !backgroundImage || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    panDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: backgroundImageX,
      originY: backgroundImageY,
    };
    setPanningImage(true);
  };

  const onFramePanPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = panDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const frame = event.currentTarget.getBoundingClientRect();
    if (frame.width <= 0 || frame.height <= 0) return;
    const dx = ((event.clientX - drag.startX) / frame.width) * 100;
    const dy = ((event.clientY - drag.startY) / frame.height) * 100;
    setBackgroundImagePan(drag.originX + dx, drag.originY + dy);
  };

  const onFramePanPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const drag = panDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    panDragRef.current = null;
    setPanningImage(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }
  };

  const onFrameWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!cropMode || !backgroundImage) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    setBackgroundImageZoom(backgroundImageScale + delta);
  };

  useEffect(() => {
    let depth = 0;
    const hasFiles = (event: globalThis.DragEvent) =>
      [...(event.dataTransfer?.types ?? [])].includes("Files");

    const onEnter = (event: globalThis.DragEvent) => {
      if (!hasFiles(event)) return;
      depth += 1;
      setFileDragActive(true);
    };
    const onLeave = (event: globalThis.DragEvent) => {
      if (!hasFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) {
        setFileDragActive(false);
        setDragOverFrame(false);
      }
    };
    // Required so the browser fires `drop` instead of navigating away.
    const onDragOver = (event: globalThis.DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
    };
    const onDrop = (event: globalThis.DragEvent) => {
      if (hasFiles(event)) event.preventDefault();
      depth = 0;
      setFileDragActive(false);
      setDragOverFrame(false);
    };

    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

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

  useEffect(() => {
    if (!mobileSettingsOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileSettingsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileSettingsOpen]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const sync = () => {
      setIsNarrowLayout(media.matches);
      if (!media.matches) setMobileSettingsOpen(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <div className={["admin-studio", mobileSettingsOpen ? "settings-open" : ""].filter(Boolean).join(" ")}>
      <button
        type="button"
        className="admin-settings-fab"
        onClick={() => setMobileSettingsOpen(true)}
        aria-label="Open settings"
        title="Settings"
      >
        <Settings2 size={18} strokeWidth={1.8} />
        <span>Settings</span>
      </button>

      <button
        type="button"
        className="admin-settings-backdrop"
        aria-label="Close settings"
        tabIndex={mobileSettingsOpen ? 0 : -1}
        onClick={() => setMobileSettingsOpen(false)}
      />

      <header
        className="admin-toolbar"
        inert={isNarrowLayout && !mobileSettingsOpen ? true : undefined}
      >
        <div className="admin-toolbar-sheet-header">
          <span className="admin-toolbar-title">Settings</span>
          <button
            type="button"
            className="admin-icon-button"
            onClick={() => setMobileSettingsOpen(false)}
            aria-label="Close settings"
            title="Close"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        <div className="admin-toolbar-brand">
          <span className="admin-toolbar-title">Spellsurf</span>
        </div>

        <div className="admin-toolbar-section" role="group" aria-label="Format">
          <AdminSegmented
            ariaLabel="Aspect ratio"
            value={preset.id}
            onChange={setPresetId}
            options={SOCIAL_PRESETS.map((entry) => ({
              value: entry.id,
              title: `${entry.width}×${entry.height}`,
              label: (
                <>
                  <span>{entry.label}</span>
                  <span className="admin-segment-meta">{entry.ratio}</span>
                </>
              ),
            }))}
          />
          <AdminSegmented
            ariaLabel="Export scale"
            value={activeExportScale}
            onChange={(next) => setExportScale(next as ExportScale)}
            options={exportScaleOptions.map((entry) => ({
              value: entry.id,
              label: entry.label,
            }))}
          />
        </div>

        <div className="admin-toolbar-divider" aria-hidden="true" />

        <div className="admin-toolbar-section" role="group" aria-label="Zoom and columns">
          <AdminStepper
            label="Zoom"
            ariaLabel="Content zoom"
            value={contentZoomPercent}
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={ZOOM_STEP}
            formatValue={(next) => `${next}%`}
            onChange={setZoom}
          />
          <AdminStepper
            label="Left"
            ariaLabel="Left description column width"
            title="Left description column width"
            value={leftColumnRem}
            min={MIN_COLUMN_REM}
            max={MAX_COLUMN_REM}
            step={COLUMN_STEP}
            disabled={hideDescriptions || comboOnly}
            formatValue={(next) => `${next}rem`}
            onChange={setLeftWidth}
          />
          <AdminStepper
            label="Right"
            ariaLabel="Right description column width"
            title="Right description column width"
            value={rightColumnRem}
            min={MIN_COLUMN_REM}
            max={MAX_COLUMN_REM}
            step={COLUMN_STEP}
            disabled={hideDescriptions || comboOnly}
            formatValue={(next) => `${next}rem`}
            onChange={setRightWidth}
          />
          <button
            type="button"
            className="admin-ghost-button"
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

        <div className="admin-toolbar-divider" aria-hidden="true" />

        <div className="admin-toolbar-section" role="group" aria-label="Typography">
          <AdminMenu
            label="Font"
            ariaLabel="Display font"
            title="Display font"
            value={fontFamily}
            className="admin-font-menu"
            menuClassName="admin-font-menu-panel"
            onChange={setFont}
            options={EMBED_FONT_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
              style: { fontFamily: EMBED_FONT_FAMILY_CSS[option.value] },
            }))}
            renderValue={(option) =>
              option ? (
                <span style={{ fontFamily: EMBED_FONT_FAMILY_CSS[option.value as EmbedFontFamily] }}>
                  {option.label}
                </span>
              ) : (
                "Font"
              )
            }
          />
          <AdminMenu
            label="Weight"
            ariaLabel="Font weight"
            title="Font weight"
            value={fontWeight}
            disabled={EMBED_FONT_WEIGHTS[fontFamily].length <= 1}
            onChange={setWeight}
            options={EMBED_FONT_WEIGHTS[fontFamily].map((weight) => ({
              value: weight,
              label: `${fontWeightLabel(weight)} · ${weight}`,
            }))}
          />
          <AdminStepper
            label="Spacing"
            ariaLabel="Letter spacing"
            title="Letter spacing (kerning)"
            value={letterSpacing}
            min={MIN_EMBED_LETTER_SPACING}
            max={MAX_EMBED_LETTER_SPACING}
            step={1}
            formatValue={(next) => `${next > 0 ? `+${next}` : next}%`}
            onChange={setLetterSpacing}
          />
          <button
            type="button"
            className="admin-ghost-button"
            disabled={letterSpacing === DEFAULT_EMBED_LETTER_SPACING}
            onClick={() => setLetterSpacing(DEFAULT_EMBED_LETTER_SPACING)}
            title={`Reset letter spacing to ${DEFAULT_EMBED_LETTER_SPACING}%`}
          >
            −6%
          </button>
        </div>

        <div className="admin-toolbar-divider" aria-hidden="true" />

        <div className="admin-toolbar-section" role="group" aria-label="Composition">
          <AdminToggle active={focusMode} onClick={toggleFocusMode} title="Hide chrome and focus the word">
            <Focus size={13} strokeWidth={1.9} />
            <span>Focus</span>
          </AdminToggle>
          <AdminToggle
            active={comboOnly}
            onClick={toggleComboOnly}
            title={comboOnly ? "Show source words and info" : "Show only the combo word, centered"}
          >
            <Type size={13} strokeWidth={1.9} />
            <span>Combo</span>
          </AdminToggle>
          <AdminToggle
            active={!hideDescriptions}
            onClick={toggleDescriptions}
            disabled={comboOnly}
            title={hideDescriptions ? "Show definition text" : "Hide definition text (keep pronunciation)"}
          >
            {hideDescriptions ? <EyeOff size={13} strokeWidth={1.9} /> : <Eye size={13} strokeWidth={1.9} />}
            <span>Defs</span>
          </AdminToggle>
          <label className="admin-field" title="Replace the combo word with custom text">
            <span className="admin-control-label">Text</span>
            <input
              className="admin-field-input"
              type="text"
              value={overrideText}
              placeholder="Custom word…"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              aria-label="Custom combo word"
              onChange={(event) => setOverrideText(event.target.value)}
            />
          </label>
          {overrideText ? (
            <button
              type="button"
              className="admin-icon-button"
              onClick={() => setOverrideText("")}
              title="Clear custom text"
              aria-label="Clear custom text"
            >
              <X size={13} strokeWidth={1.9} />
            </button>
          ) : null}
        </div>

        <div className="admin-toolbar-divider" aria-hidden="true" />

        <div className="admin-toolbar-section admin-color-section" role="group" aria-label="Colors">
          <AdminMenu
            label="Combo"
            ariaLabel="Saved color combos"
            title="Saved color combos"
            value={activeColorCombo?.id ?? ""}
            placeholder="Custom"
            onChange={(comboId) => {
              const combo = colorCombos.find((entry) => entry.id === comboId);
              if (combo) applyColorCombo(combo);
            }}
            options={colorCombos.map((combo) => ({
              value: combo.id,
              label: combo.name,
            }))}
            renderOption={(option) => {
              const combo = colorCombos.find((entry) => entry.id === option.value);
              return (
                <span className="admin-combo-option">
                  <span
                    className="admin-combo-swatch"
                    style={{
                      background: `linear-gradient(135deg, ${combo?.background ?? "#ccc"} 50%, ${combo?.text ?? "#111"} 50%)`,
                    }}
                  />
                  <span>{option.label}</span>
                </span>
              );
            }}
          />
          <label className="admin-color-field" title="Background color">
            <span className="admin-control-label">Bg</span>
            <input
              type="color"
              value={backgroundColor}
              onChange={(event) => setBackground(event.target.value)}
              aria-label="Background color"
            />
            <input
              className="admin-color-hex"
              type="text"
              value={backgroundHexDraft}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              inputMode="text"
              maxLength={7}
              aria-label="Background hex"
              placeholder="#3b82f5"
              onChange={(event) => setBackgroundHexDraft(event.target.value)}
              onBlur={(event) => commitBackgroundHex(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              onPaste={(event) => {
                const pasted = event.clipboardData.getData("text");
                const combo = parseColorCombo(pasted);
                if (combo) {
                  event.preventDefault();
                  importColorCombo(pasted);
                  return;
                }
                const next = normalizeHexColor(pasted);
                if (!next) return;
                event.preventDefault();
                setBackground(next);
              }}
            />
          </label>
          <label className="admin-color-field" title="Text and divider color">
            <span className="admin-control-label">Text</span>
            <input
              type="color"
              value={textColor}
              onChange={(event) => setText(event.target.value)}
              aria-label="Text color"
            />
            <input
              className="admin-color-hex"
              type="text"
              value={textHexDraft}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              inputMode="text"
              maxLength={7}
              aria-label="Text hex"
              placeholder="#ffffff"
              onChange={(event) => setTextHexDraft(event.target.value)}
              onBlur={(event) => commitTextHex(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              onPaste={(event) => {
                const pasted = event.clipboardData.getData("text");
                const combo = parseColorCombo(pasted);
                if (combo) {
                  event.preventDefault();
                  importColorCombo(pasted);
                  return;
                }
                const next = normalizeHexColor(pasted);
                if (!next) return;
                event.preventDefault();
                setText(next);
              }}
            />
          </label>
          <button
            type="button"
            className="admin-ghost-button"
            onClick={() => void copyColorCombo()}
            title="Copy shareable combo line"
          >
            {copiedCombo ? <Check size={13} strokeWidth={1.9} /> : <Copy size={13} strokeWidth={1.9} />}
            <span>{copiedCombo ? "Copied" : "Copy"}</span>
          </button>
          <button
            type="button"
            className="admin-ghost-button"
            onClick={saveColorCombo}
            title="Save current colors to this browser’s combo list"
          >
            Save
          </button>
          <button
            type="button"
            className="admin-ghost-button"
            onClick={resetColors}
            title="Reset to default blue / white"
          >
            Reset
          </button>
          <input
            ref={backgroundImageInputRef}
            className="admin-file-input"
            type="file"
            accept="image/*"
            aria-label="Upload temporary background image"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) applyBackgroundImageFile(file);
            }}
          />
          <AdminToggle
            active={Boolean(backgroundImage)}
            onClick={() => backgroundImageInputRef.current?.click()}
            title="Upload a temporary background image, or drag one onto the frame"
          >
            <ImagePlus size={13} strokeWidth={1.9} />
            <span>{backgroundImage ? "Image" : "Bg image"}</span>
          </AdminToggle>
          {backgroundImage ? (
            <>
              {!cropMode ? (
                <button
                  type="button"
                  className="admin-ghost-button"
                  onClick={() => setCropMode(true)}
                  title="Drag and zoom the background image"
                >
                  <Crop size={13} strokeWidth={1.9} />
                  <span>Crop</span>
                </button>
              ) : (
                <>
                  <AdminStepper
                    label="Crop"
                    ariaLabel="Background image zoom"
                    title="Background image zoom"
                    value={Number(backgroundImageScale.toFixed(2))}
                    min={1}
                    max={3}
                    step={0.05}
                    formatValue={(next) => `${Math.round(next * 100)}%`}
                    onChange={setBackgroundImageZoom}
                  />
                  <button
                    type="button"
                    className="admin-ghost-button"
                    onClick={resetBackgroundImageFrame}
                    title="Reset image framing"
                  >
                    Recenter
                  </button>
                  <AdminToggle
                    active
                    onClick={() => {
                      setCropMode(false);
                      setPanningImage(false);
                      panDragRef.current = null;
                    }}
                    title="Finish cropping"
                  >
                    <Check size={13} strokeWidth={1.9} />
                    <span>Done</span>
                  </AdminToggle>
                </>
              )}
              <button
                type="button"
                className="admin-ghost-button"
                onClick={clearBackgroundImage}
                title={backgroundImageName ? `Clear ${backgroundImageName}` : "Clear background image"}
              >
                <X size={13} strokeWidth={1.9} />
                <span>Clear</span>
              </button>
            </>
          ) : null}
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
            <span>{capturing ? "Capturing…" : "Capture"}</span>
          </button>
        </div>
      </header>

      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-stage" ref={stageRef}>
        <div
          className={[
            "admin-frame",
            dragOverFrame ? "is-drop-target" : "",
            fileDragActive ? "is-file-drag" : "",
            backgroundImage ? "has-bg-image" : "",
            cropMode ? "is-crop-mode" : "",
            panningImage ? "is-panning" : "",
          ].filter(Boolean).join(" ")}
          style={{ width: frameWidth, height: frameHeight }}
          data-platform={preset.platform}
          onDragEnter={onFrameDragOver}
          onDragOver={onFrameDragOver}
          onDragLeave={onFrameDragLeave}
          onDrop={onFrameDrop}
        >
          {backgroundImage ? (
            <div
              className="admin-frame-bg-preview"
              aria-hidden="true"
              style={{
                transform: `translate(${backgroundImageX}%, ${backgroundImageY}%) scale(${backgroundImageScale})`,
              }}
            >
              {/* Local preview so drops are visible even if the iframe message is delayed. */}
              <img src={backgroundImage} alt="" draggable={false} />
            </div>
          ) : null}
          <iframe
            key={`${preset.id}-${frameKey}`}
            ref={iframeRef}
            className={[
              "admin-frame-iframe",
              backgroundImage ? "has-bg-image" : "",
            ].filter(Boolean).join(" ")}
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
          <div
            className="admin-frame-overlay"
            onDragEnter={onFrameDragOver}
            onDragOver={onFrameDragOver}
            onDragLeave={onFrameDragLeave}
            onDrop={onFrameDrop}
            onPointerDown={onFramePanPointerDown}
            onPointerMove={onFramePanPointerMove}
            onPointerUp={onFramePanPointerUp}
            onPointerCancel={onFramePanPointerUp}
            onWheel={onFrameWheel}
            title={
              cropMode
                ? "Drag to reframe · scroll to zoom"
                : fileDragActive
                  ? "Drop image"
                  : backgroundImage
                    ? "Click Crop to reframe the image"
                    : "Drop an image here"
            }
          >
            {dragOverFrame ? <span className="admin-frame-drop-label">Drop image</span> : null}
            {cropMode && !dragOverFrame && !panningImage ? (
              <span className="admin-frame-drop-label">Drag to move · scroll to zoom</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
