"use client";

import { useState } from "react";

export function SplitDescription({ children }: { children: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      className={["split-definition", expanded ? "expanded" : ""].filter(Boolean).join(" ")}
      type="button"
      aria-expanded={expanded}
      title={expanded ? "Collapse description" : "Show full description"}
      onClick={() => setExpanded((current) => !current)}
    >
      {children}
    </button>
  );
}
