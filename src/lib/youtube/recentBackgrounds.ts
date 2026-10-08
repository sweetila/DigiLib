export interface RecentYouTubeBackground {
  videoId: string
  url: string
  title?: string
  addedAt: number
}

const MAX_RECENT_BACKGROUNDS = 8

export function addRecentBackground(
  recents: RecentYouTubeBackground[],
  recent: RecentYouTubeBackground,
): RecentYouTubeBackground[] {
  const existing = recents.find((item) => item.videoId === recent.videoId)
  const title = recent.title ?? existing?.title
  const next = {
    ...recent,
    ...(title ? { title } : {}),
  }
  return [next, ...recents.filter((item) => item.videoId !== recent.videoId)].slice(
    0,
    MAX_RECENT_BACKGROUNDS,
  )
}
