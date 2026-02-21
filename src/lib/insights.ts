import type { JournalEntry } from '@/types'

export function generateMonthlyInsights(entries: JournalEntry[]): string[] {
  if (!entries.length) return ["No entries this month yet. Start logging to see insights!"]

  const insights: string[] = []
  const totalMinutes = entries.reduce((s, e) => s + e.minutes, 0)
  const avgEffort = entries.reduce((s, e) => s + e.effort, 0) / entries.length
  const avgConf = entries.reduce((s, e) => s + e.confidence, 0) / entries.length
  const sorenessCount = entries.filter(e => e.body_feel === 'Sore' || e.body_feel === 'Hurt').length
  const greatDays = entries.filter(e => e.body_feel === 'Great').length
  const gameDays = entries.filter(e => e.activity_type === 'Game').length

  // Insight 1: Training volume
  if (totalMinutes >= 600) {
    insights.push(`🔥 Incredible work this month — you put in ${totalMinutes} minutes of training. That kind of commitment is how champions are made!`)
  } else if (totalMinutes >= 300) {
    insights.push(`💪 Solid month! You trained for ${totalMinutes} minutes total. Keep building on that consistency.`)
  } else {
    insights.push(`📈 You logged ${totalMinutes} minutes this month. Every session counts — even small ones add up over time!`)
  }

  // Insight 2: Effort & confidence
  if (avgEffort >= 4.5 && avgConf >= 4) {
    insights.push(`⚡ Your average effort was ${avgEffort.toFixed(1)}/5 and confidence ${avgConf.toFixed(1)}/5 — you're showing up with full energy and believing in yourself!`)
  } else if (avgEffort >= 4 && avgConf < 3.5) {
    insights.push(`🎯 You're working hard (avg effort ${avgEffort.toFixed(1)}/5), but confidence averaged ${avgConf.toFixed(1)}/5. Remember: hard work builds confidence over time — trust the process!`)
  } else if (avgConf >= 4 && avgEffort < 3.5) {
    insights.push(`😎 Great confidence this month (${avgConf.toFixed(1)}/5)! Try cranking up the effort a bit — you clearly believe in yourself, now push the gas pedal!`)
  } else {
    insights.push(`📊 This month averaged ${avgEffort.toFixed(1)}/5 effort and ${avgConf.toFixed(1)}/5 confidence. Focus on one area to improve next month!`)
  }

  // Insight 3: Body & recovery
  if (sorenessCount === 0) {
    insights.push(`✨ Zero sore or hurt days this month — your body is recovering well. ${greatDays > entries.length * 0.6 ? 'You felt great most days!' : 'Keep listening to your body.'}`)
  } else if (sorenessCount <= 3) {
    insights.push(`🩹 You had ${sorenessCount} sore day${sorenessCount > 1 ? 's' : ''} this month — totally normal for a hard-working athlete. Make sure to keep up recovery habits!`)
  } else {
    insights.push(`⚠️ ${sorenessCount} days of soreness or discomfort this month. It might be worth talking to your coach about recovery — rest is part of training too!`)
  }

  if (gameDays > 0) {
    insights.push(`🏆 You played in ${gameDays} game${gameDays > 1 ? 's' : ''} this month. Game experience is irreplaceable — great job competing!`)
  }

  return insights.slice(0, 3)
}

export function generateYearlyInsights(entries: JournalEntry[]): string[] {
  if (!entries.length) return ["No entries this year yet. Start logging your training!"]

  const insights: string[] = []
  const totalMinutes = entries.reduce((s, e) => s + e.minutes, 0)
  const hours = Math.floor(totalMinutes / 60)
  const sports = new Set(entries.map(e => e.sport)).size

  if (hours >= 100) {
    insights.push(`🏅 You trained for over ${hours} hours this year — that's elite-level dedication!`)
  } else {
    insights.push(`📆 You put in ${hours} hours of training this year. Every hour makes you better!`)
  }

  if (sports >= 3) {
    insights.push(`🎽 You played ${sports} different sports this year. Multi-sport athletes develop better all-around athleticism!`)
  }

  return insights
}
