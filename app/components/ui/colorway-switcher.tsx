"use client";

import { useEffect, useState, type PointerEvent } from "react";
import {
  colorways,
  DEFAULT_COLORWAY,
  parseColorway,
  readColorwayFromSearch,
  syncColorwayUrlParam,
  type Colorway,
} from "../../lib/colorways";
import { sounds } from "../../lib/sounds";
import { isAdminMode } from "../../lib/admin-mode";

const COLORWAY_EVENT = "spellsurf:colorway";
const CUSTOM_COLORS_EVENT = "spellsurf:custom-colors";
const DEFAULT_BACKGROUND = "#3b82f5";
const DEFAULT_TEXT = "#ffffff";

type CustomColors = {
  background: string;
  text: string;
};

function readThemeColors(): CustomColors {
  const styles = getComputedStyle(document.documentElement);
  const background = styles.getPropertyValue("--paper").trim();
  const text = styles.getPropertyValue("--ink").trim();

  return {
    background: /^#[\da-f]{6}$/i.test(background) ? background : DEFAULT_BACKGROUND,
    text: /^#[\da-f]{6}$/i.test(text) ? text : DEFAULT_TEXT,
  };
}

function clearCustomColors() {
  const root = document.documentElement;
  ["--paper", "--ink", "--hero-ink", "--line", "--muted", "--faint"].forEach((property) => {
    root.style.removeProperty(property);
  });
}

function applyCustomColors(colors: CustomColors) {
  const root = document.documentElement;
  root.style.setProperty("--paper", colors.background);
  root.style.setProperty("--ink", colors.text);
  root.style.setProperty("--hero-ink", colors.text);
  root.style.setProperty("--line", colors.text);
  root.style.setProperty("--muted", `color-mix(in srgb, ${colors.text} 78%, transparent)`);
  root.style.setProperty("--faint", `color-mix(in srgb, ${colors.text} 62%, transparent)`);
}

type HexColorPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

type HsvColor = {
  hue: number;
  saturation: number;
  value: number;
};

function hexToHsv(hex: string): HsvColor {
  const red = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const green = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;

  if (delta) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }

  return {
    hue: hue < 0 ? hue + 360 : hue,
    saturation: max === 0 ? 0 : delta / max,
    value: max,
  };
}

