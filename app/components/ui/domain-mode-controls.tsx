"use client";

import { ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ALL_TLDS, filterTlds, NAME_DISPLAY_MODE_OPTIONS, POPULAR_TLDS } from "../../lib/constants";
import { sounds } from "../../lib/sounds";
import type { NameDisplayMode } from "../../lib/types";
import { MixSegmentToggle } from "./mix-segment-toggle";

export function TldDropdown({ value, disabled = false, onChange }: { value: string; disabled?: boolean; onChange: (tld: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const filteredTlds = useMemo(() => filterTlds(query), [query]);
  const popularCount = useMemo(
    () => (query.trim() ? 0 : POPULAR_TLDS.length),
    [query],
  );

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (activeIndex >= filteredTlds.length) {
      setActiveIndex(filteredTlds.length > 0 ? filteredTlds.length - 1 : -1);
    }
  }, [activeIndex, filteredTlds.length]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const option = listRef.current?.querySelector<HTMLElement>(`[data-tld-index="${activeIndex}"]`);
    option?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const closeMenu = () => {
    setOpen(false);
    setActiveIndex(-1);
    setQuery("");
  };

  const selectTld = (tld: string) => {
    sounds.click();
    onChange(tld);
    closeMenu();
  };

  const openMenu = () => {
    setOpen(true);
    setQuery("");
    const selectedIndex = ALL_TLDS.indexOf(value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const moveActive = (delta: number) => {
    if (filteredTlds.length === 0) return;
    setActiveIndex((current) => {
      const next = current < 0 ? 0 : current + delta;
      return Math.max(0, Math.min(next, filteredTlds.length - 1));
    });
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
          if (open) closeMenu();
          else openMenu();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openMenu();
          } else if (event.key === "Escape") {
            closeMenu();
          }
        }}
      >
        <span>{value}</span>
        <ChevronDown size={12} strokeWidth={1.6} aria-hidden="true" />
      </button>
      {open && !disabled ? (
        <div className="tld-dropdown-menu" role="presentation">
          <label className="tld-dropdown-search">
            <Search size={12} strokeWidth={1.8} aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              placeholder="Search"
              aria-label="Search domain endings"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  moveActive(1);
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  moveActive(-1);
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  const tld = filteredTlds[Math.max(0, activeIndex)];
                  if (tld) selectTld(tld);
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  closeMenu();
                }
              }}
            />
          </label>
          {filteredTlds.length > 0 ? (
            <ul className="tld-dropdown-list" role="listbox" aria-label="Top-level domain" ref={listRef}>
              {filteredTlds.map((tld, index) => (
                <li
                  key={tld}
                  className={popularCount > 0 && index === popularCount ? "tld-dropdown-divider" : undefined}
                >
                  <button
                    type="button"
                    role="option"
                    data-tld-index={index}
                    aria-selected={value === tld}
                    className={[
                      value === tld ? "selected" : "",
                      activeIndex === index ? "active" : "",
                    ].filter(Boolean).join(" ") || undefined}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectTld(tld)}
                  >
                    <span>{tld}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="tld-dropdown-empty">No matches</p>
          )}
        </div>
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
