'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useWalletStore } from '@/stores/useWalletStore';
import { usePriceStore } from '@/stores/usePriceStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/v1/ws';

interface WsPriceData {
  asset: string;
  price: number;
  timestamp: number;
  change24h?: number | undefined;
}

interface WsNotificationData {
  severity?: 'warning' | 'success' | 'governance' | 'info' | undefined;
  title: string;
  message: string;
}

interface WsIncomingMessage {
  type: string;
  channel?: string | undefined;
  payload?: Record<string, unknown> | undefined;
}

/**
 * WebSocket connection hook for real-time data updates.
 *
 * Connects when a wallet is active. Subscribes to:
 * - `prices:*` — live oracle price feeds
 * - `notifications:{party}` — private notifications for the connected wallet
 *
 * Reconnects with exponential backoff (1s, 2s, 4s, ..., max 30s).
 */
export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempt = useRef(0);

  const isConnected = useWalletStore((s) => s.isConnected);
  const party = useWalletStore((s) => s.party);
  const updatePrice = usePriceStore((s) => s.updatePrice);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const connect = useCallback(() => {
    if (!isConnected || !party) return;

    try {
      const socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        reconnectAttempt.current = 0;
        // Send auth message
        socket.send(JSON.stringify({ type: 'auth', token: 'mock-jwt-token' }));
        // Subscribe to price channel
        socket.send(JSON.stringify({ type: 'subscribe', channel: 'prices:*' }));
        // Subscribe to private notifications
        socket.send(JSON.stringify({ type: 'subscribe', channel: `notifications:${party}` }));
      };

      socket.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(String(event.data)) as WsIncomingMessage;
          if (msg.type === 'data' && msg.payload) {
            if (msg.channel?.startsWith('prices:')) {
              const payload = msg.payload as unknown as WsPriceData;
              updatePrice(payload.asset, payload.price, payload.timestamp, payload.change24h ?? 0);
            }
            if (msg.channel?.startsWith('notifications:')) {
              const payload = msg.payload as unknown as WsNotificationData;
              addNotification({
                type: payload.severity ?? 'info',
                title: payload.title,
                description: payload.message,
                timestamp: new Date().toISOString(),
              });
            }
          }
        } catch {
          // ignore parse errors
        }
      };

      socket.onclose = () => {
        ws.current = null;
        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempt.current), 30_000);
        reconnectAttempt.current++;
        reconnectTimer.current = setTimeout(connect, delay);
      };

      socket.onerror = () => {
        socket.close();
      };

      ws.current = socket;
    } catch {
      // ignore connection errors
    }
  }, [isConnected, party, updatePrice, addNotification]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: Record<string, unknown>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  return { send, isConnected: ws.current?.readyState === WebSocket.OPEN };
}
