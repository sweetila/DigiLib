import { useId, type ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  id?: string
}

export default function Tooltip({ content, children, id }: TooltipProps) {
  const generatedId = useId()
  const tooltipId = id ?? generatedId

  return (
    <span className="group relative inline-flex">
      {children}
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute right-full top-1/2 z-50 mr-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-bg2 px-2.5 py-1.5 text-xs font-medium text-text opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {content}
      </span>
    </span>
  )
}