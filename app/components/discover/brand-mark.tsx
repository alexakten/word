"use client";

import { brandLogoSrc, type BrandLogoId } from "../../lib/brand-logos";

export function BrandMark({
  logoId,
  className = "",
}: {
  logoId: BrandLogoId;
  className?: string;
}) {
  const src = brandLogoSrc(logoId);
  return (
    <span
      className={["brand-mark", className].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      <span
        className="brand-mark-shape"
        style={{
          WebkitMaskImage: `url("${src}")`,
          maskImage: `url("${src}")`,
        }}
      />
    </span>
  );
}
