// Board configuration loaded once and shared
import type { BoardConfig } from '../types';

let cachedConfig: BoardConfig | null = null;

export async function loadBoardConfig(): Promise<BoardConfig> {
  if (cachedConfig) return cachedConfig;

  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      cachedConfig = await response.json();
      return cachedConfig!;
    }
  } catch {}

  // Fallback: embedded config for offline/dev mode
  return getDefaultConfig();
}

export function getSpaceById(config: BoardConfig, id: number) {
  return config.spaces.find(s => s.id === id);
}

export function getGroupColor(group: string): string {
  const colors: Record<string, string> = {
    brown: '#8B4513',
    lightBlue: '#0284c7',
    pink: '#db2777',
    orange: '#ea580c',
    red: '#dc2626',
    yellow: '#ca8a04',
    green: '#16a34a',
    darkBlue: '#1e3a8a',
  };
  return colors[group] || '#64748b';
}

export function getGroupLightColor(group: string): string {
  const colors: Record<string, string> = {
    brown: '#f5ebe0',
    lightBlue: '#e0f2fe',
    pink: '#fce7f3',
    orange: '#ffedd5',
    red: '#fee2e2',
    yellow: '#fef9c3',
    green: '#dcfce7',
    darkBlue: '#dbeafe',
  };
  return colors[group] || '#f1f5f9';
}

export function formatMoney(amount: number): string {
  if (amount >= 1000000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 100000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function getAvatarLabel(avatarId: string): string {
  const map: Record<string, string> = {
    diya: 'Diya',
    chakra: 'Chakra',
    lotus: 'Lotus',
    peacock: 'Peacock',
    elephant: 'Gajraj',
    kite: 'Patang',
    conch: 'Shankh',
    rangoli: 'Rangoli',
  };
  return map[avatarId] || 'Player';
}

// Kept for backward compatibility but returns clean label
export function getAvatarEmoji(avatarId: string): string {
  return '';
}

export function getAvatarColor(avatarId: string): string {
  const map: Record<string, string> = {
    diya: '#f97316',
    chakra: '#0284c7',
    lotus: '#ec4899',
    peacock: '#0d9488',
    elephant: '#9333ea',
    kite: '#eab308',
    conch: '#0ea5e9',
    rangoli: '#e11d48',
  };
  return map[avatarId] || '#10b981';
}

function getDefaultConfig(): BoardConfig {
  return {
    name: 'Navo Vyapar',
    currency: '₹',
    currencyName: 'Rupees',
    startingMoney: 25000,
    goSalary: 2000,
    jailBailCost: 500,
    maxDoublesBeforeJail: 3,
    mortgageInterestRate: 0.10,
    housesPerHotel: 4,
    maxHousesPerProperty: 4,
    colorGroups: {
      brown: { name: 'Heritage Towns', color: '#8B4513', lightColor: '#D2A679', properties: 2 },
      lightBlue: { name: 'Coastal Cities', color: '#87CEEB', lightColor: '#C5E8F7', properties: 3 },
      pink: { name: 'Cultural Hubs', color: '#DB7093', lightColor: '#F0C0D0', properties: 3 },
      orange: { name: 'Industrial Centers', color: '#FF8C00', lightColor: '#FFD1A0', properties: 3 },
      red: { name: 'Royal Cities', color: '#DC143C', lightColor: '#F5A0A0', properties: 3 },
      yellow: { name: 'Golden Triangle', color: '#FFD700', lightColor: '#FFF0A0', properties: 3 },
      green: { name: 'Metro Cities', color: '#228B22', lightColor: '#A0D0A0', properties: 3 },
      darkBlue: { name: 'Diamond Cities', color: '#191970', lightColor: '#A0A0D0', properties: 2 },
    },
    spaces: [],
    chanceCards: [],
    communityCards: [],
    avatars: [
      { id: 'diya', name: 'Diya (Lamp)', emoji: '', color: '#f97316' },
      { id: 'chakra', name: 'Chakra (Wheel)', emoji: '', color: '#0284c7' },
      { id: 'lotus', name: 'Lotus', emoji: '', color: '#ec4899' },
      { id: 'peacock', name: 'Peacock', emoji: '', color: '#0d9488' },
      { id: 'elephant', name: 'Elephant', emoji: '', color: '#9333ea' },
      { id: 'kite', name: 'Patang (Kite)', emoji: '', color: '#eab308' },
      { id: 'conch', name: 'Shankh (Conch)', emoji: '', color: '#0ea5e9' },
      { id: 'rangoli', name: 'Rangoli', emoji: '', color: '#e11d48' },
    ],
    denominations: [100, 500, 1000, 2000, 5000],
  };
}
