import { brownSource, whiteSource } from './sources/basic'
import { deltaSource, thetaSource } from './sources/binaural'
import { cafeSource } from './sources/cafe'
import { oceanSource } from './sources/ocean'
import { rainSource } from './sources/rain'
import { windSource } from './sources/wind'

export const AUDIO_SOURCE_IDS = [
  'rain',
  'ocean',
  'cafe',
  'white',
  'brown',
  'delta',
  'theta',
  'wind',
] as const

export type AudioSourceId = (typeof AUDIO_SOURCE_IDS)[number]

export interface AudioSource {
  start(): void
  stop(): void
  setGain(gain: number): void
}

export type AudioSourceFactory = (
  ctx: AudioContext,
  destination: AudioNode,
) => AudioSource

export const audioSources: Readonly<Record<AudioSourceId, AudioSourceFactory>> =
  {
    rain: rainSource,
    ocean: oceanSource,
    cafe: cafeSource,
    white: whiteSource,
    brown: brownSource,
    delta: deltaSource,
    theta: thetaSource,
    wind: windSource,
  }
