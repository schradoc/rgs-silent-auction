export const SITE_CONFIG = {
  name: 'RGS-HK Silent Auction',
  description: 'Royal Geographical Society Hong Kong 30th Anniversary Gala Dinner Silent Auction',
  eventDate: '2026-02-28',
  eventVenue: 'Hong Kong Club',
  eventTime: '6:30pm - 11:00pm',
}

export const BRAND_COLORS = {
  navy: '#1e3a5f',
  gold: '#c9a227',
  white: '#ffffff',
  lightGray: '#f5f5f5',
  darkGray: '#374151',
}

export const CATEGORY_LABELS = {
  HISTORIC_ITEMS: 'Historic Items',
  EXPERIENCES: 'Experiences',
  TRAVEL: 'Travel',
  DINING: 'Dining',
  PLEDGES: 'Pledges',
} as const

export const BID_STATUS_LABELS = {
  ACTIVE: 'Active',
  OUTBID: 'Outbid',
  WINNING: 'Winning',
  WON: 'Won',
  LOST: 'Lost',
} as const

export const COOKIE_NAMES = {
  bidderId: 'rgs_bidder_id',
  adminToken: 'rgs_admin_token',
  adminSession: 'rgs_admin_session',
}
