import { describe, expect, it } from 'vitest'
import {
  elapsedSec,
  finish,
  initialRuntime,
  pause,
  remainingMs,
  resetCycle,
  resume,
  skip,
  start,
  tick,
} from './engine'
import { presetConfig } from './presets'

const config = (overrides: Partial<ReturnType<typeof presetConfig>> = {}) => ({
  ...presetConfig('pomodoro'),
  focusMin: 1,
  shortBreakMin: 1,
  longBreakMin: 2,
  ...overrides,
})

describe('timer engine', () => {
  it('computes remaining time from endTime and excludes paused time', () => {
    const running = start(initialRuntime(), config(), 1_000, { subjectId: 'math' }).state
    expect(remainingMs(running, 11_000)).toBe(50_000)
    const paused = pause(running, 11_000).state
    expect(paused.remainingMs).toBe(50_000)
    const resumed = resume(paused, 100_000).state
    expect(resumed.endTime).toBe(150_000)
    expect(elapsedSec(resumed, 125_000)).toBe(35)
    expect(elapsedSec(paused, 500_000)).toBe(10)
  })

  it('emits focus completion once when continuing into overtime', () => {
    const running = start(initialRuntime(), config(), 10_000).state
    const complete = tick(running, config(), 70_000)
    expect(complete.event).toBe('focusComplete')
    expect(complete.state.status).toBe('running')
    expect(tick(complete.state, config(), 80_000).event).toBeUndefined()
    expect(elapsedSec(complete.state, 80_000)).toBe(70)
  })

  it('preserves accumulated overtime across a pause and excludes paused time', () => {
    const running = start(initialRuntime(), config(), 0).state
    const paused = pause(running, 65_000).state
    expect(paused.remainingMs).toBe(-5_000)
    expect(elapsedSec(paused, 90_000)).toBe(65)
    const resumed = resume(paused, 100_000).state
    expect(resumed.endTime).toBe(95_000)
    expect(elapsedSec(resumed, 105_000)).toBe(70)
  })

  it('logs and starts a break when auto-start breaks is enabled', () => {
    const settings = config({ autoStartBreaks: true })
    const running = start(initialRuntime(), settings, 0).state
    const result = tick(running, settings, 60_000)
    expect(result).toMatchObject({
      event: 'focusComplete',
      logEntry: { startedAt: 0, plannedSec: 60, actualSec: 60, completed: true },
      state: { status: 'running', phase: 'shortBreak', plannedSec: 60, completedFocusInCycle: 1 },
    })
    expect(tick(running, settings, 65_000).logEntry?.actualSec).toBe(65)
  })

  it('completes a break and optionally starts the next focus phase', () => {
    const settings = config({ autoStartFocus: true })
    const focus = start(initialRuntime(), settings, 0).state
    const breakState = tick(focus, { ...settings, autoStartBreaks: true }, 60_000).state
    const result = tick(breakState, settings, 120_000)
    expect(result).toMatchObject({
      event: 'breakComplete',
      state: { status: 'running', phase: 'focus', plannedSec: 60 },
    })
  })

  it('caps overtime at thirty minutes and moves idle to the next break', () => {
    const running = start(initialRuntime(), config(), 0).state
    const capTime = (running.endTime ?? 0) + 1_800_000
    const result = tick(running, config(), capTime)
    expect(result.event).toBe('overtimeCapped')
    expect(result.logEntry).toMatchObject({ actualSec: 1860, completed: true })
    expect(result.state).toMatchObject({ status: 'idle', phase: 'shortBreak', plannedSec: 0 })
  })

  it('discards accidental finishes and logs a 14-minute partial finish', () => {
    const running = start(initialRuntime(), config({ focusMin: 25 }), 0).state
    expect(finish(running, config(), 9_000).logEntry).toBeUndefined()
    expect(finish(running, config(), 14 * 60_000).logEntry).toMatchObject({
      plannedSec: 1500,
      actualSec: 840,
      completed: false,
    })
  })

  it('skips focus into a break and skips a break into focus', () => {
    const running = start(initialRuntime(), config(), 0).state
    const focusSkip = skip(running, config(), 15_000)
    expect(focusSkip).toMatchObject({
      logEntry: { actualSec: 15, completed: false },
      state: { status: 'idle', phase: 'shortBreak', completedFocusInCycle: 1 },
    })
    expect(skip(focusSkip.state, config(), 20_000).state).toMatchObject({
      status: 'idle',
      phase: 'focus',
      completedFocusInCycle: 1,
    })
  })

  it('selects a long break after the configured number of skipped focuses', () => {
    const settings = config({ sessions: 2 })
    const first = skip(initialRuntime(), settings, 0).state
    const second = skip({ ...first, phase: 'focus' }, settings, 0).state
    expect(second).toMatchObject({ phase: 'longBreak', completedFocusInCycle: 0 })
  })

  it('does not advance the cycle on reset', () => {
    const running = start({ ...initialRuntime(), completedFocusInCycle: 2 }, config(), 0).state
    expect(resetCycle(running).state).toMatchObject({
      status: 'idle',
      phase: 'focus',
      completedFocusInCycle: 0,
    })
    expect(finish(running, config(), 60_000).state.completedFocusInCycle).toBe(2)
  })

  it('accounts for a sleeping tab from wall-clock timestamps', () => {
    const running = start(initialRuntime(), config(), 0).state
    const afterSleep = tick(running, config(), 60_000 + 45_000)
    expect(afterSleep.event).toBe('focusComplete')
    expect(elapsedSec(afterSleep.state, 60_000 + 45_000)).toBe(105)
    const capped = tick(afterSleep.state, config(), 60_000 + 1_800_000)
    expect(capped.event).toBe('overtimeCapped')
    expect(capped.logEntry?.actualSec).toBe(1860)
  })
})
