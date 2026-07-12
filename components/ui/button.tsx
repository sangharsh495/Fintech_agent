import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex min-h-[var(--touch-target-min)] items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] font-medium transition-[background,color,border-color,box-shadow,transform,opacity] duration-[var(--duration-normal)] ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[var(--icon-md)]",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:opacity-90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:opacity-90',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-secondary',
        secondary:
          'border border-border bg-secondary text-secondary-foreground hover:opacity-90',
        ghost:
          'bg-transparent text-foreground hover:bg-secondary',
        link: 'min-h-0 text-primary underline-offset-4 hover:underline active:scale-100',
      },
      size: {
        xs: 'h-[var(--btn-height-xs)] px-3 text-xs',
        sm: 'h-[var(--btn-height-sm)] px-4 text-sm',
        default: 'h-[var(--btn-height-md)] px-5 text-base',
        lg: 'h-[var(--btn-height-lg)] px-6 text-lg',
        icon: 'size-[var(--btn-height-md)] p-0',
        'icon-xs': 'size-[var(--btn-height-xs)] p-0',
        'icon-sm': 'size-[var(--btn-height-sm)] p-0',
        'icon-lg': 'size-[var(--btn-height-lg)] p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
