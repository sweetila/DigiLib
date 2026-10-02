import type { YouTubeNamespace } from '@/types/youtube'

let apiPromise: Promise<YouTubeNamespace> | null = null

export function loadYouTubeApi(): Promise<YouTubeNamespace> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('YouTube video playback is only available in a browser.'))
  }
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise<YouTubeNamespace>((resolve, reject) => {
    let settled = false
    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      if (error) reject(error)
      else if (window.YT?.Player) resolve(window.YT)
      else reject(new Error('YouTube could not be started. Please check your connection and try again.'))
    }
    const previousCallback = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      finish()
      previousCallback?.()
    }
    const timeout = window.setTimeout(
      () => finish(new Error('YouTube is taking too long to load. Check your connection and try again.')),
      10_000,
    )

    let script = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]')
    if (!script) {
      script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      script.onerror = () =>
        finish(new Error('YouTube could not be loaded. Check your connection and try again.'))
      document.head.appendChild(script)
    }
  })
  return apiPromise
}
