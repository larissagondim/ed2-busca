import * as React from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type FlowButtonProps = React.ComponentProps<'button'> & { text?: string; loading?: boolean }

export function FlowButton({ text = 'Continuar', loading = false, className, disabled, ...props }: FlowButtonProps) {
  return (
    <button
      className={cn('flow-button group relative inline-flex min-h-12 items-center gap-1 overflow-hidden rounded-full border-[1.5px] border-black/40 bg-transparent px-8 py-3 text-sm font-semibold text-neutral-950 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:rounded-xl hover:border-transparent hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-50', className)}
      disabled={disabled || loading} aria-busy={loading} {...props}
    >
      <ArrowRight aria-hidden className="absolute -left-1/4 z-[2] size-4 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:left-4 group-hover:stroke-white" />
      <span className="relative z-[1] -translate-x-3 transition-all duration-700 ease-out group-hover:translate-x-3">{loading ? 'Comparando…' : text}</span>
      <span aria-hidden className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-950 opacity-0 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:size-[220px] group-hover:opacity-100" />
      <ArrowRight aria-hidden className="absolute right-4 z-[2] size-4 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-right-1/4 group-hover:stroke-white" />
    </button>
  )
}
