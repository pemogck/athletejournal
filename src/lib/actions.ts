'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ActivityType, BodyFeel, Sport } from '@/types'

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
  sport: Sport
  activity_type: ActivityType
  minutes: number
  effort: number
  confidence: number
  body_feel: BodyFeel
  win_today: string
  lesson_today: string
  tomorrow_focus: string
}

function validateEntry(data: EntryFormData): string | null {
  if (!data.sport) return 'Sport is required'
  if (!data.activity_type) return 'Activity type is required'
  if (!data.minutes || data.minutes < 1 || data.minutes > 600) return 'Minutes must be between 1 and 600'
  if (!data.effort || data.effort < 1 || data.effort > 5) return 'Effort must be 1–5'
  if (!data.confidence || data.confidence < 1 || data.confidence > 5) return 'Confidence must be 1–5'
  if (!data.body_feel) return 'Body feel is required'
  if (data.win_today.length > 140) return 'Win Today must be 140 characters or less'
  if (data.lesson_today.length > 140) return 'Lesson Today must be 140 characters or less'
  if (data.tomorrow_focus.length > 140) return 'Tomorrow Focus must be 140 characters or less'
  return null
}

export async function upsertEntry(entryId: string | null, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const data: EntryFormData = {
    entry_date: formData.get('entry_date') as string,
    sport: formData.get('sport') as Sport,
    activity_type: formData.get('activity_type') as ActivityType,
    minutes: Number(formData.get('minutes')),
    effort: Number(formData.get('effort')),
    confidence: Number(formData.get('confidence')),
    body_feel: formData.get('body_feel') as BodyFeel,
    win_today: (formData.get('win_today') as string) || '',
    lesson_today: (formData.get('lesson_today') as string) || '',
    tomorrow_focus: (formData.get('tomorrow_focus') as string) || '',
  }

  const validationError = validateEntry(data)
  if (validationError) return { error: validationError }

  if (entryId) {
    const { error } = await supabase
      .from('journal_entries')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', entryId)
      .eq('user_id', user.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('journal_entries')
      .insert({ ...data, user_id: user.id })
    if (error) return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/log')
  revalidatePath('/stats')
  return { success: true }
}

export async function deleteEntry(entryId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

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
