import { Inter, Newsreader } from "next/font/google";
import localFont from "next/font/local";

/*
 * Cardo (previous serif) — switch back by restoring this and setting `serif = cardo`
 * with `variable: "--font-serif"` (or point CSS at `--font-cardo`).
 *
 * import { Cardo } from "next/font/google";
 * export const cardo = Cardo({
 *   subsets: ["latin"],
 *   weight: ["400", "700"],
 *   display: "swap",
 *   variable: "--font-serif",
 * });
 */

export const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-serif",
});

/** Active serif face. */
export const serif = newsreader;

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const openRunde = localFont({
  src: [
    {
      path: "../public/fonts/OpenRunde-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/OpenRunde-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/OpenRunde-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/OpenRunde-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
});

/** Toggle sans face between Inter and Open Runde. */
export type SansFace = "inter" | "openRunde";
export const ACTIVE_SANS: SansFace = "openRunde";

const sansFaces = { inter, openRunde } as const;

/** Active sans face. */
export const sans = sansFaces[ACTIVE_SANS];
