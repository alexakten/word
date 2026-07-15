"use client";

import { useCallback, useState } from "react";
import type { AppMode } from "../lib/types";

type UseAppModeOptions = {
  setMobileDiscoverPanel: (panel: null) => void;
};

export function useAppMode({ setMobileDiscoverPanel }: UseAppModeOptions) {
  const [appMode, setAppMode] = useState<AppMode>("discover");
  const [focusMode, setFocusMode] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedTool, setAdvancedTool] = useState<"search" | "forge">("search");
  const [message, setMessage] = useState("");

  const selectAppMode = useCallback((mode: AppMode) => {
    setAppMode(mode);
    setAdvancedOpen(mode !== "discover");
    if (mode !== "discover") {
      setFocusMode(false);
      setMobileDiscoverPanel(null);
    }
    if (mode !== "discover") setAdvancedTool(mode === "combine" ? "forge" : "search");
  }, [setMobileDiscoverPanel]);

  return {
    appMode,
    setAppMode,
    focusMode,
    setFocusMode,
    advancedOpen,
    setAdvancedOpen,
    advancedTool,
    setAdvancedTool,
    message,
    setMessage,
    selectAppMode,
  };
}
