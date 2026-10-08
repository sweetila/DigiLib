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
    let script: HTMLScriptElement | null = null
    const previousCallback = window.onYouTubeIframeAPIReady
    let readyCallback: (() => void) | null = null
    const restoreCallback = () => {
      if (window.onYouTubeIframeAPIReady === readyCallback) {
        window.onYouTubeIframeAPIReady = previousCallback
      }
    }
    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      restoreCallback()
      if (error) {
        script?.removeEventListener('error', handleScriptError)
        script?.remove()
        reject(error)
      } else if (window.YT?.Player) resolve(window.YT)
      else reject(new Error('YouTube could not be started. Please check your connection and try again.'))
    }
    const handleScriptError = () =>
      finish(new Error('YouTube could not be loaded. Check your connection and try again.'))
    readyCallback = () => {
      finish()
      previousCallback?.()
    }
    window.onYouTubeIframeAPIReady = readyCallback
    const timeout = window.setTimeout(
      () => finish(new Error('YouTube is taking too long to load. Check your connection and try again.')),
      10_000,
    )

    script = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]')
    if (!script) {
      script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
    }
    script.addEventListener('error', handleScriptError, { once: true })
    if (!script.isConnected) document.head.appendChild(script)
  }).catch((error: unknown) => {
    apiPromise = null
    throw error
  })
  return apiPromise
}
