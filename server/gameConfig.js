// Navo Vyapar – Board Configuration
// Based on traditional Indian "Business" / "Vyapar" board game
// Properties themed around Gujarat and Indian landmarks
// Language: English / Romanized terms only (no direct Gujarati script)

const BOARD_CONFIG = {
  name: 'Navo Vyapar',
  currency: '₹',
  currencyName: 'Rupees',
  startingMoney: 25000,
  goSalary: 2000,
  jailBailCost: 500,
  maxDoublesBeforeJail: 3,
  mortgageInterestRate: 0.10, // 10% to unmortgage
  housesPerHotel: 4,
  maxHousesPerProperty: 4,

  // Color groups with thematic Gujarat/India naming
  colorGroups: {
    brown:    { name: 'Heritage Towns',    color: '#8B4513', lightColor: '#D2A679', properties: 2 },
    lightBlue:{ name: 'Coastal Cities',     color: '#87CEEB', lightColor: '#C5E8F7', properties: 3 },
    pink:     { name: 'Cultural Hubs',      color: '#DB7093', lightColor: '#F0C0D0', properties: 3 },
    orange:   { name: 'Industrial Centers',  color: '#FF8C00', lightColor: '#FFD1A0', properties: 3 },
    red:      { name: 'Royal Cities',        color: '#DC143C', lightColor: '#F5A0A0', properties: 3 },
    yellow:   { name: 'Golden Triangle',     color: '#FFD700', lightColor: '#FFF0A0', properties: 3 },
    green:    { name: 'Metro Cities',        color: '#228B22', lightColor: '#A0D0A0', properties: 3 },
    darkBlue: { name: 'Diamond Cities',      color: '#191970', lightColor: '#A0A0D0', properties: 2 },
  },

  // Board spaces (40 total, clockwise starting from START)
  spaces: [
    // ─── BOTTOM ROW (right to left) ───
    { id: 0,  type: 'go',       name: 'Start', description: 'Collect ₹2,000 salary when you pass' },

    { id: 1,  type: 'property', name: 'Mandvi',        group: 'brown',     price: 600,  houseCost: 500,
      rent: [20, 100, 300, 900, 1600, 2500], mortgage: 300,
      landmark: 'Historic port town of Kutch' },

    { id: 2,  type: 'chance',   name: 'Naseeb (Chance)', description: 'Draw a Chance card' },

    { id: 3,  type: 'property', name: 'Bhuj',           group: 'brown',     price: 600,  houseCost: 500,
      rent: [40, 200, 600, 1800, 3200, 4500], mortgage: 300,
      landmark: 'Gateway to the Rann of Kutch' },

    { id: 4,  type: 'tax',      name: 'Income Tax', amount: 2000, description: 'Pay ₹2,000 income tax' },

    { id: 5,  type: 'railway',  name: 'Western Railway', price: 2000, mortgage: 1000,
      rent: [250, 500, 1000, 2000],
      landmark: 'Major railway network of Western India' },

    { id: 6,  type: 'property', name: 'Porbandar',      group: 'lightBlue', price: 1000, houseCost: 500,
      rent: [60, 300, 900, 2700, 4000, 5500], mortgage: 500,
      landmark: 'Birthplace of Mahatma Gandhi' },

    { id: 7,  type: 'community', name: 'Samaj Seva (Community)', description: 'Draw a Community card' },

    { id: 8,  type: 'property', name: 'Junagadh',       group: 'lightBlue', price: 1000, houseCost: 500,
      rent: [60, 300, 900, 2700, 4000, 5500], mortgage: 500,
      landmark: 'Home of Girnar and Gir Forest' },

    { id: 9,  type: 'property', name: 'Dwarka',         group: 'lightBlue', price: 1200, houseCost: 500,
      rent: [80, 400, 1000, 3000, 4500, 6000], mortgage: 600,
      landmark: 'Sacred city of Lord Krishna' },

    // ─── LEFT COLUMN (bottom to top) ───
    { id: 10, type: 'jail',     name: 'Jail',     description: 'Just visiting / In Jail' },

    { id: 11, type: 'property', name: 'Rajkot',         group: 'pink',      price: 1400, houseCost: 1000,
      rent: [100, 500, 1500, 4500, 6250, 7500], mortgage: 700,
      landmark: 'City of Sardar Patel\'s early life' },

    { id: 12, type: 'utility',  name: 'Electricity Board', price: 1500, mortgage: 750,
      landmark: 'Power Supply Company' },

    { id: 13, type: 'property', name: 'Jamnagar',       group: 'pink',      price: 1400, houseCost: 1000,
      rent: [100, 500, 1500, 4500, 6250, 7500], mortgage: 700,
      landmark: 'City of Brass and Bandhani' },

    { id: 14, type: 'property', name: 'Bhavnagar',      group: 'pink',      price: 1600, houseCost: 1000,
      rent: [120, 600, 1800, 5000, 7000, 9000], mortgage: 800,
      landmark: 'Gateway to Palitana temples' },

    { id: 15, type: 'railway',  name: 'Central Railway', price: 2000, mortgage: 1000,
      rent: [250, 500, 1000, 2000],
      landmark: 'Heart of Indian Railways' },

    { id: 16, type: 'property', name: 'Vadodara',       group: 'orange',    price: 1800, houseCost: 1000,
      rent: [140, 700, 2000, 5500, 7500, 9500], mortgage: 900,
      landmark: 'City of Sayaji Rao and Laxmi Vilas Palace' },

    { id: 17, type: 'chance',   name: 'Naseeb (Chance)', description: 'Draw a Chance card' },

    { id: 18, type: 'property', name: 'Anand',          group: 'orange',    price: 1800, houseCost: 1000,
      rent: [140, 700, 2000, 5500, 7500, 9500], mortgage: 900,
      landmark: 'Milk Capital of India – Amul' },

    { id: 19, type: 'property', name: 'Gandhinagar',    group: 'orange',    price: 2000, houseCost: 1000,
      rent: [160, 800, 2200, 6000, 8000, 10000], mortgage: 1000,
      landmark: 'Capital of Gujarat' },

    // ─── TOP ROW (left to right) ───
    { id: 20, type: 'rest',     name: 'Rest House', description: 'Free rest – no fee required' },

    { id: 21, type: 'property', name: 'Somnath',        group: 'red',       price: 2200, houseCost: 1500,
      rent: [180, 900, 2500, 7000, 8750, 10500], mortgage: 1100,
      landmark: 'First among the twelve Jyotirlingas' },

    { id: 22, type: 'community', name: 'Samaj Seva (Community)', description: 'Draw a Community card' },

    { id: 23, type: 'property', name: 'Gir Somnath',    group: 'red',       price: 2200, houseCost: 1500,
      rent: [180, 900, 2500, 7000, 8750, 10500], mortgage: 1100,
      landmark: 'Home of the Asiatic Lion' },

    { id: 24, type: 'property', name: 'Statue of Unity',group: 'red',       price: 2400, houseCost: 1500,
      rent: [200, 1000, 3000, 7500, 9250, 11000], mortgage: 1200,
      landmark: 'World\'s tallest statue – Sardar Patel' },

    { id: 25, type: 'railway',  name: 'Northern Railway', price: 2000, mortgage: 1000,
      rent: [250, 500, 1000, 2000],
      landmark: 'Connecting North India' },

    { id: 26, type: 'property', name: 'Kutch (Rann)',   group: 'yellow',    price: 2600, houseCost: 1500,
      rent: [220, 1100, 3300, 8000, 9750, 11500], mortgage: 1300,
      landmark: 'White desert – Rann Utsav' },

    { id: 27, type: 'property', name: 'Sabarmati',      group: 'yellow',    price: 2600, houseCost: 1500,
      rent: [220, 1100, 3300, 8000, 9750, 11500], mortgage: 1300,
      landmark: 'Sabarmati Ashram – Gandhi\'s home' },

    { id: 28, type: 'utility',  name: 'Water Works',    price: 1500, mortgage: 750,
      landmark: 'Narmada River Water Supply' },

    { id: 29, type: 'property', name: 'Patan',          group: 'yellow',    price: 2800, houseCost: 1500,
      rent: [240, 1200, 3600, 8500, 10250, 12000], mortgage: 1400,
      landmark: 'Rani Ki Vav – UNESCO World Heritage' },

    // ─── RIGHT COLUMN (top to bottom) ───
    { id: 30, type: 'goToJail', name: 'Go To Jail', description: 'Go directly to Jail' },

    { id: 31, type: 'property', name: 'Rajpipla',       group: 'green',     price: 3000, houseCost: 2000,
      rent: [260, 1300, 3900, 9000, 11000, 12750], mortgage: 1500,
      landmark: 'Royal city near Statue of Unity' },

    { id: 32, type: 'property', name: 'Mehsana',        group: 'green',     price: 3000, houseCost: 2000,
      rent: [260, 1300, 3900, 9000, 11000, 12750], mortgage: 1500,
      landmark: 'Historic City of Dudhsagar & Sun Temple' },

    { id: 33, type: 'community', name: 'Samaj Seva (Community)', description: 'Draw a Community card' },

    { id: 34, type: 'property', name: 'Ahmedabad',      group: 'green',     price: 3200, houseCost: 2000,
      rent: [280, 1500, 4500, 10000, 12000, 14000], mortgage: 1600,
      landmark: 'UNESCO World Heritage City' },

    { id: 35, type: 'railway',  name: 'Southern Railway', price: 2000, mortgage: 1000,
      rent: [250, 500, 1000, 2000],
      landmark: 'Rail network of South India' },

    { id: 36, type: 'chance',   name: 'Naseeb (Chance)', description: 'Draw a Chance card' },

    { id: 37, type: 'property', name: 'Surat',          group: 'darkBlue',  price: 3500, houseCost: 2000,
      rent: [350, 1750, 5000, 11000, 13000, 15000], mortgage: 1750,
      landmark: 'Diamond Capital of the World' },

    { id: 38, type: 'tax',      name: 'Wealth Tax', amount: 1000, description: 'Pay ₹1,000 wealth tax' },

    { id: 39, type: 'property', name: 'Mumbai',         group: 'darkBlue',  price: 4000, houseCost: 2000,
      rent: [500, 2000, 6000, 14000, 17000, 20000], mortgage: 2000,
      landmark: 'Financial Capital of India' },
  ],

  // Chance cards
  chanceCards: [
    { id: 'c1',  type: 'collect',    amount: 2000, text: 'Bank error in your favour! Collect ₹2,000.' },
    { id: 'c2',  type: 'pay',        amount: 1000, text: 'Hospital expenses. Pay ₹1,000.' },
    { id: 'c3',  type: 'collect',    amount: 1500, text: 'Lottery winnings! Collect ₹1,500.' },
    { id: 'c4',  type: 'pay',        amount: 500,  text: 'Traffic fine. Pay ₹500.' },
    { id: 'c5',  type: 'moveTo',     destination: 0,  text: 'Advance to Start. Collect salary.' },
    { id: 'c6',  type: 'goToJail',   text: 'Go directly to Jail! Do not pass Start.' },
    { id: 'c7',  type: 'collect',    amount: 500,  text: 'Investment dividend received. Collect ₹500.' },
    { id: 'c8',  type: 'pay',        amount: 1500, text: 'Tuition fees due. Pay ₹1,500.' },
    { id: 'c9',  type: 'collect',    amount: 1000, text: 'Business trading profit! Collect ₹1,000.' },
    { id: 'c10', type: 'moveTo',     destination: 24, text: 'Visit Statue of Unity! Advance to space 24.' },
    { id: 'c11', type: 'pay',        amount: 2000, text: 'Property renovation and repairs. Pay ₹2,000.' },
    { id: 'c12', type: 'collect',    amount: 3000, text: 'Family inheritance received! Collect ₹3,000.' },
    { id: 'c13', type: 'payEach',    amount: 500,  text: 'Pay each player ₹500.' },
    { id: 'c14', type: 'collectEach',amount: 500,  text: 'Collect ₹500 from each player.' },
    { id: 'c15', type: 'moveBack',   spaces: 3,    text: 'Move back 3 spaces.' },
    { id: 'c16', type: 'jailFree',   text: 'Get Out of Jail Free card!' },
  ],

  // Community cards
  communityCards: [
    { id: 'm1',  type: 'collect',    amount: 2000, text: 'Bank Fixed Deposit matured! Collect ₹2,000.' },
    { id: 'm2',  type: 'pay',        amount: 500,  text: 'Doctor medical consultation. Pay ₹500.' },
    { id: 'm3',  type: 'collect',    amount: 1000, text: 'Diwali business bonus! Collect ₹1,000.' },
    { id: 'm4',  type: 'pay',        amount: 1000, text: 'Annual insurance premium due. Pay ₹1,000.' },
    { id: 'm5',  type: 'moveTo',     destination: 0,  text: 'Advance to Start. Collect ₹2,000.' },
    { id: 'm6',  type: 'goToJail',   text: 'Go to Jail! Advance directly to Jail.' },
    { id: 'm7',  type: 'collect',    amount: 500,  text: 'Income tax refund! Collect ₹500.' },
    { id: 'm8',  type: 'pay',        amount: 2000, text: 'Wedding festive expenses. Pay ₹2,000.' },
    { id: 'm9',  type: 'collect',    amount: 2500, text: 'Trade competition prize! Collect ₹2,500.' },
    { id: 'm10', type: 'pay',        amount: 500,  text: 'Charitable temple donation. Pay ₹500.' },
    { id: 'm11', type: 'collect',    amount: 1500, text: 'Commercial rental income. Collect ₹1,500.' },
    { id: 'm12', type: 'payEach',    amount: 250,  text: 'Navratri festival treats! Pay each player ₹250.' },
    { id: 'm13', type: 'collectEach',amount: 250,  text: 'Uttarayan kite festival gifts! Collect ₹250 from each.' },
    { id: 'm14', type: 'jailFree',   text: 'Get Out of Jail Free card!' },
    { id: 'm15', type: 'moveTo',     destination: 10, text: 'Visit Jail (Just Visiting).' },
    { id: 'm16', type: 'collect',    amount: 1000, text: 'GST refund received! Collect ₹1,000.' },
  ],

  // Player tokens (avatars)
  avatars: [
    { id: 'diya',      name: 'Diya (Lamp)',       icon: 'flame',      color: '#f97316' },
    { id: 'chakra',    name: 'Chakra (Wheel)',     icon: 'compass',    color: '#0284c7' },
    { id: 'lotus',     name: 'Lotus',              icon: 'flower',     color: '#ec4899' },
    { id: 'peacock',   name: 'Peacock',             icon: 'feather',    color: '#0d9488' },
    { id: 'elephant',  name: 'Elephant (Gajraj)',   icon: 'shield',     color: '#9333ea' },
    { id: 'kite',      name: 'Patang (Kite)',       icon: 'navigation', color: '#eab308' },
    { id: 'conch',     name: 'Shankh (Conch)',      icon: 'waves',      color: '#0ea5e9' },
    { id: 'rangoli',   name: 'Rangoli',             icon: 'palette',    color: '#e11d48' },
  ],

  // Currency denominations
  denominations: [100, 500, 1000, 2000, 5000],
};

module.exports = BOARD_CONFIG;
