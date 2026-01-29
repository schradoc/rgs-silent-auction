import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHash, randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

// Simple password hashing (in production, use bcrypt)
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

// Get current admin user or list all users (owner only)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('admin_token')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Get session and user
    const session = await prisma.adminSession.findUnique({
      where: { token: sessionToken },
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    if (!session.adminUserId) {
      // Legacy password session - just return basic info
      return NextResponse.json({ user: { role: 'OWNER', legacy: true } })
    }

    const currentUser = await prisma.adminUser.findUnique({
      where: { id: session.adminUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const listAll = searchParams.get('all') === 'true'

    // Only owners can list all users
    if (listAll && currentUser.role === 'OWNER') {
      const users = await prisma.adminUser.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      })
      return NextResponse.json({ user: currentUser, users })
    }

    return NextResponse.json({ user: currentUser })
  } catch (error) {
    console.error('Get admin user error:', error)
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
  }
}

// Create new admin user (owner only)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('admin_token')?.value

    const { prisma } = await import('@/lib/prisma')

    // Check if this is initial setup (no users exist)
    const userCount = await prisma.adminUser.count()
    const isInitialSetup = userCount === 0

    if (!isInitialSetup) {
      // Require admin session for creating additional users
      if (!sessionToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const session = await prisma.adminSession.findUnique({
        where: { token: sessionToken },
      })

      if (!session || session.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 })
      }

      // Check if current user is owner
      if (session.adminUserId) {
        const currentUser = await prisma.adminUser.findUnique({
          where: { id: session.adminUserId },
        })
        if (currentUser?.role !== 'OWNER') {
          return NextResponse.json({ error: 'Only owners can create users' }, { status: 403 })
        }
      }
    }

    const body = await request.json()
    const { email, password, name, role, isInitialSetup: bodyIsInitialSetup } = body

    // For magic link flow (initial setup from login page), password is optional
    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name required' }, { status: 400 })
    }

    // Check for existing user
    const existing = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    // Create user - first user is always owner
    // Password is optional for magic link flow
    const user = await prisma.adminUser.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: password ? hashPassword(password) : null,
        name,
        role: isInitialSetup ? 'OWNER' : (role || 'EMPLOYEE'),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, user, isInitialSetup })
  } catch (error) {
    console.error('Create admin user error:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

// Update admin user
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('admin_token')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    const session = await prisma.adminSession.findUnique({
      where: { token: sessionToken },
    })

    if (!session || session.expiresAt < new Date() || !session.adminUserId) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const currentUser = await prisma.adminUser.findUnique({
      where: { id: session.adminUserId },
    })

    const body = await request.json()
    const { id, name, role, isActive, password } = body

    // Check permissions
    const isSelf = id === currentUser?.id
    const isOwner = currentUser?.role === 'OWNER'

    if (!isSelf && !isOwner) {
      return NextResponse.json({ error: 'Can only edit your own profile' }, { status: 403 })
    }

    // Only owners can change roles
    if (role && !isOwner) {
      return NextResponse.json({ error: 'Only owners can change roles' }, { status: 403 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (name) updateData.name = name
    if (role && isOwner) updateData.role = role
    if (typeof isActive === 'boolean' && isOwner && !isSelf) updateData.isActive = isActive
    if (password) updateData.passwordHash = hashPassword(password)

    const user = await prisma.adminUser.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Update admin user error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// Delete admin user (owner only, can't delete self)
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('admin_token')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    const session = await prisma.adminSession.findUnique({
      where: { token: sessionToken },
    })

    if (!session || session.expiresAt < new Date() || !session.adminUserId) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const currentUser = await prisma.adminUser.findUnique({
      where: { id: session.adminUserId },
    })

    if (currentUser?.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can delete users' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    if (id === currentUser.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    await prisma.adminUser.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete admin user error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}

// Export for use in login
export { hashPassword, verifyPassword }
