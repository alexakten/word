import type { SyllablePick, SyllableTake } from "../syllables";

export function parseSyllablePickValue(value: string): SyllablePick {
  if (value === "full" || value === "random") return value;
  if (value === "start" || value === "middle" || value === "end") return value;
  const pick = Number(value);
  if (pick >= 1 && pick <= 8) return pick as SyllablePick;
  return "start";
}

export function parseSyllableTakeValue(value: string): SyllableTake {
  const take = Number(value);
  if (take >= 1 && take <= 3) return take as SyllableTake;
  return 1;
}
