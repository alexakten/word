"use client";

import { useCallback, useEffect, useState } from "react";
import type { DiscoverMobilePanel } from "../lib/types";

export function useMobileLayout() {
  const [mobileDiscoverPanel, setMobileDiscoverPanel] = useState<DiscoverMobilePanel | null>(null);
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 760px)");
    const syncMobileLayout = () => {
      setIsMobileLayout(mediaQuery.matches);
      if (!mediaQuery.matches) setMobileDiscoverPanel(null);
    };
    syncMobileLayout();
    mediaQuery.addEventListener("change", syncMobileLayout);
    return () => mediaQuery.removeEventListener("change", syncMobileLayout);
  }, []);

  const toggleMobileDiscoverPanel = useCallback((panel: DiscoverMobilePanel) => {
    setMobileDiscoverPanel((current) => (current === panel ? null : panel));
  }, []);

  const closeMobileDiscoverPanel = useCallback(() => {
    setMobileDiscoverPanel(null);
  }, []);

  return {
    isMobileLayout,
    mobileDiscoverPanel,
    setMobileDiscoverPanel,
    toggleMobileDiscoverPanel,
    closeMobileDiscoverPanel,
  };
}
