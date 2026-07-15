"use client";

import { useState } from "react";
import { cardo } from "../../fonts";

export function SplitDescription({ children }: { children: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      className={expanded ? "split-definition expanded" : "split-definition"}
      type="button"
      style={{ fontFamily: cardo.style.fontFamily }}
      aria-expanded={expanded}
      title={expanded ? "Collapse description" : "Show full description"}
      onClick={() => setExpanded((current) => !current)}
    >
      {children}
    </button>
  );
}
