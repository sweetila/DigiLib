import { useState } from 'react'
import { requestDesktopPermission } from '@/lib/timer/notify'
import { useTimerSettingsStore } from '@/store/useTimerSettingsStore'
import Switch from '@/components/ui/Switch'

const toggleRows = [
  ['autoStartBreaks', 'Auto-start breaks'],
  ['autoStartFocus', 'Auto-start focus'],
  ['soundNotification', 'Sound notification'],
] as const

export default function NotificationToggles() {
  const autoStartBreaks = useTimerSettingsStore((state) => state.autoStartBreaks)
  const autoStartFocus = useTimerSettingsStore((state) => state.autoStartFocus)
  const soundNotification = useTimerSettingsStore((state) => state.soundNotification)
  const desktopNotification = useTimerSettingsStore((state) => state.desktopNotification)
  const [permissionMessage, setPermissionMessage] = useState('')
  const values = { autoStartBreaks, autoStartFocus, soundNotification }

  return (
    <section aria-label="Timer notifications" className="mt-6 space-y-3 border-t border-border pt-5">
      {toggleRows.map(([key, label]) => (
        <div key={key} className="flex min-h-10 items-center justify-between gap-3">
          <span className="text-sm text-muted">{label}</span>
          <Switch
            label={label}
            checked={values[key]}
            onChange={(checked) => useTimerSettingsStore.getState().setToggle(key, checked)}
          />
        </div>
      ))}
      <div className="flex min-h-10 items-center justify-between gap-3">
        <span className="text-sm text-muted">Desktop notification</span>
        <Switch
          label="Desktop notification"
          checked={desktopNotification}
          onChange={async (checked) => {
            setPermissionMessage('')
            if (!checked) {
              useTimerSettingsStore.getState().setToggle('desktopNotification', false)
              return
            }
            useTimerSettingsStore.getState().setToggle('desktopNotification', true)
            const result = await requestDesktopPermission()
            if (result !== 'granted') {
              useTimerSettingsStore.getState().setToggle('desktopNotification', false)
              setPermissionMessage(
                result === 'unsupported'
                  ? "Your browser doesn't support desktop notifications."
                  : 'Notifications are blocked in your browser settings.',
              )
            }
          }}
        />
      </div>
      {permissionMessage && <p role="status" className="m-0 text-xs text-warning">{permissionMessage}</p>}
    </section>
  )
}
