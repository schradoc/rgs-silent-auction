'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, User, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBidder } from '@/hooks/useBidder'

interface HeaderProps {
  transparent?: boolean
}

const NAV_LINKS = [
  { href: '/prizes', label: 'Auction' },
  { href: '/impact', label: 'Impact' },
  { href: '/about', label: 'About' },
]

export function Header({ transparent = false }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { bidder, isLoading: bidderLoading } = useBidder()
  const isSignedIn = !!bidder

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const isTransparent = transparent && !scrolled && !mobileOpen

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-300',
          isTransparent
            ? 'bg-transparent'
            : 'bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 relative">
            {/* Left: Logo */}
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c9a227] to-[#a08a1e] flex items-center justify-center shadow-sm">
                <span className="text-white text-[10px] font-bold tracking-wide">RGS</span>
              </div>
              <div className="hidden sm:block">
                <p className={cn(
                  'text-sm font-semibold leading-tight transition-colors',
                  isTransparent ? 'text-white' : 'text-[#1a1a1a]'
                )}>
                  Silent Auction
                </p>
                <p className={cn(
                  'text-[10px] leading-tight transition-colors',
                  isTransparent ? 'text-white/50' : 'text-[#6b6b6b]'
                )}>
                  30th Anniversary
                </p>
              </div>
            </Link>

            {/* Center: Nav Links (Desktop) — absolutely positioned to be truly centered */}
            <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'relative px-4 py-2 text-sm font-medium transition-colors rounded-lg',
                      isTransparent
                        ? isActive
                          ? 'text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                        : isActive
                          ? 'text-[#1a1a1a]'
                          : 'text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-gray-50',
                    )}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#c9a227] rounded-full" />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Right: Icons + Mobile Hamburger */}
            <div className="flex items-center gap-2">
              {/* Favorites (Desktop) */}
              {!bidderLoading && isSignedIn && (
                <Link
                  href="/favorites"
                  className={cn(
                    'hidden md:flex p-2 rounded-full transition-colors',
                    isTransparent
                      ? 'hover:bg-white/10 text-white/70 hover:text-white'
                      : 'hover:bg-gray-100 text-[#6b6b6b] hover:text-[#1a1a1a]'
                  )}
                  title="Favorites"
                >
                  <Heart className="w-5 h-5" />
                </Link>
              )}

              {/* Profile / Register (Desktop) */}
              <div className="hidden md:block">
                {bidderLoading ? (
                  <div className="w-20 h-9 rounded-full bg-gray-100 animate-pulse" />
                ) : isSignedIn ? (
                  <Link
                    href="/profile"
                    className={cn(
                      'flex p-2 rounded-full transition-colors',
                      isTransparent
                        ? 'hover:bg-white/10 text-white/70 hover:text-white'
                        : 'hover:bg-gray-100 text-[#6b6b6b] hover:text-[#1a1a1a]'
                    )}
                    title="Profile"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="flex items-center gap-2 bg-[#c9a227] hover:bg-[#b8941f] text-white px-4 py-2 rounded-full transition-all text-sm font-medium"
                  >
                    Register
                  </Link>
                )}
              </div>

              {/* Hamburger (Mobile) */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={cn(
                  'md:hidden p-2 rounded-full transition-colors',
                  isTransparent
                    ? 'hover:bg-white/10 text-white'
                    : 'hover:bg-gray-100 text-[#1a1a1a]'
                )}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Slide-down Panel */}
        <div
          className={cn(
            'md:hidden overflow-hidden transition-all duration-300 ease-in-out',
            mobileOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className={cn(
            'px-4 pb-6 pt-2 border-t',
            isTransparent
              ? 'border-white/10 bg-[#0f1d2d]/95 backdrop-blur-md'
              : 'border-gray-100 bg-white'
          )}>
            <nav className="space-y-1 mb-4">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                      isTransparent
                        ? isActive
                          ? 'bg-white/10 text-white'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                        : isActive
                          ? 'bg-gray-50 text-[#1a1a1a]'
                          : 'text-[#6b6b6b] hover:bg-gray-50 hover:text-[#1a1a1a]',
                      isActive && 'border-l-2 border-[#c9a227]'
                    )}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            <div className={cn(
              'border-t pt-4 space-y-1',
              isTransparent ? 'border-white/10' : 'border-gray-100'
            )}>
              {bidderLoading ? (
                <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />
              ) : isSignedIn ? (
                <>
                  <Link
                    href="/my-bids"
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                      isTransparent
                        ? 'text-white/70 hover:bg-white/5 hover:text-white'
                        : 'text-[#6b6b6b] hover:bg-gray-50 hover:text-[#1a1a1a]'
                    )}
                  >
                    My Bids
                  </Link>
                  <Link
                    href="/favorites"
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                      isTransparent
                        ? 'text-white/70 hover:bg-white/5 hover:text-white'
                        : 'text-[#6b6b6b] hover:bg-gray-50 hover:text-[#1a1a1a]'
                    )}
                  >
                    <Heart className="w-4 h-4" />
                    Favorites
                  </Link>
                  <Link
                    href="/profile"
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                      isTransparent
                        ? 'text-white/70 hover:bg-white/5 hover:text-white'
                        : 'text-[#6b6b6b] hover:bg-gray-50 hover:text-[#1a1a1a]'
                    )}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                </>
              ) : (
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-2 bg-[#c9a227] hover:bg-[#b8941f] text-white px-4 py-3 rounded-xl transition-all text-sm font-medium"
                >
                  Register
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop overlay for mobile menu */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
