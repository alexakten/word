"use client";

import { Dices } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DISPLAY_FONT_EVENT,
  DISPLAY_FONT_OPTIONS,
  DEFAULT_DISPLAY_FONT,
  applyDisplayFontToDocument,
  clearDisplayFontFromDocument,
  normalizeDisplayFont,
  type DisplayFontState,
} from "../../lib/display-fonts";
import { WORD_CAPITALIZATION_OPTIONS } from "../../lib/constants";
import type { BrandLogoId } from "../../lib/brand-logos";
import type { EmbedFontFamily } from "../../lib/embed-bridge";
import type { WordCapitalization } from "../../lib/types";
import { sounds } from "../../lib/sounds";
import { useControlPop } from "./use-control-pop";

type BasicFontFamily = "sans" | "serif";

const FONT_FAMILY_EVENT = "spellsurf:font-family";

function parseBasicFontFamily(value: string | null | undefined): BasicFontFamily | null {
  return value === "sans" || value === "serif" ? value : null;
}

/** Simple Sans / Serif cycle used outside Brand mode. */
export function TypographyControls({ className = "" }: { className?: string }) {
  const [fontFamily, setFontFamily] = useState<BasicFontFamily>("sans");
  const pop = useControlPop();

  /* eslint-disable react-hooks/set-state-in-effect -- DOM font state hydrates the client control on mount. */
  useEffect(() => {
    clearDisplayFontFromDocument();
    const fromDom = parseBasicFontFamily(document.documentElement.getAttribute("data-font-family"));
    if (fromDom) setFontFamily(fromDom);

    const onFontFamilyChange = (event: Event) => {
      const next = parseBasicFontFamily((event as CustomEvent<string>).detail);
      if (!next) return;
      setFontFamily((current) => (current === next ? current : next));
    };
    window.addEventListener(FONT_FAMILY_EVENT, onFontFamilyChange);
    return () => window.removeEventListener(FONT_FAMILY_EVENT, onFontFamilyChange);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const root = document.documentElement;
    clearDisplayFontFromDocument();
    root.setAttribute("data-font-family", fontFamily);
    root.removeAttribute("data-font-caps");
    root.removeAttribute("data-font-bold");
    root.removeAttribute("data-font-italic");
  }, [fontFamily]);

  const selectFontFamily = (next: BasicFontFamily) => {
    setFontFamily(next);
    window.dispatchEvent(new CustomEvent(FONT_FAMILY_EVENT, { detail: next }));
  };

  return (
    <div className={["typography-controls", className].filter(Boolean).join(" ")} aria-label="Typography settings">
      <button
        className="font-cycle-button"
        type="button"
        aria-label={`Font: ${fontFamily}. Switch to ${fontFamily === "sans" ? "serif" : "sans"}`}
        onClick={(event) => {
          pop(event);
          selectFontFamily(fontFamily === "sans" ? "serif" : "sans");
        }}
      >
        <span key={fontFamily}>{fontFamily === "sans" ? "Sans" : "Serif"}</span>
      </button>
    </div>
  );
}

/** Brand-mode font cycle. Weight and tracking come from fixed per-font presets. */
export function BrandTypographyControls({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [state, setState] = useState<DisplayFontState>(DEFAULT_DISPLAY_FONT);
  const pop = useControlPop();

  /* eslint-disable react-hooks/set-state-in-effect -- DOM font state hydrates the client control on mount. */
  useEffect(() => {
    const fromDom = normalizeDisplayFont({
      fontFamily: document.documentElement.getAttribute("data-display-font") ?? undefined,
    });
    setState(fromDom);
    applyDisplayFontToDocument(fromDom);

    const onFontChange = (event: Event) => {
      const detail = (event as CustomEvent<Partial<DisplayFontState>>).detail;
      setState(normalizeDisplayFont({ fontFamily: detail?.fontFamily }));
    };
    window.addEventListener(DISPLAY_FONT_EVENT, onFontChange);
    return () => {
      window.removeEventListener(DISPLAY_FONT_EVENT, onFontChange);
      clearDisplayFontFromDocument();
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    applyDisplayFontToDocument(state);
  }, [state]);

  const publish = (fontFamily: EmbedFontFamily) => {
    const next = normalizeDisplayFont({ fontFamily });
    setState(next);
    window.dispatchEvent(new CustomEvent(DISPLAY_FONT_EVENT, { detail: next }));
  };

  const cycleFont = () => {
    const index = DISPLAY_FONT_OPTIONS.findIndex((entry) => entry.value === state.fontFamily);
    const nextIndex = (Math.max(index, 0) + 1) % DISPLAY_FONT_OPTIONS.length;
    publish(DISPLAY_FONT_OPTIONS[nextIndex]!.value);
  };

  const fontLabel = DISPLAY_FONT_OPTIONS.find((entry) => entry.value === state.fontFamily)?.label ?? state.fontFamily;

  return (
    <button
      className={["font-cycle-button", compact ? "is-compact" : "", className].filter(Boolean).join(" ")}
      type="button"
      aria-label={`Font: ${fontLabel}. Next font`}
      onClick={(event) => {
        pop(event);
        sounds.click();
        cycleFont();
      }}
    >
      <span key={state.fontFamily}>{compact ? fontLabel.split(" ")[0] : fontLabel}</span>
    </button>
  );
}

export function LogoStyleControls({
  logoId,
  onCycle,
  className = "",
}: {
  logoId: BrandLogoId;
  onCycle: () => void;
  className?: string;
}) {
  const pop = useControlPop();

  return (
    <button
      className={["font-cycle-button logo-cycle-button", className].filter(Boolean).join(" ")}
      type="button"
      aria-label={`Logo: ${logoId}. Next logo`}
      onClick={(event) => {
        pop(event);
        sounds.click();
        onCycle();
      }}
    >
      <span key={logoId}>{logoId}</span>
    </button>
  );
}

export function CapitalizationControls({
  value,
  onChange,
  className = "",
}: {
  value: WordCapitalization;
  onChange: (value: WordCapitalization) => void;
  className?: string;
}) {
  const pop = useControlPop();
  const index = WORD_CAPITALIZATION_OPTIONS.findIndex((entry) => entry.value === value);
  const current = WORD_CAPITALIZATION_OPTIONS[index >= 0 ? index : 0]!;
  const next = WORD_CAPITALIZATION_OPTIONS[(Math.max(index, 0) + 1) % WORD_CAPITALIZATION_OPTIONS.length]!;

  return (
    <button
      className={["font-cycle-button capitalization-cycle-button", className].filter(Boolean).join(" ")}
      type="button"
      aria-label={`Capitalization: ${current.label}. Switch to ${next.label}`}
      title={current.label}
      onClick={(event) => {
        pop(event);
        sounds.click();
        onChange(next.value);
      }}
    >
      <span key={current.value}>{current.label}</span>
    </button>
  );
}

export function BrandStyleRandomizeButton({
  enabled,
  onEnabledChange,
  className = "",
}: {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  className?: string;
}) {
  const pop = useControlPop();

  return (
    <button
      className={["brand-icon-button brand-style-randomize-button", enabled ? "is-active" : "", className].filter(Boolean).join(" ")}
      type="button"
      aria-pressed={enabled}
      aria-label={enabled ? "Randomize style on generate: on" : "Randomize style on generate: off"}
      title={enabled ? "Randomize on generate" : "Randomize on generate off"}
      onClick={(event) => {
        pop(event);
        sounds.click();
        onEnabledChange(!enabled);
      }}
    >
      <Dices size={14} strokeWidth={1.8} aria-hidden="true" />
    </button>
  );
}
