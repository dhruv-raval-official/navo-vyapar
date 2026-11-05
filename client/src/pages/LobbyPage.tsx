import React, { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useSocket } from '../hooks/useSocket';
import {
  TokenIcon,
  Crown,
  Copy,
  Check,
  Share2,
  Users,
  PlayCircle,
  LogOut,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
} from '../components/Icons';
import { getAvatarColor } from '../utils/gameUtils';
import type { Room, GameState } from '../types';
import FullscreenButton from '../components/FullscreenButton';

export default function LobbyPage() {
  const {
    roomCode,
    room,
    playerId,
    setRoom,
    setGameState,
    setScreen,
    setBoardConfig,
    resetGame,
  } = useGameStore();

  const { socket, emit } = useSocket();
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inviteLink = `${window.location.origin}?room=${roomCode}`;
  const isHost = room?.hostId === playerId;
  const currentPlayer = room?.players.find((p) => p.id === playerId);
  const allReady = room ? room.players.every((p) => p.ready) : false;
  const hasMinPlayers = room ? room.players.length >= (room.minPlayers || 2) : false;
  const canStart = isHost && allReady && hasMinPlayers;

  // Socket event listeners
  useEffect(() => {
    const handleRoomUpdated = (updatedRoom: Room) => {
      setRoom(updatedRoom);
    };

    const handlePlayerJoined = (data: { room: Room; player: { name: string } }) => {
      setRoom(data.room);
    };

    const handlePlayerLeft = (data: { room: Room; playerId: string }) => {
      setRoom(data.room);
    };

    const handlePlayerReconnected = (data: { room: Room; playerId: string }) => {
      setRoom(data.room);
    };

    const handlePlayerDisconnected = (data: { room: Room; playerId: string }) => {
      setRoom(data.room);
    };

    const handleGameStarted = (data: any) => {
      const state = data?.gameState || data;
      setGameState(state);
      if (data?.boardConfig) {
        setBoardConfig(data.boardConfig);
      }
      setScreen('game');
    };

    socket.on('room-updated', handleRoomUpdated);
    socket.on('player-joined', handlePlayerJoined);
    socket.on('player-left', handlePlayerLeft);
    socket.on('player-reconnected', handlePlayerReconnected);
    socket.on('player-disconnected', handlePlayerDisconnected);
    socket.on('game-started', handleGameStarted);

    return () => {
      socket.off('room-updated', handleRoomUpdated);
      socket.off('player-joined', handlePlayerJoined);
      socket.off('player-left', handlePlayerLeft);
      socket.off('player-reconnected', handlePlayerReconnected);
      socket.off('player-disconnected', handlePlayerDisconnected);
      socket.off('game-started', handleGameStarted);
    };
  }, [socket, setRoom, setGameState, setScreen, setBoardConfig]);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied('code');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = roomCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied('code');
      setTimeout(() => setCopied(null), 2000);
    }
  }, [roomCode]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied('link');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = inviteLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied('link');
      setTimeout(() => setCopied(null), 2000);
    }
  }, [inviteLink]);

  const handleToggleReady = useCallback(async () => {
    if (!currentPlayer) return;
    setError(null);
    try {
      await emit('set-ready', { roomCode, playerId, ready: !currentPlayer.ready });
    } catch (err: any) {
      setError(err.message || 'Failed to toggle ready status');
    }
  }, [emit, currentPlayer, roomCode, playerId]);

  const handleStartGame = useCallback(async () => {
    if (!canStart) return;
    setError(null);
    setLoading(true);
    try {
      const res: any = await emit('start-game', { roomCode, playerId });
      if (res?.gameState) {
        setGameState(res.gameState);
        setScreen('game');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start game');
    } finally {
      setLoading(false);
    }
  }, [emit, canStart, roomCode, playerId, setGameState, setScreen]);

  const handleLeaveRoom = useCallback(async () => {
    setError(null);
    try {
      await emit('leave-room', { roomCode, playerId });
      resetGame();
      setScreen('landing');
    } catch (err: any) {
      resetGame();
      setScreen('landing');
    }
  }, [emit, resetGame, setScreen, roomCode, playerId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="w-9" />
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-display font-bold gold-text tracking-wide mb-1">
              NAVO VYAPAR
            </h1>
            <p className="text-emerald-300/70 text-xs md:text-sm">Multiplayer Table Lobby</p>
          </div>
          <FullscreenButton iconSize={15} showLabel={false} />
        </div>

        {/* Room Code Card */}
        <div className="card-premium p-5 mb-5 border border-gold-500/30 shadow-xl">
          <div className="text-center mb-3">
            <p className="text-emerald-400 text-xs uppercase tracking-widest font-semibold mb-1">
              Table Room Code
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-3xl md:text-4xl font-black text-gold-300 tracking-[0.25em]">
                {roomCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-xl bg-gold-500/15 text-gold-300 hover:bg-gold-500/25 transition-colors border border-gold-500/30"
                title="Copy Room Code"
              >
                {copied === 'code' ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {/* Invite Link */}
          <div className="flex items-center gap-2 bg-emerald-950/70 rounded-xl p-2.5 border border-emerald-700/40">
            <Share2 size={16} className="text-gold-400 shrink-0 ml-1" />
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="bg-transparent text-emerald-200/80 text-xs font-mono w-full outline-none truncate"
            />
            <button
              onClick={handleCopyLink}
              className="btn-secondary py-1 px-3 text-xs shrink-0 flex items-center gap-1"
            >
              {copied === 'link' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied === 'link' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Error notification */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
                <XCircle size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Players List Card */}
        <div className="card-premium p-5 mb-5 border border-gold-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-emerald-200 uppercase tracking-wider flex items-center gap-2">
              <Users size={16} className="text-gold-400" />
              <span>Connected Players ({room?.players.length || 0}/4)</span>
            </h2>
            <span className="text-xs text-emerald-400/60">Minimum 2 to start</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {room?.players.map((player) => {
              const isCurrent = player.id === playerId;
              const isRoomHost = player.id === room.hostId;
              const avatarColor = getAvatarColor(player.avatar);

              return (
                <div
                  key={player.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    isCurrent
                      ? 'bg-gold-500/10 border-gold-400/50 shadow-gold'
                      : 'bg-emerald-900/40 border-emerald-700/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md"
                      style={{
                        backgroundColor: `${avatarColor}20`,
                        color: avatarColor,
                        border: `1.5px solid ${avatarColor}`,
                      }}
                    >
                      <TokenIcon avatarId={player.avatar} size={20} />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-white">{player.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] bg-emerald-800 text-gold-300 px-1.5 py-0.2 rounded font-bold border border-gold-500/30">
                            YOU
                          </span>
                        )}
                        {isRoomHost && (
                          <span className="text-[9px] bg-gold-500/20 text-gold-300 px-1.5 py-0.2 rounded font-bold border border-gold-500/40 flex items-center gap-1">
                            <Crown size={10} className="text-gold-400" />
                            <span>Host</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-emerald-400/60 flex items-center gap-1 mt-0.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            player.connected ? 'bg-emerald-400' : 'bg-gray-500'
                          }`}
                        />
                        <span>{player.connected ? 'Connected' : 'Offline'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {player.ready ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 size={12} />
                        <span>Ready</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gold-500/15 text-gold-400 border border-gold-500/30">
                        <span>Waiting</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Ready Button */}
          {currentPlayer && (
            <button
              onClick={handleToggleReady}
              className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${
                currentPlayer.ready
                  ? 'bg-emerald-800 text-emerald-200 border border-emerald-500/50 hover:bg-emerald-700'
                  : 'btn-primary shadow-gold'
              }`}
            >
              <CheckCircle2 size={18} />
              <span>{currentPlayer.ready ? 'Cancel Ready' : 'Mark Ready'}</span>
            </button>
          )}

          {/* Start Game Button (Host only) */}
          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={!canStart || loading}
              className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${
                canStart && !loading
                  ? 'btn-primary shadow-gold animate-pulse'
                  : 'bg-emerald-950/60 text-emerald-600/40 border border-emerald-800/40 cursor-not-allowed'
              }`}
            >
              <PlayCircle size={18} />
              <span>{loading ? 'Starting...' : 'Start Game'}</span>
            </button>
          )}

          {/* Leave Room Button */}
          <button
            onClick={handleLeaveRoom}
            className="btn-danger sm:w-auto py-3 px-5 flex items-center justify-center gap-1.5 text-sm"
          >
            <LogOut size={16} />
            <span>Leave</span>
          </button>
        </div>

        {/* Host Hint */}
        {isHost && !canStart && (
          <p className="text-center text-emerald-400/60 text-xs mt-3">
            {!hasMinPlayers
              ? 'Need at least 2 players to begin'
              : !allReady
              ? 'Waiting for all players to click Ready'
              : ''}
          </p>
        )}
      </motion.div>
    </div>
  );
}
