import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, saveSession } from '../store/gameStore';
import { useSocket } from '../hooks/useSocket';
import { TokenIcon, LogIn, ArrowLeft, KeyRound } from '../components/Icons';
import { getAvatarColor } from '../utils/gameUtils';

export default function JoinRoomPage() {
  const { playerName, playerAvatar, setRoomCode, setPlayerId, setReconnectToken, setRoom, setScreen } = useGameStore();
  const { emit } = useSocket();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const avatarColor = getAvatarColor(playerAvatar);

  // Check URL query parameters for invitation link ?room=XXXXXX
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setCode(roomParam.toUpperCase().slice(0, 6));
    }
  }, []);

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length < 4) {
      setError('Please enter a valid room code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res: any = await emit('join-room', {
        roomCode: cleanCode,
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
      if (res.room) {
        setRoom(res.room);
      }

      saveSession({
        roomCode: res.roomCode,
        playerId: res.playerId,
        reconnectToken: res.reconnectToken,
        playerName,
        playerAvatar,
      });

      setScreen('lobby');
    } catch (err: any) {
      setError(err?.message || 'Failed to join room');
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
          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-gold mb-3"
          style={{ backgroundColor: `${avatarColor}20`, color: avatarColor, border: `2px solid ${avatarColor}` }}
        >
          <TokenIcon avatarId={playerAvatar} size={30} />
        </div>

        <h2 className="text-2xl font-display font-bold gold-text tracking-wide">
          Join Navo Vyapar Room
        </h2>
        <p className="text-emerald-300/70 text-xs md:text-sm mt-1">Enter the 6-character room code to join</p>

        <form onSubmit={handleJoin} className="mt-6">
          <label className="block text-emerald-200 text-xs font-semibold mb-2 text-left flex items-center gap-1.5">
            <KeyRound size={14} className="text-gold-400" />
            <span>Room Code</span>
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (error) setError('');
            }}
            placeholder="e.g. KV89A2"
            maxLength={6}
            className="input-premium text-2xl font-mono text-center tracking-[0.3em] uppercase py-3 font-bold"
            autoFocus
          />

          {error && (
            <div className="p-3 my-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs text-left">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.trim().length === 0}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2 text-base py-3"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-emerald-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                <span>Join Table</span>
              </>
            )}
          </button>
        </form>

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
