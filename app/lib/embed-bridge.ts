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
  /** Font weight for the embed preview (clamped to the active face). */
  fontWeight?: number;
  /**
   * Letter spacing as a percent of font size (Figma-style).
   * e.g. `-6` → `-0.06em`. Default matches the app’s tight tracking.
   */
  letterSpacing?: number;
  /**
   * Admin override for the displayed combo word. Empty string / null clears.
   */
  overrideText?: string | null;
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

export const EMBED_FONT_FAMILIES = [
  "openRunde",
  "inter",
  "newsreader",
  "playfair",
  "caveat",
  "parabolica",
  "aboreto",
  "afacad",
  "calSans",
  "instrumentSerif",
  "redaction",
  "redaction10",
  "redaction20",
  "redaction35",
  "redaction50",
  "redaction70",
  "redaction100",
] as const;
export type EmbedFontFamily = (typeof EMBED_FONT_FAMILIES)[number];
export const DEFAULT_EMBED_FONT: EmbedFontFamily = "openRunde";

export const EMBED_FONT_OPTIONS: { value: EmbedFontFamily; label: string }[] = [
  { value: "openRunde", label: "Open Runde" },
  { value: "inter", label: "Inter" },
  { value: "newsreader", label: "Newsreader" },
  { value: "playfair", label: "Playfair Display" },
  { value: "caveat", label: "Caveat" },
  { value: "parabolica", label: "Parabolica" },
  { value: "aboreto", label: "Aboreto" },
  { value: "afacad", label: "Afacad" },
  { value: "calSans", label: "Cal Sans" },
  { value: "instrumentSerif", label: "Instrument Serif" },
  { value: "redaction", label: "Redaction" },
  { value: "redaction10", label: "Redaction 10" },
  { value: "redaction20", label: "Redaction 20" },
  { value: "redaction35", label: "Redaction 35" },
  { value: "redaction50", label: "Redaction 50" },
  { value: "redaction70", label: "Redaction 70" },
  { value: "redaction100", label: "Redaction 100" },
];

/** Available CSS font-weights per face (what we actually load). */
export const EMBED_FONT_WEIGHTS: Record<EmbedFontFamily, readonly number[]> = {
  openRunde: [400, 500, 600, 700],
  inter: [100, 200, 300, 400, 500, 600, 700, 800, 900],
  newsreader: [200, 300, 400, 500, 600, 700, 800],
  playfair: [400, 500, 600, 700, 800, 900],
  caveat: [400, 500, 600, 700],
  parabolica: [500],
  aboreto: [400],
  afacad: [400, 500, 600, 700],
  calSans: [400],
  instrumentSerif: [400],
  redaction: [400, 700],
  redaction10: [400, 700],
  redaction20: [400, 700],
  redaction35: [400, 700],
  redaction50: [400, 700],
  redaction70: [400, 700],
  redaction100: [400, 700],
};

const FONT_WEIGHT_LABELS: Record<number, string> = {
  100: "Thin",
  200: "Extra Light",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "Semibold",
  700: "Bold",
  800: "Extra Bold",
  900: "Black",
};

export function fontWeightLabel(weight: number) {
  return FONT_WEIGHT_LABELS[weight] ?? String(weight);
}

export function defaultFontWeight(font: EmbedFontFamily) {
  const weights = EMBED_FONT_WEIGHTS[font];
  if (font === "parabolica") return 500;
  if (weights.includes(400)) return 400;
  return weights[0]!;
}

export const DEFAULT_EMBED_FONT_WEIGHT = defaultFontWeight(DEFAULT_EMBED_FONT);

export function clampFontWeight(font: EmbedFontFamily, weight: number) {
  const weights = EMBED_FONT_WEIGHTS[font];
  if (!Number.isFinite(weight)) return defaultFontWeight(font);
  if (weights.includes(weight)) return weight;
  return weights.reduce((best, candidate) =>
    Math.abs(candidate - weight) < Math.abs(best - weight) ? candidate : best,
  );
}

export function parseEmbedFontFamily(value: unknown): EmbedFontFamily | null {
  return typeof value === "string" && (EMBED_FONT_FAMILIES as readonly string[]).includes(value)
    ? (value as EmbedFontFamily)
    : null;
}

/** Default matches `.split-combined-word { letter-spacing: -.062em }`. */
export const DEFAULT_EMBED_LETTER_SPACING = -6;
export const MIN_EMBED_LETTER_SPACING = -20;
export const MAX_EMBED_LETTER_SPACING = 40;

export function clampLetterSpacing(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_EMBED_LETTER_SPACING;
  return Math.min(MAX_EMBED_LETTER_SPACING, Math.max(MIN_EMBED_LETTER_SPACING, value));
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

