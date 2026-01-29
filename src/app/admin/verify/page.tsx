'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Gavel, CheckCircle, XCircle, Loader2 } from 'lucide-react'

function VerifyContent() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Invalid login link')
      return
    }

    // Verify the token
    fetch('/api/admin/magic-link/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (res.ok) {
          setStatus('success')
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/admin/dashboard')
          }, 1500)
        } else {
          setStatus('error')
          setError(data.error || 'Invalid or expired login link')
        }
      })
      .catch(() => {
        setStatus('error')
        setError('Failed to verify login link')
      })
  }, [token, router])

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#0f1d2d] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-[#c9a227] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#c9a227]/20">
            <Gavel className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white">RGS-HK Admin</h1>
        </div>

        {/* Status */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          {status === 'verifying' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-[#c9a227] animate-spin" />
              <p className="text-white">Verifying your login...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium text-lg">You&apos;re logged in!</p>
                <p className="text-white/60 text-sm mt-1">Redirecting to dashboard...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <div>
                <p className="text-white font-medium text-lg">Login Failed</p>
                <p className="text-white/60 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => router.push('/admin/login')}
                className="mt-4 px-6 py-2 bg-[#c9a227] text-white rounded-lg font-medium hover:bg-[#b8941f] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function AdminVerifyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#0f1d2d] flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </main>
    }>
      <VerifyContent />
    </Suspense>
  )
}
