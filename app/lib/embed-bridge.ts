export const EMBED_MESSAGE_TYPE = "spellsurf:embed" as const;

export type EmbedBridgeMessage = {
  type: typeof EMBED_MESSAGE_TYPE;
  focusMode?: boolean;
  hideDescriptions?: boolean;
  /** Hide source words / pronunciation / definitions — combo word only, centered. */
  comboOnly?: boolean;
  /** Hard-hide chrome for PNG capture (independent of focus mode). */
  captureMode?: boolean;
  /** Native paint multiplier during capture (CSS zoom) for crisp text. */
  captureScale?: number;
  /** Logical design width the zoom is based on. */
  captureWidth?: number;
  /** Logical design height the zoom is based on. */
  captureHeight?: number;
  /** Multiplier for in-frame content size (1 = 100%). */
  contentZoom?: number;
  /** Left description column max width in rem. */
  leftColumnRem?: number;
  /** Right description column max width in rem. */
  rightColumnRem?: number;
};

export function isEmbedBridgeMessage(value: unknown): value is EmbedBridgeMessage {
  if (!value || typeof value !== "object") return false;
  return (value as EmbedBridgeMessage).type === EMBED_MESSAGE_TYPE;
}

export function isEmbedMode() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("embed");
}

export function clampColumnRem(value: number) {
  if (!Number.isFinite(value)) return 28;
  return Math.min(40, Math.max(6, value));
}
