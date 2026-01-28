'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Search,
  Camera,
  Check,
  AlertCircle,
  Sparkles,
  ChevronDown,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Prize {
  id: string
  title: string
  slug: string
  minimumBid: number
  currentHighestBid: number
  category: string
}

export default function HelperSubmitBidPage() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null)
  const [prizeSearch, setPrizeSearch] = useState('')
  const [showPrizeDropdown, setShowPrizeDropdown] = useState(false)

  const [bidderName, setBidderName] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isPaperBid, setIsPaperBid] = useState(false)

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    fetchPrizes()
    checkAuth()
  }, [])

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

  const filteredPrizes = prizes.filter((prize) =>
    prize.title.toLowerCase().includes(prizeSearch.toLowerCase())
  )

  const minBid = selectedPrize
    ? Math.max(selectedPrize.minimumBid, selectedPrize.currentHighestBid + 100)
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPrize || !bidderName || !tableNumber || !amount) {
      setError('Please fill in all required fields')
      return
    }

    const bidAmount = parseInt(amount.replace(/[^\d]/g, ''))
    if (bidAmount < minBid) {
      setError(`Bid must be at least ${formatCurrency(minBid)}`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/helpers/submit-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidderName,
          tableNumber,
          prizeId: selectedPrize.id,
          amount: bidAmount,
          email: email || undefined,
          phone: phone || undefined,
          isPaperBid,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit bid')
        return
      }

      setSuccess(`${formatCurrency(bidAmount)} bid placed for ${bidderName}!`)

      // Reset form after 2 seconds
      setTimeout(() => {
        setSuccess(null)
        setSelectedPrize(null)
        setBidderName('')
        setTableNumber('')
        setAmount('')
        setEmail('')
        setPhone('')
        setIsPaperBid(false)
        setPrizeSearch('')
      }, 2000)
    } catch (err) {
      setError('Failed to submit bid')
    } finally {
      setLoading(false)
    }
  }

  const suggestedAmounts = selectedPrize
    ? [
        minBid,
        Math.ceil(minBid * 1.1 / 100) * 100,
        Math.ceil(minBid * 1.25 / 100) * 100,
        Math.ceil(minBid * 1.5 / 100) * 100,
      ]
    : []

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
          <h1 className="text-white font-semibold">Submit Bid</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Success State */}
        {success && (
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-[#0f1d2d]/95 transition-all duration-300`}
          >
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Check className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-white text-2xl font-bold mb-2">Bid Submitted!</h2>
              <p className="text-white/70">{success}</p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={`space-y-5 transition-all duration-500 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Prize Selection */}
          <div className="relative">
            <label className="block text-white/70 text-sm mb-2">Select Prize *</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPrizeDropdown(!showPrizeDropdown)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-left text-white flex items-center justify-between focus:outline-none focus:border-[#b8941f]"
              >
                <span className={selectedPrize ? 'text-white' : 'text-white/50'}>
                  {selectedPrize ? selectedPrize.title : 'Choose a prize...'}
                </span>
                <ChevronDown className="w-5 h-5 text-white/50" />
              </button>

              {showPrizeDropdown && (
                <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-[#1a2f4a] border border-white/20 rounded-xl overflow-hidden shadow-2xl max-h-64 overflow-y-auto">
                  <div className="sticky top-0 bg-[#1a2f4a] p-2 border-b border-white/10">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        placeholder="Search prizes..."
                        value={prizeSearch}
                        onChange={(e) => setPrizeSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#b8941f]"
                      />
                    </div>
                  </div>
                  {filteredPrizes.map((prize) => (
                    <button
                      key={prize.id}
                      type="button"
                      onClick={() => {
                        setSelectedPrize(prize)
                        setShowPrizeDropdown(false)
                        setPrizeSearch('')
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                    >
                      <p className="text-white text-sm font-medium">{prize.title}</p>
                      <p className="text-white/50 text-xs">
                        Current: {formatCurrency(prize.currentHighestBid)} · Min: {formatCurrency(prize.minimumBid)}
                      </p>
                    </button>
                  ))}
                  {filteredPrizes.length === 0 && (
                    <p className="px-4 py-3 text-white/50 text-sm text-center">No prizes found</p>
                  )}
                </div>
              )}
            </div>
            {selectedPrize && (
              <p className="mt-2 text-[#b8941f] text-sm">
                Min bid: {formatCurrency(minBid)}
              </p>
            )}
          </div>

          {/* Bidder Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">Bidder Name *</label>
              <input
                type="text"
                value={bidderName}
                onChange={(e) => setBidderName(e.target.value)}
                placeholder="John Smith"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#b8941f]"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Table # *</label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="7"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#b8941f]"
              />
            </div>
          </div>

          {/* Bid Amount */}
          <div>
            <label className="block text-white/70 text-sm mb-2">Bid Amount (HKD) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">HK$</span>
              <input
                type="text"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d]/g, '')
                  setAmount(val ? parseInt(val).toLocaleString() : '')
                }}
                placeholder="50,000"
                className="w-full pl-14 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white text-xl font-bold placeholder:text-white/30 placeholder:font-normal focus:outline-none focus:border-[#b8941f]"
              />
            </div>
            {selectedPrize && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {suggestedAmounts.map((suggested) => (
                  <button
                    key={suggested}
                    type="button"
                    onClick={() => setAmount(suggested.toLocaleString())}
                    className="flex-shrink-0 px-3 py-1.5 bg-white/5 border border-white/20 rounded-lg text-white/70 text-sm hover:bg-[#b8941f]/20 hover:border-[#b8941f]/50 transition-colors"
                  >
                    {formatCurrency(suggested)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Optional Contact Info */}
          <div className="space-y-4 pt-2">
            <p className="text-white/50 text-sm">Optional contact info (for outbid notifications)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#b8941f] text-sm"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+852 9123 4567"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#b8941f] text-sm"
                />
              </div>
            </div>
          </div>

          {/* Paper Bid Toggle */}
          <div className="flex items-center gap-3 py-2">
            <button
              type="button"
              onClick={() => setIsPaperBid(!isPaperBid)}
              className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
                isPaperBid ? 'bg-[#b8941f]' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  isPaperBid ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-white/70 text-sm">This is a paper bid</span>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !selectedPrize || !bidderName || !tableNumber || !amount}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              loading || !selectedPrize || !bidderName || !tableNumber || !amount
                ? 'bg-white/10 text-white/30 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#b8941f] to-[#d4af37] text-white hover:shadow-lg hover:shadow-[#b8941f]/30 hover:scale-[1.02]'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Submit Bid
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  )
}
