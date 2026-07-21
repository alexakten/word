import { Aboreto, Afacad, Cal_Sans, Caveat, Instrument_Serif, Inter, Newsreader, Playfair_Display } from "next/font/google";
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
  display: "swap",
  variable: "--font-serif",
});

/** Active serif face. */
export const serif = newsreader;

export const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

export const caveat = Caveat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-caveat",
});

export const afacad = Afacad({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-afacad",
});

export const aboreto = Aboreto({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-aboreto",
});

export const calSans = Cal_Sans({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-cal-sans",
});

export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-instrument-serif",
});

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
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
  variable: "--font-open-runde",
});

export const parabolica = localFont({
  src: [
    {
      path: "../public/fonts/Parabolica_Text_Medium.otf",
      weight: "500",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-parabolica",
});

export const redaction = localFont({
  src: [
    {
      path: "../public/fonts/Redaction-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Redaction-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-redaction",
});

export const redaction10 = localFont({
  src: [
    {
      path: "../public/fonts/Redaction10-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Redaction10-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-redaction-10",
});

export const redaction20 = localFont({
  src: [
    {
      path: "../public/fonts/Redaction20-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Redaction20-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-redaction-20",
});

export const redaction35 = localFont({
  src: [
    {
      path: "../public/fonts/Redaction35-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Redaction35-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-redaction-35",
});

export const redaction50 = localFont({
  src: [
    {
      path: "../public/fonts/Redaction50-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Redaction50-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-redaction-50",
});

export const redaction70 = localFont({
  src: [
    {
      path: "../public/fonts/Redaction70-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Redaction70-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-redaction-70",
});

export const redaction100 = localFont({
  src: [
    {
      path: "../public/fonts/Redaction100-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Redaction100-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-redaction-100",
});

/** Toggle sans face between Inter and Open Runde. */
export type SansFace = "inter" | "openRunde";
export const ACTIVE_SANS: SansFace = "openRunde";

const sansFaces = { inter, openRunde } as const;

/** Active sans face. */
export const sans = sansFaces[ACTIVE_SANS];
