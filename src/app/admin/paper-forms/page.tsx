'use client'

import { useRef } from 'react'
import { Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PaperFormsPage() {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - hidden when printing */}
      <header className="bg-[#1e3a5f] text-white py-4 print:hidden">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="p-2 hover:bg-white/10 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Paper Bid Forms</h1>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-[#c9a227] text-white rounded-lg hover:bg-[#b8941f] transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Forms
          </button>
        </div>
      </header>

      {/* Instructions - hidden when printing */}
      <div className="max-w-4xl mx-auto px-4 py-6 print:hidden">
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">Instructions</h2>
          <ul className="text-gray-600 text-sm space-y-1">
            <li>Print these forms on A4 paper (4 forms per page)</li>
            <li>Cut along the dotted lines</li>
            <li>Place forms at each table or have helpers distribute them</li>
            <li>Helpers can scan completed forms using the Scan Paper Bid feature</li>
          </ul>
        </div>
      </div>

      {/* Printable Forms */}
      <div ref={printRef} className="max-w-4xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-2 gap-4 print:gap-0">
          {[1, 2, 3, 4].map((i) => (
            <PaperBidForm key={i} />
          ))}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:gap-0 {
            gap: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}

function PaperBidForm() {
  return (
    <div className="bg-white border-2 border-dashed border-gray-300 p-6 print:border-gray-400 print:p-4">
      {/* Header */}
      <div className="text-center border-b-2 border-[#1e3a5f] pb-3 mb-4">
        <h2 className="text-xl font-bold text-[#1e3a5f] tracking-wide">RGS-HK SILENT AUCTION</h2>
        <p className="text-xs text-gray-500">30th Anniversary Gala Dinner</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Table Number */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 w-24">TABLE #:</label>
          <div className="flex-1 border-b-2 border-gray-300 h-8 flex items-end">
            <div className="w-16 h-6 border border-gray-400 rounded text-center text-lg font-mono"></div>
          </div>
        </div>

        {/* Name */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 w-24">NAME:</label>
          <div className="flex-1 border-b-2 border-gray-300 h-8"></div>
        </div>

        {/* Prize Number */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 w-24">PRIZE #:</label>
          <div className="flex-1">
            <div className="w-16 h-8 border-2 border-gray-400 rounded text-center text-lg font-mono"></div>
            <p className="text-xs text-gray-400 mt-1">(See prize number on display)</p>
          </div>
        </div>

        {/* Bid Amount */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 w-24">BID AMOUNT:</label>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-lg font-medium text-gray-700">HK$</span>
            <div className="flex-1 border-b-2 border-gray-300 h-8"></div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Optional - for outbid notifications:</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">EMAIL:</label>
              <div className="border-b border-gray-300 h-6 mt-1"></div>
            </div>
            <div>
              <label className="text-xs text-gray-500">PHONE:</label>
              <div className="border-b border-gray-300 h-6 mt-1"></div>
            </div>
          </div>
        </div>

        {/* Checkbox */}
        <div className="flex items-center gap-2 pt-2">
          <div className="w-5 h-5 border-2 border-gray-400 rounded"></div>
          <span className="text-sm text-gray-600">Notify me if outbid</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">Hand this form to a helper or place in bid box</p>
      </div>
    </div>
  )
}
