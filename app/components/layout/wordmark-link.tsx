import { cardo } from "../../fonts";

export function WordmarkLink({ className = "" }: { className?: string }) {
  return (
    <a className={["wordmark", className].filter(Boolean).join(" ")} href="#top" aria-label="Lexicon home">
      <span className="logo-tile" aria-hidden="true">
        <span className="logo-cursor-shadow" />
        <span className="logo-cursor" />
      </span>
      <span
        className="wordmark-name"
        style={{ fontFamily: cardo.style.fontFamily, fontSize: "22px", fontWeight: 400 }}
      >
        spellsurf
      </span>
    </a>
  );
}
