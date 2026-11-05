// Socket.IO connection hook for Navo Vyapar
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export function getSocketUrl(): string {
  // If explicitly configured via Vite env
  const envUrl = (import.meta as any)?.env?.VITE_SERVER_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim();
  }

  // Running in browser
  if (typeof window !== 'undefined') {
    // If running on Vite dev server (e.g. port 5173 / 5174), point to local backend on 3001
    const isLocalDevVite = window.location.port === '5173' || window.location.port === '5174';
    if (isLocalDevVite) {
      return `${window.location.protocol}//${window.location.hostname}:3001`;
    }
    // In production or when served by Express (like on Render), use window.location.origin
    return window.location.origin;
  }

  return 'http://localhost:3001';
}

let globalSocket: Socket | null = null;

export function getSocket(): Socket {
  if (!globalSocket) {
    const url = getSocketUrl();

    globalSocket = io(url, {
      transports: ['polling', 'websocket'], // Start with HTTP polling for immediate connection on all hosts, upgrade to websocket
      reconnection: true,
      reconnectionAttempts: 25,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });
  }
  return globalSocket;
}

export function useSocket() {
  const socketRef = useRef<Socket>(getSocket());
  const [connected, setConnected] = useState<boolean>(() => socketRef.current.connected);

  useEffect(() => {
    const socket = socketRef.current;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) {
      setConnected(true);
    } else {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const emit = useCallback((event: string, data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;

      const performEmit = () => {
        let isSettled = false;
        const timer = setTimeout(() => {
          if (!isSettled) {
            isSettled = true;
            reject(new Error('Connection timed out. Please check your network and retry.'));
          }
        }, 15000);

        socket.emit(event, data, (response: any) => {
          if (isSettled) return;
          isSettled = true;
          clearTimeout(timer);
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      };

      if (socket.connected) {
        performEmit();
      } else {
        // Socket is not yet connected; trigger connect and await 'connect' event
        socket.connect();

        let connectHandled = false;
        const connectTimeout = setTimeout(() => {
          if (!connectHandled) {
            connectHandled = true;
            socket.off('connect', onConnect);
            performEmit();
          }
        }, 3500);

        const onConnect = () => {
          if (!connectHandled) {
            connectHandled = true;
            clearTimeout(connectTimeout);
            socket.off('connect', onConnect);
            performEmit();
          }
        };

        socket.once('connect', onConnect);
      }
    });
  }, []);

  return {
    socket: socketRef.current,
    emit,
    connected,
  };
}
