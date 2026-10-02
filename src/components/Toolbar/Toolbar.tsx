import {
  BarChart3,
  CheckSquare,
  Clapperboard,
  Image,
  NotebookText,
  Settings,
  Timer,
  Volume2,
} from 'lucide-react'
import { useUIStore, type PanelId } from '@/store/useUIStore'
import IconButton from '@/components/ui/IconButton'

const toolbarItems: { id: PanelId; label: string; icon: typeof Timer }[] = [
  { id: 'timer', label: 'Timer', icon: Timer },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'sounds', label: 'Sounds', icon: Volume2 },
  { id: 'notes', label: 'Notes', icon: NotebookText },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'background', label: 'Background', icon: Image },
  { id: 'scenes', label: 'Scenes', icon: Clapperboard },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Toolbar() {
  const activePanel = useUIStore((state) => state.activePanel)
  const togglePanel = useUIStore((state) => state.togglePanel)

  return (
    <nav
      aria-label="Study room tools"
      className="glass fixed right-4 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-1.5 p-2 sm:right-6"
    >
      {toolbarItems.map(({ id, label, icon: Icon }) => (
        <IconButton
          key={id}
          aria-label={label}
          active={activePanel === id}
          onClick={() => togglePanel(id)}
        >
          <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
        </IconButton>
      ))}
    </nav>
  )
}