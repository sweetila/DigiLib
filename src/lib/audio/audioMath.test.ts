import { describe, expect, it } from 'vitest'
import { lookaheadWindow, randomRange, scheduleTime } from './audioMath'

describe('randomRange', () => {
  it('maps a normalized random sample into the requested range', () => {
    expect(randomRange(4, 12, 0)).toBe(4)
    expect(randomRange(4, 12, 0.5)).toBe(8)
    expect(randomRange(4, 12, 1)).toBe(12)
  })

  it('clamps random samples to normalized bounds', () => {
    expect(randomRange(4, 12, -1)).toBe(4)
    expect(randomRange(4, 12, 2)).toBe(12)
  })
})

describe('scheduler timing', () => {
  it('calculates the lookahead window from audio time', () => {
    expect(lookaheadWindow(10, 0.12)).toEqual({ start: 10, end: 10.12 })
  })

  it('chooses an audio-clock schedule time with sufficient lead', () => {
    expect(scheduleTime(10.12, 10, 0.015)).toBe(10.12)
    expect(scheduleTime(10.01, 10, 0.015)).toBe(10.015)
  })
})
