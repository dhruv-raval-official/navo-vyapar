import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useSocket } from '../hooks/useSocket';
import { formatMoney, getGroupColor } from '../utils/gameUtils';
import { soundManager } from '../utils/sounds';
import { TokenIcon, ArrowLeftRight, Bell, X, Coins, Building } from './Icons';
import type { TradeOffer } from '../types';

export default function TradeModal() {
  const {
    showTradeModal,
    setShowTradeModal,
    gameState,
    boardConfig,
    playerId,
    roomCode,
    setNotification,
  } = useGameStore();

  const { socket, emit } = useSocket();

  const [targetPlayerId, setTargetPlayerId] = useState<string>('');
  const [offeredProperties, setOfferedProperties] = useState<number[]>([]);
  const [requestedProperties, setRequestedProperties] = useState<number[]>([]);
  const [moneyOffered, setMoneyOffered] = useState<number>(0);
  const [moneyRequested, setMoneyRequested] = useState<number>(0);
  const [incomingTrade, setIncomingTrade] = useState<TradeOffer | null>(null);

  const me = gameState?.players.find((p) => p.id === playerId);
  const otherPlayers = gameState?.players.filter((p) => p.id !== playerId && !p.isBankrupt) || [];
  const targetPlayer = gameState?.players.find((p) => p.id === targetPlayerId);

  // Set default target player
  useEffect(() => {
    if (otherPlayers.length > 0 && (!targetPlayerId || !otherPlayers.some((p) => p.id === targetPlayerId))) {
      setTargetPlayerId(otherPlayers[0].id);
    }
  }, [otherPlayers, targetPlayerId]);

  // Listen for incoming trade proposals
  useEffect(() => {
    const handleTradeProposed = (offer: TradeOffer) => {
      setIncomingTrade(offer);
      setShowTradeModal(true);
      soundManager.notification();
      setNotification('New trade proposal received');
    };

    const handleTradeCompleted = (res: { accepted: boolean }) => {
      setIncomingTrade(null);
      if (res.accepted) {
        soundManager.moneyReceive();
        setNotification('Trade proposal accepted!');
      } else {
        setNotification('Trade proposal declined');
      }
    };

    socket.on('trade-proposed', handleTradeProposed);
    socket.on('trade-completed', handleTradeCompleted);

    return () => {
      socket.off('trade-proposed', handleTradeProposed);
      socket.off('trade-completed', handleTradeCompleted);
    };
  }, [socket, setShowTradeModal, setNotification]);

  if (!showTradeModal || !gameState || !boardConfig || !me) return null;

  const myProperties = [...me.properties, ...me.railroads, ...me.utilities];
  const targetProperties = targetPlayer
    ? [...targetPlayer.properties, ...targetPlayer.railroads, ...targetPlayer.utilities]
    : [];

  const handleProposeTrade = async () => {
    if (!targetPlayerId) return;

    try {
      await emit('propose-trade', {
        roomCode,
        fromId: playerId,
        toId: targetPlayerId,
        offer: {
          moneyOffered,
          moneyRequested,
          propertiesOffered: offeredProperties,
          propertiesRequested: requestedProperties,
        },
      });
      setNotification('Trade proposal sent');
      setShowTradeModal(false);
    } catch (err: any) {
      soundManager.error();
      setNotification(err.message || 'Trade proposal failed');
    }
  };

  const handleRespondTrade = async (accept: boolean) => {
    if (!incomingTrade) return;

    try {
      await emit('respond-trade', {
        roomCode,
        playerId,
        tradeId: incomingTrade.id,
        accept,
      });
      setIncomingTrade(null);
      setShowTradeModal(false);
    } catch (err: any) {
      soundManager.error();
      setNotification(err.message || 'Action failed');
    }
  };

  const toggleProperty = (spaceId: number, isOffer: boolean) => {
    if (isOffer) {
      setOfferedProperties((prev) =>
        prev.includes(spaceId) ? prev.filter((id) => id !== spaceId) : [...prev, spaceId]
      );
    } else {
      setRequestedProperties((prev) =>
        prev.includes(spaceId) ? prev.filter((id) => id !== spaceId) : [...prev, spaceId]
      );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
        onClick={() => setShowTradeModal(false)}
      >
        <motion.div
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="card-premium max-w-2xl w-full p-4 md:p-6 border border-gold-500/40 max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-3 border-b border-gold-600/20 mb-4">
            <div>
              <h2 className="text-lg md:text-xl font-display font-bold gold-text flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-gold-400" />
                <span>Trade Negotiation</span>
              </h2>
              <p className="text-xs text-emerald-300/70">Trade properties and capital with opponents</p>
            </div>
            <button
              onClick={() => setShowTradeModal(false)}
              className="text-white/60 hover:text-white p-1 rounded-full"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Incoming trade banner if receiving */}
          {incomingTrade && (
            <div className="mb-4 p-4 rounded-xl bg-gold-500/15 border-2 border-gold-400">
              <div className="font-bold text-gold-300 text-sm mb-2 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-gold-400" />
                <span>
                  Trade Offer from {gameState.players.find((p) => p.id === incomingTrade.from)?.name}!
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <div className="bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-800">
                  <span className="font-semibold text-emerald-300 block mb-1">They Offer:</span>
                  <div>Cash: {formatMoney(incomingTrade.moneyOffered || 0)}</div>
                  <div className="text-[11px] text-emerald-400/80">
                    Properties: {incomingTrade.propertiesOffered?.length || 0}
                  </div>
                </div>
                <div className="bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-800">
                  <span className="font-semibold text-emerald-300 block mb-1">They Request:</span>
                  <div>Cash: {formatMoney(incomingTrade.moneyRequested || 0)}</div>
                  <div className="text-[11px] text-emerald-400/80">
                    Properties: {incomingTrade.propertiesRequested?.length || 0}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleRespondTrade(true)}
                  className="btn-primary flex-1 py-2 text-xs"
                >
                  Accept Deal
                </button>
                <button
                  onClick={() => handleRespondTrade(false)}
                  className="btn-danger flex-1 py-2 text-xs"
                >
                  Decline Deal
                </button>
              </div>
            </div>
          )}

          {/* New Trade Form */}
          {!incomingTrade && (
            <div className="space-y-4">
              {/* Partner Select */}
              <div>
                <label className="block text-xs font-semibold text-emerald-200 mb-1.5">
                  Select Trading Partner:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {otherPlayers.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => {
                        setTargetPlayerId(player.id);
                        setRequestedProperties([]);
                      }}
                      className={`p-2 rounded-xl border text-xs flex items-center justify-center gap-1.5 transition-all ${
                        targetPlayerId === player.id
                          ? 'bg-gold-500/20 border-gold-400 text-gold-200 font-bold'
                          : 'bg-emerald-900/40 border-emerald-700/40 text-emerald-200 hover:bg-emerald-800/40'
                      }`}
                    >
                      <TokenIcon avatarId={player.avatar} size={14} />
                      <span className="truncate">{player.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Two Column Exchange */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: You Offer */}
                <div className="p-3 rounded-xl bg-emerald-900/30 border border-emerald-700/30">
                  <h3 className="text-xs font-bold text-gold-300 mb-2">You Offer:</h3>

                  <div className="mb-3">
                    <label className="text-[11px] text-emerald-300/80 block mb-1">
                      Cash: {formatMoney(moneyOffered)} / {formatMoney(me.money)}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={me.money}
                      step={100}
                      value={moneyOffered}
                      onChange={(e) => setMoneyOffered(Number(e.target.value))}
                      className="w-full accent-gold-500 cursor-pointer"
                    />
                  </div>

                  <label className="text-[11px] text-emerald-300/80 block mb-1">
                    Select Properties to Offer:
                  </label>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {myProperties.length === 0 ? (
                      <p className="text-[11px] text-emerald-500/50 italic">No properties to offer</p>
                    ) : (
                      myProperties.map((spaceId) => {
                        const s = boardConfig.spaces.find((sp) => sp.id === spaceId);
                        if (!s) return null;
                        const isSelected = offeredProperties.includes(spaceId);
                        const groupColor = s.group ? getGroupColor(s.group) : '#475569';
                        return (
                          <div
                            key={spaceId}
                            onClick={() => toggleProperty(spaceId, true)}
                            className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-gold-500/25 border-gold-400 font-bold text-gold-100'
                                : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200'
                            }`}
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: groupColor }}
                              />
                              <span className="truncate">{s.name}</span>
                            </span>
                            <span className="font-mono text-[10px] text-gold-300">
                              {formatMoney(s.price || 0)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right: You Request */}
                <div className="p-3 rounded-xl bg-emerald-900/30 border border-emerald-700/30">
                  <h3 className="text-xs font-bold text-gold-300 mb-2">
                    You Request from {targetPlayer?.name}:
                  </h3>

                  <div className="mb-3">
                    <label className="text-[11px] text-emerald-300/80 block mb-1">
                      Cash: {formatMoney(moneyRequested)} / {formatMoney(targetPlayer?.money || 0)}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={targetPlayer?.money || 0}
                      step={100}
                      value={moneyRequested}
                      onChange={(e) => setMoneyRequested(Number(e.target.value))}
                      className="w-full accent-gold-500 cursor-pointer"
                    />
                  </div>

                  <label className="text-[11px] text-emerald-300/80 block mb-1">
                    Select Properties to Request:
                  </label>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {targetProperties.length === 0 ? (
                      <p className="text-[11px] text-emerald-500/50 italic">They own no properties</p>
                    ) : (
                      targetProperties.map((spaceId) => {
                        const s = boardConfig.spaces.find((sp) => sp.id === spaceId);
                        if (!s) return null;
                        const isSelected = requestedProperties.includes(spaceId);
                        const groupColor = s.group ? getGroupColor(s.group) : '#475569';
                        return (
                          <div
                            key={spaceId}
                            onClick={() => toggleProperty(spaceId, false)}
                            className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-gold-500/25 border-gold-400 font-bold text-gold-100'
                                : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200'
                            }`}
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: groupColor }}
                              />
                              <span className="truncate">{s.name}</span>
                            </span>
                            <span className="font-mono text-[10px] text-gold-300">
                              {formatMoney(s.price || 0)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Propose */}
              <button
                onClick={handleProposeTrade}
                disabled={
                  !targetPlayerId ||
                  (moneyOffered === 0 &&
                    moneyRequested === 0 &&
                    offeredProperties.length === 0 &&
                    requestedProperties.length === 0)
                }
                className="btn-primary w-full py-2.5 text-xs md:text-sm flex items-center justify-center gap-2"
              >
                <ArrowLeftRight className="w-4 h-4 text-emerald-950" />
                <span>Propose Trade Deal</span>
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
