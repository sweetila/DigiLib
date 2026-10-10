import { useEffect, useRef, useState } from 'react'
import { remainingMs, TICK_MS } from '@/lib/timer'
import { useTimerStore } from '@/store/useTimerStore'

function displayedSecond(now: number): string {
  const { status, phase } = useTimerStore.getState()
  if (status === 'idle') return 'idle'
  const remaining = remainingMs(useTimerStore.getState(), now)
  const seconds = Math.ceil(Math.abs(remaining) / 1000)
  return `${status}:${phase}:${remaining < 0 ? 'over' : 'left'}:${seconds}`
}

export function useTimerTicker(): number {
  const status = useTimerStore((state) => state.status)
  const [now, setNow] = useState(0)
  const displayRef = useRef<string | null>(null)

  useEffect(() => {
    const update = () => {
      const currentTime = Date.now()
      useTimerStore.getState().tick(currentTime)
      const nextDisplay = displayedSecond(currentTime)
      if (nextDisplay !== displayRef.current) {
        displayRef.current = nextDisplay
        setNow(currentTime)
      }
    }

    update()
    if (status !== 'running') return

    const interval = window.setInterval(update, TICK_MS)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') update()
    }
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', update)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [status])

  return now
}
