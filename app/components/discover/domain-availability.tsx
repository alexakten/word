"use client";

import { track } from "@vercel/analytics";
import { Check, LoaderCircle, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { sounds } from "../../lib/sounds";
import { GoDaddyLogo, NamecheapLogo, PorkbunLogo } from "./registrar-logos";

type AvailabilityResult = {
  domain: string;
  status: "available" | "registered" | "unknown";
  message?: string;
  priceLabel?: string;
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
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  const currentResult = result?.domain === domain ? result : null;
  const loading = loadingDomain === domain;

  const checkAvailability = async () => {
    if (!domain || loading) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoadingDomain(domain);

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
          message: payload.error || "Availability could not be checked.",
        });
        return;
      }
      setResult(payload);
      if (payload.status === "available") sounds.success();
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setResult({
          domain,
          status: "unknown",
          message: "Availability could not be checked.",
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
        ? `${domain} is registered`
        : currentResult?.status === "unknown"
          ? `Check availability of ${domain} on a registrar`
          : "Check availability";
  const showRegistrarLinks = Boolean(currentResult);
  const resultMessage = currentResult?.message?.startsWith("No public RDAP service")
    ? undefined
    : currentResult?.message;
  const registrarHelperText = currentResult?.status === "available"
    ? currentResult.priceLabel
      ? `About ${currentResult.priceLabel} — confirm and buy on registrar`
      : "Confirm availability and buy on registrar"
    : currentResult?.status === "registered"
      ? "Other TLDs might be available"
      : "Check availability on registrar";

  const popover = currentResult && (resultMessage || showRegistrarLinks) ? (
    <div className="domain-availability-popover">
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
      <span className="domain-availability-note">{registrarHelperText}</span>
      {resultMessage ? <span className="domain-availability-message">{resultMessage}</span> : null}
    </div>
  ) : null;

  return (
    <div className={["domain-availability", className, currentResult ? `is-${currentResult.status}` : ""].filter(Boolean).join(" ")}>
      <div className="domain-availability-anchor">
        <button
          className="domain-availability-trigger"
          type="button"
          disabled={!domain || loading}
          onClick={() => void checkAvailability()}
        >
          {loading ? (
            <LoaderCircle className="domain-availability-spinner" size={11} strokeWidth={1.6} aria-hidden="true" />
          ) : currentResult?.status === "available" ? (
            <span className="domain-availability-check" aria-hidden="true">
              <Check size={10} strokeWidth={2.4} />
            </span>
          ) : currentResult ? (
            <RefreshCw size={10} strokeWidth={1.6} aria-hidden="true" />
          ) : null}
          <span>{statusLabel}</span>
        </button>
      </div>
      {popover}
    </div>
  );
}
