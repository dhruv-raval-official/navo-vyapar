// Socket.IO connection hook
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const isProd = Boolean((import.meta as any)?.env?.PROD);
const SOCKET_URL = isProd
  ? ''
  : typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:3001`
  : 'http://localhost:3001';

let globalSocket: Socket | null = null;

export function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
  }
  return globalSocket;
}

export function useSocket() {
  const socketRef = useRef<Socket>(getSocket());

  useEffect(() => {
    const socket = socketRef.current;

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      // Don't disconnect on unmount - keep persistent connection
    };
  }, []);

  const emit = useCallback((event: string, data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      const timeout = setTimeout(() => reject(new Error('Socket timeout')), 10000);

      socket.emit(event, data, (response: any) => {
        clearTimeout(timeout);
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }, []);

  return {
    socket: socketRef.current,
    emit,
    connected: socketRef.current.connected,
  };
}

