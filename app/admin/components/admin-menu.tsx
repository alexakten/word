"use client";

import { ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export type AdminMenuOption<T extends string | number> = {
  value: T;
  label: string;
  disabled?: boolean;
  style?: CSSProperties;
  className?: string;
};

type AdminMenuProps<T extends string | number> = {
  label?: string;
  value: T | "";
  options: AdminMenuOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  title?: string;
  ariaLabel: string;
  className?: string;
  menuClassName?: string;
  renderValue?: (option: AdminMenuOption<T> | undefined) => ReactNode;
  renderOption?: (option: AdminMenuOption<T>, selected: boolean) => ReactNode;
};

export function AdminMenu<T extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder = "Select",
  disabled = false,
  title,
  ariaLabel,
  className,
  menuClassName,
  renderValue,
  renderOption,
}: AdminMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);
  const isOpen = open && !disabled;

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={rootRef}
      className={["admin-menu", isOpen ? "is-open" : "", className].filter(Boolean).join(" ")}
      title={title}
    >
      {label ? <span className="admin-control-label">{label}</span> : null}
      <button
        type="button"
        className="admin-menu-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="admin-menu-value">
          {renderValue
            ? renderValue(selected)
            : selected
              ? selected.label
              : placeholder}
        </span>
        <ChevronDown size={13} strokeWidth={2} className="admin-menu-chevron" />
      </button>
      {isOpen ? (
        <div
          id={listId}
          className={["admin-menu-panel", menuClassName].filter(Boolean).join(" ")}
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                className={[
                  "admin-menu-option",
                  isSelected ? "is-selected" : "",
                  option.className,
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={option.style}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {renderOption ? renderOption(option, isSelected) : option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
