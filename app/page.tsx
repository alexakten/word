"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Copy, Focus, Lock, Minus, Plus, RefreshCw, Unlock, X } from "lucide-react";
import { cardo } from "./fonts";
import { normalizePronunciation } from "./pronunciation";

type PartOfSpeech = "any" | "n" | "v" | "adj" | "adv";
type LengthMode = "less" | "exact" | "more";
type AppMode = "discover" | "combine" | "find";
type WordCopyStatus = "idle" | "copied" | "hidden";

type WordResult = {
  word: string;
  definition: string;
  partOfSpeech: string;
  pronunciation?: string;
  syllables?: number;
  relation?: string;
  splitLeft?: WordResult;
  splitRight?: WordResult;
};

type AdvancedMode = "ml" | "sl" | "spell" | "pattern" | "jjb" | "jja" | "trg" | "lc";

type ForgeSlot = {
  seed: string;
  maxLetters: string;
  letters: string;
  syllables: string;
  candidates: WordResult[];
  index: number;
  pinned: boolean;
  loading: boolean;
  error: string;
};

type ForgeHistoryEntry = {
  combined: string;
  slots: [
    Pick<ForgeSlot, "seed" | "maxLetters" | "letters" | "syllables" | "pinned"> & { word: WordResult },
    Pick<ForgeSlot, "seed" | "maxLetters" | "letters" | "syllables" | "pinned"> & { word: WordResult },
  ];
};

type SplitHistoryEntry = {
  left: WordResult;
  right: WordResult;
};

const POS_VALUES = new Set<PartOfSpeech>(["any", "n", "v", "adj", "adv"]);
const LENGTH_MODES = new Set<LengthMode>(["less", "exact", "more"]);

type SideSettings = {
  text: string;
  related: string;
  pos: PartOfSpeech;
  syllables: string;
  syllableMode: LengthMode;
  startsWith: string;
  endsWith: string;
  letters: string;
  lengthMode: LengthMode;
};

function parseViewModeParam(search: string): boolean | null {
  const view = new URLSearchParams(search).get("view");
  if (view === "split") return true;
  if (view === "single") return false;
  return null;
}

function parsePartOfSpeech(value: string | null): PartOfSpeech | null {
  return value && POS_VALUES.has(value as PartOfSpeech) ? value as PartOfSpeech : null;
}

function parseLengthMode(value: string | null): LengthMode | null {
  return value && LENGTH_MODES.has(value as LengthMode) ? value as LengthMode : null;
}

function parseSideSettings(search: URLSearchParams, prefix: "l" | "r"): Partial<SideSettings> {
  const get = (key: string) => search.get(`${prefix}${key}`);
  const settings: Partial<SideSettings> = {};
  const text = get("Text");
  const related = get("Related");
  const pos = parsePartOfSpeech(get("Pos"));
  const syllables = get("Syl");
  const syllableMode = parseLengthMode(get("SylMode"));
  const startsWith = get("Start")?.replace(/[^a-z]/gi, "").slice(0, 12);
  const endsWith = get("End")?.replace(/[^a-z]/gi, "").slice(0, 12);
  const letters = get("Len");
  const lengthMode = parseLengthMode(get("LenMode"));

  if (text) settings.text = text.slice(0, 40);
  if (related) settings.related = related;
  if (pos) settings.pos = pos;
  if (syllables) settings.syllables = syllables;
  if (syllableMode) settings.syllableMode = syllableMode;
  if (startsWith) settings.startsWith = startsWith;
  if (endsWith) settings.endsWith = endsWith;
  if (letters) settings.letters = letters;
  if (lengthMode) settings.lengthMode = lengthMode;
  return settings;
}

function writeSideSettings(params: URLSearchParams, prefix: "l" | "r", settings: SideSettings) {
  const entries: [string, string | null][] = [
    ["Text", settings.text || null],
    ["Related", settings.related || null],
    ["Pos", settings.pos !== "any" ? settings.pos : null],
    ["Syl", settings.syllables || null],
    ["SylMode", settings.syllableMode !== "exact" ? settings.syllableMode : null],
    ["Start", settings.startsWith || null],
    ["End", settings.endsWith || null],
    ["Len", settings.letters || null],
    ["LenMode", settings.lengthMode !== "exact" ? settings.lengthMode : null],
  ];

  for (const [key, value] of entries) {
    const param = `${prefix}${key}`;
    if (value) params.set(param, value);
    else params.delete(param);
  }
}

function syncDiscoverUrlParams(splitView: boolean, left: SideSettings, right: SideSettings) {
  const url = new URL(window.location.href);
  url.searchParams.set("view", splitView ? "split" : "single");
  writeSideSettings(url.searchParams, "l", left);
  writeSideSettings(url.searchParams, "r", right);
  window.history.replaceState(window.history.state, "", url);
}

type ApiHealth = "online" | "offline";

function applyApiHealth(response: Response | null, setApiHealth: (health: ApiHealth) => void) {
  if (!response || response.status === 502) setApiHealth("offline");
  else if (response.ok) setApiHealth("online");
}

function isFetchFailure(error: unknown) {
  return error instanceof TypeError;
}

function ApiHealthStatus({ health }: { health: ApiHealth }) {
  if (health === "online") return null;
  return (
    <p className="api-health-status" aria-live="polite">
      <span className="api-health-dot" aria-hidden="true" />
      <span>Offline</span>
    </p>
  );
}

function stripSplitFields(word: WordResult): WordResult {
  const { splitLeft, splitRight, ...clean } = word;
  return clean;
}

function parseCombinedParts(saved: WordResult): [string, string] | null {
  if (saved.splitLeft?.word && saved.splitRight?.word) {
    return [saved.splitLeft.word, saved.splitRight.word];
  }
  const match = saved.definition.match(/combining [“"]([^”"]+)[”"] and [“"]([^”"]+)[”"]/);
  return match ? [match[1], match[2]] : null;
}

const emptyForgeSlot = (): ForgeSlot => ({
  seed: "",
  maxLetters: "",
  letters: "",
  syllables: "",
  candidates: [],
  index: 0,
  pinned: false,
  loading: false,
  error: "",
});

const advancedModes: {
  value: AdvancedMode;
  label: string;
  fieldLabel: string;
  placeholder: string;
  description: string;
  example: string;
}[] = [
    { value: "ml", label: "Similar meaning", fieldLabel: "Meaning or idea", placeholder: "Describe a meaning", description: "Find words that express the same idea", example: "Example: ringing in the ears → tinnitus" },
    { value: "sl", label: "Similar sound", fieldLabel: "How it sounds", placeholder: "Type how it sounds", description: "Find words with a similar pronunciation", example: "Example: jirraf → giraffe" },
    { value: "spell", label: "Fix spelling", fieldLabel: "Word or misspelling", placeholder: "Enter a word", description: "Find likely spellings for an uncertain word", example: "Example: hipopatamus → hippopotamus" },
    { value: "pattern", label: "Letter pattern", fieldLabel: "Letter pattern", placeholder: "", description: "Find words by their beginning, ending, or length", example: "Example: begins with t, ends with k, 4 letters" },
    { value: "jjb", label: "Describe a noun", fieldLabel: "Noun", placeholder: "Enter a noun", description: "Find adjectives commonly used for a noun", example: "Example: ocean → vast, blue" },
    { value: "jja", label: "Nouns by adjective", fieldLabel: "Adjective", placeholder: "Enter an adjective", description: "Find nouns commonly described by an adjective", example: "Example: yellow → sun, flower" },
    { value: "trg", label: "Associated words", fieldLabel: "Word", placeholder: "Enter a word", description: "Find words that often appear in the same context", example: "Example: cow → milk, farm" },
    { value: "lc", label: "Comes after", fieldLabel: "Previous word", placeholder: "Enter the previous word", description: "Find words that commonly follow another word", example: "Example: drink → water" },
  ];

const advancedModeGroups: { label: string; modes: AdvancedMode[] }[] = [
  { label: "Meaning", modes: ["ml", "trg"] },
  { label: "Sound & spelling", modes: ["sl", "spell", "pattern"] },
  { label: "How words are used", modes: ["jjb", "jja", "lc"] },
];

const wordTypes: { value: PartOfSpeech; label: string }[] = [
  { value: "any", label: "All" },
  { value: "n", label: "Noun" },
  { value: "v", label: "Verb" },
  { value: "adj", label: "Adj" },
  { value: "adv", label: "Adv" },
];

const relations = [
  { key: "r", code: "rel", label: "Related", missing: "related word" },
] as const;

const savedWordsKey = "lexicon-saved-words";

type WordTypeTabsProps = {
  value: PartOfSpeech;
  label: string;
  className?: string;
  onChange: (value: PartOfSpeech) => void;
};

function useActiveTabClipPath(activeValue: unknown) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const activeTab = activeTabRef.current;
    if (!container || !activeTab) return;

    const updateClipPath = () => {
      const containerWidth = container.offsetWidth;
      if (!containerWidth) return;

      const containerRect = container.getBoundingClientRect();
      const activeRect = activeTab.getBoundingClientRect();
      const clipLeft = Math.max(0, activeRect.left - containerRect.left);
      const clipRight = Math.max(0, containerRect.right - activeRect.right);

      container.style.clipPath = `inset(0 ${clipRight}px 0 ${clipLeft}px round 999px)`;
    };

    const isInitialPosition = container.dataset.positioned !== "true";
    if (isInitialPosition) container.style.transition = "none";
    updateClipPath();
    if (isInitialPosition) {
      container.dataset.positioned = "true";
      void container.offsetWidth;
      container.style.removeProperty("transition");
    }

    const observer = new ResizeObserver(updateClipPath);
    observer.observe(container);
    observer.observe(activeTab);
    return () => observer.disconnect();
  }, [activeValue]);

  return { activeTabRef, containerRef };
}

