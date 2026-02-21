'use client'

import { useState, useTransition } from 'react'
import { upsertMonthlyReflection } from '@/lib/actions'

interface Props {
  month: string
  biggestWin: string
  improveNext: string
}

export function MonthlyReflectionForm({ month, biggestWin, improveNext }: Props) {
  const [pending, start] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    start(async () => {
      const result = await upsertMonthlyReflection(month, formData)
      if (result?.error) setError(result.error)
      else { setSuccess(true); setError('') }
    })
  }

  return (
    <div className="card">
      {error && <div className="msg-error">⚠️ {error}</div>}
      {success && <div className="msg-success">✅ Reflection saved!</div>}
      <form action={handleSubmit}>
        <div className="form-group">
          <label className="form-label">🏆 Biggest Win This Month</label>
          <textarea
            name="biggest_win_month"
            className="form-textarea"
            placeholder="What was your best moment this month?"
            defaultValue={biggestWin}
          />
        </div>
        <div className="form-group">
          <label className="form-label">📈 What I'll Improve Next Month</label>
          <textarea
            name="improve_next_month"
            className="form-textarea"
            placeholder="What will you focus on improving?"
            defaultValue={improveNext}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? <><span className="spinner" /> Saving…</> : '💾 Save Reflections'}
        </button>
      </form>
    </div>
  )
}
