'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken, initAuth } from './api';

// Determine the WebSocket server URL
// Usamos misma-origen (ruta relativa) para evitar CORB/CORS.
// Next.js rewrite proxy /socket.io/* → backend via next.config.mjs.
function getSocketUrl(): string {
  if (typeof window === 'undefined') return '';
  // Siempre usamos misma-origen — Next.js rewrite proxy /socket.io/* al backend
  return '';
}

let globalSocket: Socket | null = null;

/**
 * Event listener references for cleanup on disconnect.
 */
let onTicketCreatedRef: ((data: any) => void) | null = null;
let onNewMessageRef: ((data: any) => void) | null = null;

/**
 * Get or create the global socket connection.
 */
function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  const token = getAccessToken();
  if (!token) return null;

  if (globalSocket?.connected) return globalSocket;

  const url = getSocketUrl();
  globalSocket = io(`${url}/ws/tickets`, {
    auth: { token },
    // Solo polling — Next.js rewrites no soportan upgrades WebSocket.
    // El proxy HTTP de /socket.io/* al backend maneja el polling correctamente.
    transports: ['polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    timeout: 15000,
  });

  globalSocket.on('connect', () => {
    console.log('[TecMan WS] Conectado al servidor WebSocket');
  });

  globalSocket.on('disconnect', (reason) => {
    console.log('[TecMan WS] Desconectado:', reason);
  });

  globalSocket.on('connect_error', (err) => {
    console.warn('[TecMan WS] Error de conexión:', err.message);
  });

  globalSocket.on('error', (data) => {
    console.warn('[TecMan WS] Error:', data?.message);
  });

  return globalSocket;
}

/**
 * Hook that listens for real-time ticket events and triggers callbacks.
 *
 * @param onTicketCreated - Callback when a new ticket is created
 * @param onNewMessage - Callback when a new message arrives in a ticket
 */
export function useTicketSocket(
  onTicketCreated?: (data: any) => void,
  onNewMessage?: (data: any) => void,
) {
  const onTicketRef = useRef(onTicketCreated);
  const onMessageRef = useRef(onNewMessage);

  // Keep refs up to date
  useEffect(() => {
    onTicketRef.current = onTicketCreated;
  }, [onTicketCreated]);
  useEffect(() => {
    onMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    let mounted = true;

    const setupSocket = async () => {
      // Asegurar que tengamos un access token antes de conectar
      const authOk = await initAuth();
      if (!mounted) return;
      if (!authOk) return;

      const socket = getSocket();
      if (!socket) return;

      const handleTicketCreated = (data: any) => {
        console.log('[TecMan WS] Nuevo ticket recibido:', data?.ticket?.code);
        onTicketRef.current?.(data);
      };

      const handleNewMessage = (data: any) => {
        console.log('[TecMan WS] Nuevo mensaje:', data?.ticketId);
        onMessageRef.current?.(data);
      };

      socket.on('ticket.created', handleTicketCreated);
      socket.on('ticket.message', handleNewMessage);

      // Store refs for cleanup on disconnect
      onTicketCreatedRef = handleTicketCreated;
      onNewMessageRef = handleNewMessage;
    };

    setupSocket();

    return () => {
      mounted = false;
      if (globalSocket) {
        if (onTicketCreatedRef) {
          globalSocket.off('ticket.created', onTicketCreatedRef);
          onTicketCreatedRef = null;
        }
        if (onNewMessageRef) {
          globalSocket.off('ticket.message', onNewMessageRef);
          onNewMessageRef = null;
        }
      }
    };
  }, []);
}

/**
 * Disconnect the global socket (e.g., on logout).
 */
export function disconnectSocket() {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }
}
