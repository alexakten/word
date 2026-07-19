const GODADDY_API_BASE = "https://api.godaddy.com";

export type GodaddyMoney = {
  currencyCode: string;
  value: number;
};

export type GodaddyPriceTerm = {
  term: string;
  period: number;
  price: GodaddyMoney;
  renewalPrice?: GodaddyMoney;
};

export type GodaddyAvailabilityResponse = {
  domain: string;
  available: boolean;
  definitive?: boolean;
  inventory?: string;
  prices?: GodaddyPriceTerm[];
};

export type GodaddyAvailabilityResult =
  | { ok: true; data: GodaddyAvailabilityResponse }
  | { ok: false; status: number; message: string; retryable: boolean };

export function getGodaddyPat() {
  return process.env.GODADDY_PAT?.trim() || null;
}

export function formatGodaddyPrice(price: GodaddyMoney) {
  const amount = price.value / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: price.currencyCode || "USD",
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `$${(price.value / 100).toFixed(2)}`;
  }
}

export function getOneYearPrice(prices: GodaddyPriceTerm[] | undefined) {
  if (!prices?.length) return null;
  return prices.find((entry) => entry.term === "YEAR" && entry.period === 1) ?? prices[0] ?? null;
}

export async function checkGodaddyAvailability(
  domain: string,
  options?: { optimizeFor?: "SPEED" | "ACCURACY" },
): Promise<GodaddyAvailabilityResult | null> {
  const pat = getGodaddyPat();
  if (!pat) return null;

  const params = new URLSearchParams({
    domain,
    optimizeFor: options?.optimizeFor ?? "SPEED",
  });

  try {
    const response = await fetch(
      `${GODADDY_API_BASE}/v3/domains/check-availability?${params}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${pat}`,
        },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (response.ok) {
      const data = await response.json() as GodaddyAvailabilityResponse;
      if (typeof data?.available !== "boolean" || typeof data?.domain !== "string") {
        return {
          ok: false,
          status: response.status,
          message: "GoDaddy returned an unexpected availability response.",
          retryable: true,
        };
      }
      return { ok: true, data };
    }

    let message = "GoDaddy could not confirm availability.";
    try {
      const errorBody = await response.json() as { message?: string; code?: string };
      if (errorBody.message) message = errorBody.message;
      else if (errorBody.code) message = errorBody.code;
    } catch {
      // Keep the default message when the body is not JSON.
    }

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        status: response.status,
        message: "GoDaddy authentication failed. Check GODADDY_PAT and domains.domain:read scope.",
        retryable: false,
      };
    }

    if (response.status === 429) {
      return {
        ok: false,
        status: 429,
        message: "GoDaddy is rate limiting checks. Try again shortly.",
        retryable: true,
      };
    }

    if (response.status === 422 || response.status === 400) {
      return {
        ok: false,
        status: response.status,
        message,
        retryable: false,
      };
    }

    return {
      ok: false,
      status: response.status,
      message,
      retryable: response.status >= 500,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "GoDaddy availability check timed out or is temporarily unavailable.",
      retryable: true,
    };
  }
}
