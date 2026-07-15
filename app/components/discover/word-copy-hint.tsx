"use client";

import { Check, Copy } from "lucide-react";
import type { WordCopyStatus } from "../../lib/types";

export function WordCopyHint({ status }: { status: WordCopyStatus }) {
  const hasCopied = status !== "idle";
  return (
    <span className={`word-copy-hint${status === "hidden" ? " hidden" : ""}`} aria-hidden="true">
      <span className="word-copy-hint-icon" key={hasCopied ? "icon-check" : "icon-copy"}>
        {hasCopied
          ? <Check size={12} strokeWidth={1.7} />
          : <Copy size={12} strokeWidth={1.5} />}
      </span>
      <span className="word-copy-hint-label" key={hasCopied ? "label-copied" : "label-copy"}>{hasCopied ? "Copied word" : "Click to copy"}</span>
    </span>
  );
}
