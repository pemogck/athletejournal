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

export type ActivityType =
  | 'Practice'
  | 'Game'
  | 'Skills'
  | 'Strength'
  | 'Conditioning'
  | 'Recovery'
  | 'Film/Study'
  | 'Other'

export interface AthleteProfile {
  id: string
  user_id: string
  first_name: string
  birth_year: number | null
  favorite_sport: string | null
  created_at: string
}

export interface JournalEntry {
  id: string
  user_id: string
  entry_date: string // YYYY-MM-DD
  sport: Sport
  activity_type: ActivityType
  minutes: number
  effort: number // 1-5
  confidence: number // 1-5
  body_feel: BodyFeel
  win_today: string
  lesson_today: string
  tomorrow_focus: string
  created_at: string
  updated_at: string
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

export const ACTIVITY_TYPES: ActivityType[] = [
  'Practice', 'Game', 'Skills', 'Strength', 'Conditioning', 'Recovery',
  'Film/Study', 'Other',
]

export const BODY_FEELS: BodyFeel[] = ['Great', 'OK', 'Sore', 'Hurt']
