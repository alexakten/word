"use client";

import { useCallback, useEffect, useState } from "react";
import { LAYOUT_ATTR, MOBILE_LAYOUT_MAX_WIDTH } from "../lib/viewport";
import type { DiscoverMobilePanel } from "../lib/types";

export function useMobileLayout() {
  const [mobileDiscoverPanel, setMobileDiscoverPanel] = useState<DiscoverMobilePanel | null>(null);
  // Start false to match SSR; layout visibility is CSS/breakpoint-driven.
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_LAYOUT_MAX_WIDTH}px)`);
    const syncMobileLayout = () => {
      const mobile = mediaQuery.matches;
      document.documentElement.setAttribute(LAYOUT_ATTR, mobile ? "mobile" : "desktop");
      setIsMobileLayout(mobile);
      if (!mobile) setMobileDiscoverPanel(null);
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
