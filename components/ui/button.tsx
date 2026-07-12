import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all duration-200 ease-smooth outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-98 hover:scale-102 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/95 shadow-md hover:shadow-lg hover:shadow-primary/20',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/95 shadow-md hover:shadow-lg hover:shadow-destructive/20',
        outline:
          'border border-border bg-background shadow-xs hover:bg-secondary hover:text-secondary-foreground dark:hover:bg-muted/30',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50',
        ghost:
          'hover:bg-secondary hover:text-secondary-foreground dark:hover:bg-muted/30',
        link: 'text-primary underline-offset-4 hover:underline hover:scale-100 active:scale-100',
      },
      size: {
        xs: 'h-8 px-3 text-xs rounded-lg relative after:absolute after:inset-[-6px] after:content-[""]', // expand touch target to 44px
        sm: 'h-10 px-4 text-sm rounded-xl',
        default: 'h-12 px-5 text-base rounded-xl',
        lg: 'h-14 px-6 text-lg rounded-2xl',
        icon: 'size-12 rounded-xl',
        'icon-xs': 'size-8 rounded-lg relative after:absolute after:inset-[-6px] after:content-[""]',
        'icon-sm': 'size-10 rounded-xl',
        'icon-lg': 'size-14 rounded-2xl',
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

