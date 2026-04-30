import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'ArcoLog', template: '%s — ArcoLog' },
  description: 'Diario de entrenamiento para arqueros. Registra, analiza y mejora.',
  icons: { icon: '/logo.png' },
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