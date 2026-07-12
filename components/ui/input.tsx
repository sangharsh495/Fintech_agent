import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const inputVariants = cva(
  'w-full bg-background border border-input rounded-xl px-4 transition-all duration-200 ease-out outline-hidden placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:bg-muted disabled:cursor-not-allowed disabled:opacity-60 hover:border-border/80 text-foreground dark:bg-input/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20',
  {
    variants: {
      size: {
        xs: 'h-9 px-3 text-xs rounded-lg',
        sm: 'h-10 px-4 text-sm rounded-xl',
        default: 'h-12 px-4 text-base rounded-xl',
        lg: 'h-14 px-5 text-lg rounded-2xl',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

interface InputProps extends Omit<React.ComponentProps<'input'>, 'size'>, VariantProps<typeof inputVariants> {}

function Input({ className, type, size, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  )
}

export { Input }

