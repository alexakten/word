"use client";

import { useEffect, useState } from "react";
import { DiscoverView } from "./components/discover/discover-view";
import { ControlsFooter } from "./components/layout/controls-footer";
import { SiteHeader } from "./components/layout/site-header";
import { useEmbedBridge } from "./hooks/use-embed-bridge";
import { useHome } from "./hooks/use-home";
import { DEFAULT_EMBED_BACKGROUND, DEFAULT_EMBED_FONT, DEFAULT_EMBED_FONT_WEIGHT, DEFAULT_EMBED_LETTER_SPACING, DEFAULT_EMBED_TEXT, clampFontWeight, isEmbedMode, type EmbedFontFamily } from "./lib/embed-bridge";

export default function Home() {
  const home = useHome();
  const {
    appMode,
    focusMode,
    setFocusMode,
    mobileDiscoverPanel,
    closeMobileDiscoverPanel,
  } = home;
  const [hideDescriptions, setHideDescriptions] = useState(false);
  const [comboOnly, setComboOnly] = useState(false);
  const [captureMode, setCaptureMode] = useState(false);
  const [captureScale, setCaptureScale] = useState(1);
  const [captureWidth, setCaptureWidth] = useState(1080);
  const [captureHeight, setCaptureHeight] = useState(1080);
  const [contentZoom, setContentZoom] = useState(1);
  const [leftColumnRem, setLeftColumnRem] = useState(28);
  const [rightColumnRem, setRightColumnRem] = useState(28);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_EMBED_BACKGROUND);
  const [textColor, setTextColor] = useState(DEFAULT_EMBED_TEXT);
  const [fontFamily, setFontFamily] = useState<EmbedFontFamily>(DEFAULT_EMBED_FONT);
  const [fontWeight, setFontWeight] = useState(DEFAULT_EMBED_FONT_WEIGHT);
  const [letterSpacing, setLetterSpacing] = useState(DEFAULT_EMBED_LETTER_SPACING);
  const [overrideText, setOverrideText] = useState("");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundImageScale, setBackgroundImageScale] = useState(1);
  const [backgroundImageX, setBackgroundImageX] = useState(0);
  const [backgroundImageY, setBackgroundImageY] = useState(0);
  const embedMode = isEmbedMode();

  useEmbedBridge({
    setFocusMode,
    setHideDescriptions,
    setComboOnly,
    setCaptureMode,
    setCaptureScale,
    setCaptureWidth,
    setCaptureHeight,
    setContentZoom,
    setLeftColumnRem,
    setRightColumnRem,
    setBackgroundColor,
    setTextColor,
    setFontFamily,
    setFontWeight,
    setLetterSpacing,
    setOverrideText,
    setBackgroundImage,
    setBackgroundImageScale,
    setBackgroundImageX,
    setBackgroundImageY,
  });

  useEffect(() => {
    if (!embedMode) return;
    const root = document.documentElement;
    const body = document.body;
    const paintScale = captureMode ? captureScale : 1;
    root.dataset.embed = "1";
    root.dataset.embedColors = "1";
    root.dataset.embedFont = fontFamily;
    root.dataset.fontFamily = fontFamily === "newsreader" || fontFamily === "playfair" || fontFamily === "instrumentSerif" ? "serif" : "sans";
    const resolvedWeight = clampFontWeight(fontFamily, fontWeight);
    // Multiply real font sizes / column widths for capture so text is shaped at export DPI
    // (CSS zoom is ignored by DOM→PNG and looks soft — same problem as low deviceScaleFactor).
    root.style.setProperty("--embed-content-zoom", String(contentZoom * paintScale));
    root.style.setProperty("--embed-left-column", `${leftColumnRem * paintScale}rem`);
    root.style.setProperty("--embed-right-column", `${rightColumnRem * paintScale}rem`);
    root.style.setProperty("--embed-paint-scale", String(paintScale));
    root.style.setProperty("--embed-letter-spacing", `${letterSpacing / 100}em`);
    root.style.setProperty("--embed-font-weight", String(resolvedWeight));
    root.style.setProperty("--paper", backgroundColor);
    root.style.setProperty("--ink", textColor);
    root.style.setProperty("--hero-ink", textColor);
    root.style.setProperty("--line", textColor);
    root.style.setProperty("--muted", `color-mix(in srgb, ${textColor} 78%, transparent)`);
    root.style.setProperty("--faint", `color-mix(in srgb, ${textColor} 62%, transparent)`);
    body.style.backgroundColor = backgroundImage ? "transparent" : backgroundColor;
    root.style.backgroundColor = backgroundImage ? "transparent" : backgroundColor;
    if (backgroundImage) {
      root.dataset.embedBgImage = "1";
    } else {
      delete root.dataset.embedBgImage;
    }
    if (captureMode) {
      root.dataset.embedCapture = "1";
      root.style.width = "100%";
      root.style.height = "100%";
      root.style.overflow = "hidden";
      body.style.width = "100%";
      body.style.height = "100%";
      body.style.margin = "0";
      body.style.overflow = "hidden";
    } else {
      delete root.dataset.embedCapture;
      root.style.removeProperty("width");
      root.style.removeProperty("height");
      root.style.removeProperty("overflow");
      body.style.removeProperty("width");
      body.style.removeProperty("height");
      body.style.removeProperty("margin");
      body.style.removeProperty("overflow");
    }
    root.style.removeProperty("zoom");
    return () => {
      delete root.dataset.embed;
      delete root.dataset.embedColors;
      delete root.dataset.embedFont;
      delete root.dataset.embedBgImage;
      delete root.dataset.embedCapture;
      delete root.dataset.fontFamily;
      root.style.removeProperty("--embed-content-zoom");
      root.style.removeProperty("--embed-left-column");
      root.style.removeProperty("--embed-right-column");
      root.style.removeProperty("--embed-paint-scale");
      root.style.removeProperty("--embed-letter-spacing");
      root.style.removeProperty("--embed-font-weight");
      root.style.removeProperty("--paper");
      root.style.removeProperty("--ink");
      root.style.removeProperty("--hero-ink");
      root.style.removeProperty("--line");
      root.style.removeProperty("--muted");
      root.style.removeProperty("--faint");
      root.style.removeProperty("width");
      root.style.removeProperty("height");
      root.style.removeProperty("overflow");
      root.style.removeProperty("zoom");
      body.style.removeProperty("background-color");
      root.style.removeProperty("background-color");
      body.style.removeProperty("width");
      body.style.removeProperty("height");
      body.style.removeProperty("margin");
      body.style.removeProperty("overflow");
    };
  }, [
    backgroundColor,
    backgroundImage,
    captureHeight,
    captureMode,
    captureScale,
    captureWidth,
    contentZoom,
    embedMode,
    fontFamily,
    fontWeight,
    leftColumnRem,
    letterSpacing,
    rightColumnRem,
    textColor,
  ]);

  return (
    <main
      className={[
        "page-shell",
        focusMode || captureMode ? "focus-mode" : "",
        hideDescriptions ? "hide-descriptions" : "",
        comboOnly ? "combo-only" : "",
        captureMode ? "embed-capture" : "",
        appMode === "discover" ? "discover-mode" : "",
        mobileDiscoverPanel ? "mobile-panel-open" : "",
      ].filter(Boolean).join(" ")}
      onPointerDown={() => {
        // Admin embed controls focus explicitly; don't dismiss on click.
        if (focusMode && !embedMode) setFocusMode(false);
      }}
    >
      {embedMode && backgroundImage ? (
        <div
          className="embed-bg-image-layer"
          aria-hidden="true"
          style={{
            transform: `translate(${backgroundImageX}%, ${backgroundImageY}%) scale(${backgroundImageScale})`,
          }}
        >
          {/* <img> handles large data URLs; CSS background-image often fails past ~size limits. */}
          <img src={backgroundImage} alt="" draggable={false} />
        </div>
      ) : null}
      {mobileDiscoverPanel ? (
        <button
          className="modal-overlay mobile-panel-backdrop"
          type="button"
          aria-label="Close panel"
          onClick={closeMobileDiscoverPanel}
        />
      ) : null}

      <SiteHeader
        apiHealth={home.apiHealth}
        advancedOpen={home.advancedOpen}
        setAdvancedOpen={home.setAdvancedOpen}
        advancedTool={home.advancedTool}
        runAdvancedSearch={home.runAdvancedSearch}
        forgeSlots={home.forgeSlots}
        findForgeWords={home.findForgeWords}
        tools={{
          advancedTool: home.advancedTool,
          setAdvancedTool: home.setAdvancedTool,
          advancedMode: home.advancedMode,
          setAdvancedMode: home.setAdvancedMode,
          advancedQuery: home.advancedQuery,
          setAdvancedQuery: home.setAdvancedQuery,
          advancedStartsWith: home.advancedStartsWith,
          setAdvancedStartsWith: home.setAdvancedStartsWith,
          advancedEndsWith: home.advancedEndsWith,
          setAdvancedEndsWith: home.setAdvancedEndsWith,
          advancedLength: home.advancedLength,
          setAdvancedLength: home.setAdvancedLength,
          advancedTopic: home.advancedTopic,
          setAdvancedTopic: home.setAdvancedTopic,
          advancedResults: home.advancedResults,
          advancedLoading: home.advancedLoading,
          advancedError: home.advancedError,
          setAdvancedResults: home.setAdvancedResults,
          setAdvancedError: home.setAdvancedError,
          forgeSlots: home.forgeSlots,
          setForgeSlots: home.setForgeSlots,
          forgeSyllables: home.forgeSyllables,
          setForgeSyllables: home.setForgeSyllables,
          forgeTotalLetters: home.forgeTotalLetters,
          setForgeTotalLetters: home.setForgeTotalLetters,
          forgeWords: home.forgeWords,
          forgedWord: home.forgedWord,
          forgeReady: home.forgeReady,
          forgeRemixing: home.forgeRemixing,
          forgeCopied: home.forgeCopied,
          setForgeCopied: home.setForgeCopied,
          updateForgeSlot: home.updateForgeSlot,
          findForgeWords: home.findForgeWords,
          lockForgeSeedWord: home.lockForgeSeedWord,
          cycleForgeWord: home.cycleForgeWord,
          commitWord: home.commitWord,
          setMessage: home.setMessage,
          selectAppMode: home.selectAppMode,
        }}
      />

      {appMode === "discover" ? <DiscoverView {...home} embedOverrideText={overrideText} /> : null}

      <ControlsFooter {...home} />
    </main>
  );
}
