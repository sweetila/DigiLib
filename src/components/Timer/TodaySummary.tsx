import { useEffect, useMemo, useState } from 'react'
import { focusSecondsOnLocalDay, localDayKey } from '@/lib/statistics/focusTotals'
import { useSessionStore } from '@/store/useSessionStore'

export default function TodaySummary() {
  const sessions = useSessionStore((state) => state.sessions)
  const [dayKey, setDayKey] = useState('')
  useEffect(() => {
    let timeout = 0
    const refreshDay = () => {
      const now = new Date()
      setDayKey(localDayKey(now.getTime()))
      const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      timeout = window.setTimeout(refreshDay, nextDay.getTime() - now.getTime())
    }
    refreshDay()
    return () => window.clearTimeout(timeout)
  }, [])
  const today = useMemo(() => {
    const todaysSessions = sessions.filter((session) => localDayKey(session.startedAt) === dayKey)
    return {
      seconds: focusSecondsOnLocalDay(sessions, dayKey),
      count: todaysSessions.length,
    }
  }, [sessions, dayKey])
  if (today.seconds === 0) return <p className="mt-5 border-t border-border pt-5 text-sm text-muted">No focus time yet today.</p>
  const minutes = Math.floor(today.seconds / 60)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  const duration = hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes}m`
  return (
    <p className="mt-5 border-t border-border pt-5 text-sm text-muted">
      Today: {duration} focused, {today.count} {today.count === 1 ? 'session' : 'sessions'}
    </p>
  )
}
