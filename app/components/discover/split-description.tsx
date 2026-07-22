"use client";

import { ArrowDown } from "lucide-react";
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
  const [expandable, setExpandable] = useState(false);
  const [display, setDisplay] = useState(children);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    const element = buttonRef.current;
    if (!element) return;

    if (expanded) return;

    const measure = () => {
      const next = truncateToFit(element, children);
      setExpandable(next !== children);
      setDisplay((current) => (current === next ? current : next));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [children, expanded]);

  return (
    <div className={["split-description-control", expanded ? "is-expanded" : ""].filter(Boolean).join(" ")}>
      <button
        ref={buttonRef}
        className={["split-definition", expanded ? "expanded" : ""].filter(Boolean).join(" ")}
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? children : display}
      </button>
      {!expanded && expandable ? (
        <span className="split-description-hover-arrow" aria-hidden="true">
          <ArrowDown size={14} strokeWidth={1.6} />
        </span>
      ) : null}
    </div>
  );
}
