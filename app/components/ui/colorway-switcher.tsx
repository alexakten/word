"use client";

import { useEffect, useState } from "react";
import {
  colorways,
  DEFAULT_COLORWAY,
  parseColorway,
  readColorwayFromSearch,
  syncColorwayUrlParam,
  type Colorway,
} from "../../lib/colorways";
import { sounds } from "../../lib/sounds";
import { useControlPop } from "./use-control-pop";

const COLORWAY_EVENT = "spellsurf:colorway";

export function ColorwaySwitcher() {
  const [activeColorway, setActiveColorway] = useState<Colorway>(DEFAULT_COLORWAY);
  const [hydrated, setHydrated] = useState(false);
  const pop = useControlPop();

  /* eslint-disable react-hooks/set-state-in-effect -- URL and DOM theme state hydrate together on mount. */
  useEffect(() => {
    const fromUrl = readColorwayFromSearch();
    setActiveColorway(fromUrl);
    document.documentElement.setAttribute("data-colorway", fromUrl);
    setHydrated(true);

    const onColorwayChange = (event: Event) => {
      const next = parseColorway((event as CustomEvent<string>).detail);
      if (!next) return;
      setActiveColorway((current) => (current === next ? current : next));
    };
    window.addEventListener(COLORWAY_EVENT, onColorwayChange);
    return () => window.removeEventListener(COLORWAY_EVENT, onColorwayChange);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.setAttribute("data-colorway", activeColorway);
    syncColorwayUrlParam(activeColorway);
  }, [activeColorway, hydrated]);

  const selectColorway = (colorway: Colorway) => {
    if (colorway !== activeColorway) sounds.toggle();
    setActiveColorway(colorway);
    window.dispatchEvent(new CustomEvent(COLORWAY_EVENT, { detail: colorway }));
  };

  const cycleColorway = () => {
    const activeIndex = colorways.findIndex((colorway) => colorway.id === activeColorway);
    const nextColorway = colorways[(activeIndex + 1) % colorways.length];
    selectColorway(nextColorway.id);
  };

  return (
    <div className="colorway-switcher" role="group" aria-label="Choose a colorway">
      <button
        className="mobile-colorway-cycle"
        type="button"
        aria-label={`Theme: ${colorways.find((colorway) => colorway.id === activeColorway)?.label}. Choose next theme`}
        title="Change color theme"
        onClick={cycleColorway}
      >
        <span
          className={`colorway-swatch mobile-colorway-cycle-swatch colorway-swatch-${activeColorway} is-popping`}
          key={activeColorway}
          aria-hidden="true"
        />
        <span className="sr-only">Choose next color theme</span>
      </button>
      {colorways.map((colorway) => (
        <button
          className={`colorway-swatch colorway-swatch-${colorway.id}`}
          type="button"
          key={colorway.id}
          aria-label={colorway.label}
          aria-pressed={activeColorway === colorway.id}
          title={colorway.label}
          onClick={(event) => {
            pop(event, { sound: false });
            selectColorway(colorway.id);
          }}
        >
          <span className="sr-only">{colorway.label}</span>
        </button>
      ))}
    </div>
  );
}
