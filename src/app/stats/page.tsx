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
    supabase.from('journal_entries').select('entry_date, minutes')
      .eq('user_id', user.id).gte('entry_date', eightWeeksAgo),
    supabase.from('journal_entries').select('sport, minutes')
      .eq('user_id', user.id).gte('entry_date', thirtyDaysAgo),
    supabase.from('journal_entries').select('effort, confidence, entry_date')
      .eq('user_id', user.id).gte('entry_date', sevenDaysAgo),
  ])

  return (
    <StatsCharts
      weeklyEntries={weeklyRes.data || []}
      sportEntries={sportRes.data || []}
      recentEntries={(recentRes.data || []) as Pick<JournalEntry, 'effort' | 'confidence' | 'entry_date'>[]}
    />
  )
}
