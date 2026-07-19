"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NAME_DISPLAY_MODE_OPTIONS, POPULAR_TLDS } from "../../lib/constants";
import { sounds } from "../../lib/sounds";
import type { NameDisplayMode } from "../../lib/types";
import { MixSegmentToggle } from "./mix-segment-toggle";

export function TldDropdown({ value, disabled = false, onChange }: { value: string; disabled?: boolean; onChange: (tld: string) => void }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  const selectTld = (tld: string) => {
    sounds.click();
    onChange(tld);
    setOpen(false);
    setActiveIndex(-1);
  };

  const openMenu = () => {
    setOpen(true);
    setActiveIndex(Math.max(0, POPULAR_TLDS.indexOf(value as (typeof POPULAR_TLDS)[number])));
  };

  return (
    <div className={["tld-dropdown", open && !disabled ? "open" : ""].filter(Boolean).join(" ")} ref={rootRef}>
      <button
        className="tld-dropdown-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open && !disabled}
        aria-label={`Top-level domain: ${value}`}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          sounds.click();
          if (open) {
            setOpen(false);
            setActiveIndex(-1);
          } else {
            openMenu();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openMenu();
          } else if (event.key === "Escape") {
            setOpen(false);
            setActiveIndex(-1);
          }
        }}
      >
        <span>{value}</span>
        <ChevronDown size={12} strokeWidth={1.6} aria-hidden="true" />
      </button>
      {open && !disabled ? (
        <ul className="tld-dropdown-menu" role="listbox" aria-label="Top-level domain">
          {POPULAR_TLDS.map((tld, index) => (
            <li key={tld}>
              <button
                type="button"
                role="option"
                aria-selected={value === tld}
                className={[
                  value === tld ? "selected" : "",
                  activeIndex === index ? "active" : "",
                ].filter(Boolean).join(" ") || undefined}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectTld(tld)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActiveIndex((current) => Math.min(current + 1, POPULAR_TLDS.length - 1));
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActiveIndex((current) => Math.max(current - 1, 0));
                  } else if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectTld(tld);
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    setOpen(false);
                    setActiveIndex(-1);
                  }
                }}
              >
                <span>{tld}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function DomainModeControls({
  displayMode,
  selectedTld,
  className = "",
  hideTld = false,
  onDisplayModeChange,
  onTldChange,
}: {
  displayMode: NameDisplayMode;
  selectedTld: string;
  className?: string;
  hideTld?: boolean;
  onDisplayModeChange: (mode: NameDisplayMode) => void;
  onTldChange: (tld: string) => void;
}) {
  return (
    <div className={["domain-mode-controls", className].filter(Boolean).join(" ")}>
      <MixSegmentToggle
        className="domain-mode-toggle"
        value={displayMode}
        label="Name format"
        options={NAME_DISPLAY_MODE_OPTIONS}
        onChange={onDisplayModeChange}
      />
      {hideTld ? null : (
        <div
          className={`tld-dropdown-slot${displayMode === "domain" ? " visible" : ""}`}
          aria-hidden={displayMode !== "domain"}
        >
          <TldDropdown value={selectedTld} disabled={displayMode !== "domain"} onChange={onTldChange} />
        </div>
      )}
    </div>
  );
}
