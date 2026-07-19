import { hapticsFeedback } from "./haptics";

let audioContext: AudioContext | null = null;
let soundEnabled = true;
let soundPreferenceLoaded = false;

const SOUND_STORAGE_KEY = "spellsurf:sound";
export const SOUND_EVENT = "spellsurf:sound";

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
  return audioContext;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function ensureSoundPreference() {
  if (soundPreferenceLoaded || typeof window === "undefined") return;
  soundPreferenceLoaded = true;
  try {
    const stored = window.localStorage.getItem(SOUND_STORAGE_KEY);
    if (stored === "0") soundEnabled = false;
    else if (stored === "1") soundEnabled = true;
  } catch {
    // Ignore storage failures.
  }
}

export function getSoundEnabled() {
  ensureSoundPreference();
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean) {
  ensureSoundPreference();
  soundEnabled = enabled;
  soundPreferenceLoaded = true;
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // Ignore storage failures.
  }
  window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: enabled }));
}

function canPlay() {
  ensureSoundPreference();
  return soundEnabled && !prefersReducedMotion();
}

function playClick() {
  if (!canPlay()) return;

  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;

    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.008, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 50);
    }
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 4000 + Math.random() * 1000;
    filter.Q.value = 3;

    const gain = ctx.createGain();
    gain.gain.value = 0.5 + Math.random() * 0.15;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
  } catch {
    // AudioContext may be unavailable; fail silently.
  }
}

/** Soft UI toggle — filtered noise click + short sine drop. */
function playToggle() {
  if (!canPlay()) return;

  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;

    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.012, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 80);
    }
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2500;
    filter.Q.value = 4;

    const gain = ctx.createGain();
    gain.gain.value = 0.4;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.03);
    oscGain.gain.setValueAtTime(0.15, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  } catch {
    // AudioContext may be unavailable; fail silently.
  }
}

/** Downward pitch drop — Soft feel. */
function playDrop() {
  if (!canPlay()) return;

  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    const decayMult = 1.5;
    const gainMult = 0.7;
    const pitchMult = 0.8;
    const duration = 0.12 * decayMult;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800 * pitchMult, t);
    osc.frequency.exponentialRampToValueAtTime(300 * pitchMult, t + 0.1 * decayMult);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.35 * gainMult, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  } catch {
    // AudioContext may be unavailable; fail silently.
  }
}

/** Ascending triad — Aero or Minimal feel. */
function playSuccess(feel: "aero" | "minimal" = "aero") {
  if (!canPlay()) return;

  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    const decayMult = feel === "minimal" ? 0.8 : 1;
    const gainMult = feel === "minimal" ? 0.4 : 0.9;
    const notes = [523.25, 659.25, 783.99];
    const spacing = 0.08 * decayMult;
    const duration = 0.15 * decayMult;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;

      const start = t + i * spacing;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25 * gainMult, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    });
  } catch {
    // AudioContext may be unavailable; fail silently.
  }
}

/** Short highpass noise — Minimal feel. */
function playTick() {
  if (!canPlay()) return;

  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    const decayMult = 0.8;
    const gainMult = 0.4;

    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.004 * decayMult, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (20 * decayMult));
    }
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 3000;

    const gain = ctx.createGain();
    gain.gain.value = 0.3 * gainMult;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
  } catch {
    // AudioContext may be unavailable; fail silently.
  }
}

export const sounds = {
  click: () => {
    hapticsFeedback.click();
    playClick();
  },
  toggle: () => {
    hapticsFeedback.toggle();
    playToggle();
  },
  drop: () => {
    hapticsFeedback.drop();
    playDrop();
  },
  success: () => {
    hapticsFeedback.success();
    playSuccess("aero");
  },
  successMinimal: () => {
    hapticsFeedback.successMinimal();
    playSuccess("minimal");
  },
  tick: () => {
    hapticsFeedback.tick();
    playTick();
  },
};
