import type { HTMLAttributes, ReactNode } from 'react'

interface GlassPanelProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
}

export default function GlassPanel({
  children,
  className = '',
  ...props
}: GlassPanelProps) {
  return (
    <section className={`glass ${className}`} {...props}>
      {children}
    </section>
  )
}