'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Hash,
  Bell,
  Heart,
  Gavel,
  Check,
  AlertCircle,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui'

interface Profile {
  id: string
  name: string
  email: string
  phone: string | null
  tableNumber: string
  emailVerified: boolean
  emailOptIn: boolean
  smsOptIn: boolean
  whatsappOptIn: boolean
  notificationPref: 'EMAIL' | 'SMS' | 'WHATSAPP'
  _count: { bids: number; favorites: number }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mounted, setMounted] = useState(false)

  // Editable fields
  const [name, setName] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [emailOptIn, setEmailOptIn] = useState(true)
  const [smsOptIn, setSmsOptIn] = useState(false)
  const [whatsappOptIn, setWhatsappOptIn] = useState(false)
  const [notificationPref, setNotificationPref] = useState<'EMAIL' | 'SMS' | 'WHATSAPP'>('EMAIL')

  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
        setName(data.profile.name)
        setTableNumber(data.profile.tableNumber)
        setPhone(data.profile.phone || '')
        setEmailOptIn(data.profile.emailOptIn)
        setSmsOptIn(data.profile.smsOptIn)
        setWhatsappOptIn(data.profile.whatsappOptIn)
        setNotificationPref(data.profile.notificationPref)
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          tableNumber,
          phone: phone || null,
          emailOptIn,
          smsOptIn,
          whatsappOptIn,
          notificationPref,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to save')
        return
      }

      setSuccess('Profile updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#b8941f]/30 border-t-[#b8941f] rounded-full animate-spin" />
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Please sign in to view your profile</p>
          <Link href="/login">
            <Button variant="gold">Sign In</Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <header className="bg-[#0f1d2d] text-white sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/prizes"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <h1 className="text-lg font-semibold">My Profile</h1>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <section
          className={`transition-all duration-500 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                <Gavel className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{profile._count.bids}</p>
              <p className="text-xs text-gray-500">Total Bids</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                <Heart className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{profile._count.favorites}</p>
              <p className="text-xs text-gray-500">Favorites</p>
            </div>
          </div>
        </section>

        {/* Profile Info */}
        <section
          className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-500 delay-100 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal Information
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b8941f]"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Email</label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
                {profile.emailVerified && (
                  <span className="text-green-600 text-xs flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Table Number</label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b8941f]"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Phone (for notifications)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+852 9123 4567"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b8941f]"
              />
            </div>
          </div>
        </section>

        {/* Notification Preferences */}
        <section
          className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-500 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notification Preferences
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-2">Notify me via</label>
              <div className="flex gap-2">
                {(['EMAIL', 'SMS', 'WHATSAPP'] as const).map((pref) => (
                  <button
                    key={pref}
                    onClick={() => setNotificationPref(pref)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      notificationPref === pref
                        ? 'bg-[#b8941f] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {pref === 'EMAIL' ? 'Email' : pref === 'SMS' ? 'SMS' : 'WhatsApp'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Email notifications</span>
                <button
                  onClick={() => setEmailOptIn(!emailOptIn)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                    emailOptIn ? 'bg-[#b8941f]' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      emailOptIn ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">SMS notifications</span>
                <button
                  onClick={() => setSmsOptIn(!smsOptIn)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                    smsOptIn ? 'bg-[#b8941f]' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      smsOptIn ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">WhatsApp notifications</span>
                <button
                  onClick={() => setWhatsappOptIn(!whatsappOptIn)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                    whatsappOptIn ? 'bg-[#b8941f]' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      whatsappOptIn ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>
        </section>

        {/* Error/Success Messages */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-4 py-3 rounded-xl">
            <Check className="w-4 h-4" />
            {success}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="gold"
            className="w-full"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>

          <Link href="/favorites" className="block">
            <Button variant="outline" className="w-full">
              <Heart className="w-4 h-4 mr-2" />
              View My Favorites
            </Button>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full py-3 text-red-600 text-sm font-medium hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </main>
  )
}
