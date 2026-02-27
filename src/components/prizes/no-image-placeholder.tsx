/**
 * Branded placeholder for lots without images.
 * Shows the RGS gold circle logo with a topographic pattern
 * on a dark navy background.
 */

interface NoImagePlaceholderProps {
  lotNumber?: number | null
  subLotLetter?: string | null
  /** 'card' for prize cards, 'detail' for the full detail page */
  variant?: 'card' | 'detail'
}

export function NoImagePlaceholder({
  lotNumber,
  subLotLetter,
  variant = 'card',
}: NoImagePlaceholderProps) {
  const isDetail = variant === 'detail'

  // Circle and text sizing based on variant
  const circleSize = isDetail ? 120 : 80
  const fontSize = isDetail ? 'text-2xl' : 'text-base'
  const subTextSize = isDetail ? 'text-sm' : 'text-[10px]'
  const ringStroke = isDetail ? 3 : 2

  const lotLabel = lotNumber
    ? `${lotNumber}${subLotLetter ? `.${subLotLetter}` : ''}`
    : null

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0f1d2d]">
      {/* Topographic pattern SVG background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 400 300"
      >
        <defs>
          <style>{`path { fill: none; stroke: #c9a227; stroke-width: 1; }`}</style>
        </defs>
        {/* Topographic contour lines */}
        <path d="M-20,80 Q60,40 140,70 T300,50 T460,80" />
        <path d="M-20,100 Q80,60 160,90 T320,70 T460,100" />
        <path d="M-20,120 Q100,80 180,110 T340,90 T460,120" />
        <path d="M-20,140 Q70,110 150,130 T310,115 T460,145" />
        <path d="M-20,160 Q90,130 170,155 T330,140 T460,165" />
        <path d="M-20,180 Q60,160 140,175 T300,160 T460,185" />
        <path d="M-20,200 Q80,180 160,195 T320,180 T460,205" />
        <path d="M-20,220 Q100,200 180,215 T340,200 T460,225" />
        <path d="M-20,240 Q70,225 150,235 T310,225 T460,245" />
        {/* Additional organic curves */}
        <path d="M-20,60 Q50,30 120,55 T280,35 T460,60" />
        <path d="M-20,260 Q90,245 170,255 T330,245 T460,265" />
        <path d="M50,0 Q70,60 60,120 T80,240 T60,300" />
        <path d="M150,0 Q170,50 160,100 T180,200 T160,300" />
        <path d="M250,0 Q230,70 240,130 T220,230 T240,300" />
        <path d="M350,0 Q330,60 340,120 T320,220 T340,300" />
      </svg>

      {/* Centered logo + lot number */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Gold circle ring (RGS logo feel) */}
        <div className="relative" style={{ width: circleSize, height: circleSize }}>
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer ring */}
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#c9a227"
              strokeWidth={ringStroke}
              opacity="0.6"
            />
            {/* Inner ring */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="#c9a227"
              strokeWidth={ringStroke * 0.6}
              opacity="0.3"
            />
            {/* Compass-like cross marks */}
            <line x1="50" y1="4" x2="50" y2="12" stroke="#c9a227" strokeWidth={ringStroke * 0.6} opacity="0.4" />
            <line x1="50" y1="88" x2="50" y2="96" stroke="#c9a227" strokeWidth={ringStroke * 0.6} opacity="0.4" />
            <line x1="4" y1="50" x2="12" y2="50" stroke="#c9a227" strokeWidth={ringStroke * 0.6} opacity="0.4" />
            <line x1="88" y1="50" x2="96" y2="50" stroke="#c9a227" strokeWidth={ringStroke * 0.6} opacity="0.4" />
          </svg>

          {/* Lot number inside the circle */}
          {lotLabel ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`${subTextSize} font-medium tracking-[0.2em] uppercase text-[#c9a227]/50`}>
                LOT
              </span>
              <span className={`${fontSize} font-bold tracking-tight text-[#c9a227]/80 -mt-0.5`}>
                {lotLabel}
              </span>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`${subTextSize} font-semibold tracking-[0.25em] uppercase text-[#c9a227]/40`}>
                RGS
              </span>
            </div>
          )}
        </div>

        {/* Subtle tagline below */}
        <p className={`mt-3 ${isDetail ? 'text-xs' : 'text-[9px]'} tracking-[0.15em] uppercase text-[#c9a227]/25 font-medium`}>
          Silent Auction
        </p>
      </div>
    </div>
  )
}
