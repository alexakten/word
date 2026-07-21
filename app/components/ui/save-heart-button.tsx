"use client";

import { Heart } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

const BURST_MS = 700;

type SaveHeartButtonProps = {
  liked: boolean;
  disabled?: boolean;
  onToggle: () => void;
  likedLabel?: string;
  unlikedLabel?: string;
};

export function SaveHeartButton({
  liked,
  disabled = false,
  onToggle,
  likedLabel = "Remove from saved words",
  unlikedLabel = "Save word",
}: SaveHeartButtonProps) {
  const [bursting, setBursting] = useState(false);
  const wasLikedRef = useRef(liked);
  const burstTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const wasLiked = wasLikedRef.current;
    wasLikedRef.current = liked;

    if (!liked || wasLiked) return;

    setBursting(true);
    if (burstTimerRef.current) window.clearTimeout(burstTimerRef.current);
    burstTimerRef.current = window.setTimeout(() => {
      setBursting(false);
      burstTimerRef.current = null;
    }, BURST_MS);
  }, [liked]);

  useEffect(() => {
    return () => {
      if (burstTimerRef.current) window.clearTimeout(burstTimerRef.current);
    };
  }, []);

  return (
    <button
      className={[
        "compact-save-word-button",
        liked ? "liked" : "",
        bursting ? "is-bursting" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      type="button"
      aria-label={liked ? likedLabel : unlikedLabel}
      aria-pressed={liked}
      disabled={disabled}
      onClick={onToggle}
    >
      <span className="save-heart-ring" aria-hidden="true" />
      <span className="save-heart-sparks" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <span
            key={index}
            className="save-heart-spark"
            style={{ "--spark-i": index } as CSSProperties}
          />
        ))}
      </span>
      <Heart
        className="save-heart-icon"
        size={15}
        strokeWidth={1.6}
        fill={liked ? "currentColor" : "none"}
        aria-hidden="true"
      />
    </button>
  );
}
