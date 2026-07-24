export const BRAND_LOGO_IDS = [
  "Apart",
  "Awake",
  "Burst",
  "Core",
  "Curve",
  "Direct",
  "Flow",
  "Fly",
  "Cube",
  "Grow",
  "Know",
  "Link",
  "Loop",
  "Orbit",
  "Portal",
  "Shift",
  "Split",
  "Stable",
  "Sun",
  "Twice",
  "Unfold",
  "Union",
  "Wave",
  "Wing",
  "Zag",
] as const;

export type BrandLogoId = (typeof BRAND_LOGO_IDS)[number];

export const DEFAULT_BRAND_LOGO_ID: BrandLogoId = "Portal";

export function brandLogoSrc(id: BrandLogoId) {
  return `/logos/${id}.svg`;
}

export function pickRandomBrandLogo(exclude?: BrandLogoId | null): BrandLogoId {
  const options = BRAND_LOGO_IDS as readonly BrandLogoId[];
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

export function nextBrandLogo(current: BrandLogoId): BrandLogoId {
  const options = BRAND_LOGO_IDS as readonly BrandLogoId[];
  const index = options.indexOf(current);
  const from = index >= 0 ? index : -1;
  return options[(from + 1) % options.length]!;
}

export function isBrandLogoId(value: unknown): value is BrandLogoId {
  return typeof value === "string" && (BRAND_LOGO_IDS as readonly string[]).includes(value);
}
