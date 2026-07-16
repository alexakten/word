"use client";

export function AffixSettings({ startsWith, endsWith, onStartsChange, onEndsChange }: {
  startsWith: string;
  endsWith: string;
  onStartsChange: (value: string) => void;
  onEndsChange: (value: string) => void;
}) {
  const line = <span className="affix-line" aria-hidden="true" />;

  return (
    <div className="affix-settings-row">
      <label className="affix-setting starts">
        <span>Starts with</span>
        <span className="affix-control">
          <span className="affix-input-shell">
            <input
              value={startsWith}
              aria-label="Starts with"
              placeholder="—"
              maxLength={12}
              onChange={(event) => onStartsChange(event.target.value.replace(/[^a-z]/gi, ""))}
            />
          </span>
          {line}
        </span>
      </label>
      <label className="affix-setting ends">
        <span>Ends with</span>
        <span className="affix-control">
          {line}
          <span className="affix-input-shell">
            <input
              value={endsWith}
              aria-label="Ends with"
              placeholder="—"
              maxLength={12}
              onChange={(event) => onEndsChange(event.target.value.replace(/[^a-z]/gi, ""))}
            />
          </span>
        </span>
      </label>
    </div>
  );
}
