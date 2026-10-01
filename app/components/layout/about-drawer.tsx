"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Info, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import useMeasure from "react-use-measure";
import { Drawer } from "vaul";

const TOUR_STEPS = [
  {
    title: "About Spellsurf",
    description:
      "Spellsurf combines two words to create a unique new combination for a brand, side project, product, or anything else that needs a name.",
    details: [
      "spell + surf → spellsurf",
      "Use Generate to find new words",
      "Use Shuffle to mix up the current combination",
      "Use ← and → to generate one side",
    ],
  },
  {
    title: "Adjust each side.",
    description:
      "Open Left or Right to set rules for each side independently, giving you more control over the source words Spellsurf uses to create each new combination.",
    details: [
      "Set syllables or length",
      "Add related words to define themes",
      "Add a prefix or suffix—either a single letter or longer word part",
    ],
  },
  {
    title: "Control the slice.",
    description:
      "Choose how the two words are sliced before they are joined together.",
    details: [
      "No slicing keeps both words whole",
      "Random chooses the slices for you",
      "Custom lets you choose each slice",
    ],
  },
  {
    title: "Check availability.",
    description:
      "Toggle between Brand, Domain, and Handle to check each kind of availability.",
    details: [
      "Domain checks web addresses",
      "Handle checks social handles",
    ],
  },
  {
    title: "Mock it up.",
    description:
      "Preview a name as a wordmark or pair it with a logo. Cycle through different fonts and logos to try different styles.",
    details: [
      "Try different font styles",
      "Pair with a mockup logo",
    ],
  },
] as const;

export function AboutDrawer() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [measureRef, bounds] = useMeasure();
  const previousHeightRef = useRef<number | undefined>(undefined);
  const [opacityDuration, setOpacityDuration] = useState(0.27);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) {
      const reset = window.setTimeout(() => {
        setStep(0);
      }, 220);
      return () => window.clearTimeout(reset);
    }
  }, [open]);

  useEffect(() => {
    const currentHeight = Math.round(bounds.height);
    const previousHeight = previousHeightRef.current;

    if (currentHeight && previousHeight) {
      const heightDifference = Math.abs(currentHeight - previousHeight);
      setOpacityDuration(Math.min(0.27, Math.max(0.15, heightDifference / 500)));
    }

    if (currentHeight) previousHeightRef.current = currentHeight;
  }, [bounds.height]);

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  function goBack() {
    if (step === 0) {
      setOpen(false);
      return;
    }
    setStep((currentStep) => currentStep - 1);
  }

  function goForward() {
    if (isLast) {
      setOpen(false);
      return;
    }
    setStep((currentStep) => currentStep + 1);
  }

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
      <button
        className="about-drawer-trigger"
        type="button"
        aria-label="Learn how Spellsurf works"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
      >
        <Info size={15} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <Drawer.Portal>
        <Drawer.Overlay className="modal-overlay about-drawer-overlay" />
        <Drawer.Content asChild>
          <motion.div
            className="about-drawer-content"
            animate={bounds.height ? { height: bounds.height } : undefined}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.27,
              ease: [0.26, 1, 0.5, 1],
            }}
          >
            <div className="about-drawer-measure" ref={measureRef}>
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  className="about-drawer-inner"
                  key={step}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : opacityDuration,
                    ease: [0.26, 0.08, 0.25, 1],
                  }}
                >
                  <div className="about-tour-header">
                    <Drawer.Title className="about-drawer-title">
                      {current.title}
                    </Drawer.Title>
                    <motion.button
                      className="about-tour-close"
                      type="button"
                      aria-label="Close guide"
                      onClick={() => setOpen(false)}
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
                    >
                      <X size={15} strokeWidth={1.6} aria-hidden="true" />
                    </motion.button>
                  </div>

                  <div className="about-tour-step">
                    <div className="about-tour-copy">
                      <Drawer.Description className="about-drawer-lead">
                        {current.description}
                      </Drawer.Description>
                    </div>
                    <ul className="about-tour-details">
                      {current.details.map((detail) => (
                        <li key={detail}>
                          <CheckCircle2 size={19} strokeWidth={1.7} aria-hidden="true" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="about-tour-footer">
                    <motion.button
                      className="about-tour-back"
                      type="button"
                      onClick={goBack}
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                    >
                      Back
                    </motion.button>
                    <motion.button
                      className="about-tour-continue"
                      type="button"
                      onClick={goForward}
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                    >
                      Continue
                      <ArrowRight size={15} strokeWidth={1.7} aria-hidden="true" />
                    </motion.button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
