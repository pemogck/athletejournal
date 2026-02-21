'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts'
import type { JournalEntry } from '@/types'

interface Props {
  weeklyEntries: { entry_date: string; minutes: number }[]
  sportEntries: { sport: string; minutes: number }[]
  recentEntries: Pick<JournalEntry, 'effort' | 'confidence' | 'entry_date'>[]
}

function mondayOfWeekFor(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

function buildWeeks(entries: { entry_date: string; minutes: number }[]) {
  // Build last 8 weeks (Mon–Sun) buckets
  const weeks: { label: string; minutes: number; monday: string }[] = []
  for (let i = 7; i >= 0; i--) {
    const d = new Date()
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff - i * 7)
    const monday = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    weeks.push({ label, monday, minutes: 0 })
  }
  for (const e of entries) {
    const mon = mondayOfWeekFor(new Date(e.entry_date + 'T12:00:00'))
    const w = weeks.find(w => w.monday === mon)
    if (w) w.minutes += e.minutes
  }
  return weeks
}

function buildSports(entries: { sport: string; minutes: number }[]) {
  const map: Record<string, number> = {}
  for (const e of entries) {
    map[e.sport] = (map[e.sport] || 0) + e.minutes
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([sport, minutes]) => ({ sport: sport.slice(0, 10), minutes }))
}

const GREEN = '#00e676'
const GREEN_DIM = 'rgba(0,230,118,0.3)'

export function StatsCharts({ weeklyEntries, sportEntries, recentEntries }: Props) {
  const weeks = buildWeeks(weeklyEntries)
  const sports = buildSports(sportEntries)

  const avgEffort = recentEntries.length
    ? recentEntries.reduce((s, e) => s + e.effort, 0) / recentEntries.length
    : 0
  const avgConf = recentEntries.length
    ? recentEntries.reduce((s, e) => s + e.confidence, 0) / recentEntries.length
    : 0

  const currentWeekIdx = weeks.length - 1

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">STATS</div>
          <div className="page-subtitle">Your training overview</div>
        </div>
      </div>

      <div className="card">
        <div className="card-label">Weekly Minutes (last 8 weeks)</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weeks} barCategoryGap="25%">
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={32} />
            <Tooltip
              contentStyle={{ background: '#141e14', border: '1px solid #1f301f', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#f0f7f0' }}
              formatter={(v: number) => [`${v} min`, 'Minutes']}
            />
            <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
              {weeks.map((_, i) => (
                <Cell key={i} fill={i === currentWeekIdx ? GREEN : GREEN_DIM} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="card-label">Minutes by Sport (last 30 days)</div>
        {sports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⚽</div>
            <div className="empty-state-text">No entries in the last 30 days</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(140, sports.length * 36)}>
            <BarChart data={sports} layout="vertical" barCategoryGap="20%">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="sport" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip
                contentStyle={{ background: '#141e14', border: '1px solid #1f301f', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v} min`, 'Minutes']}
              />
              <Bar dataKey="minutes" fill={GREEN} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="card-label">⚡ Avg Effort</div>
          <div className="card-value" style={{ fontSize: 32 }}>
            {avgEffort > 0 ? avgEffort.toFixed(1) : '—'}<span className="card-unit">/5</span>
          </div>
          <div className="page-subtitle">Last 7 days</div>
        </div>
        <div className="stat-card">
          <div className="card-label">💪 Avg Confidence</div>
          <div className="card-value" style={{ fontSize: 32 }}>
            {avgConf > 0 ? avgConf.toFixed(1) : '—'}<span className="card-unit">/5</span>
          </div>
          <div className="page-subtitle">Last 7 days</div>
        </div>
      </div>
    </>
  )
}
