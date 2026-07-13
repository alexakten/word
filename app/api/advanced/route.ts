import { pronunciationFromTags } from "../../pronunciation";

type DatamuseWord = {
  word: string;
  defs?: string[];
  tags?: string[];
  numSyllables?: number;
};

const modes: Record<string, string> = {
  ml: "ml",
  sl: "sl",
  spell: "sp",
  pattern: "sp",
  jjb: "rel_jjb",
  jja: "rel_jja",
  trg: "rel_trg",
  lc: "rel_bga",
};

const followerStopWords = new Set([
  "a", "an", "and", "are", "as", "at", "but", "by", "for", "from", "he", "his",
  "in", "is", "it", "my", "no", "of", "on", "or", "our", "so", "that", "the",
  "their", "this", "to", "was", "we", "when", "which", "with", "your",
]);

const partNames: Record<string, string> = {
  n: "noun",
  v: "verb",
  adj: "adjective",
  adv: "adverb",
  u: "word",
};

function parseWord(item: DatamuseWord) {
  const tags = item.tags ?? [];
  const pos = tags.find((tag) => tag in partNames) ?? "u";
  const rawDefinition = item.defs?.find((definition) => definition.startsWith(`${pos}\t`)) ?? item.defs?.[0];

  return {
    word: item.word,
    definition: rawDefinition?.replace(/^[^\t]+\t/, "") ?? "No definition available.",
    partOfSpeech: partNames[pos],
    pronunciation: pronunciationFromTags(tags),
    syllables: item.numSyllables,
  };
}

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const mode = search.get("mode") ?? "";
  const query = search.get("query")?.trim().slice(0, 120);
  const pattern = search.get("pattern")?.trim().slice(0, 80);
  const topic = search.get("topic")?.trim().slice(0, 100);
  const constraint = modes[mode];

  if (!constraint || !query) return Response.json({ error: "Invalid query" }, { status: 400 });

  const params = new URLSearchParams({
    [constraint]: query,
    md: "dpsr",
    ipa: "1",
    max: "100",
  });

  if (pattern && mode !== "spell" && mode !== "pattern") params.set("sp", pattern);
  if (topic) params.set("topics", topic);

  try {
    const response = await fetch(`https://api.datamuse.com/words?${params}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error("Datamuse request failed");

    const words = (await response.json()) as DatamuseWord[];
    const seen = new Set<string>();
    const results = words
      .filter((item) => {
        const key = item.word.toLowerCase();
        if (!item.defs?.length || item.word.length > 32 || /\d/.test(item.word) || seen.has(key)) return false;
        if (mode === "lc" && (followerStopWords.has(key) || !/^[a-z][a-z '-]*$/i.test(item.word))) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 20)
      .map(parseWord);

    return Response.json(results);
  } catch {
    return Response.json({ error: "Search unavailable" }, { status: 502 });
  }
}
