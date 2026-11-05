import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useSocket } from '../hooks/useSocket';
import { formatMoney, getGroupColor } from '../utils/gameUtils';
import { soundManager } from '../utils/sounds';
import {
  TokenIcon,
  SpaceIcon,
  Home,
  Building,
  MapPin,
  X,
  Lock,
  Coins,
  Sparkles,
} from './Icons';
import type { Space } from '../types';

function getSpaceLore(space: Space): string {
  switch (space.name) {
    case 'Mehsana':
      return 'Renowned for the 11th-century Sun Temple of Modhera and Dudhsagar Dairy, Mehsana is the thriving cultural and agricultural powerhouse of North Gujarat.';
    case 'Ahmedabad':
      return "India's first UNESCO World Heritage City, celebrated for the historic Sabarmati riverfront, ancient pols, and world-famous textile heritage.";
    case 'Surat':
      return 'The Diamond and Silk City of India, cutting 90% of the world’s diamonds and globally famed for vibrant trade and legendary food culture.';
    case 'Mumbai':
      return 'The Financial Capital of India and gateway of commerce, boasting Dalal Street, Marine Drive, and legendary entrepreneurial energy.';
    case 'Somnath':
      return 'The sacred shore temple housing the first of the twelve holy Jyotirlingas, overlooking the Arabian Sea with timeless majesty.';
    case 'Dwarka':
      return 'Ancient golden kingdom of Lord Krishna, featuring the sacred Dwarkadhish temple and auspicious pilgrimage ghats.';
    case 'Patan':
      return 'Historic capital of Solanki kings, world-famous for the UNESCO stepwell Rani Ki Vav and masterfully woven double-ikat Patola saris.';
    case 'Kutch (Rann)':
      return 'The magnificent white salt desert hosting the world-famous Rann Utsav, celebrated for mirror-work handicrafts and moonlit beauty.';
    case 'Statue of Unity':
      return 'Standing 182 meters tall near Kevadia, the world’s tallest monument honors Iron Man of India Sardar Vallabhbhai Patel.';
    case 'Vadodara':
      return 'Cultural capital of Gujarat, home to Maharaja Sayajirao Gaekwad’s magnificent Laxmi Vilas Palace and thriving fine arts.';
    case 'Gandhinagar':
      return 'The lush green capital city of Gujarat, home to the monumental Akshardham temple complex and wide tree-lined boulevards.';
    case 'Anand':
      return 'The milk capital of India and birthplace of the White Revolution, where the pioneering Amul cooperative empowered millions of farmers.';
    case 'Rajkot':
      return 'Vibrant industrial center of Saurashtra, renowned for intricate gold craftsmanship, diesel engineering, and Mahatma Gandhi’s early schooling.';
    case 'Jamnagar':
      return 'The Jewel of Kathiawar, famous for vibrant bandhani tie-dye textiles, brass manufacturing, and rich marine sanctuaries.';
    case 'Bhavnagar':
      return 'Historic coastal princely state on the Gulf of Khambhat, gateway to the sacred 863 Jain temples atop Shetrunjaya hills in Palitana.';
    case 'Junagadh':
      return 'Ancient city of nawabs with the Uparkot Fort, sacred Girnar peak, and the only natural sanctuary for Asiatic Lions in the world.';
    case 'Porbandar':
      return 'Historic port city on the Arabian Sea, revered as the peaceful birthplace of Mahatma Gandhi and his childhood friend Sudama.';
    case 'Bhuj':
      return 'Heart of Kutch culture featuring Aina Mahal and Prag Mahal, celebrated worldwide for intricate embroidery and desert resilience.';
    case 'Mandvi':
      return 'Historic wooden shipbuilding port on the Arabian Sea, celebrated for its 400-year-old dhow yards and the grand Vijay Vilas Palace.';
    case 'Rajpipla':
      return 'Picturesque former princely kingdom on the banks of River Narmada, famed for royal heritage and lush teak forests.';
    case 'Western Railway':
      return 'One of the busiest railway networks in India, connecting Gujarat’s industrial corridors to the rest of the nation.';
    case 'Central Railway':
      return 'The historic core of the Indian Railway network, linking commercial hubs across Maharashtra, Gujarat, and central India.';
    case 'Northern Railway':
      return 'Expansive transport network connecting Western India to Delhi, Punjab, and the Himalayan foothills.';
    case 'Southern Railway':
      return 'Historic railway division connecting Gujarat’s commercial ports and goods down into the southern peninsula.';
    case 'Electricity Board':
      return 'Essential power utility powering Gujarat’s booming factories, urban centers, and rural agrarian networks.';
    case 'Water Works':
      return 'Critical water utility channeling life-giving waters from the Narmada canal network across the state.';
    case 'Start':
      return 'The auspicious beginning of the board. Every complete circuit around Gujarat awards you ₹2,000 salary from the Bank!';
    case 'Jail':
      return 'The penalty lockup. While inside, you cannot move until you roll doubles, pay ₹500 bail, or use a Get Out of Jail Free card!';
    case 'Rest House':
      return 'A welcoming highway dharamshala where weary merchants rest freely without paying any rent or property taxes.';
    case 'Go To Jail':
      return 'Caught red-handed! Move directly to the Jail space immediately without passing Start or collecting your salary.';
    case 'Income Tax':
      return 'Civic assessment on earnings. Pay ₹2,000 directly to the central treasury to support state infrastructure.';
    case 'Wealth Tax':
      return 'Luxury duty on accumulated capital. Pay ₹1,000 tax directly to the central bank.';
    case 'Naseeb (Chance)':
      return 'Test your merchant destiny! Draw a Chance card that may reward you with surprise market dividends or fines.';
    case 'Samaj Seva (Community)':
      return 'Community fund and civic welfare. Draw a card for community awards, bank dividends, or social welfare assessments.';
    default:
      return space.landmark || space.description || 'Historic landmark and merchant space in Navo Vyapar.';
  }
}

