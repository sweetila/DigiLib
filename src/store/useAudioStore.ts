import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { z } from 'zod'
import type { AudioSourceId } from '@/lib/audio'

const sourceSettingsSchema = z.object({
  volume: z.number().min(0).max(100),
  muted: z.boolean(),
})

const sourcesSchema = z.object({
  rain: sourceSettingsSchema,
  ocean: sourceSettingsSchema,
  cafe: sourceSettingsSchema,
  white: sourceSettingsSchema,
  brown: sourceSettingsSchema,
  delta: sourceSettingsSchema,
  theta: sourceSettingsSchema,
  wind: sourceSettingsSchema,
})

const audioSettingsSchema = z.object({
  schemaVersion: z.literal(1),
  masterVolume: z.number().min(0).max(100),
  autoStart: z.boolean(),
  sources: sourcesSchema,
})

interface AudioSettings {
  schemaVersion: 1
  masterVolume: number
  autoStart: boolean
  sources: Record<AudioSourceId, { volume: number; muted: boolean }>
}

type PlayingSources = Record<AudioSourceId, boolean>

const defaultSettings: AudioSettings = {
  schemaVersion: 1,
  masterVolume: 70,
  autoStart: false,
  sources: {
    rain: { volume: 70, muted: false },
    ocean: { volume: 30, muted: false },
    cafe: { volume: 70, muted: false },
    white: { volume: 70, muted: false },
    brown: { volume: 70, muted: false },
    delta: { volume: 70, muted: false },
    theta: { volume: 70, muted: false },
    wind: { volume: 70, muted: false },
  },
}

function createPlayingSources(): PlayingSources {
  return {
    rain: false,
    ocean: false,
    cafe: false,
    white: false,
    brown: false,
    delta: false,
    theta: false,
    wind: false,
  }
}

function createDefaultState() {
  return { ...defaultSettings, sources: { ...defaultSettings.sources }, playing: createPlayingSources() }
}

interface AudioState extends AudioSettings {
  playing: PlayingSources
  setMasterVolume: (volume: number) => void
  setAutoStart: (autoStart: boolean) => void
  setSourceVolume: (id: AudioSourceId, volume: number) => void
  toggleSourceMuted: (id: AudioSourceId) => void
  toggleSourcePlaying: (id: AudioSourceId) => void
  stopAll: () => void
  resetAudio: () => void
}

export function migrate(persisted: unknown, version: number): AudioSettings {
  if (version !== 1) return defaultSettings
  const result = audioSettingsSchema.safeParse(persisted)
  return result.success ? result.data : defaultSettings
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set) => ({
      ...createDefaultState(),
      setMasterVolume: (masterVolume) => set({ masterVolume: clamp(masterVolume) }),
      setAutoStart: (autoStart) => set({ autoStart }),
      setSourceVolume: (id, volume) =>
        set((state) => ({
          sources: {
            ...state.sources,
            [id]: { ...state.sources[id], volume: clamp(volume) },
          },
        })),
      toggleSourceMuted: (id) =>
        set((state) => ({
          sources: {
            ...state.sources,
            [id]: { ...state.sources[id], muted: !state.sources[id].muted },
          },
        })),
      toggleSourcePlaying: (id) =>
        set((state) => ({ playing: { ...state.playing, [id]: !state.playing[id] } })),
      stopAll: () => set({ playing: createPlayingSources() }),
      resetAudio: () => set(createDefaultState()),
    }),
    {
      name: 'digilib-audio',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        masterVolume: state.masterVolume,
        autoStart: state.autoStart,
        sources: state.sources,
      }),
      migrate: (persisted, version) => migrate(persisted, version) as AudioState,
      merge: (persisted, current) => {
        const result = audioSettingsSchema.safeParse(persisted)
        return result.success
          ? { ...current, ...result.data, playing: createPlayingSources() }
          : { ...current, ...createDefaultState() }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) useAudioStore.setState(createDefaultState())
      },
    },
  ),
)

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0))
}

export type { AudioSettings }
