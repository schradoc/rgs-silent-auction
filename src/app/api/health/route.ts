import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const health: Record<string, unknown> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }

  try {
    const { prisma } = await import('@/lib/prisma')
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    health.database = {
      status: 'connected',
      latencyMs: Date.now() - start,
    }
  } catch (error) {
    health.status = 'degraded'
    health.database = {
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    return NextResponse.json(health, { status: 503 })
  }

  return NextResponse.json(health)
}
