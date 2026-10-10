import { describe, expect, it } from 'vitest'
import { clampConfig, phaseDurationSec, presetConfig } from './presets'

describe('timer presets', () => {
  it('uses the three preset durations', () => {
    expect(presetConfig('pomodoro')).toMatchObject({ focusMin: 25, shortBreakMin: 5, longBreakMin: 15, sessions: 4 })
    expect(presetConfig('classic-52')).toMatchObject({ focusMin: 52, shortBreakMin: 17, longBreakMin: 30, sessions: 4 })
    expect(presetConfig('deep-90')).toMatchObject({ focusMin: 90, shortBreakMin: 20, longBreakMin: 30, sessions: 3 })
  })

  it('clamps limits, rounds finite decimals, and defaults non-finite values', () => {
    const config = clampConfig({
      ...presetConfig('pomodoro'),
      focusMin: 999,
      shortBreakMin: 0,
      longBreakMin: Number.NaN,
      sessions: 12.7,
    })
    expect(config).toMatchObject({
      focusMin: 180,
      shortBreakMin: 1,
      longBreakMin: 15,
      sessions: 12,
    })
  })

  it('converts phase minutes to seconds', () => {
    const config = presetConfig('pomodoro')
    expect(phaseDurationSec(config, 'focus')).toBe(1500)
    expect(phaseDurationSec(config, 'shortBreak')).toBe(300)
    expect(phaseDurationSec(config, 'longBreak')).toBe(900)
  })
})
