/**
 * Returns today's date as YYYY-MM-DD in the user's local timezone.
 */
export function todayLocal(): string {
  const d = new Date()
  return formatDate(d)
}

/**
 * Formats a Date object as YYYY-MM-DD using local time.
 */
export function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Returns the Monday of the current local week as YYYY-MM-DD.
 */
export function currentWeekMonday(): string {
  const d = new Date()
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return formatDate(d)
}

/**
 * Returns the Sunday of the current local week as YYYY-MM-DD.
 */
export function currentWeekSunday(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 0 : 7 - day
  d.setDate(d.getDate() + diff)
  return formatDate(d)
}

/**
 * Calculates consecutive day streak ending on today from a sorted list of dates.
 */
export function calcStreak(dates: string[]): number {
  if (!dates.length) return 0
  const sorted = [...new Set(dates)].sort().reverse()
  let streak = 0
  let cursor = todayLocal()
  for (const d of sorted) {
    if (d === cursor) {
      streak++
      cursor = prevDay(cursor)
    } else if (d < cursor) {
      break
    }
  }
  return streak
}

export function prevDay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() - 1)
  return formatDate(d)
}

export function nextDay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + 1)
  return formatDate(d)
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/**
 * Returns longest streak within an array of dates (YYYY-MM-DD strings).
 */
export function longestStreak(dates: string[]): number {
  if (!dates.length) return 0
  const sorted = [...new Set(dates)].sort()
  let max = 1, cur = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    if (nextDay(prev) === curr) {
      cur++
      max = Math.max(max, cur)
    } else {
      cur = 1
    }
  }
  return max
}

export function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
