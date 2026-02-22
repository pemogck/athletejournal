import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatsCharts } from './StatsCharts'
import type { JournalEntry } from '@/types'

function subDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function mondayOfWeek(offsetWeeks: number): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff - offsetWeeks * 7)
  return d.toISOString().slice(0, 10)
}

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const eightWeeksAgo = mondayOfWeek(7)
  const thirtyDaysAgo = subDays(30)
  const sevenDaysAgo = subDays(6)

  const [weeklyRes, sportRes, recentRes] = await Promise.all([
    // Weekly minutes: sum entry_sports per entry
    supabase.from('journal_entries')
      .select('entry_date, entry_sports(minutes)')
      .eq('user_id', user.id)
      .gte('entry_date', eightWeeksAgo),
    // Sport breakdown: all sports in last 30 days
    supabase.from('journal_entries')
      .select('entry_sports(sport, minutes)')
      .eq('user_id', user.id)
      .gte('entry_date', thirtyDaysAgo),
    supabase.from('journal_entries').select('effort, confidence, entry_date')
      .eq('user_id', user.id).gte('entry_date', sevenDaysAgo),
  ])

  // Flatten nested entry_sports into { entry_date, minutes }[]
  type WeeklyRaw = { entry_date: string; entry_sports: { minutes: number }[] | null }
  const weeklyEntries = ((weeklyRes.data || []) as WeeklyRaw[]).flatMap(e =>
    (e.entry_sports || []).map(s => ({ entry_date: e.entry_date, minutes: s.minutes }))
  )

  // Flatten nested entry_sports into { sport, minutes }[]
  type SportRaw = { entry_sports: { sport: string; minutes: number }[] | null }
  const sportEntries = ((sportRes.data || []) as SportRaw[]).flatMap(e =>
    (e.entry_sports || []).map(s => ({ sport: s.sport, minutes: s.minutes }))
  )

  return (
    <StatsCharts
      weeklyEntries={weeklyEntries}
      sportEntries={sportEntries}
      recentEntries={(recentRes.data || []) as Pick<JournalEntry, 'effort' | 'confidence' | 'entry_date'>[]}
    />
  )
}
