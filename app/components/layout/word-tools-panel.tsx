"use client";

import { Lock, RefreshCw, Unlock, X } from "lucide-react";
import { advancedModeGroups, advancedModes } from "../../lib/constants";
import { cardo } from "../../fonts";
import type { HomeState } from "../../hooks/use-home";

type WordToolsPanelProps = Pick<
  HomeState,
  | "advancedTool"
  | "setAdvancedTool"
  | "advancedMode"
  | "setAdvancedMode"
  | "advancedQuery"
  | "setAdvancedQuery"
  | "advancedStartsWith"
  | "setAdvancedStartsWith"
  | "advancedEndsWith"
  | "setAdvancedEndsWith"
  | "advancedLength"
  | "setAdvancedLength"
  | "advancedTopic"
  | "setAdvancedTopic"
  | "advancedResults"
  | "advancedLoading"
  | "advancedError"
  | "setAdvancedResults"
  | "setAdvancedError"
  | "forgeSlots"
  | "setForgeSlots"
  | "forgeSyllables"
  | "setForgeSyllables"
  | "forgeTotalLetters"
  | "setForgeTotalLetters"
  | "forgeWords"
  | "forgedWord"
  | "forgeReady"
  | "forgeRemixing"
  | "forgeCopied"
  | "setForgeCopied"
  | "updateForgeSlot"
  | "findForgeWords"
  | "lockForgeSeedWord"
  | "cycleForgeWord"
  | "commitWord"
  | "setMessage"
  | "selectAppMode"
>;

