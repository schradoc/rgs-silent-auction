import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'

import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const BUCKET_NAME = 'prize-images'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// Lazy initialization of Supabase client
let supabase: SupabaseClient | null = null
function getSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Support both old (SERVICE_ROLE_KEY) and new (SECRET_KEY) naming
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !secretKey) {
    return null
  }
  if (!supabase) {
    supabase = createClient(supabaseUrl, secretKey)
  }
  return supabase
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const prizeId = formData.get('prizeId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const filename = prizeId
      ? `prizes/${prizeId}/${timestamp}-${randomStr}.${ext}`
      : `uploads/${timestamp}-${randomStr}.${ext}`

    // Upload to Supabase Storage
    const buffer = await file.arrayBuffer()
    const storage = getSupabase()

    if (!storage) {
      return NextResponse.json(
        { error: 'Storage not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY environment variables.' },
        { status: 503 }
      )
    }

    const { data, error } = await storage.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: '31536000', // 1 year cache
        upsert: false,
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = storage.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename)

    const imageUrl = urlData.publicUrl

    // If prizeId provided, add to PrizeImage
    if (prizeId) {
      const { prisma } = await import('@/lib/prisma')

      // Get current image count for ordering
      const imageCount = await prisma.prizeImage.count({
        where: { prizeId },
      })

      // Create image record
      const prizeImage = await prisma.prizeImage.create({
        data: {
          prizeId,
          url: imageUrl,
          order: imageCount,
          isPrimary: imageCount === 0, // First image is primary
        },
      })

      // If this is the first image, also update the prize's imageUrl
      if (imageCount === 0) {
        await prisma.prize.update({
          where: { id: prizeId },
          data: { imageUrl },
        })
      }

      return NextResponse.json({
        success: true,
        image: prizeImage,
        url: imageUrl,
      })
    }

    return NextResponse.json({
      success: true,
      url: imageUrl,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}

// Delete an image
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('id')

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Get the image record
    const image = await prisma.prizeImage.findUnique({
      where: { id: imageId },
      include: { prize: true },
    })

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Extract path from URL for storage deletion
    const storage = getSupabase()
    if (storage) {
      const url = new URL(image.url)
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/prize-images\/(.+)/)
      if (pathMatch) {
        const filePath = pathMatch[1]
        await storage.storage.from(BUCKET_NAME).remove([filePath])
      }
    }

    // Delete the database record
    await prisma.prizeImage.delete({
      where: { id: imageId },
    })

    // If this was the primary image, set a new primary
    if (image.isPrimary) {
      const nextImage = await prisma.prizeImage.findFirst({
        where: { prizeId: image.prizeId },
        orderBy: { order: 'asc' },
      })

      if (nextImage) {
        await prisma.prizeImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        })
        await prisma.prize.update({
          where: { id: image.prizeId },
          data: { imageUrl: nextImage.url },
        })
      } else {
        // No more images, set to empty or default
        await prisma.prize.update({
          where: { id: image.prizeId },
          data: { imageUrl: '' },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete image error:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}
