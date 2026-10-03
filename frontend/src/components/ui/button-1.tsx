import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot as SlotPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,border-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/85 active:scale-[.97]',
        outline: 'border border-primary/30 bg-[var(--paper)] text-primary hover:border-primary',
        ghost: 'text-primary/80 hover:bg-primary hover:text-primary-foreground',
        destructive: 'bg-red-700 text-white hover:bg-red-800',
      },
      size: { sm: 'h-8 px-3', md: 'h-10 px-4', lg: 'h-12 px-6', icon: 'size-10 p-0' },
      mode: { default: '', icon: 'p-0' },
      shape: { default: '', circle: 'rounded-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md', mode: 'default', shape: 'default' },
  },
)

type ButtonProps = React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean; selected?: boolean }

function Button({ className, variant, size, mode, shape, asChild = false, selected, ...props }: ButtonProps) {
  const Comp = asChild ? SlotPrimitive.Slot : 'button'
  return <Comp data-slot="button" data-state={selected ? 'open' : undefined} className={cn(buttonVariants({ variant, size, mode, shape }), className)} {...props} />
}

export { Button }
