"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { Drawer } from "vaul";
import { WordmarkLink } from "./wordmark-link";

export function AboutDrawer({ showBrand = false }: { showBrand?: boolean }) {
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
            {showBrand ? (
              <Drawer.Title asChild>
                <div className="about-drawer-brand">
                  <WordmarkLink />
                </div>
              </Drawer.Title>
            ) : (
              <Drawer.Title className="about-drawer-title">About Spellsurf</Drawer.Title>
            )}
            <Drawer.Description className="about-drawer-lead">
              Discover and create new words by combining syllables from existing words.{" "}
              Powered by the{" "}
              <a
                className="about-drawer-link"
                href="https://www.datamuse.com/api/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Datamuse API
              </a>
              .
            </Drawer.Description>

            <div className="about-drawer-body">
              <section>
                <h3>How it works</h3>
                <p>
                  Each result combines a left word and a right word. Parts of both are joined together. Meanings and pronunciations for the source words are shown underneath.
                </p>
              </section>
              <section>
                <h3>Left &amp; right word</h3>
                <p>
                  Use the side panels to set a fixed word, or set rules for the generated words: type, related meaning, syllables, prefixes, suffixes, and length.
                </p>
              </section>
              <section>
                <h3>Slice</h3>
                <p>
                  Slice sets how much of each source word is used: the full word, a shorter portion, or a custom syllable range. You can also randomize the slice.
                </p>
              </section>
              <section>
                <h3>Syllables</h3>
                <p>
                  Syllable splits are generated algorithmically, so they may not always be exact.
                </p>
              </section>
            </div>

            <p className="about-drawer-credit">
              Made by{" "}
              <a
                className="about-drawer-link"
                href="https://autogram.id/alex"
                target="_blank"
                rel="noopener noreferrer"
              >
                Alex
              </a>
            </p>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
