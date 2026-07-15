"use client";

import { useCallback, useEffect, useState } from "react";
import type { DiscoverMobilePanel } from "../lib/types";

/** Viewport width at/below which Discover uses the mobile overlay layout. */
const MOBILE_LAYOUT_MAX_WIDTH = 1240;

export function useMobileLayout() {
  const [mobileDiscoverPanel, setMobileDiscoverPanel] = useState<DiscoverMobilePanel | null>(null);
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  useEffect(() => {
    // Layout styles key off `.mobile-layout` (see globals.css), not a CSS media query.
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_LAYOUT_MAX_WIDTH}px)`);
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
