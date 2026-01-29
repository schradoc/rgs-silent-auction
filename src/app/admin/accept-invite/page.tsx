'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Gavel, CheckCircle, XCircle, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui'

function AcceptInviteContent() {
  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')
  const [invitation, setInvitation] = useState<{
    email: string
    role: string
    invitedBy: string
  } | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Invalid invitation link')
      return
    }

    // Verify the invitation
    fetch(`/api/admin/accept-invite?token=${token}`)
      .then(async (res) => {
        const data = await res.json()
        if (res.ok) {
          setInvitation(data.invitation)
          setStatus('form')
        } else {
          setStatus('error')
          setError(data.error || 'Invalid or expired invitation')
        }
      })
      .catch(() => {
        setStatus('error')
        setError('Failed to verify invitation')
      })
  }, [token])

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name }),
        credentials: 'include',
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/admin/dashboard')
        }, 2000)
      } else {
        setError(data.error || 'Failed to accept invitation')
      }
    } catch {
      setError('Failed to accept invitation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#0f1d2d] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#c9a227] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#c9a227]/20">
            <Gavel className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white">RGS-HK Admin</h1>
          <p className="text-white/50 text-sm mt-1">Accept Invitation</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-10 h-10 text-[#c9a227] animate-spin" />
              <p className="text-white/70">Verifying invitation...</p>
            </div>
          )}

          {status === 'form' && invitation && (
            <>
              <div className="mb-6 p-3 bg-[#c9a227]/20 rounded-lg border border-[#c9a227]/30">
                <p className="text-[#c9a227] text-sm font-medium">You&apos;ve been invited!</p>
                <p className="text-white/70 text-xs mt-1">
                  {invitation.invitedBy} has invited you to join as {invitation.role === 'ADMIN' ? 'an Admin' : 'an Employee'}.
                </p>
              </div>

              <form onSubmit={handleAccept}>
                <div className="mb-4">
                  <label className="block text-white/70 text-sm mb-2">Email</label>
                  <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white/50">
                    {invitation.email}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-white/70 text-sm mb-2">Role</label>
                  <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white/50 capitalize">
                    {invitation.role.toLowerCase()}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-white/70 text-sm mb-2">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a227]"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="gold"
                  className="w-full py-3"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Accept & Join'
                  )}
                </Button>

                <p className="text-center text-white/40 text-xs mt-4">
                  You&apos;ll receive magic links to sign in
                </p>
              </form>
            </>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium text-lg">Welcome to the team!</p>
                <p className="text-white/60 text-sm mt-1">Redirecting to dashboard...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium text-lg">Invitation Invalid</p>
                <p className="text-white/60 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => router.push('/admin/login')}
                className="mt-4 px-6 py-2 bg-[#c9a227] text-white rounded-lg font-medium hover:bg-[#b8941f] transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#0f1d2d] flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </main>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}
