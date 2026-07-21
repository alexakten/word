import type { Metadata } from "next";
import Link from "next/link";
import { Countdown } from "./countdown";
import { SignupForm } from "./signup-form";
import styles from "./drops.module.css";

export const metadata: Metadata = {
  title: "Spellsurf Drops — Names worth building on",
  description:
    "A weekly drop of 5 premium domains and 5 premium handles. Every Friday.",
  alternates: { canonical: "/drops" },
  openGraph: {
    title: "Spellsurf Drops",
    description: "5 domains. 5 premium handles. Every Friday.",
    url: "/drops",
  },
  twitter: {
    title: "Spellsurf Drops",
    description: "5 domains. 5 premium handles. Every Friday.",
  },
};

const perks = [
  "5 new premium domains every week",
  "Included social handles (X, IG, TikTok)",
  "Be the first to claim premium names",
];

export default function DropsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.center}>
        <Link className={styles.brand} href="/" aria-label="Spellsurf home">
          spellsurf
        </Link>

        <h1 className={styles.title}>Drops</h1>

        <ul className={styles.perks}>
          {perks.map((perk) => (
            <li key={perk}>
              <span className={styles.check} aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3.5 8.5 6.5 11.5 12.5 4.5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {perk}
            </li>
          ))}
        </ul>

        <SignupForm />
        <Countdown />
      </div>
    </main>
  );
}
