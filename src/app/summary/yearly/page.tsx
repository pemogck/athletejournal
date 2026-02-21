import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { longestStreak } from '@/lib/dates'
import { generateYearlyInsights } from '@/lib/insights'
import type { JournalEntry } from '@/types'

interface Props {
  searchParams: Promise<{ year?: string }>
}

export default async function YearlySummaryPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const params = await searchParams
  const year = params.year || String(new Date().getFullYear())
  const numYear = parseInt(year)

  const { data: entries } = await supabase
    .from('journal_entries').select('*')
    .eq('user_id', user.id)
    .gte('entry_date', `${year}-01-01`)
    .lte('entry_date', `${year}-12-31`)
    .order('entry_date')

  const all: JournalEntry[] = entries || []
  const totalMins = all.reduce((s, e) => s + e.minutes, 0)
  const hours = Math.floor(totalMins / 60)
  const daysLogged = new Set(all.map(e => e.entry_date)).size
  const streak = longestStreak(all.map(e => e.entry_date))
  const sports = new Set(all.map(e => e.sport))
  const avgEffort = all.length ? all.reduce((s, e) => s + e.effort, 0) / all.length : 0
  const avgConf = all.length ? all.reduce((s, e) => s + e.confidence, 0) / all.length : 0
  const gameCount = all.filter(e => e.activity_type === 'Game').length
  const sorenessCount = all.filter(e => e.body_feel === 'Sore' || e.body_feel === 'Hurt').length

  // Most active sport
  const sportMins: Record<string, number> = {}
  for (const e of all) sportMins[e.sport] = (sportMins[e.sport] || 0) + e.minutes
  const mostActiveSport = Object.entries(sportMins).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  const insights = generateYearlyInsights(all)
  const currentYear = new Date().getFullYear()

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">YEAR {year}</div>
          <div className="page-subtitle">Annual Training Summary</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        {numYear > 2024 && (
          <Link href={`/summary/yearly?year=${numYear - 1}`} className="btn btn-secondary btn-sm">← {numYear - 1}</Link>
        )}
        {numYear < currentYear && (
          <Link href={`/summary/yearly?year=${numYear + 1}`} className="btn btn-secondary btn-sm">{numYear + 1} →</Link>
        )}
        <Link href={`/summary/monthly?month=${year}-${String(new Date().getMonth() + 1).padStart(2,'0')}`} className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>Monthly →</Link>
      </div>

      {all.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📆</div>
            <div className="empty-state-text">No entries for {year}. Start logging!</div>
          </div>
        </div>
      ) : (
        <>
          <div className="stats-row">
            <div className="stat-card">
              <div className="card-label">⏱ Total Hours</div>
              <div className="card-value" style={{ fontSize: 32 }}>{hours}<span className="card-unit">h</span></div>
            </div>
            <div className="stat-card">
              <div className="card-label">⏱ Total Mins</div>
              <div className="card-value" style={{ fontSize: 28 }}>{totalMins}</div>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <div className="card-label">📅 Days Logged</div>
              <div className="card-value" style={{ fontSize: 32 }}>{daysLogged}</div>
            </div>
            <div className="stat-card">
              <div className="card-label">🔥 Best Streak</div>
              <div className="card-value" style={{ fontSize: 32 }}>{streak}<span className="card-unit">d</span></div>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <div className="card-label">🎽 Sports Played</div>
              <div className="card-value" style={{ fontSize: 32 }}>{sports.size}</div>
            </div>
            <div className="stat-card">
              <div className="card-label">🏆 Games Played</div>
              <div className="card-value" style={{ fontSize: 32 }}>{gameCount}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-label">🏅 Most Active Sport</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)', marginTop: 4 }}>{mostActiveSport}</div>
            {sportMins[mostActiveSport] && (
              <div className="page-subtitle" style={{ marginTop: 4 }}>{sportMins[mostActiveSport]} minutes logged</div>
            )}
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

          <div className="card">
            <div className="card-label">😬 Sore/Hurt Days</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: sorenessCount > 20 ? 'var(--danger)' : 'var(--warning)', fontFamily: 'Bebas Neue, sans-serif' }}>
              {sorenessCount} <span style={{ fontSize: 14, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>days</span>
            </div>
          </div>

          <div className="section-heading">💡 Year in Review</div>
          {insights.map((ins, i) => (
            <div key={i} className="insight-card">{ins}</div>
          ))}

          <div className="section-heading">📅 Browse by Month</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
            {Array.from({ length: 12 }, (_, i) => {
              const m = String(i + 1).padStart(2, '0')
              const monthStr = `${year}-${m}`
              const label = new Date(Number(year), i, 1).toLocaleDateString('en-US', { month: 'short' })
              const hasEntries = all.some(e => e.entry_date.startsWith(monthStr))
              return (
                <Link
                  key={m}
                  href={`/summary/monthly?month=${monthStr}`}
                  className="btn btn-secondary btn-sm"
                  style={{ opacity: hasEntries ? 1 : 0.4, justifyContent: 'center' }}
                >
                  {label} {hasEntries ? '●' : ''}
                </Link>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
