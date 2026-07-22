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
      style={{
        WebkitMaskImage: `url("${src}")`,
        maskImage: `url("${src}")`,
      }}
      aria-hidden="true"
    />
  );
}
