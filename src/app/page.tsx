import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calcStreak, currentWeekMonday, currentWeekSunday, todayLocal, formatDisplayDate } from '@/lib/dates'
import { signOut } from '@/lib/actions'
import type { JournalEntry } from '@/types'

const sportEmoji: Record<string, string> = {
  Basketball: '🏀', Football: '🏈', Baseball: '⚾', Soccer: '⚽', Hockey: '🏒',
  Lacrosse: '🥍', Softball: '🥎', Volleyball: '🏐', Tennis: '🎾', Golf: '⛳',
  'Track & Field': '🏃', Swimming: '🏊', Wrestling: '🤼', Gymnastics: '🤸',
  'Ski/Snowboard': '⛷️', Other: '🏅',
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, recentRes, weekRes] = await Promise.all([
    supabase.from('athlete_profile').select('*').eq('user_id', user.id).single(),
    supabase.from('journal_entries').select('*').eq('user_id', user.id)
      .order('entry_date', { ascending: false }).limit(7),
    supabase.from('journal_entries').select('entry_date, minutes').eq('user_id', user.id)
      .gte('entry_date', currentWeekMonday()).lte('entry_date', currentWeekSunday()),
  ])

  const profile = profileRes.data
  const entries: JournalEntry[] = recentRes.data || []
  const weekEntries = weekRes.data || []

  const allDatesRes = await supabase
    .from('journal_entries').select('entry_date').eq('user_id', user.id)
  const allDates = (allDatesRes.data || []).map(e => e.entry_date)

  const streak = calcStreak(allDates)
  const weekMins = weekEntries.reduce((s, e) => s + e.minutes, 0)
  const today = todayLocal()
  const todayEntry = entries.find(e => e.entry_date === today)

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">
            {profile?.first_name ? `HEY, ${profile.first_name.toUpperCase()}!` : 'ATHLETE JOURNAL'}
          </div>
          <div className="page-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </div>
        <form action={signOut}>
          <button type="submit" className="btn btn-secondary btn-sm">Sign Out</button>
        </form>
      </div>

      <Link href={`/log?date=${today}`} className="btn-cta">
        {todayEntry ? '✏️ Edit Today\'s Log' : '+ LOG TODAY'}
      </Link>

      <div className="stats-row">
        <div className="stat-card">
          <div className="card-label">🔥 Streak</div>
          <div className="card-value">{streak}<span className="card-unit">days</span></div>
        </div>
        <div className="stat-card">
          <div className="card-label">📅 This Week</div>
          <div className="card-value">{weekMins}<span className="card-unit">min</span></div>
        </div>
      </div>

      <div className="card">
        <div className="card-label">Last 7 Entries</div>
        {entries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📓</div>
            <div className="empty-state-text">No entries yet. Log your first session!</div>
          </div>
        ) : (
          entries.map(entry => (
            <Link key={entry.id} href={`/log?date=${entry.entry_date}`} className="entry-item">
              <div className="entry-dot">{sportEmoji[entry.sport] || '🏅'}</div>
              <div className="entry-meta">
                <div className="entry-title">{entry.sport} · {entry.activity_type}</div>
                <div className="entry-sub">{formatDisplayDate(entry.entry_date)}</div>
              </div>
              <div className="entry-right">
                <div className="entry-mins">{entry.minutes}</div>
                <div className="entry-mins-label">min</div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <Link href="/stats" className="btn btn-secondary" style={{ flex: 1 }}>📊 Stats</Link>
        <Link
          href={`/summary/monthly?month=${today.slice(0, 7)}`}
          className="btn btn-secondary"
          style={{ flex: 1 }}
        >
          📋 Monthly
        </Link>
      </div>
    </>
  )
}
