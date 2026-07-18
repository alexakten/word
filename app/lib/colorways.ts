export const colorways = [
  { id: "yellow", label: "Yellow" },
  { id: "orange", label: "Orange" },
  { id: "blue", label: "Blue" },
  { id: "green", label: "Green" },
  { id: "purple", label: "Purple" },
  { id: "light", label: "Light" },
  { id: "brown", label: "Brown" },
] as const;

export type Colorway = (typeof colorways)[number]["id"];

export const COLORWAY_PARAM = "colorway";
export const DEFAULT_COLORWAY: Colorway = "light";

const colorwayIds = new Set<string>(colorways.map((colorway) => colorway.id));

export function parseColorway(value: string | null | undefined): Colorway | null {
  if (!value) return null;
  return colorwayIds.has(value) ? (value as Colorway) : null;
}

export function readColorwayFromSearch(search: string | URLSearchParams = typeof window !== "undefined" ? window.location.search : ""): Colorway {
  const params = typeof search === "string" ? new URLSearchParams(search.startsWith("?") ? search : `?${search}`) : search;
  return parseColorway(params.get(COLORWAY_PARAM)) ?? DEFAULT_COLORWAY;
}

export function syncColorwayUrlParam(colorway: Colorway) {
  const url = new URL(window.location.href);
  if (colorway === DEFAULT_COLORWAY) url.searchParams.delete(COLORWAY_PARAM);
  else url.searchParams.set(COLORWAY_PARAM, colorway);
  window.history.replaceState(window.history.state, "", url);
}

/** Inline bootstrap so refresh applies the theme before paint. */
export const colorwayBootstrapScript = `(function(){try{var m=location.search.match(/[?&]${COLORWAY_PARAM}=([^&]*)/);var c=m?decodeURIComponent(m[1].replace(/\\+/g," ")):"";if(/^(${colorways.map((c) => c.id).join("|")})$/.test(c))document.documentElement.setAttribute("data-colorway",c);}catch(e){}})();`;
