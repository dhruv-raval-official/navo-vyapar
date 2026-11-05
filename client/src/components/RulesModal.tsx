import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import {
  BookOpen,
  Dices,
  Home,
  Train,
  Lock,
  Coins,
  AlertOctagon,
  Trophy,
  X,
} from './Icons';

export default function RulesModal() {
  const showRules = useGameStore((s) => s.showRules);
  const setShowRules = useGameStore((s) => s.setShowRules);

  if (!showRules) return null;

  return (
    <AnimatePresence>
      {showRules && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowRules(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            onClick={(e) => e.stopPropagation()}
            className="card-premium max-w-2xl w-full max-h-[80vh] overflow-y-auto p-5 md:p-7 border border-gold-600/30"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gold-600/20 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-gold-400" />
                <h2 className="text-xl font-display font-bold gold-text">
                  Navo Vyapar – Game Rules
                </h2>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="text-white/60 hover:text-white p-1 rounded-full"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-emerald-100/80">
              <section className="bg-emerald-900/30 p-3 rounded-xl border border-emerald-800/40">
                <h3 className="text-gold-400 font-bold text-sm mb-1 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-gold-400" />
                  <span>Objective</span>
                </h3>
                <p>
                  Become the wealthiest merchant by buying, renting, developing, and trading properties.
                  Bankrupt your rivals to achieve total victory!
                </p>
              </section>

              <section className="bg-emerald-900/30 p-3 rounded-xl border border-emerald-800/40">
                <h3 className="text-gold-400 font-bold text-sm mb-1 flex items-center gap-2">
                  <Dices className="w-4 h-4 text-gold-400" />
                  <span>Rolling & Movement</span>
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Roll two dice on your turn and move forward along the board.</li>
                  <li>Rolling doubles grants an immediate extra roll.</li>
                  <li>Three consecutive doubles lands you in Jail!</li>
                  <li>Passing or landing on Start credits ₹2,000 salary from the Bank.</li>
                </ul>
              </section>

              <section className="bg-emerald-900/30 p-3 rounded-xl border border-emerald-800/40">
                <h3 className="text-gold-400 font-bold text-sm mb-1 flex items-center gap-2">
                  <Home className="w-4 h-4 text-emerald-400" />
                  <span>Properties & Improvements</span>
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Unowned space: Purchase it from the Bank or skip.</li>
                  <li>Opponent space: Pay mandatory rent to the owner.</li>
                  <li>Monopoly: Owning all properties in a group doubles site rent.</li>
                  <li>Build up to 4 houses, then a hotel to dramatically boost rent.</li>
                  <li>Building must be done evenly across all sites in a group.</li>
                </ul>
              </section>

              <section className="bg-emerald-900/30 p-3 rounded-xl border border-emerald-800/40">
                <h3 className="text-gold-400 font-bold text-sm mb-1 flex items-center gap-2">
                  <Train className="w-4 h-4 text-gold-400" />
                  <span>Railways & Utilities</span>
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Railway fare scales with ownership: ₹250 (1), ₹500 (2), ₹1,000 (3), ₹2,000 (4).</li>
                  <li>Utility rent equals dice roll multiplied by 4 (1 owned) or 10 (both owned).</li>
                </ul>
              </section>

              <section className="bg-emerald-900/30 p-3 rounded-xl border border-emerald-800/40">
                <h3 className="text-gold-400 font-bold text-sm mb-1 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-400" />
                  <span>Jail & Release</span>
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Imprisoned by landing on "Go To Jail", drawing a jail card, or rolling 3 doubles.</li>
                  <li>Release options: Roll doubles on your turn, pay ₹500 bail, or use a Jail Free card.</li>
                  <li>After 3 turns without doubles, paying ₹500 bail is mandatory.</li>
                </ul>
              </section>

              <section className="bg-emerald-900/30 p-3 rounded-xl border border-emerald-800/40">
                <h3 className="text-gold-400 font-bold text-sm mb-1 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-gold-400" />
                  <span>Mortgages & Trading</span>
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Mortgage unimproved properties for 50% face value (no rent collected).</li>
                  <li>Unmortgage by repaying mortgage value plus 10% bank interest.</li>
                  <li>Propose trades (properties + money) with any player during your turn.</li>
                </ul>
              </section>

              <section className="bg-emerald-900/30 p-3 rounded-xl border border-emerald-800/40">
                <h3 className="text-gold-400 font-bold text-sm mb-1 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-red-400" />
                  <span>Bankruptcy</span>
                </h3>
                <p className="text-xs">
                  If debts exceed available cash, you must sell buildings and mortgage properties.
                  If still insolvent, bankruptcy is declared and assets pass to your creditor.
                </p>
              </section>

              <div className="pt-3 border-t border-gold-600/20 text-center text-xs text-emerald-300/70">
                Developed by <strong className="text-gold-300">Dhruv J Raval</strong> • Celebrating Gujarat & Mehsana
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
