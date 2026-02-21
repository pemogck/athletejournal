'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upsertEntry, deleteEntry } from '@/lib/actions'
import { formatDisplayDate } from '@/lib/dates'
import { SPORTS, ACTIVITY_TYPES, BODY_FEELS, type JournalEntry, type BodyFeel } from '@/types'

interface Props {
  date: string
  entry: JournalEntry | null
  defaultSport?: string | null
}

export function LogForm({ date, entry, defaultSport }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [effort, setEffort] = useState(entry?.effort ?? 0)
  const [confidence, setConfidence] = useState(entry?.confidence ?? 0)
  const [bodyFeel, setBodyFeel] = useState<BodyFeel | ''>(entry?.body_feel ?? '')
  const [winCount, setWinCount] = useState(entry?.win_today?.length ?? 0)
  const [lessonCount, setLessonCount] = useState(entry?.lesson_today?.length ?? 0)
  const [focusCount, setFocusCount] = useState(entry?.tomorrow_focus?.length ?? 0)

  async function handleSubmit(formData: FormData) {
    formData.set('effort', String(effort))
    formData.set('confidence', String(confidence))
    formData.set('body_feel', bodyFeel)

    startTransition(async () => {
      const result = await upsertEntry(entry?.id ?? null, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setError('')
        setTimeout(() => router.push('/'), 1200)
      }
    })
  }

  async function handleDelete() {
    if (!entry) return
    if (!confirm('Delete this entry?')) return
    startDelete(async () => {
      await deleteEntry(entry.id)
      router.push('/')
    })
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">{entry ? 'EDIT LOG' : 'LOG SESSION'}</div>
          <div className="page-subtitle">{formatDisplayDate(date)}</div>
        </div>
        {entry && (
          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? '...' : 'Delete'}
          </button>
        )}
      </div>

      {error && <div className="msg-error">⚠️ {error}</div>}
      {success && <div className="msg-success">✅ Saved! Nice work.</div>}

      <form action={handleSubmit}>
        <input type="hidden" name="entry_date" value={date} />

        <div className="form-group">
          <label className="form-label">Sport</label>
          <select name="sport" className="form-select" defaultValue={entry?.sport ?? defaultSport ?? ''} required>
            <option value="">Pick a sport…</option>
            {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Activity Type</label>
          <select name="activity_type" className="form-select" defaultValue={entry?.activity_type ?? ''} required>
            <option value="">Pick activity…</option>
            {ACTIVITY_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Minutes Trained</label>
          <input
            type="number"
            name="minutes"
            className="form-input"
            placeholder="e.g. 60"
            defaultValue={entry?.minutes ?? ''}
            min={1}
            max={600}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Effort (1–5)</label>
          <div className="rating-row">
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                type="button"
                className={`rating-btn${effort === n ? ' selected' : ''}`}
                onClick={() => setEffort(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Confidence (1–5)</label>
          <div className="rating-row">
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                type="button"
                className={`rating-btn${confidence === n ? ' selected' : ''}`}
                onClick={() => setConfidence(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">How&apos;s your body?</label>
          <div className="feel-row">
            {BODY_FEELS.map(f => (
              <button
                key={f}
                type="button"
                className={`feel-btn${bodyFeel === f ? ' selected' : ''}`}
                onClick={() => setBodyFeel(f)}
              >
                {f === 'Great' ? '😄' : f === 'OK' ? '😐' : f === 'Sore' ? '😬' : '🤕'}
                <br />{f}
              </button>
            ))}
          </div>
        </div>

        <div className="divider" />

        <div className="form-group">
          <label className="form-label">Win Today 🏆</label>
          <textarea
            name="win_today"
            className="form-textarea"
            placeholder="What went well?"
            maxLength={140}
            defaultValue={entry?.win_today ?? ''}
            onChange={e => setWinCount(e.target.value.length)}
          />
          <div className="char-count">{winCount}/140</div>
        </div>

        <div className="form-group">
          <label className="form-label">Lesson Today 💡</label>
          <textarea
            name="lesson_today"
            className="form-textarea"
            placeholder="What did you learn?"
            maxLength={140}
            defaultValue={entry?.lesson_today ?? ''}
            onChange={e => setLessonCount(e.target.value.length)}
          />
          <div className="char-count">{lessonCount}/140</div>
        </div>

        <div className="form-group">
          <label className="form-label">Tomorrow&apos;s Focus 🎯</label>
          <textarea
            name="tomorrow_focus"
            className="form-textarea"
            placeholder="What will you work on next?"
            maxLength={140}
            defaultValue={entry?.tomorrow_focus ?? ''}
            onChange={e => setFocusCount(e.target.value.length)}
          />
          <div className="char-count">{focusCount}/140</div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? <><span className="spinner" /> Saving…</> : entry ? '💾 Update Entry' : '✅ Save Entry'}
        </button>
      </form>
    </>
  )
}
