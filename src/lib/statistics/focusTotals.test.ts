import { describe, expect, it } from 'vitest'
import {
  focusSecondsOnLocalDay,
  localDayKey,
  qualifiesAsStreakDay,
} from './focusTotals'

describe('focus totals', () => {
  it('uses local date getters for the day key', () => {
    const startedAt = new Date(2026, 0, 2, 23, 50).getTime()
    expect(localDayKey(startedAt)).toBe('2026-01-02')
  })

  it('counts a late-night session on its startedAt local day', () => {
    const startedAt = new Date(2026, 0, 2, 23, 50).getTime()
    expect(
      focusSecondsOnLocalDay(
        [{ startedAt, actualSec: 600 }, { startedAt: startedAt + 20 * 60_000, actualSec: 90 }],
        '2026-01-02',
      ),
    ).toBe(600)
  })

  it('requires at least ten focused minutes for a streak day', () => {
    expect(qualifiesAsStreakDay(599)).toBe(false)
    expect(qualifiesAsStreakDay(600)).toBe(true)
  })
})
