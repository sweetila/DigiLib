import { describe, expect, it } from 'vitest'
import { shouldFallbackStillFrame } from './stillFrame'

describe('shouldFallbackStillFrame', () => {
  it('falls back when YouTube serves its small missing-thumbnail placeholder', () => {
    expect(shouldFallbackStillFrame(120)).toBe(true)
    expect(shouldFallbackStillFrame(200)).toBe(true)
  })

  it('keeps the high-resolution thumbnail when it has usable dimensions', () => {
    expect(shouldFallbackStillFrame(201)).toBe(false)
    expect(shouldFallbackStillFrame(1280)).toBe(false)
  })
})
