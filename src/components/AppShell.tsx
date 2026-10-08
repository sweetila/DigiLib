import { useEffect } from 'react'
import YouTubeAudioPlayer from '@/components/Audio/YouTubeAudioPlayer'
import { BackgroundLayer } from '@/components/Background'
import PanelHost from '@/components/PanelHost'
import Toolbar from '@/components/Toolbar/Toolbar'
import { useUIStore } from '@/store/useUIStore'
import { useBackgroundStore } from '@/store/useBackgroundStore'

export default function AppShell() {
  const activePanel = useUIStore((state) => state.activePanel)
  const closePanel = useUIStore((state) => state.closePanel)
  const overlay = useBackgroundStore((state) => state.overlay)

  useEffect(() => {
    if (!activePanel) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePanel()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activePanel, closePanel])

  return (
    <main className="fixed inset-0 overflow-hidden bg-bg text-text">
      <div className="fixed inset-0 z-0 overflow-hidden">
        <BackgroundLayer />
      </div>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-10 bg-black"
        style={{ opacity: overlay / 100 }}
      />
      <div className="fixed inset-0 z-20">
        <section
          aria-label="Focus clock"
          className="absolute left-1/2 top-[13vh] -translate-x-1/2 text-center"
        >
          <p className="m-0 text-6xl font-medium tabular-nums tracking-normal text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)] sm:text-7xl">
            25:00
          </p>
          <p className="mt-3 text-sm text-white/65">Ready when you are.</p>
        </section>
        <YouTubeAudioPlayer>
          <PanelHost />
          <Toolbar />
        </YouTubeAudioPlayer>
      </div>
    </main>
  )
}