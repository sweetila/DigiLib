import { describe, expect, it } from 'vitest'
import { formatClock, formatDuration, formatOvertime, ringProgress } from './format'

describe('timer formatting', () => {
  it('rounds positive clock time up and formats hours', () => {
    expect(formatClock(24 * 60_000 + 37_400)).toBe('24:38')
    expect(formatClock(3_600_000)).toBe('1:00:00')
    expect(formatClock(0)).toBe('00:00')
  })

  it('formats overtime and durations', () => {
    expect(formatOvertime(-1)).toBe('+00:01')
    expect(formatOvertime(-65_000)).toBe('+01:05')
    expect(formatDuration(5100)).toBe('1h 25m')
    expect(formatDuration(1500)).toBe('25m')
    expect(formatDuration(45)).toBe('45s')
  })

  it('clamps ring progress to its planned interval', () => {
    expect(ringProgress(60, 60_000)).toBe(0)
    expect(ringProgress(60, 30_000)).toBe(0.5)
    expect(ringProgress(60, -2_000)).toBe(1)
    expect(ringProgress(0, 0)).toBe(0)
  })
})
