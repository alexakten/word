"use client";

import { Minus, Plus } from "lucide-react";

type AdminStepperProps = {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  title?: string;
  ariaLabel: string;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
  className?: string;
  showSlider?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function AdminStepper({
  label,
  value,
  min,
  max,
  step = 1,
  disabled = false,
  title,
  ariaLabel,
  formatValue = (next) => String(next),
  onChange,
  className,
  showSlider = true,
}: AdminStepperProps) {
  const setValue = (next: number) => {
    onChange(clamp(next, min, max));
  };

  return (
    <div
      className={["admin-stepper", className].filter(Boolean).join(" ")}
      title={title}
      role="group"
      aria-label={ariaLabel}
    >
      {label ? <span className="admin-control-label">{label}</span> : null}
      <div className="admin-stepper-controls">
        <button
          type="button"
          className="admin-stepper-button"
          aria-label={`Decrease ${ariaLabel}`}
          disabled={disabled || value <= min}
          onClick={() => setValue(value - step)}
        >
          <Minus size={12} strokeWidth={2.2} />
        </button>
        <span className="admin-stepper-value" aria-live="polite">
          {formatValue(value)}
        </span>
        <button
          type="button"
          className="admin-stepper-button"
          aria-label={`Increase ${ariaLabel}`}
          disabled={disabled || value >= max}
          onClick={() => setValue(value + step)}
        >
          <Plus size={12} strokeWidth={2.2} />
        </button>
      </div>
      {showSlider ? (
        <input
          className="admin-stepper-slider"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-label={ariaLabel}
          onChange={(event) => setValue(Number(event.target.value))}
        />
      ) : null}
    </div>
  );
}
