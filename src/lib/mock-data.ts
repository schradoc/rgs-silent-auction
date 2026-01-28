// Mock data for demo/preview when database is not connected

export const mockPrizes = [
  {
    id: '1',
    slug: 'historic-map-northern-arabia-1850',
    title: 'Historic Map: Northern Arabia (1850)',
    shortDescription: 'Original framed map by G.A. Wallin from the RGS London archives',
    fullDescription: `Founded in 1830, the Royal Geographical Society has played a pioneering role in the advancement of geography and exploration. The RGS archives in London boast a collection of over two million items, tracing 500 years of geographical discovery and research.

This original framed historical map from the archives of RGS London depicts the Northern Part of Arabia by Mr. G. A. Wallin from 1850. A rare piece of cartographic history available to take home after the dinner.`,
    donorName: 'RGS-HK',
    minimumBid: 3000,
    currentHighestBid: 3500,
    category: 'HISTORIC_ITEMS' as const,
    multiWinnerEligible: false,
    multiWinnerSlots: null,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800',
    terms: 'Delivery excluded. May be taken on the night.',
    displayOrder: 1,
    isActive: true,
    parentPrizeId: null,
    tierLevel: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    slug: 'private-cocktail-making-course',
    title: 'Private Cocktail Making Course',
    shortDescription: "Learn from Asia's 50 Best mixologist Sandeep Kumar at The Wise King",
    fullDescription: `Come and join one of Asia's 50 Best mixologists for a personally crafted experience. From the creator of cocktails such as the Pistachio Sour and the Mandarino Negroni, Sandeep Kumar will share with you tips and tricks on how to elevate your favourite cocktail.

All of this will be concocted by you and your guests in the plush, private setting of The Wise King in the heart of Central. For 6-8 people.`,
    donorName: 'The Wise King',
    minimumBid: 8000,
    currentHighestBid: 0,
    category: 'EXPERIENCES' as const,
    multiWinnerEligible: false,
    multiWinnerSlots: null,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800',
    terms: 'Availability of dates to be discussed. Maximum 8 guests.',
    displayOrder: 10,
    isActive: true,
    parentPrizeId: null,
    tierLevel: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    slug: 'firing-the-noon-day-gun',
    title: 'Firing the Noon-Day Gun',
    shortDescription: "Fire Hong Kong's legendary gun with champagne reception for 40 guests",
    fullDescription: `"In Hong Kong, they strike a gong, and fire off a noonday gun, To reprimand each inmate who's in late" - Sir Noel Coward

Enjoy the legendary experience of firing the Hong Kong Noonday Gun, fired daily since the 1860s. When you pull the trigger to fire the Gun over Victoria Harbour, you mark the stroke of Noon for Hong Kong.

This amazing experience includes a champagne reception for up to 40 guests.`,
    donorName: 'Jardine Group',
    minimumBid: 48000,
    currentHighestBid: 50000,
    category: 'EXPERIENCES' as const,
    multiWinnerEligible: false,
    multiWinnerSlots: null,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800',
    terms: 'Monday to Friday only. 2 months notice required.',
    displayOrder: 11,
    isActive: true,
    parentPrizeId: null,
    tierLevel: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    slug: 'kruger-safari-one-week-for-2',
    title: 'Kruger Safari: One Week for 2',
    shortDescription: 'Luxury safari to Kruger National Park and Sabi Sand Game Reserve',
    fullDescription: `Day 1-2: Stay at the legendary, all-suite 5-star Ten Bompas boutique hotel. Scenic drive to the Sabi Sand Game Reserve.

Day 3-4: Game drives in the Sabi Sand Private Reserve with a good chance to see the Big Five. Night safari exploration.

Day 5-7: Overnight stay in Kruger National Park. Panorama Tour to see God's Window and more.`,
    donorName: 'Leading International Tour Operator',
    minimumBid: 70000,
    currentHighestBid: 75000,
    category: 'TRAVEL' as const,
    multiWinnerEligible: false,
    multiWinnerSlots: null,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800',
    terms: 'International travel and insurance are winner\'s responsibility.',
    displayOrder: 20,
    isActive: true,
    parentPrizeId: null,
    tierLevel: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    slug: 'arctic-lapland-retreat-for-2',
    title: 'Arctic Lapland Retreat for 2',
    shortDescription: 'One week in Finnish Lapland with husky sledding and northern lights',
    fullDescription: `Escape to the breathtaking winter wonderland of Arctic Lapland for a once-in-a-lifetime adventure. 200 kilometers north of the Arctic Circle.

Activities include husky sledding, snowmobiling, backcountry skiing, snowshoeing, and reindeer rides. Arctic winter gear provided.`,
    donorName: 'Riitta Hanninen & Arctic Escapades',
    minimumBid: 85000,
    currentHighestBid: 0,
    category: 'TRAVEL' as const,
    multiWinnerEligible: false,
    multiWinnerSlots: null,
    validUntil: new Date('2027-04-30'),
    imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800',
    terms: 'Flights are winner\'s responsibility. Breakfast included.',
    displayOrder: 24,
    isActive: true,
    parentPrizeId: null,
    tierLevel: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '6',
    slug: 'mongolia-eagle-hunters-expedition',
    title: 'Mongolia Eagle Hunters Expedition',
    shortDescription: 'One week living with Kazakh Eagle Hunters in the Altai Mountains',
    fullDescription: `Enjoy a week in western Mongolia including 5 days in the Altai Mountains staying in private Gers and hunting wolf and fox with Kazakh Eagle Hunters.

Learn how the Hunter trains his Eagle, see traditional dress, and even land the eagle on your own arm.`,
    donorName: 'Christopher Schrader, FoundLost & RGS-HK',
    minimumBid: 60000,
    currentHighestBid: 65000,
    category: 'TRAVEL' as const,
    multiWinnerEligible: false,
    multiWinnerSlots: null,
    validUntil: new Date('2027-12-31'),
    imageUrl: 'https://images.unsplash.com/photo-1596467745893-0e2eb1c4ad0c?w=800',
    terms: 'Meals included except in Ulaanbaatar. Flights not included.',
    displayOrder: 29,
    isActive: true,
    parentPrizeId: null,
    tierLevel: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '7',
    slug: 'dinner-for-12-at-hong-kong-club',
    title: 'Dinner for 12 at Hong Kong Club with RGS Speaker',
    shortDescription: 'Private four-course dinner with your choice from 60 world-class speakers',
    fullDescription: `Each year the Royal Geographical Society – Hong Kong hosts some 60 speakers from around the world, all of them leading experts in their field.

You take your pick from our next 60 speakers and we provide a private room at the Hong Kong Club for the ultimate dinner party.`,
    donorName: 'RGS-HK',
    minimumBid: 28000,
    currentHighestBid: 30000,
    category: 'DINING' as const,
    multiWinnerEligible: false,
    multiWinnerSlots: null,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    terms: 'Food only, drinks excluded. Dinner for 12 includes 10 guests, a speaker and an RGS-HK representative.',
    displayOrder: 12,
    isActive: true,
    parentPrizeId: null,
    tierLevel: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '8',
    slug: 'tuscany-chianti-vineyard-week',
    title: 'Tuscany Chianti Vineyard Week for 2',
    shortDescription: 'San Gimignano and Chianti wine region luxury holiday',
    fullDescription: `The first two days in the legendary Tuscan hilltop town of San Gimignano. Then three days in a beautiful vineyard in the Chianti wine region with swimming pool, jacuzzi, and stunning views.

*7 rooms available - multiple winners possible*`,
    donorName: 'The Owners & RGS-HK',
    minimumBid: 30000,
    currentHighestBid: 35000,
    category: 'TRAVEL' as const,
    multiWinnerEligible: true,
    multiWinnerSlots: 7,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800',
    terms: 'Breakfast included. Flights are winner\'s responsibility.',
    displayOrder: 22,
    isActive: true,
    parentPrizeId: null,
    tierLevel: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '9',
    slug: 'schools-outreach-pledge-gold',
    title: 'Schools Outreach Pledge - Gold',
    shortDescription: 'Become Sponsor, Host and Annual Prize Giver at award ceremonies',
    fullDescription: `Your $30,000 pledge includes nominating schools for talks plus you become the Sponsor, Host and Annual Prize Giver of our award ceremonies.

A prominent role in supporting the next generation of geographers and explorers in Hong Kong.`,
    donorName: 'RGS-HK',
    minimumBid: 30000,
    currentHighestBid: 0,
    category: 'PLEDGES' as const,
    multiWinnerEligible: true,
    multiWinnerSlots: null,
    tierLevel: 3,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
    terms: 'By agreement with RGS-HK.',
    displayOrder: 32,
    isActive: true,
    parentPrizeId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const mockBids = [
  { id: '1', amount: 3500, bidderId: '1', prizeId: '1', status: 'WINNING', createdAt: new Date(), bidder: { tableNumber: '5' } },
  { id: '2', amount: 50000, bidderId: '2', prizeId: '3', status: 'WINNING', createdAt: new Date(), bidder: { tableNumber: '12' } },
  { id: '3', amount: 75000, bidderId: '3', prizeId: '4', status: 'WINNING', createdAt: new Date(), bidder: { tableNumber: '3' } },
  { id: '4', amount: 65000, bidderId: '1', prizeId: '6', status: 'WINNING', createdAt: new Date(), bidder: { tableNumber: '5' } },
  { id: '5', amount: 30000, bidderId: '2', prizeId: '7', status: 'WINNING', createdAt: new Date(), bidder: { tableNumber: '12' } },
  { id: '6', amount: 35000, bidderId: '3', prizeId: '8', status: 'WINNING', createdAt: new Date(), bidder: { tableNumber: '3' } },
]

export function getMockPrize(slug: string) {
  const prize = mockPrizes.find(p => p.slug === slug)
  if (!prize) return null

  const bids = mockBids
    .filter(b => b.prizeId === prize.id)
    .sort((a, b) => b.amount - a.amount)

  return { ...prize, bids, variants: [] }
}