function WordTypeTabs({ value, label, className = "", onChange }: WordTypeTabsProps) {
  const { activeTabRef, containerRef } = useActiveTabClipPath(value);

  return (
    <div className={`word-type-tabs ${className}`.trim()} role="group" aria-label={label}>
      <ul className="word-type-tab-list">
        {wordTypes.map((type) => (
          <li key={type.value}>
            <button
              ref={value === type.value ? activeTabRef : null}
              type="button"
              aria-pressed={value === type.value}
              onClick={() => onChange(type.value)}
            >
              {type.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="word-type-active-layer" aria-hidden="true" ref={containerRef}>
        <ul className="word-type-tab-list word-type-tab-list-overlay">
          {wordTypes.map((type) => (
            <li key={type.value}><button type="button" tabIndex={-1}>{type.label}</button></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ViewModeToggle({ splitView, onChange }: { splitView: boolean; onChange: (split: boolean) => void }) {
  const [selectedSplitView, setSelectedSplitView] = useState(splitView);
  const pendingChangeRef = useRef(0);
  const { activeTabRef, containerRef } = useActiveTabClipPath(selectedSplitView);
  const options = [
    { value: false, label: "Single" },
    { value: true, label: "Split" },
  ];

  useEffect(() => () => window.cancelAnimationFrame(pendingChangeRef.current), []);

  useEffect(() => {
    setSelectedSplitView(splitView);
  }, [splitView]);

  const selectView = (nextSplit: boolean) => {
    if (nextSplit === selectedSplitView) return;
    setSelectedSplitView(nextSplit);
    window.cancelAnimationFrame(pendingChangeRef.current);
    pendingChangeRef.current = window.requestAnimationFrame(() => onChange(nextSplit));
  };

  return (
    <div className="word-type-tabs view-mode-toggle" role="group" aria-label="View mode">
      <ul className="word-type-tab-list">
        {options.map((option) => (
          <li key={option.label}>
            <button
              ref={selectedSplitView === option.value ? activeTabRef : null}
              type="button"
              aria-pressed={selectedSplitView === option.value}
              onClick={() => selectView(option.value)}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="word-type-active-layer" aria-hidden="true" ref={containerRef}>
        <ul className="word-type-tab-list word-type-tab-list-overlay">
          {options.map((option) => (
            <li key={option.label}><button type="button" tabIndex={-1}>{option.label}</button></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

type CounterSettingProps = {
  label: string;
  value: string;
  max: number;
  onChange: (value: string) => void;
};

function CounterSetting({ label, value, max, onChange }: CounterSettingProps) {
  const count = Number(value) || 0;
  const setCount = (next: number) => onChange(next > 0 ? String(next) : "");

  return (
    <div className="counter-setting">
      <span>{label}</span>
      <div className="counter-control">
        <button type="button" disabled={count === 0} aria-label={`Decrease ${label.toLowerCase()}`} onClick={() => setCount(Math.max(0, count - 1))}>
          <Minus size={14} strokeWidth={1.6} aria-hidden="true" />
        </button>
        <output aria-label={`${label}: ${count || "Any"}`}>{count || "Any"}</output>
        <button type="button" disabled={count >= max} aria-label={`Increase ${label.toLowerCase()}`} onClick={() => setCount(Math.min(max, count + 1))}>
          <Plus size={15} strokeWidth={1.6} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function LengthModeToggle({ value, label = "Word length comparison", disabled = false, onChange }: {
  value: LengthMode;
  label?: string;
  disabled?: boolean;
  onChange: (value: LengthMode) => void;
}) {
  const { activeTabRef, containerRef } = useActiveTabClipPath(value);
  const options = [
    { value: "less" as const, label: "Less than or equal", symbol: "≤" },
    { value: "exact" as const, label: "Equal", symbol: "=" },
    { value: "more" as const, label: "More than or equal", symbol: "≥" },
  ];

  return (
    <div className={disabled ? "length-mode-toggle disabled" : "length-mode-toggle"} role="group" aria-label={label} aria-disabled={disabled}>
      <ul className="word-type-tab-list">
        {options.map((option) => (
          <li key={option.value}>
            <button
              ref={value === option.value ? activeTabRef : null}
              type="button"
              aria-label={option.label}
              title={option.label}
              aria-pressed={value === option.value}
              disabled={disabled}
              onClick={() => onChange(option.value)}
            >
              <span className="inequality-symbol" aria-hidden="true">{option.symbol}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="word-type-active-layer" aria-hidden="true" ref={containerRef}>
        <ul className="word-type-tab-list word-type-tab-list-overlay">
          {options.map((option) => (
            <li key={option.value}><button type="button" tabIndex={-1}><span className="inequality-symbol">{option.symbol}</span></button></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function WordLengthSetting({ value, mode, onValueChange, onModeChange }: {
  value: string;
  mode: LengthMode;
  onValueChange: (value: string) => void;
  onModeChange: (value: LengthMode) => void;
}) {
  return (
    <div className="word-length-setting">
      <CounterSetting label="Word length" value={value} max={22} onChange={onValueChange} />
      <LengthModeToggle value={mode} disabled={!value} onChange={onModeChange} />
    </div>
  );
}

function AffixSetting({ kind, value, onChange }: {
  kind: "starts" | "ends";
  value: string;
  onChange: (value: string) => void;
}) {
  const label = kind === "starts" ? "Starts with" : "Ends with";
  const line = <span className="affix-line" aria-hidden="true" />;

  return (
    <label className={`split-setting-field affix-setting ${kind}`}>
      <span>{label}</span>
      <span className="affix-control">
        {kind === "ends" ? line : null}
        <input
          value={value}
          aria-label={label}
          placeholder="Any"
          maxLength={12}
          onChange={(event) => onChange(event.target.value.replace(/[^a-z]/gi, ""))}
        />
        {kind === "starts" ? line : null}
      </span>
    </label>
  );
}

function RelatedToSetting({ id, value, onChange }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const relatedFieldRef = useRef<HTMLDivElement | null>(null);
  const settingsPanelHeightRef = useRef<number | null>(null);
  const settingsPanelAnimationRef = useRef<Animation | null>(null);
  const settingsContentPositionsRef = useRef(new Map<HTMLElement, number>());
  const settingsContentAnimationsRef = useRef<Animation[]>([]);
  const tags = useMemo(
    () => value.split(",").map((tag) => tag.trim()).filter(Boolean),
    [value],
  );

  useLayoutEffect(() => {
    const panel = relatedFieldRef.current?.closest<HTMLElement>(".split-settings-panel");
    if (!panel) return;

    settingsContentAnimationsRef.current.forEach((animation) => animation.cancel());
    const contentItems = Array.from(
      panel.querySelectorAll<HTMLElement>(".settings-panel-header, .settings-group"),
    );
    const panelRect = panel.getBoundingClientRect();
    const nextContentPositions = new Map(
      contentItems.map((item) => [item, item.getBoundingClientRect().top - panelRect.top]),
    );
    const previousContentPositions = settingsContentPositionsRef.current;
    settingsContentPositionsRef.current = nextContentPositions;
    const previousHeight = settingsPanelAnimationRef.current
      ? panel.getBoundingClientRect().height
      : settingsPanelHeightRef.current;
    settingsPanelAnimationRef.current?.cancel();
    const targetHeight = panel.getBoundingClientRect().height;
    settingsPanelHeightRef.current = targetHeight;

    if (
      previousHeight === null
      || Math.abs(previousHeight - targetHeight) < 1
      || window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;

    const animation = panel.animate(
      [
        { height: `${previousHeight}px` },
        { height: `${targetHeight}px` },
      ],
      { duration: 260, easing: "cubic-bezier(.22, 1, .36, 1)" },
    );
    settingsPanelAnimationRef.current = animation;
    settingsContentAnimationsRef.current = contentItems.flatMap((item) => {
      const previousTop = previousContentPositions.get(item);
      const nextTop = nextContentPositions.get(item);
      if (previousTop === undefined || nextTop === undefined || Math.abs(previousTop - nextTop) < 1) return [];
      return [item.animate(
        [
          { transform: `translateY(${previousTop - nextTop}px)` },
          { transform: "translateY(0)" },
        ],
        { duration: 260, easing: "cubic-bezier(.22, 1, .36, 1)" },
      )];
    });
    animation.onfinish = () => {
      if (settingsPanelAnimationRef.current === animation) settingsPanelAnimationRef.current = null;
    };
  }, [tags.length]);

  useEffect(() => () => {
    settingsPanelAnimationRef.current?.cancel();
    settingsContentAnimationsRef.current.forEach((animation) => animation.cancel());
  }, []);

  useEffect(() => {
    const query = draft.trim();
    if (!open || query.length < 2 || tags.length >= 8) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (!response.ok) return;
        const existing = new Set(tags.map((tag) => tag.toLowerCase()));
        const words = (await response.json() as string[]).filter((word) => !existing.has(word.toLowerCase()));
        setSuggestions(words);
        setActiveSuggestion(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setSuggestions([]);
      }
    }, 160);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [draft, open, tags]);

  const addTags = (entries: string[], nextDraft = "") => {
    const nextTags = [...tags];
    const seen = new Set(tags.map((tag) => tag.toLowerCase()));
    for (const entry of entries) {
      const tag = entry.trim();
      const key = tag.toLowerCase();
      if (!tag || seen.has(key) || nextTags.length >= 8) continue;
      seen.add(key);
      nextTags.push(tag);
    }
    onChange(nextTags.join(", "));
    setDraft(nextDraft);
    setSuggestions([]);
    setActiveSuggestion(-1);
    setOpen(Boolean(nextDraft));
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, tagIndex) => tagIndex !== index).join(", "));
  };

  return (
    <div className="split-setting-field boxed-setting-field related-tags-field" ref={relatedFieldRef}>
      <label htmlFor={id}>Related to</label>
      <div className="related-tags-control">
        {tags.map((tag, index) => (
          <span className="related-tag" key={`${tag.toLowerCase()}-${index}`}>
            {tag}
            <button type="button" aria-label={`Remove ${tag}`} onClick={() => removeTag(index)}>
              <X size={12} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          className="related-tags-input"
          id={id}
          role="combobox"
          value={draft}
          placeholder={tags.length ? "" : "Add words"}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={`${id}-suggestions`}
          aria-expanded={open && suggestions.length > 0}
          aria-activedescendant={activeSuggestion >= 0 ? `${id}-suggestion-${activeSuggestion}` : undefined}
          disabled={tags.length >= 8}
          onChange={(event) => {
            const nextDraft = event.target.value;
            if (nextDraft.includes(",")) {
              const entries = nextDraft.split(",");
              const remainingDraft = entries.pop() ?? "";
              addTags(entries, remainingDraft);
              return;
            }
            setDraft(nextDraft);
            if (nextDraft.trim().length < 2) {
              setSuggestions([]);
              setActiveSuggestion(-1);
            }
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 100)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && suggestions.length) {
              event.preventDefault();
              setActiveSuggestion((current) => Math.min(current + 1, suggestions.length - 1));
            } else if (event.key === "ArrowUp" && suggestions.length) {
              event.preventDefault();
              setActiveSuggestion((current) => Math.max(current - 1, 0));
            } else if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addTags([activeSuggestion >= 0 ? suggestions[activeSuggestion] : draft]);
            } else if (event.key === "Backspace" && !draft && tags.length) {
              removeTag(tags.length - 1);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </div>
      {open && suggestions.length ? (
        <ul className="related-suggestions" id={`${id}-suggestions`} role="listbox">
          {suggestions.map((word, index) => (
            <li
              id={`${id}-suggestion-${index}`}
              key={word}
              role="option"
              aria-selected={index === activeSuggestion}
              className={index === activeSuggestion ? "active" : ""}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => addTags([word])}
            >
              {word}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SplitDescription({ children }: { children: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      className={expanded ? "split-definition expanded" : "split-definition"}
      type="button"
      style={{ fontFamily: cardo.style.fontFamily }}
      aria-expanded={expanded}
      title={expanded ? "Collapse description" : "Show full description"}
      onClick={() => setExpanded((current) => !current)}
    >
      {children}
    </button>
  );
}

function WordCopyHint({ status }: { status: WordCopyStatus }) {
  const hasCopied = status !== "idle";
  return (
    <span className={`word-copy-hint${status === "hidden" ? " hidden" : ""}`} aria-hidden="true">
      <span className="word-copy-hint-icon" key={hasCopied ? "icon-check" : "icon-copy"}>
        {hasCopied
          ? <Check size={12} strokeWidth={1.7} />
          : <Copy size={12} strokeWidth={1.5} />}
      </span>
      <span className="word-copy-hint-label" key={hasCopied ? "label-copied" : "label-copy"}>{hasCopied ? "Copied word" : "Click to copy"}</span>
    </span>
  );
}

export default function Home() {
  const [appMode, setAppMode] = useState<AppMode>("discover");
  const [wordType, setWordType] = useState<PartOfSpeech>("any");
  const [splitView, setSplitView] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [wordCopyStatus, setWordCopyStatus] = useState<WordCopyStatus>("idle");
  const [wordSyllables, setWordSyllables] = useState("");
  const [wordSyllableMode, setWordSyllableMode] = useState<LengthMode>("exact");
  const [wordStartsWith, setWordStartsWith] = useState("");
  const [wordEndsWith, setWordEndsWith] = useState("");
  const [wordLetters, setWordLetters] = useState("");
  const [wordLengthMode, setWordLengthMode] = useState<LengthMode>("exact");
  const [wordRelatedTo, setWordRelatedTo] = useState("");
  const [secondaryWordType, setSecondaryWordType] = useState<PartOfSpeech>("any");
  const [secondaryWordSyllables, setSecondaryWordSyllables] = useState("");
  const [secondaryWordSyllableMode, setSecondaryWordSyllableMode] = useState<LengthMode>("exact");
  const [secondaryWordStartsWith, setSecondaryWordStartsWith] = useState("");
  const [secondaryWordEndsWith, setSecondaryWordEndsWith] = useState("");
  const [secondaryWordLetters, setSecondaryWordLetters] = useState("");
  const [secondaryWordLengthMode, setSecondaryWordLengthMode] = useState<LengthMode>("exact");
  const [secondaryWordRelatedTo, setSecondaryWordRelatedTo] = useState("");
  const [result, setResult] = useState<WordResult>({
    word: "",
    definition: "",
    partOfSpeech: "",
  });
  const [secondaryResult, setSecondaryResult] = useState<WordResult>({ word: "", definition: "", partOfSpeech: "" });
  const [leftWordDraft, setLeftWordDraft] = useState("");
  const [rightWordDraft, setRightWordDraft] = useState("");
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [splitBatchLoading, setSplitBatchLoading] = useState(false);
  const [apiHealth, setApiHealth] = useState<ApiHealth>("online");
  const [message, setMessage] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedTool, setAdvancedTool] = useState<"search" | "forge">("search");
  const [advancedMode, setAdvancedMode] = useState<AdvancedMode>("ml");
  const [advancedQuery, setAdvancedQuery] = useState("");
  const [advancedStartsWith, setAdvancedStartsWith] = useState("");
  const [advancedEndsWith, setAdvancedEndsWith] = useState("");
  const [advancedLength, setAdvancedLength] = useState("");
  const [advancedTopic, setAdvancedTopic] = useState("");
  const [advancedResults, setAdvancedResults] = useState<WordResult[]>([]);
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [advancedError, setAdvancedError] = useState("");
  const [forgeSlots, setForgeSlots] = useState<ForgeSlot[]>([emptyForgeSlot(), emptyForgeSlot()]);
  const [forgeSyllables, setForgeSyllables] = useState("");
  const [forgeTotalLetters, setForgeTotalLetters] = useState("");
  const [forgeCopied, setForgeCopied] = useState(false);
  const [forgeRemixing, setForgeRemixing] = useState(false);
  const [savedWords, setSavedWords] = useState<WordResult[]>([]);
  const [savedOpen, setSavedOpen] = useState(false);
  const [splitHistoryRevision, setSplitHistoryRevision] = useState(0);
  const requestRef = useRef<AbortController | null>(null);
  const secondaryRequestRef = useRef<AbortController | null>(null);
  const splitEntryRequestFrameRef = useRef(0);
  const splitBatchRequestRef = useRef(0);
  const wordCopyTimerRef = useRef(0);
  const savedMenuRef = useRef<HTMLDivElement | null>(null);
  const initialWordLoaded = useRef(false);
  const wordHistoryRef = useRef<WordResult[]>([]);
  const historyIndexRef = useRef(-1);
  const forgeHistoryRef = useRef<ForgeHistoryEntry[]>([]);
  const forgeHistoryIndexRef = useRef(-1);
  const splitHistoryRef = useRef<SplitHistoryEntry[]>([]);
  const splitHistoryIndexRef = useRef(-1);
  const splitHistoryBatchDepthRef = useRef(0);
  const settingsUrlSyncedRef = useRef(false);

  const resetPrimarySettings = useCallback(() => {
    setLeftWordDraft("");
    setWordRelatedTo("");
    setWordType("any");
    setWordSyllables("");
    setWordSyllableMode("exact");
    setWordStartsWith("");
    setWordEndsWith("");
    setWordLetters("");
    setWordLengthMode("exact");
  }, []);

  const resetSecondarySettings = useCallback(() => {
    setRightWordDraft("");
    setSecondaryWordRelatedTo("");
    setSecondaryWordType("any");
    setSecondaryWordSyllables("");
    setSecondaryWordSyllableMode("exact");
    setSecondaryWordStartsWith("");
    setSecondaryWordEndsWith("");
    setSecondaryWordLetters("");
    setSecondaryWordLengthMode("exact");
  }, []);

  const selectAppMode = useCallback((mode: AppMode) => {
    setAppMode(mode);
    setAdvancedOpen(mode !== "discover");
    if (mode !== "discover") setFocusMode(false);
    if (mode !== "discover") setAdvancedTool(mode === "combine" ? "forge" : "search");
  }, []);

  const commitWord = useCallback((word: WordResult) => {
    const currentBranch = wordHistoryRef.current.slice(0, historyIndexRef.current + 1);
    const updatedHistory = [...currentBranch, word].slice(-100);
    wordHistoryRef.current = updatedHistory;
    historyIndexRef.current = updatedHistory.length - 1;
    setResult(word);
  }, []);

  const moveThroughHistory = useCallback((direction: -1 | 1) => {
    const nextIndex = historyIndexRef.current + direction;
    if (nextIndex < 0 || nextIndex >= wordHistoryRef.current.length) return;

    historyIndexRef.current = nextIndex;
    const nextWord = wordHistoryRef.current[nextIndex];
    setResult(nextWord);
    setSecondaryResult(nextWord);
    setRightWordDraft("");
    setMessage("");
  }, []);

  useEffect(() => {
    if (!savedOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!savedMenuRef.current?.contains(event.target as Node)) setSavedOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [savedOpen]);

  useEffect(() => {
    const loadSavedWords = () => {
      try {
        const stored = window.localStorage.getItem(savedWordsKey);
        setSavedWords(stored ? (JSON.parse(stored) as WordResult[]) : []);
      } catch {
        setSavedWords([]);
      }
    };

    const frame = window.requestAnimationFrame(loadSavedWords);
    window.addEventListener("storage", loadSavedWords);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("storage", loadSavedWords);
    };
  }, []);

  const saveWords = useCallback((words: WordResult[]) => {
    setSavedWords(words);
    try {
      window.localStorage.setItem(savedWordsKey, JSON.stringify(words));
    } catch {
      // The UI still works for this session if browser storage is unavailable.
    }
  }, []);

  const isSaved = savedWords.some((item) => item.word.toLowerCase() === result.word.toLowerCase());
  const displayedPronunciation = normalizePronunciation(result.pronunciation);
  const secondaryPronunciation = normalizePronunciation(secondaryResult.pronunciation);
  const leftWordValue = leftWordDraft || result.word;
  const rightWordValue = rightWordDraft || secondaryResult.word;
  const combinedSplitWord = `${leftWordValue}${rightWordValue}`.replace(/\s+/g, "").toLowerCase();
  const combinedSplitIsSaved = Boolean(combinedSplitWord)
    && savedWords.some((item) => item.word.toLowerCase() === combinedSplitWord);

  const toggleSaved = useCallback(() => {
    if (isSaved) {
      saveWords(savedWords.filter((item) => item.word.toLowerCase() !== result.word.toLowerCase()));
    } else {
      saveWords([result, ...savedWords]);
    }
  }, [isSaved, result, saveWords, savedWords]);

  const toggleCombinedSaved = useCallback(() => {
    if (!combinedSplitWord) return;
    if (combinedSplitIsSaved) {
      saveWords(savedWords.filter((item) => item.word.toLowerCase() !== combinedSplitWord));
      return;
    }
    saveWords([{
      word: combinedSplitWord,
      definition: `A coined word combining “${leftWordValue}” and “${rightWordValue}”.`,
      partOfSpeech: "combined word",
      splitLeft: stripSplitFields(result),
      splitRight: stripSplitFields(secondaryResult),
    }, ...savedWords]);
  }, [combinedSplitIsSaved, combinedSplitWord, leftWordValue, result, rightWordValue, saveWords, savedWords, secondaryResult]);

  const loadSavedWord = useCallback(async (saved: WordResult) => {
    setMessage("From your saved words");
    setSavedOpen(false);
    selectAppMode("discover");

    if (splitView && saved.partOfSpeech === "combined word") {
      const parts = parseCombinedParts(saved);
      if (parts) {
        const [left, right] = parts;
        setLeftWordDraft("");
        setRightWordDraft("");
        const hasStoredDefinitions = saved.splitLeft && saved.splitRight
          && saved.splitLeft.definition
          && saved.splitRight.definition
          && !saved.splitLeft.definition.startsWith("A coined word combining ")
          && !saved.splitRight.definition.startsWith("A coined word combining ")
          && saved.splitLeft.definition !== saved.definition
          && saved.splitRight.definition !== saved.definition;

        if (hasStoredDefinitions) {
          setResult(saved.splitLeft!);
          setSecondaryResult(saved.splitRight!);
          return;
        }

        setLoading(true);
        setSecondaryLoading(true);
        try {
          const lookupSide = async (word: string): Promise<WordResult> => {
            try {
              const response = await fetch(`/api/word?lookup=${encodeURIComponent(word)}`);
              applyApiHealth(response, setApiHealth);
              if (response.ok) return await response.json() as WordResult;
            } catch (error) {
              if (isFetchFailure(error)) applyApiHealth(null, setApiHealth);
            }
            return { word, definition: "No definition available.", partOfSpeech: "word" };
          };
          const [leftWord, rightWord] = await Promise.all([lookupSide(left), lookupSide(right)]);
          setResult(leftWord);
          setSecondaryResult(rightWord);
        } finally {
          setLoading(false);
          setSecondaryLoading(false);
        }
        return;
      }
    }

    if (splitView) {
      commitWord(saved);
      setSecondaryResult({ word: "", definition: "", partOfSpeech: "" });
      setLeftWordDraft("");
      setRightWordDraft("");
      return;
    }

    commitWord(saved);
  }, [commitWord, selectAppMode, splitView]);

  const copyDisplayedWord = useCallback(async (word: string) => {
    if (!word) return;
    try {
      await navigator.clipboard.writeText(word.replace(/\s+/g, "").toLowerCase());
      window.clearTimeout(wordCopyTimerRef.current);
      setWordCopyStatus("copied");
      wordCopyTimerRef.current = window.setTimeout(() => setWordCopyStatus("hidden"), 2000);
    } catch {
      // Clipboard access can be denied outside a secure browser context.
    }
  }, []);

  useEffect(() => () => window.clearTimeout(wordCopyTimerRef.current), []);

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

  const updateForgeSlot = (slotIndex: number, changes: Partial<ForgeSlot>) => {
    setForgeSlots((slots) => slots.map((slot, index) => index === slotIndex ? { ...slot, ...changes } : slot));
  };

  const fitsForgeSlotConstraints = (word: WordResult, slotIndex: number) => {
    const limit = Number(forgeSlots[slotIndex].maxLetters);
    const exactLetters = Number(forgeSlots[slotIndex].letters);
    const syllables = Number(forgeSlots[slotIndex].syllables);
    const letterCount = word.word.replace(/[^a-z]/gi, "").length;
    const lettersMatch = (!limit || letterCount <= limit) && (!exactLetters || letterCount === exactLetters);
    const syllablesMatch = !syllables || word.syllables === syllables;
    return lettersMatch && syllablesMatch;
  };

  const matchesForgeSyllables = (left: WordResult, right: WordResult) => {
    const target = Number(forgeSyllables);
    const letterTarget = Number(forgeTotalLetters);
    const syllablesMatch = !target || Boolean(left.syllables && right.syllables && left.syllables + right.syllables === target);
    const lettersMatch = !letterTarget || left.word.length + right.word.length === letterTarget;
    return syllablesMatch && lettersMatch;
  };

  const findForgeWords = async (slotIndex: number) => {
    const seed = forgeSlots[slotIndex].seed.trim();
    updateForgeSlot(slotIndex, { loading: true, error: "", candidates: [], pinned: false });

    try {
      const otherIndex = slotIndex === 0 ? 1 : 0;
      const otherWord = forgeSlots[otherIndex].candidates[forgeSlots[otherIndex].index];
      const params = new URLSearchParams(seed ? { idea: seed } : { random: "1" });
      const requiredSyllables = forgeSlots[slotIndex].syllables
        || (Number(forgeSyllables) && otherWord?.syllables
          ? String(Number(forgeSyllables) - otherWord.syllables)
          : "");
      const requiredLetters = forgeSlots[slotIndex].letters
        || (Number(forgeTotalLetters) && otherWord
          ? String(Number(forgeTotalLetters) - otherWord.word.length)
          : "");
      if (Number(requiredSyllables) > 0) params.set("syllables", requiredSyllables);
      if (forgeSlots[slotIndex].maxLetters) params.set("maxLetters", forgeSlots[slotIndex].maxLetters);
      if (Number(requiredLetters) > 0) params.set("letters", requiredLetters);
      const response = await fetch(`/api/forge?${params}`);
      applyApiHealth(response, setApiHealth);
      const connected = response.ok ? (await response.json()) as WordResult[] : [];
      const seen = new Set<string>();
      const candidates = connected.filter((word): word is WordResult => {
        if (!/^[a-z]+$/i.test(word.word) || !fitsForgeSlotConstraints(word, slotIndex)) return false;
        const key = word.word.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (!candidates.length) throw new Error("No related words");
      const hasCombinedTarget = Number(forgeSyllables) || Number(forgeTotalLetters);
      const matchingIndex = hasCombinedTarget && otherWord
        ? candidates.findIndex((candidate) => slotIndex === 0
          ? matchesForgeSyllables(candidate, otherWord)
          : matchesForgeSyllables(otherWord, candidate))
        : 0;
      if (matchingIndex < 0) throw new Error("No words match the combined target");
      updateForgeSlot(slotIndex, { candidates, index: matchingIndex, loading: false });
    } catch (error) {
      const message = error instanceof Error && error.message === "No words match the combined target"
        ? error.message
        : seed ? "No connected words found" : "No random words match these limits";
      updateForgeSlot(slotIndex, { loading: false, error: message });
    }
  };

  const lockForgeSeedWord = async (slotIndex: number) => {
    const seed = forgeSlots[slotIndex].seed.trim();
    if (!/^[a-z]+$/i.test(seed)) {
      updateForgeSlot(slotIndex, { error: "Enter one word to lock it" });
      return;
    }

    updateForgeSlot(slotIndex, { loading: true, error: "" });
    try {
      const [wordResponse, connectionsResponse] = await Promise.all([
        fetch(`/api/word?lookup=${encodeURIComponent(seed)}`),
        fetch(`/api/forge?idea=${encodeURIComponent(seed)}`),
      ]);
      applyApiHealth(wordResponse, setApiHealth);
      applyApiHealth(connectionsResponse, setApiHealth);
      if (!wordResponse.ok) throw new Error("Word not found");
      const exact = await wordResponse.json() as WordResult;
      if (!fitsForgeSlotConstraints(exact, slotIndex)) throw new Error("Word does not match this half’s limits");
      const connections = connectionsResponse.ok ? await connectionsResponse.json() as WordResult[] : [];
      const seen = new Set([exact.word.toLowerCase()]);
      const candidates = [
        { ...exact, relation: "exact" },
        ...connections.filter((word) => {
          const key = word.word.toLowerCase();
          if (!/^[a-z]+$/i.test(word.word) || !fitsForgeSlotConstraints(word, slotIndex) || seen.has(key)) return false;
          seen.add(key);
          return true;
        }),
      ];
      updateForgeSlot(slotIndex, { candidates, index: 0, pinned: true, loading: false, error: "" });
    } catch (error) {
      if (isFetchFailure(error)) applyApiHealth(null, setApiHealth);
      updateForgeSlot(slotIndex, {
        loading: false,
        error: error instanceof Error ? error.message : "Word not found",
      });
    }
  };

  const cycleForgeWord = (slotIndex: number) => {
    const slot = forgeSlots[slotIndex];
    if (slot.pinned || slot.candidates.length < 2) return;
    const otherIndex = slotIndex === 0 ? 1 : 0;
    const otherWord = forgeSlots[otherIndex].candidates[forgeSlots[otherIndex].index];

    for (let offset = 1; offset < slot.candidates.length; offset += 1) {
      const index = (slot.index + offset) % slot.candidates.length;
      const candidate = slot.candidates[index];
      const syllablesMatch = !otherWord || (slotIndex === 0
        ? matchesForgeSyllables(candidate, otherWord)
        : matchesForgeSyllables(otherWord, candidate));
      if (fitsForgeSlotConstraints(candidate, slotIndex) && syllablesMatch) {
        updateForgeSlot(slotIndex, { index, error: "" });
        return;
      }
    }

    updateForgeSlot(slotIndex, { error: "No other word matches these limits" });
  };

  const remixForgePair = async () => {
    const currentWords = forgeSlots.map((slot) => slot.candidates[slot.index]);
    const ideas = forgeSlots.map((slot) => slot.seed.trim());
    const remixIndexes = forgeSlots
      .map((slot, index) => slot.pinned ? -1 : index)
      .filter((index) => index >= 0);
    if (forgeRemixing || !remixIndexes.length || currentWords.some((word) => !word)) return;

    setForgeRemixing(true);
    setForgeSlots((slots) => slots.map((slot) => ({ ...slot, error: "" })));

    try {
      const maxAttempts = remixIndexes.some((slotIndex) => !ideas[slotIndex]) ? 4 : 1;
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const results = await Promise.all(remixIndexes.map(async (slotIndex) => {
          const params = new URLSearchParams(ideas[slotIndex] ? { idea: ideas[slotIndex] } : { random: "1" });
          const otherIndex = slotIndex === 0 ? 1 : 0;
          const fixedOtherWord = forgeSlots[otherIndex].pinned ? currentWords[otherIndex] : undefined;
          const requiredSyllables = forgeSlots[slotIndex].syllables
            || (Number(forgeSyllables) && fixedOtherWord?.syllables
              ? String(Number(forgeSyllables) - fixedOtherWord.syllables)
              : "");
          const requiredLetters = forgeSlots[slotIndex].letters
            || (Number(forgeTotalLetters) && fixedOtherWord
              ? String(Number(forgeTotalLetters) - fixedOtherWord.word.length)
              : "");
          if (Number(requiredSyllables) > 0) params.set("syllables", requiredSyllables);
          if (forgeSlots[slotIndex].maxLetters) params.set("maxLetters", forgeSlots[slotIndex].maxLetters);
          if (Number(requiredLetters) > 0) params.set("letters", requiredLetters);
          const response = await fetch(`/api/forge?${params}`);
          applyApiHealth(response, setApiHealth);
          if (!response.ok) throw new Error("Could not remix pair");
          return response.json() as Promise<WordResult[]>;
        }));
        const candidateLists = new Map(remixIndexes.map((slotIndex, resultIndex) => {
          const words = results[resultIndex];
          const seen = new Set<string>();
          const idea = ideas[slotIndex].toLowerCase();
          const currentWord = currentWords[slotIndex]?.word.toLowerCase();

          const candidates = words.filter((word) => {
            const key = word.word.toLowerCase();
            if (!/^[a-z]+$/i.test(word.word) || !fitsForgeSlotConstraints(word, slotIndex) || key === idea || key === currentWord || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          return [slotIndex, candidates] as const;
        }));

        if ([...candidateLists.values()].some((words) => !words.length)) continue;
        const choices = forgeSlots.map((slot, slotIndex) => {
          const words = slot.pinned ? [currentWords[slotIndex]] : candidateLists.get(slotIndex) ?? [];
          return words.filter((word): word is WordResult => Boolean(word && fitsForgeSlotConstraints(word, slotIndex)));
        });
        const validPairs = choices[0].flatMap((left) => (
          choices[1].filter((right) => matchesForgeSyllables(left, right)).map((right) => [left, right] as const)
        ));
        if (!validPairs.length) continue;
        const selectedPair = validPairs[Math.floor(Math.random() * validPairs.length)];

        setForgeSlots((slots) => slots.map((slot, slotIndex) => {
          const candidates = candidateLists.get(slotIndex);
          if (!candidates) return slot;
          const index = candidates.findIndex((word) => word.word === selectedPair[slotIndex].word);
          return { ...slot, candidates, index, error: "" };
        }));
        return;
      }
      throw new Error("No pair matches these limits");
    } catch (error) {
      const message = error instanceof Error && error.message === "No pair matches these limits"
        ? error.message
        : "Couldn’t remix this pair";
      setForgeSlots((slots) => slots.map((slot) => ({ ...slot, error: message })));
    } finally {
      setForgeRemixing(false);
    }
  };

  const runForgePrimary = async () => {
    const unexplored = forgeSlots
      .map((slot, index) => !slot.candidates.length ? index : -1)
      .filter((index) => index >= 0);
    if (unexplored.length) {
      await Promise.all(unexplored.map((slotIndex) => findForgeWords(slotIndex)));
      return;
    }
    if (forgeSlots.every((slot) => slot.candidates.length)) await remixForgePair();
  };

  const toggleForgedSaved = () => {
    const words = forgeSlots.map((slot) => slot.candidates[slot.index]);
    if (!words[0] || !words[1] || !matchesForgeSyllables(words[0], words[1])) return;
    if (!words.every((word, slotIndex) => fitsForgeSlotConstraints(word, slotIndex))) return;
    const word = words.map((item) => item.word.replace(/\s+/g, "").toLowerCase()).join("");
    const exists = savedWords.some((saved) => saved.word.toLowerCase() === word);
    saveWords(exists
      ? savedWords.filter((saved) => saved.word.toLowerCase() !== word)
      : [...savedWords, {
        word,
        definition: `A coined word combining “${words[0].word}” and “${words[1].word}”.`,
        partOfSpeech: "coined word",
      }]);
  };

  const moveThroughForgeHistory = useCallback((direction: -1 | 1) => {
    const nextIndex = forgeHistoryIndexRef.current + direction;
    const entry = forgeHistoryRef.current[nextIndex];
    if (!entry) return;

    forgeHistoryIndexRef.current = nextIndex;
    setForgeSlots((slots) => slots.map((slot, slotIndex) => {
      const savedSlot = entry.slots[slotIndex];
      const existingIndex = slot.candidates.findIndex((word) => word.word === savedSlot.word.word);
      const candidates = existingIndex >= 0 ? slot.candidates : [savedSlot.word, ...slot.candidates];
      return {
        ...slot,
        seed: savedSlot.seed,
        maxLetters: savedSlot.maxLetters,
        letters: savedSlot.letters,
        syllables: savedSlot.syllables,
        pinned: savedSlot.pinned,
        candidates,
        index: existingIndex >= 0 ? existingIndex : 0,
        error: "",
      };
    }));
  }, []);

  const modeActionsRef = useRef({ runAdvancedSearch, runForgePrimary, cycleForgeWord, toggleForgedSaved, moveThroughForgeHistory });
  useEffect(() => {
    modeActionsRef.current = { runAdvancedSearch, runForgePrimary, cycleForgeWord, toggleForgedSaved, moveThroughForgeHistory };
  });

  const findWord = useCallback(
    async (relation?: (typeof relations)[number], requestedType: PartOfSpeech = wordType, syncSecondary = !splitView) => {
      requestRef.current?.abort();
      setLeftWordDraft("");
      const controller = new AbortController();
      requestRef.current = controller;
      setLoading(true);
      setMessage("");

      const params = new URLSearchParams({ pos: requestedType });
      if (relation) {
        params.set("relation", relation.code);
        params.set("word", result.word);
      } else {
        if (wordSyllables) {
          params.set("syllables", wordSyllables);
          params.set("syllablesMode", wordSyllableMode);
        }
        if (wordStartsWith) params.set("startsWith", wordStartsWith);
        if (wordEndsWith) params.set("endsWith", wordEndsWith);
        if (wordLetters) {
          params.set("length", wordLetters);
          params.set("lengthMode", wordLengthMode);
        }
      }

      try {
        let next: WordResult;
        if (!relation && wordRelatedTo.trim()) {
          const response = await fetch(`/api/forge?idea=${encodeURIComponent(wordRelatedTo.trim())}`, { signal: controller.signal });
          applyApiHealth(response, setApiHealth);
          if (!response.ok) throw new Error("No word found");
          const partName = requestedType === "any"
            ? undefined
            : { n: "noun", v: "verb", adj: "adjective", adv: "adverb" }[requestedType];
          const candidates = (await response.json() as WordResult[]).filter((word) => {
            if (partName && word.partOfSpeech !== partName) return false;
            if (wordSyllables && !word.syllables) return false;
            if (wordSyllables && wordSyllableMode === "exact" && word.syllables !== Number(wordSyllables)) return false;
            if (wordSyllables && wordSyllableMode === "less" && word.syllables! > Number(wordSyllables)) return false;
            if (wordSyllables && wordSyllableMode === "more" && word.syllables! < Number(wordSyllables)) return false;
            if (wordStartsWith && !word.word.toLowerCase().startsWith(wordStartsWith.toLowerCase())) return false;
            if (wordEndsWith && !word.word.toLowerCase().endsWith(wordEndsWith.toLowerCase())) return false;
            if (wordLetters && wordLengthMode === "exact" && word.word.length !== Number(wordLetters)) return false;
            if (wordLetters && wordLengthMode === "less" && word.word.length > Number(wordLetters)) return false;
            return !wordLetters || wordLengthMode !== "more" || word.word.length >= Number(wordLetters);
          });
          if (!candidates.length) throw new Error("No word found");
          const alternatives = candidates.filter((word) => word.word !== result.word);
          const pool = alternatives.length ? alternatives : candidates;
          next = pool[Math.floor(Math.random() * pool.length)];
        } else {
          const response = await fetch(`/api/word?${params}`, { signal: controller.signal });
          applyApiHealth(response, setApiHealth);
          if (!response.ok) throw new Error("No word found");
          next = (await response.json()) as WordResult;
        }
        if (controller.signal.aborted || requestRef.current !== controller) return;
        commitWord(next);
        if (syncSecondary) setSecondaryResult(next);
        setMessage(relation ? `${relation.label} to “${result.word}”` : "");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          if (isFetchFailure(error)) applyApiHealth(null, setApiHealth);
          setMessage(relation ? `No ${relation.missing} found` : "The dictionary is quiet — try again");
        }
      } finally {
        if (requestRef.current === controller) setLoading(false);
      }
    },
    [commitWord, result.word, splitView, wordEndsWith, wordLengthMode, wordLetters, wordRelatedTo, wordStartsWith, wordSyllableMode, wordSyllables, wordType],
  );

  const findSecondaryWord = useCallback(async (requestedType: PartOfSpeech = secondaryWordType) => {
    secondaryRequestRef.current?.abort();
    setRightWordDraft("");
    const controller = new AbortController();
    secondaryRequestRef.current = controller;
    setSecondaryLoading(true);
    const params = new URLSearchParams({ pos: requestedType });
    if (secondaryWordSyllables) {
      params.set("syllables", secondaryWordSyllables);
      params.set("syllablesMode", secondaryWordSyllableMode);
    }
    if (secondaryWordStartsWith) params.set("startsWith", secondaryWordStartsWith);
    if (secondaryWordEndsWith) params.set("endsWith", secondaryWordEndsWith);
    if (secondaryWordLetters) {
      params.set("length", secondaryWordLetters);
      params.set("lengthMode", secondaryWordLengthMode);
    }

    try {
      if (secondaryWordRelatedTo.trim()) {
        const response = await fetch(`/api/forge?idea=${encodeURIComponent(secondaryWordRelatedTo.trim())}`, { signal: controller.signal });
        applyApiHealth(response, setApiHealth);
        if (!response.ok) throw new Error("No word found");
        const partName = requestedType === "any"
          ? undefined
          : { n: "noun", v: "verb", adj: "adjective", adv: "adverb" }[requestedType];
        const candidates = (await response.json() as WordResult[]).filter((word) => {
          if (partName && word.partOfSpeech !== partName) return false;
          if (secondaryWordSyllables && !word.syllables) return false;
          if (secondaryWordSyllables && secondaryWordSyllableMode === "exact" && word.syllables !== Number(secondaryWordSyllables)) return false;
          if (secondaryWordSyllables && secondaryWordSyllableMode === "less" && word.syllables! > Number(secondaryWordSyllables)) return false;
          if (secondaryWordSyllables && secondaryWordSyllableMode === "more" && word.syllables! < Number(secondaryWordSyllables)) return false;
          if (secondaryWordStartsWith && !word.word.toLowerCase().startsWith(secondaryWordStartsWith.toLowerCase())) return false;
          if (secondaryWordEndsWith && !word.word.toLowerCase().endsWith(secondaryWordEndsWith.toLowerCase())) return false;
          if (secondaryWordLetters && secondaryWordLengthMode === "exact" && word.word.length !== Number(secondaryWordLetters)) return false;
          if (secondaryWordLetters && secondaryWordLengthMode === "less" && word.word.length > Number(secondaryWordLetters)) return false;
          return !secondaryWordLetters || secondaryWordLengthMode !== "more" || word.word.length >= Number(secondaryWordLetters);
        });
        if (!candidates.length) throw new Error("No word found");
        const alternatives = candidates.filter((word) => word.word !== secondaryResult.word);
        const pool = alternatives.length ? alternatives : candidates;
        const next = pool[Math.floor(Math.random() * pool.length)];
        if (controller.signal.aborted || secondaryRequestRef.current !== controller) return;
        setSecondaryResult(next);
        if (!splitView) commitWord(next);
      } else {
        const response = await fetch(`/api/word?${params}`, { signal: controller.signal });
        applyApiHealth(response, setApiHealth);
        if (!response.ok) throw new Error("No word found");
        const next = await response.json() as WordResult;
        if (controller.signal.aborted || secondaryRequestRef.current !== controller) return;
        setSecondaryResult(next);
        if (!splitView) commitWord(next);
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError" && secondaryRequestRef.current === controller) {
        if (isFetchFailure(error)) applyApiHealth(null, setApiHealth);
        setSecondaryResult({ word: "", definition: "No word matches these settings.", partOfSpeech: "word" });
      }
    } finally {
      if (secondaryRequestRef.current === controller) setSecondaryLoading(false);
    }
  }, [commitWord, secondaryResult.word, secondaryWordEndsWith, secondaryWordLengthMode, secondaryWordLetters, secondaryWordRelatedTo, secondaryWordStartsWith, secondaryWordSyllableMode, secondaryWordSyllables, secondaryWordType, splitView]);

  const setExplicitSplitWord = useCallback(async (side: "left" | "right", draft: string) => {
    const word = draft.trim();
    const currentWord = side === "left" ? result.word : secondaryResult.word;
    if (!word) {
      if (side === "left") setLeftWordDraft("");
      else setRightWordDraft("");
      return;
    }
    if (word.toLowerCase() === currentWord.toLowerCase()) {
      if (side === "left") setLeftWordDraft(word);
      else setRightWordDraft(word);
      return;
    }

    const requestStore = side === "left" ? requestRef : secondaryRequestRef;
    requestStore.current?.abort();
    const controller = new AbortController();
    requestStore.current = controller;
    if (side === "left") setLoading(true);
    else setSecondaryLoading(true);

    let nextWord: WordResult = {
      word,
      definition: "A custom word.",
      partOfSpeech: "word",
    };

    try {
      const response = await fetch(`/api/word?lookup=${encodeURIComponent(word)}`, { signal: controller.signal });
      applyApiHealth(response, setApiHealth);
      if (response.ok) nextWord = await response.json() as WordResult;
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      if (isFetchFailure(error)) applyApiHealth(null, setApiHealth);
    } finally {
      if (requestStore.current === controller) {
        if (side === "left") setLoading(false);
        else setSecondaryLoading(false);
      }
    }

    if (controller.signal.aborted) return;
    if (side === "left") {
      commitWord(nextWord);
      setLeftWordDraft(word);
    } else {
      setSecondaryResult(nextWord);
      setRightWordDraft(word);
      if (!splitView) commitWord(nextWord);
    }
  }, [commitWord, result.word, secondaryResult.word, splitView]);

  const generateVisibleWords = useCallback((requestedType: PartOfSpeech = wordType) => {
    if (!splitView) {
      if (!rightWordDraft.trim()) void findSecondaryWord();
      return;
    }

    const requests: Promise<void>[] = [];
    if (!leftWordDraft.trim()) requests.push(findWord(undefined, requestedType));
    if (!rightWordDraft.trim()) requests.push(findSecondaryWord());
    if (!requests.length) return;

    const batchRequest = splitBatchRequestRef.current + 1;
    splitBatchRequestRef.current = batchRequest;
    if (requests.length > 1) setSplitBatchLoading(true);
    splitHistoryBatchDepthRef.current += 1;
    void Promise.all(requests).finally(() => {
      if (splitBatchRequestRef.current === batchRequest) setSplitBatchLoading(false);
      splitHistoryBatchDepthRef.current = Math.max(0, splitHistoryBatchDepthRef.current - 1);
      if (splitHistoryBatchDepthRef.current === 0) {
        setSplitHistoryRevision((revision) => revision + 1);
      }
    });
  }, [findSecondaryWord, findWord, leftWordDraft, rightWordDraft, splitView, wordType]);

  const moveThroughSplitHistory = useCallback((direction: -1 | 1) => {
    const nextIndex = splitHistoryIndexRef.current + direction;
    const entry = splitHistoryRef.current[nextIndex];
    if (!entry) return;
    splitHistoryIndexRef.current = nextIndex;
    setLeftWordDraft("");
    setRightWordDraft("");
    setResult(entry.left);
    setSecondaryResult(entry.right);
    setMessage("");
  }, []);

  useLayoutEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const splitFromUrl = parseViewModeParam(window.location.search);
    if (splitFromUrl !== null) setSplitView(splitFromUrl);

    const left = parseSideSettings(search, "l");
    if (left.text !== undefined) setLeftWordDraft(left.text);
    if (left.related !== undefined) setWordRelatedTo(left.related);
    if (left.pos !== undefined) setWordType(left.pos);
    if (left.syllables !== undefined) setWordSyllables(left.syllables);
    if (left.syllableMode !== undefined) setWordSyllableMode(left.syllableMode);
    if (left.startsWith !== undefined) setWordStartsWith(left.startsWith);
    if (left.endsWith !== undefined) setWordEndsWith(left.endsWith);
    if (left.letters !== undefined) setWordLetters(left.letters);
    if (left.lengthMode !== undefined) setWordLengthMode(left.lengthMode);

    const right = parseSideSettings(search, "r");
    if (right.text !== undefined) setRightWordDraft(right.text);
    if (right.related !== undefined) setSecondaryWordRelatedTo(right.related);
    if (right.pos !== undefined) setSecondaryWordType(right.pos);
    if (right.syllables !== undefined) setSecondaryWordSyllables(right.syllables);
    if (right.syllableMode !== undefined) setSecondaryWordSyllableMode(right.syllableMode);
    if (right.startsWith !== undefined) setSecondaryWordStartsWith(right.startsWith);
    if (right.endsWith !== undefined) setSecondaryWordEndsWith(right.endsWith);
    if (right.letters !== undefined) setSecondaryWordLetters(right.letters);
    if (right.lengthMode !== undefined) setSecondaryWordLengthMode(right.lengthMode);

    settingsUrlSyncedRef.current = true;
  }, []);

  useEffect(() => {
    if (!settingsUrlSyncedRef.current) return;
    syncDiscoverUrlParams(splitView, {
      text: leftWordDraft,
      related: wordRelatedTo,
      pos: wordType,
      syllables: wordSyllables,
      syllableMode: wordSyllableMode,
      startsWith: wordStartsWith,
      endsWith: wordEndsWith,
      letters: wordLetters,
      lengthMode: wordLengthMode,
    }, {
      text: rightWordDraft,
      related: secondaryWordRelatedTo,
      pos: secondaryWordType,
      syllables: secondaryWordSyllables,
      syllableMode: secondaryWordSyllableMode,
      startsWith: secondaryWordStartsWith,
      endsWith: secondaryWordEndsWith,
      letters: secondaryWordLetters,
      lengthMode: secondaryWordLengthMode,
    });
  }, [
    splitView,
    leftWordDraft,
    wordRelatedTo,
    wordType,
    wordSyllables,
    wordSyllableMode,
    wordStartsWith,
    wordEndsWith,
    wordLetters,
    wordLengthMode,
    rightWordDraft,
    secondaryWordRelatedTo,
    secondaryWordType,
    secondaryWordSyllables,
    secondaryWordSyllableMode,
    secondaryWordStartsWith,
    secondaryWordEndsWith,
    secondaryWordLetters,
    secondaryWordLengthMode,
  ]);

  useEffect(() => {
    if (initialWordLoaded.current) return;
    initialWordLoaded.current = true;
    const loadInitialWords = async () => {
      const tasks: Promise<void>[] = [];
      if (leftWordDraft.trim()) tasks.push(setExplicitSplitWord("left", leftWordDraft));
      if (rightWordDraft.trim()) tasks.push(setExplicitSplitWord("right", rightWordDraft));
      if (tasks.length) await Promise.all(tasks);
      generateVisibleWords();
    };
    void loadInitialWords();
  }, [generateVisibleWords, leftWordDraft, rightWordDraft, setExplicitSplitWord]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (focusMode) {
        event.preventDefault();
        if (event.code === "Space") generateVisibleWords();
        else setFocusMode(false);
        return;
      }
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.matches("button, input, select, textarea")) return;

      if (event.key.toLowerCase() === "f" && appMode === "discover") {
        event.preventDefault();
        setFocusMode((focused) => !focused);
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        if (appMode === "discover") generateVisibleWords();
        if (appMode === "combine") void modeActionsRef.current.runForgePrimary();
        if (appMode === "find") void modeActionsRef.current.runAdvancedSearch();
        return;
      }

      if (event.key === "ArrowLeft") {
        if (!splitView && appMode !== "combine") return;
        event.preventDefault();
        if (splitView) void findWord();
        else modeActionsRef.current.moveThroughForgeHistory(-1);
        return;
      }

      if (event.key === "ArrowRight") {
        if (!splitView && appMode !== "combine") return;
        event.preventDefault();
        if (splitView) void findSecondaryWord();
        else modeActionsRef.current.moveThroughForgeHistory(1);
        return;
      }

      if (event.key === "ArrowUp" && appMode === "discover") {
        event.preventDefault();
        if (splitView) moveThroughSplitHistory(-1);
        else moveThroughHistory(-1);
        return;
      }

      if (event.key === "ArrowDown" && appMode === "discover") {
        event.preventDefault();
        if (splitView) moveThroughSplitHistory(1);
        else moveThroughHistory(1);
        return;
      }

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (appMode === "discover") {
          if (splitView) toggleCombinedSaved();
          else toggleSaved();
        }
        if (appMode === "combine") modeActionsRef.current.toggleForgedSaved();
        return;
      }

      const relation = appMode === "discover" ? relations.find((item) => item.key === event.key.toLowerCase()) : undefined;
      if (relation) void findWord(relation);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [appMode, findSecondaryWord, findWord, focusMode, generateVisibleWords, moveThroughHistory, moveThroughSplitHistory, selectAppMode, splitView, toggleCombinedSaved, toggleSaved]);

  const forgeWords = forgeSlots.map((slot) => slot.candidates[slot.index]);
  const forgedWord = forgeWords.every(Boolean)
    ? forgeWords.map((word) => word!.word.replace(/\s+/g, "").toLowerCase()).join("")
    : "";
  const forgeLetterCounts = forgeWords.map((word) => word?.word.replace(/[^a-z]/gi, "").length ?? 0);
  const forgeSyllableCount = forgeWords.every((word) => word?.syllables)
    ? forgeWords.reduce((total, word) => total + word!.syllables!, 0)
    : null;
  const forgeLetterLimitsMet = forgeWords.every((word, slotIndex) => !word || fitsForgeSlotConstraints(word, slotIndex));
  const forgeSyllablesMet = !Number(forgeSyllables) || forgeSyllableCount === Number(forgeSyllables);
  const forgeTotalLettersMet = !Number(forgeTotalLetters)
    || forgeLetterCounts.reduce((total, count) => total + count, 0) === Number(forgeTotalLetters);
  const forgeSourcesReady = Boolean(forgedWord);
  const forgeReady = forgeSourcesReady
    && forgeLetterLimitsMet
    && forgeSyllablesMet
    && forgeTotalLettersMet;
  const forgedIsSaved = Boolean(forgedWord) && savedWords.some((saved) => saved.word.toLowerCase() === forgedWord);

  useEffect(() => {
    if (!splitView || splitHistoryBatchDepthRef.current > 0 || !result.word || !secondaryResult.word) return;
    const current = splitHistoryRef.current[splitHistoryIndexRef.current];
    const entry = { left: result, right: secondaryResult };
    if (current?.left.word === result.word && current?.right.word === secondaryResult.word) {
      splitHistoryRef.current[splitHistoryIndexRef.current] = entry;
      return;
    }
    const branch = splitHistoryRef.current.slice(0, splitHistoryIndexRef.current + 1);
    splitHistoryRef.current = [...branch, entry].slice(-100);
    splitHistoryIndexRef.current = splitHistoryRef.current.length - 1;
  }, [result, secondaryResult, splitHistoryRevision, splitView]);

  useEffect(() => {
    if (!forgedWord || !forgeWords[0] || !forgeWords[1]) return;
    const current = forgeHistoryRef.current[forgeHistoryIndexRef.current];
    const entry: ForgeHistoryEntry = {
      combined: forgedWord,
      slots: [0, 1].map((slotIndex) => ({
        seed: forgeSlots[slotIndex].seed,
        maxLetters: forgeSlots[slotIndex].maxLetters,
        letters: forgeSlots[slotIndex].letters,
        syllables: forgeSlots[slotIndex].syllables,
        pinned: forgeSlots[slotIndex].pinned,
        word: forgeWords[slotIndex]!,
      })) as ForgeHistoryEntry["slots"],
    };
    if (current?.combined === forgedWord) {
      forgeHistoryRef.current[forgeHistoryIndexRef.current] = entry;
      return;
    }
    const branch = forgeHistoryRef.current.slice(0, forgeHistoryIndexRef.current + 1);
    forgeHistoryRef.current = [...branch, entry].slice(-100);
    forgeHistoryIndexRef.current = forgeHistoryRef.current.length - 1;
  }, [forgedWord, forgeSlots, forgeWords]);

  const primaryFiltersApplied = Boolean(
    wordRelatedTo.trim()
    || wordType !== "any"
    || wordSyllables
    || wordStartsWith
    || wordEndsWith
    || wordLetters
  );
  const leftSettingsApplied = Boolean(leftWordDraft.trim()) || primaryFiltersApplied;
  const rightSettingsApplied = Boolean(
    rightWordDraft.trim()
    || secondaryWordRelatedTo.trim()
    || secondaryWordType !== "any"
    || secondaryWordSyllables
    || secondaryWordStartsWith
    || secondaryWordEndsWith
    || secondaryWordLetters
  );

  const changeViewMode = useCallback((nextSplit: boolean) => {
    if (nextSplit === splitView) return;
    window.cancelAnimationFrame(splitEntryRequestFrameRef.current);
    const movingSelectors = ["[data-view-transition-word]", "[data-view-transition-card]"];
    const previousPositions = new Map(
      movingSelectors.map((selector) => [selector, document.querySelector<HTMLElement>(selector)?.getBoundingClientRect()]),
    );
    const updateLayout = () => {
      requestRef.current?.abort();
      requestRef.current = null;
      secondaryRequestRef.current?.abort();
      secondaryRequestRef.current = null;
      setLoading(false);
      setSecondaryLoading(false);
      splitBatchRequestRef.current += 1;
      setSplitBatchLoading(false);

      if (nextSplit) {
        setLeftWordDraft("");
        setSecondaryResult(result);
        setResult({ word: "", definition: "", partOfSpeech: "" });
        setSplitView(true);
      } else {
        if (secondaryResult.word) commitWord(secondaryResult);
        setLeftWordDraft("");
        setSplitView(false);
      }
    };
    flushSync(updateLayout);

    // On entry, the existing word becomes the right-hand word. Animating that
    // element from its single-view position makes it pass through the empty
    // left slot, which looks like stale left-hand content. Keep the positional
    // animation only when returning to single view.
    if (!nextSplit && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      movingSelectors.forEach((selector) => {
        const previousPosition = previousPositions.get(selector);
        const element = document.querySelector<HTMLElement>(selector);
        if (!previousPosition || !element) return;

        const nextPosition = element.getBoundingClientRect();
        const offsetX = previousPosition.left - nextPosition.left;
        if (Math.abs(offsetX) < 1) return;
        element.animate(
          [{ transform: `translateX(${offsetX}px)` }, { transform: "translateX(0)" }],
          { duration: 420, easing: "cubic-bezier(.22, 1, .36, 1)" },
        );
      });
    }

    if (nextSplit) {
      splitEntryRequestFrameRef.current = window.requestAnimationFrame(() => void findWord(undefined, wordType, false));
    }
  }, [commitWord, findWord, result, secondaryResult, splitView, wordType]);

  return (
    <main
      className={focusMode ? "page-shell focus-mode" : "page-shell"}
      onPointerDown={() => {
        if (focusMode) setFocusMode(false);
      }}
    >
      <header className="site-header">
        <div className="header-brand">
          <a className="wordmark" href="#top" aria-label="Lexicon home">
            <span className="logo-tile" aria-hidden="true">
              <span className="logo-cursor-shadow" />
              <span className="logo-cursor" />
            </span>
            <span className="wordmark-name" style={{ fontFamily: cardo.style.fontFamily }}>Lexical.</span>
          </a>
          <ApiHealthStatus health={apiHealth} />
        </div>
        <ViewModeToggle splitView={splitView} onChange={changeViewMode} />
        <div className="brand-group" ref={savedMenuRef}>
          {appMode === "discover" ? (
            <button
              className="focus-toggle"
              type="button"
              aria-pressed={focusMode}
              title="Focus mode (F). Press Escape to exit."
              onClick={() => {
                setSavedOpen(false);
                setFocusMode(true);
              }}
            >
              <Focus size={13} strokeWidth={1.5} aria-hidden="true" />
              Focus
            </button>
          ) : null}
          <button
            className={savedOpen ? "saved-toggle active" : "saved-toggle"}
            type="button"
            aria-expanded={savedOpen}
            aria-controls="saved-words"
            onClick={() => setSavedOpen((open) => !open)}
          >
            Saved <span>{savedWords.length}</span>
          </button>
          {savedOpen ? (
            <div className="saved-panel" id="saved-words">
              <p className="saved-heading">Saved words</p>
              {savedWords.length ? (
                <ul>
                  {savedWords.map((saved) => (
                    <li key={saved.word.toLowerCase()}>
                      <button
                        className="saved-word"
                        type="button"
                        onClick={() => void loadSavedWord(saved)}
                      >
                        <span style={{ fontFamily: cardo.style.fontFamily }}>{saved.word}</span>
                        <small>{saved.partOfSpeech}</small>
                      </button>
                      <button
                        className="remove-saved"
                        type="button"
                        aria-label={`Remove ${saved.word}`}
                        onClick={() => saveWords(savedWords.filter((item) => item.word !== saved.word))}
                      >
                        <X size={13} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="saved-empty">Words you like will appear here.</p>
              )}
            </div>
          ) : null}
        </div>

        <form
          className="advanced-host"
          onSubmit={(event) => {
            event.preventDefault();
            if (advancedTool === "search") {
              void runAdvancedSearch();
            } else {
              const slotIndex = forgeSlots.findIndex((slot) => !slot.candidates.length);
              if (slotIndex >= 0) void findForgeWords(slotIndex);
            }
          }}
        >
          {advancedOpen ? (
            <div className="advanced-panel" id="advanced-search">
              <div className="advanced-heading">
                <div>
                  <p>Word tools</p>
                  <span>Find existing words or make a new one</span>
                </div>
                <button type="button" aria-label="Close advanced search" onClick={() => setAdvancedOpen(false)}>
                  <X size={14} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>

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
                      <p>{advancedModes.find((mode) => mode.value === advancedMode)?.label}</p>
                      <span>{advancedModes.find((mode) => mode.value === advancedMode)?.description}</span>
                      <small>{advancedModes.find((mode) => mode.value === advancedMode)?.example}</small>
                    </div>

                    {advancedMode !== "pattern" ? (
                      <label className="advanced-field">
                        <span>{advancedModes.find((mode) => mode.value === advancedMode)?.fieldLabel}</span>
                        <input
                          value={advancedQuery}
                          placeholder={advancedModes.find((mode) => mode.value === advancedMode)?.placeholder}
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
            </div>
          ) : null}
        </form>
      </header>

      {appMode === "discover" && !splitView ? (
        <aside className="split-settings-panel right rounded-3xl" aria-label="Right word settings">
          <div className="settings-panel-header">
            <p>Right word</p>
            <button
              className={rightSettingsApplied ? undefined : "settings-reset-placeholder"}
              type="button"
              aria-hidden={!rightSettingsApplied}
              tabIndex={rightSettingsApplied ? undefined : -1}
              onClick={resetSecondarySettings}
            >
              <RefreshCw size={12} strokeWidth={1.5} aria-hidden="true" />
              Reset
            </button>
          </div>
          <div className="settings-group">
            <label className="split-setting-field boxed-setting-field">
              <span>Text</span>
              <input
                value={rightWordDraft}
                placeholder="Optional fixed text"
                maxLength={40}
                onChange={(event) => setRightWordDraft(event.target.value)}
                onBlur={() => void setExplicitSplitWord("right", rightWordDraft)}
                onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
              />
            </label>
          </div>
          <fieldset className="settings-filter-set" disabled={Boolean(rightWordDraft.trim())}>
            <div className="settings-group">
              <RelatedToSetting id="single-right-related" value={secondaryWordRelatedTo} onChange={setSecondaryWordRelatedTo} />
            </div>
            <div className="settings-group">
              <WordTypeTabs className="split-side-types" value={secondaryWordType} label="Right word type" onChange={setSecondaryWordType} />
            </div>
            <div className="settings-group">
              <CounterSetting label="Syllables" value={secondaryWordSyllables} max={8} onChange={setSecondaryWordSyllables} />
              <LengthModeToggle value={secondaryWordSyllableMode} label="Syllable count comparison" disabled={!secondaryWordSyllables} onChange={setSecondaryWordSyllableMode} />
            </div>
            <div className="settings-group">
              <AffixSetting kind="starts" value={secondaryWordStartsWith} onChange={setSecondaryWordStartsWith} />
              <AffixSetting kind="ends" value={secondaryWordEndsWith} onChange={setSecondaryWordEndsWith} />
              <WordLengthSetting value={secondaryWordLetters} mode={secondaryWordLengthMode} onValueChange={setSecondaryWordLetters} onModeChange={setSecondaryWordLengthMode} />
            </div>
            <div className="settings-group settings-actions">
              <button className="split-generate-button" type="button" onClick={() => void findSecondaryWord()}>Generate right</button>
            </div>
          </fieldset>
        </aside>
      ) : null}

      {appMode === "discover" && !splitView ? <section className={loading || secondaryLoading ? "word-stage loading" : "word-stage"} id="top" aria-live="polite">
        {result.word ? (
          <div className="word-anchor split-word-anchor single-word-anchor">
            <div className="single-content-column">
              <h1 className="copyable-word-wrap single-copyable-word-wrap">
                <WordCopyHint status={wordCopyStatus} />
                <button
                  className={`single-main-word copyable-word ${cardo.className}`}
                  type="button"
                  aria-label={`Copy ${result.word}`}
                  onClick={() => void copyDisplayedWord(result.word)}
                  onPointerEnter={() => {
                    if (wordCopyStatus === "hidden") setWordCopyStatus("idle");
                  }}
                >
                  <span data-view-transition-word>{result.word}</span>
                </button>
              </h1>
              <div className="single-details-row">
                <article className="single-word-article" data-view-transition-card>
                  <p className="split-eyebrow">
                    {result.partOfSpeech || "word"}
                    {displayedPronunciation ? <><span>·</span><span className="pronunciation-inline">{displayedPronunciation}</span></> : null}
                  </p>
                  <div className="rule" aria-hidden="true" />
                  <SplitDescription key={result.word}>
                    {result.definition}
                  </SplitDescription>
                  {message ? <p className="status">{message}</p> : null}
                </article>
              </div>
            </div>
          </div>
        ) : null}
      </section> : null}

      {appMode === "discover" && splitView ? (
        <section className="split-word-stage" aria-live="polite">
          <aside className="split-settings-panel left rounded-3xl" aria-label="Left word settings">
            <div className="settings-panel-header">
              <p>Left word</p>
              <button
                className={leftSettingsApplied ? undefined : "settings-reset-placeholder"}
                type="button"
                aria-hidden={!leftSettingsApplied}
                tabIndex={leftSettingsApplied ? undefined : -1}
                onClick={resetPrimarySettings}
              >
                <RefreshCw size={12} strokeWidth={1.5} aria-hidden="true" />
                Reset
              </button>
            </div>
            <div className="settings-group">
              <label className="split-setting-field boxed-setting-field">
                <span>Text</span>
                <input
                  value={leftWordDraft}
                  placeholder="Optional fixed text"
                  maxLength={40}
                  onChange={(event) => setLeftWordDraft(event.target.value)}
                  onBlur={() => void setExplicitSplitWord("left", leftWordDraft)}
                  onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                />
              </label>
            </div>
            <fieldset className="settings-filter-set" disabled={Boolean(leftWordDraft.trim())}>
              <div className="settings-group">
                <RelatedToSetting id="split-left-related" value={wordRelatedTo} onChange={setWordRelatedTo} />
              </div>
              <div className="settings-group">
                <WordTypeTabs className="split-side-types" value={wordType} label="Left word type" onChange={setWordType} />
              </div>
              <div className="settings-group">
                <CounterSetting label="Syllables" value={wordSyllables} max={8} onChange={setWordSyllables} />
                <LengthModeToggle value={wordSyllableMode} label="Syllable count comparison" disabled={!wordSyllables} onChange={setWordSyllableMode} />
              </div>
              <div className="settings-group">
                <AffixSetting kind="starts" value={wordStartsWith} onChange={setWordStartsWith} />
                <AffixSetting kind="ends" value={wordEndsWith} onChange={setWordEndsWith} />
                <WordLengthSetting value={wordLetters} mode={wordLengthMode} onValueChange={setWordLetters} onModeChange={setWordLengthMode} />
              </div>
              <div className="settings-group settings-actions">
                <button className="split-generate-button" type="button" onClick={() => void findWord()}>Generate left</button>
              </div>
            </fieldset>
          </aside>

          <div className="split-word-anchor">
            <div className="copyable-word-wrap split-copyable-word-wrap">
              <WordCopyHint status={wordCopyStatus} />
              <button
                className={`split-combined-word copyable-word ${cardo.className}`}
                type="button"
                disabled={!leftWordValue || !rightWordValue}
                aria-label={`Copy ${leftWordValue}${rightWordValue}`}
                onClick={() => void copyDisplayedWord(`${leftWordValue}${rightWordValue}`)}
                onPointerEnter={() => {
                  if (wordCopyStatus === "hidden") setWordCopyStatus("idle");
                }}
              >
                <span className={`split-word-part${(loading || splitBatchLoading) && leftWordValue ? " loading" : ""}`} key={`left-${leftWordValue}`}>{leftWordValue}</span>
                <span className={`split-word-part${(secondaryLoading || splitBatchLoading) && rightWordValue ? " loading" : ""}`} data-view-transition-word key={`right-${rightWordValue}`}>{rightWordValue || "——"}</span>
              </button>
            </div>
            <div className="split-definitions">
              {[{ word: result, pronunciation: displayedPronunciation }, { word: secondaryResult, pronunciation: secondaryPronunciation }].map((item, index) => (
                <article
                  className={item.word.word && (splitBatchLoading || (index === 0 ? loading : secondaryLoading)) ? "loading" : ""}
                  data-view-transition-card={index === 1 ? "" : undefined}
                  key={index}
                >
                  {item.word.word ? <div className="split-word-details" key={`${index}-${item.word.word}`}>
                    <h2 className={`split-source-word ${cardo.className}`}>{item.word.word || "——"}</h2>
                    <p className="split-eyebrow">
                      {index === 0 && item.pronunciation ? <><span className="pronunciation-inline">{item.pronunciation}</span><span>·</span></> : null}
                      {item.word.partOfSpeech || "word"}
                      {index === 1 && item.pronunciation ? <><span>·</span><span className="pronunciation-inline">{item.pronunciation}</span></> : null}
                    </p>
                    <div className="rule" aria-hidden="true" />
                    <SplitDescription>
                      {item.word.definition || "Generate a word to begin."}
                    </SplitDescription>
                  </div> : null}
                </article>
              ))}
            </div>
          </div>

          <aside className="split-settings-panel right rounded-3xl" aria-label="Right word settings">
            <div className="settings-panel-header">
              <p>Right word</p>
              <button
                className={rightSettingsApplied ? undefined : "settings-reset-placeholder"}
                type="button"
                aria-hidden={!rightSettingsApplied}
                tabIndex={rightSettingsApplied ? undefined : -1}
                onClick={resetSecondarySettings}
              >
                <RefreshCw size={12} strokeWidth={1.5} aria-hidden="true" />
                Reset
              </button>
            </div>
            <div className="settings-group">
              <label className="split-setting-field boxed-setting-field">
                <span>Text</span>
                <input
                  value={rightWordDraft}
                  placeholder="Optional fixed text"
                  maxLength={40}
                  onChange={(event) => setRightWordDraft(event.target.value)}
                  onBlur={() => void setExplicitSplitWord("right", rightWordDraft)}
                  onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                />
              </label>
            </div>
            <fieldset className="settings-filter-set" disabled={Boolean(rightWordDraft.trim())}>
              <div className="settings-group">
                <RelatedToSetting id="split-right-related" value={secondaryWordRelatedTo} onChange={setSecondaryWordRelatedTo} />
              </div>
              <div className="settings-group">
                <WordTypeTabs className="split-side-types" value={secondaryWordType} label="Right word type" onChange={setSecondaryWordType} />
              </div>
              <div className="settings-group">
                <CounterSetting label="Syllables" value={secondaryWordSyllables} max={8} onChange={setSecondaryWordSyllables} />
                <LengthModeToggle value={secondaryWordSyllableMode} label="Syllable count comparison" disabled={!secondaryWordSyllables} onChange={setSecondaryWordSyllableMode} />
              </div>
              <div className="settings-group">
                <AffixSetting kind="starts" value={secondaryWordStartsWith} onChange={setSecondaryWordStartsWith} />
                <AffixSetting kind="ends" value={secondaryWordEndsWith} onChange={setSecondaryWordEndsWith} />
                <WordLengthSetting value={secondaryWordLetters} mode={secondaryWordLengthMode} onValueChange={setSecondaryWordLetters} onModeChange={setSecondaryWordLengthMode} />
              </div>
              <div className="settings-group settings-actions">
                <button className="split-generate-button" type="button" onClick={() => void findSecondaryWord()}>Generate right</button>
              </div>
            </fieldset>
          </aside>
        </section>
      ) : null}

      <footer className="controls">
        {appMode === "discover" ? <div className="shortcut-row" aria-label="Word exploration shortcuts">
          <button className="space-button" type="button" onClick={() => generateVisibleWords()}>
            <kbd>space</kbd>
            <span>Generate</span>
          </button>
          <button type="button" onClick={() => setFocusMode(true)}>
            <kbd>F</kbd>
            <span>Focus</span>
          </button>
          {splitView ? (
            <>
              <button type="button" onClick={() => void findWord()}>
                <kbd><ArrowLeft size={13} strokeWidth={1.5} aria-hidden="true" /></kbd>
                <span>Left</span>
              </button>
              <button type="button" onClick={() => void findSecondaryWord()}>
                <kbd><ArrowRight size={13} strokeWidth={1.5} aria-hidden="true" /></kbd>
                <span>Right</span>
              </button>
              <button
                className={combinedSplitIsSaved ? "save-legend liked" : "save-legend"}
                type="button"
                disabled={!combinedSplitWord}
                aria-pressed={combinedSplitIsSaved}
                onClick={toggleCombinedSaved}
              >
                <kbd>S</kbd>
                <span>Save</span>
              </button>
              <span className="history-shortcut" aria-label="Use up and down arrow keys to browse pair history">
                <kbd><ArrowUp size={13} strokeWidth={1.5} aria-hidden="true" /></kbd>
                <kbd><ArrowDown size={13} strokeWidth={1.5} aria-hidden="true" /></kbd>
                <span>History</span>
              </span>
            </>
          ) : (
            <>
              <button
                className={isSaved ? "save-legend liked" : "save-legend"}
                type="button"
                aria-pressed={isSaved}
                onClick={toggleSaved}
              >
                <kbd>S</kbd>
                <span>Save</span>
              </button>
              <span className="history-shortcut" aria-label="Use up and down arrow keys to browse word history">
                <kbd><ArrowUp size={13} strokeWidth={1.5} aria-hidden="true" /></kbd>
                <kbd><ArrowDown size={13} strokeWidth={1.5} aria-hidden="true" /></kbd>
                <span>History</span>
              </span>
            </>
          )}
        </div> : null}
        {appMode === "combine" ? <div className="shortcut-row" aria-label="Word combination shortcuts">
          <button className="space-button" type="button" onClick={() => void runForgePrimary()}>
            <kbd>space</kbd>
            <span>{forgeSourcesReady ? "Remix" : "Generate"}</span>
          </button>
          <span className="history-shortcut" aria-label="Use left and right arrow keys to browse combination history">
            <kbd><ArrowLeft size={13} strokeWidth={1.5} aria-hidden="true" /></kbd>
            <kbd><ArrowRight size={13} strokeWidth={1.5} aria-hidden="true" /></kbd>
            <span>History</span>
          </span>
          <button
            className={forgedIsSaved ? "save-legend liked" : "save-legend"}
            type="button"
            disabled={!forgeReady}
            aria-pressed={forgedIsSaved}
            onClick={toggleForgedSaved}
          >
            <kbd>S</kbd>
            <span>{forgedIsSaved ? "Saved" : "Save word"}</span>
          </button>
        </div> : null}
        {appMode === "find" ? <div className="shortcut-row" aria-label="Word search shortcuts">
          <button className="space-button" type="button" onClick={() => void runAdvancedSearch()}>
            <kbd>space</kbd>
            <span>Find words</span>
          </button>
        </div> : null}
      </footer>
    </main>
  );
}
