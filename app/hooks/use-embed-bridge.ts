"use client";

import { useEffect } from "react";
import { clampColumnRem, isEmbedBridgeMessage, isEmbedMode } from "../lib/embed-bridge";

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
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [
    setCaptureHeight,
    setCaptureMode,
    setCaptureScale,
    setCaptureWidth,
    setComboOnly,
    setContentZoom,
    setFocusMode,
    setHideDescriptions,
    setLeftColumnRem,
    setRightColumnRem,
  ]);
}
