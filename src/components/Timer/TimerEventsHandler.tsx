import { useEffect, useRef } from 'react'
import { formatDuration } from '@/lib/timer'
import { playChime } from '@/lib/timer/chime'
import { showDesktopNotification } from '@/lib/timer/notify'
import { useTimerSettingsStore } from '@/store/useTimerSettingsStore'
import { useTimerStore } from '@/store/useTimerStore'
import { useUIStore } from '@/store/useUIStore'

export default function TimerEventsHandler() {
  const lastEvent = useTimerStore((state) => state.lastEvent)
  const handledId = useRef<number | null>(null)

  useEffect(() => {
    if (!lastEvent || handledId.current === lastEvent.id) return
    handledId.current = lastEvent.id

    const settings = useTimerSettingsStore.getState()
    const { title, message } = lastEvent.type === 'focusComplete'
      ? {
          title: 'Focus complete',
          message: lastEvent.loggedSec === undefined
            ? "Nice work. Take a break whenever you're ready."
            : `Nice work. ${formatDuration(lastEvent.loggedSec)} logged. Break time.`,
        }
      : lastEvent.type === 'breakComplete'
        ? {
            title: 'Break complete',
            message: settings.autoStartFocus
              ? "Break's over. Back to focus."
              : "Break's over. Ready when you are.",
          }
        : {
            title: 'Overtime limit reached',
            message: `Session ended automatically after 30 minutes of overtime. ${formatDuration(lastEvent.loggedSec ?? 0)} logged.`,
          }

    if (settings.soundNotification) playChime(lastEvent.type === 'breakComplete' ? 'breakComplete' : 'focusComplete')
    useUIStore.getState().showNotice(message)
    if (settings.desktopNotification) showDesktopNotification(title, message)
  }, [lastEvent])

  return null
}
