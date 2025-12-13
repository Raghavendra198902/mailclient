import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Universal Email AI Manager',
  description: 'Advanced email management for Gmail, Outlook, Yahoo, IMAP with AI/ML automation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navigation />
          {children}
        </Providers>
      </body>
    </html>
  )
}
