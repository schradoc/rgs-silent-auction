import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'

async function getWinners() {
  const { prisma } = await import('@/lib/prisma')

  const prizes = await prisma.prize.findMany({
    where: { isActive: true, parentPrizeId: null },
    include: {
      bids: {
        where: { status: 'WINNING' },
        include: {
          bidder: {
            select: { id: true, name: true, email: true, tableNumber: true },
          },
        },
        orderBy: { amount: 'desc' },
        take: 1,
      },
      winners: {
        include: {
          bidder: {
            select: { id: true, name: true, tableNumber: true },
          },
          bid: true,
        },
      },
    },
    orderBy: { title: 'asc' },
  })

  return prizes
}

export default async function PrintWinnersPage() {
  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('admin_session')?.value === 'true'

  if (!isAdmin) {
    redirect('/admin')
  }

  const prizes = await getWinners()

  const totalRaised = prizes.reduce((sum, p) => sum + p.currentHighestBid, 0)
  const prizesWithBids = prizes.filter((p) => p.bids.length > 0)

  return (
    <html>
      <head>
        <title>Winners - RGS-HK Silent Auction</title>
        <style>{`
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .page-break { page-break-after: always; }
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #fff;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #1e3a5f;
          }
          .header h1 {
            margin: 0 0 5px 0;
            color: #1e3a5f;
            font-size: 28px;
          }
          .header p {
            margin: 0;
            color: #666;
            font-size: 14px;
          }
          .summary {
            display: flex;
            justify-content: space-around;
            margin-bottom: 30px;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 8px;
          }
          .summary-item {
            text-align: center;
          }
          .summary-item .value {
            font-size: 32px;
            font-weight: bold;
            color: #1e3a5f;
          }
          .summary-item .label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
          }
          .winner-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 16px;
            overflow: hidden;
          }
          .winner-card.confirmed {
            border-color: #22c55e;
            border-width: 2px;
          }
          .winner-card-header {
            background: #f8f8f8;
            padding: 12px 16px;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .winner-card.confirmed .winner-card-header {
            background: #dcfce7;
          }
          .winner-card-header h3 {
            margin: 0;
            font-size: 16px;
            color: #333;
          }
          .winner-card-header .amount {
            font-size: 18px;
            font-weight: bold;
            color: #c9a227;
          }
          .winner-card-body {
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .winner-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .table-badge {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: #1e3a5f;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
          }
          .winner-details h4 {
            margin: 0 0 4px 0;
            font-size: 16px;
          }
          .winner-details p {
            margin: 0;
            color: #666;
            font-size: 14px;
          }
          .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
          }
          .status-confirmed {
            background: #dcfce7;
            color: #166534;
          }
          .status-pending {
            background: #fef3c7;
            color: #92400e;
          }
          .no-bids {
            padding: 16px;
            color: #999;
            font-style: italic;
          }
          .checkbox {
            width: 24px;
            height: 24px;
            border: 2px solid #ddd;
            border-radius: 4px;
            margin-right: 12px;
          }
          .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: #1e3a5f;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
          }
          .print-btn:hover {
            background: #2a4a6f;
          }
        `}</style>
      </head>
      <body>
        <button className="print-btn no-print" onClick={() => window.print()}>
          Print This Page
        </button>

        <div className="header">
          <h1>RGS-HK 30th Anniversary Gala</h1>
          <p>Silent Auction Winners • {new Date().toLocaleDateString()}</p>
        </div>

        <div className="summary">
          <div className="summary-item">
            <div className="value">{prizes.length}</div>
            <div className="label">Total Prizes</div>
          </div>
          <div className="summary-item">
            <div className="value">{prizesWithBids.length}</div>
            <div className="label">Prizes with Bids</div>
          </div>
          <div className="summary-item">
            <div className="value">{formatCurrency(totalRaised)}</div>
            <div className="label">Total Raised</div>
          </div>
        </div>

        {prizes.map((prize) => {
          const winningBid = prize.bids[0]
          const confirmedWinner = prize.winners[0]
          const isConfirmed = !!confirmedWinner

          return (
            <div key={prize.id} className={`winner-card ${isConfirmed ? 'confirmed' : ''}`}>
              <div className="winner-card-header">
                <h3>{prize.title}</h3>
                {winningBid && (
                  <span className="amount">{formatCurrency(winningBid.amount)}</span>
                )}
              </div>

              {winningBid ? (
                <div className="winner-card-body">
                  <div className="winner-info">
                    <div className="checkbox" />
                    <div className="table-badge">{winningBid.bidder.tableNumber}</div>
                    <div className="winner-details">
                      <h4>{winningBid.bidder.name}</h4>
                      <p>{winningBid.bidder.email}</p>
                    </div>
                  </div>
                  <span className={`status-badge ${isConfirmed ? 'status-confirmed' : 'status-pending'}`}>
                    {isConfirmed ? '✓ Confirmed' : 'Pending'}
                  </span>
                </div>
              ) : (
                <div className="no-bids">No bids received</div>
              )}
            </div>
          )
        })}

        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.querySelector('.print-btn').addEventListener('click', function() {
                window.print();
              });
            `,
          }}
        />
      </body>
    </html>
  )
}
