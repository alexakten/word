"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { getSoundEnabled, setSoundEnabled, SOUND_EVENT, sounds } from "../../lib/sounds";

export function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(getSoundEnabled());

    const onSoundChange = (event: Event) => {
      const next = (event as CustomEvent<boolean>).detail;
      if (typeof next === "boolean") setEnabled(next);
    };
    window.addEventListener(SOUND_EVENT, onSoundChange);
    return () => window.removeEventListener(SOUND_EVENT, onSoundChange);
  }, []);

  return (
    <button
      className="sound-toggle"
      type="button"
      aria-label={enabled ? "Mute sounds" : "Unmute sounds"}
      aria-pressed={enabled}
      onClick={() => {
        const next = !enabled;
        setSoundEnabled(next);
        setEnabled(next);
        if (next) sounds.tick();
      }}
    >
      <span className="sound-toggle-icon" key={enabled ? "on" : "off"}>
        {enabled
          ? <Volume2 size={15} strokeWidth={1.75} aria-hidden="true" />
          : <VolumeX size={15} strokeWidth={1.75} aria-hidden="true" />}
      </span>
    </button>
  );
}
