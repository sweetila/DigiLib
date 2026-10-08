import { describe, expect, it, vi } from 'vitest'
import { fillBrown, fillPink, fillStereoNoise, fillWhite } from './noise'

describe.each([
  ['fillWhite', fillWhite],
  ['fillPink', fillPink],
  ['fillBrown', fillBrown],
])('%s', (_name, fill) => {
  it('fills the buffer with finite samples in [-1, 1]', () => {
    const buffer = new Float32Array(4096)

    fill(buffer)

    expect(buffer).toHaveLength(4096)
    expect(Array.from(buffer).every(Number.isFinite)).toBe(true)
    expect(Math.max(...buffer)).toBeLessThanOrEqual(1)
    expect(Math.min(...buffer)).toBeGreaterThanOrEqual(-1)
  })

  it('supports an empty buffer', () => {
    expect(() => fill(new Float32Array())).not.toThrow()
  })
})

describe('fillStereoNoise', () => {
  it('fills both channels independently', () => {
    const left = new Float32Array(4)
    const right = new Float32Array(4)
    let channel = 0
    const fill = vi.fn((buffer: Float32Array) => buffer.fill(channel++))

    fillStereoNoise(left, right, fill)

    expect(fill).toHaveBeenCalledTimes(2)
    expect(Array.from(left)).toEqual([0, 0, 0, 0])
    expect(Array.from(right)).toEqual([1, 1, 1, 1])
  })

  it('rejects mismatched channel lengths', () => {
    expect(() =>
      fillStereoNoise(new Float32Array(1), new Float32Array(2), fillWhite),
    ).toThrow('Stereo noise channels must have matching lengths')
  })
})
