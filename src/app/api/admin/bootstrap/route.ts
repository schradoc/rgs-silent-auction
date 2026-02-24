import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// One-time bootstrap: create initial admin users when none exist
// Requires ADMIN_PASSWORD env var for authorization
export async function POST(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma')

    const body = await request.json()
    const { password } = body

    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) {
      return NextResponse.json({ error: 'ADMIN_PASSWORD not configured' }, { status: 500 })
    }

    if (password !== adminPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Check if admin users already exist
    const existingCount = await prisma.adminUser.count()
    if (existingCount > 0) {
      return NextResponse.json({
        error: `${existingCount} admin user(s) already exist. Bootstrap is only for initial setup.`,
      }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Create both admin users
    const users = await Promise.all([
      prisma.adminUser.create({
        data: {
          email: 'schradoc@gmail.com',
          name: 'Chris Schrader',
          role: 'OWNER',
          passwordHash: hashedPassword,
        },
        select: { id: true, email: true, name: true, role: true },
      }),
      prisma.adminUser.create({
        data: {
          email: 'director@rgshk.org.hk',
          name: 'Rupert McCowan',
          role: 'OWNER',
          passwordHash: hashedPassword,
        },
        select: { id: true, email: true, name: true, role: true },
      }),
    ])

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error('Bootstrap error:', error)
    return NextResponse.json({ error: 'Bootstrap failed' }, { status: 500 })
  }
}
