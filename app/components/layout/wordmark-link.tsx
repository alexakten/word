export function WordmarkLink({ className = "" }: { className?: string }) {
  return (
    <a className={["wordmark", className].filter(Boolean).join(" ")} href="#top" aria-label="Lexicon home">
      <span className="logo-tile" aria-hidden="true">
        <span className="logo-cursor-shadow" />
        <span className="logo-cursor" />
      </span>
      <span className="wordmark-name">
        spellsurf
      </span>
    </a>
  );
}
