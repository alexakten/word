import { pronunciationFromTags } from "../../pronunciation";

type DatamuseWord = {
  word: string;
  defs?: string[];
  tags?: string[];
  numSyllables?: number;
};

const partNames: Record<string, string> = {
  n: "noun",
  v: "verb",
  adj: "adjective",
  adv: "adverb",
  u: "word",
};

const validRelations = new Set(["rel"]);
const alphabet = "abcdefghijklmnopqrstuvw";

function parseWord(item: DatamuseWord, requestedPos = "any") {
  const tags = item.tags ?? [];
  const pos = requestedPos !== "any" && tags.includes(requestedPos)
    ? requestedPos
    : tags.find((tag) => tag in partNames) ?? "u";
  const rawDefinition = item.defs?.find((definition) => definition.startsWith(`${pos}\t`)) ?? item.defs?.[0];

  return {
    word: item.word,
    definition: rawDefinition?.replace(/^[^\t]+\t/, "") ?? "No definition available.",
    partOfSpeech: partNames[pos],
    pronunciation: pronunciationFromTags(tags),
    syllables: item.numSyllables,
  };
}

async function queryDatamuse(params: URLSearchParams) {
  const response = await fetch(`https://api.datamuse.com/words?${params}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Datamuse request failed");
  return (await response.json()) as DatamuseWord[];
}

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const pos = search.get("pos") ?? "any";
  const relation = search.get("relation");
  const sourceWord = search.get("word")?.trim().slice(0, 80);
  const lookup = search.get("lookup")?.trim().slice(0, 80);
  const syllables = Number(search.get("syllables"));
  const startsWith = search.get("startsWith")?.replace(/[^a-z]/gi, "").slice(0, 12) ?? "";
  const endsWith = search.get("endsWith")?.replace(/[^a-z]/gi, "").slice(0, 12) ?? "";
  const requestedLength = Number(search.get("length"));
  const lengthMode = search.get("lengthMode");
  const exactLetters = requestedLength && lengthMode === "exact" ? requestedLength : Number(search.get("letters"));
  const maxLetters = Number(search.get("maxLetters"));

  try {
    let words: DatamuseWord[] = [];

    if (lookup) {
      words = await queryDatamuse(
        new URLSearchParams({ sp: lookup, qe: "sp", md: "dpsr", ipa: "1", max: "20" }),
      );
    } else if (relation && sourceWord && validRelations.has(relation)) {
      if (relation === "rel") {
        const [synonyms, associations] = await Promise.all([
          queryDatamuse(new URLSearchParams({ rel_syn: sourceWord, md: "dpsr", ipa: "1", max: "100" })),
          queryDatamuse(new URLSearchParams({ rel_trg: sourceWord, md: "dpsr", ipa: "1", max: "100" })),
        ]);
        const length = Math.max(synonyms.length, associations.length);
        words = Array.from({ length }, (_, index) => [synonyms[index], associations[index]])
          .flat()
          .filter((word): word is DatamuseWord => Boolean(word));
      } else {
        words = await queryDatamuse(
          new URLSearchParams({ [`rel_${relation}`]: sourceWord, md: "dpsr", ipa: "1", max: "200" }),
        );
      }
    } else {
      // Datamuse ranks rather than shuffles. A changing prefix gives us a broad,
      // inexpensive window into its vocabulary, then we choose locally.
      let pattern: string;
      if (exactLetters) {
        if (startsWith.length > exactLetters || endsWith.length > exactLetters) {
          return Response.json({ error: "No matching word" }, { status: 404 });
        }

        const characters = Array<string>(exactLetters).fill("?");
        for (let index = 0; index < startsWith.length; index += 1) {
          characters[index] = startsWith[index];
        }
        for (let index = 0; index < endsWith.length; index += 1) {
          const position = exactLetters - endsWith.length + index;
          if (characters[position] !== "?" && characters[position] !== endsWith[index]) {
            return Response.json({ error: "No matching word" }, { status: 404 });
          }
          characters[position] = endsWith[index];
        }
        if (!startsWith && !endsWith) {
          characters[0] = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
        pattern = characters.join("");
      } else {
        const prefix = startsWith || (endsWith ? "" : alphabet[Math.floor(Math.random() * alphabet.length)]);
        pattern = `${prefix}*${endsWith}`;
      }
      words = await queryDatamuse(
        new URLSearchParams({ sp: pattern, md: "dpsrf", ipa: "1", max: "1000" }),
      );
    }

    const eligible = words.filter((item) => {
      if (item.word.length > 22 || /\d/.test(item.word)) return false;
      if (!item.defs?.length) return false;
      if (lookup && item.word.toLowerCase() !== lookup.toLowerCase()) return false;
      if (!lookup && /[\s_-]/.test(item.word)) return false;
      if (!lookup && syllables && item.numSyllables !== syllables) return false;
      if (!lookup && startsWith && !item.word.toLowerCase().startsWith(startsWith.toLowerCase())) return false;
      if (!lookup && endsWith && !item.word.toLowerCase().endsWith(endsWith.toLowerCase())) return false;
      if (!lookup && exactLetters && item.word.length !== exactLetters) return false;
      if (!lookup && requestedLength && lengthMode === "less" && item.word.length > requestedLength) return false;
      if (!lookup && requestedLength && lengthMode === "more" && item.word.length < requestedLength) return false;
      if (!lookup && maxLetters && item.word.length > maxLetters) return false;
      return pos === "any" || item.tags?.includes(pos);
    });

    if (!eligible.length) return Response.json({ error: "No matching word" }, { status: 404 });

    // Avoid only surfacing the most common results while still excluding the
    // obscure tail of large Datamuse result sets.
    const pool = eligible.slice(0, Math.min(eligible.length, relation ? 60 : 320));
    const selected = lookup
      ? pool.find((item) => item.word.toLowerCase() === lookup.toLowerCase()) ?? pool[0]
      : pool[Math.floor(Math.random() * pool.length)];
    return Response.json(parseWord(selected, lookup ? "any" : pos));
  } catch {
    return Response.json({ error: "Dictionary unavailable" }, { status: 502 });
  }
}
