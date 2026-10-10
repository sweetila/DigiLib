import { useEffect } from 'react'
import { X } from 'lucide-react'
import IconButton from './IconButton'
import { useUIStore } from '@/store/useUIStore'

export default function NoticeToast() {
  const notice = useUIStore((state) => state.notice)
  const dismissNotice = useUIStore((state) => state.dismissNotice)

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(dismissNotice, 6000)
    return () => window.clearTimeout(timeout)
  }, [notice, dismissNotice])

  if (!notice) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="glass fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl px-4 py-2 text-sm text-text motion-safe:animate-[panel-in_180ms_ease-out]"
    >
      <span>{notice.message}</span>
      <IconButton aria-label="Dismiss notice" className="size-10" onClick={dismissNotice}>
        <X aria-hidden="true" size={17} />
      </IconButton>
    </div>
  )
}
