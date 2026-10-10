import { afterEach, describe, expect, it, vi } from 'vitest'
import { chimeNotes, playChime, primeChime } from './chime'

describe('chimeNotes', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns soft ascending focus notes below the duration and gain limits', () => {
    const notes = chimeNotes('focusComplete')
    expect(notes.map((note) => note.frequencyHz)).toEqual([523.25, 659.25])
    expect(Math.max(...notes.map((note) => note.peakGain))).toBeLessThanOrEqual(0.12)
    expect(Math.max(...notes.map((note) => note.startSec + note.durationSec))).toBeLessThan(1.5)
  })

  it('returns a descending pair for break completion', () => {
    const notes = chimeNotes('breakComplete')
    expect(notes[0].frequencyHz).toBeGreaterThan(notes[1].frequencyHz)
  })

  it('silently no-ops when Web Audio is unavailable or cannot be constructed', () => {
    vi.stubGlobal('AudioContext', undefined)
    expect(() => {
      primeChime()
      playChime('focusComplete')
    }).not.toThrow()
    vi.stubGlobal('AudioContext', class { constructor() { throw new Error('unavailable') } })
    expect(() => {
      primeChime()
      playChime('breakComplete')
    }).not.toThrow()
  })
})
