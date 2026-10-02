import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/shared/ThemeProvider'
import { LanguageProvider } from '@/contexts/LanguageContext'
import ServiceWorkerRegister from '@/components/shared/ServiceWorkerRegister'
import Footer from '@/components/layout/Footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Dubai Monthly Cars | Premium Monthly Car Rental',
  description:
    'Flexible monthly car rental in Dubai. Choose from Basic, Plus or Premium plans with home delivery.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DMC Cars',
  },
}

export const viewport: Viewport = {
  themeColor: '#D4AF37',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ServiceWorkerRegister />
        <LanguageProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Footer />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}