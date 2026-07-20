import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spellsurf Admin",
  description: "Screenshot studio for Spellsurf social posts.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
