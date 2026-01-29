'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, X, Star, Loader2, Image as ImageIcon, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui'

interface PrizeImage {
  id: string
  url: string
  isPrimary: boolean
  order: number
}

interface ImageUploadProps {
  prizeId?: string
  images: PrizeImage[]
  onImagesChange: (images: PrizeImage[]) => void
  maxImages?: number
}

export function ImageUpload({
  prizeId,
  images,
  onImagesChange,
  maxImages = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const uploadFile = async (file: File): Promise<PrizeImage | null> => {
    const formData = new FormData()
    formData.append('file', file)
    if (prizeId) {
      formData.append('prizeId', prizeId)
    }

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await res.json()
      return data.image || {
        id: `temp-${Date.now()}`,
        url: data.url,
        isPrimary: images.length === 0,
        order: images.length,
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload image')
      return null
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const remainingSlots = maxImages - images.length
    if (remainingSlots <= 0) {
      alert(`Maximum ${maxImages} images allowed`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)
    setUploading(true)
    setUploadProgress(0)

    const newImages: PrizeImage[] = []
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i]

      // Validate file type
      if (!file.type.startsWith('image/')) {
        continue
      }

      const image = await uploadFile(file)
      if (image) {
        newImages.push(image)
      }
      setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100))
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages])
    }

    setUploading(false)
    setUploadProgress(null)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      handleFiles(e.dataTransfer.files)
    },
    [images, maxImages]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const handleDelete = async (imageId: string) => {
    // For temp images (not yet saved to DB), just remove from local state
    if (imageId.startsWith('temp-')) {
      onImagesChange(images.filter((img) => img.id !== imageId))
      return
    }

    setDeletingId(imageId)
    try {
      const res = await fetch(`/api/admin/upload?id=${imageId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        const updatedImages = images.filter((img) => img.id !== imageId)
        // If we deleted the primary, make the first remaining image primary
        if (updatedImages.length > 0 && !updatedImages.some((img) => img.isPrimary)) {
          updatedImages[0].isPrimary = true
        }
        onImagesChange(updatedImages)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete image')
      }
    } catch (error) {
      alert('Failed to delete image')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetPrimary = async (imageId: string) => {
    // For images already saved, we'd need an API endpoint to update
    // For now, just update local state
    const updatedImages = images.map((img) => ({
      ...img,
      isPrimary: img.id === imageId,
    }))
    onImagesChange(updatedImages)

    // If we have a prizeId and real image, update via API
    if (prizeId && !imageId.startsWith('temp-')) {
      try {
        await fetch('/api/admin/prizes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: prizeId,
            imageUrl: images.find((img) => img.id === imageId)?.url,
          }),
          credentials: 'include',
        })
      } catch (error) {
        console.error('Failed to update primary image:', error)
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors
          ${dragActive ? 'border-[#c9a227] bg-[#c9a227]/5' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-[#c9a227] animate-spin" />
            <p className="text-sm text-gray-600">
              Uploading... {uploadProgress}%
            </p>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              Drag and drop images here, or click to select
            </p>
            <p className="text-xs text-gray-400 mt-1">
              JPEG, PNG, WebP, GIF up to 10MB ({images.length}/{maxImages} images)
            </p>
          </>
        )}
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`
                relative group rounded-lg overflow-hidden border-2
                ${image.isPrimary ? 'border-[#c9a227]' : 'border-transparent'}
              `}
            >
              {/* Image */}
              <div className="aspect-square bg-gray-100">
                <img
                  src={image.url}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Primary Badge */}
              {image.isPrimary && (
                <div className="absolute top-2 left-2 bg-[#c9a227] text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Primary
                </div>
              )}

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.isPrimary && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSetPrimary(image.id)
                    }}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Set as primary"
                  >
                    <Star className="w-4 h-4 text-[#c9a227]" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(image.id)
                  }}
                  disabled={deletingId === image.id}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  title="Delete image"
                >
                  {deletingId === image.id ? (
                    <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                  ) : (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !uploading && (
        <div className="text-center py-4 text-gray-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No images uploaded yet</p>
        </div>
      )}
    </div>
  )
}