export function WordToolsPanel(props: WordToolsPanelProps) {
  const {
    advancedTool,
    setAdvancedTool,
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
    advancedLoading,
    advancedError,
    setAdvancedResults,
    setAdvancedError,
    forgeSlots,
    setForgeSlots,
    forgeSyllables,
    setForgeSyllables,
    forgeTotalLetters,
    setForgeTotalLetters,
    forgeWords,
    forgedWord,
    forgeReady,
    forgeRemixing,
    forgeCopied,
    setForgeCopied,
    updateForgeSlot,
    findForgeWords,
    lockForgeSeedWord,
    cycleForgeWord,
    commitWord,
    setMessage,
    selectAppMode,
  } = props;

  const activeMode = advancedModes.find((mode) => mode.value === advancedMode);

  return (
    <>
      <div className="advanced-tool-tabs" role="tablist" aria-label="Word tool">
        <button type="button" role="tab" aria-selected={advancedTool === "search"} className={advancedTool === "search" ? "active" : ""} onClick={() => setAdvancedTool("search")}>Find words</button>
        <button type="button" role="tab" aria-selected={advancedTool === "forge"} className={advancedTool === "forge" ? "active" : ""} onClick={() => setAdvancedTool("forge")}>Word forge</button>
      </div>

      {advancedTool === "search" ? <>
        <div className="advanced-workspace">
          <div className="advanced-mode-nav" role="tablist" aria-label="Advanced search type">
            {advancedModeGroups.map((group) => (
              <div className="mode-group" key={group.label}>
                <p>{group.label}</p>
                {group.modes.map((modeValue) => {
                  const mode = advancedModes.find((item) => item.value === modeValue)!;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      role="tab"
                      aria-selected={mode.value === advancedMode}
                      aria-controls="advanced-query-panel"
                      className={mode.value === advancedMode ? "active" : ""}
                      onClick={() => {
                        setAdvancedMode(mode.value);
                        setAdvancedQuery("");
                        setAdvancedStartsWith("");
                        setAdvancedEndsWith("");
                        setAdvancedLength("");
                        setAdvancedTopic("");
                        setAdvancedResults([]);
                        setAdvancedError("");
                      }}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="advanced-query-panel" id="advanced-query-panel" role="tabpanel">
            <div className="query-intro">
              <p>{activeMode?.label}</p>
              <span>{activeMode?.description}</span>
              <small>{activeMode?.example}</small>
            </div>

            {advancedMode !== "pattern" ? (
              <label className="advanced-field">
                <span>{activeMode?.fieldLabel}</span>
                <input
                  value={advancedQuery}
                  placeholder={activeMode?.placeholder}
                  onChange={(event) => setAdvancedQuery(event.target.value)}
                />
              </label>
            ) : (
              <div className="pattern-builder">
                <p>Build the word shape</p>
                <div className="pattern-fields">
                  <label className="advanced-field">
                    <span>Starts with</span>
                    <input value={advancedStartsWith} maxLength={12} onChange={(event) => setAdvancedStartsWith(event.target.value)} />
                  </label>
                  <label className="advanced-field">
                    <span>Ends with</span>
                    <input value={advancedEndsWith} maxLength={12} onChange={(event) => setAdvancedEndsWith(event.target.value)} />
                  </label>
                  <label className="advanced-field">
                    <span>Total letters</span>
                    <input value={advancedLength} inputMode="numeric" onChange={(event) => setAdvancedLength(event.target.value.replace(/\D/g, "").slice(0, 2))} />
                  </label>
                </div>
              </div>
            )}

            {advancedMode === "ml" || advancedMode === "lc" ? (
              <div className="optional-spelling">
                <p>Limit the spelling <small>optional</small></p>
                <div className="constraint-fields">
                  <label className="advanced-field">
                    <span>Starts with</span>
                    <input value={advancedStartsWith} maxLength={12} onChange={(event) => setAdvancedStartsWith(event.target.value)} />
                  </label>
                  <label className="advanced-field">
                    <span>Ends with</span>
                    <input value={advancedEndsWith} maxLength={12} onChange={(event) => setAdvancedEndsWith(event.target.value)} />
                  </label>
                </div>
              </div>
            ) : null}

            {["ml", "jjb", "jja", "trg"].includes(advancedMode) ? (
              <label className="advanced-field">
                <span>Prefer this topic <small>optional</small></span>
                <input value={advancedTopic} onChange={(event) => setAdvancedTopic(event.target.value)} />
              </label>
            ) : null}

            <button className="advanced-submit" type="submit" disabled={advancedLoading}>
              {advancedLoading ? "Searching…" : "Find words"}
            </button>
          </div>
        </div>

        {advancedError ? <p className="advanced-error">{advancedError}</p> : null}
        {advancedResults.length ? (
          <ul className="advanced-results">
            {advancedResults.map((word) => (
              <li key={`${word.word}-${word.partOfSpeech}`}>
                <button
                  type="button"
                  onClick={() => {
                    commitWord(word);
                    setMessage("");
                    selectAppMode("discover");
                  }}
                >
                  <span style={{ fontFamily: cardo.style.fontFamily }}>{word.word}</span>
                  <small>{word.partOfSpeech}</small>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </> : (
        <div className="forge-workspace">
          <div className="forge-constraints">
            <label>
              <span>Final syllables <small>exact</small></span>
              <input
                value={forgeSyllables}
                inputMode="numeric"
                placeholder="Any"
                aria-label="Exact syllables in final word"
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, "").slice(0, 2);
                  setForgeSyllables(value ? String(Math.min(Number(value), 12)) : "");
                  setForgeSlots((slots) => slots.map((slot) => ({ ...slot, error: "" })));
                }}
              />
            </label>
            <label>
              <span>Total letters <small>exact</small></span>
              <input
                value={forgeTotalLetters}
                inputMode="numeric"
                placeholder="Any"
                aria-label="Exact letters in final word"
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, "").slice(0, 2);
                  setForgeTotalLetters(value ? String(Math.min(Number(value), 40)) : "");
                  setForgeSlots((slots) => slots.map((slot) => ({ ...slot, error: "" })));
                }}
              />
            </label>
          </div>

          <div className="forge-slots">
            {forgeSlots.map((slot, slotIndex) => {
              const candidate = forgeWords[slotIndex];
              return (
                <section className={`forge-slot${candidate ? " has-word" : ""}${slot.pinned ? " pinned" : ""}`} key={slotIndex}>
                  <div className="forge-slot-heading">
                    <span>{slotIndex === 0 ? "First half" : "Second half"}</span>
                  </div>
                  <label className="advanced-field">
                    <span>Idea or word</span>
                    <input
                      value={slot.seed}
                      placeholder="Enter an idea or word"
                      onChange={(event) => updateForgeSlot(slotIndex, {
                        seed: event.target.value,
                        candidates: [],
                        index: 0,
                        pinned: false,
                        error: "",
                      })}
                    />
                  </label>
                  <div className="forge-half-constraints">
                    <label className="advanced-field forge-letter-limit">
                      <span>Letters</span>
                      <input
                        value={slot.letters ?? ""}
                        inputMode="numeric"
                        placeholder="Any"
                        aria-label={`Exact letters in ${slotIndex === 0 ? "left" : "right"} half`}
                        onChange={(event) => {
                          const value = event.target.value.replace(/\D/g, "").slice(0, 2);
                          updateForgeSlot(slotIndex, {
                            letters: value ? String(Math.min(Number(value), 32)) : "",
                            pinned: false,
                            error: "",
                          });
                        }}
                      />
                    </label>
                    <label className="advanced-field forge-letter-limit">
                      <span>Max letters</span>
                      <input
                        value={slot.maxLetters ?? ""}
                        inputMode="numeric"
                        placeholder="Any"
                        aria-label={`Maximum letters in ${slotIndex === 0 ? "left" : "right"} half`}
                        onChange={(event) => {
                          const value = event.target.value.replace(/\D/g, "").slice(0, 2);
                          updateForgeSlot(slotIndex, {
                            maxLetters: value ? String(Math.min(Number(value), 32)) : "",
                            pinned: false,
                            error: "",
                          });
                        }}
                      />
                    </label>
                    <label className="advanced-field forge-letter-limit">
                      <span>Syllables</span>
                      <input
                        value={slot.syllables ?? ""}
                        inputMode="numeric"
                        placeholder="Any"
                        aria-label={`Exact syllables in ${slotIndex === 0 ? "left" : "right"} half`}
                        onChange={(event) => {
                          const value = event.target.value.replace(/\D/g, "").slice(0, 1);
                          updateForgeSlot(slotIndex, {
                            syllables: value ? String(Math.min(Number(value), 8)) : "",
                            pinned: false,
                            error: "",
                          });
                        }}
                      />
                    </label>
                  </div>

                  {!candidate ? (
                    <div className="forge-start-actions">
                      <button type="button" disabled={slot.loading || !slot.seed.trim()} onClick={() => void lockForgeSeedWord(slotIndex)}>
                        <Lock size={13} strokeWidth={1.5} aria-hidden="true" />
                        {slot.loading ? "Loading…" : "Lock this word"}
                      </button>
                      <button type="button" disabled={slot.loading} onClick={() => void findForgeWords(slotIndex)}>
                        <RefreshCw size={13} strokeWidth={1.5} aria-hidden="true" />
                        {slot.loading ? "Exploring…" : slot.seed.trim() ? "Explore connections" : "Random word"}
                      </button>
                    </div>
                  ) : (
                    <div className="forge-candidate">
                      <p style={{ fontFamily: cardo.style.fontFamily }}>{candidate.word}</p>
                      {candidate.relation ? (
                        <small>
                          {candidate.relation === "exact"
                            ? "Your exact word"
                            : candidate.relation === "random" ? "Random word" : `${candidate.relation} to “${slot.seed.trim()}”`}
                        </small>
                      ) : null}
                      <span>{candidate.definition}</span>
                      <div className="forge-actions">
                        <button type="button" disabled={slot.pinned || slot.candidates.length < 2} onClick={() => cycleForgeWord(slotIndex)}>
                          <RefreshCw size={13} strokeWidth={1.5} aria-hidden="true" />
                          Another
                        </button>
                        <button
                          className={slot.pinned ? "active" : ""}
                          type="button"
                          onClick={() => updateForgeSlot(slotIndex, { pinned: !slot.pinned })}
                        >
                          {slot.pinned ? <Unlock size={13} strokeWidth={1.5} aria-hidden="true" /> : <Lock size={13} strokeWidth={1.5} aria-hidden="true" />}
                          {slot.pinned ? "Unlock half" : "Lock half"}
                        </button>
                      </div>
                    </div>
                  )}
                  {slot.error ? <p className="forge-error">{slot.error}</p> : null}
                </section>
              );
            })}
          </div>

          <div className={`forge-preview${forgeReady ? " ready" : ""}${forgeRemixing ? " loading" : ""}`}>
            <div className="forge-combined-word" style={{ fontFamily: cardo.style.fontFamily }}>
              <button
                key={forgedWord || "empty"}
                type="button"
                disabled={!forgedWord}
                aria-label={forgeCopied ? `Copied ${forgedWord}` : `Copy ${forgedWord || "combined word"}`}
                title={forgeCopied ? "Copied" : "Copy word"}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(forgedWord);
                    setForgeCopied(true);
                    window.setTimeout(() => setForgeCopied(false), 1200);
                  } catch {
                    setForgeCopied(false);
                  }
                }}
              >
                {forgedWord || "——"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
