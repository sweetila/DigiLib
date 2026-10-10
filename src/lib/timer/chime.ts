export type ChimeKind = 'focusComplete' | 'breakComplete'

export interface ChimeNote {
  frequencyHz: number
  startSec: number
  durationSec: number
  peakGain: number
}

export function chimeNotes(kind: ChimeKind): ChimeNote[] {
  const firstFrequency = kind === 'focusComplete' ? 523.25 : 659.25
  const secondFrequency = kind === 'focusComplete' ? 659.25 : 523.25
  return [
    { frequencyHz: firstFrequency, startSec: 0, durationSec: 0.34, peakGain: 0.1 },
    { frequencyHz: secondFrequency, startSec: 0.38, durationSec: 0.48, peakGain: 0.1 },
  ]
}

let context: AudioContext | null = null

function getContext(): AudioContext | null {
  try {
    if (typeof globalThis.AudioContext !== 'function') return null
    context ??= new AudioContext()
    return context
  } catch {
    return null
  }
}

export function primeChime(): void {
  const audio = getContext()
  if (!audio) return
  try {
    const resume = audio.resume()
    void resume.catch(() => {})
  } catch {
    return
  }
}

export function playChime(kind: ChimeKind): void {
  const audio = getContext()
  if (!audio) return
  try {
    const startAt = audio.currentTime
    for (const note of chimeNotes(kind)) {
      const oscillator = audio.createOscillator()
      const gain = audio.createGain()
      const start = startAt + note.startSec
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(note.frequencyHz, start)
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(note.peakGain, start + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.001, start + note.durationSec)
      oscillator.connect(gain)
      gain.connect(audio.destination)
      oscillator.start(start)
      oscillator.stop(start + note.durationSec)
    }
  } catch {
    return
  }
}
