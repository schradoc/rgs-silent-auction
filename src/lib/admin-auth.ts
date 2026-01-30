import { cookies } from 'next/headers'

type AdminUser = {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  hasPassword: boolean
}

type AuthResult =
  | { valid: false; error: string; user?: undefined; session?: undefined }
  | { valid: true; user: AdminUser | null; session: unknown }

export async function verifyAdminSession(): Promise<AuthResult> {
  const cookieStore = await cookies()
  const adminToken = cookieStore.get('admin_token')?.value

  if (!adminToken) {
    return { valid: false, error: 'No session token' }
  }

  const { prisma } = await import('@/lib/prisma')
  const session = await prisma.adminSession.findUnique({
    where: { token: adminToken },
  })

  if (!session) {
    return { valid: false, error: 'Invalid session' }
  }

  if (session.expiresAt < new Date()) {
    return { valid: false, error: 'Session expired' }
  }

  // For legacy sessions without adminUserId, just return valid
  if (!session.adminUserId) {
    return { valid: true, user: null, session }
  }

  // Fetch the user
  const dbUser = await prisma.adminUser.findUnique({
    where: { id: session.adminUserId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      passwordHash: true,
    },
  })

  if (!dbUser || !dbUser.isActive) {
    return { valid: false, error: 'User not found or inactive' }
  }

  const user: AdminUser = {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
    isActive: dbUser.isActive,
    hasPassword: !!dbUser.passwordHash,
  }

  return { valid: true, user, session }
}
