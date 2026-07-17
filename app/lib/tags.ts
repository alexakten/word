export const MAX_TAGS = 8;
export const MAX_TAG_LENGTH = 40;

export function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, MAX_TAGS);
}

export function normalizeTags(value: string): string {
  const tags: string[] = [];
  const seen = new Set<string>();

  for (const entry of parseTags(value)) {
    const tag = entry.slice(0, MAX_TAG_LENGTH);
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }

  return tags.join(", ");
}

export function pickRandomTag(value: string, exclude?: string): string | undefined {
  const tags = parseTags(value);
  const alternatives = exclude && tags.length > 1
    ? tags.filter((tag) => tag.toLowerCase() !== exclude.toLowerCase())
    : tags;
  const pool = alternatives.length ? alternatives : tags;
  return pool[Math.floor(Math.random() * pool.length)];
}
