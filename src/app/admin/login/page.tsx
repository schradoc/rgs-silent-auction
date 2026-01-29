'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Gavel, Mail, Lock, User, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui'

type Mode = 'login' | 'setup' | 'loading'

export default function AdminLoginPage() {
  const [mode, setMode] = useState<Mode>('loading')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    // Check if setup is needed
    fetch('/api/admin/login')
      .then((res) => res.json())
      .then((data) => {
        setMode(data.needsSetup ? 'setup' : 'login')
      })
      .catch(() => setMode('login'))
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'setup' ? { password } : { email, password }
        ),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      if (data.needsSetup) {
        // Legacy password worked, now show setup
        setMode('setup')
        setPassword('')
        return
      }

      router.push('/admin/dashboard')
    } catch (err) {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create owner account
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Setup failed')
        return
      }

      // Now log in with the new account
      const loginRes = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (loginRes.ok) {
        router.push('/admin/dashboard')
      } else {
        setError('Account created but login failed. Try logging in.')
        setMode('login')
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
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
            {mode === 'setup' ? 'Create Owner Account' : 'Silent Auction Dashboard'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          {mode === 'setup' && (
            <div className="mb-6 p-3 bg-[#c9a227]/20 rounded-lg border border-[#c9a227]/30">
              <p className="text-[#c9a227] text-sm font-medium">First Time Setup</p>
              <p className="text-white/70 text-xs mt-1">
                Create the owner account. This account will have full admin access.
              </p>
            </div>
          )}

          <form onSubmit={mode === 'setup' ? handleSetup : handleLogin}>
            {mode === 'setup' && (
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
            )}

            {mode !== 'setup' || true ? (
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
                    required={mode === 'login' || mode === 'setup'}
                  />
                </div>
              </div>
            ) : null}

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
                <AlertCircle className="w-4 h-4" />
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
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'setup' ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          RGS-HK 30th Anniversary Gala • Silent Auction
        </p>
      </div>
    </main>
  )
}
