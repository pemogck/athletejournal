'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { BodyFeel } from '@/types'

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('first_name') as string

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }

  if (data.user) {
    await supabase.from('athlete_profile').insert({
      user_id: data.user.id,
      first_name: firstName,
    })
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

export async function switchAthlete() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login?switch=true')
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const updates = {
    first_name: formData.get('first_name') as string,
    birth_year: formData.get('birth_year') ? Number(formData.get('birth_year')) : null,
    favorite_sport: formData.get('favorite_sport') as string || null,
  }

  const { error } = await supabase
    .from('athlete_profile')
    .update(updates)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/')
  return { success: true }
}

// ─── Journal Entries ─────────────────────────────────────────────────────────

export interface EntryFormData {
  entry_date: string
  effort: number
  confidence: number
  energy: number
  body_feel_after: BodyFeel | ''
  win_today: string
  lesson_today: string
  tomorrow_focus: string
}

interface SportRow {
  sport: string
  minutes: number
}

function parseSports(formData: FormData): SportRow[] {
  const count = Number(formData.get('sport_count')) || 0
  const sports: SportRow[] = []
  for (let i = 0; i < count; i++) {
    const sport = (formData.get(`sport_${i}`) as string || '').trim()
    const minutes = Number(formData.get(`minutes_${i}`))
    if (sport && minutes > 0) {
      sports.push({ sport, minutes })
    }
  }
  return sports
}

function validateEntry(data: EntryFormData, sports: SportRow[]): string | null {
  if (sports.length === 0) return 'At least one sport is required'
  for (const s of sports) {
    if (!s.sport) return 'Sport is required'
    if (!s.minutes || s.minutes < 1 || s.minutes > 600) return 'Minutes must be between 1 and 600'
  }
  if (!data.effort || data.effort < 1 || data.effort > 5) return 'Effort must be 1–5'
  if (!data.confidence || data.confidence < 1 || data.confidence > 5) return 'Confidence must be 1–5'
  if (!data.energy || data.energy < 1 || data.energy > 5) return 'Energy must be 1–5'
  if (data.win_today.length > 140) return 'Win Today must be 140 characters or less'
  if (data.lesson_today.length > 140) return 'Lesson Today must be 140 characters or less'
  if (data.tomorrow_focus.length > 140) return 'Tomorrow Focus must be 140 characters or less'
  return null
}

export async function upsertEntry(entryId: string | null, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const sports = parseSports(formData)

  const data: EntryFormData = {
    entry_date: formData.get('entry_date') as string,
    effort: Number(formData.get('effort')),
    confidence: Number(formData.get('confidence')),
    energy: Number(formData.get('energy')),
    body_feel_after: (formData.get('body_feel_after') as BodyFeel) || '',
    win_today: (formData.get('win_today') as string) || '',
    lesson_today: (formData.get('lesson_today') as string) || '',
    tomorrow_focus: (formData.get('tomorrow_focus') as string) || '',
  }

  const validationError = validateEntry(data, sports)
  if (validationError) return { error: validationError }

  const entryPayload = {
    entry_date: data.entry_date,
    effort: data.effort,
    confidence: data.confidence,
    energy: data.energy,
    body_feel_after: data.body_feel_after || null,
    win_today: data.win_today,
    lesson_today: data.lesson_today,
    tomorrow_focus: data.tomorrow_focus,
  }

  let resolvedEntryId = entryId

  if (entryId) {
    const { error } = await supabase
      .from('journal_entries')
      .update({ ...entryPayload, updated_at: new Date().toISOString() })
      .eq('id', entryId)
      .eq('user_id', user.id)
    if (error) return { error: error.message }
  } else {
    const { data: newEntry, error } = await supabase
      .from('journal_entries')
      .insert({ ...entryPayload, user_id: user.id })
      .select('id')
      .single()
    if (error) return { error: error.message }
    resolvedEntryId = newEntry.id
  }

  // Replace all sports for this entry
  const { error: delError } = await supabase
    .from('entry_sports')
    .delete()
    .eq('entry_id', resolvedEntryId)
  if (delError) return { error: delError.message }

  const sportsRows = sports.map(s => ({
    entry_id: resolvedEntryId,
    user_id: user.id,
    sport: s.sport,
    minutes: s.minutes,
  }))

  const { error: sportError } = await supabase
    .from('entry_sports')
    .insert(sportsRows)
  if (sportError) return { error: sportError.message }

  revalidatePath('/')
  revalidatePath('/log')
  revalidatePath('/stats')
  return { success: true }
}

export async function deleteEntry(entryId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // entry_sports rows are deleted via ON DELETE CASCADE
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/log')
  return { success: true }
}

// ─── Monthly Reflection ───────────────────────────────────────────────────────

export async function upsertMonthlyReflection(month: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const payload = {
    user_id: user.id,
    month,
    biggest_win_month: (formData.get('biggest_win_month') as string) || '',
    improve_next_month: (formData.get('improve_next_month') as string) || '',
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('monthly_reflections')
    .upsert(payload, { onConflict: 'user_id,month' })

  if (error) return { error: error.message }
  revalidatePath(`/summary/monthly`)
  return { success: true }
}
