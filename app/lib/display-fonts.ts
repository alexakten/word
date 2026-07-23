import {
  clampFontWeight,
  clampLetterSpacing,
  parseEmbedFontFamily,
  type EmbedFontFamily,
} from "./embed-bridge";

export const DISPLAY_FONT_FAMILY_CSS: Record<EmbedFontFamily, string> = {
  openRunde: "var(--font-open-runde), system-ui, sans-serif",
  inter: "var(--font-inter), system-ui, sans-serif",
  newsreader: "var(--font-serif), Georgia, serif",
  playfair: "var(--font-playfair), Georgia, serif",
  caveat: "var(--font-caveat), cursive",
  parabolica: "var(--font-parabolica), system-ui, sans-serif",
  aboreto: "var(--font-aboreto), Georgia, serif",
  afacad: "var(--font-afacad), system-ui, sans-serif",
  calSans: "var(--font-cal-sans), system-ui, sans-serif",
  instrumentSerif: "var(--font-instrument-serif), Georgia, serif",
  argestaDisplay: "var(--font-argesta-display), Georgia, serif",
  rawest: "var(--font-rawest), system-ui, sans-serif",
  safiro: "var(--font-safiro), system-ui, sans-serif",
  swiza: "var(--font-swiza), system-ui, sans-serif",
};

/** Fixed weight + tracking per face — not user-adjustable. */
export const DISPLAY_FONT_PRESETS: Record<EmbedFontFamily, { fontWeight: number; letterSpacing: number }> = {
  openRunde: { fontWeight: 500, letterSpacing: -6 },
  inter: { fontWeight: 600, letterSpacing: -6 },
  newsreader: { fontWeight: 400, letterSpacing: -6 },
  playfair: { fontWeight: 400, letterSpacing: -4 },
  caveat: { fontWeight: 500, letterSpacing: -6 },
  parabolica: { fontWeight: 500, letterSpacing: -8 },
  aboreto: { fontWeight: 400, letterSpacing: -8 },
  afacad: { fontWeight: 500, letterSpacing: -6 },
  calSans: { fontWeight: 400, letterSpacing: -2 },
  instrumentSerif: { fontWeight: 400, letterSpacing: -4 },
  argestaDisplay: { fontWeight: 400, letterSpacing: -6 },
  rawest: { fontWeight: 500, letterSpacing: -6 },
  safiro: { fontWeight: 500, letterSpacing: -6 },
  swiza: { fontWeight: 500, letterSpacing: -6 },
};

/** Brand-mode cycle — curated subset of embed faces. */
export const DISPLAY_FONT_FAMILIES = [
  "openRunde",
  "newsreader",
  "aboreto",
  "parabolica",
  "caveat",
  "calSans",
  "argestaDisplay",
  "rawest",
  "safiro",
  "swiza",
] as const satisfies readonly EmbedFontFamily[];

export type DisplayFontFamily = (typeof DISPLAY_FONT_FAMILIES)[number];

export const DEFAULT_DISPLAY_FONT_FAMILY: DisplayFontFamily = "openRunde";

export const BRAND_DISPLAY_FONT_FAMILY: DisplayFontFamily = "parabolica";

export const DISPLAY_FONT_OPTIONS: { value: DisplayFontFamily; label: string }[] = [
  { value: "openRunde", label: "Soft" },
  { value: "newsreader", label: "Serif" },
  { value: "aboreto", label: "Fancy" },
  { value: "parabolica", label: "Tech" },
  { value: "caveat", label: "Fun" },
  { value: "calSans", label: "Cal Sans" },
  { value: "argestaDisplay", label: "Classy" },
  { value: "rawest", label: "Angular" },
  { value: "safiro", label: "Trendy" },
  { value: "swiza", label: "Modern" },
];

export const DISPLAY_FONT_EVENT = "spellsurf:display-font";

export type DisplayFontState = {
  fontFamily: EmbedFontFamily;
  fontWeight: number;
  letterSpacing: number;
};

function isDisplayFontFamily(value: EmbedFontFamily): value is DisplayFontFamily {
  return (DISPLAY_FONT_FAMILIES as readonly string[]).includes(value);
}

export function displayFontPreset(fontFamily: EmbedFontFamily): DisplayFontState {
  const preset = DISPLAY_FONT_PRESETS[fontFamily];
  return {
    fontFamily,
    fontWeight: clampFontWeight(fontFamily, preset.fontWeight),
    letterSpacing: clampLetterSpacing(preset.letterSpacing),
  };
}

export const DEFAULT_DISPLAY_FONT: DisplayFontState = displayFontPreset(DEFAULT_DISPLAY_FONT_FAMILY);

export function pickRandomDisplayFont(exclude?: EmbedFontFamily | null): EmbedFontFamily {
  const options = DISPLAY_FONT_FAMILIES;
  let next = options[Math.floor(Math.random() * options.length)]!;
  if (exclude) {
    let guard = 0;
    while (next === exclude && guard < 8) {
      next = options[Math.floor(Math.random() * options.length)]!;
      guard += 1;
    }
  }
  return next;
}

export function applyDisplayFontToDocument(state: DisplayFontState) {
  const root = document.documentElement;
  const body = document.body;
  const preset = displayFontPreset(state.fontFamily);
  root.setAttribute("data-display-font", preset.fontFamily);
  root.removeAttribute("data-font-family");
  root.removeAttribute("data-font-caps");
  root.removeAttribute("data-font-bold");
  root.removeAttribute("data-font-italic");
  // Next.js font variables are defined on body — set display tokens there so
  // nested var(--font-*) references resolve instead of going invalid on <html>.
  body.style.setProperty("--display-font-family", DISPLAY_FONT_FAMILY_CSS[preset.fontFamily]);
  body.style.setProperty("--display-font-weight", String(preset.fontWeight));
  body.style.setProperty("--display-letter-spacing", `${preset.letterSpacing / 100}em`);
  root.style.removeProperty("--display-font-family");
  root.style.removeProperty("--display-font-weight");
  root.style.removeProperty("--display-letter-spacing");
}

export function clearDisplayFontFromDocument() {
  const root = document.documentElement;
  const body = document.body;
  root.removeAttribute("data-display-font");
  body.style.removeProperty("--display-font-family");
  body.style.removeProperty("--display-font-weight");
  body.style.removeProperty("--display-letter-spacing");
  root.style.removeProperty("--display-font-family");
  root.style.removeProperty("--display-font-weight");
  root.style.removeProperty("--display-letter-spacing");
}

export function normalizeDisplayFont(partial: {
  fontFamily?: unknown;
}): DisplayFontState {
  const parsed = parseEmbedFontFamily(partial.fontFamily);
  const fontFamily = parsed && isDisplayFontFamily(parsed) ? parsed : DEFAULT_DISPLAY_FONT_FAMILY;
  return displayFontPreset(fontFamily);
}
