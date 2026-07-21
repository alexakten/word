"use client";

import { useEffect } from "react";
import {
  clampColumnRem,
  clampFontWeight,
  clampLetterSpacing,
  isBackgroundImageUrl,
  isEmbedBridgeMessage,
  isEmbedMode,
  normalizeHexColor,
  parseEmbedFontFamily,
  type EmbedFontFamily,
} from "../lib/embed-bridge";

function clampBgScale(value: number) {
  return Math.min(3, Math.max(1, value));
}

function clampBgPan(value: number) {
  return Math.min(50, Math.max(-50, value));
}

type UseEmbedBridgeOptions = {
  setFocusMode: (value: boolean) => void;
  setHideDescriptions: (value: boolean) => void;
  setComboOnly: (value: boolean) => void;
  setCaptureMode: (value: boolean) => void;
  setCaptureScale: (value: number) => void;
  setCaptureWidth: (value: number) => void;
  setCaptureHeight: (value: number) => void;
  setContentZoom: (value: number) => void;
  setLeftColumnRem: (value: number) => void;
  setRightColumnRem: (value: number) => void;
  setBackgroundColor: (value: string) => void;
  setTextColor: (value: string) => void;
  setFontFamily: (value: EmbedFontFamily) => void;
  setFontWeight: (value: number) => void;
  setLetterSpacing: (value: number) => void;
  setOverrideText: (value: string) => void;
  setBackgroundImage: (value: string | null) => void;
  setBackgroundImageScale: (value: number) => void;
  setBackgroundImageX: (value: number) => void;
  setBackgroundImageY: (value: number) => void;
};

/** Apply admin studio controls when the app is loaded inside `/?embed=1`. */
export function useEmbedBridge({
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
}: UseEmbedBridgeOptions) {
  useEffect(() => {
    if (!isEmbedMode()) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!isEmbedBridgeMessage(event.data)) return;
      if (typeof event.data.focusMode === "boolean") {
        setFocusMode(event.data.focusMode);
      }
      if (typeof event.data.hideDescriptions === "boolean") {
        setHideDescriptions(event.data.hideDescriptions);
      }
      if (typeof event.data.comboOnly === "boolean") {
        setComboOnly(event.data.comboOnly);
      }
      if (typeof event.data.captureMode === "boolean") {
        setCaptureMode(event.data.captureMode);
      }
      if (typeof event.data.captureScale === "number" && Number.isFinite(event.data.captureScale)) {
        setCaptureScale(Math.min(16, Math.max(1, event.data.captureScale)));
      }
      if (typeof event.data.captureWidth === "number" && Number.isFinite(event.data.captureWidth)) {
        setCaptureWidth(event.data.captureWidth);
      }
      if (typeof event.data.captureHeight === "number" && Number.isFinite(event.data.captureHeight)) {
        setCaptureHeight(event.data.captureHeight);
      }
      if (typeof event.data.contentZoom === "number" && Number.isFinite(event.data.contentZoom)) {
        setContentZoom(Math.min(5, Math.max(0.5, event.data.contentZoom)));
      }
      if (typeof event.data.leftColumnRem === "number") {
        setLeftColumnRem(clampColumnRem(event.data.leftColumnRem));
      }
      if (typeof event.data.rightColumnRem === "number") {
        setRightColumnRem(clampColumnRem(event.data.rightColumnRem));
      }
      const background = normalizeHexColor(event.data.backgroundColor);
      if (background) setBackgroundColor(background);
      const text = normalizeHexColor(event.data.textColor);
      if (text) setTextColor(text);
      const fontFamily = parseEmbedFontFamily(event.data.fontFamily);
      if (fontFamily) setFontFamily(fontFamily);
      if (typeof event.data.fontWeight === "number" && Number.isFinite(event.data.fontWeight)) {
        const face = fontFamily ?? "openRunde";
        setFontWeight(clampFontWeight(face, event.data.fontWeight));
      }
      if (typeof event.data.letterSpacing === "number" && Number.isFinite(event.data.letterSpacing)) {
        setLetterSpacing(clampLetterSpacing(event.data.letterSpacing));
      }
      if ("overrideText" in event.data) {
        setOverrideText(typeof event.data.overrideText === "string" ? event.data.overrideText : "");
      }
      if ("backgroundImage" in event.data) {
        const image = event.data.backgroundImage;
        if (image === null || image === "") {
          setBackgroundImage(null);
        } else if (isBackgroundImageUrl(image)) {
          setBackgroundImage(image);
        }
      }
      if (typeof event.data.backgroundImageScale === "number" && Number.isFinite(event.data.backgroundImageScale)) {
        setBackgroundImageScale(clampBgScale(event.data.backgroundImageScale));
      }
      if (typeof event.data.backgroundImageX === "number" && Number.isFinite(event.data.backgroundImageX)) {
        setBackgroundImageX(clampBgPan(event.data.backgroundImageX));
      }
      if (typeof event.data.backgroundImageY === "number" && Number.isFinite(event.data.backgroundImageY)) {
        setBackgroundImageY(clampBgPan(event.data.backgroundImageY));
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [
    setBackgroundColor,
    setBackgroundImage,
    setBackgroundImageScale,
    setBackgroundImageX,
    setBackgroundImageY,
    setCaptureHeight,
    setCaptureMode,
    setCaptureScale,
    setCaptureWidth,
    setComboOnly,
    setContentZoom,
    setFocusMode,
    setFontFamily,
    setFontWeight,
    setHideDescriptions,
    setLeftColumnRem,
    setLetterSpacing,
    setOverrideText,
    setRightColumnRem,
    setTextColor,
  ]);
}
