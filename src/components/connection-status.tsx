'use client'

import { WifiOff, Loader2 } from 'lucide-react'

interface ConnectionStatusProps {
  state: 'connected' | 'connecting' | 'disconnected'
}

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  if (state === 'connected') return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] px-4 py-2 text-center text-sm font-medium transition-all ${
      state === 'disconnected'
        ? 'bg-red-600 text-white'
        : 'bg-yellow-500 text-yellow-900'
    }`}>
      <div className="flex items-center justify-center gap-2">
        {state === 'disconnected' ? (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Connection lost — Reconnecting...</span>
          </>
        ) : (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Reconnecting...</span>
          </>
        )}
      </div>
    </div>
  )
}
