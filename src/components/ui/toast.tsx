'use client'

import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner'
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react'
import { ReactNode } from 'react'

// Re-export Toaster with custom styling for the app
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: 'bg-white border border-gray-200 shadow-lg rounded-lg',
          title: 'text-gray-900 font-medium',
          description: 'text-gray-600 text-sm',
          actionButton: 'bg-[#c9a227] text-white hover:bg-[#b8941f]',
          cancelButton: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
        },
      }}
    />
  )
}

interface ToastOptions {
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Custom toast helper with consistent styling
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    sonnerToast.success(message, {
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      ...options,
    })
  },

  error: (message: string, options?: ToastOptions) => {
    sonnerToast.error(message, {
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      duration: options?.duration ?? 5000, // Errors stay longer by default
      ...options,
    })
  },

  info: (message: string, options?: ToastOptions) => {
    sonnerToast(message, {
      icon: <Info className="w-5 h-5 text-blue-500" />,
      ...options,
    })
  },

  warning: (message: string, options?: ToastOptions) => {
    sonnerToast(message, {
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
      duration: options?.duration ?? 5000,
      ...options,
    })
  },

  // For loading states
  loading: (message: string) => {
    return sonnerToast.loading(message)
  },

  // Dismiss a specific toast or all toasts
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId)
  },

  // Promise-based toast for async operations
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: unknown) => string)
    }
  ) => {
    return sonnerToast.promise(promise, messages)
  },
}
