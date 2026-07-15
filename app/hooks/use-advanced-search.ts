"use client";

import { useState } from "react";
import type { AdvancedMode, ApiHealth, WordResult } from "../lib/types";
import { applyApiHealth, isFetchFailure } from "../lib/word-utils";

type UseAdvancedSearchOptions = {
  setApiHealth: (health: ApiHealth) => void;
};

export function useAdvancedSearch({ setApiHealth }: UseAdvancedSearchOptions) {
  const [advancedMode, setAdvancedMode] = useState<AdvancedMode>("ml");
  const [advancedQuery, setAdvancedQuery] = useState("");
  const [advancedStartsWith, setAdvancedStartsWith] = useState("");
  const [advancedEndsWith, setAdvancedEndsWith] = useState("");
  const [advancedLength, setAdvancedLength] = useState("");
  const [advancedTopic, setAdvancedTopic] = useState("");
  const [advancedResults, setAdvancedResults] = useState<WordResult[]>([]);
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [advancedError, setAdvancedError] = useState("");
  const runAdvancedSearch = async () => {
    let query = advancedQuery.trim();
    const startsWith = advancedStartsWith.trim().replace(/[^a-z]/gi, "");
    const endsWith = advancedEndsWith.trim().replace(/[^a-z]/gi, "");

    if (advancedMode === "pattern") {
      const totalLength = Number.parseInt(advancedLength, 10);
      if (!startsWith && !endsWith && !totalLength) {
        setAdvancedError("Add a starting letter, ending letter, or total length");
        return;
      }

      if (totalLength > 0) {
        const unknownLetters = totalLength - startsWith.length - endsWith.length;
        if (unknownLetters < 0) {
          setAdvancedError("Total letters must fit the beginning and ending");
          return;
        }
        query = `${startsWith}${"?".repeat(unknownLetters)}${endsWith}`;
      } else {
        query = `${startsWith}*${endsWith}`;
      }
    }

    if (!query) {
      setAdvancedError("Enter a word or phrase");
      return;
    }

    setAdvancedLoading(true);
    setAdvancedError("");
    setAdvancedResults([]);

    const params = new URLSearchParams({ mode: advancedMode, query });
    if (advancedMode !== "pattern" && advancedMode !== "spell" && (startsWith || endsWith)) {
      params.set("pattern", `${startsWith}*${endsWith}`);
    }
    if (advancedTopic.trim()) params.set("topic", advancedTopic.trim());

    try {
      const response = await fetch(`/api/advanced?${params}`);
      applyApiHealth(response, setApiHealth);
      if (!response.ok) throw new Error("No results");
      const words = (await response.json()) as WordResult[];
      setAdvancedResults(words);
      if (!words.length) setAdvancedError("No matching words found");
    } catch (error) {
      if (isFetchFailure(error)) applyApiHealth(null, setApiHealth);
      setAdvancedError("No matching words found");
    } finally {
      setAdvancedLoading(false);
    }
  };

  return {
    advancedMode,
    setAdvancedMode,
    advancedQuery,
    setAdvancedQuery,
    advancedStartsWith,
    setAdvancedStartsWith,
    advancedEndsWith,
    setAdvancedEndsWith,
    advancedLength,
    setAdvancedLength,
    advancedTopic,
    setAdvancedTopic,
    advancedResults,
    setAdvancedResults,
    advancedLoading,
    advancedError,
    setAdvancedError,
    runAdvancedSearch,
  };
}
