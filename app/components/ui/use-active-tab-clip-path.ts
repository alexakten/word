"use client";

import { useLayoutEffect, useRef } from "react";

export function useActiveTabClipPath(activeValue: unknown) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const activeTab = activeTabRef.current;
    if (!container || !activeTab) return;

    const updateClipPath = () => {
      const containerWidth = container.offsetWidth;
      if (!containerWidth) return;

      const containerRect = container.getBoundingClientRect();
      const activeRect = activeTab.getBoundingClientRect();
      const clipLeft = Math.max(0, activeRect.left - containerRect.left);
      const clipRight = Math.max(0, containerRect.right - activeRect.right);

      container.style.clipPath = `inset(0 ${clipRight}px 0 ${clipLeft}px round 999px)`;
    };

    const isInitialPosition = container.dataset.positioned !== "true";
    if (isInitialPosition) container.style.transition = "none";
    updateClipPath();
    if (isInitialPosition) {
      container.dataset.positioned = "true";
      void container.offsetWidth;
      container.style.removeProperty("transition");
    }

    const observer = new ResizeObserver(updateClipPath);
    observer.observe(container);
    observer.observe(activeTab);
    return () => observer.disconnect();
  }, [activeValue]);

  return { activeTabRef, containerRef };
}
