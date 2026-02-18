import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes, createHash } from 'crypto'
import { COOKIE_NAMES } from '@/lib/constants'
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 12

// Legacy SHA256 verification for migration
function verifySha256Password(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const testHash = createHash('sha256').update(password + salt).digest('hex')
  return hash === testHash
}

// Detect if a hash is legacy SHA256 format (salt:hex)
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

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = getClientIP(request)
    const rl = checkRateLimit(`admin-login:${ip}`, RATE_LIMITS.adminLogin)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

    const body = await request.json()
    const { email, password } = body

    const { prisma } = await import('@/lib/prisma')

    // Check if any admin users exist
    const userCount = await prisma.adminUser.count()

    if (userCount === 0) {
      // No users exist - check env var password for initial access
      const adminPassword = process.env.ADMIN_PASSWORD
      if (!adminPassword) {
        return NextResponse.json(
          { error: 'ADMIN_PASSWORD environment variable is not set. Please configure it.' },
          { status: 500 }
        )
      }

      if (password !== adminPassword) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
      }

      // Create session token
      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours

      await prisma.adminSession.create({
        data: { token, expiresAt },
      })

      const cookieStore = await cookies()
      cookieStore.set(COOKIE_NAMES.adminSession, 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8,
      })
      cookieStore.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8,
      })

      return NextResponse.json({
        success: true,
        needsSetup: true,
        message: 'No admin users exist. Please create the owner account.',
      })
    }

    // Email/password login
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const user = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // If user has no password, they should use magic link
    if (!user.passwordHash) {
      return NextResponse.json({
        error: 'This account uses magic link login. Please request a login link.',
        useMagicLink: true
      }, { status: 400 })
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Auto-upgrade legacy SHA256 hash to bcrypt on successful login
    if (isLegacySha256Hash(user.passwordHash)) {
      const upgradedHash = await hashPassword(password)
      await prisma.adminUser.update({
        where: { id: user.id },
        data: { passwordHash: upgradedHash },
      })
    }

    // Create session
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours

    await prisma.adminSession.create({
      data: {
        token,
        expiresAt,
        adminUserId: user.id,
      },
    })

    // Update last login
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAMES.adminSession, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

// Check if setup is needed
export async function GET() {
  try {
    const { prisma } = await import('@/lib/prisma')
    const userCount = await prisma.adminUser.count()

    return NextResponse.json({ needsSetup: userCount === 0 })
  } catch (error) {
    return NextResponse.json({ needsSetup: false })
  }
}
