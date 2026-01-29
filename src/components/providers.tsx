'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { RealtimeNotifications } from './realtime-notifications'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 10, // 10 seconds
            refetchOnWindowFocus: true,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <RealtimeNotifications />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1e3a5f',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
        richColors
      />
    </QueryClientProvider>
  )
}
