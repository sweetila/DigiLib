import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { X } from 'lucide-react'
import GlassPanel from '@/components/ui/GlassPanel'
import IconButton from '@/components/ui/IconButton'
import { useUIStore, type PanelId } from '@/store/useUIStore'

const panels: Record<PanelId, LazyExoticComponent<ComponentType>> = {
  timer: lazy(() => import('@/components/Timer/Panel')),
  tasks: lazy(() => import('@/components/Todo/Panel')),
  sounds: lazy(() => import('@/components/Audio/Panel')),
  notes: lazy(() => import('@/components/Notes/Panel')),
  stats: lazy(() => import('@/components/Stats/Panel')),
  background: lazy(() => import('@/components/Background/Panel')),
  scenes: lazy(() => import('@/components/Scenes/Panel')),
  settings: lazy(() => import('@/components/Settings/Panel')),
}

const titles: Record<PanelId, string> = {
  timer: 'Timer',
  tasks: 'Tasks',
  sounds: 'Sounds',
  notes: 'Notes',
  stats: 'Statistics',
  background: 'Background',
  scenes: 'Scenes',
  settings: 'Settings',
}

export default function PanelHost() {
  const activePanel = useUIStore((state) => state.activePanel)
  const closePanel = useUIStore((state) => state.closePanel)

  if (!activePanel) return null

  const ActivePanel = panels[activePanel]

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-end pr-[4.75rem] sm:pr-[5.5rem]"
      onClick={closePanel}
    >
      <GlassPanel
        aria-labelledby="active-panel-title"
        className="mr-2 flex max-h-[80vh] w-[min(380px,calc(100vw-7rem))] flex-col overflow-hidden motion-safe:animate-[panel-in_180ms_ease-out]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <h1 id="active-panel-title" className="m-0 text-base font-semibold">
            {titles[activePanel]}
          </h1>
          <IconButton aria-label="Close panel" onClick={closePanel}>
            <X aria-hidden="true" size={19} />
          </IconButton>
        </header>
        <div className="min-h-0 overflow-y-auto px-5 py-5">
          <Suspense fallback={<p className="m-0 text-sm text-muted">Loading...</p>}>
            <ActivePanel />
          </Suspense>
        </div>
      </GlassPanel>
    </div>
  )
}