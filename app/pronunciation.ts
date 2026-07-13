const arpabetToIpa: Record<string, string> = {
  AA: "ɑ", AE: "æ", AH: "ʌ", AO: "ɔ", AW: "aʊ", AY: "aɪ",
  B: "b", CH: "tʃ", D: "d", DH: "ð", EH: "ɛ", ER: "ɝ",
  EY: "eɪ", F: "f", G: "ɡ", HH: "h", IH: "ɪ", IY: "i",
  JH: "dʒ", K: "k", L: "l", M: "m", N: "n", NG: "ŋ",
  OW: "oʊ", OY: "ɔɪ", P: "p", R: "r", S: "s", SH: "ʃ",
  T: "t", TH: "θ", UH: "ʊ", UW: "u", V: "v", W: "w",
  Y: "j", Z: "z", ZH: "ʒ",
};

function convertArpabet(value: string) {
  return value.trim().split(/\s+/).map((token) => {
    const match = token.match(/^([A-Z]+)([012])?$/);
    if (!match) return token.toLowerCase();
    const [, sound, stress] = match;
    let ipa = arpabetToIpa[sound] ?? sound.toLowerCase();
    if (sound === "AH" && stress === "0") ipa = "ə";
    if (sound === "ER" && stress === "0") ipa = "ɚ";
    return `${stress === "1" ? "ˈ" : stress === "2" ? "ˌ" : ""}${ipa}`;
  }).join("");
}

export function pronunciationFromTags(tags: string[]) {
  const ipa = tags.find((tag) => tag.startsWith("ipa_pron:"))?.slice(9).trim();
  if (ipa) return `/${ipa}/`;

  const arpabet = tags.find((tag) => tag.startsWith("pron:"))?.slice(5).trim();
  return arpabet ? `/${convertArpabet(arpabet)}/` : undefined;
}

export function normalizePronunciation(value?: string) {
  if (!value) return undefined;
  const bare = value.replace(/^\//, "").replace(/\/$/, "").trim();
  const looksLikeArpabet = /(?:^|\s)[A-Z]{1,3}[012]?(?:\s|$)/.test(bare);
  return looksLikeArpabet ? `/${convertArpabet(bare)}/` : `/${bare}/`;
}
