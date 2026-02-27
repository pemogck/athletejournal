'use client'

import { useState, useTransition } from 'react'
import { updatePassword } from '@/lib/actions'

export default function ResetPasswordPage() {
  const [error, setError] = useState('')
  const [pending, start] = useTransition()

  async function handleSubmit(formData: FormData) {
    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    start(async () => {
      const result = await updatePassword(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">Athlete<br />Journal</div>
      <div className="auth-tagline">Choose a new password.</div>

      <div className="auth-card">
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, marginBottom: 20, letterSpacing: '0.04em' }}>RESET PASSWORD</div>
        {error && <div className="msg-error">⚠️ {error}</div>}
        <form action={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input type="password" name="password" className="form-input" placeholder="Min. 6 characters" required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input type="password" name="confirm" className="form-input" placeholder="Repeat password" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? <><span className="spinner" /> Updating…</> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
