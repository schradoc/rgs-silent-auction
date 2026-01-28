import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gold' | 'navy'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        {
          // Variants
          'bg-gray-100 text-gray-700': variant === 'default',
          'bg-green-100 text-green-700': variant === 'success',
          'bg-yellow-100 text-yellow-700': variant === 'warning',
          'bg-red-100 text-red-700': variant === 'error',
          'bg-[#c9a227] text-white': variant === 'gold',
          'bg-[#1e3a5f] text-white': variant === 'navy',
          // Sizes
          'text-xs px-2 py-0.5': size === 'sm',
          'text-sm px-2.5 py-1': size === 'md',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
