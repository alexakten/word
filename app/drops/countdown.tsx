"use client";

import { useEffect, useState } from "react";
import styles from "./drops.module.css";

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getNextFriday(from: Date): Date {
  const next = new Date(from);
  next.setSeconds(0, 0);
  next.setMinutes(0);
  next.setHours(9);

  const day = next.getDay(); // 0 Sun … 5 Fri
  const daysUntilFriday = (5 - day + 7) % 7;

  if (daysUntilFriday === 0 && from >= next) {
    next.setDate(next.getDate() + 7);
  } else {
    next.setDate(next.getDate() + daysUntilFriday);
  }

  return next;
}

function getRemaining(now: Date): Remaining {
  const target = getNextFriday(now);
  const total = Math.max(0, target.getTime() - now.getTime());
  const seconds = Math.floor(total / 1000);

  return {
    days: Math.floor(seconds / 86_400),
    hours: Math.floor((seconds % 86_400) / 3_600),
    minutes: Math.floor((seconds % 3_600) / 60),
    seconds: seconds % 60,
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function Countdown() {
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(getRemaining(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const parts = remaining
    ? [
      { label: "days", value: pad(remaining.days) },
      { label: "hrs", value: pad(remaining.hours) },
      { label: "min", value: pad(remaining.minutes) },
      { label: "sec", value: pad(remaining.seconds) },
    ]
    : [
      { label: "days", value: "––" },
      { label: "hrs", value: "––" },
      { label: "min", value: "––" },
      { label: "sec", value: "––" },
    ];

  return (
    <div className={styles.countdown} aria-live="polite">
      <p className={styles.countdownLabel}>Sign up to get the next drop</p>
      <div className={styles.countdownGrid}>
        {parts.map((part) => (
          <div key={part.label} className={styles.countdownUnit}>
            <span className={styles.countdownValue}>{part.value}</span>
            <span className={styles.countdownUnitLabel}>{part.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
