'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Gavel, Mail, User, AlertCircle, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'

type Mode = 'loading' | 'magic-link' | 'setup' | 'sent'

export default function AdminLoginPage() {
  const [mode, setMode] = useState<Mode>('loading')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    // Check if setup is needed
    fetch('/api/admin/login')
      .then((res) => res.json())
      .then((data) => {
        setMode(data.needsSetup ? 'setup' : 'magic-link')
      })
      .catch(() => setMode('magic-link'))
  }, [])

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (data.needsSetup) {
        setMode('setup')
        setLoading(false)
        return
      }

      if (!res.ok) {
        setError(data.error || 'Failed to send login link')
        return
      }

      setMode('sent')
    } catch (err) {
      setError('Failed to send login link')
    } finally {
      setLoading(false)
    }
  }

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create owner account (no password needed)
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, isInitialSetup: true }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Setup failed')
        return
      }

      // Send magic link to the new account
      const magicRes = await fetch('/api/admin/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (magicRes.ok) {
        setMode('sent')
      } else {
        setError('Account created. Please enter your email to receive a login link.')
        setMode('magic-link')
      }
    } catch (err) {
      setError('Setup failed')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'loading') {
    return (
      <main className="min-h-screen bg-[#1e3a5f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </main>
    )
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
          <p className="text-white/50 text-sm mt-1">
            {mode === 'setup' ? 'Create Owner Account' :
             mode === 'sent' ? 'Check Your Email' :
             'Silent Auction Dashboard'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          {/* Setup Mode - First time owner */}
          {mode === 'setup' && (
            <>
              <div className="mb-6 p-3 bg-[#c9a227]/20 rounded-lg border border-[#c9a227]/30">
                <p className="text-[#c9a227] text-sm font-medium">First Time Setup</p>
                <p className="text-white/70 text-xs mt-1">
                  Create the owner account. You&apos;ll receive an email to complete setup.
                </p>
              </div>

              <form onSubmit={handleSetup}>
                <div className="mb-4">
                  <label className="block text-white/70 text-sm mb-2">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Smith"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a227]"
                      required
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-white/70 text-sm mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a227]"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
                    'Create Account'
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Magic Link Mode */}
          {mode === 'magic-link' && (
            <form onSubmit={handleMagicLink}>
              <div className="mb-6">
                <label className="block text-white/70 text-sm mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a227]"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Login Link
                  </>
                )}
              </Button>

              <p className="text-center text-white/40 text-xs mt-4">
                We&apos;ll send a secure login link to your email
              </p>
            </form>
          )}

          {/* Sent Mode */}
          {mode === 'sent' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-white font-medium text-lg mb-2">Check your email</h2>
              <p className="text-white/60 text-sm mb-6">
                We sent a login link to <strong className="text-white">{email}</strong>
              </p>
              <button
                onClick={() => { setMode('magic-link'); setError(''); }}
                className="flex items-center justify-center gap-2 text-white/60 hover:text-white text-sm mx-auto transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Use a different email
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          RGS-HK 30th Anniversary Gala &bull; Silent Auction
        </p>
      </div>
    </main>
  )
}