export default function PropertyModal() {
  const {
    showPropertyModal,
    setShowPropertyModal,
    gameState,
    boardConfig,
    playerId,
    roomCode,
    setNotification,
  } = useGameStore();

  const { emit } = useSocket();

  if (showPropertyModal === null || !boardConfig || !gameState) return null;

  const space = boardConfig.spaces.find((s) => s.id === showPropertyModal);
  if (!space) return null;

  const isBuyable = space.type === 'property' || space.type === 'railway' || space.type === 'utility';
  const ownerId = gameState.propertyOwnership[space.id];
  const owner = ownerId ? gameState.players.find((p) => p.id === ownerId) : null;
  const isOwner = ownerId === playerId;
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isCurrentTurn = currentPlayer?.id === playerId;
  const isLandedOnSpace = currentPlayer?.position === space.id;
  const isMortgaged = owner?.mortgaged?.includes(space.id);
  const houseCount = owner?.houses?.[space.id] || 0;
  const hasHotel = owner?.hotels?.[space.id];

  // Check monopoly
  const groupSpaces = space.group
    ? boardConfig.spaces.filter((s) => s.type === 'property' && s.group === space.group)
    : [];
  const ownsFullGroup =
    isOwner &&
    groupSpaces.length > 0 &&
    groupSpaces.every((s) => gameState.propertyOwnership[s.id] === playerId);

  const canBuyNow =
    isBuyable &&
    !ownerId &&
    isCurrentTurn &&
    isLandedOnSpace &&
    gameState.phase === 'postRoll';

  const canBuildHouse =
    isOwner &&
    space.type === 'property' &&
    ownsFullGroup &&
    !isMortgaged &&
    !hasHotel &&
    (currentPlayer?.money || 0) >= (space.houseCost || 0);

  const canMortgage = isOwner && !isMortgaged && houseCount === 0 && !hasHotel;
  const unmortgageCost = space.mortgage ? Math.floor(space.mortgage * 1.1) : 0;
  const canUnmortgage = isOwner && isMortgaged && (currentPlayer?.money || 0) >= unmortgageCost;

  // Actions
  const handleBuy = async () => {
    try {
      soundManager.propertyBuy();
      await emit('buy-property', { roomCode, playerId, spaceId: space.id });
      setNotification(`Purchased ${space.name}!`);
      setShowPropertyModal(null);
    } catch (err: any) {
      soundManager.error();
      setNotification(err.message || 'Purchase failed');
    }
  };

  const handleDecline = async () => {
    try {
      soundManager.buttonTap();
      await emit('decline-purchase', { roomCode, playerId, spaceId: space.id });
      setNotification(`Passed on ${space.name}`);
      setShowPropertyModal(null);
    } catch (err: any) {
      soundManager.error();
    }
  };

  const handleBuild = async () => {
    try {
      soundManager.buildHouse();
      await emit('build-house', { roomCode, playerId, spaceId: space.id });
      setNotification(`Building added to ${space.name}!`);
    } catch (err: any) {
      soundManager.error();
      setNotification(err.message || 'Build failed');
    }
  };

  const handleMortgage = async () => {
    try {
      soundManager.moneyReceive();
      await emit('mortgage-property', { roomCode, playerId, spaceId: space.id });
      setNotification(`Mortgaged ${space.name} for ₹${space.mortgage}`);
    } catch (err: any) {
      soundManager.error();
      setNotification(err.message || 'Mortgage failed');
    }
  };

  const handleUnmortgage = async () => {
    try {
      soundManager.moneyReceive();
      await emit('unmortgage-property', { roomCode, playerId, spaceId: space.id });
      setNotification(`Unmortgaged ${space.name}`);
    } catch (err: any) {
      soundManager.error();
      setNotification(err.message || 'Unmortgage failed');
    }
  };

  const headerColor = space.group ? getGroupColor(space.group) : '#1e3a2b';
  const groupName = space.group ? boardConfig.colorGroups[space.group]?.name : '';
  const loreText = getSpaceLore(space);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs"
        onClick={() => setShowPropertyModal(null)}
      >
        <motion.div
          initial={{ scale: 0.94, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.94, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-ivory-100 text-emerald-950 max-w-sm w-full rounded-2xl shadow-2xl border-2 border-gold-500 overflow-hidden"
        >
          {/* Header */}
          <div
            className="p-3.5 sm:p-4 text-center text-white relative shadow-inner"
            style={{ backgroundColor: headerColor }}
          >
            <div className="text-[10px] uppercase font-bold tracking-widest opacity-90 flex items-center justify-center gap-1">
              <SpaceIcon type={space.type} name={space.name} size={14} className="text-white" />
              <span>{isBuyable ? 'TITLE DEED' : 'LANDMARK & SPACE'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-black tracking-wide mt-0.5">
              {space.name}
            </h2>
            {groupName && (
              <div className="text-[11px] font-medium opacity-90">{groupName}</div>
            )}
            <button
              onClick={() => setShowPropertyModal(null)}
              className="absolute top-2.5 right-2.5 text-white/80 hover:text-white p-1 rounded-full transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-3.5 sm:p-4 text-xs space-y-2.5 font-medium max-h-[75vh] overflow-y-auto">
            {/* Landmark Tag */}
            {space.landmark && (
              <div className="text-center text-[11px] text-emerald-900 bg-ivory-300/70 py-1 px-2.5 rounded-lg flex items-center justify-center gap-1 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{space.landmark}</span>
              </div>
            )}

            {/* 1-2 Line Heritage / Cultural Lore Box */}
            <div className="p-2.5 rounded-xl bg-ivory-200/80 border border-gold-500/30 text-emerald-900 text-[11px] leading-relaxed flex items-start gap-2 shadow-xs">
              <Sparkles className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
              <p className="flex-1">{loreText}</p>
            </div>

            {/* Rent Table for properties */}
            {space.type === 'property' && space.rent && (
              <div className="border border-emerald-900/20 rounded-xl overflow-hidden bg-ivory-200/50">
                <div className="flex justify-between py-1 px-2.5 border-b border-emerald-900/10">
                  <span>Site Rent (Base)</span>
                  <span className="font-bold font-mono">{formatMoney(space.rent[0])}</span>
                </div>
                <div className="flex justify-between py-1 px-2.5 border-b border-emerald-900/10 text-emerald-900">
                  <span className="flex items-center gap-1">
                    <Home className="w-3 h-3 text-emerald-700" />
                    <span>With 1 House</span>
                  </span>
                  <span className="font-bold font-mono">{formatMoney(space.rent[1])}</span>
                </div>
                <div className="flex justify-between py-1 px-2.5 border-b border-emerald-900/10 text-emerald-900">
                  <span className="flex items-center gap-1">
                    <Home className="w-3 h-3 text-emerald-700" />
                    <span>With 2 Houses</span>
                  </span>
                  <span className="font-bold font-mono">{formatMoney(space.rent[2])}</span>
                </div>
                <div className="flex justify-between py-1 px-2.5 border-b border-emerald-900/10 text-emerald-900">
                  <span className="flex items-center gap-1">
                    <Home className="w-3 h-3 text-emerald-700" />
                    <span>With 3 Houses</span>
                  </span>
                  <span className="font-bold font-mono">{formatMoney(space.rent[3])}</span>
                </div>
                <div className="flex justify-between py-1 px-2.5 border-b border-emerald-900/10 text-emerald-900">
                  <span className="flex items-center gap-1">
                    <Home className="w-3 h-3 text-emerald-700" />
                    <span>With 4 Houses</span>
                  </span>
                  <span className="font-bold font-mono">{formatMoney(space.rent[4])}</span>
                </div>
                <div className="flex justify-between py-1.5 px-2.5 bg-gold-500/20 font-bold text-emerald-950">
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-red-600" />
                    <span>With Hotel</span>
                  </span>
                  <span className="font-bold font-mono">{formatMoney(space.rent[5])}</span>
                </div>
              </div>
            )}

            {/* Railway Schedule */}
            {space.type === 'railway' && (
              <div className="border border-emerald-900/20 rounded-xl p-2.5 bg-ivory-200/50 space-y-1">
                <div className="font-bold text-center text-xs mb-1">Railway Fare Schedule</div>
                <div className="flex justify-between"><span>1 Railway Owned:</span><span className="font-mono">₹250</span></div>
                <div className="flex justify-between"><span>2 Railways Owned:</span><span className="font-mono">₹500</span></div>
                <div className="flex justify-between"><span>3 Railways Owned:</span><span className="font-mono">₹1,000</span></div>
                <div className="flex justify-between font-bold"><span>4 Railways Owned:</span><span className="font-mono">₹2,000</span></div>
              </div>
            )}

            {/* Utility Schedule */}
            {space.type === 'utility' && (
              <div className="border border-emerald-900/20 rounded-xl p-2.5 bg-ivory-200/50 text-center space-y-1">
                <div className="font-bold text-xs">Utility Rates</div>
                <p className="text-[11px] text-emerald-800">
                  1 Utility Owned: Dice Roll × 4<br />
                  2 Utilities Owned: Dice Roll × 10
                </p>
              </div>
            )}

            {/* Special Spaces Effect Banner */}
            {!isBuyable && (
              <div className="p-2.5 rounded-xl bg-emerald-900/10 border border-emerald-900/20 text-center space-y-1">
                <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                  Board Effect
                </div>
                <p className="text-xs font-bold text-emerald-950">
                  {space.description || 'Special action space on the Navo Vyapar board.'}
                </p>
              </div>
            )}

            {/* Financial Details (Buyable spaces) */}
            {isBuyable && (
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="bg-ivory-200/80 p-2 rounded-lg">
                  <span className="text-emerald-850 block text-[10px]">Purchase Cost:</span>
                  <span className="font-bold font-mono text-emerald-950">{formatMoney(space.price || 0)}</span>
                </div>
                <div className="bg-ivory-200/80 p-2 rounded-lg">
                  <span className="text-emerald-850 block text-[10px]">Mortgage Value:</span>
                  <span className="font-bold font-mono text-emerald-950">{formatMoney(space.mortgage || 0)}</span>
                </div>
                {space.houseCost && (
                  <div className="bg-ivory-200/80 p-2 rounded-lg col-span-2 flex justify-between items-center">
                    <span className="text-emerald-850 text-[10px]">House/Hotel Cost:</span>
                    <span className="font-bold font-mono text-emerald-950">{formatMoney(space.houseCost)} each</span>
                  </div>
                )}
              </div>
            )}

            {/* Ownership Status (Buyable spaces) */}
            {isBuyable && (
              <div className="p-2.5 rounded-xl bg-ivory-300/80 border border-gold-600/30 flex items-center justify-between">
                <span className="text-emerald-900 font-semibold">Owner:</span>
                {owner ? (
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <TokenIcon avatarId={owner.avatar} size={14} className="text-emerald-800" />
                    <span>{owner.name}</span>
                    {isMortgaged && (
                      <span className="text-red-700 text-[10px] flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        <span>(Mortgaged)</span>
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-emerald-700 italic">Available from Bank</span>
                )}
              </div>
            )}

            {/* Actions for current buy decision */}
            {canBuyNow && (
              <div className="flex gap-2 pt-2 border-t border-emerald-900/10">
                <button
                  onClick={handleBuy}
                  disabled={(currentPlayer?.money || 0) < (space.price || 0)}
                  className="btn-primary flex-1 py-2 text-xs"
                >
                  Buy ({formatMoney(space.price || 0)})
                </button>
                <button
                  onClick={handleDecline}
                  className="btn-secondary flex-1 py-2 text-xs text-emerald-900 border-emerald-800/40"
                >
                  Skip
                </button>
              </div>
            )}

            {/* Actions for Owner */}
            {isOwner && (
              <div className="space-y-1.5 pt-2 border-t border-emerald-900/10">
                {canBuildHouse && (
                  <button
                    onClick={handleBuild}
                    className="w-full btn-primary py-2 text-xs flex items-center justify-center gap-1.5"
                  >
                    {houseCount === 4 ? (
                      <Building className="w-3.5 h-3.5 text-emerald-950" />
                    ) : (
                      <Home className="w-3.5 h-3.5 text-emerald-950" />
                    )}
                    <span>
                      {houseCount === 4
                        ? 'Build Hotel'
                        : `Build House (${formatMoney(space.houseCost || 0)})`}
                    </span>
                  </button>
                )}

                <div className="flex gap-2">
                  {canMortgage && (
                    <button
                      onClick={handleMortgage}
                      className="btn-secondary flex-1 py-1.5 text-xs text-red-900 border-red-700/40"
                    >
                      Mortgage (+{formatMoney(space.mortgage || 0)})
                    </button>
                  )}
                  {canUnmortgage && (
                    <button
                      onClick={handleUnmortgage}
                      className="btn-primary flex-1 py-1.5 text-xs"
                    >
                      Unmortgage (-{formatMoney(unmortgageCost)})
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
