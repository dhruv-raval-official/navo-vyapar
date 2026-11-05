// Navo Vyapar – Room Manager
// Manages multiplayer rooms, player connections, and reconnection tokens

const { v4: uuidv4 } = require('uuid');
const GameEngine = require('./gameEngine');

class RoomManager {
  constructor() {
    this.rooms = new Map();           // roomCode -> Room
    this.reconnectTokens = new Map(); // token -> { roomCode, playerId }
    this.socketToPlayer = new Map();  // socketId -> { roomCode, playerId }
    this.cleanupInterval = setInterval(() => this.cleanupRooms(), 60000);
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    do {
      code = '';
      for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(hostName, hostAvatar) {
    const roomCode = this.generateRoomCode();
    const playerId = uuidv4();
    const reconnectToken = uuidv4();

    const room = {
      code: roomCode,
      hostId: playerId,
      status: 'waiting', // waiting, playing, finished
      players: [{
        id: playerId,
        name: hostName,
        avatar: hostAvatar,
        ready: true,
        connected: true,
        socketId: null,
        reconnectToken,
      }],
      maxPlayers: 4,
      minPlayers: 2,
      game: null,
      chat: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    this.rooms.set(roomCode, room);
    this.reconnectTokens.set(reconnectToken, { roomCode, playerId });

    return { roomCode, playerId, reconnectToken };
  }

  joinRoom(roomCode, playerName, playerAvatar) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Room not found' };
    if (room.status !== 'waiting') return { error: 'Game already in progress' };
    if (room.players.length >= room.maxPlayers) return { error: 'Room is full' };
    if (room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
      return { error: 'Name already taken in this room' };
    }

    const playerId = uuidv4();
    const reconnectToken = uuidv4();

    room.players.push({
      id: playerId,
      name: playerName,
      avatar: playerAvatar,
      ready: false,
      connected: true,
      socketId: null,
      reconnectToken,
    });

    room.lastActivity = Date.now();
    this.reconnectTokens.set(reconnectToken, { roomCode, playerId });

    return { roomCode, playerId, reconnectToken, room: this.sanitizeRoom(room) };
  }

  reconnectPlayer(reconnectToken, socketId) {
    const tokenData = this.reconnectTokens.get(reconnectToken);
    if (!tokenData) return { error: 'Invalid reconnect token' };

    const room = this.rooms.get(tokenData.roomCode);
    if (!room) return { error: 'Room no longer exists' };

    const player = room.players.find(p => p.id === tokenData.playerId);
    if (!player) return { error: 'Player not found in room' };

    player.connected = true;
    player.socketId = socketId;
    room.lastActivity = Date.now();

    // Update game engine player state if game is active
    if (room.game) {
      const gamePlayer = room.game.getPlayer(tokenData.playerId);
      if (gamePlayer) gamePlayer.connected = true;
    }

    this.socketToPlayer.set(socketId, {
      roomCode: tokenData.roomCode,
      playerId: tokenData.playerId
    });

    return {
      roomCode: tokenData.roomCode,
      playerId: tokenData.playerId,
      room: this.sanitizeRoom(room),
      gameState: room.game ? room.game.getFullState() : null
    };
  }

  setPlayerSocket(roomCode, playerId, socketId) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.socketId = socketId;
      player.connected = true;
    }

    this.socketToPlayer.set(socketId, { roomCode, playerId });
  }

  handleDisconnect(socketId) {
    const data = this.socketToPlayer.get(socketId);
    if (!data) return null;

    const room = this.rooms.get(data.roomCode);
    if (!room) return null;

    const player = room.players.find(p => p.id === data.playerId);
    if (player) {
      player.connected = false;
      player.socketId = null;

      if (room.game) {
        const gamePlayer = room.game.getPlayer(data.playerId);
        if (gamePlayer) gamePlayer.connected = false;
      }
    }

    this.socketToPlayer.delete(socketId);
    room.lastActivity = Date.now();

    return {
      roomCode: data.roomCode,
      playerId: data.playerId,
      playerName: player ? player.name : 'Unknown',
      allDisconnected: room.players.every(p => !p.connected)
    };
  }

