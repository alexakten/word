"use client";

import { useEffect, useState } from "react";
import { useControlPop } from "./use-control-pop";

const colorways = [
  { id: "yellow", label: "Yellow" },
  { id: "orange", label: "Orange" },
  { id: "blue", label: "Blue" },
  { id: "green", label: "Green" },
  { id: "purple", label: "Purple" },
  { id: "light", label: "Light" },
  { id: "brown", label: "Brown" },
] as const;

type Colorway = (typeof colorways)[number]["id"];

export function ColorwaySwitcher() {
  const [activeColorway, setActiveColorway] = useState<Colorway>("light");
  const pop = useControlPop();

  useEffect(() => {
    document.documentElement.setAttribute("data-colorway", activeColorway);
  }, [activeColorway]);

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
            pop(event);
            setActiveColorway(colorway.id);
          }}
        >
          <span className="sr-only">{colorway.label}</span>
        </button>
      ))}
    </div>
  );
}
