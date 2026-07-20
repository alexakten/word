export type SocialPreset = {
  id: string;
  platform: "instagram" | "x" | "tiktok";
  label: string;
  ratio: string;
  width: number;
  height: number;
};

/** Export sizes tuned for common social placements. */
export const SOCIAL_PRESETS: SocialPreset[] = [
  {
    id: "ig-square",
    platform: "instagram",
    label: "Instagram",
    ratio: "1:1",
    width: 1080,
    height: 1080,
  },
  {
    id: "ig-portrait",
    platform: "instagram",
    label: "Instagram",
    ratio: "4:5",
    width: 1080,
    height: 1350,
  },
  {
    id: "tiktok",
    platform: "tiktok",
    label: "TikTok",
    ratio: "9:16",
    width: 1080,
    height: 1920,
  },
  {
    id: "x-post",
    platform: "x",
    label: "X",
    ratio: "16:9",
    width: 1600,
    height: 900,
  },
  {
    id: "x-card",
    platform: "x",
    label: "X card",
    ratio: "1.91:1",
    width: 1200,
    height: 628,
  },
];

/** Browser canvas edge limit — stay under this on the long side. */
export const MAX_CAPTURE_EDGE = 16384;

export function maxExportScaleForPreset(preset: SocialPreset) {
  const longEdge = Math.max(preset.width, preset.height);
  return Math.max(1, Math.floor(MAX_CAPTURE_EDGE / longEdge));
}

export const EXPORT_SCALE_OPTIONS = [4, 8, 12, 16] as const;

export type ExportScale = (typeof EXPORT_SCALE_OPTIONS)[number];

export function exportScalesForPreset(preset: SocialPreset) {
  const max = maxExportScaleForPreset(preset);
  return EXPORT_SCALE_OPTIONS
    .filter((scale) => scale <= max)
    .map((id) => ({
      id,
      label: id === max ? `${id}× Max` : `${id}×`,
    }));
}

export function defaultExportScaleForPreset(preset: SocialPreset): ExportScale {
  const available = exportScalesForPreset(preset);
  return available[available.length - 1]?.id ?? 4;
}
