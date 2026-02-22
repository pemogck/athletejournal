'use client'

import { useState, useTransition, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/actions'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [pending, start] = useTransition()
  const [lastAthlete, setLastAthlete] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const isSwitching = searchParams.get('switch') === 'true'

  useEffect(() => {
    const stored = localStorage.getItem('lastAthlete')
    if (stored) setLastAthlete(stored)
  }, [])

  async function handleSubmit(formData: FormData) {
    start(async () => {
      const result = await signIn(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">Athlete<br />Journal</div>
      <div className="auth-tagline">Track your training. Grow every day.</div>

      {isSwitching && (
        <div className="msg-info" style={{ marginBottom: 16, textAlign: 'center' }}>
          <div>👋 Switch athlete - sign in below</div>
          {lastAthlete && (
            <div style={{ marginTop: 6, opacity: 0.8, fontSize: 14 }}>
              Last signed in: <strong>{lastAthlete}</strong>
            </div>
          )}
        </div>
      )}

      <div className="auth-card">
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, marginBottom: 20, letterSpacing: '0.04em' }}>SIGN IN</div>
        {error && <div className="msg-error">⚠️ {error}</div>}
        <form action={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" name="email" className="form-input" placeholder="you@email.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" name="password" className="form-input" placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? <><span className="spinner" /> Signing in…</> : 'Sign In'}
          </button>
        </form>
        <div className="auth-footer">
          New here? <Link href="/auth/signup">Create account</Link>
        </div>
      </div>
    </div>
  )
}
