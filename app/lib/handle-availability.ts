export type HandlePlatform = "instagram" | "x" | "tiktok" | "autogram";
export type HandleAvailabilityStatus = "available" | "taken" | "unknown";

export type HandlePlatformResult = {
  platform: HandlePlatform;
  label: string;
  status: HandleAvailabilityStatus;
  profileUrl: string;
};

export type HandleAvailabilityResult = {
  handle: string;
  status: HandleAvailabilityStatus;
  checkedAt: string;
  platforms: HandlePlatformResult[];
  message?: string;
};

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export const HANDLE_PLATFORMS: {
  platform: HandlePlatform;
  label: string;
  profileUrl: (handle: string) => string;
}[] = [
  {
    platform: "instagram",
    label: "Instagram",
    profileUrl: (handle) => `https://www.instagram.com/${handle}/`,
  },
  {
    platform: "x",
    label: "X",
    profileUrl: (handle) => `https://x.com/${handle}`,
  },
  {
    platform: "tiktok",
    label: "TikTok",
    profileUrl: (handle) => `https://www.tiktok.com/@${handle}`,
  },
  {
    platform: "autogram",
    label: "Autogram",
    profileUrl: (handle) => `https://autogram.id/${handle}`,
  },
];

/** Instagram / X / TikTok-compatible handle: 1–30 chars, letters, numbers, . _ */
export function normalizeHandle(input: string) {
  const handle = input.trim().toLowerCase().replace(/^@+/, "").replace(/\s+/g, "");
  if (!handle || handle.length > 30) return null;
  if (!/^[a-z0-9._]+$/.test(handle)) return null;
  if (handle.startsWith(".") || handle.endsWith(".") || handle.includes("..")) return null;
  return handle;
}

function summarizeStatus(platforms: HandlePlatformResult[]): HandleAvailabilityStatus {
  if (platforms.every((entry) => entry.status === "available")) return "available";
  if (platforms.some((entry) => entry.status === "taken")) return "taken";
  return "unknown";
}

async function checkInstagram(handle: string): Promise<HandleAvailabilityStatus> {
  try {
    const response = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`,
      {
        cache: "no-store",
        headers: {
          Accept: "*/*",
          "User-Agent": USER_AGENT,
          "X-IG-App-ID": "936619743392459",
          "X-Requested-With": "XMLHttpRequest",
          Referer: `https://www.instagram.com/${handle}/`,
          Origin: "https://www.instagram.com",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(7000),
      },
    );
    if (response.status === 404) return "available";
    if (!response.ok) return "unknown";
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      if (/page not found/i.test(text)) return "available";
      return "unknown";
    }
    const payload = await response.json() as { data?: { user?: unknown } };
    return payload.data?.user ? "taken" : "available";
  } catch {
    return "unknown";
  }
}

async function checkX(handle: string): Promise<HandleAvailabilityStatus> {
  try {
    const response = await fetch(`https://x.com/${encodeURIComponent(handle)}`, {
      cache: "no-store",
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(7000),
    });
    if (response.status === 404) return "available";
    if (response.ok) return "taken";
    return "unknown";
  } catch {
    return "unknown";
  }
}

async function checkTikTok(handle: string): Promise<HandleAvailabilityStatus> {
  try {
    const response = await fetch(`https://www.tiktok.com/@${encodeURIComponent(handle)}`, {
      cache: "no-store",
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) return "unknown";
    const html = await response.text();
    if (html.includes('statusCode":10221') || html.includes("statusCode\":10221")) {
      return "available";
    }
    if (
      html.includes(`uniqueId":"${handle}"`)
      || html.includes(`"uniqueId":"${handle}"`)
      || html.includes('statusCode":0')
    ) {
      return "taken";
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

async function checkPlatform(
  platform: HandlePlatform,
  handle: string,
): Promise<HandleAvailabilityStatus> {
  if (platform === "autogram") return "available";
  if (platform === "instagram") return checkInstagram(handle);
  if (platform === "x") return checkX(handle);
  return checkTikTok(handle);
}

export async function checkHandleAvailability(handle: string): Promise<HandleAvailabilityResult> {
  const platforms = await Promise.all(
    HANDLE_PLATFORMS.map(async (entry) => {
      const status = await checkPlatform(entry.platform, handle);
      return {
        platform: entry.platform,
        label: entry.label,
        status,
        profileUrl: entry.profileUrl(handle),
      };
    }),
  );

  const status = summarizeStatus(platforms);
  return {
    handle,
    status,
    checkedAt: new Date().toISOString(),
    platforms,
    message: status === "unknown" ? "Some platforms could not be checked." : undefined,
  };
}