  setReady(roomCode, playerId, ready) {
    const code = (roomCode || '').toString().toUpperCase().trim();
    const room = this.rooms.get(code);
    if (!room) return { error: 'Room not found' };

    const player = room.players.find(p => p.id === playerId);
    if (!player) return { error: 'Player not found' };

    player.ready = ready;
    room.lastActivity = Date.now();

    return { success: true, room: this.sanitizeRoom(room) };
  }

  startGame(roomCode, playerId) {
    const code = (roomCode || '').toString().toUpperCase().trim();
    const room = this.rooms.get(code);
    if (!room) return { error: 'Room not found' };
    if (room.hostId !== playerId) return { error: 'Only the host can start the game' };
    if (room.players.length < room.minPlayers) return { error: `Need at least ${room.minPlayers} players` };
    if (!room.players.every(p => p.ready)) return { error: 'Not all players are ready' };

    room.status = 'playing';
    room.game = new GameEngine(code, room.players);
    room.lastActivity = Date.now();

    return {
      success: true,
      gameState: room.game.getFullState()
    };
  }

  getRoom(roomCode) {
    if (!roomCode) return null;
    return this.rooms.get(roomCode.toString().toUpperCase().trim());
  }

  leaveRoom(roomCode, playerId) {
    const code = (roomCode || '').toString().toUpperCase().trim();
    const room = this.rooms.get(code);
    if (!room) return { error: 'Room not found' };

    if (room.status === 'waiting') {
      room.players = room.players.filter(p => p.id !== playerId);
      // Remove reconnect token
      for (const [token, data] of this.reconnectTokens) {
        if (data.playerId === playerId) {
          this.reconnectTokens.delete(token);
          break;
        }
      }

      // If host left, transfer to next player or delete room
      if (room.hostId === playerId) {
        if (room.players.length > 0) {
          room.hostId = room.players[0].id;
          room.players[0].ready = true;
        } else {
          this.rooms.delete(roomCode);
          return { success: true, roomDeleted: true };
        }
      }

      return { success: true, room: this.sanitizeRoom(room) };
    }

    // During game, mark as disconnected but don't remove
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.connected = false;
    }
    return { success: true };
  }

  addChatMessage(roomCode, playerId, message, type = 'chat') {
    const code = (roomCode || '').toString().toUpperCase().trim();
    const room = this.rooms.get(code);
    if (!room) return { error: 'Room not found' };

    const player = room.players.find(p => p.id === playerId);
    if (!player) return { error: 'Player not found' };

    const chatMsg = {
      id: uuidv4(),
      playerId,
      playerName: player.name,
      playerAvatar: player.avatar,
      message: message.substring(0, 200), // Limit message length
      type, // 'chat', 'reaction', 'system'
      timestamp: Date.now(),
    };

    room.chat.push(chatMsg);
    if (room.chat.length > 100) room.chat = room.chat.slice(-100);

    return { success: true, chatMessage: chatMsg };
  }

  cleanupRooms() {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutes
    const gameTimeout = 4 * 60 * 60 * 1000; // 4 hours for active games

    for (const [code, room] of this.rooms) {
      const elapsed = now - room.lastActivity;
      const allDisconnected = room.players.every(p => !p.connected);

      if (allDisconnected && elapsed > timeout) {
        // Clean up reconnect tokens
        for (const p of room.players) {
          for (const [token, data] of this.reconnectTokens) {
            if (data.playerId === p.id) this.reconnectTokens.delete(token);
          }
        }
        this.rooms.delete(code);
        console.log(`Cleaned up abandoned room: ${code}`);
      } else if (elapsed > gameTimeout) {
        for (const p of room.players) {
          for (const [token, data] of this.reconnectTokens) {
            if (data.playerId === p.id) this.reconnectTokens.delete(token);
          }
        }
        this.rooms.delete(code);
        console.log(`Cleaned up expired room: ${code}`);
      }
    }
  }

  sanitizeRoom(room) {
    return {
      code: room.code,
      hostId: room.hostId,
      status: room.status,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        ready: p.ready,
        connected: p.connected,
      })),
      maxPlayers: room.maxPlayers,
      minPlayers: room.minPlayers,
    };
  }

  getStats() {
    return {
      activeRooms: this.rooms.size,
      totalPlayers: Array.from(this.rooms.values()).reduce((sum, r) => sum + r.players.length, 0),
      gamesInProgress: Array.from(this.rooms.values()).filter(r => r.status === 'playing').length,
    };
  }
}

module.exports = RoomManager;

