import React, { useEffect, useState } from 'react';
import { useGameStore, loadSession } from './store/gameStore';
import { useSocket } from './hooks/useSocket';
import { loadBoardConfig } from './utils/gameUtils';
import LandingPage from './pages/LandingPage';
import SetupPage from './pages/SetupPage';
import CreateRoomPage from './pages/CreateRoomPage';
import JoinRoomPage from './pages/JoinRoomPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import GameOverPage from './pages/GameOverPage';

export default function App() {
  const {
    screen,
    setScreen,
    setPlayerInfo,
    setPlayerId,
    setRoomCode,
    setReconnectToken,
    setRoom,
    setGameState,
    setBoardConfig,
    setNotification,
  } = useGameStore();

  const { socket, emit } = useSocket();
  const [reconnecting, setReconnecting] = useState(false);

  // Preload board configuration
  useEffect(() => {
    loadBoardConfig()
      .then(setBoardConfig)
      .catch((err) => console.error('Failed to load board config:', err));
  }, [setBoardConfig]);

  // Attempt auto-reconnection from localStorage
  useEffect(() => {
    const session = loadSession();
    if (!session || !session.reconnectToken) return;

    setReconnecting(true);

    emit('reconnect-player', { reconnectToken: session.reconnectToken })
      .then((res: any) => {
        setReconnecting(false);
        if (res && !res.error) {
          setPlayerInfo(session.playerName, session.playerAvatar);
          setPlayerId(res.playerId);
          setRoomCode(res.roomCode);
          setReconnectToken(session.reconnectToken);

          if (res.room) setRoom(res.room);
          if (res.gameState) {
            setGameState(res.gameState);
            setScreen('game');
          } else {
            setScreen('lobby');
          }
          setNotification('Reconnected successfully!');
        }
      })
      .catch((err) => {
        setReconnecting(false);
        console.log('Session expired or server restarted:', err);
      });
  }, [emit, setPlayerInfo, setPlayerId, setRoomCode, setReconnectToken, setRoom, setGameState, setScreen, setNotification]);

  // Check URL query param for instant join: ?room=XXXXXX
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && screen === 'landing') {
      setScreen('setup');
    }
  }, [screen, setScreen]);

  if (reconnecting) {
    return (
      <div className="min-h-screen bg-emerald-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 border-4 border-gold-400 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-display font-bold gold-text">Reconnecting to Match...</h2>
        <p className="text-emerald-300/70 text-xs mt-1">Restoring your Navo Vyapar session...</p>
      </div>
    );
  }

  switch (screen) {
    case 'landing':
      return <LandingPage />;
    case 'setup':
      return <SetupPage />;
    case 'createRoom':
      return <CreateRoomPage />;
    case 'joinRoom':
      return <JoinRoomPage />;
    case 'lobby':
      return <LobbyPage />;
    case 'game':
      return <GamePage />;
    case 'gameOver':
      return <GameOverPage />;
    default:
      return <LandingPage />;
  }
}
