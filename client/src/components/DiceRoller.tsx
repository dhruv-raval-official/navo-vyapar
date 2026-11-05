import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useSocket } from '../hooks/useSocket';
import { soundManager } from '../utils/sounds';
import { Dices, Sparkles } from './Icons';

interface DiceProps {
  value: number;
  isRolling: boolean;
}

// 6-sided Dice Pip Face layout
function DieFace({ value, isRolling }: DiceProps) {
  // Dot coordinates for 3x3 grid
  const pipPatterns: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  const pips = pipPatterns[value] || [4];

  return (
    <motion.div
      animate={
        isRolling
          ? {
              rotateX: [0, 180, 360, 540],
              rotateY: [0, 90, 180, 360],
              scale: [1, 1.1, 0.95, 1],
            }
          : { rotateX: 0, rotateY: 0, scale: 1 }
      }
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-gradient-to-br from-ivory-100 via-ivory-200 to-ivory-300 p-1.5 border-2 border-gold-400 shadow-md flex items-center justify-center relative select-none"
    >
      <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-0.5">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
          <div key={idx} className="flex items-center justify-center">
            {pips.includes(idx) && (
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-950 shadow-inner block" />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function DiceRoller() {
  const { gameState, roomCode, playerId, setNotification } = useGameStore();
  const { emit } = useSocket();
  const [rolling, setRolling] = useState(false);

  if (!gameState) return null;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === playerId;
  const canRoll = isMyTurn && gameState.phase === 'rolling' && !currentPlayer?.isBankrupt;

  const dice = gameState.lastDice || [1, 1];
  const isDoubles = dice[0] === dice[1] && dice[0] > 0;
  const diceTotal = dice[0] + dice[1];

  const handleRoll = async () => {
    if (!canRoll || rolling) return;

    setRolling(true);
    soundManager.diceRoll();

    try {
      const res: any = await emit('roll-dice', {
        roomCode,
        playerId,
      });

      // Quick snappy finish (no artificial lag)
      setRolling(false);
      soundManager.diceResult();
      if (res?.isDoubles) {
        setNotification('Doubles! Roll again!');
      }
    } catch (err: any) {
      setRolling(false);
      soundManager.error();
      setNotification(err.message || 'Roll failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-900/50 border border-gold-600/30 backdrop-blur-sm shadow-premium">
      {/* Dice Faces */}
      <div className="flex items-center gap-3 sm:gap-4 my-1">
        <DieFace value={dice[0] || 1} isRolling={rolling} />
        <DieFace value={dice[1] || 1} isRolling={rolling} />
      </div>

      {/* Total & Status */}
      <div className="text-center my-1">
        <div className="text-xs font-semibold text-emerald-200 flex items-center justify-center gap-1.5">
          <span>Total:</span>
          <span className="text-gold-300 font-bold font-mono text-sm">
            {rolling ? '...' : diceTotal}
          </span>
          {isDoubles && !rolling && (
            <span className="text-[10px] bg-gold-500/20 text-gold-300 border border-gold-500/40 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Doubles!</span>
            </span>
          )}
        </div>
      </div>

      {/* Roll Button */}
      {isMyTurn ? (
        <button
          onClick={handleRoll}
          disabled={!canRoll || rolling}
          className={`w-full py-2 px-3 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all duration-150 flex items-center justify-center gap-2 ${
            canRoll && !rolling
              ? 'btn-primary shadow-gold'
              : 'bg-emerald-950/60 text-emerald-500/50 border border-emerald-800/40 cursor-not-allowed'
          }`}
        >
          <Dices className="w-4 h-4 text-emerald-950" />
          <span>
            {rolling ? 'Rolling...' : canRoll ? 'Roll Dice' : 'Action Pending'}
          </span>
        </button>
      ) : (
        <div className="text-xs text-emerald-400/80 py-1 text-center font-medium">
          Turn: <span className="text-gold-300 font-semibold">{currentPlayer?.name}</span>
        </div>
      )}
    </div>
  );
}
