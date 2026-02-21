import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { longestStreak, monthLabel, nextDay } from '@/lib/dates'
import { generateMonthlyInsights } from '@/lib/insights'
import { MonthlyReflectionForm } from './MonthlyReflectionForm'
import Link from 'next/link'
import type { JournalEntry } from '@/types'

interface Props {
  searchParams: Promise<{ month?: string }>
}

function prevMonth(m: string) {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonth(m: string) {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function isFuture(m: string) {
  const now = new Date().toISOString().slice(0, 7)
  return m >= now
}

export default async function MonthlySummaryPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const params = await searchParams
  const month = params.month || new Date().toISOString().slice(0, 7)

  const [y, mo] = month.split('-').map(Number)
  const startDate = `${month}-01`
  const endDate = new Date(y, mo, 0).toISOString().slice(0, 10)

  const [entriesRes, reflectionRes] = await Promise.all([
    supabase.from('journal_entries').select('*').eq('user_id', user.id)
      .gte('entry_date', startDate).lte('entry_date', endDate)
      .order('entry_date'),
    supabase.from('monthly_reflections').select('*').eq('user_id', user.id).eq('month', month).maybeSingle(),
  ])

  const entries: JournalEntry[] = entriesRes.data || []
  const reflection = reflectionRes.data

  const totalMins = entries.reduce((s, e) => s + e.minutes, 0)
  const daysLogged = new Set(entries.map(e => e.entry_date)).size
  const streak = longestStreak(entries.map(e => e.entry_date))
  const avgEffort = entries.length ? entries.reduce((s, e) => s + e.effort, 0) / entries.length : 0
  const avgConf = entries.length ? entries.reduce((s, e) => s + e.confidence, 0) / entries.length : 0
  const sorenessCount = entries.filter(e => e.body_feel === 'Sore' || e.body_feel === 'Hurt').length
  const gameCount = entries.filter(e => e.activity_type === 'Game').length
  const practiceCount = entries.filter(e => e.activity_type === 'Practice').length

  // Main sport (most minutes, tie-breaker: most entries)
  const sportMap: Record<string, { mins: number; count: number }> = {}
  for (const e of entries) {
    if (!sportMap[e.sport]) sportMap[e.sport] = { mins: 0, count: 0 }
    sportMap[e.sport].mins += e.minutes
    sportMap[e.sport].count++
  }
  const mainSport = Object.entries(sportMap).sort((a, b) =>
    b[1].mins !== a[1].mins ? b[1].mins - a[1].mins : b[1].count - a[1].count
  )[0]?.[0] ?? '—'

  const insights = generateMonthlyInsights(entries)
  const prev = prevMonth(month)
  const next = nextMonth(month)

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">MONTHLY</div>
          <div className="page-subtitle">Summary Report</div>
        </div>
        <Link href={`/summary/yearly?year=${y}`} className="btn btn-secondary btn-sm">Year →</Link>
      </div>

      <div className="month-nav">
        <Link href={`/summary/monthly?month=${prev}`} className="btn btn-secondary btn-sm">← Prev</Link>
        <div className="month-nav-label">{monthLabel(month)}</div>
        {!isFuture(next) ? (
          <Link href={`/summary/monthly?month=${next}`} className="btn btn-secondary btn-sm">Next →</Link>
        ) : <div style={{ width: 72 }} />}
      </div>

      {entries.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-text">No entries for this month. Start logging!</div>
          </div>
        </div>
      ) : (
        <>
          <div className="stats-row">
            <div className="stat-card">
              <div className="card-label">⏱ Total Minutes</div>
              <div className="card-value" style={{ fontSize: 32 }}>{totalMins}</div>
            </div>
            <div className="stat-card">
              <div className="card-label">📅 Days Logged</div>
              <div className="card-value" style={{ fontSize: 32 }}>{daysLogged}</div>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <div className="card-label">🔥 Best Streak</div>
              <div className="card-value" style={{ fontSize: 32 }}>{streak}<span className="card-unit">d</span></div>
            </div>
            <div className="stat-card">
              <div className="card-label">🏅 Main Sport</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginTop: 4, color: 'var(--green)' }}>{mainSport}</div>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <div className="card-label">⚡ Avg Effort</div>
              <div className="card-value" style={{ fontSize: 32 }}>{avgEffort.toFixed(1)}<span className="card-unit">/5</span></div>
            </div>
            <div className="stat-card">
              <div className="card-label">💪 Avg Conf.</div>
              <div className="card-value" style={{ fontSize: 32 }}>{avgConf.toFixed(1)}<span className="card-unit">/5</span></div>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <div className="card-label">🏆 Games</div>
              <div className="card-value" style={{ fontSize: 32 }}>{gameCount}</div>
            </div>
            <div className="stat-card">
              <div className="card-label">🏋️ Practices</div>
              <div className="card-value" style={{ fontSize: 32 }}>{practiceCount}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-label">😬 Sore/Hurt Days</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: sorenessCount > 5 ? 'var(--danger)' : 'var(--warning)', fontFamily: 'Bebas Neue, sans-serif' }}>
              {sorenessCount} <span style={{ fontSize: 14, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>days</span>
            </div>
          </div>

          <div className="section-heading">💡 Insights</div>
          {insights.map((ins, i) => (
            <div key={i} className="insight-card">{ins}</div>
          ))}
        </>
      )}

      <div className="section-heading">📝 Monthly Reflections</div>
      <MonthlyReflectionForm
        month={month}
        biggestWin={reflection?.biggest_win_month ?? ''}
        improveNext={reflection?.improve_next_month ?? ''}
      />
    </>
  )
}
