import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, saveSession } from '../store/gameStore';
import { useSocket } from '../hooks/useSocket';
import { TokenIcon, Play, ArrowLeft, Users, Coins, ShieldCheck } from '../components/Icons';
import { getAvatarColor } from '../utils/gameUtils';

export default function CreateRoomPage() {
  const { playerName, playerAvatar, setRoomCode, setPlayerId, setReconnectToken, setRoom, setScreen } = useGameStore();
  const { emit } = useSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const avatarColor = getAvatarColor(playerAvatar);

  const handleCreateRoom = async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await emit('create-room', {
        playerName,
        playerAvatar,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      setRoomCode(res.roomCode);
      setPlayerId(res.playerId);
      setReconnectToken(res.reconnectToken);

      saveSession({
        roomCode: res.roomCode,
        playerId: res.playerId,
        reconnectToken: res.reconnectToken,
        playerName,
        playerAvatar,
      });

      // Initial room representation with host
      setRoom({
        code: res.roomCode,
        hostId: res.playerId,
        status: 'waiting',
        maxPlayers: 4,
        minPlayers: 2,
        players: [
          {
            id: res.playerId,
            name: playerName,
            avatar: playerAvatar,
            ready: true,
            connected: true,
          },
        ],
      });

      setScreen('lobby');
    } catch (err: any) {
      setError(err?.message || 'Failed to create room');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="card-premium max-w-md w-full p-6 md:p-8 relative z-10 border border-gold-500/30 text-center shadow-2xl"
      >
        <div
          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-gold mb-4"
          style={{ backgroundColor: `${avatarColor}20`, color: avatarColor, border: `2px solid ${avatarColor}` }}
        >
          <TokenIcon avatarId={playerAvatar} size={32} />
        </div>

        <h2 className="text-2xl font-display font-bold gold-text tracking-wide">
          Host Game Room
        </h2>
        <p className="text-emerald-300/70 text-xs md:text-sm mt-1">Configure your multiplayer table</p>

        <div className="my-6 p-4 rounded-xl bg-emerald-900/30 border border-emerald-700/30 text-left space-y-2.5">
          <div className="flex justify-between items-center text-xs md:text-sm py-1 border-b border-emerald-800/50">
            <span className="text-emerald-300/70 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-gold-400" />
              <span>Host Player:</span>
            </span>
            <span className="text-gold-300 font-semibold">{playerName}</span>
          </div>
          <div className="flex justify-between items-center text-xs md:text-sm py-1 border-b border-emerald-800/50">
            <span className="text-emerald-300/70 flex items-center gap-1.5">
              <Users size={14} className="text-gold-400" />
              <span>Capacity:</span>
            </span>
            <span className="text-emerald-100 font-medium">2 to 4 Players</span>
          </div>
          <div className="flex justify-between items-center text-xs md:text-sm py-1">
            <span className="text-emerald-300/70 flex items-center gap-1.5">
              <Coins size={14} className="text-gold-400" />
              <span>Starting Cash:</span>
            </span>
            <span className="text-gold-400 font-bold font-mono">₹25,000 / player</span>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs text-left">
            {error}
          </div>
        )}

        <button
          onClick={handleCreateRoom}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3"
        >
          {loading ? (
            <span className="inline-block w-5 h-5 border-2 border-emerald-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Play size={18} />
              <span>Launch Table</span>
            </>
          )}
        </button>

        <button
          onClick={() => setScreen('setup')}
          className="w-full text-center text-xs text-emerald-400/60 hover:text-emerald-300 mt-4 transition-colors flex items-center justify-center gap-1"
        >
          <ArrowLeft size={14} />
          <span>Back to Profile</span>
        </button>
      </motion.div>
    </div>
  );
}
