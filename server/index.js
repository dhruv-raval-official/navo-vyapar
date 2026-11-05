// Navo Vyapar – Main Server
// Express + Socket.IO server serving both the API and React frontend

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const RoomManager = require('./roomManager');
const BOARD_CONFIG = require('./gameConfig');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;

// CORS for development and cross-device testing
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use(compression());
app.use(cors());
app.use(express.json());

// Room manager instance
const roomManager = new RoomManager();

// ─── API ROUTES ───
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', stats: roomManager.getStats() });
});

app.get('/api/config', (req, res) => {
  res.json(BOARD_CONFIG);
});

app.get('/api/room/:code', (req, res) => {
  const room = roomManager.getRoom(req.params.code.toUpperCase());
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(roomManager.sanitizeRoom(room));
});

// ─── SOCKET.IO EVENTS ───
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Create room
  socket.on('create-room', ({ playerName, playerAvatar }, callback) => {
    if (!playerName || playerName.trim().length < 1) {
      return callback({ error: 'Name is required' });
    }
    const result = roomManager.createRoom(playerName.trim(), playerAvatar || 'diya');
    roomManager.setPlayerSocket(result.roomCode, result.playerId, socket.id);
    socket.join(result.roomCode);
    callback(result);
    console.log(`Room ${result.roomCode} created by ${playerName}`);
  });

  // Join room
  socket.on('join-room', ({ roomCode, playerName, playerAvatar }, callback) => {
    if (!playerName || playerName.trim().length < 1) {
      return callback({ error: 'Name is required' });
    }
    if (!roomCode) return callback({ error: 'Room code is required' });

    const code = roomCode.toUpperCase().trim();
    const result = roomManager.joinRoom(code, playerName.trim(), playerAvatar || 'diya');

    if (result.error) return callback(result);

    roomManager.setPlayerSocket(code, result.playerId, socket.id);
    socket.join(code);
    callback(result);

    // Notify others in the room
    socket.to(code).emit('player-joined', {
      player: {
        id: result.playerId,
        name: playerName.trim(),
        avatar: playerAvatar || 'diya',
        ready: false,
        connected: true,
      },
      room: result.room,
    });

    console.log(`${playerName} joined room ${code}`);
  });

  // Reconnect
  socket.on('reconnect-player', ({ reconnectToken }, callback) => {
    const result = roomManager.reconnectPlayer(reconnectToken, socket.id);
    if (result.error) return callback(result);

    socket.join(result.roomCode);
    callback(result);

    const room = roomManager.getRoom(result.roomCode);
    const player = room.players.find(p => p.id === result.playerId);

    socket.to(result.roomCode).emit('player-reconnected', {
      playerId: result.playerId,
      playerName: player ? player.name : 'Unknown',
      room: roomManager.sanitizeRoom(room),
    });

    console.log(`Player reconnected to room ${result.roomCode}`);
  });

  // Set ready
  socket.on('set-ready', ({ roomCode, playerId, ready }, callback) => {
    const result = roomManager.setReady(roomCode, playerId, ready);
    if (result.error) return callback(result);

    callback(result);
    io.to(roomCode).emit('room-updated', result.room);
  });

  // Start game
  socket.on('start-game', ({ roomCode, playerId }, callback) => {
    const result = roomManager.startGame(roomCode, playerId);
    if (result.error) return callback(result);

    callback(result);
    io.to(roomCode).emit('game-started', result.gameState);
    console.log(`Game started in room ${roomCode}`);
  });

  // ─── GAME ACTIONS ───

  // Roll dice
  socket.on('roll-dice', ({ roomCode, playerId }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.game) return callback({ error: 'No active game' });

    const result = room.game.rollDice(playerId);
    if (result.error) return callback(result);

    const fullState = room.game.getFullState();
    callback({ ...result, gameState: fullState });
    io.to(roomCode).emit('dice-rolled', {
      ...result,
      gameState: fullState
    });
    io.to(roomCode).emit('game-state-update', fullState);

    // Check for game over
    if (room.game.phase === 'gameOver') {
      io.to(roomCode).emit('game-over', {
        winner: room.game.winner,
        players: room.game.players.map(p => room.game.sanitizePlayer(p)),
      });
      room.status = 'finished';
    }
  });

  // Buy property
  socket.on('buy-property', ({ roomCode, playerId, spaceId }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.game) return callback({ error: 'No active game' });

    const result = room.game.buyProperty(playerId, spaceId);
    if (result.error) return callback(result);

    callback(result);
    io.to(roomCode).emit('game-state-update', room.game.getFullState());
    io.to(roomCode).emit('property-purchased', {
      playerId,
      playerName: room.game.getPlayer(playerId)?.name,
      space: result.space,
    });
  });

  // Decline purchase
  socket.on('decline-purchase', ({ roomCode, playerId, spaceId }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.game) return callback({ error: 'No active game' });

    const result = room.game.declinePurchase(playerId, spaceId);
    if (result.error) return callback(result);

    callback(result);
    io.to(roomCode).emit('game-state-update', room.game.getFullState());
  });

  // Build house
  socket.on('build-house', ({ roomCode, playerId, spaceId }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.game) return callback({ error: 'No active game' });

    const result = room.game.buildHouse(playerId, spaceId);
    if (result.error) return callback(result);

    callback(result);
    io.to(roomCode).emit('game-state-update', room.game.getFullState());
    io.to(roomCode).emit('house-built', { playerId, spaceId });
  });

  // Sell house
  socket.on('sell-house', ({ roomCode, playerId, spaceId }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.game) return callback({ error: 'No active game' });

    const result = room.game.sellHouse(playerId, spaceId);
    if (result.error) return callback(result);

    callback(result);
    io.to(roomCode).emit('game-state-update', room.game.getFullState());
  });

  // Mortgage
  socket.on('mortgage-property', ({ roomCode, playerId, spaceId }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.game) return callback({ error: 'No active game' });

    const result = room.game.mortgageProperty(playerId, spaceId);
    if (result.error) return callback(result);

    callback(result);
    io.to(roomCode).emit('game-state-update', room.game.getFullState());
  });

  // Unmortgage
  socket.on('unmortgage-property', ({ roomCode, playerId, spaceId }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.game) return callback({ error: 'No active game' });

    const result = room.game.unmortgageProperty(playerId, spaceId);
    if (result.error) return callback(result);

    callback(result);
    io.to(roomCode).emit('game-state-update', room.game.getFullState());
  });

  // Jail actions
  socket.on('pay-jail-bail', ({ roomCode, playerId }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.game) return callback({ error: 'No active game' });

    const result = room.game.payJailBail(playerId);
    if (result.error) return callback(result);

    callback(result);
    io.to(roomCode).emit('game-state-update', room.game.getFullState());
  });

  socket.on('use-jail-free-card', ({ roomCode, playerId }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.game) return callback({ error: 'No active game' });

    const result = room.game.useJailFreeCard(playerId);
    if (result.error) return callback(result);

    callback(result);
    io.to(roomCode).emit('game-state-update', room.game.getFullState());
  });

  // Trading
  socket.on('propose-trade', ({ roomCode, fromId, toId, offer }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.game) return callback({ error: 'No active game' });

    const result = room.game.proposeTrade(fromId, toId, offer);
    if (result.error) return callback(result);

    callback(result);

    // Notify the target player
    const toPlayer = room.players.find(p => p.id === toId);
    if (toPlayer && toPlayer.socketId) {
      io.to(toPlayer.socketId).emit('trade-proposed', result.tradeOffer);
    }
    io.to(roomCode).emit('trade-notification', {
      from: room.game.getPlayer(fromId)?.name,
      to: room.game.getPlayer(toId)?.name,
    });
  });

  socket.on('respond-trade', ({ roomCode, playerId, tradeId, accept }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.game) return callback({ error: 'No active game' });

    const result = room.game.respondToTrade(playerId, tradeId, accept);
    if (result.error) return callback(result);

    callback(result);
    io.to(roomCode).emit('trade-completed', { accepted: result.accepted });
    io.to(roomCode).emit('game-state-update', room.game.getFullState());
  });

  // Bankruptcy
  socket.on('declare-bankruptcy', ({ roomCode, playerId, creditorId }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.game) return callback({ error: 'No active game' });

    const result = room.game.declareBankruptcy(playerId, creditorId);
    if (result.error) return callback(result);

    callback(result);
    io.to(roomCode).emit('player-bankrupt', {
      playerId,
      playerName: room.game.getPlayer(playerId)?.name || 'Unknown',
    });
    io.to(roomCode).emit('game-state-update', room.game.getFullState());

    if (result.gameOver) {
      io.to(roomCode).emit('game-over', {
        winner: result.winner,
        players: room.game.players.map(p => room.game.sanitizePlayer(p)),
      });
      room.status = 'finished';
    }
  });

  // End turn
  socket.on('end-turn', ({ roomCode, playerId }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.game) return callback({ error: 'No active game' });

    const result = room.game.endTurn(playerId);
    if (result.error) return callback(result);

    callback(result);
    io.to(roomCode).emit('game-state-update', room.game.getFullState());
    io.to(roomCode).emit('turn-changed', {
      nextPlayer: result.nextPlayer,
    });
  });

  // Chat
  socket.on('send-chat', ({ roomCode, playerId, message, type }, callback) => {
    const result = roomManager.addChatMessage(roomCode, playerId, message, type);
    if (result.error) return callback?.(result);

    callback?.({ success: true });
    io.to(roomCode).emit('chat-message', result.chatMessage);
  });

  // Leave room
  socket.on('leave-room', ({ roomCode, playerId }, callback) => {
    const result = roomManager.leaveRoom(roomCode, playerId);
    if (result.error) return callback?.(result);

    socket.leave(roomCode);
    callback?.(result);

    if (!result.roomDeleted) {
      const room = roomManager.getRoom(roomCode);
      if (room) {
        io.to(roomCode).emit('player-left', {
          playerId,
          room: roomManager.sanitizeRoom(room),
        });
      }
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const result = roomManager.handleDisconnect(socket.id);
    if (result) {
      io.to(result.roomCode).emit('player-disconnected', {
        playerId: result.playerId,
        playerName: result.playerName,
      });
      console.log(`${result.playerName} disconnected from ${result.roomCode}`);
    }
  });
});

// ─── SERVE REACT BUILD IN PRODUCTION ───
const distPath = path.join(__dirname, '..', 'client', 'dist');
if (process.env.NODE_ENV === 'production' || fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'Navo Vyapar API - Development Mode', stats: roomManager.getStats() });
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n[Navo Vyapar] Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   URL: http://localhost:${PORT}\n`);
});