function hsvToHex({ hue, saturation, value }: HsvColor) {
  const chroma = value * saturation;
  const section = ((hue % 360) + 360) % 360 / 60;
  const secondary = chroma * (1 - Math.abs((section % 2) - 1));
  const [red, green, blue] = section < 1 ? [chroma, secondary, 0]
    : section < 2 ? [secondary, chroma, 0]
      : section < 3 ? [0, chroma, secondary]
        : section < 4 ? [0, secondary, chroma]
          : section < 5 ? [secondary, 0, chroma]
            : [chroma, 0, secondary];
  const match = value - chroma;
  const channel = (number: number) => Math.round((number + match) * 255).toString(16).padStart(2, "0");
  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

function canonicalHex(value: string) {
  const trimmed = value.trim().replace(/^#+/, "#");
  const prefixed = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return /^#[\da-f]{6}$/i.test(prefixed) ? prefixed.toLowerCase() : null;
}

function HexColorPicker({ label, value, onChange }: HexColorPickerProps) {
  const [draft, setDraft] = useState(value);
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const validHex = canonicalHex(draft);

  const updateHsv = (next: HsvColor) => {
    const hex = hsvToHex(next);
    setHsv(next);
    setDraft(hex);
    onChange(hex);
  };

  const updateColorField = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const saturation = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    const nextValue = 1 - Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
    updateHsv({ ...hsv, saturation, value: nextValue });
  };

  const commit = () => {
    if (!validHex) {
      setDraft(value);
      return;
    }
    setDraft(validHex);
    onChange(validHex);
  };

  return (
    <details
      className="admin-color-picker"
      onToggle={(event) => {
        if (event.currentTarget.open) {
          document.querySelectorAll<HTMLDetailsElement>(".admin-color-picker[open]").forEach((picker) => {
            if (picker !== event.currentTarget) picker.removeAttribute("open");
          });
          setDraft(value);
          setHsv(hexToHsv(value));
        }
      }}
    >
      <summary aria-label={label} title={label}>
        <span className="admin-color-picker-swatch" style={{ backgroundColor: value }} aria-hidden="true" />
      </summary>
      <div className="admin-color-popover">
        <div
          className="admin-color-field"
          style={{ backgroundColor: `hsl(${hsv.hue} 100% 50%)` }}
          role="slider"
          aria-label={`${label} saturation and brightness`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(hsv.saturation * 100)}
          aria-valuetext={`${Math.round(hsv.saturation * 100)}% saturation, ${Math.round(hsv.value * 100)}% brightness`}
          tabIndex={0}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            updateColorField(event);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) updateColorField(event);
          }}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 0.1 : 0.02;
            if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
            event.preventDefault();
            updateHsv({
              ...hsv,
              saturation: Math.min(1, Math.max(0, hsv.saturation + (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0))),
              value: Math.min(1, Math.max(0, hsv.value + (event.key === "ArrowDown" ? -step : event.key === "ArrowUp" ? step : 0))),
            });
          }}
        >
          <span
            className="admin-color-field-handle"
            style={{ left: `${hsv.saturation * 100}%`, top: `${(1 - hsv.value) * 100}%` }}
            aria-hidden="true"
          />
        </div>
        <label className="admin-hue-field">
          <span className="sr-only">Hue</span>
          <input
            type="range"
            min="0"
            max="359"
            value={Math.round(hsv.hue)}
            aria-label={`${label} hue`}
            onChange={(event) => updateHsv({ ...hsv, hue: Number(event.target.value) })}
          />
        </label>
        <div className="admin-hex-row">
          <label className="admin-hex-field">
            <span>HEX</span>
            <input
              type="text"
              value={draft}
              maxLength={7}
              spellCheck={false}
              autoCapitalize="off"
              aria-label={`${label} hex value`}
              onChange={(event) => {
                const next = event.target.value.replace(/^#{2,}/, "#");
                setDraft(next);
                const hex = canonicalHex(next);
                if (hex) {
                  setHsv(hexToHsv(hex));
                  onChange(hex);
                }
              }}
              onPaste={(event) => {
                event.preventDefault();
                const pasted = event.clipboardData.getData("text").trim().replace(/^#+/, "#");
                const next = pasted.startsWith("#") ? pasted : `#${pasted}`;
                setDraft(next);
                const hex = canonicalHex(next);
                if (hex) {
                  setHsv(hexToHsv(hex));
                  onChange(hex);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  commit();
                  if (validHex) event.currentTarget.closest("details")?.removeAttribute("open");
                }
                if (event.key === "Escape") event.currentTarget.closest("details")?.removeAttribute("open");
              }}
            />
          </label>
          <button
            type="button"
            disabled={!validHex}
            onClick={(event) => {
              commit();
              event.currentTarget.closest("details")?.removeAttribute("open");
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </details>
  );
}

export function ColorwaySwitcher() {
  const [activeColorway, setActiveColorway] = useState<Colorway>(DEFAULT_COLORWAY);
  const [hydrated, setHydrated] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [customColors, setCustomColors] = useState<CustomColors>({
    background: DEFAULT_BACKGROUND,
    text: DEFAULT_TEXT,
  });

  /* eslint-disable react-hooks/set-state-in-effect -- URL and DOM theme state hydrate together on mount. */
  useEffect(() => {
    const fromUrl = readColorwayFromSearch();
    setActiveColorway(fromUrl);
    document.documentElement.setAttribute("data-colorway", fromUrl);
    setAdminMode(isAdminMode());
    setCustomColors(readThemeColors());
    setHydrated(true);

    const onColorwayChange = (event: Event) => {
      const next = parseColorway((event as CustomEvent<string>).detail);
      if (!next) return;
      setActiveColorway((current) => (current === next ? current : next));
    };
    const onCustomColorsChange = (event: Event) => {
      const colors = (event as CustomEvent<CustomColors>).detail;
      if (!colors) return;
      setCustomColors(colors);
    };
    const onDocumentPointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest(".admin-color-picker")) return;
      document.querySelectorAll<HTMLDetailsElement>(".admin-color-picker[open]").forEach((picker) => {
        picker.removeAttribute("open");
      });
    };
    window.addEventListener(COLORWAY_EVENT, onColorwayChange);
    window.addEventListener(CUSTOM_COLORS_EVENT, onCustomColorsChange);
    document.addEventListener("pointerdown", onDocumentPointerDown);
    return () => {
      window.removeEventListener(COLORWAY_EVENT, onColorwayChange);
      window.removeEventListener(CUSTOM_COLORS_EVENT, onCustomColorsChange);
      document.removeEventListener("pointerdown", onDocumentPointerDown);
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.setAttribute("data-colorway", activeColorway);
    syncColorwayUrlParam(activeColorway);
  }, [activeColorway, hydrated]);

  const selectColorway = (colorway: Colorway) => {
    if (colorway !== activeColorway) sounds.toggle();
    clearCustomColors();
    document.documentElement.setAttribute("data-colorway", colorway);
    setActiveColorway(colorway);
    window.dispatchEvent(new CustomEvent(COLORWAY_EVENT, { detail: colorway }));
    const colors = readThemeColors();
    setCustomColors(colors);
    window.dispatchEvent(new CustomEvent(CUSTOM_COLORS_EVENT, { detail: colors }));
  };

  const selectCustomColor = (property: keyof CustomColors, value: string) => {
    const colors = { ...customColors, [property]: value };
    setCustomColors(colors);
    applyCustomColors(colors);
    window.dispatchEvent(new CustomEvent(CUSTOM_COLORS_EVENT, { detail: colors }));
  };

  const cycleColorway = () => {
    const activeIndex = colorways.findIndex((colorway) => colorway.id === activeColorway);
    const nextColorway = colorways[(activeIndex + 1) % colorways.length];
    selectColorway(nextColorway.id);
  };

  return (
    <div
      className={["colorway-switcher", adminMode ? "is-admin" : ""].filter(Boolean).join(" ")}
      role="group"
      aria-label={adminMode ? "Theme colors" : "Choose a colorway"}
    >
      <button
        className="theme-cycle-button"
        type="button"
        aria-label={`Theme: ${colorways.find((colorway) => colorway.id === activeColorway)?.label}. Choose next theme`}
        onClick={cycleColorway}
      >
        <span
          className={`colorway-swatch theme-cycle-swatch colorway-swatch-${activeColorway} is-popping`}
          key={activeColorway}
          aria-hidden="true"
        />
        <span className="sr-only">Choose next color theme</span>
      </button>
      {adminMode ? (
        <>
          <HexColorPicker
            label="Background color"
            value={customColors.background}
            onChange={(value) => selectCustomColor("background", value)}
          />
          <HexColorPicker
            label="Text color"
            value={customColors.text}
            onChange={(value) => selectCustomColor("text", value)}
          />
        </>
      ) : null}
    </div>
  );
}
