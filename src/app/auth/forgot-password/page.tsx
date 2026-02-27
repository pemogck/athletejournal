'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/lib/actions'

export default function ForgotPasswordPage() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pending, start] = useTransition()
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  async function handleSubmit(formData: FormData) {
    formData.set('origin', origin)
    start(async () => {
      const result = await requestPasswordReset(formData)
      if (result?.error) setError(result.error)
      else setSuccess(true)
    })
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">Athlete<br />Journal</div>
      <div className="auth-tagline">Reset your password.</div>

      <div className="auth-card">
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, marginBottom: 20, letterSpacing: '0.04em' }}>FORGOT PASSWORD</div>

        {success ? (
          <div className="msg-success" style={{ marginBottom: 16 }}>
            Check your email for a password reset link.
          </div>
        ) : (
          <>
            {error && <div className="msg-error">⚠️ {error}</div>}
            <form action={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" name="email" className="form-input" placeholder="you@email.com" required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? <><span className="spinner" /> Sending…</> : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}

        <div className="auth-footer">
          <Link href="/auth/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}
