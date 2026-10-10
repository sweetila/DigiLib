import { create } from 'zustand'
import type { StoreApi } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { z } from 'zod'
import { describeSoundscape } from '@/lib/audio/describeSoundscape'
import {
  finish as finishTimer,
  initialRuntime,
  pause as pauseTimer,
  resetCycle as resetTimerCycle,
  resume as resumeTimer,
  skip as skipTimer,
  start as startTimer,
  tick as tickTimer,
  type TimerEvent,
  type TimerMeta,
  type TimerRuntime,
  type TimerResult,
} from '@/lib/timer/engine'
import { useSessionStore } from './useSessionStore'
import { resolveConfig, useTimerSettingsStore } from './useTimerSettingsStore'
import { useAudioStore } from './useAudioStore'

const runtimeSchema = z.object({
  schemaVersion: z.literal(1),
  status: z.enum(['idle', 'running', 'paused']),
  phase: z.enum(['focus', 'shortBreak', 'longBreak']),
  plannedSec: z.number().int().nonnegative(),
  startedAt: z.number().finite().nullable(),
  endTime: z.number().finite().nullable(),
  remainingMs: z.number().finite().nullable(),
  completedFocusInCycle: z.number().int().min(0).max(12),
  subjectId: z.string().nullable(),
  taskId: z.string().nullable(),
  soundscapeName: z.string().nullable(),
  completedNotified: z.boolean(),
}).superRefine((runtime, context) => {
  const valid =
    runtime.status === 'idle'
      ? runtime.plannedSec === 0 &&
        runtime.startedAt === null &&
        runtime.endTime === null &&
        runtime.remainingMs === null
      : runtime.plannedSec > 0 &&
        runtime.startedAt !== null &&
        (runtime.status === 'running'
          ? runtime.endTime !== null && runtime.remainingMs === null
          : runtime.endTime === null && runtime.remainingMs !== null)
  if (!valid) context.addIssue({ code: 'custom', message: 'The saved timer runtime is inconsistent.' })
})

const defaultRuntime = initialRuntime()

interface PersistedRuntime extends TimerRuntime {
  schemaVersion: 1
}

export interface TimerLastEvent {
  id: number
  type: TimerEvent
  loggedSec?: number
}

interface TimerState extends TimerRuntime {
  schemaVersion: 1
  lastEvent: TimerLastEvent | null
  start: (meta?: Omit<TimerMeta, 'soundscapeName'>) => void
  pause: () => void
  resume: () => void
  finish: () => void
  skip: () => void
  resetCycle: () => void
  tick: (now: number) => void
}

const defaultPersisted: PersistedRuntime = { schemaVersion: 1, ...defaultRuntime }
let eventId = 0

export function migrate(persisted: unknown, version: number): PersistedRuntime {
  if (version !== 1) return defaultPersisted
  const result = runtimeSchema.safeParse(persisted)
  return result.success ? result.data : defaultPersisted
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      ...defaultRuntime,
      schemaVersion: 1,
      lastEvent: null as TimerLastEvent | null,
      start: (meta = {}) => {
        const audio = useAudioStore.getState()
        const soundscapeName = describeSoundscape(
          audio.playing,
          audio.youtubePlaying ? audio.youtubeAudio : null,
        )
        applyResult(
          startTimer(
            get(),
            resolveConfig(useTimerSettingsStore.getState()),
            Date.now(),
            { ...meta, soundscapeName },
          ),
          set,
        )
      },
      pause: () => applyResult(pauseTimer(get(), Date.now()), set),
      resume: () => applyResult(resumeTimer(get(), Date.now()), set),
      finish: () =>
        applyResult(
          finishTimer(
            get(),
            resolveConfig(useTimerSettingsStore.getState()),
            Date.now(),
          ), set,
        ),
      skip: () =>
        applyResult(
          skipTimer(
            get(),
            resolveConfig(useTimerSettingsStore.getState()),
            Date.now(),
          ), set,
        ),
      resetCycle: () =>
        set({ ...resetTimerCycle(get()).state, lastEvent: null }),
      tick: (now) => {
        const current = get()
        const result = tickTimer(
          current,
          resolveConfig(useTimerSettingsStore.getState()),
          now,
        )
        if (result.state === current && !result.event && !result.logEntry) return
        applyResult(result, set)
      },
    }),
    {
      name: 'digilib-timer',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        status: state.status,
        phase: state.phase,
        plannedSec: state.plannedSec,
        startedAt: state.startedAt,
        endTime: state.endTime,
        remainingMs: state.remainingMs,
        completedFocusInCycle: state.completedFocusInCycle,
        subjectId: state.subjectId,
        taskId: state.taskId,
        soundscapeName: state.soundscapeName,
        completedNotified: state.completedNotified,
      }),
      migrate: (persisted, version) => migrate(persisted, version) as TimerState,
      merge: (persisted, current) => {
        const result = runtimeSchema.safeParse(persisted)
        return result.success
          ? { ...current, ...runtimeOnly(result.data), schemaVersion: 1 }
          : { ...current, ...defaultRuntime, schemaVersion: 1, lastEvent: null }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) useTimerStore.setState({ ...defaultRuntime, schemaVersion: 1, lastEvent: null })
      },
    },
  ),
)

function applyResult(
  result: TimerResult,
  setState: StoreApi<TimerState>['setState'],
): void {
  setState((current) => ({
    ...result.state,
    schemaVersion: 1,
    lastEvent: result.event
      ? {
          id: ++eventId,
          type: result.event,
          ...(result.logEntry && { loggedSec: result.logEntry.actualSec }),
        }
      : current.lastEvent,
  }))
  if (result.logEntry) useSessionStore.getState().addSession(result.logEntry)
}

function runtimeOnly(runtime: PersistedRuntime): TimerRuntime {
  return {
    status: runtime.status,
    phase: runtime.phase,
    plannedSec: runtime.plannedSec,
    startedAt: runtime.startedAt,
    endTime: runtime.endTime,
    remainingMs: runtime.remainingMs,
    completedFocusInCycle: runtime.completedFocusInCycle,
    subjectId: runtime.subjectId,
    taskId: runtime.taskId,
    soundscapeName: runtime.soundscapeName,
    completedNotified: runtime.completedNotified,
  }
}

export type { TimerEvent, TimerRuntime }
