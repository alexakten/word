import { Inter, Newsreader } from "next/font/google";

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
