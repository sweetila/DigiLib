import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { z } from 'zod'
import { addRecentBackground, type RecentYouTubeBackground } from '@/lib/youtube/recentBackgrounds'
import { parseYouTubeInput, parseYouTubeUrl } from '@/lib/youtube/parseYouTubeUrl'

const youtubeSchema = z.object({
  url: z.string(),
  videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  startSeconds: z.number().int().nonnegative(),
})
const recentYouTubeSchema = z.object({
  videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  url: z.string(),
  title: z.string().optional(),
  addedAt: z.number(),
})
const legacyControlsSchema = z.object({
  schemaVersion: z.literal(1),
  type: z.enum(['none', 'youtube', 'image', 'preset']),
  youtube: z.object({ url: z.string(), videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/) }).nullable(),
  brightness: z.number().min(0).max(200),
  blur: z.number().min(0).max(20),
  overlay: z.number().min(0).max(100),
  videoMuted: z.boolean(),
  videoVolume: z.number().min(0).max(100),
  videoPlaying: z.boolean(),
})
const controlsSchema = z.object({
  schemaVersion: z.literal(2),
  type: z.enum(['none', 'youtube', 'image', 'preset']),
  youtube: youtubeSchema.nullable(),
  recentYouTube: z.array(recentYouTubeSchema).max(8),
  brightness: z.number().min(0).max(200),
  blur: z.number().min(0).max(20),
  overlay: z.number().min(0).max(100),
  videoMuted: z.boolean(),
  videoVolume: z.number().min(0).max(100),
  videoPlaying: z.boolean(),
  freezeToStill: z.boolean(),
}).superRefine((data, context) => {
  if (data.type === 'youtube' && !data.youtube) {
    context.addIssue({ code: 'custom', message: 'A YouTube background needs a video.' })
  }
  if (data.type !== 'youtube' && data.youtube) {
    context.addIssue({ code: 'custom', message: 'A non-YouTube background cannot contain a video.' })
  }
  if (data.youtube) {
    const parsed = parseYouTubeInput(data.youtube.url)
    if (
      !parsed ||
      parsed.videoId !== data.youtube.videoId ||
      parsed.startSeconds !== data.youtube.startSeconds
    ) {
      context.addIssue({ code: 'custom', message: 'The saved YouTube video is invalid.' })
    }
  }
  for (const recent of data.recentYouTube) {
    if (parseYouTubeUrl(recent.url) !== recent.videoId) {
      context.addIssue({ code: 'custom', message: 'A saved recent YouTube video is invalid.' })
    }
  }
})

type BackgroundType = 'none' | 'youtube' | 'image' | 'preset'
interface BackgroundData {
  schemaVersion: 2
  type: BackgroundType
  youtube: { url: string; videoId: string; startSeconds: number } | null
  recentYouTube: RecentYouTubeBackground[]
  brightness: number
  blur: number
  overlay: number
  videoMuted: boolean
  videoVolume: number
  videoPlaying: boolean
  freezeToStill: boolean
}

const defaultState: BackgroundData = {
  schemaVersion: 2,
  type: 'none',
  youtube: null,
  recentYouTube: [],
  brightness: 100,
  blur: 0,
  overlay: 35,
  videoMuted: true,
  videoVolume: 0,
  videoPlaying: true,
  freezeToStill: false,
}

type SetYouTubeResult = { ok: true } | { ok: false; message: string }

type BackgroundState = BackgroundData & {
  currentVideoTitle: string
  setYouTube: (url: string) => SetYouTubeResult
  clearBackground: () => void
  removeRecentYouTube: (videoId: string) => void
  clearRecentYouTube: () => void
  setBrightness: (brightness: number) => void
  setBlur: (blur: number) => void
  setOverlay: (overlay: number) => void
  setVideoMuted: (muted: boolean) => void
  setVideoVolume: (volume: number) => void
  setVideoPlaying: (playing: boolean) => void
  setFreezeToStill: (freezeToStill: boolean) => void
  setCurrentVideoTitle: (title: string) => void
  resetControls: () => void
}

