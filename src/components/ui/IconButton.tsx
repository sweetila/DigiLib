import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react'
import Tooltip from './Tooltip'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string
  active?: boolean
  children: ReactNode
}

export default function IconButton({
  active,
  children,
  className = '',
  ...buttonProps
}: IconButtonProps) {
  const label = buttonProps['aria-label']
  const tooltipId = useId()

  return (
    <Tooltip content={label} id={tooltipId}>
      <button
        {...buttonProps}
        type={buttonProps.type ?? 'button'}
        aria-describedby={tooltipId}
        aria-pressed={active}
        className={`grid size-11 place-items-center rounded-xl text-muted transition-colors hover:bg-white/10 hover:text-text focus-visible:outline-offset-2 ${active ? 'bg-accent/20 text-accent' : ''} ${className}`}
      >
        {children}
      </button>
    </Tooltip>
  )
}