import type { Metadata } from "next";
import favicon from "./favicon.png";
import { inter } from "./fonts";
import "./globals.css";

function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;

  // Prefer the production domain so og:image never resolves to localhost on Vercel.
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  return "https://spellsurf.com";
}

const siteUrl = getSiteUrl();
const ogImage = {
  url: `${siteUrl}/og.png`,
  width: 1200,
  height: 630,
  alt: "Spellsurf — discover and create new words by combining syllables",
  type: "image/png" as const,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Spellsurf",
  description: "Discover and create new words.",
  openGraph: {
    title: "Spellsurf",
    description: "Discover and create new words.",
    url: siteUrl,
    siteName: "Spellsurf",
    type: "website",
    locale: "en_US",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Spellsurf",
    description: "Discover and create new words.",
    images: [ogImage],
  },
  icons: {
    icon: [{ url: favicon.src, type: "image/png", sizes: `${favicon.width}x${favicon.height}` }],
    apple: [{ url: favicon.src, type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col`}>{children}</body>
    </html>
  );
}
