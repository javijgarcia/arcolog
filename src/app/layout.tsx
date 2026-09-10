import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'ArcoLog — Diario de entrenamiento para arqueros', template: '%s — ArcoLog' },
  description: 'La app de tiro con arco para registrar sesiones, analizar tu progreso y gestionar grupos de entrenamiento. Gratis para arqueros y entrenadores.',
  keywords: ['tiro con arco', 'arqueria', 'diario entrenamiento arqueros', 'app arqueria', 'entrenamiento arco', 'recurvo', 'compuesto', 'longbow', 'registro flechas', 'arcolog'],
  authors: [{ name: 'ArcoLog' }],
  creator: 'ArcoLog',
  metadataBase: new URL('https://arcolog.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://arcolog.vercel.app',
    siteName: 'ArcoLog',
    title: 'ArcoLog — Diario de entrenamiento para arqueros',
    description: 'La app de tiro con arco para registrar sesiones, analizar tu progreso y gestionar grupos de entrenamiento. Gratis para arqueros y entrenadores.',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'ArcoLog' }],
  },
  twitter: {
    card: 'summary',
    title: 'ArcoLog — Diario de entrenamiento para arqueros',
    description: 'La app de tiro con arco para registrar sesiones, analizar tu progreso y gestionar grupos de entrenamiento.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: { icon: '/logo.png', apple: '/logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body style={{ fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}