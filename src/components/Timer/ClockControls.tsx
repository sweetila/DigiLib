import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { elapsedSec, formatDuration, MIN_LOGGED_SEC } from '@/lib/timer'
import { useTimerStore } from '@/store/useTimerStore'
import { useUIStore } from '@/store/useUIStore'
import { primeChime } from '@/lib/timer/chime'

interface ClockControlsProps {
  status: 'idle' | 'running' | 'paused'
  overtime: boolean
}

function savePartialNotice(): void {
  const timer = useTimerStore.getState()
  const elapsed = elapsedSec(timer, Date.now())
  if (timer.phase === 'focus' && elapsed >= MIN_LOGGED_SEC) {
    useUIStore.getState().showNotice(`Session saved. ${formatDuration(elapsed)} logged.`)
  }
}

export default function ClockControls({ status, overtime }: ClockControlsProps) {
  const controlsClass = 'grid size-11 place-items-center rounded-full border border-mode/35 bg-mode/[0.18] text-mode transition-colors hover:bg-mode/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mode disabled:cursor-not-allowed disabled:opacity-40'
  const primaryClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-mode/35 bg-mode/[0.18] px-6 py-2 text-sm font-medium text-mode transition-colors hover:bg-mode/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mode'

  if (overtime) {
    return (
      <div className="mt-7 flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label="Start break"
          className={primaryClass}
          onClick={() => {
            primeChime()
            useTimerStore.getState().skip()
            useTimerStore.getState().start()
          }}
        >
          <Play aria-hidden="true" size={16} /> Start break
        </button>
        <button
          type="button"
          aria-label="Finish session"
          className={primaryClass}
          onClick={() => {
            savePartialNotice()
            useTimerStore.getState().finish()
          }}
        >
          Finish session
        </button>
      </div>
    )
  }

  const label = status === 'idle' ? 'Start' : status === 'running' ? 'Pause' : 'Resume'
  return (
    <div className="mt-7 flex items-center justify-center gap-3">
      <button
        type="button"
        aria-label={label}
        className={primaryClass}
        onClick={() => {
          if (status === 'running') useTimerStore.getState().pause()
          else if (status === 'paused') useTimerStore.getState().resume()
          else {
            primeChime()
            useTimerStore.getState().start()
          }
        }}
      >
        {status === 'running' ? <Pause aria-hidden="true" size={16} /> : <Play aria-hidden="true" size={16} />}
        {label}
      </button>
      <button
        type="button"
        aria-label="Reset"
        title="Reset"
        disabled={status === 'idle'}
        className={controlsClass}
        onClick={() => {
          savePartialNotice()
          useTimerStore.getState().finish()
        }}
      >
        <RotateCcw aria-hidden="true" size={17} />
      </button>
      <button
        type="button"
        aria-label="Skip to next"
        title="Skip to next"
        disabled={status === 'idle'}
        className={controlsClass}
        onClick={() => {
          savePartialNotice()
          useTimerStore.getState().skip()
        }}
      >
        <SkipForward aria-hidden="true" size={17} />
      </button>
    </div>
  )
}
