// Game state management with Zustand
import { create } from 'zustand';
import type { GameState, Room, Player, ChatMessage, DiceResult, BoardConfig } from '../types';

interface SessionData {
  roomCode: string;
  playerId: string;
  reconnectToken: string;
  playerName: string;
  playerAvatar: string;
}

// Load/save session data from localStorage
const STORAGE_KEY = 'navo-vyapar-session';

export function saveSession(data: SessionData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function loadSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

interface GameStore {
  // Navigation state
  screen: 'landing' | 'setup' | 'createRoom' | 'joinRoom' | 'lobby' | 'game' | 'gameOver';
  setScreen: (screen: GameStore['screen']) => void;

  // Player identity
  playerName: string;
  playerAvatar: string;
  playerId: string;
  reconnectToken: string;
  setPlayerInfo: (name: string, avatar: string) => void;
  setPlayerId: (id: string) => void;
  setReconnectToken: (token: string) => void;

  // Room state
  roomCode: string;
  room: Room | null;
  setRoomCode: (code: string) => void;
  setRoom: (room: Room | null) => void;

  // Game state
  gameState: GameState | null;
  setGameState: (state: GameState | null) => void;

  // Board config
  boardConfig: BoardConfig | null;
  setBoardConfig: (config: BoardConfig) => void;

  // Last dice result
  lastDiceResult: DiceResult | null;
  setLastDiceResult: (result: DiceResult | null) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;

  // UI state
  showPropertyModal: number | null;
  setShowPropertyModal: (spaceId: number | null) => void;
  showTradeModal: boolean;
  setShowTradeModal: (show: boolean) => void;
  showChat: boolean;
  setShowChat: (show: boolean) => void;
  showRules: boolean;
  setShowRules: (show: boolean) => void;
  showMortgage: boolean;
  setShowMortgage: (show: boolean) => void;
  showBuild: boolean;
  setShowBuild: (show: boolean) => void;
  notification: string | null;
  setNotification: (msg: string | null) => void;

  // Sound
  soundEnabled: boolean;
  musicEnabled: boolean;
  toggleSound: () => void;
  toggleMusic: () => void;

  // Reset
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  screen: 'landing',
  setScreen: (screen) => set({ screen }),

  playerName: '',
  playerAvatar: 'diya',
  playerId: '',
  reconnectToken: '',
  setPlayerInfo: (name, avatar) => set({ playerName: name, playerAvatar: avatar }),
  setPlayerId: (id) => set({ playerId: id }),
  setReconnectToken: (token) => set({ reconnectToken: token }),

  roomCode: '',
  room: null,
  setRoomCode: (code) => set({ roomCode: code }),
  setRoom: (room) => set({ room }),

  gameState: null,
  setGameState: (state) => set({ gameState: state }),

  boardConfig: null,
  setBoardConfig: (config) => set({ boardConfig: config }),

  lastDiceResult: null,
  setLastDiceResult: (result) => set({ lastDiceResult: result }),

  chatMessages: [],
  addChatMessage: (msg) => set((s) => ({
    chatMessages: [...s.chatMessages.slice(-99), msg]
  })),

  showPropertyModal: null,
  setShowPropertyModal: (spaceId) => set({ showPropertyModal: spaceId }),
  showTradeModal: false,
  setShowTradeModal: (show) => set({ showTradeModal: show }),
  showChat: false,
  setShowChat: (show) => set({ showChat: show }),
  showRules: false,
  setShowRules: (show) => set({ showRules: show }),
  showMortgage: false,
  setShowMortgage: (show) => set({ showMortgage: show }),
  showBuild: false,
  setShowBuild: (show) => set({ showBuild: show }),
  notification: null,
  setNotification: (msg) => set({ notification: msg }),

  soundEnabled: true,
  musicEnabled: false,
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  toggleMusic: () => set((s) => ({ musicEnabled: !s.musicEnabled })),

  resetGame: () => set({
    screen: 'landing',
    roomCode: '',
    room: null,
    gameState: null,
    lastDiceResult: null,
    chatMessages: [],
    showPropertyModal: null,
    showTradeModal: false,
    showChat: false,
    notification: null,
  }),
}));

