'use client'

import { switchAthlete } from '@/lib/actions'

export function SwitchAthleteButton({ firstName }: { firstName: string }) {
  function handleClick() {
    if (firstName) {
      localStorage.setItem('lastAthlete', firstName)
    }
  }

  return (
    <form action={switchAthlete}>
      <button type="submit" className="btn btn-secondary btn-sm" onClick={handleClick}>
        Switch Athlete
      </button>
    </form>
  )
}
