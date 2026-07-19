"use client";

import { track } from "@vercel/analytics";
import { Check, LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { HandleAvailabilityResult, HandlePlatformResult } from "../../lib/handle-availability";
import { sounds } from "../../lib/sounds";

export function HandleAvailability({ handle, className = "" }: { handle: string; className?: string }) {
  const [result, setResult] = useState<HandleAvailabilityResult | null>(null);
  const [loadingHandle, setLoadingHandle] = useState("");
  const [shake, setShake] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  const currentResult = result?.handle === handle ? result : null;
  const loading = loadingHandle === handle;
  const platforms = currentResult?.platforms ?? [];

  const checkAvailability = async () => {
    if (!handle || loading) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoadingHandle(handle);
    setShake(false);

    try {
      const response = await fetch(`/api/handle-availability?handle=${encodeURIComponent(handle)}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const payload = await response.json() as HandleAvailabilityResult & { error?: string };
      if (controller.signal.aborted) return;
      if (!response.ok) {
        setResult({
          handle,
          status: "unknown",
          checkedAt: new Date().toISOString(),
          platforms: [],
          message: "Cannot find availability",
        });
        return;
      }
      setResult(payload);
      if (payload.status === "available") {
        sounds.success();
      } else if (payload.status === "taken") {
        setShake(true);
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setResult({
          handle,
          status: "unknown",
          checkedAt: new Date().toISOString(),
          platforms: [],
          message: "Cannot find availability",
        });
      }
    } finally {
      if (requestRef.current === controller) setLoadingHandle("");
    }
  };

  const availableCount = platforms.filter((entry) => entry.status === "available").length;
  const statusLabel = loading
    ? "Checking availability…"
    : currentResult?.status === "available"
      ? `@${handle} available!`
      : currentResult?.status === "taken"
        ? availableCount > 0
          ? `${availableCount}/${platforms.length} handles free`
          : `@${handle} is taken`
        : currentResult?.status === "unknown"
          ? `Check if @${handle} is available`
          : "Check availability";

  const popover = currentResult && platforms.length > 0 ? (
    <div className="domain-availability-popover handle-availability-popover">
      <ul className="domain-alt-tlds handle-platform-list" aria-label="Handle availability by platform">
        {platforms.map((entry) => (
          <li key={entry.platform}>
            <PlatformChip
              entry={entry}
              onClick={() => track("Handle Platform Clicked", {
                handle,
                platform: entry.platform,
                status: entry.status,
              })}
            />
          </li>
        ))}
      </ul>
      <span className="domain-availability-note">
        {currentResult.status === "available"
          ? "Claim these handles on each platform"
          : "Autogram handles are always available"}
      </span>
    </div>
  ) : null;

  return (
    <div className={[
      "domain-availability handle-availability",
      className,
      currentResult ? `is-${currentResult.status === "taken" ? "registered" : currentResult.status}` : "",
    ].filter(Boolean).join(" ")}
    >
      <div className="domain-availability-anchor">
        <button
          className={["domain-availability-trigger", shake ? "is-error-shake" : ""].filter(Boolean).join(" ")}
          type="button"
          disabled={!handle || loading}
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
          ) : currentResult?.status === "taken" ? (
            <span className="domain-availability-check" aria-hidden="true">
              <X size={9} strokeWidth={2.4} />
            </span>
          ) : currentResult ? (
            <span className="domain-availability-check" aria-hidden="true">
              <Search size={10} strokeWidth={2.2} />
            </span>
          ) : null}
          <span>{statusLabel}</span>
        </button>
      </div>
      {popover}
    </div>
  );
}

function PlatformChip({
  entry,
  onClick,
}: {
  entry: HandlePlatformResult;
  onClick: () => void;
}) {
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
        <Search size={9} strokeWidth={2.4} />
      ) : (
        <X size={8} strokeWidth={2.6} />
      )}
    </span>
  );

  return (
    <a
      href={entry.profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={onClick}
    >
      {icon}
      <span>{entry.label}</span>
    </a>
  );
}
