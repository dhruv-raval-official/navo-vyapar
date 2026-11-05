import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useSocket } from '../hooks/useSocket';
import GameBoard from '../components/GameBoard';
import PlayerPanel from '../components/PlayerPanel';
import DiceRoller from '../components/DiceRoller';
import ActionPanel from '../components/ActionPanel';
import PropertyModal from '../components/PropertyModal';
import TradeModal from '../components/TradeModal';
import ChatPanel from '../components/ChatPanel';
import RulesModal from '../components/RulesModal';
import TransactionHistory from '../components/TransactionHistory';
import NotificationToast from '../components/NotificationToast';
import FullscreenButton from '../components/FullscreenButton';
import { loadBoardConfig, formatMoney } from '../utils/gameUtils';
import { soundManager } from '../utils/sounds';
import {
  Flame,
  Volume2,
  VolumeX,
  BookOpen,
  MessageSquare,
  TokenIcon,
} from '../components/Icons';
import type { GameState } from '../types';

export default function GamePage() {
  const {
    roomCode,
    playerId,
    gameState,
    setGameState,
    boardConfig,
    setBoardConfig,
    setScreen,
    showChat,
    setShowChat,
    setShowRules,
    soundEnabled,
    toggleSound,
    setNotification,
    setLastDiceResult,
  } = useGameStore();

  const { socket } = useSocket();

  // Dynamic orientation detection: Landscape vs Portrait
  const [isLandscape, setIsLandscape] = useState(
    typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : true
  );

  useEffect(() => {
    const handleOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    handleOrientation();
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);
    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  // Load board config if not already loaded
  useEffect(() => {
    if (!boardConfig) {
      loadBoardConfig().then(setBoardConfig).catch(console.error);
    }
  }, [boardConfig, setBoardConfig]);

  // Setup sound enabled state
  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const handleToggleSound = () => {
    toggleSound();
    const willBeEnabled = !soundEnabled;
    soundManager.setEnabled(willBeEnabled);
    if (willBeEnabled) {
      soundManager.startAmbientMusic();
      setNotification('Audio & Music Enabled');
    } else {
      soundManager.stopAmbientMusic();
      setNotification('Audio Muted');
    }
  };

  // Listen to game events
  useEffect(() => {
    const handleGameStateUpdate = (newState: GameState) => {
      setGameState(newState);
      if (newState.phase === 'gameOver') {
        setScreen('gameOver');
      }
    };

    const handleDiceRolled = (data: any) => {
      if (data.gameState) {
        setGameState(data.gameState);
      }
      setLastDiceResult(data);

      if (data.sentToJail) {
        soundManager.jailSlam();
      } else if (data.escapedJail) {
        soundManager.jailRelease();
      } else if (data.isDoubles) {
        soundManager.doubles();
      } else {
        soundManager.diceResult();
      }

      if (data.passedGo) {
        setTimeout(() => soundManager.salary(), 300);
      }

      if (data.message) {
        setNotification(data.message.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim());
      }
    };

    const handlePropertyPurchased = (data: any) => {
      soundManager.propertyBuy();
      setNotification(`${data.playerName || 'Player'} purchased ${data.space.name}!`);
    };

    const handleHouseBuilt = () => {
      soundManager.buildHouse();
    };

    const handlePlayerBankrupt = (data: any) => {
      soundManager.bankruptcy();
      setNotification(`${data.playerName} declared bankruptcy!`);
    };

    const handleGameOver = () => {
      soundManager.victory();
      setScreen('gameOver');
    };

    const handlePlayerDisconnected = (data: { playerName: string }) => {
      setNotification(`${data.playerName} disconnected.`);
    };

    const handlePlayerReconnected = (data: { playerName: string }) => {
      soundManager.playerJoin();
      setNotification(`${data.playerName} reconnected!`);
    };

    socket.on('game-state-update', handleGameStateUpdate);
    socket.on('dice-rolled', handleDiceRolled);
    socket.on('property-purchased', handlePropertyPurchased);
    socket.on('house-built', handleHouseBuilt);
    socket.on('player-bankrupt', handlePlayerBankrupt);
    socket.on('game-over', handleGameOver);
    socket.on('player-disconnected', handlePlayerDisconnected);
    socket.on('player-reconnected', handlePlayerReconnected);

    return () => {
      socket.off('game-state-update', handleGameStateUpdate);
      socket.off('dice-rolled', handleDiceRolled);
      socket.off('property-purchased', handlePropertyPurchased);
      socket.off('house-built', handleHouseBuilt);
      socket.off('player-bankrupt', handlePlayerBankrupt);
      socket.off('game-over', handleGameOver);
      socket.off('player-disconnected', handlePlayerDisconnected);
      socket.off('player-reconnected', handlePlayerReconnected);
    };
  }, [socket, setGameState, setScreen, setNotification, setLastDiceResult]);

  const currentPlayer = gameState?.players[gameState?.currentPlayerIndex || 0];

  return (
    <div className="h-screen w-screen bg-emerald-950 text-white flex flex-col select-none relative overflow-hidden">
      {/* Toast notifications */}
      <NotificationToast />

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODE 1: LANDSCAPE (Laptops, Desktops, Mobile Landscape)     */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isLandscape ? (
        <div className="h-full w-full flex flex-col overflow-hidden">
          {/* Top Bar for Landscape */}
          <header className="h-11 sm:h-12 border-b border-gold-600/25 bg-emerald-900/80 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between shrink-0 z-40">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-800 border border-gold-500/50 flex items-center justify-center text-gold-400 shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-display font-bold gold-text text-xs sm:text-sm leading-none tracking-wider">
                  NAVO VYAPAR
                </h1>
                <span className="text-[9px] sm:text-[10px] text-emerald-400/80 font-mono">
                  Room: <strong className="text-gold-300 font-bold">{roomCode}</strong>
                </span>
              </div>
            </div>

            {/* Quick Header Buttons */}
            <div className="flex items-center gap-1.5">
              <TransactionHistory />

              <button
                onClick={() => setShowRules(true)}
                className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1"
                title="Rules & Guide"
              >
                <BookOpen className="w-3.5 h-3.5 text-gold-400" />
                <span className="hidden sm:inline">Rules</span>
              </button>

              <button
                onClick={handleToggleSound}
                className="btn-secondary py-1 px-2 text-xs flex items-center justify-center"
                title={soundEnabled ? 'Mute Audio & Music' : 'Enable Audio & Music'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-gold-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-emerald-500" />
                )}
              </button>

              <FullscreenButton iconSize={14} />

              <button
                onClick={() => setShowChat(!showChat)}
                className="btn-primary py-1 px-2.5 text-xs flex items-center gap-1 shadow-gold"
                title="Table Chat"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-950" />
                <span className="hidden sm:inline">Chat</span>
              </button>
            </div>
          </header>

          {/* Main Horizontal Area: Board Left, Controls Right */}
          <div className="flex-1 w-full flex items-center justify-between overflow-hidden min-h-0">
            {/* Board Column: Expands to fit maximum square without clipping */}
            <div className="flex-1 h-full min-h-0 min-w-0 flex items-center justify-center p-1 sm:p-2 overflow-hidden">
              <GameBoard />
            </div>

            {/* Controls Sidebar: Perfectly sized, scrollable if needed */}
            <aside className="w-[280px] sm:w-[320px] md:w-[360px] lg:w-[390px] h-full flex flex-col gap-2 p-2 sm:p-2.5 bg-emerald-950/80 border-l border-gold-600/25 overflow-y-auto no-scrollbar shrink-0">
              <DiceRoller />
              <ActionPanel />
              <PlayerPanel />
            </aside>
          </div>
        </div>
      ) : (
        /* ──────────────────────────────────────────────────────────── */
        /* MODE 2: PORTRAIT (Mobile phones & tablets held vertically)  */
        /* ──────────────────────────────────────────────────────────── */
        <div className="h-full w-full flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="h-11 border-b border-gold-600/25 bg-emerald-900/80 backdrop-blur-md px-3 flex items-center justify-between shrink-0 z-40">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-800 border border-gold-500/50 flex items-center justify-center text-gold-400 shrink-0">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <h1 className="font-display font-bold gold-text text-xs leading-none tracking-wider">
                NAVO VYAPAR
              </h1>
            </div>

            <div className="flex items-center gap-1">
              <TransactionHistory />

              <button
                onClick={() => setShowRules(true)}
                className="btn-secondary py-1 px-2 text-[11px] flex items-center gap-1"
                title="Rules"
              >
                <BookOpen className="w-3 h-3 text-gold-400" />
              </button>

              <button
                onClick={handleToggleSound}
                className="btn-secondary py-1 px-2 text-[11px] flex items-center"
                title={soundEnabled ? 'Mute Audio & Music' : 'Enable Audio & Music'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3 h-3 text-gold-400" />
                ) : (
                  <VolumeX className="w-3 h-3 text-emerald-500" />
                )}
              </button>

              <FullscreenButton compact iconSize={12} />

              <button
                onClick={() => setShowChat(!showChat)}
                className="btn-primary py-1 px-2 text-[11px] flex items-center gap-1"
              >
                <MessageSquare className="w-3 h-3 text-emerald-950" />
              </button>
            </div>
          </header>

          {/* Top Player Strip (Compact horizontal chips) */}
          {gameState && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-900/40 border-b border-emerald-800/40 overflow-x-auto no-scrollbar shrink-0">
              {gameState.players.map((p) => {
                const isTurn = currentPlayer?.id === p.id;
                const isMe = p.id === playerId;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-xs shrink-0 ${
                      isTurn
                        ? 'bg-emerald-800/90 border-gold-400 shadow-gold ring-1 ring-gold-400/40'
                        : 'bg-emerald-950/60 border-emerald-800/50'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-emerald-700 flex items-center justify-center text-white border border-gold-500/40 shrink-0">
                      <TokenIcon avatarId={p.avatar} size={9} />
                    </div>
                    <div className="leading-tight">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-[10px] truncate max-w-[55px]">
                          {p.name}
                        </span>
                        {isMe && (
                          <span className="text-[7px] bg-emerald-700 text-gold-300 font-bold px-0.5 rounded">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-gold-300 font-bold leading-none">
                        {formatMoney(p.money)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Central Board Section: Takes available vertical space, perfectly square */}
          <div className="flex-1 w-full min-h-0 min-w-0 flex items-center justify-center p-1 overflow-hidden">
            <GameBoard />
          </div>

          {/* Bottom Fixed Action Dock */}
          <div className="w-full shrink-0 p-1.5 bg-emerald-950/95 border-t border-gold-600/30 max-h-[36vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-1.5 max-w-md mx-auto">
              <DiceRoller />
              <ActionPanel />
            </div>
          </div>
        </div>
      )}

      {/* Modals & Overlays */}
      <PropertyModal />
      <TradeModal />
      <ChatPanel />
      <RulesModal />
    </div>
  );
}
