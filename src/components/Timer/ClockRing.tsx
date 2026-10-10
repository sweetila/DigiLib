import { ringProgress } from '@/lib/timer'
import SessionDots from './SessionDots'

interface ClockRingProps {
  label: string
  time: string
  plannedSec: number
  remainingMs: number
  idle: boolean
  overtime: boolean
  completed: number
  sessions: number
  glowId: number
}

const SIZE = 260
const CENTER = SIZE / 2
const RADIUS = 126
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function ClockRing({
  label,
  time,
  plannedSec,
  remainingMs,
  idle,
  overtime,
  completed,
  sessions,
  glowId,
}: ClockRingProps) {
  const progress = idle ? 0 : overtime ? 1 : ringProgress(plannedSec, remainingMs)
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className="relative mx-auto size-[260px]">
      <svg
        key={glowId}
        aria-hidden="true"
        className={`absolute inset-0 -rotate-90 ${glowId ? 'motion-safe:animate-[focus-glow_1.2s_ease-out_1]' : ''}`}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
      >
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="2"
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--mode-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-[250ms] motion-safe:ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.24em] text-text/65">{label}</p>
        <p
          role="timer"
          aria-live="off"
          className={`m-0 font-display font-light tabular-nums tracking-normal text-text drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)] ${time.length > 5 ? 'text-5xl' : 'text-6xl'}`}
        >
          {time}
        </p>
        <SessionDots completed={completed} sessions={sessions} />
      </div>
    </div>
  )
}
