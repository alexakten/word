import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "../components/discover/brand-mark";
import type { BrandLogoId } from "../lib/brand-logos";
import { Countdown } from "./countdown";
import { SignupForm } from "./signup-form";
import styles from "./drops.module.css";

export const metadata: Metadata = {
  title: "Spellsurf Drops — Names worth building on",
  description:
    "A weekly drop of 3 premium domains and matching handles. Every Friday.",
  alternates: { canonical: "/drops" },
  openGraph: {
    title: "Spellsurf Drops",
    description: "3 domains. Matching handles. Every Friday.",
    url: "/drops",
  },
  twitter: {
    title: "Spellsurf Drops",
    description: "3 domains. Matching handles. Every Friday.",
  },
};

const perks = [
  "3 premium domains every week",
  "Matching social handles",
  "Claim the best names first",
];

type DropDomain = {
  name: string;
  domain: string;
  handle: string;
  logo: BrandLogoId;
  font: string;
  textColor: string;
  backgroundColor: string;
  status: "available" | "taken";
};

type Drop = {
  number: string;
  date: string;
  domains: DropDomain[];
};

/* Edit past drops here. Every visual property can be set per domain. */
const previousDrops: Drop[] = [
  {
    number: "Drop 003",
    date: "July 24, 2026",
    domains: [
      {
        name: "Lucent",
        domain: "lucent.ai",
        handle: "@lucent",
        logo: "Portal",
        font: "var(--font-instrument-serif)",
        textColor: "#18332e",
        backgroundColor: "#c9f1df",
        status: "available",
      },
      {
        name: "Onda",
        domain: "onda.studio",
        handle: "@onda",
        logo: "Wave",
        font: "var(--font-afacad)",
        textColor: "#fff8e8",
        backgroundColor: "#f0643c",
        status: "taken",
      },
      {
        name: "Kindred",
        domain: "kindred.so",
        handle: "@kindred",
        logo: "Union",
        font: "var(--font-playfair)",
        textColor: "#f0eefe",
        backgroundColor: "#403890",
        status: "available",
      },
    ],
  },
  {
    number: "Drop 002",
    date: "July 17, 2026",
    domains: [
      {
        name: "Fable",
        domain: "fable.work",
        handle: "@fable",
        logo: "Unfold",
        font: "var(--font-serif)",
        textColor: "#30221a",
        backgroundColor: "#f4d8b7",
        status: "taken",
      },
      {
        name: "Nuevo",
        domain: "nuevo.co",
        handle: "@nuevo",
        logo: "Zag",
        font: "var(--font-bebas-neue)",
        textColor: "#102b38",
        backgroundColor: "#87d7e8",
        status: "available",
      },
      {
        name: "Morrow",
        domain: "morrow.design",
        handle: "@morrow",
        logo: "Core",
        font: "var(--font-cal-sans)",
        textColor: "#3c2419",
        backgroundColor: "#e6a552",
        status: "taken",
      },
    ],
  },
  {
    number: "Drop 001",
    date: "July 10, 2026",
    domains: [
      {
        name: "Aster",
        domain: "aster.fm",
        handle: "@aster",
        logo: "Sun",
        font: "var(--font-aboreto)",
        textColor: "#fff5dc",
        backgroundColor: "#1e4f46",
        status: "available",
      },
      {
        name: "Sonder",
        domain: "sonder.one",
        handle: "@sonder",
        logo: "Orbit",
        font: "var(--font-caveat)",
        textColor: "#291b38",
        backgroundColor: "#d7b9ed",
        status: "taken",
      },
      {
        name: "Vela",
        domain: "vela.club",
        handle: "@vela",
        logo: "Wing",
        font: "var(--font-safiro)",
        textColor: "#103758",
        backgroundColor: "#c1e1f3",
        status: "available",
      },
    ],
  },
];

type DomainCardStyle = CSSProperties & {
  "--card-background": string;
  "--card-ink": string;
  "--card-font": string;
};

export default function DropsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.content}>
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

        <section className={styles.archive} aria-labelledby="previous-drops-title">
          <div className={styles.archiveHeading}>
            <p className={styles.eyebrow}>The archive</p>
            <h2 id="previous-drops-title">Previous drops</h2>
          </div>

          <div className={styles.dropList}>
            {previousDrops.map((drop) => (
              <article className={styles.drop} key={drop.number}>
                <header className={styles.dropMeta}>
                  <h3>{drop.number}</h3>
                  <time>{drop.date}</time>
                </header>

                <div className={styles.domainGrid}>
                  {drop.domains.map((domain) => {
                    const cardStyle: DomainCardStyle = {
                      "--card-background": domain.backgroundColor,
                      "--card-ink": domain.textColor,
                      "--card-font": domain.font,
                    };

                    return (
                      <div className={styles.domainCard} style={cardStyle} key={domain.name}>
                        <div className={styles.cardTopline}>
                          <span
                            className={`${styles.status} ${
                              domain.status === "available" ? styles.available : styles.taken
                            }`}
                          >
                            <span className={styles.statusDot} aria-hidden="true" />
                            {domain.status === "available" ? "Available" : "Taken"}
                          </span>
                        </div>

                        <div className={styles.domainIdentity}>
                          <h4>
                            <span className={styles.brandLockup}>
                              <BrandMark logoId={domain.logo} />
                              <span>{domain.name}</span>
                            </span>
                          </h4>
                        </div>

                        <ul className={styles.brandAssets} aria-label={`${domain.name} assets`}>
                          {[
                            domain.domain,
                            `Twitter ${domain.handle}`,
                            `Instagram ${domain.handle}`,
                          ].map((asset) => (
                            <li key={asset}>
                              <span className={styles.assetCheck} aria-hidden="true">
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
                              {asset}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
