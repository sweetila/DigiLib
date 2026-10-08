import { describe, expect, it } from 'vitest'
import { isValidSourceTuning, SOURCE_TUNING } from './tuning'

describe('SOURCE_TUNING', () => {
  it('contains finite, nonnegative tuning values', () => {
    expect(isValidSourceTuning(SOURCE_TUNING)).toBe(true)
  })

  it('rejects invalid tuning values', () => {
    expect(isValidSourceTuning({ gain: Number.NaN })).toBe(false)
    expect(isValidSourceTuning({ frequency: -1 })).toBe(false)
    expect(isValidSourceTuning({})).toBe(false)
  })

  it('requires long noise buffers and a bounded base gain per source', () => {
    expect(
      isValidSourceTuning({
        ...SOURCE_TUNING,
        noiseBufferSeconds: 7,
      }),
    ).toBe(false)
    expect(
      isValidSourceTuning({
        ...SOURCE_TUNING,
        white: { ...SOURCE_TUNING.white, baseGain: 1.5 },
      }),
    ).toBe(false)
  })
})
