'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upsertEntry, deleteEntry } from '@/lib/actions'
import { formatDisplayDate } from '@/lib/dates'
import { SPORTS, BODY_FEELS, type JournalEntry, type BodyFeel, type EntrySport } from '@/types'

const MINUTE_PRESETS = [30, 45, 60, 90, 120]

interface SportRow {
  sport: string
  minutes: string
  showCustom: boolean
}

interface Props {
  date: string
  entry: JournalEntry | null
  defaultSport?: string | null
  entrySports: EntrySport[]
}

const BODY_FEEL_EMOJI: Record<string, string> = {
  Great: '😄', OK: '😐', Sore: '😬', Hurt: '🤕',
}

function RatingRow({
  value,
  onChange,
}: {
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div>
      <div className="rating-row">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            className={`rating-btn${value === n ? ' selected' : ''}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="rating-scale">1 = Low &nbsp;·&nbsp; 5 = Highest</div>
    </div>
  )
}

function BodyFeelRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: BodyFeel | ''
  onChange: (f: BodyFeel) => void
}) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="feel-row">
        {BODY_FEELS.map(f => (
          <button
            key={f}
            type="button"
            className={`feel-btn${value === f ? ' selected' : ''}`}
            onClick={() => onChange(f)}
          >
            {BODY_FEEL_EMOJI[f]}
            <br />{f}
          </button>
        ))}
      </div>
    </div>
  )
}

export function LogForm({ date, entry, defaultSport, entrySports }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [effort, setEffort] = useState(entry?.effort ?? 0)
  const [confidence, setConfidence] = useState(entry?.confidence ?? 0)
  const [energy, setEnergy] = useState(entry?.energy ?? 0)
  const [bodyFeelAfter, setBodyFeelAfter] = useState<BodyFeel | ''>(entry?.body_feel_after ?? '')

  const [winCount, setWinCount] = useState(entry?.win_today?.length ?? 0)
  const [lessonCount, setLessonCount] = useState(entry?.lesson_today?.length ?? 0)
  const [focusCount, setFocusCount] = useState(entry?.tomorrow_focus?.length ?? 0)

  // Multi-sport state: initialise from existing entry_sports or a single default row
  const [sports, setSports] = useState<SportRow[]>(() => {
    if (entrySports.length > 0) {
      return entrySports.map(s => {
        const isPreset = MINUTE_PRESETS.includes(s.minutes)
        return { sport: s.sport, minutes: String(s.minutes), showCustom: !isPreset }
      })
    }
    return [{ sport: defaultSport || '', minutes: '', showCustom: false }]
  })

  function setSport(idx: number, sport: string) {
    setSports(prev => prev.map((row, i) => i === idx ? { ...row, sport } : row))
  }

  function selectPreset(idx: number, minutes: number) {
    setSports(prev => prev.map((row, i) =>
      i === idx ? { ...row, minutes: String(minutes), showCustom: false } : row
    ))
  }

  function selectOther(idx: number) {
    setSports(prev => prev.map((row, i) =>
      i === idx ? { ...row, minutes: '', showCustom: true } : row
    ))
  }

  function setCustomMinutes(idx: number, val: string) {
    setSports(prev => prev.map((row, i) => i === idx ? { ...row, minutes: val } : row))
  }

  function addSport() {
    if (sports.length < 3) setSports(prev => [...prev, { sport: '', minutes: '', showCustom: false }])
  }

  function removeSport(idx: number) {
    setSports(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(formData: FormData) {
    formData.set('effort', String(effort))
    formData.set('confidence', String(confidence))
    formData.set('energy', String(energy))
    formData.set('body_feel_after', bodyFeelAfter)

    // Encode sports rows
    formData.set('sport_count', String(sports.length))
    sports.forEach((s, i) => {
      formData.set(`sport_${i}`, s.sport)
      formData.set(`minutes_${i}`, s.minutes)
    })

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

        {/* ── Multi-sport logger ── */}
        <div className="form-group">
          <label className="form-label">Sport &amp; Minutes Trained</label>
          {sports.map((row, i) => (
            <div key={i} className="sport-entry">
              <div className="sport-entry-header">
                <select
                  className="form-select sport-entry-select"
                  value={row.sport}
                  onChange={e => setSport(i, e.target.value)}
                  required
                >
                  <option value="">Pick a sport…</option>
                  {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {sports.length > 1 && (
                  <button
                    type="button"
                    className="sport-remove-btn"
                    onClick={() => removeSport(i)}
                    aria-label="Remove sport"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="minutes-chips">
                {MINUTE_PRESETS.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    className={`minutes-chip${!row.showCustom && row.minutes === String(preset) ? ' selected' : ''}`}
                    onClick={() => selectPreset(i, preset)}
                  >
                    {preset}m
                  </button>
                ))}
                <button
                  type="button"
                  className={`minutes-chip${row.showCustom ? ' selected' : ''}`}
                  onClick={() => selectOther(i)}
                >
                  Other
                </button>
              </div>
              {row.showCustom && (
                <input
                  type="number"
                  className="form-input"
                  placeholder="Enter minutes…"
                  value={row.minutes}
                  onChange={e => setCustomMinutes(i, e.target.value)}
                  min={1}
                  max={600}
                  autoFocus
                />
              )}
            </div>
          ))}
          {sports.length < 3 && (
            <button type="button" className="add-sport-btn" onClick={addSport}>
              + Add Sport
            </button>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Effort (1–5)</label>
          <RatingRow value={effort} onChange={setEffort} />
        </div>

        <div className="form-group">
          <label className="form-label">Confidence (1–5)</label>
          <RatingRow value={confidence} onChange={setConfidence} />
        </div>

        <div className="form-group">
          <label className="form-label">Energy (1–5)</label>
          <RatingRow value={energy} onChange={setEnergy} />
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

        {/* ── Body Feel (After) ── */}
        <BodyFeelRow
          label="How's Your Body Feel? (After)"
          value={bodyFeelAfter}
          onChange={setBodyFeelAfter}
        />

        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? <><span className="spinner" /> Saving…</> : entry ? '💾 Update Entry' : '✅ Save Entry'}
        </button>
      </form>
    </>
  )
}
