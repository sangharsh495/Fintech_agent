import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const inputVariants = cva(
  'w-full rounded-[var(--radius-md)] border border-input bg-background px-3.5 text-foreground transition-[border-color,box-shadow,background,opacity] duration-[var(--duration-fast)] ease-out outline-none placeholder:text-muted-foreground focus:border-ring focus:shadow-[var(--shadow-primary-sm)] focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-destructive/20',
  {
    variants: {
      size: {
        xs: 'h-[var(--input-height-xs)] text-xs',
        sm: 'h-[var(--input-height-sm)] text-sm',
        default: 'h-[var(--input-height-md)] text-base',
        lg: 'h-[var(--input-height-lg)] text-lg',
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
