import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { formatMoney, getGroupColor } from '../utils/gameUtils';
import { TokenIcon, Home, Building, Lock, User } from './Icons';

export default function PlayerPanel() {
  const { gameState, playerId, boardConfig, setShowPropertyModal } = useGameStore();
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  if (!gameState || !boardConfig) return null;

  const currentTurnPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-emerald-300/80 px-1">
        <span>Players</span>
        <span>Round {gameState.turnNumber}</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {gameState.players.map((player) => {
          const isCurrentTurn = currentTurnPlayer?.id === player.id;
          const isUser = player.id === playerId;
          const isExpanded = expandedPlayerId === player.id;

          const totalProperties =
            (player.properties?.length || 0) +
            (player.railroads?.length || 0) +
            (player.utilities?.length || 0);

          const totalHouses = Object.values(player.houses || {}).reduce((a, b) => a + b, 0);
          const totalHotels = Object.keys(player.hotels || {}).length;

          return (
            <div
              key={player.id}
              className={`rounded-xl border transition-all duration-150 overflow-hidden ${
                isCurrentTurn
                  ? 'bg-gradient-to-r from-emerald-900/90 to-emerald-800/80 border-gold-400 ring-1 ring-gold-400/50 shadow-gold'
                  : player.isBankrupt
                  ? 'bg-red-950/20 border-red-900/30 opacity-60'
                  : 'bg-emerald-950/70 border-emerald-800/50 hover:border-gold-600/30'
              }`}
            >
              {/* Header card */}
              <div
                onClick={() => setExpandedPlayerId(isExpanded ? null : player.id)}
                className="p-2.5 cursor-pointer flex items-center justify-between select-none"
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-emerald-800 border border-gold-400/60 flex items-center justify-center text-white shadow-xs">
                      <TokenIcon avatarId={player.avatar} size={16} />
                    </div>
                    {isCurrentTurn && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gold-400 rounded-full animate-ping" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs md:text-sm text-white">
                        {player.name}
                      </span>
                      {isUser && (
                        <span className="text-[9px] bg-emerald-800 text-gold-300 font-bold px-1.5 py-0.2 rounded border border-gold-500/30">
                          YOU
                        </span>
                      )}
                      {!player.connected && (
                        <span className="text-[9px] bg-gray-800 text-gray-300 px-1 rounded">
                          Offline
                        </span>
                      )}
                      {player.inJail && (
                        <span className="text-[9px] bg-red-900/80 text-red-200 px-1 rounded flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Jail</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-emerald-400/70 flex items-center gap-2 mt-0.5">
                      <span>Properties: {totalProperties}</span>
                      {totalHouses > 0 && (
                        <span className="flex items-center gap-0.5 text-emerald-300">
                          <Home className="w-2.5 h-2.5 text-emerald-400" />
                          <span>{totalHouses}</span>
                        </span>
                      )}
                      {totalHotels > 0 && (
                        <span className="flex items-center gap-0.5 text-red-300">
                          <Building className="w-2.5 h-2.5 text-red-400" />
                          <span>{totalHotels}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-gold-300">
                    {formatMoney(player.money)}
                  </div>
                  <div className="text-[10px] text-emerald-400/60">
                    Net: {formatMoney(player.totalWorth)}
                  </div>
                </div>
              </div>

              {/* Collapsible Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-emerald-800/40 p-2.5 bg-emerald-950/90 text-xs"
                  >
                    <div className="font-semibold text-emerald-300/80 mb-1.5 flex justify-between">
                      <span>Owned Properties:</span>
                      <span className="text-[10px] text-emerald-400/50">Click to view</span>
                    </div>

                    {totalProperties === 0 ? (
                      <p className="text-emerald-500/50 text-[11px] italic">No properties owned</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          ...player.properties,
                          ...player.railroads,
                          ...player.utilities,
                        ].map((spaceId) => {
                          const space = boardConfig.spaces.find((s) => s.id === spaceId);
                          if (!space) return null;
                          const isMortgaged = player.mortgaged?.includes(spaceId);
                          const houseCount = player.houses?.[spaceId] || 0;
                          const hasHotel = player.hotels?.[spaceId];
                          const groupColor = space.group ? getGroupColor(space.group) : '#334155';

                          return (
                            <button
                              key={spaceId}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowPropertyModal(spaceId);
                              }}
                              className={`px-2 py-1 rounded-md text-[10px] font-medium border flex items-center gap-1 transition-transform hover:scale-105 ${
                                isMortgaged
                                  ? 'bg-gray-800/80 text-gray-400 border-gray-600 line-through'
                                  : 'bg-emerald-900/60 text-emerald-100 border-emerald-700/60'
                              }`}
                            >
                              <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: groupColor }}
                              />
                              <span className="truncate max-w-[80px]">{space.name}</span>
                              {hasHotel && <Building className="w-2.5 h-2.5 text-red-400 inline" />}
                              {!hasHotel && houseCount > 0 && (
                                <span className="flex items-center text-emerald-400 font-bold">
                                  <Home className="w-2.5 h-2.5 inline mr-0.5" />
                                  {houseCount}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
