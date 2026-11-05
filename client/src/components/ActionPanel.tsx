import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useSocket } from '../hooks/useSocket';
import { formatMoney } from '../utils/gameUtils';
import { soundManager } from '../utils/sounds';
import {
  ShoppingBag,
  FastForward,
  ArrowLeftRight,
  AlertOctagon,
  KeyRound,
  Lock,
  Building,
  CheckCircle2,
} from './Icons';

export default function ActionPanel() {
  const {
    gameState,
    boardConfig,
    playerId,
    roomCode,
    setShowPropertyModal,
    setShowTradeModal,
    setNotification,
  } = useGameStore();

  const { emit } = useSocket();
  const [confirmBankrupt, setConfirmBankrupt] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!gameState || !boardConfig) return null;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === playerId;
  const landedSpace = boardConfig.spaces[currentPlayer?.position || 0];

  const isUnownedProperty =
    landedSpace &&
    (landedSpace.type === 'property' ||
      landedSpace.type === 'railway' ||
      landedSpace.type === 'utility') &&
    !gameState.propertyOwnership[landedSpace.id];

  const canAffordProperty =
    landedSpace?.price != null && (currentPlayer?.money || 0) >= landedSpace.price;

  const handleEndTurn = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await emit('end-turn', { roomCode, playerId });
    } catch (err: any) {
      soundManager.error();
      setNotification(err.message || 'Cannot end turn');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuyPropertyDirect = async () => {
    if (!landedSpace || isProcessing) return;
    setIsProcessing(true);
    try {
      soundManager.propertyBuy();
      await emit('buy-property', { roomCode, playerId, spaceId: landedSpace.id });
      setNotification(`Purchased ${landedSpace.name}!`);
    } catch (err: any) {
      soundManager.error();
      setNotification(err.message || 'Purchase failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclinePurchaseDirect = async () => {
    if (!landedSpace || isProcessing) return;
    setIsProcessing(true);
    try {
      soundManager.buttonTap();
      await emit('decline-purchase', { roomCode, playerId, spaceId: landedSpace.id });
      setNotification(`Passed on ${landedSpace.name}`);
    } catch (err: any) {
      soundManager.error();
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayBail = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      soundManager.moneyReceive();
      await emit('pay-jail-bail', { roomCode, playerId });
      setNotification('Paid ₹500 bail and released from Jail');
    } catch (err: any) {
      soundManager.error();
      setNotification(err.message || 'Bail payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseJailCard = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await emit('use-jail-free-card', { roomCode, playerId });
      setNotification('Used Get Out of Jail Free card');
    } catch (err: any) {
      soundManager.error();
      setNotification(err.message || 'Failed to use card');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclareBankruptcy = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      soundManager.bankruptcy();
      await emit('declare-bankruptcy', { roomCode, playerId });
      setNotification('You declared bankruptcy');
      setConfirmBankrupt(false);
    } catch (err: any) {
      soundManager.error();
      setNotification(err.message || 'Failed to declare bankruptcy');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="card-premium p-3 border border-gold-600/30 backdrop-blur-sm space-y-2.5">
      {/* Turn indicator banner */}
      <div className="flex items-center justify-between text-xs pb-2 border-b border-emerald-800/40">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isMyTurn ? 'bg-gold-400 animate-pulse' : 'bg-emerald-600'}`} />
          <span className="font-semibold text-emerald-200">
            {isMyTurn ? 'Your Turn' : `Waiting: ${currentPlayer?.name}`}
          </span>
        </div>
        <span className="text-[11px] font-mono text-gold-300 truncate max-w-[140px]">
          {landedSpace?.name}
        </span>
      </div>

      {/* Jail status & quick release */}
      {isMyTurn && currentPlayer?.inJail && (
        <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-700/60 text-xs">
          <div className="font-bold text-red-200 mb-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-red-400" />
            <span>You are in Jail!</span>
          </div>
          <p className="text-[11px] text-red-300/80 mb-2">
            Roll doubles on your turn, or pay ₹500 bail to leave.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePayBail}
              disabled={currentPlayer.money < 500 || isProcessing}
              className="btn-primary flex-1 py-1.5 text-xs flex items-center justify-center gap-1"
            >
              <KeyRound className="w-3 h-3 text-emerald-950" />
              <span>Pay ₹500 Bail</span>
            </button>
            {currentPlayer.hasJailFreeCard && (
              <button
                onClick={handleUseJailCard}
                disabled={isProcessing}
                className="btn-secondary flex-1 py-1.5 text-xs text-gold-300 flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Use Card</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Direct Property Purchase Decision in Action Panel */}
      {isMyTurn && gameState.phase === 'postRoll' && isUnownedProperty && (
        <div className="p-2.5 rounded-xl bg-emerald-900/60 border border-gold-500/40 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gold-200 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-gold-400" />
              <span>Available Property: {landedSpace.name}</span>
            </span>
            <span className="font-mono font-bold text-gold-300">
              {formatMoney(landedSpace.price || 0)}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBuyPropertyDirect}
              disabled={!canAffordProperty || isProcessing}
              className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 ${
                canAffordProperty
                  ? 'btn-primary shadow-gold'
                  : 'bg-emerald-950/80 text-emerald-600 border border-emerald-800/40 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-950" />
              <span>Buy ({formatMoney(landedSpace.price || 0)})</span>
            </button>
            <button
              onClick={handleDeclinePurchaseDirect}
              disabled={isProcessing}
              className="btn-secondary py-2 px-3 text-xs"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Turn Actions */}
      <div className="grid grid-cols-2 gap-2">
        {/* End Turn button */}
        {isMyTurn && gameState.phase === 'postRoll' && (
          <button
            onClick={handleEndTurn}
            disabled={isProcessing}
            className="btn-primary py-2 text-xs col-span-2 flex items-center justify-center gap-1.5 shadow-gold"
          >
            <FastForward className="w-3.5 h-3.5 text-emerald-950" />
            <span>End Turn</span>
          </button>
        )}

        {/* Trade with other players */}
        <button
          onClick={() => setShowTradeModal(true)}
          className="btn-secondary py-2 text-xs flex items-center justify-center gap-1.5"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-gold-400" />
          <span>Trade</span>
        </button>

        {/* Surrender / Bankruptcy toggle */}
        {isMyTurn && !currentPlayer.isBankrupt && (
          <button
            onClick={() => setConfirmBankrupt(true)}
            className="py-2 px-3 rounded-xl border border-red-800/60 bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            <span>Surrender</span>
          </button>
        )}
      </div>

      {/* Bankruptcy confirmation banner */}
      {confirmBankrupt && (
        <div className="p-3 rounded-xl bg-red-950 border border-red-500 text-xs space-y-2">
          <p className="font-bold text-red-200">
            Declare bankruptcy and withdraw from match?
          </p>
          <p className="text-[11px] text-red-300/80">
            All your properties and funds will be surrendered.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDeclareBankruptcy}
              disabled={isProcessing}
              className="btn-danger flex-1 py-1.5 text-xs font-bold"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmBankrupt(false)}
              className="btn-secondary flex-1 py-1.5 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
