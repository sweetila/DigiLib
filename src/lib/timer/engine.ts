import { MAX_OVERTIME_SEC, MIN_LOGGED_SEC } from './constants'
import { phaseDurationSec, type TimerConfig } from './presets'

export type Phase = 'focus' | 'shortBreak' | 'longBreak'
export type Status = 'idle' | 'running' | 'paused'
export type TimerEvent = 'focusComplete' | 'breakComplete' | 'overtimeCapped'

export interface TimerRuntime {
  status: Status
  phase: Phase
  plannedSec: number
  startedAt: number | null
  endTime: number | null
  remainingMs: number | null
  completedFocusInCycle: number
  subjectId: string | null
  taskId: string | null
  soundscapeName: string | null
  completedNotified: boolean
}

export interface SessionDraft {
  startedAt: number
  plannedSec: number
  actualSec: number
  completed: boolean
  subjectId?: string
  taskId?: string
  soundscapeName?: string
}

export interface TimerMeta {
  subjectId?: string | null
  taskId?: string | null
  soundscapeName?: string | null
}

export interface TimerResult {
  state: TimerRuntime
  logEntry?: SessionDraft
  event?: TimerEvent
}

export function initialRuntime(): TimerRuntime {
  return {
    status: 'idle',
    phase: 'focus',
    plannedSec: 0,
    startedAt: null,
    endTime: null,
    remainingMs: null,
    completedFocusInCycle: 0,
    subjectId: null,
    taskId: null,
    soundscapeName: null,
    completedNotified: false,
  }
}

export function remainingMs(state: TimerRuntime, now: number): number {
  if (state.status === 'running' && state.endTime !== null) return state.endTime - now
  if (state.status === 'paused' && state.remainingMs !== null) return state.remainingMs
  return 0
}

export function elapsedSec(state: TimerRuntime, now: number): number {
  if (state.status === 'idle') return 0
  return Math.max(0, Math.floor((state.plannedSec * 1000 - remainingMs(state, now)) / 1000))
}

export function start(
  state: TimerRuntime,
  config: TimerConfig,
  now: number,
  meta: TimerMeta = {},
): TimerResult {
  if (state.status !== 'idle') return { state }
  const plannedSec = phaseDurationSec(config, state.phase)
  return {
    state: {
      ...state,
      status: 'running',
      plannedSec,
      startedAt: now,
      endTime: now + plannedSec * 1000,
      remainingMs: null,
      subjectId: meta.subjectId ?? null,
      taskId: meta.taskId ?? null,
      soundscapeName: meta.soundscapeName ?? null,
      completedNotified: false,
    },
  }
}

export function pause(state: TimerRuntime, now: number): TimerResult {
  if (state.status !== 'running' || state.endTime === null) return { state }
  return {
    state: {
      ...state,
      status: 'paused',
      remainingMs: state.endTime - now,
      endTime: null,
    },
  }
}

export function resume(state: TimerRuntime, now: number): TimerResult {
  if (state.status !== 'paused' || state.remainingMs === null) return { state }
  return {
    state: {
      ...state,
      status: 'running',
      endTime: now + state.remainingMs,
      remainingMs: null,
    },
  }
}

export function tick(state: TimerRuntime, config: TimerConfig, now: number): TimerResult {
  if (state.status !== 'running') return { state }
  const remaining = remainingMs(state, now)

  if (state.phase === 'focus') {
    if (remaining > 0) return { state }
    const overtimeSec = Math.floor(Math.max(0, -remaining) / 1000)
    if (!config.autoStartBreaks && overtimeSec >= MAX_OVERTIME_SEC) {
      const { phase, completedFocusInCycle } = advanceCycle(state.completedFocusInCycle, config.sessions)
      return {
        state: idleAtPhase(state, phase, completedFocusInCycle),
        logEntry: makeDraft(state, state.plannedSec + MAX_OVERTIME_SEC, true),
        event: 'overtimeCapped',
      }
    }

    if (!config.autoStartBreaks) {
      return state.completedNotified
        ? { state }
        : { state: { ...state, completedNotified: true }, event: 'focusComplete' }
    }

    const { phase, completedFocusInCycle } = advanceCycle(state.completedFocusInCycle, config.sessions)
    const breakState = idleAtPhase(state, phase, completedFocusInCycle)
    const nextState = start(breakState, config, now, {
      subjectId: state.subjectId,
      taskId: state.taskId,
      soundscapeName: state.soundscapeName,
    }).state
    return {
      state: nextState,
      logEntry: makeDraft(state, state.plannedSec + overtimeSec, true),
      event: 'focusComplete',
    }
  }

  if (remaining > 0) return { state }
  const next = idleAtPhase(state, 'focus', state.completedFocusInCycle)
  const nextState = config.autoStartFocus ? start(next, config, now).state : next
  return { state: nextState, event: 'breakComplete' }
}

export function finish(state: TimerRuntime, _config: TimerConfig, now: number): TimerResult {
  const logEntry =
    state.phase === 'focus' && elapsedSec(state, now) >= MIN_LOGGED_SEC
      ? makeDraft(state, elapsedSec(state, now), elapsedSec(state, now) >= state.plannedSec)
      : undefined
  return { state: idleAtPhase(state, 'focus', state.completedFocusInCycle), ...(logEntry && { logEntry }) }
}

export function skip(state: TimerRuntime, config: TimerConfig, now: number): TimerResult {
  if (state.phase !== 'focus') {
    return { state: idleAtPhase(state, 'focus', state.completedFocusInCycle) }
  }
  const actualSec = elapsedSec(state, now)
  const logEntry = actualSec >= MIN_LOGGED_SEC ? makeDraft(state, actualSec, actualSec >= state.plannedSec) : undefined
  const { phase, completedFocusInCycle } = advanceCycle(
    state.completedFocusInCycle,
    config.sessions,
  )
  return {
    state: idleAtPhase(state, phase, completedFocusInCycle),
    ...(logEntry && { logEntry }),
  }
}

export function resetCycle(state: TimerRuntime): TimerResult {
  return { state: idleAtPhase(state, 'focus', 0) }
}

function advanceCycle(
  completedFocusInCycle: number,
  sessions: number,
): { phase: 'shortBreak' | 'longBreak'; completedFocusInCycle: number } {
  const completed = completedFocusInCycle + 1
  return completed >= sessions
    ? { phase: 'longBreak', completedFocusInCycle: 0 }
    : { phase: 'shortBreak', completedFocusInCycle: completed }
}

function idleAtPhase(state: TimerRuntime, phase: Phase, completedFocusInCycle: number): TimerRuntime {
  return {
    ...state,
    status: 'idle',
    phase,
    plannedSec: 0,
    startedAt: null,
    endTime: null,
    remainingMs: null,
    completedFocusInCycle,
    subjectId: null,
    taskId: null,
    soundscapeName: null,
    completedNotified: false,
  }
}

function makeDraft(state: TimerRuntime, actualSec: number, completed: boolean): SessionDraft {
  return {
    startedAt: state.startedAt ?? 0,
    plannedSec: state.plannedSec,
    actualSec,
    completed,
    ...(state.subjectId !== null && { subjectId: state.subjectId }),
    ...(state.taskId !== null && { taskId: state.taskId }),
    ...(state.soundscapeName !== null && { soundscapeName: state.soundscapeName }),
  }
}
