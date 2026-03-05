import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { PrivacyProvider } from '@/hooks/usePrivacyMode'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'GQ4',
  description: 'Control personal de ingresos y facturación',
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geist.variable} font-sans antialiased bg-background text-foreground`}>
        <PrivacyProvider>
          <TopBar />
          <main className="max-w-2xl mx-auto px-4 pt-5 pb-24 md:pb-8">
            {children}
          </main>
          <BottomNav />
        </PrivacyProvider>
      </body>
    </html>
  )
}
