import type { Metadata, Viewport } from 'next'
import {
  Allura,
  Bodoni_Moda,
  Cinzel,
  Cormorant_Garamond,
  Fraunces,
  Geist_Mono,
  Inter,
  Lato,
  Libre_Baskerville,
  Manrope,
  Marcellus,
  Montserrat,
  Mulish,
  Nunito_Sans,
  Playfair_Display,
  Prata,
  Source_Sans_3,
  Work_Sans,
  Parisienne,
} from 'next/font/google'
import './globals.css'

const allura = Allura({
  variable: '--font-allura',
  subsets: ['latin'],
  weight: '400',
})

const parisienne = Parisienne({
  variable: '--font-parisienne',
  subsets: ['latin'],
  weight: '400',
})

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
})
const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })
const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})
const lato = Lato({
  variable: '--font-lato',
  subsets: ['latin'],
  weight: ['400', '700'],
})
const libreBaskerville = Libre_Baskerville({
  variable: '--font-libre-baskerville',
  subsets: ['latin'],
  weight: ['400', '700'],
})
const manrope = Manrope({ variable: '--font-manrope', subsets: ['latin'] })
const marcellus = Marcellus({
  variable: '--font-marcellus',
  subsets: ['latin'],
  weight: '400',
})
const mulish = Mulish({ variable: '--font-mulish', subsets: ['latin'] })
const fraunces = Fraunces({ variable: '--font-fraunces', subsets: ['latin'] })
const sourceSans = Source_Sans_3({
  variable: '--font-source-sans',
  subsets: ['latin'],
})
const cinzel = Cinzel({ variable: '--font-cinzel', subsets: ['latin'] })
const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
})
const bodoni = Bodoni_Moda({
  variable: '--font-bodoni',
  subsets: ['latin'],
})
const nunito = Nunito_Sans({
  variable: '--font-nunito',
  subsets: ['latin'],
})
const prata = Prata({
  variable: '--font-prata',
  subsets: ['latin'],
  weight: '400',
})
const workSans = Work_Sans({ variable: '--font-work-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Nuptia · Estudio de Bodas Digital',
  description:
    'Diseña tu invitación digital, configura la web de tu boda y gestiona tu lista de invitados en un solo lugar elegante.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#363c45',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`light ${allura.variable} ${playfair.variable} ${inter.variable} ${cormorant.variable} ${lato.variable} ${libreBaskerville.variable} ${manrope.variable} ${marcellus.variable} ${mulish.variable} ${fraunces.variable} ${sourceSans.variable} ${cinzel.variable} ${montserrat.variable} ${bodoni.variable} ${nunito.variable} ${prata.variable} ${workSans.variable} ${geistMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
