import { useEffect, useMemo } from 'react'
import { formatClock, formatOvertime } from '@/lib/timer'
import { resolveConfig, useTimerSettingsStore } from '@/store/useTimerSettingsStore'
import { useTimerStore } from '@/store/useTimerStore'
import { useTimerTicker } from '@/hooks/useTimerTicker'
import ClockControls from './ClockControls'
import ClockRing from './ClockRing'

function phaseLabel(phase: 'focus' | 'shortBreak' | 'longBreak', overtime: boolean): string {
  if (overtime) return 'Overtime'
  if (phase === 'shortBreak') return 'Short break'
  if (phase === 'longBreak') return 'Long break'
  return 'Focus'
}

export default function FocusClock() {
  const now = useTimerTicker()
  const status = useTimerStore((state) => state.status)
  const phase = useTimerStore((state) => state.phase)
  const plannedSec = useTimerStore((state) => state.plannedSec)
  const endTime = useTimerStore((state) => state.endTime)
  const pausedRemainingMs = useTimerStore((state) => state.remainingMs)
  const completed = useTimerStore((state) => state.completedFocusInCycle)
  const lastEvent = useTimerStore((state) => state.lastEvent)
  const mode = useTimerSettingsStore((state) => state.mode)
  const custom = useTimerSettingsStore((state) => state.custom)
  const autoStartBreaks = useTimerSettingsStore((state) => state.autoStartBreaks)
  const autoStartFocus = useTimerSettingsStore((state) => state.autoStartFocus)
  const soundNotification = useTimerSettingsStore((state) => state.soundNotification)
  const desktopNotification = useTimerSettingsStore((state) => state.desktopNotification)
  const config = useMemo(
    () => resolveConfig({ mode, custom, autoStartBreaks, autoStartFocus, soundNotification, desktopNotification }),
    [mode, custom, autoStartBreaks, autoStartFocus, soundNotification, desktopNotification],
  )
  const remaining = status === 'running' && endTime !== null
    ? endTime - now
    : status === 'paused'
      ? pausedRemainingMs ?? 0
      : 0
  const overtime = status !== 'idle' && phase === 'focus' && remaining <= 0
  const duration = status === 'idle'
    ? phase === 'focus'
      ? config.focusMin * 60
      : phase === 'shortBreak'
        ? config.shortBreakMin * 60
        : config.longBreakMin * 60
    : plannedSec
  const clockTime = status === 'idle'
    ? formatClock(duration * 1000)
    : overtime
      ? formatOvertime(remaining)
      : formatClock(Math.max(0, remaining))
  const label = phaseLabel(phase, overtime)
  const hint = status === 'idle'
    ? 'Ready when you are.'
    : status === 'paused'
      ? 'Paused.'
      : overtime
        ? 'Nice work. Keep going, or take a break.'
        : phase === 'focus'
          ? 'One session at a time.'
          : phase === 'shortBreak'
            ? 'Break time.'
            : 'Take your time.'

  const announcement = status === 'paused'
    ? 'Paused'
    : phase === 'focus'
      ? status === 'running' ? 'Focus started' : ''
      : 'Break time'
  const eventId = lastEvent?.type === 'focusComplete' ? lastEvent.id : 0

  useEffect(() => {
    if (status !== 'running') {
      document.title = 'DigiLib | Study Room'
      return
    }
    document.title = overtime
      ? `Overtime · ${clockTime} | DigiLib`
      : phase === 'focus'
        ? `${clockTime} · Focus | DigiLib`
        : `Break · ${clockTime} | DigiLib`
  }, [status, phase, overtime, clockTime])

  useEffect(() => () => {
    document.title = 'DigiLib | Study Room'
  }, [])

  return (
    <div className="text-center">
      <ClockRing
        label={label}
        time={clockTime}
        plannedSec={duration}
        remainingMs={remaining}
        idle={status === 'idle'}
        overtime={overtime}
        completed={completed}
        sessions={config.sessions}
        glowId={eventId}
      />
      <p className="mt-3 text-sm text-text/65">{hint}</p>
      <ClockControls status={status} overtime={status === 'running' && overtime} />
      <p className="sr-only" aria-live="polite">{announcement}</p>
    </div>
  )
}
