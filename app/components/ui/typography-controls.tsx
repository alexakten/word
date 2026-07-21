"use client";

/* eslint-disable react-hooks/refs -- clip-path refs are passed directly to rendered tab elements. */

import { useEffect, useState } from "react";
import { useActiveTabClipPath } from "./use-active-tab-clip-path";
import { useControlPop } from "./use-control-pop";

type FontFamily = "sans" | "serif";

const fontFamilyOptions = [
  { value: "sans", label: "Sans" },
  { value: "serif", label: "Serif" },
] as const;

const FONT_FAMILY_EVENT = "spellsurf:font-family";

function parseFontFamily(value: string | null | undefined): FontFamily | null {
  return value === "sans" || value === "serif" ? value : null;
}

export function TypographyControls() {
  const [fontFamily, setFontFamily] = useState<FontFamily>("sans");
  const pop = useControlPop();
  const fontFamilyClip = useActiveTabClipPath(fontFamily);

  /* eslint-disable react-hooks/set-state-in-effect -- DOM font state hydrates the client control on mount. */
  useEffect(() => {
    const fromDom = parseFontFamily(document.documentElement.getAttribute("data-font-family"));
    if (fromDom) setFontFamily(fromDom);

    const onFontFamilyChange = (event: Event) => {
      const next = parseFontFamily((event as CustomEvent<string>).detail);
      if (!next) return;
      setFontFamily((current) => (current === next ? current : next));
    };
    window.addEventListener(FONT_FAMILY_EVENT, onFontFamilyChange);
    return () => window.removeEventListener(FONT_FAMILY_EVENT, onFontFamilyChange);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-font-family", fontFamily);
    root.removeAttribute("data-font-caps");
    root.removeAttribute("data-font-bold");
    root.removeAttribute("data-font-italic");
  }, [fontFamily]);

  const selectFontFamily = (next: FontFamily) => {
    setFontFamily(next);
    window.dispatchEvent(new CustomEvent(FONT_FAMILY_EVENT, { detail: next }));
  };

  return (
    <div className="typography-controls" aria-label="Typography settings">
      <button
        className="mobile-typography-cycle"
        type="button"
        aria-label={`Font: ${fontFamily}. Switch to ${fontFamily === "sans" ? "serif" : "sans"}`}
        onClick={(event) => {
          pop(event);
          selectFontFamily(fontFamily === "sans" ? "serif" : "sans");
        }}
      >
        <span key={fontFamily}>{fontFamily === "sans" ? "Sans" : "Serif"}</span>
      </button>
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
                  selectFontFamily(option.value);
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
