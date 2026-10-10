import type { TimerModeId } from '@/lib/timer'

const modes: { id: TimerModeId; label: string }[] = [
  { id: 'pomodoro', label: 'Pomodoro' },
  { id: 'classic-52', label: '52/17' },
  { id: 'deep-90', label: '90/20' },
  { id: 'custom', label: 'Custom' },
]

interface TimerModeTabsProps {
  mode: TimerModeId
  disabled: boolean
  onChange: (mode: TimerModeId) => void
}

export default function TimerModeTabs({ mode, disabled, onChange }: TimerModeTabsProps) {
  return (
    <div role="radiogroup" aria-label="Timer mode" className="grid grid-cols-4 gap-1 rounded-xl bg-text/5 p-1">
      {modes.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={mode === id}
          aria-label={id === 'custom' ? 'Custom' : label}
          disabled={disabled}
          onClick={() => onChange(id)}
          className={`min-h-10 rounded-lg px-1 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${mode === id ? 'bg-mode/[0.18] text-mode' : 'text-muted hover:text-text'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
