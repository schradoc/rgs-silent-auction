'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Gavel, Mail, User, AlertCircle, CheckCircle, ArrowLeft, Loader2, Lock, Key } from 'lucide-react'
import { Button } from '@/components/ui'

type Mode = 'loading' | 'magic-link' | 'password' | 'setup' | 'sent' | 'redirecting'

export default function AdminLoginPage() {
  const [mode, setMode] = useState<Mode>('loading')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [resending, setResending] = useState(false)

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
      // Start countdown for resend button
      setResendCountdown(60)
    } catch (err) {
      setError('Failed to send login link')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      const data = await res.json()

      if (data.useMagicLink) {
        setError('This account uses magic link login. Switch to magic link below.')
        setLoading(false)
        return
      }

      if (!res.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      // Show redirecting state before navigation
      setMode('redirecting')
      router.push('/admin/dashboard')
    } catch (err) {
      setError('Login failed')
      setLoading(false)
    }
  }

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  const handleResendLink = async () => {
    if (resendCountdown > 0) return

    setResending(true)
    setError('')

    try {
      const res = await fetch('/api/admin/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to resend login link')
        return
      }

      setResendCountdown(60)
    } catch (err) {
      setError('Failed to resend login link')
    } finally {
      setResending(false)
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

  if (mode === 'loading' || mode === 'redirecting') {
    return (
      <main className="min-h-screen bg-[#1e3a5f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-3" />
          {mode === 'redirecting' && (
            <p className="text-white/70 text-sm">Redirecting to dashboard...</p>
          )}
        </div>
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
             mode === 'password' ? 'Sign in with Password' :
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

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-transparent text-white/40">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setMode('password'); setError(''); }}
                className="w-full py-3 border border-white/20 rounded-xl text-white/70 hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Sign in with Password
              </button>
            </form>
          )}

          {/* Password Mode */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordLogin}>
              <div className="mb-4">
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

              <div className="mb-6">
                <label className="block text-white/70 text-sm mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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
                    <Key className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-transparent text-white/40">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setMode('magic-link'); setError(''); setPassword(''); }}
                className="w-full py-3 border border-white/20 rounded-xl text-white/70 hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Use Magic Link Instead
              </button>
            </form>
          )}

          {/* Sent Mode */}
          {mode === 'sent' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-white font-medium text-lg mb-2">Check your email</h2>
              <p className="text-white/60 text-sm mb-2">
                We sent a login link to <strong className="text-white">{email}</strong>
              </p>

              {/* Helper text */}
              <div className="bg-white/5 rounded-lg p-3 mb-4 text-left">
                <p className="text-white/50 text-xs">
                  <strong className="text-white/70">Tip:</strong> Check your spam or junk folder if you don&apos;t see the email within a minute.
                </p>
              </div>

              {/* Resend button */}
              <button
                onClick={handleResendLink}
                disabled={resendCountdown > 0 || resending}
                className={`w-full py-2 rounded-lg border text-sm font-medium transition-colors mb-4 ${
                  resendCountdown > 0
                    ? 'border-white/10 text-white/40 cursor-not-allowed'
                    : 'border-white/20 text-white/70 hover:bg-white/5'
                }`}
              >
                {resending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </span>
                ) : resendCountdown > 0 ? (
                  `Resend link in ${resendCountdown}s`
                ) : (
                  'Resend login link'
                )}
              </button>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={() => { setMode('magic-link'); setError(''); setResendCountdown(0); }}
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
