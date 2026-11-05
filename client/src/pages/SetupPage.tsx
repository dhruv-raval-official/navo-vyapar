import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { TokenIcon, User, PlusCircle, LogIn, ArrowLeft } from '../components/Icons';

const AVATARS = [
  { id: 'diya', name: 'Diya', color: '#f97316', desc: 'Light & Prosperity' },
  { id: 'chakra', name: 'Chakra', color: '#0284c7', desc: 'Dharma & Progress' },
  { id: 'lotus', name: 'Lotus', color: '#ec4899', desc: 'Purity & Grace' },
  { id: 'peacock', name: 'Peacock', color: '#0d9488', desc: 'Royal Beauty' },
  { id: 'elephant', name: 'Gajraj', color: '#9333ea', desc: 'Wisdom & Power' },
  { id: 'kite', name: 'Patang', color: '#eab308', desc: 'Uttarayan Spirit' },
  { id: 'conch', name: 'Shankh', color: '#0ea5e9', desc: 'Sacred Auspicious' },
  { id: 'rangoli', name: 'Rangoli', color: '#e11d48', desc: 'Festive Joy' },
];

export default function SetupPage() {
  const { playerName, playerAvatar, setPlayerInfo, setScreen } = useGameStore();
  const [name, setName] = useState(playerName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(playerAvatar || 'diya');
  const [error, setError] = useState('');

  const handleNext = (targetScreen: 'createRoom' | 'joinRoom') => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your player name');
      return;
    }
    if (trimmed.length > 15) {
      setError('Name must be 15 characters or less');
      return;
    }
    setError('');
    setPlayerInfo(trimmed, selectedAvatar);
    setScreen(targetScreen);
  };

  return (
    <div className="min-h-screen bg-emerald-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-radial-gradient from-emerald-900/30 via-emerald-950 to-emerald-950 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-gold-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card-premium max-w-xl w-full p-6 md:p-8 relative z-10 border border-gold-500/30 shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gold-500/10 border border-gold-400/30 flex items-center justify-center text-gold-400 mb-2">
            <User size={24} />
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold gold-text tracking-wide">
            Player Profile Setup
          </h1>
          <p className="text-emerald-300/70 text-xs md:text-sm mt-1">Choose your identity and game token</p>
        </div>

        {/* Name input */}
        <div className="mb-6">
          <label className="block text-emerald-200 text-xs md:text-sm font-semibold mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. Sardar, Gandhi, Jignesh..."
            maxLength={15}
            className="input-premium text-base md:text-lg font-medium tracking-wide"
            autoFocus
          />
          {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
        </div>

        {/* Avatar selection */}
        <div className="mb-8">
          <label className="block text-emerald-200 text-xs md:text-sm font-semibold mb-3">
            Choose Your Token Avatar
          </label>
          <div className="grid grid-cols-4 gap-2.5 md:gap-3">
            {AVATARS.map((av) => {
              const isSelected = selectedAvatar === av.id;
              return (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelectedAvatar(av.id)}
                  className={`relative p-2.5 md:p-3 rounded-xl flex flex-col items-center justify-center transition-all duration-200 border text-center ${
                    isSelected
                      ? 'bg-gold-500/20 border-gold-400 shadow-gold scale-105'
                      : 'bg-emerald-900/40 border-emerald-700/40 hover:bg-emerald-800/40 hover:border-gold-500/40'
                  }`}
                >
                  <div
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-1.5 shadow-md transition-transform"
                    style={{ backgroundColor: `${av.color}25`, color: av.color, border: `1.5px solid ${av.color}` }}
                  >
                    <TokenIcon avatarId={av.id} size={22} />
                  </div>
                  <span className="text-xs font-semibold text-emerald-100 truncate w-full">{av.name}</span>
                  <span className="text-[10px] text-emerald-400/60 truncate w-full hidden sm:block">{av.desc}</span>
                  {isSelected && (
                    <motion.div
                      layoutId="selected-ring"
                      className="absolute inset-0 rounded-xl border-2 border-gold-400 pointer-events-none"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gold-600/20">
          <button
            onClick={() => handleNext('createRoom')}
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
          >
            <PlusCircle size={18} />
            <span>Create Room</span>
          </button>
          <button
            onClick={() => handleNext('joinRoom')}
            className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3"
          >
            <LogIn size={18} />
            <span>Join Room</span>
          </button>
        </div>

        <button
          onClick={() => setScreen('landing')}
          className="w-full text-center text-xs text-emerald-400/60 hover:text-emerald-300 mt-4 transition-colors flex items-center justify-center gap-1.5"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </button>
      </motion.div>
    </div>
  );
}
