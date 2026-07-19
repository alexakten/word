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

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.setAttribute("data-colorway", activeColorway);
    syncColorwayUrlParam(activeColorway);
  }, [activeColorway, hydrated]);

  return (
    <div className="colorway-switcher" role="group" aria-label="Choose a colorway">
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
            if (colorway.id !== activeColorway) sounds.toggle();
            setActiveColorway(colorway.id);
            window.dispatchEvent(new CustomEvent(COLORWAY_EVENT, { detail: colorway.id }));
          }}
        >
          <span className="sr-only">{colorway.label}</span>
        </button>
      ))}
    </div>
  );
}
