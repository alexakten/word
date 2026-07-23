import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import favicon from "./favicon.png";
import { colorwayBootstrapScript } from "./lib/colorways";
import { layoutBootstrapScript } from "./lib/viewport";
import {
  sans,
  serif,
  inter,
  openRunde,
  playfair,
  caveat,
  parabolica,
  argestaDisplay,
  rawest,
  safiro,
  swiza,
  aboreto,
  afacad,
  calSans,
  instrumentSerif,
} from "./fonts";
import "./globals.css";

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://spellsurf.com");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Spellsurf",
  description: "Discover and create new words.",
  openGraph: {
    title: "Spellsurf",
    description: "Discover and create new words.",
    url: "/",
    siteName: "Spellsurf",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spellsurf",
    description: "Discover and create new words.",
  },
  icons: {
    icon: [{ url: favicon.src, type: "image/png", sizes: `${favicon.width}x${favicon.height}` }],
    apple: [{ url: favicon.src, type: "image/png" }],
  },
};

function isAppleMobileSafariUA(userAgent: string): boolean {
  return /iPad|iPhone|iPod/i.test(userAgent);
}

export async function generateViewport(): Promise<Viewport> {
  const userAgent = (await headers()).get("user-agent") ?? "";
  const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
  };

  return isAppleMobileSafariUA(userAgent)
    ? { ...viewport, maximumScale: 1 }
    : viewport;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-colorway="blue" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: layoutBootstrapScript }} />
        <script dangerouslySetInnerHTML={{ __html: colorwayBootstrapScript }} />
      </head>
      <body
        className={[
          sans.className,
          openRunde.variable,
          inter.variable,
          serif.variable,
          playfair.variable,
          caveat.variable,
          parabolica.variable,
          argestaDisplay.variable,
          rawest.variable,
          safiro.variable,
          swiza.variable,
          aboreto.variable,
          afacad.variable,
          calSans.variable,
          instrumentSerif.variable,
          "min-h-full flex flex-col",
        ].join(" ")}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
