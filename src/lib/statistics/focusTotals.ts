export interface FocusSessionTotal {
  startedAt: number
  actualSec: number
}

export function localDayKey(ms: number): string {
  const date = new Date(ms)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function focusSecondsOnLocalDay(
  sessions: readonly FocusSessionTotal[],
  dayKey: string,
): number {
  return sessions.reduce(
    (total, session) => total + (localDayKey(session.startedAt) === dayKey ? session.actualSec : 0),
    0,
  )
}

export function qualifiesAsStreakDay(seconds: number): boolean {
  return seconds >= 600
}
