'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/actions'

export default function SignupPage() {
  const [error, setError] = useState('')
  const [pending, start] = useTransition()

  async function handleSubmit(formData: FormData) {
    const pw = formData.get('password') as string
    if (pw.length < 6) { setError('Password must be at least 6 characters'); return }
    start(async () => {
      const result = await signUp(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">Athlete<br />Journal</div>
      <div className="auth-tagline">Your training story starts here.</div>

      <div className="auth-card">
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, marginBottom: 20, letterSpacing: '0.04em' }}>CREATE ACCOUNT</div>
        {error && <div className="msg-error">⚠️ {error}</div>}
        <form action={handleSubmit}>
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input type="text" name="first_name" className="form-input" placeholder="Your first name" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" name="email" className="form-input" placeholder="you@email.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" name="password" className="form-input" placeholder="Min. 6 characters" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? <><span className="spinner" /> Creating account…</> : 'Create Account'}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link href="/auth/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
