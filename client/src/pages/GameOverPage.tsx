import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, clearSession } from '../store/gameStore';
import { formatMoney, getAvatarColor } from '../utils/gameUtils';
import { TokenIcon, Trophy, Crown, Award, RotateCcw, Home, Coins, Building } from '../components/Icons';
import { soundManager } from '../utils/sounds';

export default function GameOverPage() {
  const { gameState, playerId, setScreen, resetGame } = useGameStore();

  useEffect(() => {
    soundManager.victory();
  }, []);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-4">
        <button onClick={() => setScreen('landing')} className="btn-primary">
          Return to Home
        </button>
      </div>
    );
  }

  // Sort players by totalWorth descending
  const rankedPlayers = [...gameState.players].sort((a, b) => {
    if (a.isBankrupt && !b.isBankrupt) return 1;
    if (!a.isBankrupt && b.isBankrupt) return -1;
    return b.totalWorth - a.totalWorth;
  });

  const winner = rankedPlayers[0];
  const isUserWinner = winner?.id === playerId;
  const winnerColor = getAvatarColor(winner.avatar);

  const handleExit = () => {
    clearSession();
    resetGame();
    setScreen('landing');
  };

  return (
    <div className="min-h-screen bg-emerald-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-gradient from-emerald-900/40 via-emerald-950 to-emerald-950 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="card-premium max-w-2xl w-full p-6 md:p-8 relative z-10 border border-gold-400/40 text-center shadow-gold"
      >
        {/* Crown & Winner Announcement */}
        <div className="w-16 h-16 mx-auto rounded-full bg-gold-500/15 border-2 border-gold-400/60 flex items-center justify-center text-gold-400 mb-3 shadow-gold">
          <Trophy size={32} />
        </div>

        <div className="text-3xl md:text-4xl font-display font-black gold-text mb-1 tracking-wide">
          {winner.name} Wins!
        </div>
        <p className="text-emerald-300/80 text-sm">
          {isUserWinner ? 'Congratulations! You built the grandest empire in Navo Vyapar!' : 'Champion of Navo Vyapar!'}
        </p>

        {/* Winner Highlight Card */}
        <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-gold-600/20 via-gold-500/30 to-gold-600/20 border border-gold-400/60 flex items-center justify-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-lg"
            style={{ backgroundColor: `${winnerColor}25`, color: winnerColor, border: `2px solid ${winnerColor}` }}
          >
            <TokenIcon avatarId={winner.avatar} size={28} />
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xl font-bold text-white">{winner.name}</h3>
              <Crown size={16} className="text-gold-400" />
            </div>
            <p className="text-gold-300 font-bold font-mono text-lg">
              Net Worth: {formatMoney(winner.totalWorth)}
            </p>
            <p className="text-emerald-300/70 text-xs">
              Cash: {formatMoney(winner.money)} | Properties: {winner.properties.length + winner.railroads.length + winner.utilities.length}
            </p>
          </div>
        </div>

        {/* Final Leaderboard */}
        <h4 className="text-left text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Award size={16} className="text-gold-400" />
          <span>Final Leaderboard</span>
        </h4>

        <div className="space-y-2 mb-6">
          {rankedPlayers.map((player, idx) => {
            const isWinnerItem = idx === 0;
            const pColor = getAvatarColor(player.avatar);

            return (
              <div
                key={player.id}
                className={`p-3 rounded-xl flex items-center justify-between border text-left transition-colors ${
                  isWinnerItem
                    ? 'bg-gold-500/15 border-gold-400/50 text-gold-100'
                    : player.isBankrupt
                    ? 'bg-red-950/20 border-red-800/30 text-emerald-400/50 opacity-60'
                    : 'bg-emerald-900/40 border-emerald-700/40 text-emerald-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold font-mono text-xs w-6 text-center text-gold-400">
                    #{idx + 1}
                  </span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${pColor}20`, color: pColor, border: `1px solid ${pColor}` }}
                  >
                    <TokenIcon avatarId={player.avatar} size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span>{player.name}</span>
                      {player.id === playerId && (
                        <span className="text-[9px] bg-emerald-800 text-gold-300 px-1.5 py-0.2 rounded font-bold border border-gold-500/30">
                          YOU
                        </span>
                      )}
                      {player.isBankrupt && (
                        <span className="text-[9px] bg-red-900/80 text-red-200 px-1.5 py-0.2 rounded font-semibold">
                          Bankrupt
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-emerald-400/60 flex items-center gap-2 mt-0.5">
                      <span>Properties: {player.properties.length + player.railroads.length + player.utilities.length}</span>
                      <span>Houses: {Object.values(player.houses || {}).reduce((a, b) => a + b, 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-sm font-mono text-gold-300">
                    {formatMoney(player.totalWorth)}
                  </div>
                  <div className="text-[11px] text-emerald-400/60 font-mono">
                    Cash: {formatMoney(player.money)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setScreen('setup')}
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
          >
            <RotateCcw size={16} />
            <span>Play Again</span>
          </button>
          <button
            onClick={handleExit}
            className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3"
          >
            <Home size={16} />
            <span>Main Menu</span>
          </button>
        </div>

        {/* Developer Credit */}
        <div className="mt-4 pt-3 border-t border-gold-600/20 text-[11px] text-emerald-400/60 text-center font-medium">
          Navo Vyapar – Developed with pride by <strong className="text-gold-300">Dhruv J Raval</strong> (Mehsana, Gujarat)
        </div>
      </motion.div>
    </div>
  );
}
