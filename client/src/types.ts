// Shared TypeScript types for Navo Vyapar

export interface Space {
  id: number;
  type: 'go' | 'property' | 'chance' | 'community' | 'tax' | 'railway' | 'utility' | 'jail' | 'rest' | 'goToJail';
  name: string;
  description?: string;
  group?: string;
  price?: number;
  houseCost?: number;
  rent?: number[];
  mortgage?: number;
  landmark?: string;
  amount?: number;
  destination?: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  money: number;
  position: number;
  properties: number[];
  railroads: number[];
  utilities: number[];
  houses: Record<number, number>;
  hotels: Record<number, boolean>;
  mortgaged: number[];
  inJail: boolean;
  jailTurns: number;
  hasJailFreeCard: boolean;
  isBankrupt: boolean;
  totalWorth: number;
  connected: boolean;
}

export interface RoomPlayer {
  id: string;
  name: string;
  avatar: string;
  ready: boolean;
  connected: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  players: RoomPlayer[];
  maxPlayers: number;
  minPlayers: number;
}

export interface GameState {
  roomId: string;
  players: Player[];
  currentPlayerIndex: number;
  currentPlayerId: string;
  phase: 'rolling' | 'postRoll' | 'trading' | 'gameOver';
  turnNumber: number;
  lastDice: [number, number];
  propertyOwnership: Record<number, string>;
  winner: string | null;
  log: LogEntry[];
  transactions: Transaction[];
  tradeOffer: TradeOffer | null;
}

export interface LogEntry {
  message: string;
  timestamp: number;
  turn: number;
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  description: string;
  timestamp: number;
  turn: number;
}

export interface TradeOffer {
  id: string;
  from: string;
  to: string;
  moneyOffered?: number;
  moneyRequested?: number;
  propertiesOffered?: number[];
  propertiesRequested?: number[];
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  message: string;
  type: 'chat' | 'reaction' | 'system';
  timestamp: number;
}

export interface DiceResult {
  dice: [number, number];
  isDoubles: boolean;
  canRollAgain?: boolean;
  oldPosition: number;
  newPosition: number;
  passedGo?: boolean;
  landedSpace: Space;
  landingResult: LandingResult;
  player: Player;
  message: string;
  sentToJail?: boolean;
  escapedJail?: boolean;
  stayInJail?: boolean;
  paidBail?: boolean;
}

export interface LandingResult {
  needsAction: boolean;
  type: string;
  space?: Space;
  canAfford?: boolean;
  rent?: number;
  to?: string;
  amount?: number;
  amountNeeded?: number;
  creditor?: string;
  card?: ChanceCard;
  deckType?: string;
  message?: string;
}

export interface ChanceCard {
  id: string;
  type: string;
  amount?: number;
  destination?: number;
  spaces?: number;
  text: string;
}

export interface ColorGroup {
  name: string;
  color: string;
  lightColor: string;
  properties: number;
}

export interface Avatar {
  id: string;
  name: string;
  icon?: string;
  emoji?: string;
  color: string;
}

export interface BoardConfig {
  name: string;
  currency: string;
  currencyName: string;
  startingMoney: number;
  goSalary: number;
  jailBailCost: number;
  maxDoublesBeforeJail: number;
  mortgageInterestRate: number;
  housesPerHotel: number;
  maxHousesPerProperty: number;
  colorGroups: Record<string, ColorGroup>;
  spaces: Space[];
  chanceCards: ChanceCard[];
  communityCards: ChanceCard[];
  avatars: Avatar[];
  denominations: number[];
}

