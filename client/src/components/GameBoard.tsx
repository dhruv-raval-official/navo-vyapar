// GameBoard.tsx — Auto-adjusting, zero-clipping Authentic Indian/Gujarati Navo Vyapar Board
import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { TokenIcon, SpaceIcon, Home, Building2, Lock } from './Icons';
import { formatMoney, getGroupColor } from '../utils/gameUtils';
import type { Space, Player } from '../types';

const PLAYER_COLORS = ['#dc2626', '#2563eb', '#16a34a', '#d97706'];

/** Given a space index (0-39) return {row, col} in an 11×11 grid (0-indexed). */
function getGridPosition(index: number): { row: number; col: number } {
  if (index <= 10) {
    // Bottom row, right → left: space 0 = col 10, space 10 = col 0
    return { row: 10, col: 10 - index };
  } else if (index <= 19) {
    // Left column, bottom → top: space 11 = row 9, space 19 = row 1
    return { row: 10 - (index - 10), col: 0 };
  } else if (index <= 30) {
    // Top row, left → right: space 20 = col 0, space 30 = col 10
    return { row: 0, col: index - 20 };
  } else {
    // Right column, top → bottom: space 31 = row 1, space 39 = row 9
    return { row: index - 30, col: 10 };
  }
}

/** Determine which side of the board this space sits on. */
function getSide(index: number): 'bottom' | 'left' | 'top' | 'right' | 'corner' {
  if (index === 0 || index === 10 || index === 20 || index === 30) return 'corner';
  if (index < 10) return 'bottom';
  if (index < 20) return 'left';
  if (index < 30) return 'top';
  return 'right';
}

// ── Space Component ──────────────────────────────────────────────────────────

interface BoardSpaceProps {
  space: Space;
  index: number;
  playersOnSpace: Player[];
  currentPlayerId: string;
  ownership: Record<number, string>;
  allPlayers: Player[];
  boardDimension: number;
  onClick: () => void;
}

