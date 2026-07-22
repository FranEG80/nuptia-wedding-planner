import {
  Allura,
  Bodoni_Moda,
  Cinzel,
  Cormorant_Garamond,
  Fraunces,
  Lato,
  Libre_Baskerville,
  Manrope,
  Marcellus,
  Montserrat,
  Mulish,
  Nunito_Sans,
  Prata,
  Quicksand,
  Source_Sans_3,
  Work_Sans,
} from "next/font/google"

import {
  getInvitationFontPair,
  type InvitationFontPairId,
} from "@/domains/invitations/domain/invitation-template-options"

// These fonts belong to the invitation templates. They are intentionally not
// preloaded: the active template adds only the variables for its selected pair.
const allura = Allura({
  variable: "--font-allura",
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
const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
})
const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
})
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  preload: false,
})
const marcellus = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: "400",
  preload: false,
})
const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  preload: false,
})
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  preload: false,
})
const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  preload: false,
})
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  preload: false,
})
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  preload: false,
})
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  preload: false,
})
const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
  preload: false,
})
const prata = Prata({
  variable: "--font-prata",
  subsets: ["latin"],
  weight: "400",
  preload: false,
})
const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  preload: false,
})
const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  preload: false,
})

// Kept in this template catalog for future invitation variants that use them.
export const invitationExtraFontVariables = {
  allura: allura.variable,
  quicksand: quicksand.variable,
} as const

const fontPairVariables: Record<InvitationFontPairId, string> = {
  // Playfair and Inter are app-shell fonts and are already available at root.
  "playfair-inter": "",
  "cormorant-lato": `${cormorant.variable} ${lato.variable}`,
  "libre-manrope": `${libreBaskerville.variable} ${manrope.variable}`,
  "marcellus-mulish": `${marcellus.variable} ${mulish.variable}`,
  "fraunces-source": `${fraunces.variable} ${sourceSans.variable}`,
  "cinzel-montserrat": `${cinzel.variable} ${montserrat.variable}`,
  "bodoni-nunito": `${bodoni.variable} ${nunito.variable}`,
  "prata-work": `${prata.variable} ${workSans.variable}`,
}

export function getInvitationFontVariables(value: string | undefined) {
  const fontPair = getInvitationFontPair(value)
  return fontPairVariables[fontPair.id]
}
