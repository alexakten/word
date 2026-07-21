"use client";

import type { ReactNode } from "react";

type AdminToggleProps = {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: ReactNode;
  className?: string;
};

export function AdminToggle({
  active,
  onClick,
  disabled = false,
  title,
  children,
  className,
}: AdminToggleProps) {
  return (
    <button
      type="button"
      className={["admin-toggle", active ? "is-active" : "", className].filter(Boolean).join(" ")}
      aria-pressed={active}
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