const BoardSpace: React.FC<BoardSpaceProps> = React.memo(
  ({
    space,
    index,
    playersOnSpace,
    currentPlayerId,
    ownership,
    allPlayers,
    boardDimension,
    onClick,
  }) => {
    const side = getSide(index);
    const isCorner = side === 'corner';
    const groupColor = space.group ? getGroupColor(space.group) : undefined;
    const ownerId = ownership[space.id];
    const ownerPlayer = ownerId ? allPlayers.find((p) => p.id === ownerId) : undefined;
    const ownerIndex = ownerPlayer ? allPlayers.findIndex((p) => p.id === ownerPlayer.id) : -1;
    const ownerColor = ownerIndex >= 0 ? PLAYER_COLORS[ownerIndex % PLAYER_COLORS.length] : undefined;

    const houseCount = ownerPlayer?.houses?.[space.id] ?? 0;
    const hasHotel = ownerPlayer?.hotels?.[space.id] ?? false;
    const isMortgaged = ownerPlayer?.mortgaged?.includes(space.id) ?? false;
    const isCurrentPlayerHere = playersOnSpace.some((p) => p.id === currentPlayerId);

    const isCompact = boardDimension < 460;

    // Group color stripe orientation: facing the center
    const colorStripeStyle = (): string => {
      if (!groupColor) return '';
      switch (side) {
        case 'bottom':
          return 'top-0 left-0 right-0 h-1 sm:h-1.5';
        case 'top':
          return 'bottom-0 left-0 right-0 h-1 sm:h-1.5';
        case 'left':
          return 'top-0 right-0 bottom-0 w-1 sm:w-1.5';
        case 'right':
          return 'top-0 left-0 bottom-0 w-1 sm:w-1.5';
        default:
          return '';
      }
    };

    return (
      <div
        onClick={onClick}
        className={`
          relative w-full h-full cursor-pointer select-none overflow-hidden
          border border-emerald-950/20 transition-all duration-150 flex flex-col justify-between min-w-0 min-h-0
          ${isCurrentPlayerHere ? 'ring-1.5 ring-gold-400 z-20 shadow-sm' : 'hover:brightness-95'}
          ${isMortgaged ? 'opacity-70' : ''}
        `}
        style={{
          background: isCorner
            ? 'linear-gradient(135deg, #fdfbf7 0%, #f4ede0 100%)'
            : 'linear-gradient(180deg, #fbf8f2 0%, #f1e9db 100%)',
        }}
      >
        {/* Color stripe for properties */}
        {groupColor && (
          <div
            className={`absolute z-10 ${colorStripeStyle()}`}
            style={{ backgroundColor: groupColor }}
          />
        )}

        {/* Top Badges: Owner dot & Building indicators */}
        <div className="relative z-10 w-full flex items-center justify-between px-0.5 pt-0.5 min-h-[6px] sm:min-h-[8px]">
          {/* Owner Indicator Dot */}
          {ownerColor ? (
            <div
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-white shadow-xs shrink-0"
              style={{ backgroundColor: ownerColor }}
              title={`Owned by ${ownerPlayer?.name}`}
            />
          ) : (
            <div className="w-1 h-1" />
          )}

          {/* Building indicators */}
          {hasHotel ? (
            <div className="flex items-center text-red-600 shrink-0" title="Hotel">
              <Building2 className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-red-500" />
            </div>
          ) : houseCount > 0 ? (
            <div className="flex items-center gap-0.5 text-emerald-700 shrink-0" title={`${houseCount} Houses`}>
              <Home className="w-1.5 h-1.5 sm:w-2 sm:h-2 fill-emerald-600" />
              {houseCount > 1 && (
                <span className="text-[6px] sm:text-[7.5px] font-bold leading-none">{houseCount}</span>
              )}
            </div>
          ) : null}
        </div>

        {/* Center Content: Icon, Name, Price */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-0.5 text-center my-auto min-w-0">
          {space.type !== 'property' && (
            <div className="text-emerald-900 mb-0.5 shrink-0">
              <SpaceIcon
                type={space.type}
                name={space.name}
                size={isCorner ? (isCompact ? 13 : 16) : (isCompact ? 9 : 12)}
                className="mx-auto"
              />
            </div>
          )}

          <div
            className={`
              font-bold text-emerald-950 leading-tight line-clamp-2 px-0.5 break-words max-w-full
              ${isCorner
                ? isCompact ? 'text-[7px]' : 'text-[9px] sm:text-[10px]'
                : isCompact ? 'text-[5.5px]' : 'text-[7px] sm:text-[8px]'
              }
            `}
            title={space.name}
          >
            {space.name}
          </div>

          {/* Price badge */}
          {space.price != null && space.price > 0 && (
            <div
              className={`
                font-mono font-bold text-amber-900 leading-none mt-0.5 shrink-0
                ${isCompact ? 'text-[5px]' : 'text-[6.5px] sm:text-[7.5px]'}
              `}
            >
              ₹{space.price >= 1000 ? `${(space.price / 1000).toFixed(0)}k` : space.price}
            </div>
          )}
        </div>

        {/* Mortgaged watermark */}
        {isMortgaged && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-red-950/10">
            <Lock className="w-3 h-3 text-red-800/80" />
          </div>
        )}

        {/* Token Quadrant Dock (Non-overlapping 2x2 grid) */}
        <div className="relative z-20 w-full pb-0.5 px-0.5 min-h-[8px]">
          {playersOnSpace.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-0.5 mx-auto max-w-full">
              {playersOnSpace.slice(0, 4).map((p) => {
                const pIdx = allPlayers.findIndex((ap) => ap.id === p.id);
                const isCurrentP = p.id === currentPlayerId;
                const pColor = PLAYER_COLORS[pIdx >= 0 ? pIdx % PLAYER_COLORS.length : 0];

                return (
                  <motion.div
                    key={p.id}
                    layoutId={`token-${p.id}`}
                    transition={{ type: 'spring', damping: 22, stiffness: 350 }}
                    className={`
                      ${isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'}
                      rounded-full flex items-center justify-center
                      border border-white shadow-xs shrink-0
                      ${isCurrentP ? 'ring-1 ring-gold-400 scale-110 z-30' : 'z-10'}
                    `}
                    style={{ backgroundColor: pColor }}
                    title={p.name}
                  >
                    <TokenIcon avatarId={p.avatar} size={isCompact ? 6 : 8} className="text-white" />
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
);

BoardSpace.displayName = 'BoardSpace';

// ── Center Area Component ────────────────────────────────────────────────────

interface CenterAreaProps {
  currentPlayer: Player | undefined;
  turnNumber: number;
  lastDice: [number, number];
  players: Player[];
  boardDimension: number;
}

const CenterArea: React.FC<CenterAreaProps> = React.memo(
  ({ currentPlayer, turnNumber, lastDice, players, boardDimension }) => {
    const currentIndex = currentPlayer
      ? players.findIndex((p) => p.id === currentPlayer.id)
      : 0;
    const currentColor = PLAYER_COLORS[currentIndex >= 0 ? currentIndex % PLAYER_COLORS.length : 0];

    const diceSum = lastDice ? (lastDice[0] || 0) + (lastDice[1] || 0) : 0;
    const isCompact = boardDimension < 460;

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-between p-1.5 sm:p-3 text-center pointer-events-none select-none overflow-hidden">
        {/* Heritage Header */}
        <div className="flex flex-col items-center pt-0.5">
          <div className="flex items-center gap-1 text-gold-400 text-[8px] sm:text-[10px] font-semibold tracking-widest uppercase">
            <span>❖</span>
            <span>Navo Vyapar</span>
            <span>❖</span>
          </div>
          <h1
            className={`
              font-display text-gold-300 font-black tracking-wider drop-shadow-md leading-tight
              ${isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-lg md:text-xl'}
            `}
          >
            NAVO VYAPAR
          </h1>
          <span className="text-[6.5px] sm:text-[7.5px] text-gold-400/80 tracking-wider font-medium">
            By Dhruv J Raval
          </span>
        </div>

        {/* Middle: Dice & Current Action Badge */}
        <div className="flex flex-col items-center gap-1 my-auto pointer-events-auto">
          {/* Last Dice Display */}
          {diceSum > 0 && (
            <div className="flex items-center gap-1 bg-emerald-950/80 px-2 py-0.5 sm:py-1 rounded-lg border border-gold-500/30 shadow-md">
              <span className="text-[8px] sm:text-[10px] text-emerald-200/80 font-medium">Roll:</span>
              <div className="flex items-center gap-0.5">
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-ivory-100 text-emerald-950 font-bold font-mono text-[9px] sm:text-xs flex items-center justify-center border border-gold-400">
                  {lastDice[0]}
                </span>
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-ivory-100 text-emerald-950 font-bold font-mono text-[9px] sm:text-xs flex items-center justify-center border border-gold-400">
                  {lastDice[1]}
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-bold font-mono text-gold-300 ml-0.5">
                = {diceSum}
              </span>
            </div>
          )}

          {/* Active Turn Badge */}
          {currentPlayer && (
            <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-900/90 to-emerald-800/90 px-2.5 py-0.5 sm:py-1 rounded-full border border-gold-400/60 shadow-gold">
              <div
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white shrink-0"
                style={{ backgroundColor: currentColor }}
              >
                <TokenIcon avatarId={currentPlayer.avatar} size={8} className="text-white" />
              </div>
              <span className="text-[9px] sm:text-xs font-bold text-gold-200 truncate max-w-[110px]">
                {currentPlayer.name}'s Turn
              </span>
            </div>
          )}
        </div>

        {/* Bottom: Mini Leaderboard Strip */}
        <div className="w-full max-w-[240px] bg-emerald-950/70 rounded-lg p-1 border border-emerald-800/40 pointer-events-auto">
          <div className="flex items-center justify-between text-[7px] sm:text-[8px] text-gold-400/80 px-1 mb-0.5 font-semibold">
            <span>Round {turnNumber}</span>
            <span>Leaderboard</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[7px] sm:text-[8px]">
            {players
              .filter((p) => !p.isBankrupt)
              .slice(0, 4)
              .map((p, idx) => {
                const pColor = PLAYER_COLORS[idx % PLAYER_COLORS.length];
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-1 py-0.5 rounded bg-emerald-900/40 border border-emerald-800/30"
                  >
                    <div className="flex items-center gap-1 truncate max-w-[65px]">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: pColor }} />
                      <span className="text-ivory-200 truncate">{p.name}</span>
                    </div>
                    <span className="font-mono font-bold text-gold-300 shrink-0">
                      {formatMoney(p.money)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  }
);

CenterArea.displayName = 'CenterArea';

// ── Main GameBoard Component ─────────────────────────────────────────────────

export default function GameBoard() {
  const gameState = useGameStore((s) => s.gameState);
  const boardConfig = useGameStore((s) => s.boardConfig);
  const setShowPropertyModal = useGameStore((s) => s.setShowPropertyModal);

  const containerRef = useRef<HTMLDivElement>(null);
  const [boardDimension, setBoardDimension] = useState<number>(0);

  // Auto-measure available container space to prevent any horizontal or vertical clipping
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const minDimension = Math.min(rect.width, rect.height);
      // Leave a tiny breathing margin (6px) so borders never clip against the overflow bounds
      const size = Math.max(260, Math.floor(minDimension - 6));
      setBoardDimension(size);
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(el);

    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);

  // Group players by space
  const playersBySpace = useMemo(() => {
    const map: Record<number, Player[]> = {};
    if (!gameState) return map;
    for (const player of gameState.players) {
      if (player.isBankrupt) continue;
      const pos = player.position;
      if (!map[pos]) map[pos] = [];
      map[pos].push(player);
    }
    return map;
  }, [gameState]);

  const handleSpaceClick = useCallback(
    (spaceId: number) => {
      setShowPropertyModal(spaceId);
    },
    [setShowPropertyModal]
  );

  if (!boardConfig || !gameState) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[260px]">
        <div className="text-gold-400 animate-pulse font-display text-base">
          Preparing Board…
        </div>
      </div>
    );
  }

  const spaces = boardConfig.spaces;
  const currentPlayer = gameState.players.find(
    (p) => p.id === gameState.currentPlayerId
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden min-h-0 min-w-0 p-1"
    >
      {/* Auto-sized Square Board that strictly fits both width and height */}
      <div
        className="relative select-none shrink-0"
        style={{
          width: boardDimension > 0 ? `${boardDimension}px` : '100%',
          height: boardDimension > 0 ? `${boardDimension}px` : '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          aspectRatio: '1 / 1',
          padding: boardDimension > 500 ? '4px' : '2.5px',
          background:
            'linear-gradient(135deg, #c5a55a 0%, #ecd58c 25%, #b38f42 50%, #ecd58c 75%, #a68032 100%)',
          borderRadius: boardDimension > 500 ? '14px' : '9px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(197,165,90,0.4)',
        }}
      >
        {/* Inner board felt surface */}
        <div
          className="relative w-full h-full rounded-[10px] overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at center, #1b5334 0%, #133f26 60%, #0d2e1b 100%)',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.45)',
          }}
        >
          {/* Subtle cloth texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h1v1H0zM3 3h1v1H3z\' fill=\'%23fff\' fill-opacity=\'0.5\'/%3E%3C/svg%3E")',
              backgroundRepeat: 'repeat',
            }}
          />

          {/* 11×11 Board Grid: minmax(0, 1fr) ensures columns NEVER blow past the container boundary */}
          <div
            className="relative w-full h-full grid"
            style={{
              gridTemplateColumns:
                'minmax(0, 1.4fr) repeat(9, minmax(0, 1fr)) minmax(0, 1.4fr)',
              gridTemplateRows:
                'minmax(0, 1.4fr) repeat(9, minmax(0, 1fr)) minmax(0, 1.4fr)',
            }}
          >
            {/* Render all 40 spaces */}
            {spaces.map((space, idx) => {
              const { row, col } = getGridPosition(idx);
              return (
                <div
                  key={space.id}
                  style={{
                    gridRow: row + 1,
                    gridColumn: col + 1,
                    minWidth: 0,
                    minHeight: 0,
                  }}
                >
                  <BoardSpace
                    space={space}
                    index={idx}
                    playersOnSpace={playersBySpace[idx] ?? []}
                    currentPlayerId={gameState.currentPlayerId}
                    ownership={gameState.propertyOwnership}
                    allPlayers={gameState.players}
                    boardDimension={boardDimension}
                    onClick={() => handleSpaceClick(space.id)}
                  />
                </div>
              );
            })}

            {/* Center Area (rows 2-10, cols 2-10) */}
            <div
              className="relative min-w-0 min-h-0"
              style={{
                gridRow: '2 / 11',
                gridColumn: '2 / 11',
              }}
            >
              {/* Inner ornamental gold frame */}
              <div className="absolute inset-1.5 sm:inset-2.5 border border-gold-500/25 rounded-lg pointer-events-none" />

              <CenterArea
                currentPlayer={currentPlayer}
                turnNumber={gameState.turnNumber}
                lastDice={gameState.lastDice}
                players={gameState.players}
                boardDimension={boardDimension}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
