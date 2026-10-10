import { useTimerSettingsStore } from '@/store/useTimerSettingsStore'
import type { TimerDurations } from '@/lib/timer'

const fields: { key: keyof TimerDurations; label: string; min: number; max: number }[] = [
  { key: 'focusMin', label: 'Focus', min: 1, max: 180 },
  { key: 'shortBreakMin', label: 'Short break', min: 1, max: 60 },
  { key: 'longBreakMin', label: 'Long break', min: 1, max: 90 },
  { key: 'sessions', label: 'Sessions', min: 1, max: 12 },
]

interface DurationFieldsProps {
  values: TimerDurations
  editable: boolean
}

export default function DurationFields({ values, editable }: DurationFieldsProps) {
  return (
    <div className="mt-5 space-y-3">
      {fields.map(({ key, label, min, max }) => {
        const value = values[key]
        const change = (next: number) => {
          const custom = useTimerSettingsStore.getState().custom
          useTimerSettingsStore.getState().setCustomConfig({ ...custom, [key]: next })
        }
        return (
          <div key={key} className="grid grid-cols-[1fr_auto] items-center gap-3">
            <label htmlFor={`timer-${key}`} className="text-sm text-muted">{label}</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Decrease ${label}`}
                disabled={!editable || value <= min}
                onClick={() => change(value - 1)}
                className="grid size-10 place-items-center rounded-xl border border-border text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40"
              >−</button>
              <input
                id={`timer-${key}`}
                aria-label={key === 'sessions' ? label : `${label} minutes`}
                type="number"
                min={min}
                max={max}
                step={1}
                readOnly={!editable}
                value={value}
                onChange={(event) => change(Number(event.target.value))}
                className="h-10 w-16 rounded-xl border border-border bg-bg/50 text-center text-sm text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent read-only:text-muted"
              />
              <button
                type="button"
                aria-label={`Increase ${label}`}
                disabled={!editable || value >= max}
                onClick={() => change(value + 1)}
                className="grid size-10 place-items-center rounded-xl border border-border text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40"
              >+</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
