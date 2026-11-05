// Navo Vyapar – Server-side Game Engine
// All game state mutations happen here. The client is never trusted.

const BOARD_CONFIG = require('./gameConfig');
const { v4: uuidv4 } = require('uuid');

class GameEngine {
  constructor(roomId, players) {
    this.roomId = roomId;
    this.players = players.map((p, idx) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      money: BOARD_CONFIG.startingMoney,
      position: 0,
      properties: [],
      railroads: [],
      utilities: [],
      houses: {},       // { spaceId: count }
      hotels: {},       // { spaceId: true }
      mortgaged: [],
      inJail: false,
      jailTurns: 0,
      hasJailFreeCard: false,
      isBankrupt: false,
      turnOrder: idx,
      connected: true,
      totalWorth: BOARD_CONFIG.startingMoney,
    }));

    this.currentPlayerIndex = 0;
    this.phase = 'rolling'; // rolling, postRoll, trading, gameOver
    this.turnNumber = 1;
    this.doublesCount = 0;
    this.lastDice = [0, 0];
    this.winner = null;
    this.transactions = [];
    this.auctionState = null;
    this.tradeOffer = null;

    // Shuffle cards
    this.chanceCards = this.shuffleArray([...BOARD_CONFIG.chanceCards]);
    this.communityCards = this.shuffleArray([...BOARD_CONFIG.communityCards]);
    this.chanceIndex = 0;
    this.communityIndex = 0;

    // Property ownership map (spaceId -> playerId)
    this.propertyOwnership = {};

    this.log = [];
    this.createdAt = Date.now();
  }

  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  getSpace(position) {
    return BOARD_CONFIG.spaces[position];
  }

  getActivePlayers() {
    return this.players.filter(p => !p.isBankrupt);
  }

  // ─── DICE ROLLING ───
  rollDice(playerId) {
    const player = this.getCurrentPlayer();
    if (player.id !== playerId) {
      return { error: 'Not your turn' };
    }
    if (this.phase !== 'rolling') {
      return { error: 'Cannot roll dice now' };
    }

    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const total = die1 + die2;
    const isDoubles = die1 === die2;

    this.lastDice = [die1, die2];

    // Check for jail scenarios
    if (player.inJail) {
      return this.handleJailRoll(player, die1, die2, isDoubles);
    }

    // Check for 3 doubles -> jail
    if (isDoubles) {
      this.doublesCount++;
      if (this.doublesCount >= BOARD_CONFIG.maxDoublesBeforeJail) {
        this.sendToJail(player);
        this.doublesCount = 0;
        this.phase = 'rolling';
        this.addLog(`${player.name} rolled doubles 3 times and goes to Jail!`);
        this.nextTurn();
        return {
          dice: [die1, die2],
          isDoubles: true,
          sentToJail: true,
          player: this.sanitizePlayer(player),
          message: `${player.name} rolled doubles 3 times! Go to Jail!`
        };
      }
    } else {
      this.doublesCount = 0;
    }

    // Move player
    const oldPosition = player.position;
    player.position = (player.position + total) % 40;
    const passedGo = player.position < oldPosition && player.position !== 0;

    if (passedGo || (oldPosition + total >= 40)) {
      player.money += BOARD_CONFIG.goSalary;
      this.addLog(`${player.name} passed Start and collected ₹${BOARD_CONFIG.goSalary}`);
      this.addTransaction(player.id, 'bank', BOARD_CONFIG.goSalary, 'Salary for passing Start');
    }

    const landedSpace = this.getSpace(player.position);
    const landingResult = this.handleLanding(player, landedSpace);

    this.phase = landingResult.needsAction ? 'postRoll' : 'rolling';

    // If no action needed and not doubles, end turn
    if (!landingResult.needsAction && !isDoubles) {
      this.nextTurn();
    } else if (!landingResult.needsAction && isDoubles) {
      this.phase = 'rolling'; // Roll again
    }

    this.updatePlayerWorth(player);

    return {
      dice: [die1, die2],
      isDoubles,
      canRollAgain: isDoubles && !landingResult.needsAction && !player.inJail,
      oldPosition,
      newPosition: player.position,
      passedGo,
      landedSpace: landedSpace,
      landingResult,
      player: this.sanitizePlayer(player),
      message: `${player.name} rolled ${die1}+${die2}=${total} and landed on ${landedSpace.name}`
    };
  }

  handleJailRoll(player, die1, die2, isDoubles) {
    if (isDoubles) {
      player.inJail = false;
      player.jailTurns = 0;
      // Move from jail
      const oldPos = player.position;
      player.position = (player.position + die1 + die2) % 40;
      const landedSpace = this.getSpace(player.position);
      const landingResult = this.handleLanding(player, landedSpace);
      this.phase = landingResult.needsAction ? 'postRoll' : 'rolling';
      if (!landingResult.needsAction) {
        this.nextTurn();
      }
      this.addLog(`${player.name} rolled doubles and escaped Jail!`);
      return {
        dice: [die1, die2],
        isDoubles: true,
        escapedJail: true,
        oldPosition: oldPos,
        newPosition: player.position,
        landedSpace,
        landingResult,
        player: this.sanitizePlayer(player),
        message: `${player.name} rolled doubles and escaped Jail!`
      };
    }

    player.jailTurns++;
    if (player.jailTurns >= 3) {
      // Must pay and leave
      player.money -= BOARD_CONFIG.jailBailCost;
      player.inJail = false;
      player.jailTurns = 0;
      const oldPos = player.position;
      player.position = (player.position + die1 + die2) % 40;
      const landedSpace = this.getSpace(player.position);
      const landingResult = this.handleLanding(player, landedSpace);
      this.phase = landingResult.needsAction ? 'postRoll' : 'rolling';
      if (!landingResult.needsAction) {
        this.nextTurn();
      }
      this.addLog(`${player.name} paid ₹${BOARD_CONFIG.jailBailCost} bail and left Jail`);
      this.addTransaction(player.id, 'bank', -BOARD_CONFIG.jailBailCost, 'Jail bail');
      return {
        dice: [die1, die2],
        paidBail: true,
        oldPosition: oldPos,
        newPosition: player.position,
        landedSpace,
        landingResult,
        player: this.sanitizePlayer(player),
        message: `${player.name} paid ₹${BOARD_CONFIG.jailBailCost} bail after 3 turns in Jail`
      };
    }

    this.addLog(`${player.name} failed to roll doubles in Jail (attempt ${player.jailTurns}/3)`);
    this.nextTurn();
    return {
      dice: [die1, die2],
      stayInJail: true,
      jailTurns: player.jailTurns,
      player: this.sanitizePlayer(player),
      message: `${player.name} stays in Jail (attempt ${player.jailTurns}/3)`
    };
  }

  // ─── LANDING HANDLER ───
  handleLanding(player, space) {
    switch (space.type) {
      case 'property':
        return this.handlePropertyLanding(player, space);
      case 'railway':
        return this.handleRailwayLanding(player, space);
      case 'utility':
        return this.handleUtilityLanding(player, space);
      case 'chance':
        return this.drawChanceCard(player);
      case 'community':
        return this.drawCommunityCard(player);
      case 'tax':
        return this.handleTax(player, space);
      case 'goToJail':
        this.sendToJail(player);
        return { needsAction: false, type: 'goToJail', message: `${player.name} goes to Jail!` };
      case 'go':
      case 'jail':
      case 'rest':
        return { needsAction: false, type: space.type, message: `${player.name} is on ${space.name}` };
      default:
        return { needsAction: false, type: 'unknown' };
    }
  }

  handlePropertyLanding(player, space) {
    const ownerId = this.propertyOwnership[space.id];

    if (!ownerId) {
      // Unowned – offer to buy
      return {
        needsAction: true,
        type: 'buyOffer',
        space,
        canAfford: player.money >= space.price,
        message: `${space.name} is available for ₹${space.price}`
      };
    }

    if (ownerId === player.id) {
      return { needsAction: false, type: 'ownProperty', message: `You own ${space.name}` };
    }

    // Pay rent to owner
    const owner = this.getPlayer(ownerId);
    if (owner.mortgaged.includes(space.id)) {
      return { needsAction: false, type: 'mortgagedProperty', message: `${space.name} is mortgaged – no rent` };
    }

    const rent = this.calculatePropertyRent(space, owner);
    this.transferMoney(player, owner, rent);
    this.addLog(`${player.name} paid ₹${rent} rent to ${owner.name} for ${space.name}`);
    this.addTransaction(player.id, owner.id, rent, `Rent for ${space.name}`);

    if (player.money < 0) {
      return {
        needsAction: true,
        type: 'needFunds',
        amountNeeded: Math.abs(player.money),
        creditor: owner.id,
        message: `${player.name} needs ₹${Math.abs(player.money)} more!`
      };
    }

    return {
      needsAction: false,
      type: 'paidRent',
      rent,
      to: owner.name,
      message: `${player.name} paid ₹${rent} rent to ${owner.name}`
    };
  }

  calculatePropertyRent(space, owner) {
    const hotelCount = owner.hotels[space.id] ? 1 : 0;
    const houseCount = owner.houses[space.id] || 0;

    if (hotelCount > 0) {
      return space.rent[5]; // Hotel rent
    }
    if (houseCount > 0) {
      return space.rent[houseCount]; // House rent (index 1-4)
    }

    // Check if owner has monopoly (all properties in color group)
    const group = space.group;
    const groupSpaces = BOARD_CONFIG.spaces.filter(s => s.type === 'property' && s.group === group);
    const ownsAll = groupSpaces.every(s => this.propertyOwnership[s.id] === owner.id);

    if (ownsAll) {
      return space.rent[0] * 2; // Double rent for monopoly without houses
    }

    return space.rent[0]; // Base rent
  }

  handleRailwayLanding(player, space) {
    const ownerId = this.propertyOwnership[space.id];

    if (!ownerId) {
      return {
        needsAction: true,
        type: 'buyOffer',
        space,
        canAfford: player.money >= space.price,
        message: `${space.name} is available for ₹${space.price}`
      };
    }

    if (ownerId === player.id) {
      return { needsAction: false, type: 'ownProperty', message: `You own ${space.name}` };
    }

    const owner = this.getPlayer(ownerId);
    if (owner.mortgaged.includes(space.id)) {
      return { needsAction: false, type: 'mortgagedProperty', message: `${space.name} is mortgaged` };
    }

    // Count how many railways owner has
    const railwaySpaces = BOARD_CONFIG.spaces.filter(s => s.type === 'railway');
    const ownedRailways = railwaySpaces.filter(s => this.propertyOwnership[s.id] === owner.id).length;
    const rent = space.rent[ownedRailways - 1];

    this.transferMoney(player, owner, rent);
    this.addLog(`${player.name} paid ₹${rent} to ${owner.name} for ${space.name}`);
    this.addTransaction(player.id, owner.id, rent, `Railway fee for ${space.name}`);

    if (player.money < 0) {
      return { needsAction: true, type: 'needFunds', amountNeeded: Math.abs(player.money), creditor: owner.id };
    }

    return { needsAction: false, type: 'paidRent', rent, to: owner.name, message: `Paid ₹${rent} railway fee` };
  }

  handleUtilityLanding(player, space) {
    const ownerId = this.propertyOwnership[space.id];

    if (!ownerId) {
      return {
        needsAction: true,
        type: 'buyOffer',
        space,
        canAfford: player.money >= space.price,
        message: `${space.name} is available for ₹${space.price}`
      };
    }

    if (ownerId === player.id) {
      return { needsAction: false, type: 'ownProperty' };
    }

    const owner = this.getPlayer(ownerId);
    if (owner.mortgaged.includes(space.id)) {
      return { needsAction: false, type: 'mortgagedProperty' };
    }

    const utilitySpaces = BOARD_CONFIG.spaces.filter(s => s.type === 'utility');
    const ownedUtilities = utilitySpaces.filter(s => this.propertyOwnership[s.id] === owner.id).length;
    const diceTotal = this.lastDice[0] + this.lastDice[1];
    const multiplier = ownedUtilities >= 2 ? 10 : 4;
    const rent = diceTotal * multiplier;

    this.transferMoney(player, owner, rent);
    this.addLog(`${player.name} paid ₹${rent} to ${owner.name} for ${space.name}`);
    this.addTransaction(player.id, owner.id, rent, `Utility bill for ${space.name}`);

    if (player.money < 0) {
      return { needsAction: true, type: 'needFunds', amountNeeded: Math.abs(player.money), creditor: owner.id };
    }

    return { needsAction: false, type: 'paidRent', rent, to: owner.name };
  }

  handleTax(player, space) {
    player.money -= space.amount;
    this.addLog(`${player.name} paid ₹${space.amount} tax`);
    this.addTransaction(player.id, 'bank', -space.amount, space.name);

    if (player.money < 0) {
      return { needsAction: true, type: 'needFunds', amountNeeded: Math.abs(player.money), creditor: 'bank' };
    }
    return { needsAction: false, type: 'tax', amount: space.amount };
  }

  // ─── CARD HANDLING ───
  drawChanceCard(player) {
    const card = this.chanceCards[this.chanceIndex];
    this.chanceIndex = (this.chanceIndex + 1) % this.chanceCards.length;
    if (this.chanceIndex === 0) this.chanceCards = this.shuffleArray([...this.chanceCards]);
    return this.applyCard(player, card, 'chance');
  }

  drawCommunityCard(player) {
    const card = this.communityCards[this.communityIndex];
    this.communityIndex = (this.communityIndex + 1) % this.communityCards.length;
    if (this.communityIndex === 0) this.communityCards = this.shuffleArray([...this.communityCards]);
    return this.applyCard(player, card, 'community');
  }

  applyCard(player, card, deckType) {
    this.addLog(`${player.name} drew: ${card.text}`);
    let needsAction = false;

    switch (card.type) {
      case 'collect':
        player.money += card.amount;
        this.addTransaction(player.id, 'bank', card.amount, card.text);
        break;
      case 'pay':
        player.money -= card.amount;
        this.addTransaction(player.id, 'bank', -card.amount, card.text);
        if (player.money < 0) needsAction = true;
        break;
      case 'moveTo':
        const oldPos = player.position;
        player.position = card.destination;
        if (card.destination < oldPos && card.destination !== 10) {
          player.money += BOARD_CONFIG.goSalary;
          this.addLog(`${player.name} passed Start and collected ₹${BOARD_CONFIG.goSalary}`);
        }
        // Handle landing on destination
        const destSpace = this.getSpace(card.destination);
        const landResult = this.handleLanding(player, destSpace);
        if (landResult.needsAction) needsAction = true;
        break;
      case 'goToJail':
        this.sendToJail(player);
        break;
      case 'moveBack':
        player.position = (player.position - card.spaces + 40) % 40;
        const backSpace = this.getSpace(player.position);
        const backResult = this.handleLanding(player, backSpace);
        if (backResult.needsAction) needsAction = true;
        break;
      case 'payEach':
        const activePlayers = this.getActivePlayers().filter(p => p.id !== player.id);
        activePlayers.forEach(other => {
          player.money -= card.amount;
          other.money += card.amount;
        });
        if (player.money < 0) needsAction = true;
        break;
      case 'collectEach':
        const others = this.getActivePlayers().filter(p => p.id !== player.id);
        others.forEach(other => {
          other.money -= card.amount;
          player.money += card.amount;
        });
        break;
      case 'jailFree':
        player.hasJailFreeCard = true;
        break;
    }

    return { needsAction, type: 'card', card, deckType, message: card.text };
  }

  // ─── PROPERTY ACTIONS ───
  buyProperty(playerId, spaceId) {
    const player = this.getCurrentPlayer();
    if (player.id !== playerId) return { error: 'Not your turn' };
    if (this.phase !== 'postRoll') return { error: 'Cannot buy now' };

    const space = this.getSpace(spaceId);
    if (!space || (space.type !== 'property' && space.type !== 'railway' && space.type !== 'utility')) {
      return { error: 'Not a purchasable space' };
    }
    if (this.propertyOwnership[spaceId]) {
      return { error: 'Already owned' };
    }
    if (player.position !== spaceId) {
      return { error: 'Not on this space' };
    }
    if (player.money < space.price) {
      return { error: 'Not enough money' };
    }

    player.money -= space.price;
    this.propertyOwnership[spaceId] = playerId;

    if (space.type === 'property') player.properties.push(spaceId);
    else if (space.type === 'railway') player.railroads.push(spaceId);
    else if (space.type === 'utility') player.utilities.push(spaceId);

    this.addLog(`${player.name} bought ${space.name} for ₹${space.price}`);
    this.addTransaction(playerId, 'bank', -space.price, `Purchased ${space.name}`);
    this.updatePlayerWorth(player);

    // Check for doubles (extra roll)
    this.phase = 'rolling';
    const isDoubles = this.lastDice[0] === this.lastDice[1];
    if (!isDoubles) {
      this.nextTurn();
    }

    return {
      success: true,
      space,
      player: this.sanitizePlayer(player),
      canRollAgain: isDoubles,
      message: `${player.name} purchased ${space.name} for ₹${space.price}!`
    };
  }

  declinePurchase(playerId, spaceId) {
    const player = this.getCurrentPlayer();
    if (player.id !== playerId) return { error: 'Not your turn' };
    if (this.phase !== 'postRoll') return { error: 'Cannot decline now' };

    this.addLog(`${player.name} declined to buy ${this.getSpace(spaceId).name}`);

    this.phase = 'rolling';
    const isDoubles = this.lastDice[0] === this.lastDice[1];
    if (!isDoubles) {
      this.nextTurn();
    }

    return { success: true, canRollAgain: isDoubles };
  }

  // ─── BUILDING ───
  buildHouse(playerId, spaceId) {
    const player = this.getPlayer(playerId);
    if (!player) return { error: 'Player not found' };

    const space = this.getSpace(spaceId);
    if (!space || space.type !== 'property') return { error: 'Not a property' };
    if (this.propertyOwnership[spaceId] !== playerId) return { error: 'You don\'t own this' };
    if (player.mortgaged.includes(spaceId)) return { error: 'Property is mortgaged' };

    // Check monopoly
    const group = space.group;
    const groupSpaces = BOARD_CONFIG.spaces.filter(s => s.type === 'property' && s.group === group);
    const ownsAll = groupSpaces.every(s => this.propertyOwnership[s.id] === playerId);
    if (!ownsAll) return { error: 'Need all properties in this color group' };

    // Check if any in group are mortgaged
    if (groupSpaces.some(s => player.mortgaged.includes(s.id))) {
      return { error: 'Cannot build while properties in group are mortgaged' };
    }

    const currentHouses = player.houses[spaceId] || 0;
    const hasHotel = player.hotels[spaceId];

    if (hasHotel) return { error: 'Already has a hotel' };
    if (currentHouses >= BOARD_CONFIG.housesPerHotel) {
      // Upgrade to hotel
      if (player.money < space.houseCost) return { error: 'Not enough money' };
      player.money -= space.houseCost;
      delete player.houses[spaceId];
      player.hotels[spaceId] = true;
      this.addLog(`${player.name} built a hotel on ${space.name}`);
      this.addTransaction(playerId, 'bank', -space.houseCost, `Hotel on ${space.name}`);
    } else {
      // Build house - enforce even building
      const minHouses = Math.min(...groupSpaces.map(s => player.houses[s.id] || 0));
      if (currentHouses > minHouses) return { error: 'Must build evenly across the group' };

      if (player.money < space.houseCost) return { error: 'Not enough money' };
      player.money -= space.houseCost;
      player.houses[spaceId] = currentHouses + 1;
      this.addLog(`${player.name} built house ${currentHouses + 1} on ${space.name}`);
      this.addTransaction(playerId, 'bank', -space.houseCost, `House on ${space.name}`);
    }

    this.updatePlayerWorth(player);
    return { success: true, player: this.sanitizePlayer(player), message: `Built on ${space.name}` };
  }

  sellHouse(playerId, spaceId) {
    const player = this.getPlayer(playerId);
    if (!player) return { error: 'Player not found' };

    const space = this.getSpace(spaceId);
    if (this.propertyOwnership[spaceId] !== playerId) return { error: 'You don\'t own this' };

    const hasHotel = player.hotels[spaceId];
    const currentHouses = player.houses[spaceId] || 0;

    if (hasHotel) {
      delete player.hotels[spaceId];
      player.houses[spaceId] = BOARD_CONFIG.housesPerHotel;
      player.money += Math.floor(space.houseCost / 2);
      this.addLog(`${player.name} sold hotel on ${space.name}`);
    } else if (currentHouses > 0) {
      // Enforce even selling
      const group = space.group;
      const groupSpaces = BOARD_CONFIG.spaces.filter(s => s.type === 'property' && s.group === group);
      const maxHouses = Math.max(...groupSpaces.map(s => player.houses[s.id] || 0));
      if (currentHouses < maxHouses) return { error: 'Must sell evenly across the group' };

      player.houses[spaceId] = currentHouses - 1;
      if (player.houses[spaceId] === 0) delete player.houses[spaceId];
      player.money += Math.floor(space.houseCost / 2);
      this.addLog(`${player.name} sold house on ${space.name}`);
    } else {
      return { error: 'No buildings to sell' };
    }

    this.addTransaction(playerId, 'bank', Math.floor(space.houseCost / 2), `Sold building on ${space.name}`);
    this.updatePlayerWorth(player);
    return { success: true, player: this.sanitizePlayer(player) };
  }

  // ─── MORTGAGE ───
  mortgageProperty(playerId, spaceId) {
    const player = this.getPlayer(playerId);
    if (!player) return { error: 'Player not found' };

    const space = this.getSpace(spaceId);
    if (this.propertyOwnership[spaceId] !== playerId) return { error: 'You don\'t own this' };
    if (player.mortgaged.includes(spaceId)) return { error: 'Already mortgaged' };

    // Cannot mortgage if there are buildings
    if (space.type === 'property') {
      if (player.houses[spaceId] > 0 || player.hotels[spaceId]) {
        return { error: 'Sell all buildings first' };
      }
      // Check if any property in the group has buildings
      const group = space.group;
      const groupSpaces = BOARD_CONFIG.spaces.filter(s => s.type === 'property' && s.group === group);
      if (groupSpaces.some(s => player.houses[s.id] > 0 || player.hotels[s.id])) {
        return { error: 'Sell all buildings in group first' };
      }
    }

    player.mortgaged.push(spaceId);
    player.money += space.mortgage;
    this.addLog(`${player.name} mortgaged ${space.name} for ₹${space.mortgage}`);
    this.addTransaction(playerId, 'bank', space.mortgage, `Mortgaged ${space.name}`);
    this.updatePlayerWorth(player);
    return { success: true, player: this.sanitizePlayer(player) };
  }

  unmortgageProperty(playerId, spaceId) {
    const player = this.getPlayer(playerId);
    if (!player) return { error: 'Player not found' };

    const space = this.getSpace(spaceId);
    if (this.propertyOwnership[spaceId] !== playerId) return { error: 'You don\'t own this' };
    if (!player.mortgaged.includes(spaceId)) return { error: 'Not mortgaged' };

    const cost = Math.floor(space.mortgage * (1 + BOARD_CONFIG.mortgageInterestRate));
    if (player.money < cost) return { error: 'Not enough money' };

    player.mortgaged = player.mortgaged.filter(id => id !== spaceId);
    player.money -= cost;
    this.addLog(`${player.name} unmortgaged ${space.name} for ₹${cost}`);
    this.addTransaction(playerId, 'bank', -cost, `Unmortgaged ${space.name}`);
    this.updatePlayerWorth(player);
    return { success: true, player: this.sanitizePlayer(player) };
  }

  // ─── TRADING ───
  proposeTrade(fromId, toId, offer) {
    const from = this.getPlayer(fromId);
    const to = this.getPlayer(toId);
    if (!from || !to) return { error: 'Player not found' };

    // Validate offer
    if (offer.moneyOffered && offer.moneyOffered > from.money) return { error: 'Not enough money to offer' };
    if (offer.moneyRequested && offer.moneyRequested > to.money) return { error: 'Other player cannot afford' };

    // Validate property ownership
    if (offer.propertiesOffered) {
      for (const pid of offer.propertiesOffered) {
        if (this.propertyOwnership[pid] !== fromId) return { error: 'You don\'t own offered property' };
        const space = this.getSpace(pid);
        if (space.type === 'property' && (from.houses[pid] || from.hotels[pid])) {
          return { error: 'Sell buildings before trading' };
        }
      }
    }
    if (offer.propertiesRequested) {
      for (const pid of offer.propertiesRequested) {
        if (this.propertyOwnership[pid] !== toId) return { error: 'They don\'t own requested property' };
        const space = this.getSpace(pid);
        if (space.type === 'property' && (to.houses[pid] || to.hotels[pid])) {
          return { error: 'Target has buildings on requested property' };
        }
      }
    }

    this.tradeOffer = {
      id: uuidv4(),
      from: fromId,
      to: toId,
      ...offer,
      timestamp: Date.now()
    };

    return { success: true, tradeId: this.tradeOffer.id, tradeOffer: this.tradeOffer };
  }

  respondToTrade(playerId, tradeId, accept) {
    if (!this.tradeOffer || this.tradeOffer.id !== tradeId) return { error: 'No pending trade' };
    if (this.tradeOffer.to !== playerId) return { error: 'Trade is not for you' };

    if (!accept) {
      const offer = this.tradeOffer;
      this.tradeOffer = null;
      return { success: true, accepted: false, message: 'Trade declined' };
    }

    // Execute trade
    const from = this.getPlayer(this.tradeOffer.from);
    const to = this.getPlayer(this.tradeOffer.to);
    const offer = this.tradeOffer;

    // Transfer money
    if (offer.moneyOffered) {
      from.money -= offer.moneyOffered;
      to.money += offer.moneyOffered;
    }
    if (offer.moneyRequested) {
      to.money -= offer.moneyRequested;
      from.money += offer.moneyRequested;
    }

    // Transfer properties
    if (offer.propertiesOffered) {
      offer.propertiesOffered.forEach(pid => {
        this.transferProperty(from, to, pid);
      });
    }
    if (offer.propertiesRequested) {
      offer.propertiesRequested.forEach(pid => {
        this.transferProperty(to, from, pid);
      });
    }

    this.addLog(`Trade completed between ${from.name} and ${to.name}`);
    this.updatePlayerWorth(from);
    this.updatePlayerWorth(to);

    this.tradeOffer = null;
    return { success: true, accepted: true, from: this.sanitizePlayer(from), to: this.sanitizePlayer(to) };
  }

  transferProperty(from, to, spaceId) {
    this.propertyOwnership[spaceId] = to.id;
    const space = this.getSpace(spaceId);

    const removeFromArray = (arr, val) => {
      const idx = arr.indexOf(val);
      if (idx > -1) arr.splice(idx, 1);
    };

    if (space.type === 'property') {
      removeFromArray(from.properties, spaceId);
      to.properties.push(spaceId);
    } else if (space.type === 'railway') {
      removeFromArray(from.railroads, spaceId);
      to.railroads.push(spaceId);
    } else if (space.type === 'utility') {
      removeFromArray(from.utilities, spaceId);
      to.utilities.push(spaceId);
    }

    // Transfer mortgage status
    if (from.mortgaged.includes(spaceId)) {
      removeFromArray(from.mortgaged, spaceId);
      to.mortgaged.push(spaceId);
    }
  }

  // ─── JAIL ───
  sendToJail(player) {
    player.position = 10;
    player.inJail = true;
    player.jailTurns = 0;
    this.addLog(`${player.name} was sent to Jail!`);
  }

  payJailBail(playerId) {
    const player = this.getCurrentPlayer();
    if (player.id !== playerId) return { error: 'Not your turn' };
    if (!player.inJail) return { error: 'Not in jail' };

    if (player.money < BOARD_CONFIG.jailBailCost) return { error: 'Not enough money' };

    player.money -= BOARD_CONFIG.jailBailCost;
    player.inJail = false;
    player.jailTurns = 0;
    this.phase = 'rolling';
    this.addLog(`${player.name} paid ₹${BOARD_CONFIG.jailBailCost} to leave Jail`);
    this.addTransaction(playerId, 'bank', -BOARD_CONFIG.jailBailCost, 'Jail bail');

    return { success: true, player: this.sanitizePlayer(player) };
  }

  useJailFreeCard(playerId) {
    const player = this.getCurrentPlayer();
    if (player.id !== playerId) return { error: 'Not your turn' };
    if (!player.inJail) return { error: 'Not in jail' };
    if (!player.hasJailFreeCard) return { error: 'No Get Out of Jail Free card' };

    player.hasJailFreeCard = false;
    player.inJail = false;
    player.jailTurns = 0;
    this.phase = 'rolling';
    this.addLog(`${player.name} used Get Out of Jail Free card`);

    return { success: true, player: this.sanitizePlayer(player) };
  }

  // ─── BANKRUPTCY ───
  declareBankruptcy(playerId, creditorId) {
    const player = this.getPlayer(playerId);
    if (!player) return { error: 'Player not found' };

    player.isBankrupt = true;
    this.addLog(`${player.name} declared bankruptcy!`);

    // Transfer all assets to creditor or return to bank
    if (creditorId && creditorId !== 'bank') {
      const creditor = this.getPlayer(creditorId);
      if (creditor) {
        // Transfer remaining money (if any positive)
        if (player.money > 0) {
          creditor.money += player.money;
        }
        // Transfer all properties
        [...player.properties, ...player.railroads, ...player.utilities].forEach(pid => {
          this.transferProperty(player, creditor, pid);
        });
        this.updatePlayerWorth(creditor);
      }
    } else {
      // Return all to bank
      [...player.properties, ...player.railroads, ...player.utilities].forEach(pid => {
        delete this.propertyOwnership[pid];
      });
    }

    player.money = 0;
    player.properties = [];
    player.railroads = [];
    player.utilities = [];
    player.houses = {};
    player.hotels = {};
    player.mortgaged = [];
    player.totalWorth = 0;

    // Check for winner
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length === 1) {
      this.winner = activePlayers[0].id;
      this.phase = 'gameOver';
      this.addLog(`${activePlayers[0].name} wins the game!`);
      return {
        success: true,
        gameOver: true,
        winner: this.sanitizePlayer(activePlayers[0]),
        message: `${activePlayers[0].name} wins Navo Vyapar!`
      };
    }

    // If it was current player's turn, move to next
    if (this.getCurrentPlayer().id === playerId || this.getCurrentPlayer().isBankrupt) {
      this.nextTurn();
    }

    return { success: true, player: this.sanitizePlayer(player) };
  }

  // ─── TURN MANAGEMENT ───
  nextTurn() {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length <= 1) {
      if (activePlayers.length === 1) {
        this.winner = activePlayers[0].id;
        this.phase = 'gameOver';
      }
      return;
    }

    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    } while (this.players[this.currentPlayerIndex].isBankrupt);

    this.phase = 'rolling';
    this.doublesCount = 0;
    this.turnNumber++;
  }

  endTurn(playerId) {
    const player = this.getCurrentPlayer();
    if (player.id !== playerId) return { error: 'Not your turn' };
    if (this.phase === 'postRoll') return { error: 'Must complete your action first' };

    this.nextTurn();
    return { success: true, nextPlayer: this.sanitizePlayer(this.getCurrentPlayer()) };
  }

  // ─── UTILITIES ───
  transferMoney(from, to, amount) {
    from.money -= amount;
    to.money += amount;
  }

  updatePlayerWorth(player) {
    let worth = player.money;
    [...player.properties, ...player.railroads, ...player.utilities].forEach(pid => {
      const space = this.getSpace(pid);
      if (player.mortgaged.includes(pid)) {
        worth += space.mortgage;
      } else {
        worth += space.price;
      }
      if (space.type === 'property') {
        const houses = player.houses[pid] || 0;
        const hotel = player.hotels[pid] ? 1 : 0;
        worth += (houses + hotel * 5) * space.houseCost;
      }
    });
    player.totalWorth = worth;
  }

  addLog(message) {
    this.log.push({ message, timestamp: Date.now(), turn: this.turnNumber });
    // Keep last 200 log entries
    if (this.log.length > 200) this.log = this.log.slice(-200);
  }

  addTransaction(fromId, toId, amount, description) {
    this.transactions.push({
      id: uuidv4(),
      from: fromId,
      to: toId,
      amount,
      description,
      timestamp: Date.now(),
      turn: this.turnNumber
    });
    if (this.transactions.length > 500) this.transactions = this.transactions.slice(-500);
  }

  sanitizePlayer(player) {
    return {
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      money: player.money,
      position: player.position,
      properties: player.properties,
      railroads: player.railroads,
      utilities: player.utilities,
      houses: { ...player.houses },
      hotels: { ...player.hotels },
      mortgaged: player.mortgaged,
      inJail: player.inJail,
      jailTurns: player.jailTurns,
      hasJailFreeCard: player.hasJailFreeCard,
      isBankrupt: player.isBankrupt,
      totalWorth: player.totalWorth,
      connected: player.connected,
    };
  }

  // Get full game state (for reconnection / sync)
  getFullState() {
    return {
      roomId: this.roomId,
      players: this.players.map(p => this.sanitizePlayer(p)),
      currentPlayerIndex: this.currentPlayerIndex,
      currentPlayerId: this.getCurrentPlayer().id,
      phase: this.phase,
      turnNumber: this.turnNumber,
      lastDice: this.lastDice,
      propertyOwnership: { ...this.propertyOwnership },
      winner: this.winner,
      log: this.log.slice(-50),
      transactions: this.transactions.slice(-20),
      tradeOffer: this.tradeOffer,
    };
  }
}

module.exports = GameEngine;

