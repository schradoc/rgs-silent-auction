'use client'

import { WifiOff, Loader2 } from 'lucide-react'

interface ConnectionStatusProps {
  state: 'connected' | 'connecting' | 'disconnected'
}

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  // Hide banner — realtime is optional, fallback polling keeps data fresh
  return null
}
