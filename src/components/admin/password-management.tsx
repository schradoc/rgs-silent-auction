'use client'

import { useState } from 'react'
import { Lock, Loader2, Eye, EyeOff, Key, Trash2 } from 'lucide-react'
import { Button, toast } from '@/components/ui'

interface PasswordManagementProps {
  hasPassword: boolean
  onSuccess: () => void
}

export function PasswordManagement({ hasPassword, onSuccess }: PasswordManagementProps) {
  const [mode, setMode] = useState<'view' | 'set' | 'change'>('view')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [removing, setRemoving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: hasPassword ? currentPassword : undefined,
          newPassword,
        }),
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to update password')
        return
      }

      toast.success(hasPassword ? 'Password changed' : 'Password set')
      setMode('view')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onSuccess()
    } catch (error) {
      toast.error('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePassword = async () => {
    setRemoving(true)
    try {
      const res = await fetch('/api/admin/password', {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to remove password')
        return
      }

      toast.success('Password removed. Use magic link to sign in.')
      onSuccess()
    } catch (error) {
      toast.error('Failed to remove password')
    } finally {
      setRemoving(false)
    }
  }

  if (mode === 'view') {
    return (
      <div className="flex flex-wrap gap-3">
        <Button
          variant={hasPassword ? 'outline' : 'gold'}
          onClick={() => setMode(hasPassword ? 'change' : 'set')}
        >
          <Key className="w-4 h-4 mr-2" />
          {hasPassword ? 'Change Password' : 'Set Password'}
        </Button>
        {hasPassword && (
          <Button
            variant="outline"
            onClick={handleRemovePassword}
            disabled={removing}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {removing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Remove Password
          </Button>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {hasPassword && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {hasPassword ? 'New Password' : 'Password'}
        </label>
        <div className="relative">
          <input
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
          required
        />
        {confirmPassword && newPassword !== confirmPassword && (
          <p className="text-sm text-red-500 mt-1">Passwords do not match</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" variant="gold" disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Lock className="w-4 h-4 mr-2" />
          )}
          {hasPassword ? 'Update Password' : 'Set Password'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setMode('view')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
