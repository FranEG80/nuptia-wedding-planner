import {
  Cormorant_Garamond,
  Manrope,
  Parisienne,
} from "next/font/google"

const parisienne = Parisienne({
  variable: "--font-parisienne",
  subsets: ["latin"],
  weight: "400",
  preload: false,
})

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
})

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  preload: false,
})

export const mariaDanielaFontVariables = `${parisienne.variable} ${cormorant.variable} ${manrope.variable}`
