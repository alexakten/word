"use client";

import { useEffect, useRef, useState } from "react";
import { cardo } from "../../fonts";

export function SplitDescription({ children }: { children: string }) {
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const descriptionRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const description = descriptionRef.current;
    if (!description) return;

    const updateTruncation = () => {
      setTruncated(!expanded && description.scrollHeight > description.clientHeight + 1);
    };
    const frame = window.requestAnimationFrame(updateTruncation);
    const observer = new ResizeObserver(updateTruncation);
    observer.observe(description);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [children, expanded]);

  return (
    <button
      ref={descriptionRef}
      className={[
        "split-definition",
        expanded ? "expanded" : "",
        truncated ? "is-truncated" : "",
      ].filter(Boolean).join(" ")}
      type="button"
      style={{ fontFamily: cardo.style.fontFamily }}
      aria-expanded={expanded}
      title={expanded ? "Collapse description" : "Show full description"}
      onClick={() => setExpanded((current) => !current)}
    >
      {children}
      {truncated ? <span className="split-definition-ellipsis" aria-hidden="true">…</span> : null}
    </button>
  );
}
