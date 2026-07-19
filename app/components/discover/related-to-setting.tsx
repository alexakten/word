"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { sounds } from "../../lib/sounds";
import { MAX_TAG_LENGTH, MAX_TAGS, parseTags } from "../../lib/tags";

type TagEntrySettingProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
};

export function TagEntrySetting({
  id,
  value,
  onChange,
  label,
  placeholder = "Add words",
}: TagEntrySettingProps) {
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const relatedFieldRef = useRef<HTMLDivElement | null>(null);
  const settingsPanelHeightRef = useRef<number | null>(null);
  const settingsPanelAnimationRef = useRef<Animation | null>(null);
  const settingsContentPositionsRef = useRef(new Map<HTMLElement, number>());
  const settingsContentAnimationsRef = useRef<Animation[]>([]);
  const tags = useMemo(() => parseTags(value), [value]);

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
    if (!open || query.length < 2 || tags.length >= MAX_TAGS) return;

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
      const tag = entry.trim().slice(0, MAX_TAG_LENGTH);
      const key = tag.toLowerCase();
      if (!tag || seen.has(key) || nextTags.length >= MAX_TAGS) continue;
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
      <label htmlFor={id}>{label}</label>
      <div className="related-tags-control">
        {tags.map((tag, index) => (
          <span className="related-tag" key={`${tag.toLowerCase()}-${index}`}>
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => {
                sounds.click();
                removeTag(index);
              }}
            >
              <X size={12} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          className="related-tags-input"
          id={id}
          role="combobox"
          value={draft}
          placeholder={tags.length ? "" : placeholder}
          maxLength={MAX_TAG_LENGTH}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={`${id}-suggestions`}
          aria-expanded={open && suggestions.length > 0}
          aria-activedescendant={activeSuggestion >= 0 ? `${id}-suggestion-${activeSuggestion}` : undefined}
          disabled={tags.length >= MAX_TAGS}
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
              onClick={() => {
                sounds.click();
                addTags([word]);
              }}
            >
              {word}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function RelatedToSetting(props: Omit<TagEntrySettingProps, "label">) {
  return <TagEntrySetting {...props} label="Related to" />;
}
