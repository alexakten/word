"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { Drawer } from "vaul";
import { WordmarkLink } from "./wordmark-link";

export function AboutDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
      <button
        className="about-drawer-trigger"
        type="button"
        aria-label="About Spellsurf"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
      >
        <Info size={15} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <Drawer.Portal>
        <Drawer.Overlay className="about-drawer-overlay" />
        <Drawer.Content className="about-drawer-content">
          <button
            className="about-drawer-close"
            type="button"
            aria-label="Close about"
            onClick={() => setOpen(false)}
          >
            <X size={14} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <div className="about-drawer-inner">
            <Drawer.Handle className="about-drawer-handle" />
            <Drawer.Title asChild>
              <div className="about-drawer-brand">
                <WordmarkLink />
              </div>
            </Drawer.Title>
            <Drawer.Description className="about-drawer-lead">
              Discover and create new words by blending two random words.{" "}
              Powered by the{" "}
              <a href="https://www.datamuse.com/api/" target="_blank" rel="noopener noreferrer">
                Datamuse API
              </a>
              .
            </Drawer.Description>

            <div className="about-drawer-body">
              <section>
                <h3>How it works</h3>
                <p>
                  Each result is a combination of a left word and a right word. Spellsurf picks pieces of both and joins them into a new coinage, with the original meanings and pronunciations underneath.
                </p>
              </section>
              <section>
                <h3>Left &amp; right word</h3>
                <p>
                  Open the side panels to pin a fixed word, or filter by type, related meaning, syllables, prefixes, suffixes, and length. Clearer filters, clearer blends.
                </p>
              </section>
              <section>
                <h3>Slice</h3>
                <p>
                  Slice controls how much of each source word is kept — full, shortened, or a custom syllable cut — so you can tune how soft or sharp the combine feels.
                </p>
              </section>
              <section>
                <h3>Generate</h3>
                <p>
                  Tap Generate (or press space on desktop) for a fresh pair. Save favorites, reset filters anytime, and keep exploring until something clicks.
                </p>
              </section>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
