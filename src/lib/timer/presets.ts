export type TimerModeId = 'pomodoro' | 'classic-52' | 'deep-90' | 'custom'

export interface TimerConfig {
  focusMin: number
  shortBreakMin: number
  longBreakMin: number
  sessions: number
  autoStartBreaks: boolean
  autoStartFocus: boolean
  soundNotification: boolean
  desktopNotification: boolean
}

export type TimerDurations = Pick<
  TimerConfig,
  'focusMin' | 'shortBreakMin' | 'longBreakMin' | 'sessions'
>

export const TIMER_PRESETS: Readonly<Record<Exclude<TimerModeId, 'custom'>, TimerDurations>> = {
  pomodoro: { focusMin: 25, shortBreakMin: 5, longBreakMin: 15, sessions: 4 },
  'classic-52': { focusMin: 50, shortBreakMin: 10, longBreakMin: 30, sessions: 4 },
  'deep-90': { focusMin: 90, shortBreakMin: 20, longBreakMin: 40, sessions: 3 },
}

export const DEFAULT_TIMER_TOGGLES = {
  autoStartBreaks: false,
  autoStartFocus: false,
  soundNotification: true,
  desktopNotification: false,
} as const

export function presetConfig(mode: Exclude<TimerModeId, 'custom'>): TimerConfig {
  return { ...TIMER_PRESETS[mode], ...DEFAULT_TIMER_TOGGLES }
}

export function clampConfig(config: TimerConfig): TimerConfig {
  const defaultConfig = presetConfig('pomodoro')
  return {
    focusMin: clampInteger(config.focusMin, 1, 720, defaultConfig.focusMin),
    shortBreakMin: clampInteger(config.shortBreakMin, 1, 60, defaultConfig.shortBreakMin),
    longBreakMin: clampInteger(config.longBreakMin, 1, 120, defaultConfig.longBreakMin),
    sessions: clampInteger(config.sessions, 1, 20, defaultConfig.sessions),
    autoStartBreaks: booleanOr(config.autoStartBreaks, defaultConfig.autoStartBreaks),
    autoStartFocus: booleanOr(config.autoStartFocus, defaultConfig.autoStartFocus),
    soundNotification: booleanOr(config.soundNotification, defaultConfig.soundNotification),
    desktopNotification: booleanOr(
      config.desktopNotification,
      defaultConfig.desktopNotification,
    ),
  }
}

export function phaseDurationSec(
  config: TimerConfig,
  phase: 'focus' | 'shortBreak' | 'longBreak',
): number {
  const minutes =
    phase === 'focus'
      ? config.focusMin
      : phase === 'shortBreak'
        ? config.shortBreakMin
        : config.longBreakMin
  return clampInteger(minutes, 1, phase === 'focus' ? 720 : phase === 'shortBreak' ? 60 : 120, 1) * 60
}

function clampInteger(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

function booleanOr(value: boolean, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}
