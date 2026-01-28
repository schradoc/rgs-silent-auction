import { PrismaClient, Category } from '@prisma/client'
import { slugify } from '../src/lib/utils'

const prisma = new PrismaClient()

const prizes = [
  // Historic Maps (7 separate items)
  {
    title: 'Historic Map: Northern Arabia (1850)',
    shortDescription: 'Original framed map by G.A. Wallin from the RGS London archives',
    fullDescription: `Founded in 1830, the Royal Geographical Society has played a pioneering role in the advancement of geography and exploration. The RGS archives in London boast a collection of over two million items, tracing 500 years of geographical discovery and research.

This original framed historical map from the archives of RGS London depicts the Northern Part of Arabia by Mr. G. A. Wallin from 1850. A rare piece of cartographic history available to take home after the dinner.`,
    donorName: 'RGS-HK',
    minimumBid: 3000,
    category: Category.HISTORIC_ITEMS,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800',
    terms: 'Delivery excluded. May be taken on the night.',
    displayOrder: 1,
  },
  {
    title: 'Historic Map: Burma (1856)',
    shortDescription: 'Original framed map by Henry Yule from the RGS London archives',
    fullDescription: `This original framed historical map from the archives of RGS London depicts Burma by Henry Yule from 1856. A stunning piece showcasing the detailed cartography of Southeast Asia in the mid-19th century.`,
    donorName: 'RGS-HK',
    minimumBid: 4000,
    category: Category.HISTORIC_ITEMS,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?w=800',
    terms: 'Delivery excluded. May be taken on the night.',
    displayOrder: 2,
  },
  {
    title: 'Historic Map: River Kong of Cassia (1869)',
    shortDescription: 'Original framed map by Albert S. Bickmore from the RGS London archives',
    fullDescription: `This original framed historical map from the archives of RGS London depicts The River Kong of Cassia by Albert S. Bickmore Esq. M.A. from 1869. An exceptional piece of exploration history.`,
    donorName: 'RGS-HK',
    minimumBid: 4500,
    category: Category.HISTORIC_ITEMS,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1548345680-f5475ea5df84?w=800',
    terms: 'Delivery excluded. May be taken on the night.',
    displayOrder: 3,
  },
  {
    title: 'Historic Map: Himalayan Valleys (1891)',
    shortDescription: 'The passes from India to Eastern Turkistan - original framed map',
    fullDescription: `This original framed historical map from the archives of RGS London depicts the Himalayan Valleys: The passes from India to Eastern Turkistan from 1891. A fascinating document of the Great Game era and Himalayan exploration.`,
    donorName: 'RGS-HK',
    minimumBid: 5000,
    category: Category.HISTORIC_ITEMS,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    terms: 'Delivery excluded. May be taken on the night.',
    displayOrder: 4,
  },
  {
    title: 'Historic Map: European Boundaries (1960)',
    shortDescription: '18th, 19th and 20th Century Boundaries of Europe',
    fullDescription: `This original framed historical map from the archives of RGS London depicts the Eighteenth, Nineteenth and Twentieth Century Boundaries of Europe from 1960. A unique visualization of Europe's changing borders across three centuries.`,
    donorName: 'RGS-HK',
    minimumBid: 3500,
    category: Category.HISTORIC_ITEMS,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800',
    terms: 'Delivery excluded. May be taken on the night.',
    displayOrder: 5,
  },
  {
    title: 'Historic Map: Russian Expedition in Mongolia (1910)',
    shortDescription: 'Routes of the Imperial Russian Geographical Society expedition',
    fullDescription: `This original framed historical map from the archives of RGS London depicts the Routes of The Imperial Russian Geographical Society's Expedition in Kan-Su and Mongolia from 1910. A remarkable document of Central Asian exploration.`,
    donorName: 'RGS-HK',
    minimumBid: 5500,
    category: Category.HISTORIC_ITEMS,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800',
    terms: 'Delivery excluded. May be taken on the night.',
    displayOrder: 6,
  },
  {
    title: 'Historic Map: Rivers of Tibet (1902)',
    shortDescription: 'Traverse across Ya Lung, Yangtse, Mekong & Salwen Rivers',
    fullDescription: `This original framed historical map from the archives of RGS London depicts the Traverse across the Ya Lung, Yangtse, Mekong & Salwen Rivers, to the Irawadi from 1902. An extraordinary record of one of the most challenging geographic surveys ever undertaken.`,
    donorName: 'RGS-HK',
    minimumBid: 6000,
    category: Category.HISTORIC_ITEMS,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    terms: 'Delivery excluded. May be taken on the night.',
    displayOrder: 7,
  },

  // Experiences
  {
    title: 'Private Cocktail Making Course',
    shortDescription: 'Learn from Asia\'s 50 Best mixologist Sandeep Kumar at The Wise King',
    fullDescription: `Come and join one of Asia's 50 Best mixologists for a personally crafted experience. From the creator of cocktails such as the Pistachio Sour and the Mandarino Negroni, Sandeep Kumar will share with you tips and tricks on how to elevate your favourite cocktail, or help you create a new one.

All of this will be concocted by you and your guests in the plush, private setting of The Wise King in the heart of Central: an intimate space with velvet seats and golden Damask style wallpaper, inspired by Alfonso X of Castile.

Sandeep Kumar has 20 years of experience and has made his mark in the bar industry worldwide. He became the first Indian Bacardi Grand Prix National Champion in 2006 and was again bestowed the coveted title in 2008.

For 6-8 people.`,
    donorName: 'The Wise King',
    minimumBid: 8000,
    category: Category.EXPERIENCES,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800',
    terms: 'Availability of dates to be discussed. Indicative timing 6-8pm. Maximum 8 guests. Not available on public holidays.',
    displayOrder: 10,
  },
  {
    title: 'Firing the Noon-Day Gun',
    shortDescription: 'Fire Hong Kong\'s legendary gun with champagne reception for 40 guests',
    fullDescription: `"In Hong Kong, they strike a gong, and fire off a noonday gun, To reprimand each inmate who's in late" - Sir Noel Coward

Enjoy the legendary experience of firing the Hong Kong Noonday Gun, fired daily since the 1860s. When you pull the trigger to fire the Gun over Victoria Harbour, you mark the stroke of Noon for Hong Kong.

This amazing experience includes a champagne reception for up to 40 guests sipping their drinks as they witness you firing the famous gun. You may also request an engraved cartridge in a presentation box.`,
    donorName: 'Jardine Group',
    minimumBid: 48000,
    category: Category.EXPERIENCES,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800',
    terms: 'Monday to Friday only. Public holidays and maintenance days excluded. 2 months notice required.',
    displayOrder: 11,
  },
  {
    title: 'Dinner for 12 at Hong Kong Club with RGS Speaker',
    shortDescription: 'Private four-course dinner with your choice from 60 world-class speakers',
    fullDescription: `Each year the Royal Geographical Society – Hong Kong hosts some 60 speakers from around the world, all of them leading experts in their field.

You take your pick from our next 60 speakers and we provide a private room at the Hong Kong Club for the ultimate dinner party, for a special occasion, to inspire your family and friends, or to give your clients a unique experience.

This is a special opportunity to entertain in luxury with a fine four-course dinner for 12 guests.`,
    donorName: 'RGS-HK',
    minimumBid: 28000,
    category: Category.DINING,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    terms: 'Food only, drinks excluded. Dinner for 12 includes 10 guests, a speaker and an RGS-HK representative.',
    displayOrder: 12,
  },
  {
    title: 'Seminar: Collecting Historic Maps',
    shortDescription: 'Private evening at Wattis Fine Art Gallery with expert dealers',
    fullDescription: `The evening begins with an expert's insight into centuries-old historic maps and prints. Here is your opportunity for an exclusive seminar introducing you to the fascinating world of collecting original historic maps, prints and books.

The seminar highlights a special exhibition of antiquarian maps, books and art works and touches on the dos and don'ts of investing in and collecting these historic items.

This private event is for 6 to 8 people and is held at the Wattis Fine Art Gallery on Hollywood Road, Central. Expert dealers Jonathan and Vicky Wattis are joined by long-time collector Julian Stargardt.

A selection of wines and light refreshments are served during the event.`,
    donorName: 'Wattis Fine Art Gallery & Julian Stargardt',
    minimumBid: 8000,
    category: Category.EXPERIENCES,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
    terms: 'Availability of dates with prize donors. 6-8 guests including winner. Not available on public holidays.',
    displayOrder: 13,
  },
  {
    title: 'Seminar: Collecting Rare Books',
    shortDescription: 'Private evening at Lokman Rare Books with fine wines',
    fullDescription: `Immerse yourself in a captivating evening of rare books and fine wine at the exquisite Lokman Rare Books in Central. A private seminar that delves into the art of collecting rare books, 1st editions, and antiquarian treasures.

Hosted by esteemed dealer Lorence Johnston and long-time collector Julian Stargardt, you'll discover what truly makes a book interesting and valuable, and learn the essential tips and tricks for investing in and collecting these precious literary and artistic artifacts.

Lokman Rare Books is a treasure trove located in Chancery Lane, Hong Kong. Their superb collection spans modern and classic literature, children's literature, food and wine, history and travel, economics and finance, and sport and hobbies.

For 6-8 people with wines and light refreshments.`,
    donorName: 'Lokman Rare Books & Julian Stargardt',
    minimumBid: 8000,
    category: Category.EXPERIENCES,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800',
    terms: 'Availability of dates with prize donors. 6-8 guests including winner. Not available on public holidays.',
    displayOrder: 14,
  },
  {
    title: 'Sailing on Yacht Jadalinkir',
    shortDescription: 'Full day sailing for 12 on Hong Kong\'s most historic yacht',
    fullDescription: `Jadalinkir first took to the seas in 1946. Initially built for Jardines, she is one of the oldest and most beautiful yachts in Hong Kong. This prize is to enjoy a full day's sailing with up to twelve people on this classic 38-foot ketch.

Departing from the Royal Hong Kong Yacht Club in Hebe Haven, you'll enjoy a lovely sail in the beautiful waters surrounding the Hong Kong UNESCO Geopark. This is followed by swimming, and a picnic in a remote bay of your choice or alternatively lunch at a floating seafood restaurant.

The yacht comes with a fully organised professional crew, who'll make a special day, be it a birthday, anniversary or great fun with friends.`,
    donorName: 'Rupert McCowan & RGS-HK',
    minimumBid: 15000,
    category: Category.EXPERIENCES,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=800',
    terms: 'Yacht only. Weather permitting. Local travel and insurance are winner\'s responsibility. 12 guests max.',
    displayOrder: 15,
  },
  {
    title: 'WWII Airplane Archaeological Dig',
    shortDescription: 'Lunch in Stanley followed by private tour of secret crash site',
    fullDescription: `On 16 January 1945, Hong Kong experienced its heaviest air raid in history – Operation Gratitude. Four American warplanes are known to have crashed in Hong Kong that day.

Eight years ago, a chunk of metal was discovered high above the Tai Tam reservoir, leading to one of the American airplanes being discovered for the first time.

Following a delicious lunch on the Stanley waterfront with an expert, this unique prize is a private archaeological tour for up to six people into the currently secretive and restricted area of the archaeological dig. You get to witness the actual dig to recover the airplane and learn of the wartime story filled with danger, heroism and heartbreak.`,
    donorName: 'The Explorers Club - HK Chapter',
    minimumBid: 15000,
    category: Category.EXPERIENCES,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
    terms: 'Lunch and reasonable drinks included. Reasonable fitness required. 6 guests max.',
    displayOrder: 16,
  },
  {
    title: 'RGS London Archives Private Tour',
    shortDescription: 'Exclusive tour of never-open-to-public archives with champagne reception',
    fullDescription: `Explore the never-open-to-the-public RGS London Archives and experience 500 years of travel and exploration.

This is an exclusive tour of the RGS London archives led by the Director of Archives. The RGS archives are home to over 2 million artefacts and treasures at our famous Lowther Lodge headquarters on Hyde Park, South Kensington, London.

Please feel free to request to see the archives of your favourite explorer or region of the world. As an alternative, the prize makes an ideal opportunity for your teenage child with 5 friends who have interest in geography to have a hands-on experience of real historic artifacts.

A Champagne reception with light refreshments is served following the event in the exquisite Lowther Lodge. For up to 8 people.`,
    donorName: 'RGS-UK',
    minimumBid: 25000,
    category: Category.TRAVEL,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800',
    terms: 'Includes champagne reception. Reasonable notice and availability required.',
    displayOrder: 17,
  },

  // Travel Prizes
  {
    title: 'Kruger Safari: One Week for 2',
    shortDescription: 'Luxury safari to Kruger National Park and Sabi Sand Game Reserve',
    fullDescription: `Day 1-2: Stay at the legendary, all-suite 5-star Ten Bompas boutique hotel. Scenic drive from Johannesburg to the Sabi Sand Game Reserve with overnight stay at a Sabi Sand Luxury Lodge.

Day 3-4: Game drives in the Sabi Sand Private Reserve and bush walks to enjoy the African wildlife with a good chance to see the Big Five. Night safari exploration to observe nocturnal African wildlife.

Day 5-7: Overnight stay in the magnificent Kruger National Park. Take a Panorama Tour to see God's Window, Bourke's Luck and more of nature's wonders. Game drives in Kruger with a good chance to be amazed by the Big Five. Transfer to Johannesburg to stay in a 5-star hotel.`,
    donorName: 'Leading International Tour Operator',
    minimumBid: 70000,
    category: Category.TRAVEL,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800',
    terms: 'International travel and insurance are winner\'s responsibility. Subject to camp availability.',
    displayOrder: 20,
  },
  {
    title: 'Great Wall of China Weekend for 2',
    shortDescription: 'Four-day adventure with William Lindsay OBE at his farmhouse',
    fullDescription: `Four day and three-night long weekend for two.

The first two nights you will stay at William Lindsay's beautiful farmhouse, located right next to the magnificent Great Wall. William Lindsay OBE, the first person to walk the whole length of the Great Wall in modern times, and famed for his spectacular documentary films about the Great Wall, will guide you on two classic WildWall walks.

All local transport, meals and drinks are included.

The third night is spent in a luxury restored Hutong in Beijing, completing your visit to the glories of the Beijing area.`,
    donorName: 'William Lindsay OBE & RGS-HK',
    minimumBid: 30000,
    category: Category.TRAVEL,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800',
    terms: 'Flight and international travel are winner\'s responsibility. Meals and drinks at farmhouse included.',
    displayOrder: 21,
  },
  {
    title: 'Tuscany Chianti Vineyard Week for 2',
    shortDescription: 'San Gimignano and Chianti wine region luxury holiday',
    fullDescription: `The first two days you'll stay in the legendary Tuscan hilltop town of San Gimignano in Tuscany. From your room on the main piazza, look down at the famous medieval city. Tour the "City of the Towers", including the magnificent Torre Grossa among 12 surviving medieval towers.

The next three days are spent in a beautiful vineyard in the rolling countryside of the Chianti wine region. Your accommodation is a luxury restored stone manor house set among the vines, with swimming pool, jacuzzi, and indoor and outdoor dining.

Spend your first or last 2 days in Florence, the celebrated capital of the Renaissance.

*7 rooms available - multiple winners possible*`,
    donorName: 'The Owners & RGS-HK',
    minimumBid: 30000,
    category: Category.TRAVEL,
    multiWinnerEligible: true,
    multiWinnerSlots: 7,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800',
    terms: 'Breakfast included. Flights and ground travel are winner\'s responsibility. More than 2 guests may be arranged.',
    displayOrder: 22,
  },
  {
    title: 'Lake Turkana Kenya Expedition',
    shortDescription: 'Week-long expedition to the Jade Sea, cradle of human life',
    fullDescription: `Your expedition starts at the legendary Muthaiga Club in Nairobi, where Out of Africa was filmed.

After a day of colonial luxury, you fly north to the remote deserts of northern Kenya, to the Jade Sea or Lake Turkana, the world's largest desert lake and a UNESCO World Heritage Site.

Staying at an institute, you'll explore by 4x4 the unique landscapes of this region where exposed rock beds have revealed the world's largest collection of human ancestors from over millions of years. From axes and arrows to hominid fossils, you'll see 3 million years of history.

Round off your expedition with a relaxing stay at a lodge on the lake shore. Your prize includes a donation to sponsor two local university students to do a similar expedition.

Fully customisable for additional guests.`,
    donorName: 'Rupert McCowan & RGS-HK',
    minimumBid: 35000,
    category: Category.TRAVEL,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=800',
    terms: 'All meals and full board included. Flights and travel insurance are winner\'s responsibility.',
    displayOrder: 23,
  },
  {
    title: 'Arctic Lapland Retreat for 2',
    shortDescription: 'One week in Finnish Lapland with husky sledding and northern lights',
    fullDescription: `Escape to the breathtaking winter wonderland of Arctic Lapland for a once-in-a-lifetime adventure. Nestled in the picturesque village of Äkäslompolo, 200 kilometers north of the Arctic Circle.

Your week includes cozy accommodation in a charming lodge with daily breakfast and traditional Finnish sauna every evening. Activities include husky sledding, snowmobiling, backcountry skiing, snowshoeing, fat biking, and reindeer rides.

Day 1: Arrival in Lapland
Day 2: Explore the Seven Fells on snowshoes
Day 3: Husky sledding through Pallas–Ylläs National Park
Day 4: Backcountry skiing across frozen wetlands
Day 5: Reindeer farm visit or fat biking
Day 6: Transfer to Helsinki
Day 7: Relax in picturesque Helsinki

Arctic winter gear provided. Upgrade to an igloo available.`,
    donorName: 'Riitta Hanninen & Arctic Escapades',
    minimumBid: 85000,
    category: Category.TRAVEL,
    validUntil: new Date('2027-04-30'),
    imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800',
    terms: 'Valid until April 2026 or December 2026-April 2027. Flights are winner\'s responsibility. Breakfast included.',
    displayOrder: 24,
  },
  {
    title: 'Swiss Alps Glacier Excursion',
    shortDescription: 'Three-day adventure with glaciologist Dr Wilson Cheung',
    fullDescription: `Dr Wilson Cheung, a glaciologist and polar explorer, is the first Hongkonger to serve as a mountain guide in Antarctica, the Arctic and the Swiss Alps. Honoured as one of the "Ten Outstanding Young Persons of the World" in 2025.

This exclusive adventure includes a three-day journey in the Swiss Alps and two nights in a high-alpine hotel (~2,200 m) with full-board.

Day 1: Meet at SBB Fiesch station, ascend to alpine hotel, safety briefing and acclimatisation walk.

Day 2: Morning ascent to Eggishorn (~3,000 m) with panoramic glacier views. Optional via ferrata and introduction to glacier science.

Day 3: Explore the Aletsch Glacier, experience ice climbing, return by cable car.

For 2-4 people. Return cable-car tickets and full guiding included.`,
    donorName: 'Dr Wilson Cheung & RGS-HK',
    minimumBid: 60000,
    category: Category.TRAVEL,
    validUntil: new Date('2027-09-30'),
    imageUrl: 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=800',
    terms: 'Summer season only. Participants must be able to hike ~18km/day with elevation gain. Travel insurance mandatory.',
    displayOrder: 25,
  },
  {
    title: 'Hakuba Japan Ski Chalet for 16',
    shortDescription: 'One week at Chalet Strickland with snow monkey day trip',
    fullDescription: `Enjoy a week's stay at Chalet Strickland, a spacious six-bedroom chalet nestled in the heart of the famous ski resorts of Hakuba, Japan. Accommodating up to 16 guests, this 3,000-square-foot retreat features a fully equipped kitchen, three bathrooms, and a balcony offering stunning mountain views.

Amenities include free Wi-Fi, flat-screen TV, washing machine, and free private parking. Located just 2.3 km from Happo-One Ski Resort and 6.4 km from Hakuba Goryu Ski Resort.

Included in the prize is a day trip to see the famous snow monkeys enjoying bathing in hot onsen, a convenient day trip from Hakuba.

Perfect for groups or more than one family.`,
    donorName: 'Caroline Drewett & RGS-HK',
    minimumBid: 30000,
    category: Category.TRAVEL,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800',
    terms: 'Meals not included. Flights and travel are winner\'s responsibility. Snow monkey trip included.',
    displayOrder: 26,
  },
  {
    title: 'Mandarin Oriental Ritz Madrid',
    shortDescription: 'Three nights at the Belle Époque palace in Madrid\'s Golden Triangle',
    fullDescription: `Mandarin Oriental Ritz, Madrid is a luxury Belle Époque palace located in the famous Golden Triangle of Art of Madrid. For over 110 years, the hotel has hosted royalty, dignitaries and some of the most distinguished guests from around the world.

With a stunning restoration that celebrates César Ritz's pioneering spirit, a prestigious central location, five restaurants and bars overseen by one of Spain's most celebrated chefs and exceptional fitness and wellness facilities.

Three nights accommodation for two.`,
    donorName: 'Mandarin Oriental Hotel Group',
    minimumBid: 15000,
    category: Category.TRAVEL,
    validUntil: new Date('2026-12-31'),
    imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
    terms: 'Subject to availability. Travel is winner\'s responsibility. Cannot be combined with other offers.',
    displayOrder: 27,
  },
  {
    title: 'Phuket & Khao Sok Jungle Safari for 2',
    shortDescription: 'Five-day luxury resort stay with overnight jungle expedition',
    fullDescription: `Situated near Phuket, the magnificent Khao Sok National Park is the most popular national park in Southern Thailand and is home to great biodiversity of flora and fauna.

- Transfer from airport to Santhija Phuket Resort with deluxe suite on Natai Beach
- Drive to Rock and Tree House Resort on the edge of Khao Sok National Park
- Mini-jungle trek to Ton Prai Waterfall deep in the jungle
- Stay in a canopy house surrounded by nature
- Explore Chiew Lan Lake by jungle walk and bamboo raft
- Swim in crystal-clear creek at Nam Rad Watershed
- View the Rafflesia, largest flower in the world
- Return to Santhija Phuket Resort for final day of luxury`,
    donorName: 'Christopher Schrader & RGS-HK',
    minimumBid: 18000,
    category: Category.TRAVEL,
    validUntil: new Date('2027-12-31'),
    imageUrl: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800',
    terms: 'Full guide service included. Meals included during safari. Not available during Christmas/New Year.',
    displayOrder: 28,
  },
  {
    title: 'Mongolia Eagle Hunters Expedition',
    shortDescription: 'One week living with Kazakh Eagle Hunters in the Altai Mountains',
    fullDescription: `Enjoy a week in western Mongolia including 5 days in the Altai Mountains staying in private Gers and hunting wolf and fox with Kazakh Eagle Hunters.

After a night in a 5-star hotel in Ulaanbaatar, fly to Ulgii in Western Mongolia. Stay at a hotel with private dinner featuring live Tuvan throat singing and Kazakh musicians.

Meet the Eagle Hunter and his family. Receive horse riding lessons from a Kazakh Horselord, then head into the wild to follow the hunt. Learn how the Hunter trains his Eagle, see traditional dress, and even land the eagle (2-meter wingspan) on your own arm.

Spend mornings hunting wolf and fox, evenings learning about their ancient way of life.

Can be modified for comfort level or additional family members.`,
    donorName: 'Christopher Schrader, FoundLost & RGS-HK',
    minimumBid: 60000,
    category: Category.TRAVEL,
    validUntil: new Date('2027-12-31'),
    imageUrl: 'https://images.unsplash.com/photo-1596467745893-0e2eb1c4ad0c?w=800',
    terms: 'Meals included except in Ulaanbaatar. Flights not included. Spring or Winter only.',
    displayOrder: 29,
  },

  // Pledges
  {
    title: 'Schools Outreach Pledge - Bronze',
    shortDescription: 'Support RGS-HK education programs and nominate a school',
    fullDescription: `Since 2012, RGS-HK has run a major Schools Outreach Programme reaching around 5,000 pupils each year from local, international and ESF schools.

Your $10,000 pledge allows you to nominate a school for two talks, which you may attend.

Previous speakers have included Dame Jane Goodall, Sir Ranulph Fiennes, and many other distinguished explorers and experts.

All proceeds support the Schools Outreach Programme, Scholarships Programme, and the Hong Kong Young Geographer of the Year Awards.`,
    donorName: 'RGS-HK',
    minimumBid: 10000,
    category: Category.PLEDGES,
    multiWinnerEligible: true,
    multiWinnerSlots: null, // Unlimited
    tierLevel: 1,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800',
    terms: 'By agreement with RGS-HK.',
    displayOrder: 30,
  },
  {
    title: 'Schools Outreach Pledge - Silver',
    shortDescription: 'Support RGS-HK education programs and nominate two schools',
    fullDescription: `Your $20,000 pledge allows you to nominate two schools for two talks each, which you may attend.

All proceeds support the Schools Outreach Programme, Scholarships Programme, and the Hong Kong Young Geographer of the Year Awards, which costs over $400,000 each year to run.`,
    donorName: 'RGS-HK',
    minimumBid: 20000,
    category: Category.PLEDGES,
    multiWinnerEligible: true,
    multiWinnerSlots: null,
    tierLevel: 2,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800',
    terms: 'By agreement with RGS-HK.',
    displayOrder: 31,
  },
  {
    title: 'Schools Outreach Pledge - Gold',
    shortDescription: 'Become Sponsor, Host and Annual Prize Giver at award ceremonies',
    fullDescription: `Your $30,000 pledge includes all Silver benefits plus you become the Sponsor, Host and Annual Prize Giver of our award ceremonies.

A prominent role in supporting the next generation of geographers and explorers in Hong Kong.`,
    donorName: 'RGS-HK',
    minimumBid: 30000,
    category: Category.PLEDGES,
    multiWinnerEligible: true,
    multiWinnerSlots: null,
    tierLevel: 3,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
    terms: 'By agreement with RGS-HK.',
    displayOrder: 32,
  },
  {
    title: 'Schools Outreach Pledge - Platinum',
    shortDescription: 'Title Sponsorship and year-round branding of all programs',
    fullDescription: `Your $100,000 pledge gives you Title Sponsorship and year-round branding of all RGS-HK educational programmes.

This prestigious opportunity is available for individuals or corporations seeking to make a significant impact on geographical education in Hong Kong.

Includes prominent recognition across all Schools Outreach talks, Scholarships Programme materials, and Hong Kong Young Geographer of the Year Awards.`,
    donorName: 'RGS-HK',
    minimumBid: 100000,
    category: Category.PLEDGES,
    multiWinnerEligible: true,
    multiWinnerSlots: null,
    tierLevel: 4,
    validUntil: new Date('2027-03-31'),
    imageUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800',
    terms: 'By agreement with RGS-HK. Opportunity for individuals or corporations.',
    displayOrder: 33,
  },
]

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.winner.deleteMany()
  await prisma.bid.deleteMany()
  await prisma.prize.deleteMany()
  await prisma.bidder.deleteMany()
  await prisma.auctionSettings.deleteMany()

  // Create auction settings
  await prisma.auctionSettings.create({
    data: {
      id: 'settings',
      auctionEndTime: new Date('2026-02-28T22:30:00+08:00'),
      isAuctionOpen: true,
    },
  })

  // Create prizes
  for (const prize of prizes) {
    await prisma.prize.create({
      data: {
        ...prize,
        slug: slugify(prize.title),
      },
    })
    console.log(`Created prize: ${prize.title}`)
  }

  // Create some demo bidders
  const demoBidders = [
    { name: 'John Smith', email: 'john@example.com', tableNumber: '5', emailVerified: true },
    { name: 'Sarah Chen', email: 'sarah@example.com', tableNumber: '12', emailVerified: true },
    { name: 'Michael Wong', email: 'michael@example.com', tableNumber: '3', emailVerified: true },
  ]

  for (const bidder of demoBidders) {
    await prisma.bidder.create({ data: bidder })
    console.log(`Created demo bidder: ${bidder.name}`)
  }

  // Clear and create helpers
  await prisma.paperBid.deleteMany()
  await prisma.helper.deleteMany()

  const helpers = [
    { name: 'Alice', pin: '1111', avatarColor: '#EF4444' },
    { name: 'Bob', pin: '2222', avatarColor: '#F97316' },
    { name: 'Charlie', pin: '3333', avatarColor: '#EAB308' },
    { name: 'Diana', pin: '4444', avatarColor: '#22C55E' },
    { name: 'Edward', pin: '5555', avatarColor: '#06B6D4' },
    { name: 'Fiona', pin: '6666', avatarColor: '#3B82F6' },
    { name: 'George', pin: '7777', avatarColor: '#8B5CF6' },
    { name: 'Hannah', pin: '8888', avatarColor: '#EC4899' },
    { name: 'Ian', pin: '9999', avatarColor: '#F43F5E' },
    { name: 'Julia', pin: '0000', avatarColor: '#14B8A6' },
  ]

  for (const helper of helpers) {
    await prisma.helper.create({ data: helper })
    console.log(`Created helper: ${helper.name} (PIN: ${helper.pin})`)
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
