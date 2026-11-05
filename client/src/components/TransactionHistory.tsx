import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { History, X } from './Icons';

export default function TransactionHistory() {
  const [isOpen, setIsOpen] = useState(false);
  const gameState = useGameStore((s) => s.gameState);

  if (!gameState) return null;

  const logs = gameState.log || [];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary py-1.5 px-2.5 text-xs flex items-center gap-1.5"
        title="Transaction History"
      >
        <History className="w-3.5 h-3.5 text-gold-400" />
        <span className="hidden sm:inline">History</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="card-premium max-w-lg w-full max-h-[70vh] overflow-hidden flex flex-col border border-gold-600/30"
            >
              <div className="flex items-center justify-between p-4 border-b border-gold-600/20">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-gold-400" />
                  <h3 className="text-base font-display font-bold gold-text">
                    Transaction History
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/60 hover:text-white p-1 rounded-full"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
                {logs.length === 0 ? (
                  <p className="text-emerald-300/50 text-center py-8 text-xs">
                    No transactions recorded yet
                  </p>
                ) : (
                  [...logs].reverse().map((log, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs p-2 rounded-lg bg-emerald-900/40 border border-emerald-800/40"
                    >
                      <span className="text-gold-400 font-mono text-[10px] mt-0.5 whitespace-nowrap font-bold">
                        Round {log.turn}
                      </span>
                      <span className="text-emerald-100/80 leading-relaxed">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
