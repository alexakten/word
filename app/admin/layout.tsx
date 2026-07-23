import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spellsurf Admin",
  description: "Spellsurf with custom theme colors.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
