import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calcStreak, currentWeekMonday, currentWeekSunday, todayLocal, formatDisplayDate } from '@/lib/dates'
import { signOut } from '@/lib/actions'
import { SwitchAthleteButton } from '@/components/SwitchAthleteButton'

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

  const today = todayLocal()

  const [profileRes, recentRes, weekRes, allDatesRes] = await Promise.all([
    supabase.from('athlete_profile').select('*').eq('user_id', user.id).single(),
    // Join entry_sports so we can show sport emoji and total minutes
    supabase.from('journal_entries')
      .select('id, entry_date, entry_sports(sport, minutes)')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .limit(7),
    // Weekly minutes: sum all sports for entries this week
    supabase.from('journal_entries')
      .select('entry_date, entry_sports(minutes)')
      .eq('user_id', user.id)
      .gte('entry_date', currentWeekMonday())
      .lte('entry_date', currentWeekSunday()),
    supabase.from('journal_entries').select('entry_date').eq('user_id', user.id),
  ])

  const profile = profileRes.data

  type EntryRaw = {
    id: string
    entry_date: string
    entry_sports: { sport: string; minutes: number }[] | null
  }
  const entries = (recentRes.data || []) as EntryRaw[]

  type WeekRaw = {
    entry_date: string
    entry_sports: { minutes: number }[] | null
  }
  const weekEntries = (weekRes.data || []) as WeekRaw[]
  const weekMins = weekEntries.reduce((sum, e) => {
    return sum + (e.entry_sports || []).reduce((s, es) => s + es.minutes, 0)
  }, 0)

  const allDates = (allDatesRes.data || []).map(e => e.entry_date)
  const streak = calcStreak(allDates)
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
        <div style={{ display: 'flex', gap: 8 }}>
          <SwitchAthleteButton firstName={profile?.first_name || ''} />
          <form action={signOut}>
            <button type="submit" className="btn btn-secondary btn-sm">Sign Out</button>
          </form>
        </div>
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
          entries.map(entry => {
            const primarySport = entry.entry_sports?.[0]?.sport || 'Other'
            const totalMins = (entry.entry_sports || []).reduce((s, es) => s + es.minutes, 0)
            return (
              <Link key={entry.id} href={`/log?date=${entry.entry_date}`} className="entry-item">
                <div className="entry-dot">{sportEmoji[primarySport] || '🏅'}</div>
                <div className="entry-meta">
                  <div className="entry-title">{primarySport}</div>
                  <div className="entry-sub">{formatDisplayDate(entry.entry_date)}</div>
                </div>
                <div className="entry-right">
                  <div className="entry-mins">{totalMins}</div>
                  <div className="entry-mins-label">min</div>
                </div>
              </Link>
            )
          })
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
