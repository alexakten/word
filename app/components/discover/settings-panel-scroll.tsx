"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

export function SettingsPanelScroll({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl || !contentEl) return;

    const syncScrollability = () => {
      // Only enable scrolling when content actually overflows the filled panel.
      scrollEl.classList.toggle(
        "is-scrollable",
        contentEl.scrollHeight > scrollEl.clientHeight + 1,
      );
    };

    syncScrollability();

    const observer = new ResizeObserver(syncScrollability);
    observer.observe(scrollEl);
    observer.observe(contentEl);

    return () => observer.disconnect();
  }, [children]);

  return (
    <div className="settings-panel-scroll" ref={scrollRef}>
      <div className="settings-panel-scroll-content" ref={contentRef}>
        {children}
      </div>
    </div>
  );
}
