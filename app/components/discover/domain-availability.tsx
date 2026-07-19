"use client";

import { track } from "@vercel/analytics";
import { Check, CircleHelp, LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { sounds } from "../../lib/sounds";
import { GoDaddyLogo, NamecheapLogo, PorkbunLogo } from "./registrar-logos";

type AlternativeAvailability = {
  domain: string;
  tld: string;
  status: "available" | "registered" | "unknown";
  priceLabel?: string;
};

type AvailabilityResult = {
  domain: string;
  status: "available" | "registered" | "unknown";
  message?: string;
  priceLabel?: string;
  alternatives?: AlternativeAvailability[];
};

const registrarLinks = [
  {
    name: "GoDaddy",
    href: (domain: string) => `https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(domain)}`,
  },
  {
    name: "Namecheap",
    href: (domain: string) => `https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(domain)}`,
  },
  {
    name: "Porkbun",
    href: (domain: string) => `https://porkbun.com/checkout/search?q=${encodeURIComponent(domain)}`,
  },
] as const;

export function DomainAvailability({ domain, className = "" }: { domain: string; className?: string }) {
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [loadingDomain, setLoadingDomain] = useState("");
  const [shake, setShake] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  const currentResult = result?.domain === domain ? result : null;
  const loading = loadingDomain === domain;
  const alternatives = currentResult?.status === "registered"
    ? currentResult.alternatives ?? []
    : [];
  const hasAlternatives = alternatives.length > 0;
  const hasAvailableAlternatives = alternatives.some((entry) => entry.status === "available");

  const checkAvailability = async () => {
    if (!domain || loading) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoadingDomain(domain);
    setShake(false);

    try {
      const response = await fetch(`/api/domain-availability?domain=${encodeURIComponent(domain)}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const payload = await response.json() as AvailabilityResult & { error?: string };
      if (controller.signal.aborted) return;
      if (!response.ok) {
        setResult({
          domain,
          status: "unknown",
          message: "Cannot find availability",
        });
        return;
      }
      setResult(payload);
      if (payload.status === "available") {
        sounds.success();
      } else if (payload.status === "registered") {
        setShake(true);
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setResult({
          domain,
          status: "unknown",
          message: "Cannot find availability",
        });
      }
    } finally {
      if (requestRef.current === controller) setLoadingDomain("");
    }
  };

  const statusLabel = loading
    ? "Checking availability…"
    : currentResult?.status === "available"
      ? `${domain} available!`
      : currentResult?.status === "registered"
        ? `${domain} is taken`
        : currentResult?.status === "unknown"
          ? "Cannot find availability"
          : "Check availability";
  const showRegistrarLinks = Boolean(currentResult);
  const resultMessage = currentResult?.message
    && currentResult.message !== "Cannot find availability"
    && !currentResult.message.startsWith("No public RDAP service")
    ? currentResult.message
    : undefined;
  const registrarHelperText = currentResult?.status === "available"
    ? currentResult.priceLabel
      ? `About ${currentResult.priceLabel} — confirm and buy on registrar`
      : "Confirm availability and buy on registrar"
    : currentResult?.status === "registered"
      ? hasAvailableAlternatives
        ? "Explore more available domains"
        : "Other TLDs might be available"
      : currentResult?.status === "unknown"
        ? "Try checking on a registrar"
        : "Check availability on registrar";

  const popover = currentResult && (resultMessage || showRegistrarLinks || hasAlternatives) ? (
    <div className="domain-availability-popover">
      {hasAlternatives ? (
        <ul className="domain-alt-tlds" aria-label="Alternate domain availability">
          {alternatives.map((entry) => {
            const isAvailable = entry.status === "available";
            const isUnknown = entry.status === "unknown";
            const className = [
              "domain-alt-tld",
              isAvailable ? "is-available" : isUnknown ? "is-unknown" : "is-taken",
            ].join(" ");
            const icon = (
              <span className="domain-alt-tld-check" aria-hidden="true">
                {isAvailable ? (
                  <Check size={9} strokeWidth={2.6} />
                ) : isUnknown ? (
                  <CircleHelp size={9} strokeWidth={2.4} />
                ) : (
                  <X size={8} strokeWidth={2.6} />
                )}
              </span>
            );
            if (!isAvailable) {
              return (
                <li key={entry.domain}>
                  <span className={className}>
                    {icon}
                    <span>{entry.domain}</span>
                  </span>
                </li>
              );
            }
            return (
              <li key={entry.domain}>
                <a
                  href={registrarLinks[0].href(entry.domain)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                  onClick={() => track("Alternate TLD Clicked", { domain: entry.domain, tld: entry.tld })}
                >
                  {icon}
                  <span>{entry.domain}</span>
                </a>
              </li>
            );
          })}
        </ul>
      ) : null}
      {showRegistrarLinks ? (
        <div className="domain-registrar-links" aria-label={`Search for ${domain} at registrars`}>
          {registrarLinks.map((registrar) => (
            <a
              href={registrar.href(domain)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Search for ${domain} on ${registrar.name}`}
              key={registrar.name}
              onClick={() => track(`${registrar.name} Clicked`, { domain })}
            >
              {registrar.name === "GoDaddy" ? (
                <GoDaddyLogo />
              ) : registrar.name === "Namecheap" ? (
                <NamecheapLogo />
              ) : (
                <PorkbunLogo />
              )}
            </a>
          ))}
        </div>
      ) : null}
      {registrarHelperText ? (
        <span className="domain-availability-note">{registrarHelperText}</span>
      ) : null}
      {resultMessage ? <span className="domain-availability-message">{resultMessage}</span> : null}
    </div>
  ) : null;

  return (
    <div className={["domain-availability", className, currentResult ? `is-${currentResult.status}` : ""].filter(Boolean).join(" ")}>
      <div className="domain-availability-anchor">
        <button
          className={["domain-availability-trigger", shake ? "is-error-shake" : ""].filter(Boolean).join(" ")}
          type="button"
          disabled={!domain || loading}
          onClick={() => void checkAvailability()}
          onAnimationEnd={(event) => {
            if (event.animationName === "domain-availability-shake") setShake(false);
          }}
        >
          {loading ? (
            <LoaderCircle className="domain-availability-spinner" size={11} strokeWidth={1.6} aria-hidden="true" />
          ) : currentResult?.status === "available" ? (
            <span className="domain-availability-check" aria-hidden="true">
              <Check size={10} strokeWidth={2.4} />
            </span>
          ) : currentResult?.status === "unknown" ? (
            <span className="domain-availability-check" aria-hidden="true">
              <CircleHelp size={10} strokeWidth={2.2} />
            </span>
          ) : currentResult ? (
            <span className="domain-availability-check" aria-hidden="true">
              <X size={9} strokeWidth={2.4} />
            </span>
          ) : null}
          <span>{statusLabel}</span>
        </button>
      </div>
      {popover}
    </div>
  );
}
