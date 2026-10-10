import { useEffect } from 'react'
import { palette } from '@/lib/ui/palette'
import { useTimerStore } from '@/store/useTimerStore'

export default function ModeAccentSync() {
  const phase = useTimerStore((state) => state.phase)

  useEffect(() => {
    const accent = phase === 'shortBreak'
      ? palette.sage
      : phase === 'longBreak'
        ? palette.apricot
        : 'var(--accent)'
    document.documentElement.style.setProperty('--mode-accent', accent)
  }, [phase])

  return null
}
