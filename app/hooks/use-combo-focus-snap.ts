"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

const WHEEL_SNAP_DISTANCE = 240;
const TOUCH_SNAP_DISTANCE = 180;
const SNAP_THRESHOLD = 0.45;

const GESTURE_EXCLUSION_SELECTOR = [
  ".split-sidebar-stack",
  ".split-settings-panel",
  ".split-slice-panel",
  ".discover-top-brand",
  ".site-header",
  ".controls",
  ".mobile-bottom-bar",
  ".mobile-discover-toolbar",
  ".mobile-style-toolbar",
  ".saved-modal",
  ".modal-overlay",
  ".about-drawer-overlay",
  ".about-drawer-content",
].join(", ");

function isAvailableGestureArea(target: EventTarget | null) {
  if (!(target instanceof Element)) return true;
  if (target.closest(".split-word-anchor")) return true;
  return !target.closest(GESTURE_EXCLUSION_SELECTOR);
}

export function useComboFocusSnap(enabled: boolean) {
  const [progress, setProgress] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const progressRef = useRef(0);
  const wheelEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart = useRef({ y: 0, progress: 0 });
  const touchTracking = useRef(false);

  const updateProgress = useCallback((next: number, interacting: boolean) => {
    const clamped = Math.min(1, Math.max(0, next));
    progressRef.current = clamped;
    setProgress(clamped);
    setIsInteracting(interacting);
  }, []);

  const snap = useCallback((target?: 0 | 1) => {
    const destination = target ?? (progressRef.current >= SNAP_THRESHOLD ? 1 : 0);
    updateProgress(destination, false);
  }, [updateProgress]);

  const clearWheelTimer = useCallback(() => {
    if (wheelEndTimer.current !== null) {
      clearTimeout(wheelEndTimer.current);
      wheelEndTimer.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return clearWheelTimer;

    const onWheel = (event: WheelEvent) => {
      if (!isAvailableGestureArea(event.target) || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      clearWheelTimer();
      const pixelDelta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      updateProgress(progressRef.current - pixelDelta / WHEEL_SNAP_DISTANCE, true);
      wheelEndTimer.current = setTimeout(() => {
        snap();
        wheelEndTimer.current = null;
      }, 110);
    };

    const onTouchStart = (event: TouchEvent) => {
      touchTracking.current = event.touches.length === 1 && isAvailableGestureArea(event.target);
      if (!touchTracking.current) return;
      clearWheelTimer();
      touchStart.current = {
        y: event.touches[0]!.clientY,
        progress: progressRef.current,
      };
      setIsInteracting(true);
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!touchTracking.current || event.touches.length !== 1) return;
      const delta = event.touches[0]!.clientY - touchStart.current.y;
      if (Math.abs(delta) > 4) event.preventDefault();
      updateProgress(touchStart.current.progress + delta / TOUCH_SNAP_DISTANCE, true);
    };

    const onTouchEnd = () => {
      if (!touchTracking.current) return;
      touchTracking.current = false;
      snap();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      clearWheelTimer();
      touchTracking.current = false;
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [clearWheelTimer, enabled, snap, updateProgress]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (!enabled || event.currentTarget !== event.target) return;
    if (event.key === "ArrowDown" || event.key === "PageDown") {
      event.preventDefault();
      snap(1);
    } else if (event.key === "ArrowUp" || event.key === "PageUp") {
      event.preventDefault();
      snap(0);
    }
  }, [enabled, snap]);

  return {
    progress,
    isInteracting,
    isCollapsed: !isInteracting && progress === 1,
    keyboardProps: {
      onKeyDown,
    },
  };
}
