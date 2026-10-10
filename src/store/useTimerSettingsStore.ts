import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { z } from 'zod'
import {
  clampConfig,
  DEFAULT_TIMER_TOGGLES,
  presetConfig,
  TIMER_PRESETS,
  type TimerConfig,
  type TimerDurations,
  type TimerModeId,
} from '@/lib/timer/presets'

const durationsSchema = z.object({
  focusMin: z.number().int().min(1).max(180),
  shortBreakMin: z.number().int().min(1).max(60),
  longBreakMin: z.number().int().min(1).max(90),
  sessions: z.number().int().min(1).max(12),
})

const settingsSchema = z.object({
  schemaVersion: z.literal(1),
  mode: z.enum(['pomodoro', 'classic-52', 'deep-90', 'custom']),
  custom: durationsSchema,
  autoStartBreaks: z.boolean(),
  autoStartFocus: z.boolean(),
  soundNotification: z.boolean(),
  desktopNotification: z.boolean(),
})

export interface TimerSettings {
  schemaVersion: 1
  mode: TimerModeId
  custom: TimerDurations
  autoStartBreaks: boolean
  autoStartFocus: boolean
  soundNotification: boolean
  desktopNotification: boolean
}

const defaultSettings: TimerSettings = {
  schemaVersion: 1,
  mode: 'pomodoro',
  custom: { ...TIMER_PRESETS.pomodoro },
  ...DEFAULT_TIMER_TOGGLES,
}

type ToggleKey = keyof typeof DEFAULT_TIMER_TOGGLES

interface TimerSettingsState extends TimerSettings {
  setMode: (mode: TimerModeId) => void
  setCustomConfig: (config: TimerDurations) => void
  setToggle: (toggle: ToggleKey, value: boolean) => void
  resetSettings: () => void
}

export function migrate(persisted: unknown, version: number): TimerSettings {
  if (version !== 1) return defaultSettings
  const result = settingsSchema.safeParse(persisted)
  return result.success ? result.data : defaultSettings
}

export function resolveConfig(settings: Pick<
  TimerSettings,
  | 'mode'
  | 'custom'
  | 'autoStartBreaks'
  | 'autoStartFocus'
  | 'soundNotification'
  | 'desktopNotification'
>): TimerConfig {
  const durations = settings.mode === 'custom' ? settings.custom : presetConfig(settings.mode)
  return clampConfig({
    ...durations,
    autoStartBreaks: settings.autoStartBreaks,
    autoStartFocus: settings.autoStartFocus,
    soundNotification: settings.soundNotification,
    desktopNotification: settings.desktopNotification,
  })
}

export const useTimerSettingsStore = create<TimerSettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setMode: (mode) => set({ mode }),
      setCustomConfig: (custom) =>
        set({
          custom: {
            focusMin: clampConfig({ ...custom, ...DEFAULT_TIMER_TOGGLES }).focusMin,
            shortBreakMin: clampConfig({ ...custom, ...DEFAULT_TIMER_TOGGLES }).shortBreakMin,
            longBreakMin: clampConfig({ ...custom, ...DEFAULT_TIMER_TOGGLES }).longBreakMin,
            sessions: clampConfig({ ...custom, ...DEFAULT_TIMER_TOGGLES }).sessions,
          },
        }),
      setToggle: (toggle, value) => set({ [toggle]: value }),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'digilib-timer-settings',
      version: defaultSettings.schemaVersion,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        mode: state.mode,
        custom: state.custom,
        autoStartBreaks: state.autoStartBreaks,
        autoStartFocus: state.autoStartFocus,
        soundNotification: state.soundNotification,
        desktopNotification: state.desktopNotification,
      }),
      migrate: (persisted, version) => migrate(persisted, version) as TimerSettingsState,
      merge: (persisted, current) => {
        const result = settingsSchema.safeParse(persisted)
        return result.success
          ? { ...current, ...result.data }
          : { ...current, ...defaultSettings }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) useTimerSettingsStore.setState(defaultSettings)
      },
    },
  ),
)

export type { TimerModeId }
