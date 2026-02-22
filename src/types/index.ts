export type BodyFeel = 'Great' | 'OK' | 'Sore' | 'Hurt'

export type Sport =
  | 'Basketball'
  | 'Football'
  | 'Baseball'
  | 'Soccer'
  | 'Hockey'
  | 'Lacrosse'
  | 'Softball'
  | 'Volleyball'
  | 'Tennis'
  | 'Golf'
  | 'Track & Field'
  | 'Swimming'
  | 'Wrestling'
  | 'Gymnastics'
  | 'Ski/Snowboard'
  | 'Other'

export interface AthleteProfile {
  id: string
  user_id: string
  first_name: string
  birth_year: number | null
  favorite_sport: string | null
  created_at: string
}

export interface EntrySport {
  id?: string
  entry_id?: string
  sport: string
  minutes: number
}

export interface JournalEntry {
  id: string
  user_id: string
  entry_date: string // YYYY-MM-DD
  sport?: Sport | null      // nullable after migration (stored in entry_sports)
  activity_type?: string | null
  minutes?: number | null   // nullable after migration (stored in entry_sports)
  effort: number            // 1-5
  confidence: number        // 1-5
  energy: number | null     // 1-5, null for entries before migration
  body_feel_before: BodyFeel
  body_feel_after: BodyFeel | null
  win_today: string
  lesson_today: string
  tomorrow_focus: string
  created_at: string
  updated_at: string
  entry_sports?: EntrySport[] // populated when joined
}

export interface MonthlyReflection {
  id: string
  user_id: string
  month: string // YYYY-MM
  biggest_win_month: string
  improve_next_month: string
  created_at: string
  updated_at: string
}

export const SPORTS: Sport[] = [
  'Basketball', 'Football', 'Baseball', 'Soccer', 'Hockey', 'Lacrosse',
  'Softball', 'Volleyball', 'Tennis', 'Golf', 'Track & Field', 'Swimming',
  'Wrestling', 'Gymnastics', 'Ski/Snowboard', 'Other',
]

export const BODY_FEELS: BodyFeel[] = ['Great', 'OK', 'Sore', 'Hurt']
