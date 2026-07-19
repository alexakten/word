"use client";

import { useLayoutEffect, useRef, useState } from "react";

function fits(element: HTMLElement) {
  return element.scrollHeight <= element.clientHeight + 1;
}

/** Shrink copy until it fits the clamped box, ending with a real ellipsis character. */
function truncateToFit(element: HTMLElement, full: string) {
  element.textContent = full;
  if (fits(element)) return full;

  let low = 0;
  let high = full.length;
  let best = 0;

  while (low <= high) {
    const mid = (low + high) >> 1;
    element.textContent = `${full.slice(0, mid).trimEnd()}…`;
    if (fits(element)) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  if (best <= 0) return "…";
  return `${full.slice(0, best).trimEnd()}…`;
}

export function SplitDescription({ children }: { children: string }) {
  const [expanded, setExpanded] = useState(false);
  const [display, setDisplay] = useState(children);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    const element = buttonRef.current;
    if (!element) return;

    if (expanded) {
      setDisplay(children);
      return;
    }

    const measure = () => {
      const next = truncateToFit(element, children);
      setDisplay((current) => (current === next ? current : next));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [children, expanded]);

  return (
    <button
      ref={buttonRef}
      className={["split-definition", expanded ? "expanded" : ""].filter(Boolean).join(" ")}
      type="button"
      aria-expanded={expanded}
      title={expanded ? "Collapse description" : "Show full description"}
      onClick={() => setExpanded((current) => !current)}
    >
      {display}
    </button>
  );
}
