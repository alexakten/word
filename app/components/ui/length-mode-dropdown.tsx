"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { LENGTH_MODE_OPTIONS } from "../../lib/constants";
import { sounds } from "../../lib/sounds";
import type { LengthMode } from "../../lib/types";

export function LengthModeDropdown({ value, label = "Comparison", disabled = false, inline = false, onChange }: {
  value: LengthMode;
  label?: string;
  disabled?: boolean;
  inline?: boolean;
  onChange: (value: LengthMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLUListElement | null>(null);
  const selected = LENGTH_MODE_OPTIONS.find((option) => option.value === value) ?? LENGTH_MODE_OPTIONS[1];

  const positionMenu = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewport = window.visualViewport;
    const viewportLeft = viewport?.offsetLeft ?? 0;
    const viewportTop = viewport?.offsetTop ?? 0;
    const viewportWidth = viewport?.width ?? window.innerWidth;
    const viewportHeight = viewport?.height ?? window.innerHeight;
    const edge = 8;
    const gap = 6;
    const width = Math.min(Math.max(rect.width, 152), viewportWidth - edge * 2);
    const menuHeight = menuRef.current?.offsetHeight ?? 120;
    const viewportRight = viewportLeft + viewportWidth;
    const viewportBottom = viewportTop + viewportHeight;
    const left = Math.min(Math.max(rect.left, viewportLeft + edge), viewportRight - width - edge);
    const spaceBelow = viewportBottom - rect.bottom - edge;
    const spaceAbove = rect.top - viewportTop - edge;
    const openAbove = spaceBelow < menuHeight + gap && spaceAbove > spaceBelow;
    const top = openAbove
      ? Math.max(viewportTop + edge, rect.top - menuHeight - gap)
      : Math.min(rect.bottom + gap, viewportBottom - menuHeight - edge);

    setMenuStyle({ position: "fixed", top, left, width });
  }, []);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;

    positionMenu();
    const frame = requestAnimationFrame(positionMenu);
    const viewport = window.visualViewport;
    window.addEventListener("resize", positionMenu);
    document.addEventListener("scroll", positionMenu, true);
    viewport?.addEventListener("resize", positionMenu);
    viewport?.addEventListener("scroll", positionMenu);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", positionMenu);
      document.removeEventListener("scroll", positionMenu, true);
      viewport?.removeEventListener("resize", positionMenu);
      viewport?.removeEventListener("scroll", positionMenu);
    };
  }, [open, positionMenu]);

  const selectOption = (nextValue: LengthMode) => {
    sounds.click();
    onChange(nextValue);
    setOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div
      className={[
        "length-mode-dropdown",
        inline ? "length-mode-dropdown-inline" : "",
        disabled ? "disabled" : "",
        open ? "open" : "",
      ].filter(Boolean).join(" ")}
      ref={rootRef}
    >
      <button
        type="button"
        className="length-mode-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${selected.label}`}
        disabled={disabled}
        ref={triggerRef}
        onClick={() => {
          if (disabled) return;
          sounds.click();
          if (open) {
            setOpen(false);
            setActiveIndex(-1);
          } else {
            setOpen(true);
            setActiveIndex(Math.max(0, LENGTH_MODE_OPTIONS.findIndex((option) => option.value === value)));
          }
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex(Math.max(0, LENGTH_MODE_OPTIONS.findIndex((option) => option.value === value)));
          } else if (event.key === "Escape") {
            setOpen(false);
            setActiveIndex(-1);
          }
        }}
      >
        <span>{selected.label}</span>
        <ChevronDown size={12} strokeWidth={1.6} aria-hidden="true" />
      </button>
      {open && menuStyle ? createPortal(
        <ul
          className={["length-mode-dropdown-menu", inline ? "length-mode-dropdown-menu-inline" : ""].filter(Boolean).join(" ")}
          role="listbox"
          aria-label={label}
          ref={menuRef}
          style={menuStyle}
        >
          {LENGTH_MODE_OPTIONS.map((option, index) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-label={option.label}
                aria-selected={value === option.value}
                className={[
                  value === option.value ? "selected" : "",
                  activeIndex === index ? "active" : "",
                ].filter(Boolean).join(" ") || undefined}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(option.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActiveIndex((current) => Math.min(current + 1, LENGTH_MODE_OPTIONS.length - 1));
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActiveIndex((current) => Math.max(current - 1, 0));
                  } else if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectOption(option.value);
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    setOpen(false);
                    setActiveIndex(-1);
                  }
                }}
              >
                <span>{option.label}</span>
                <span className="length-mode-option-symbol" aria-hidden="true">{option.symbol}</span>
              </button>
            </li>
          ))}
        </ul>,
        document.body,
      ) : null}
    </div>
  );
}
