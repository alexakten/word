import {
  checkHandleAvailability,
  normalizeHandle,
  type HandleAvailabilityResult,
} from "../../lib/handle-availability";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const RESULT_TTL_MS = 30 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 12;

const rateLimits = new Map<string, RateLimitEntry>();
const resultCache = new Map<string, { result: HandleAvailabilityResult; expiresAt: number }>();
const inFlightChecks = new Map<string, Promise<HandleAvailabilityResult>>();

function responseHeaders() {
  return {
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
  };
}

function getClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || request.headers.get("x-real-ip") || "unknown").slice(0, 80);
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const current = rateLimits.get(key);
  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }
  if (current.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }
  current.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - current.count, resetAt: current.resetAt };
}

function pruneCaches() {
  const now = Date.now();
  if (rateLimits.size > 1000) {
    for (const [key, entry] of rateLimits) {
      if (entry.resetAt <= now) rateLimits.delete(key);
    }
  }
  if (resultCache.size > 500) {
    for (const [handle, entry] of resultCache) {
      if (entry.expiresAt <= now) resultCache.delete(handle);
    }
  }
}

async function checkAvailability(handle: string) {
  const cached = resultCache.get(handle);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const existing = inFlightChecks.get(handle);
  if (existing) return existing;

  const request = checkHandleAvailability(handle)
    .then((result) => {
      resultCache.set(handle, { result, expiresAt: Date.now() + RESULT_TTL_MS });
      return result;
    })
    .finally(() => {
      inFlightChecks.delete(handle);
    });
  inFlightChecks.set(handle, request);
  return request;
}

export async function GET(request: Request) {
  pruneCaches();
  const rateLimit = checkRateLimit(getClientKey(request));
  const rateLimitHeaders = {
    ...responseHeaders(),
    "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
  };

  if (!rateLimit.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000));
    return Response.json(
      { error: "Too many availability checks. Try again shortly." },
      { status: 429, headers: { ...rateLimitHeaders, "Retry-After": String(retryAfter) } },
    );
  }

  const input = new URL(request.url).searchParams.get("handle") ?? "";
  const handle = normalizeHandle(input);
  if (!handle) {
    return Response.json(
      { error: "Enter a valid handle (letters, numbers, periods, underscores)." },
      { status: 400, headers: rateLimitHeaders },
    );
  }

  const result = await checkAvailability(handle);
  return Response.json(result, { headers: rateLimitHeaders });
}