export function migrate(persisted: unknown, version: number): BackgroundData {
  if (version !== 1) return defaultState
  const result = legacyControlsSchema.safeParse(persisted)
  if (!result.success) return defaultState

  const previous = result.data
  const parsedYoutube = previous.youtube ? parseYouTubeInput(previous.youtube.url) : null
  const youtube =
    previous.youtube && parsedYoutube?.videoId === previous.youtube.videoId
      ? { ...previous.youtube, startSeconds: parsedYoutube.startSeconds }
      : null
  const recentYouTube = youtube
    ? addRecentBackground([], {
        videoId: youtube.videoId,
        url: youtube.url,
        addedAt: Date.now(),
      })
    : []

  return {
    ...previous,
    schemaVersion: 2,
    youtube,
    recentYouTube,
    freezeToStill: false,
  }
}

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set) => ({
      ...defaultState,
      currentVideoTitle: '',
      setYouTube: (url) => {
        const parsed = parseYouTubeInput(url)
        if (!parsed) return { ok: false, message: "That doesn't look like a valid YouTube URL." }
        const safeUrl = url.trim()
        set((state) => ({
          type: 'youtube',
          youtube: { url: safeUrl, videoId: parsed.videoId, startSeconds: parsed.startSeconds },
          recentYouTube: addRecentBackground(state.recentYouTube, {
            videoId: parsed.videoId,
            url: safeUrl,
            addedAt: Date.now(),
          }),
          currentVideoTitle: '',
        }))
        return { ok: true }
      },
      clearBackground: () => set({ type: 'none', youtube: null, currentVideoTitle: '' }),
      removeRecentYouTube: (videoId) =>
        set((state) => ({
          recentYouTube: state.recentYouTube.filter((item) => item.videoId !== videoId),
        })),
      clearRecentYouTube: () => set({ recentYouTube: [] }),
      setBrightness: (brightness) => set({ brightness: clamp(brightness, 0, 200) }),
      setBlur: (blur) => set({ blur: clamp(blur, 0, 20) }),
      setOverlay: (overlay) => set({ overlay: clamp(overlay, 0, 100) }),
      setVideoMuted: (videoMuted) => set({ videoMuted }),
      setVideoVolume: (videoVolume) => set({ videoVolume: clamp(videoVolume, 0, 100) }),
      setVideoPlaying: (videoPlaying) => set({ videoPlaying }),
      setFreezeToStill: (freezeToStill) => set({ freezeToStill }),
      setCurrentVideoTitle: (currentVideoTitle) =>
        set((state) => ({
          currentVideoTitle,
          recentYouTube: state.youtube
            ? state.recentYouTube.map((item) =>
                item.videoId === state.youtube?.videoId && currentVideoTitle
                  ? { ...item, title: currentVideoTitle }
                  : item,
              )
            : state.recentYouTube,
        })),
      resetControls: () =>
        set({
          brightness: defaultState.brightness,
          blur: defaultState.blur,
          overlay: defaultState.overlay,
          videoMuted: defaultState.videoMuted,
          videoVolume: defaultState.videoVolume,
          videoPlaying: defaultState.videoPlaying,
          freezeToStill: defaultState.freezeToStill,
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
        recentYouTube: state.recentYouTube,
        brightness: state.brightness,
        blur: state.blur,
        overlay: state.overlay,
        videoMuted: state.videoMuted,
        videoVolume: state.videoVolume,
        videoPlaying: state.videoPlaying,
        freezeToStill: state.freezeToStill,
      }),
      migrate: (persisted, version) => migrate(persisted, version) as BackgroundState,
      merge: (persisted, current) => {
        const result = controlsSchema.safeParse(persisted)
        return result.success ? { ...current, ...result.data } : current
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
