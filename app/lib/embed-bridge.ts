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
  /** Override page background (`--paper`). Hex like `#3b82f5`. */
  backgroundColor?: string;
  /** Override text / divider ink (`--ink`, `--hero-ink`). Hex like `#ffffff`. */
  textColor?: string;
  /** Display font for the embed preview. */
  fontFamily?: EmbedFontFamily;
  /**
   * Temporary full-bleed background image for admin embed (data URL).
   * Pass `null` to clear.
   */
  backgroundImage?: string | null;
  /** Background image zoom (1 = cover). */
  backgroundImageScale?: number;
  /** Background image pan X in percent (-50…50, 0 = centered). */
  backgroundImageX?: number;
  /** Background image pan Y in percent (-50…50, 0 = centered). */
  backgroundImageY?: number;
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

const HEX_COLOR_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Normalize `#rgb` / `#rrggbb` / `rgb` / `rrggbb` to lowercase `#rrggbb`, or null if invalid. */
export function normalizeHexColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  const match = HEX_COLOR_RE.exec(raw);
  if (!match?.[1]) return null;
  const hex = match[1];
  if (hex.length === 3) {
    const [r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return `#${hex}`.toLowerCase();
}

export const DEFAULT_EMBED_BACKGROUND = "#3b82f5";
export const DEFAULT_EMBED_TEXT = "#ffffff";

export const EMBED_FONT_FAMILIES = ["openRunde", "inter", "newsreader"] as const;
export type EmbedFontFamily = (typeof EMBED_FONT_FAMILIES)[number];
export const DEFAULT_EMBED_FONT: EmbedFontFamily = "openRunde";

export const EMBED_FONT_OPTIONS: { value: EmbedFontFamily; label: string }[] = [
  { value: "openRunde", label: "Open Runde" },
  { value: "inter", label: "Inter" },
  { value: "newsreader", label: "Newsreader" },
];

export function parseEmbedFontFamily(value: unknown): EmbedFontFamily | null {
  return typeof value === "string" && (EMBED_FONT_FAMILIES as readonly string[]).includes(value)
    ? (value as EmbedFontFamily)
    : null;
}

const IMAGE_EXTENSION_RE = /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i;

/** True for browser File/Blob values that are usable as a background image. */
export function isImageFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  if (file.type) return false;
  return IMAGE_EXTENSION_RE.test(file.name);
}

/** Accept data URLs and same-origin blob URLs for admin background images. */
export function isBackgroundImageUrl(value: unknown): value is string {
  return typeof value === "string" && (value.startsWith("data:image/") || value.startsWith("blob:"));
}

