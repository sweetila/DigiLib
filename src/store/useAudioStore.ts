import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { z } from 'zod'
import type { AudioSourceId } from '@/lib/audio'
import { parseYouTubeUrl } from '@/lib/youtube/parseYouTubeUrl'

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

const youtubeAudioSchema = z.object({
  url: z.string(),
  videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
}).nullable().superRefine((youtubeAudio, context) => {
  if (youtubeAudio && parseYouTubeUrl(youtubeAudio.url) !== youtubeAudio.videoId) {
    context.addIssue({ code: 'custom', message: 'The saved YouTube audio is invalid.' })
  }
})

const audioSettingsV1Schema = z.object({
  schemaVersion: z.literal(1),
  masterVolume: z.number().min(0).max(100),
  autoStart: z.boolean(),
  sources: sourcesSchema,
})

const audioSettingsSchema = z.object({
  schemaVersion: z.literal(2),
  masterVolume: z.number().min(0).max(100),
  autoStart: z.boolean(),
  sources: sourcesSchema,
  youtubeAudio: youtubeAudioSchema,
  youtubeVolume: z.number().min(0).max(100),
  youtubeMuted: z.boolean(),
})

interface AudioSettings {
  schemaVersion: 2
  masterVolume: number
  autoStart: boolean
  sources: Record<AudioSourceId, { volume: number; muted: boolean }>
  youtubeAudio: { url: string; videoId: string } | null
  youtubeVolume: number
  youtubeMuted: boolean
}

type PlayingSources = Record<AudioSourceId, boolean>

const defaultSettings: AudioSettings = {
  schemaVersion: 2,
  masterVolume: 70,
  autoStart: false,
  youtubeAudio: null,
  youtubeVolume: 70,
  youtubeMuted: false,
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
  return {
    ...defaultSettings,
    sources: { ...defaultSettings.sources },
    playing: createPlayingSources(),
    youtubePlaying: false,
  }
}

interface AudioState extends AudioSettings {
  playing: PlayingSources
  youtubePlaying: boolean
  setMasterVolume: (volume: number) => void
  setAutoStart: (autoStart: boolean) => void
  setYouTubeAudio: (url: string) => SetYouTubeAudioResult
  clearYouTubeAudio: () => void
  setYouTubeVolume: (volume: number) => void
  setYouTubeMuted: (muted: boolean) => void
  setYouTubePlaying: (playing: boolean) => void
  setSourceVolume: (id: AudioSourceId, volume: number) => void
  toggleSourceMuted: (id: AudioSourceId) => void
  toggleSourcePlaying: (id: AudioSourceId) => void
  stopAll: () => void
  resetAudio: () => void
}

export function migrate(persisted: unknown, version: number): AudioSettings {
  if (version === 2) {
    const result = audioSettingsSchema.safeParse(persisted)
    return result.success ? result.data : defaultSettings
  }
  if (version !== 1) return defaultSettings
  const result = audioSettingsV1Schema.safeParse(persisted)
  return result.success
    ? { ...result.data, ...youtubeAudioDefaults }
    : defaultSettings
}

const youtubeAudioDefaults = {
  schemaVersion: 2 as const,
  youtubeAudio: null,
  youtubeVolume: 70,
  youtubeMuted: false,
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set) => ({
      ...createDefaultState(),
      setMasterVolume: (masterVolume) => set({ masterVolume: clamp(masterVolume) }),
      setAutoStart: (autoStart) => set({ autoStart }),
      setYouTubeAudio: (url) => {
        const videoId = parseYouTubeUrl(url)
        if (!videoId) {
          return { ok: false, message: "That doesn't look like a valid YouTube URL." }
        }
        set({ youtubeAudio: { url: url.trim(), videoId }, youtubePlaying: true })
        return { ok: true }
      },
      clearYouTubeAudio: () => set({ youtubeAudio: null, youtubePlaying: false }),
      setYouTubeVolume: (youtubeVolume) => set({ youtubeVolume: clamp(youtubeVolume) }),
      setYouTubeMuted: (youtubeMuted) => set({ youtubeMuted }),
      setYouTubePlaying: (youtubePlaying) => set({ youtubePlaying }),
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
      version: defaultSettings.schemaVersion,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        masterVolume: state.masterVolume,
        autoStart: state.autoStart,
        sources: state.sources,
        youtubeAudio: state.youtubeAudio,
        youtubeVolume: state.youtubeVolume,
        youtubeMuted: state.youtubeMuted,
      }),
      migrate: (persisted, version) => migrate(persisted, version) as AudioState,
      merge: (persisted, current) => {
        const result = audioSettingsSchema.safeParse(persisted)
        return result.success
          ? {
              ...current,
              ...result.data,
              playing: createPlayingSources(),
              youtubePlaying: false,
            }
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
export type SetYouTubeAudioResult = { ok: true } | { ok: false; message: string }
