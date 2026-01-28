'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Tesseract from 'tesseract.js'
import {
  ArrowLeft,
  Camera,
  RotateCcw,
  Check,
  AlertCircle,
  Sparkles,
  Loader2,
  Edit3,
  X,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface ExtractedData {
  tableNumber: string
  bidderName: string
  prizeNumber: string
  amount: string
  email: string
  phone: string
}

interface Prize {
  id: string
  title: string
  slug: string
  minimumBid: number
  currentHighestBid: number
  displayOrder: number
}

export default function ScanBidPage() {
  const [mounted, setMounted] = useState(false)
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [step, setStep] = useState<'camera' | 'processing' | 'review' | 'submitting' | 'success'>('camera')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    tableNumber: '',
    bidderName: '',
    prizeNumber: '',
    amount: '',
    email: '',
    phone: '',
  })
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    checkAuth()
    fetchPrizes()
    return () => {
      stopCamera()
    }
  }, [])

  useEffect(() => {
    if (step === 'camera' && mounted) {
      startCamera()
    }
    return () => {
      if (step !== 'camera') {
        stopCamera()
      }
    }
  }, [step, mounted])

  const checkAuth = async () => {
    const res = await fetch('/api/helpers/me')
    const data = await res.json()
    if (!data.helper) {
      router.push('/helper')
    }
  }

  const fetchPrizes = async () => {
    try {
      const res = await fetch('/api/prizes')
      if (res.ok) {
        const data = await res.json()
        setPrizes(data.prizes || [])
      }
    } catch (error) {
      console.error('Failed to fetch prizes:', error)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('Camera access denied:', err)
      setError('Camera access denied. Please allow camera access to scan paper bids.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      const imageData = canvas.toDataURL('image/jpeg', 0.9)
      setCapturedImage(imageData)
      processImage(imageData)
    }
  }

  const processImage = async (imageData: string) => {
    setStep('processing')
    setOcrProgress(0)

    try {
      const result = await Tesseract.recognize(imageData, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100))
          }
        },
      })

      const text = result.data.text
      console.log('OCR Result:', text)

      // Extract data from OCR text
      const extracted = extractDataFromText(text)
      setExtractedData(extracted)

      // Try to match prize number
      if (extracted.prizeNumber) {
        const prizeNum = parseInt(extracted.prizeNumber)
        const matchedPrize = prizes.find((p) => p.displayOrder === prizeNum)
        if (matchedPrize) {
          setSelectedPrize(matchedPrize)
        }
      }

      setStep('review')
    } catch (err) {
      console.error('OCR Error:', err)
      setError('Failed to process image. Please try again.')
      setStep('camera')
    }
  }

  const extractDataFromText = (text: string): ExtractedData => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    const data: ExtractedData = {
      tableNumber: '',
      bidderName: '',
      prizeNumber: '',
      amount: '',
      email: '',
      phone: '',
    }

    for (const line of lines) {
      const lowerLine = line.toLowerCase()

      // Table number
      if (lowerLine.includes('table') && !data.tableNumber) {
        const match = line.match(/\d+/)
        if (match) data.tableNumber = match[0]
      }

      // Name - look for line after "NAME:" or containing common name patterns
      if (lowerLine.includes('name') && !data.bidderName) {
        const nameMatch = line.match(/name[:\s]*(.+)/i)
        if (nameMatch) data.bidderName = nameMatch[1].trim()
      }

      // Prize number
      if ((lowerLine.includes('prize') || lowerLine.includes('#')) && !data.prizeNumber) {
        const match = line.match(/\d+/)
        if (match) data.prizeNumber = match[0]
      }

      // Amount - look for HK$ or numbers with commas
      if ((lowerLine.includes('amount') || lowerLine.includes('bid') || lowerLine.includes('hk$')) && !data.amount) {
        const amountMatch = line.match(/[\d,]+/)
        if (amountMatch) {
          data.amount = amountMatch[0].replace(/,/g, '')
        }
      }

      // Email
      if (line.includes('@') && !data.email) {
        const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/)
        if (emailMatch) data.email = emailMatch[0]
      }

      // Phone
      if ((lowerLine.includes('phone') || line.match(/\+?\d{8,}/)) && !data.phone) {
        const phoneMatch = line.match(/\+?[\d\s-]{8,}/)
        if (phoneMatch) data.phone = phoneMatch[0].replace(/\s/g, '')
      }
    }

    return data
  }

  const handleSubmit = async () => {
    if (!selectedPrize || !extractedData.bidderName || !extractedData.tableNumber || !extractedData.amount) {
      setError('Please fill in all required fields')
      return
    }

    const bidAmount = parseInt(extractedData.amount.replace(/[^\d]/g, ''))
    const minBid = Math.max(selectedPrize.minimumBid, selectedPrize.currentHighestBid + 100)

    if (bidAmount < minBid) {
      setError(`Bid must be at least ${formatCurrency(minBid)}`)
      return
    }

    setStep('submitting')
    setError('')

    try {
      const res = await fetch('/api/helpers/submit-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidderName: extractedData.bidderName,
          tableNumber: extractedData.tableNumber,
          prizeId: selectedPrize.id,
          amount: bidAmount,
          email: extractedData.email || undefined,
          phone: extractedData.phone || undefined,
          isPaperBid: true,
          imageUrl: capturedImage,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit bid')
        setStep('review')
        return
      }

      setSuccess(`${formatCurrency(bidAmount)} bid placed for ${extractedData.bidderName}!`)
      setStep('success')

      // Reset after 3 seconds
      setTimeout(() => {
        resetForm()
      }, 3000)
    } catch (err) {
      setError('Failed to submit bid')
      setStep('review')
    }
  }

  const resetForm = () => {
    setCapturedImage(null)
    setExtractedData({
      tableNumber: '',
      bidderName: '',
      prizeNumber: '',
      amount: '',
      email: '',
      phone: '',
    })
    setSelectedPrize(null)
    setError('')
    setSuccess('')
    setStep('camera')
  }

  const minBid = selectedPrize
    ? Math.max(selectedPrize.minimumBid, selectedPrize.currentHighestBid + 100)
    : 0

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f1d2d] via-[#1a2f4a] to-[#0f1d2d]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f1d2d]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href="/helper/dashboard"
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </Link>
          <h1 className="text-white font-semibold">Scan Paper Bid</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Camera Step */}
        {step === 'camera' && (
          <div className={`space-y-4 transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <div className="relative aspect-[3/4] bg-black rounded-2xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Overlay guide */}
              <div className="absolute inset-4 border-2 border-white/30 rounded-xl pointer-events-none">
                <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-white/60 rounded-tl-lg" />
                <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-white/60 rounded-tr-lg" />
                <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-white/60 rounded-bl-lg" />
                <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-white/60 rounded-br-lg" />
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-white/70 text-sm">Align paper bid form within frame</p>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <button
              onClick={captureImage}
              className="w-full py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-[#b8941f] to-[#d4af37] text-white flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
            >
              <Camera className="w-5 h-5" />
              Capture & Scan
            </button>

            <Link
              href="/helper/submit-bid"
              className="block w-full py-3 rounded-xl font-medium text-center border border-white/20 text-white/70 hover:bg-white/5 transition-colors"
            >
              Enter Manually Instead
            </Link>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-[#b8941f]/20 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-[#b8941f] animate-spin" />
            </div>
            <h2 className="text-white text-xl font-medium mb-2">Processing Image</h2>
            <p className="text-white/50 mb-4">Extracting text from paper bid...</p>
            <div className="w-64 h-2 bg-white/10 rounded-full mx-auto overflow-hidden">
              <div
                className="h-full bg-[#b8941f] transition-all duration-300"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
            <p className="text-white/30 text-sm mt-2">{ocrProgress}%</p>
          </div>
        )}

        {/* Review Step */}
        {step === 'review' && (
          <div className="space-y-5">
            {/* Captured Image Preview */}
            {capturedImage && (
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                <img src={capturedImage} alt="Captured bid" className="w-full h-full object-contain" />
                <button
                  onClick={resetForm}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-white" />
                </button>
              </div>
            )}

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-white/70 text-sm font-medium mb-3 flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Review Extracted Data
              </h3>

              <div className="space-y-4">
                {/* Prize Selection */}
                <div>
                  <label className="block text-white/50 text-xs mb-1">Prize *</label>
                  <select
                    value={selectedPrize?.id || ''}
                    onChange={(e) => {
                      const prize = prizes.find((p) => p.id === e.target.value)
                      setSelectedPrize(prize || null)
                    }}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#b8941f]"
                  >
                    <option value="">Select prize...</option>
                    {prizes.map((prize) => (
                      <option key={prize.id} value={prize.id}>
                        #{prize.displayOrder} - {prize.title}
                      </option>
                    ))}
                  </select>
                  {selectedPrize && (
                    <p className="text-[#b8941f] text-xs mt-1">
                      Min bid: {formatCurrency(minBid)}
                    </p>
                  )}
                </div>

                {/* Bidder Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/50 text-xs mb-1">Bidder Name *</label>
                    <input
                      type="text"
                      value={extractedData.bidderName}
                      onChange={(e) => setExtractedData({ ...extractedData, bidderName: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#b8941f]"
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-xs mb-1">Table # *</label>
                    <input
                      type="text"
                      value={extractedData.tableNumber}
                      onChange={(e) => setExtractedData({ ...extractedData, tableNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#b8941f]"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-white/50 text-xs mb-1">Bid Amount (HKD) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">HK$</span>
                    <input
                      type="text"
                      value={extractedData.amount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, '')
                        setExtractedData({ ...extractedData, amount: val ? parseInt(val).toLocaleString() : '' })
                      }}
                      className="w-full pl-12 pr-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-lg font-bold focus:outline-none focus:border-[#b8941f]"
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/50 text-xs mb-1">Email (optional)</label>
                    <input
                      type="email"
                      value={extractedData.email}
                      onChange={(e) => setExtractedData({ ...extractedData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#b8941f]"
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-xs mb-1">Phone (optional)</label>
                    <input
                      type="tel"
                      value={extractedData.phone}
                      onChange={(e) => setExtractedData({ ...extractedData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#b8941f]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={resetForm}
                className="flex-1 py-3 rounded-xl font-medium border border-white/20 text-white/70 hover:bg-white/5 transition-colors"
              >
                Retake
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedPrize || !extractedData.bidderName || !extractedData.tableNumber || !extractedData.amount}
                className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-[#b8941f] to-[#d4af37] text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Submit Bid
              </button>
            </div>
          </div>
        )}

        {/* Submitting Step */}
        {step === 'submitting' && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-[#b8941f]/20 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-[#b8941f] animate-spin" />
            </div>
            <h2 className="text-white text-xl font-medium">Submitting Bid...</h2>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 animate-bounce">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Bid Submitted!</h2>
            <p className="text-white/70">{success}</p>
            <p className="text-white/40 text-sm mt-4">Ready for next scan...</p>
          </div>
        )}
      </div>
    </main>
  )
}
