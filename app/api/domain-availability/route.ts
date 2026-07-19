import { domainToASCII } from "node:url";
import {
  checkGodaddyAvailability,
  formatGodaddyPrice,
  getGodaddyPat,
  getOneYearPrice,
} from "../../lib/godaddy";

type AvailabilityStatus = "available" | "registered" | "unknown";
type AvailabilitySource = "godaddy" | "rdap";

type AvailabilityResult = {
  domain: string;
  status: AvailabilityStatus;
  source: AvailabilitySource;
  checkedAt: string;
  message?: string;
  definitive?: boolean;
  priceLabel?: string;
};

type BootstrapRegistry = {
  services: [string[], string[]][];
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const IANA_RDAP_BOOTSTRAP_URL = "https://data.iana.org/rdap/dns.json";
const BOOTSTRAP_TTL_MS = 24 * 60 * 60 * 1000;
const RESULT_TTL_MS = 30 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 12;

const fallbackRdapUrls: Record<string, string> = {
  ai: "https://rdap.identitydigital.services/rdap/",
  app: "https://pubapi.registry.google/rdap/",
  com: "https://rdap.verisign.com/com/v1/",
  dev: "https://pubapi.registry.google/rdap/",
  net: "https://rdap.verisign.com/net/v1/",
  online: "https://rdap.radix.host/rdap/",
  org: "https://rdap.publicinterestregistry.org/rdap/",
  site: "https://rdap.radix.host/rdap/",
  store: "https://rdap.radix.host/rdap/",
  tech: "https://rdap.radix.host/rdap/",
  xyz: "https://rdap.centralnic.com/xyz/",
};

const rateLimits = new Map<string, RateLimitEntry>();
const resultCache = new Map<string, { result: AvailabilityResult; expiresAt: number }>();
const inFlightChecks = new Map<string, Promise<AvailabilityResult>>();
let bootstrapCache: { registry: BootstrapRegistry; expiresAt: number } | null = null;
let bootstrapRequest: Promise<BootstrapRegistry> | null = null;

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
    for (const [domain, entry] of resultCache) {
      if (entry.expiresAt <= now) resultCache.delete(domain);
    }
  }
}

function normalizeDomain(input: string) {
  const ascii = domainToASCII(input.trim().toLowerCase().replace(/\.$/, ""));
  if (!ascii || ascii.length > 253 || !ascii.includes(".")) return null;
  const labels = ascii.split(".");
  const validLabel = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
  if (labels.some((label) => label.length > 63 || !validLabel.test(label))) return null;
  return ascii;
}

async function getBootstrapRegistry() {
  const now = Date.now();
  if (bootstrapCache && bootstrapCache.expiresAt > now) return bootstrapCache.registry;
  if (bootstrapRequest) return bootstrapRequest;

  bootstrapRequest = fetch(IANA_RDAP_BOOTSTRAP_URL, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  })
    .then(async (response) => {
      if (!response.ok) throw new Error("RDAP bootstrap unavailable");
      const registry = await response.json() as BootstrapRegistry;
      if (!Array.isArray(registry.services)) throw new Error("Invalid RDAP bootstrap response");
      bootstrapCache = { registry, expiresAt: Date.now() + BOOTSTRAP_TTL_MS };
      return registry;
    })
    .finally(() => {
      bootstrapRequest = null;
    });

  return bootstrapRequest;
}

async function findRdapBaseUrl(tld: string) {
  try {
    const registry = await getBootstrapRegistry();
    for (const [tlds, urls] of registry.services) {
      if (!tlds.includes(tld)) continue;
      const secureUrl = urls.find((url) => url.startsWith("https://"));
      if (secureUrl) return secureUrl;
    }
  } catch {
    // Fall back to known registry endpoints if IANA is temporarily unavailable.
  }
  return fallbackRdapUrls[tld] ?? null;
}

async function queryRdap(domain: string): Promise<AvailabilityResult> {
  const tld = domain.split(".").at(-1)!;
  const baseUrl = await findRdapBaseUrl(tld);
  const checkedAt = new Date().toISOString();
  if (!baseUrl) {
    return {
      domain,
      status: "unknown",
      source: "rdap",
      checkedAt,
      message: `No public RDAP service is available for .${tld}.`,
    };
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/?$/, "/")}domain/${domain}`, {
      cache: "no-store",
      headers: { Accept: "application/rdap+json, application/json" },
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });

    if (response.status === 404) {
      return { domain, status: "available", source: "rdap", checkedAt };
    }
    if (response.ok) {
      return { domain, status: "registered", source: "rdap", checkedAt };
    }
    return {
      domain,
      status: "unknown",
      source: "rdap",
      checkedAt,
      message: response.status === 429
        ? "The registry is rate limiting checks. Try again shortly."
        : "The registry could not confirm availability.",
    };
  } catch {
    return {
      domain,
      status: "unknown",
      source: "rdap",
      checkedAt,
      message: "The registry check timed out or is temporarily unavailable.",
    };
  }
}

async function queryGodaddy(domain: string): Promise<AvailabilityResult | null> {
  if (!getGodaddyPat()) return null;

  const checkedAt = new Date().toISOString();
  const result = await checkGodaddyAvailability(domain);
  if (!result) return null;

  if (!result.ok) {
    if (!result.retryable) {
      return {
        domain,
        status: "unknown",
        source: "godaddy",
        checkedAt,
        message: result.message,
      };
    }
    return null;
  }

  const yearPrice = getOneYearPrice(result.data.prices);
  const priceLabel = yearPrice
    ? `${formatGodaddyPrice(yearPrice.price)}/yr`
    : undefined;

  return {
    domain: result.data.domain || domain,
    status: result.data.available ? "available" : "registered",
    source: "godaddy",
    checkedAt,
    definitive: result.data.definitive,
    priceLabel,
  };
}

async function resolveAvailability(domain: string): Promise<AvailabilityResult> {
  const godaddyResult = await queryGodaddy(domain);
  if (godaddyResult?.status === "available" || godaddyResult?.status === "registered") {
    return godaddyResult;
  }

  // Surface credential problems instead of silently falling back.
  if (godaddyResult?.message?.includes("authentication failed")) {
    return godaddyResult;
  }

  const rdapResult = await queryRdap(domain);
  if (godaddyResult?.status === "unknown" && rdapResult.status === "unknown") {
    return {
      ...rdapResult,
      message: godaddyResult.message || rdapResult.message,
    };
  }
  return rdapResult;
}

async function checkAvailability(domain: string) {
  const cached = resultCache.get(domain);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const existing = inFlightChecks.get(domain);
  if (existing) return existing;

  const request = resolveAvailability(domain)
    .then((result) => {
      resultCache.set(domain, { result, expiresAt: Date.now() + RESULT_TTL_MS });
      return result;
    })
    .finally(() => {
      inFlightChecks.delete(domain);
    });
  inFlightChecks.set(domain, request);
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

  const input = new URL(request.url).searchParams.get("domain") ?? "";
  const domain = normalizeDomain(input);
  if (!domain) {
    return Response.json(
      { error: "Enter a valid fully qualified domain." },
      { status: 400, headers: rateLimitHeaders },
    );
  }

  const result = await checkAvailability(domain);
  return Response.json(result, { headers: rateLimitHeaders });
}
