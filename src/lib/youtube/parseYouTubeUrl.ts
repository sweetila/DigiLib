const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
])

export interface ParsedYouTubeInput {
  videoId: string
  startSeconds: number
}

export function parseYouTubeInput(input: string): ParsedYouTubeInput | null {
  const value = input.trim()
  if (VIDEO_ID_PATTERN.test(value)) return { videoId: value, startSeconds: 0 }
  if (!value || value.startsWith('//') || /[\s\\]/.test(value)) return null

  let url: URL
  try {
    url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`)
  } catch {
    return null
  }

  if (
    !['https:', 'http:'].includes(url.protocol) ||
    !YOUTUBE_HOSTS.has(url.hostname.toLowerCase())
  ) {
    return null
  }

  const segments = url.pathname.split('/').filter(Boolean)
  let id: string | null = null
  if (url.hostname.toLowerCase().endsWith('youtu.be')) {
    id = segments.length === 1 ? segments[0] : null
  } else if (url.pathname === '/watch') {
    id = url.searchParams.get('v')
  } else if (segments.length === 2 && ['embed', 'shorts'].includes(segments[0] ?? '')) {
    id = segments[1] ?? null
  }

  if (!id || !VIDEO_ID_PATTERN.test(id)) return null
  const startSeconds = parseStartSeconds(
    url.searchParams.get('t') ??
      url.searchParams.get('start') ??
      (url.hash.startsWith('#t=') ? url.hash.slice(3) : null),
  )
  if (url.hash && !url.hash.startsWith('#t=')) return null
  return { videoId: id, startSeconds }
}

export function parseYouTubeUrl(input: string): string | null {
  return parseYouTubeInput(input)?.videoId ?? null
}

function parseStartSeconds(value: string | null): number {
  if (!value) return 0
  if (/^\d+$/.test(value)) {
    const seconds = Number(value)
    return Number.isSafeInteger(seconds) ? seconds : 0
  }
  const seconds = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
  if (!seconds || !seconds[0] || !/[hms]/.test(value)) return 0
  const total =
    Number(seconds[1] ?? 0) * 3600 +
    Number(seconds[2] ?? 0) * 60 +
    Number(seconds[3] ?? 0)
  return Number.isSafeInteger(total) ? total : 0
}
