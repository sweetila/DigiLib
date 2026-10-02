const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
])

export function parseYouTubeUrl(input: string): string | null {
  const value = input.trim()
  if (VIDEO_ID_PATTERN.test(value)) return value
  if (!value || value.startsWith('//') || /[\s\\]/.test(value)) return null

  let url: URL
  try {
    url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`)
  } catch {
    return null
  }

  if (
    !['https:', 'http:'].includes(url.protocol) ||
    !YOUTUBE_HOSTS.has(url.hostname.toLowerCase()) ||
    url.hash
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

  return id && VIDEO_ID_PATTERN.test(id) ? id : null
}
