'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    href: '/', label: 'Home',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
        <path d="M3 12L12 3l9 9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 21V12h6v9M5 12v9h14V12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/log', label: 'Log',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l2 2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/stats', label: 'Stats',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
        <path d="M4 20V14M8 20V8M12 20v-6M16 20V4M20 20v-8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: `/summary/monthly?month=${new Date().toISOString().slice(0, 7)}`, label: 'Month',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 10h18M8 2v4M16 2v4" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav">
      {navItems.map(item => {
        const active = item.href === '/'
          ? pathname === '/'
          : pathname.startsWith(item.href.split('?')[0])
        return (
          <Link key={item.label} href={item.href} className={`nav-item${active ? ' active' : ''}`}>
            {item.icon(active)}
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
