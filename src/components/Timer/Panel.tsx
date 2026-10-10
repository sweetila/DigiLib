import { useMemo } from 'react'
import { resolveConfig, useTimerSettingsStore } from '@/store/useTimerSettingsStore'
import { useTimerStore } from '@/store/useTimerStore'
import DurationFields from './DurationFields'
import NotificationToggles from './NotificationToggles'
import TimerModeTabs from './TimerModeTabs'
import TodaySummary from './TodaySummary'

export default function TimerPanel() {
  const status = useTimerStore((state) => state.status)
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
  const locked = status !== 'idle'
  const durations = mode === 'custom'
    ? custom
    : { focusMin: config.focusMin, shortBreakMin: config.shortBreakMin, longBreakMin: config.longBreakMin, sessions: config.sessions }

  return (
    <div>
      <TimerModeTabs
        mode={mode}
        disabled={locked}
        onChange={(nextMode) => useTimerSettingsStore.getState().setMode(nextMode)}
      />
      {locked && <p className="mt-3 text-xs text-warning">Reset the timer to change durations.</p>}
      <DurationFields values={durations} editable={!locked && mode === 'custom'} />
      <NotificationToggles />
      <TodaySummary />
    </div>
  )
}
