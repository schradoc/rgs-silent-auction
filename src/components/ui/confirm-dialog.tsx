'use client'

import { useState, useCallback, createContext, useContext, ReactNode } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from './button'

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return context
}

interface ConfirmProviderProps {
  children: ReactNode
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts)
      setResolveRef(() => resolve)
      setIsOpen(true)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    resolveRef?.(true)
    setIsOpen(false)
    setOptions(null)
    setResolveRef(null)
  }, [resolveRef])

  const handleCancel = useCallback(() => {
    resolveRef?.(false)
    setIsOpen(false)
    setOptions(null)
    setResolveRef(null)
  }, [resolveRef])

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Confirmation Dialog */}
      {isOpen && options && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
          onClick={handleCancel}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start gap-4">
                {options.variant === 'danger' && (
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {options.title}
                  </h3>
                  {options.description && (
                    <p className="mt-2 text-sm text-gray-600">
                      {options.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleCancel}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors -mt-1 -mr-1"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                {options.cancelLabel || 'Cancel'}
              </Button>
              <Button
                variant={options.variant === 'danger' ? 'outline' : 'gold'}
                onClick={handleConfirm}
                className={options.variant === 'danger'
                  ? 'bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700'
                  : ''
                }
              >
                {options.confirmLabel || 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

// Standalone function for use outside React components (with a modal ref)
// This is a simpler alternative that can be called imperatively
export function createConfirmDialog() {
  let resolvePromise: ((value: boolean) => void) | null = null
  let container: HTMLDivElement | null = null

  const cleanup = () => {
    if (container) {
      document.body.removeChild(container)
      container = null
    }
  }

  return {
    confirm: (options: ConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        resolvePromise = resolve

        // Create container
        container = document.createElement('div')
        container.id = 'confirm-dialog-root'
        document.body.appendChild(container)

        const handleConfirm = () => {
          resolvePromise?.(true)
          cleanup()
        }

        const handleCancel = () => {
          resolvePromise?.(false)
          cleanup()
        }

        // Render the dialog
        const dialogHtml = `
          <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" id="confirm-backdrop">
            <div class="bg-white rounded-xl max-w-md w-full shadow-2xl">
              <div class="p-6 pb-4">
                <div class="flex items-start gap-4">
                  ${options.variant === 'danger' ? `
                    <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  ` : ''}
                  <div class="flex-1 min-w-0">
                    <h3 class="text-lg font-semibold text-gray-900">${options.title}</h3>
                    ${options.description ? `<p class="mt-2 text-sm text-gray-600">${options.description}</p>` : ''}
                  </div>
                </div>
              </div>
              <div class="px-6 pb-6 flex gap-3 justify-end">
                <button id="confirm-cancel" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                  ${options.cancelLabel || 'Cancel'}
                </button>
                <button id="confirm-ok" class="px-4 py-2 text-sm font-medium rounded-lg ${
                  options.variant === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-[#c9a227] text-white hover:bg-[#b8941f]'
                } transition-colors">
                  ${options.confirmLabel || 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        `

        container.innerHTML = dialogHtml

        // Add event listeners
        document.getElementById('confirm-backdrop')?.addEventListener('click', (e) => {
          if (e.target === e.currentTarget) handleCancel()
        })
        document.getElementById('confirm-cancel')?.addEventListener('click', handleCancel)
        document.getElementById('confirm-ok')?.addEventListener('click', handleConfirm)

        // Handle escape key
        const handleKeydown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            handleCancel()
            document.removeEventListener('keydown', handleKeydown)
          }
        }
        document.addEventListener('keydown', handleKeydown)
      })
    },
  }
}

// Export a singleton instance for imperative use
export const confirmDialog = createConfirmDialog()
