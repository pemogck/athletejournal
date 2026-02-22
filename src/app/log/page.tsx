import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { todayLocal } from '@/lib/dates'
import { LogForm } from './LogForm'
import type { EntrySport, JournalEntry } from '@/types'

interface Props {
  searchParams: Promise<{ date?: string }>
}

export default async function LogPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const params = await searchParams
  const date = params.date || todayLocal()

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect('/log')

  const { data: entry } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('entry_date', date)
    .maybeSingle()

  const { data: profile } = await supabase
    .from('athlete_profile')
    .select('favorite_sport')
    .eq('user_id', user.id)
    .single()

  // Fetch existing sports for this entry (if editing)
  let entrySports: EntrySport[] = []
  if (entry?.id) {
    const { data: sports } = await supabase
      .from('entry_sports')
      .select('sport, minutes')
      .eq('entry_id', entry.id)
      .order('created_at')
    entrySports = (sports || []) as EntrySport[]
  }

  return (
    <LogForm
      date={date}
      entry={entry as JournalEntry | null}
      defaultSport={profile?.favorite_sport}
      entrySports={entrySports}
    />
  )
}
