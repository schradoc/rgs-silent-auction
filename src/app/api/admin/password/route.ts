import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { createHash } from 'crypto'
import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 12

// Legacy SHA256 verification for migration
function verifySha256Password(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const testHash = createHash('sha256').update(password + salt).digest('hex')
  return hash === testHash
}

function isLegacySha256Hash(hash: string): boolean {
  return /^[a-f0-9]{32}:[a-f0-9]{64}$/.test(hash)
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (isLegacySha256Hash(stored)) {
    return verifySha256Password(password, stored)
  }
  return bcrypt.compare(password, stored)
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export const dynamic = 'force-dynamic'

// Set or change password
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const { prisma } = await import('@/lib/prisma')

    const user = await prisma.adminUser.findUnique({
      where: { id: auth.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If user already has a password, require current password
    if (user.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password required' },
          { status: 400 }
        )
      }

      if (!(await verifyPassword(currentPassword, user.passwordHash))) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        )
      }
    }

    // Hash and save new password with bcrypt
    const passwordHash = await hashPassword(newPassword)

    await prisma.adminUser.update({
      where: { id: auth.user.id },
      data: { passwordHash },
    })

    return NextResponse.json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    console.error('Password update error:', error)
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
  }
}

// Remove password (revert to magic link only)
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    await prisma.adminUser.update({
      where: { id: auth.user.id },
      data: { passwordHash: null },
    })

    return NextResponse.json({ success: true, message: 'Password removed. Use magic link to login.' })
  } catch (error) {
    console.error('Password removal error:', error)
    return NextResponse.json({ error: 'Failed to remove password' }, { status: 500 })
  }
}
