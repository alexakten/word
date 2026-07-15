import { Cardo, Host_Grotesk, Inter } from "next/font/google";

export const cardo = Cardo({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const hostGrotesk = Host_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});
