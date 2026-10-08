import { describe, expect, it } from 'vitest'
import { effectiveGain } from './mixer'

describe('effectiveGain', () => {
  it('applies the squared volume curve and master gain', () => {
    expect(effectiveGain(0.5, 0.5, false)).toBe(0.125)
  })

  it('returns zero when muted', () => {
    expect(effectiveGain(1, 1, true)).toBe(0)
  })

  it.each([
    [-1, 0.5, 0],
    [2, 0.5, 0.25],
    [0.5, -1, 0],
    [0.5, 2, 0.5],
    [Number.NaN, 1, 0],
    [1, Number.POSITIVE_INFINITY, 0],
  ])('clamps inputs (%s, %s)', (master, volume, expected) => {
    expect(effectiveGain(master, volume, false)).toBe(expected)
  })
})
