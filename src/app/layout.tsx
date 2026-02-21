import type { Metadata, Viewport } from 'next'
import './globals.css'
import { BottomNav } from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Athlete Journal',
  description: 'Track your training. Grow every day.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Athlete Journal' },
}

export const viewport: Viewport = {
  themeColor: '#0a0f0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <main className="page-content">{children}</main>
          {user && <BottomNav />}
        </div>
      </body>
    </html>
  )
}
