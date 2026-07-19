import { isAllowedWord } from "../../lib/content-filter";

type DatamuseWord = {
  word: string;
  defs?: string[];
  tags?: string[];
  numSyllables?: number;
};

type Connection = {
  parameter: string;
  value: string;
  label: string;
};

const partNames: Record<string, string> = {
  n: "noun",
  v: "verb",
  adj: "adjective",
  adv: "adverb",
  u: "word",
};

function parseWord(item: DatamuseWord, relation: string) {
  const tags = item.tags ?? [];
  const part = tags.find((tag) => tag in partNames) ?? "u";
  const definition = item.defs?.find((value) => value.startsWith(`${part}\t`)) ?? item.defs?.[0];

  return {
    word: item.word,
    definition: definition?.replace(/^[^\t]+\t/, "") ?? "A word connected through Datamuse.",
    partOfSpeech: partNames[part],
    syllables: item.numSyllables,
    relation,
  };
}

function connectionsForIdea(idea: string): Connection[] {
  return [
    { parameter: "rel_trg", value: idea, label: "associated" },
    { parameter: "ml", value: idea, label: "similar meaning" },
    { parameter: "rel_syn", value: idea, label: "synonym" },
    { parameter: "rel_gen", value: idea, label: "specific kind" },
    { parameter: "rel_spc", value: idea, label: "broader kind" },
    { parameter: "rel_com", value: idea, label: "component" },
    { parameter: "rel_par", value: idea, label: "part of" },
    { parameter: "rel_jja", value: idea, label: "has this quality" },
    { parameter: "rel_jjb", value: idea, label: "describes this idea" },
    { parameter: "rel_bga", value: idea, label: "often follows" },
    { parameter: "rel_bgb", value: idea, label: "often precedes" },
    { parameter: "ml", value: `things related to ${idea}`, label: "connected idea" },
    { parameter: "ml", value: `things that are ${idea}`, label: "has this quality" },
    { parameter: "ml", value: `types of ${idea}`, label: "type" },
    { parameter: "ml", value: `branches of ${idea}`, label: "branch" },
  ];
}

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const ideaInput = search.get("idea")?.trim().slice(0, 120) ?? "";
  const ideas = [...new Set(
    ideaInput
      .split(",")
      .map((idea) => idea.trim())
      .filter(Boolean),
  )].slice(0, 8);
  const random = search.get("random") === "1";
  const syllables = Number(search.get("syllables"));
  const maxLetters = Number(search.get("maxLetters"));
  const letters = Number(search.get("letters"));
  if (!ideas.length && !random) return Response.json({ error: "Enter an idea" }, { status: 400 });

  try {
    if (random) {
      const alphabet = "abcdefghijklmnopqrstuvw";
      const prefixes = new Set<string>();
      while (prefixes.size < 3) prefixes.add(alphabet[Math.floor(Math.random() * alphabet.length)]);
      const wordSets = await Promise.all([...prefixes].map(async (prefix) => {
        const pattern = letters ? `${prefix}${"?".repeat(Math.max(0, letters - 1))}` : `${prefix}*`;
        const params = new URLSearchParams({ sp: pattern, md: "dps", max: "1000" });
        const response = await fetch(`https://api.datamuse.com/words?${params}`, {
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        });
        if (!response.ok) return [];
        return response.json() as Promise<DatamuseWord[]>;
      }));
      const words = wordSets.flat();
      const results = words
        .filter((word) => {
          const letterCount = word.word.replace(/[^a-z]/gi, "").length;
          if (!/^[a-z]+$/i.test(word.word) || !word.defs?.length) return false;
          if (!isAllowedWord(word.word)) return false;
          if (syllables && word.numSyllables !== syllables) return false;
          if (letters && letterCount !== letters) return false;
          return !maxLetters || letterCount <= maxLetters;
        })
        .map((word) => parseWord(word, "random"))
        .sort(() => Math.random() - .5)
        .slice(0, 100);
      return Response.json(results);
    }

    if (!ideas.length) return Response.json({ error: "Enter an idea" }, { status: 400 });

    const connections = ideas.flatMap(connectionsForIdea);
    const inputIdeas = new Set(ideas.map((idea) => idea.toLowerCase()));

    const resultSets = await Promise.all(connections.map(async (connection) => {
      try {
        const params = new URLSearchParams({
          [connection.parameter]: connection.value,
          md: "dps",
          max: "60",
        });
        const response = await fetch(`https://api.datamuse.com/words?${params}`, {
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        });
        if (!response.ok) return [];
        const words = await response.json() as DatamuseWord[];
        return words.map((word) => parseWord(word, connection.label));
      } catch {
        return [];
      }
    }));

    const seen = new Set<string>();
    const results = [];
    for (let rank = 0; rank < 60 && results.length < 240; rank += 1) {
      for (const words of resultSets) {
        const word = words[rank];
        if (!word) continue;
        const key = word.word.toLowerCase();
        if (!/^[a-z]+$/i.test(word.word) || inputIdeas.has(key) || seen.has(key)) continue;
        if (!isAllowedWord(word.word)) continue;
        seen.add(key);
        results.push(word);
      }
    }

    return Response.json(results);
  } catch {
    return Response.json({ error: "Connections unavailable" }, { status: 502 });
  }
}
