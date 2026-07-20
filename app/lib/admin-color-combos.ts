import {
  DEFAULT_EMBED_BACKGROUND,
  DEFAULT_EMBED_TEXT,
  normalizeHexColor,
} from "./embed-bridge";

export type AdminColorCombo = {
  id: string;
  name: string;
  background: string;
  text: string;
};

/** Built-in presets — paste `spellsurf-combo: Name | #bg | #text` in chat to add more. */
export const BUILTIN_COLOR_COMBOS: AdminColorCombo[] = [
  {
    id: "blue-white",
    name: "Blue",
    background: DEFAULT_EMBED_BACKGROUND,
    text: DEFAULT_EMBED_TEXT,
  },
  {
    id: "black-yellow",
    name: "Black / Yellow",
    background: "#242424",
    text: "#fef289",
  },
  {
    id: "light",
    name: "Light",
    background: "#f9fafc",
    text: "#3f3f3f",
  },
  {
    id: "ink",
    name: "Ink",
    background: "#1a1a1a",
    text: "#f5f5f5",
  },
];

const LOCAL_STORAGE_KEY = "spellsurf:admin-color-combos";

/** Shareable one-liner: `spellsurf-combo: Blue | #3b82f5 | #ffffff` */
export function serializeColorCombo(combo: Pick<AdminColorCombo, "name" | "background" | "text">) {
  return `spellsurf-combo: ${combo.name} | ${combo.background} | ${combo.text}`;
}

export function parseColorCombo(raw: string): AdminColorCombo | null {
  const text = raw.trim();
  if (!text) return null;

  const prefixed = text.match(
    /^spellsurf-combo:\s*(.+?)\s*\|\s*(#[0-9a-fA-F]{3,8}|[0-9a-fA-F]{3,8})\s*\|\s*(#[0-9a-fA-F]{3,8}|[0-9a-fA-F]{3,8})\s*$/i,
  );
  const loose = text.match(
    /^(.+?)\s*\|\s*(#[0-9a-fA-F]{3,8}|[0-9a-fA-F]{3,8})\s*\|\s*(#[0-9a-fA-F]{3,8}|[0-9a-fA-F]{3,8})\s*$/i,
  );
  const match = prefixed ?? loose;
  if (!match) return null;

  const name = match[1]?.trim();
  const background = normalizeHexColor(match[2]);
  const foreground = normalizeHexColor(match[3]);
  if (!name || !background || !foreground) return null;

  return {
    id: slugifyComboId(name, background, foreground),
    name,
    background,
    text: foreground,
  };
}

export function slugifyComboId(name: string, background: string, text: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    || "combo";
  return `${base}-${background.slice(1)}-${text.slice(1)}`;
}

export function readLocalColorCombos(): AdminColorCombo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const item = entry as Partial<AdminColorCombo>;
        const background = normalizeHexColor(item.background);
        const text = normalizeHexColor(item.text);
        const name = typeof item.name === "string" ? item.name.trim() : "";
        if (!background || !text || !name) return null;
        return {
          id: typeof item.id === "string" && item.id ? item.id : slugifyComboId(name, background, text),
          name,
          background,
          text,
        } satisfies AdminColorCombo;
      })
      .filter((entry): entry is AdminColorCombo => Boolean(entry));
  } catch {
    return [];
  }
}

export function writeLocalColorCombos(combos: AdminColorCombo[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(combos));
}

export function upsertLocalColorCombo(combo: AdminColorCombo) {
  const existing = readLocalColorCombos().filter(
    (entry) => entry.id !== combo.id && !(entry.background === combo.background && entry.text === combo.text),
  );
  const next = [combo, ...existing];
  writeLocalColorCombos(next);
  return next;
}

export function findMatchingColorCombo(
  combos: AdminColorCombo[],
  background: string,
  text: string,
) {
  return combos.find(
    (entry) => entry.background === background && entry.text === text,
  ) ?? null;
}
