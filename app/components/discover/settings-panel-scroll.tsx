"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

function availableScrollHeight(scrollEl: HTMLElement): number {
  const panel = scrollEl.closest<HTMLElement>(".split-settings-panel");
  const stack = scrollEl.closest<HTMLElement>(".split-sidebar-stack");
  if (!panel) return scrollEl.clientHeight;

  const header = panel.querySelector<HTMLElement>(".settings-panel-header");
  const headerHeight = header?.offsetHeight ?? 0;
  const panelStyles = getComputedStyle(panel);
  const panelPadding =
    (parseFloat(panelStyles.paddingTop) || 0) + (parseFloat(panelStyles.paddingBottom) || 0);

  if (stack) {
    const slice = stack.querySelector<HTMLElement>(".split-slice-panel");
    const sliceHeight = slice?.offsetHeight ?? 0;
    const gap = parseFloat(getComputedStyle(stack).rowGap || getComputedStyle(stack).gap) || 0;
    return Math.max(0, stack.clientHeight - sliceHeight - gap - headerHeight - panelPadding);
  }

  return Math.max(0, panel.clientHeight - headerHeight - panelPadding);
}

export function SettingsPanelScroll({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl || !contentEl) return;

    const panel = scrollEl.closest<HTMLElement>(".split-settings-panel");
    const stack = scrollEl.closest<HTMLElement>(".split-sidebar-stack");

    const syncScrollability = () => {
      // Measure natural content height without the expanded scroll flex.
      scrollEl.classList.remove("is-scrollable");
      panel?.classList.remove("is-scrollable");

      const contentHeight = contentEl.scrollHeight;
      const maxHeight = availableScrollHeight(scrollEl);
      const needsScroll = contentHeight > maxHeight + 1;

      scrollEl.classList.toggle("is-scrollable", needsScroll);
      panel?.classList.toggle("is-scrollable", needsScroll);
    };

    syncScrollability();

    const observer = new ResizeObserver(syncScrollability);
    observer.observe(scrollEl);
    observer.observe(contentEl);
    if (panel) observer.observe(panel);
    if (stack) observer.observe(stack);

    return () => {
      observer.disconnect();
      panel?.classList.remove("is-scrollable");
    };
  }, [children]);

  return (
    <div className="settings-panel-scroll" ref={scrollRef}>
      <div className="settings-panel-scroll-content" ref={contentRef}>
        {children}
      </div>
    </div>
  );
}
