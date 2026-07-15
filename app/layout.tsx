import type { Metadata } from "next";
import favicon from "./favicon.png";
import { inter } from "./fonts";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Spellsurf",
  description: "Discover and create new words.",
  openGraph: {
    title: "Spellsurf",
    description: "Discover and create new words.",
    type: "website",
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
