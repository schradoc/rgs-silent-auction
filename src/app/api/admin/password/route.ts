import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { randomBytes, createHash } from 'crypto'

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = createHash('sha256').update(password + salt).digest('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  const testHash = createHash('sha256').update(password + salt).digest('hex')
  return hash === testHash
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

      if (!verifyPassword(currentPassword, user.passwordHash)) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        )
      }
    }

    // Hash and save new password
    const passwordHash = hashPassword(newPassword)

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
