import { WebHaptics, type HapticInput } from "web-haptics";

let haptics: WebHaptics | null = null;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getHaptics(): WebHaptics | null {
  if (typeof window === "undefined" || prefersReducedMotion()) return null;
  // Always create an instance — on iOS (no Vibration API) web-haptics falls
  // back to a switch-input click that can still produce system haptics.
  if (!haptics) haptics = new WebHaptics({ showSwitch: false });
  return haptics;
}

function trigger(input: HapticInput = "selection") {
  const instance = getHaptics();
  if (!instance) return;
  void instance.trigger(input);
}

/** Haptic presets mirrored to UI sound roles. */
export const hapticsFeedback = {
  /** Light UI taps — buttons, steppers, dropdowns */
  click: () => trigger("selection"),
  /** Theme / mode switches */
  toggle: () => trigger("soft"),
  /** Reset / dismiss */
  drop: () => trigger("medium"),
  /** Domain available */
  success: () => trigger("success"),
  /** Save / copy confirm */
  successMinimal: () => trigger("light"),
  /** Keyboard shortcuts, generate */
  tick: () => trigger("rigid"),
};
