"use client";

import { useEffect, useRef } from "react";
import { sounds } from "../lib/sounds";

const SWIPE_MIN_DISTANCE = 56;
const SWIPE_MAX_SLOPE = 0.65;
const CENTER_TOP = 0.18;
const CENTER_BOTTOM = 0.72;

type UseHistorySwipeOptions = {
  enabled: boolean;
  onBack: () => void;
  onForward: () => void;
};

function isIgnoredTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "input, textarea, select, .mobile-bottom-bar, .controls, .split-settings-panel, .mobile-slice-panel, .site-header, .saved-modal, .modal-overlay, .tld-menu, .about-drawer-overlay, .about-drawer-content",
    ),
  );
}

function isInCenterBand(clientY: number) {
  const top = window.innerHeight * CENTER_TOP;
  const bottom = window.innerHeight * CENTER_BOTTOM;
  return clientY >= top && clientY <= bottom;
}

export function useHistorySwipe({ enabled, onBack, onForward }: UseHistorySwipeOptions) {
  const onBackRef = useRef(onBack);
  const onForwardRef = useRef(onForward);

  useEffect(() => {
    onBackRef.current = onBack;
    onForwardRef.current = onForward;
  }, [onBack, onForward]);

  useEffect(() => {
    if (!enabled) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let pointerId: number | null = null;

    const reset = () => {
      tracking = false;
      pointerId = null;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      if (event.isPrimary === false) return;
      if (isIgnoredTarget(event.target)) return;
      if (!isInCenterBand(event.clientY)) return;
      tracking = true;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!tracking || event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      reset();

      if (Math.abs(dx) < SWIPE_MIN_DISTANCE) return;
      if (Math.abs(dy) > Math.abs(dx) * SWIPE_MAX_SLOPE) return;

      sounds.tick();
      if (dx > 0) onBackRef.current();
      else onForwardRef.current();
    };

    const onPointerCancel = (event: PointerEvent) => {
      if (event.pointerId === pointerId) reset();
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerCancel, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [enabled]);
}
