import { afterEach, describe, expect, it } from 'vitest'
import { loadYouTubeApi } from './loadYouTubeApi'
import type { YouTubeNamespace, YouTubePlayer } from '@/types/youtube'

describe('loadYouTubeApi', () => {
  afterEach(() => {
    delete window.YT
    delete window.onYouTubeIframeAPIReady
    document.querySelector('script[src="https://www.youtube.com/iframe_api"]')?.remove()
  })

  it('clears a failed request so a later attempt can load the API', async () => {
    const firstRequest = loadYouTubeApi()
    const script = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    )
    expect(script).not.toBeNull()

    script?.dispatchEvent(new Event('error'))
    await expect(firstRequest).rejects.toThrow('YouTube could not be loaded.')
    expect(script?.isConnected).toBe(false)

    const secondRequest = loadYouTubeApi()
    class MockPlayer implements YouTubePlayer {
      playVideo() {}
      pauseVideo() {}
      mute() {}
      unMute() {}
      isMuted() {
        return true
      }
      setVolume() {}
      loadVideoById() {}
      cueVideoById() {}
      seekTo() {}
      getVideoData() {
        return {}
      }
      getPlayerState() {
        return 0
      }
      destroy() {}
    }
    const api = {
      Player: MockPlayer,
      PlayerState: { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 },
    } satisfies YouTubeNamespace
    window.YT = api
    window.onYouTubeIframeAPIReady?.()

    await expect(secondRequest).resolves.toBe(api)
  })
})
