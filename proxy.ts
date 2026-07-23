import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isAdminHost(hostHeader: string | null) {
  const host = (hostHeader ?? "").split(":")[0]?.toLowerCase() ?? "";
  return host === "admin.spellsurf.com" || host === "admin.localhost";
}

export function proxy(request: NextRequest) {
  if (!isAdminHost(request.headers.get("host"))) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-spellsurf-admin", "1");

  const { pathname, searchParams } = request.nextUrl;
  const isEmbed = searchParams.has("embed");

  // Admin mode shares the regular app UI at /admin unless embedding the app.
  if (pathname === "/" && !isEmbed) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
      headers: { "X-Robots-Tag": "noindex, nofollow" },
    });
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
    headers: { "X-Robots-Tag": "noindex, nofollow" },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
