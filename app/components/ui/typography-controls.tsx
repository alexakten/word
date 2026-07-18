"use client";

import { useEffect, useState } from "react";
import { useActiveTabClipPath } from "./use-active-tab-clip-path";
import { useControlPop } from "./use-control-pop";

type FontFamily = "sans" | "serif";

const fontFamilyOptions = [
  { value: "sans", label: "Sans" },
  { value: "serif", label: "Serif" },
] as const;

export function TypographyControls() {
  const [fontFamily, setFontFamily] = useState<FontFamily>("sans");
  const pop = useControlPop();
  const fontFamilyClip = useActiveTabClipPath(fontFamily);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-font-family", fontFamily);
    root.removeAttribute("data-font-caps");
    root.removeAttribute("data-font-bold");
    root.removeAttribute("data-font-italic");
  }, [fontFamily]);

  return (
    <div className="typography-controls" aria-label="Typography settings">
      <div className="typography-segment-toggle font-family-toggle" role="group" aria-label="Font family">
        <ul className="word-type-tab-list">
          {fontFamilyOptions.map((option) => (
            <li key={option.value}>
              <button
                ref={fontFamily === option.value ? fontFamilyClip.activeTabRef : null}
                type="button"
                data-font-option={option.value}
                aria-pressed={fontFamily === option.value}
                onClick={(event) => {
                  pop(event);
                  setFontFamily(option.value);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="word-type-active-layer" aria-hidden="true" ref={fontFamilyClip.containerRef}>
          <ul className="word-type-tab-list word-type-tab-list-overlay">
            {fontFamilyOptions.map((option) => (
              <li key={option.value}>
                <button type="button" tabIndex={-1} data-font-option={option.value}>
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
