import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import favicon from "./favicon.png";
import { inter } from "./fonts";
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
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
