import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { z } from 'zod'
import { parseYouTubeUrl } from '@/lib/youtube/parseYouTubeUrl'

const controlsSchema = z.object({
  schemaVersion: z.literal(1),
  type: z.enum(['none', 'youtube', 'image', 'preset']),
  youtube: z.object({ url: z.string(), videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/) }).nullable(),
  brightness: z.number().min(0).max(200),
  blur: z.number().min(0).max(20),
  overlay: z.number().min(0).max(100),
  videoMuted: z.boolean(),
  videoVolume: z.number().min(0).max(100),
  videoPlaying: z.boolean(),
}).superRefine((data, context) => {
  if (data.type === 'youtube' && !data.youtube) {
    context.addIssue({ code: 'custom', message: 'A YouTube background needs a video.' })
  }
  if (data.type !== 'youtube' && data.youtube) {
    context.addIssue({ code: 'custom', message: 'A non-YouTube background cannot contain a video.' })
  }
  if (data.youtube && parseYouTubeUrl(data.youtube.url) !== data.youtube.videoId) {
    context.addIssue({ code: 'custom', message: 'The saved YouTube video is invalid.' })
  }
})

type BackgroundType = 'none' | 'youtube' | 'image' | 'preset'
interface BackgroundData {
  schemaVersion: 1
  type: BackgroundType
  youtube: { url: string; videoId: string } | null
  brightness: number
  blur: number
  overlay: number
  videoMuted: boolean
  videoVolume: number
  videoPlaying: boolean
}

const defaultState: BackgroundData = {
  schemaVersion: 1,
  type: 'none',
  youtube: null,
  brightness: 100,
  blur: 0,
  overlay: 35,
  videoMuted: true,
  videoVolume: 0,
  videoPlaying: true,
}

type SetYouTubeResult = { ok: true } | { ok: false; message: string }

type BackgroundState = BackgroundData & {
  currentVideoTitle: string
  setYouTube: (url: string) => SetYouTubeResult
  clearBackground: () => void
  setBrightness: (brightness: number) => void
  setBlur: (blur: number) => void
  setOverlay: (overlay: number) => void
  setVideoMuted: (muted: boolean) => void
  setVideoVolume: (volume: number) => void
  setVideoPlaying: (playing: boolean) => void
  setCurrentVideoTitle: (title: string) => void
  resetControls: () => void
}

function migrate(persisted: unknown, version: number): BackgroundData {
  if (version !== 1) return defaultState
  const result = controlsSchema.safeParse(persisted)
  return result.success ? { ...result.data, schemaVersion: 1 } : defaultState
}

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set) => ({
      ...defaultState,
      currentVideoTitle: '',
      setYouTube: (url) => {
        const videoId = parseYouTubeUrl(url)
        if (!videoId) return { ok: false, message: "That doesn't look like a valid YouTube URL." }
        set({ type: 'youtube', youtube: { url: url.trim(), videoId }, currentVideoTitle: '' })
        return { ok: true }
      },
      clearBackground: () => set({ type: 'none', youtube: null, currentVideoTitle: '' }),
      setBrightness: (brightness) => set({ brightness: clamp(brightness, 0, 200) }),
      setBlur: (blur) => set({ blur: clamp(blur, 0, 20) }),
      setOverlay: (overlay) => set({ overlay: clamp(overlay, 0, 100) }),
      setVideoMuted: (videoMuted) => set({ videoMuted }),
      setVideoVolume: (videoVolume) => set({ videoVolume: clamp(videoVolume, 0, 100) }),
      setVideoPlaying: (videoPlaying) => set({ videoPlaying }),
      setCurrentVideoTitle: (currentVideoTitle) => set({ currentVideoTitle }),
      resetControls: () =>
        set({
          brightness: defaultState.brightness,
          blur: defaultState.blur,
          overlay: defaultState.overlay,
          videoMuted: defaultState.videoMuted,
          videoVolume: defaultState.videoVolume,
          videoPlaying: defaultState.videoPlaying,
        }),
    }),
    {
      name: 'digilib-background',
      version: defaultState.schemaVersion,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        type: state.type,
        youtube: state.youtube,
        brightness: state.brightness,
        blur: state.blur,
        overlay: state.overlay,
        videoMuted: state.videoMuted,
        videoVolume: state.videoVolume,
        videoPlaying: state.videoPlaying,
      }),
      migrate: (persisted, version) => migrate(persisted, version) as BackgroundState,
      merge: (persisted, current) => {
        const result = controlsSchema.safeParse(persisted)
        return result.success
          ? { ...current, ...result.data, schemaVersion: defaultState.schemaVersion }
          : current
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) useBackgroundStore.setState({ ...defaultState, currentVideoTitle: '' })
      },
    },
  ),
)

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))
}

export type { BackgroundType, SetYouTubeResult }
