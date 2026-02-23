'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useWalletStore } from '@/stores/useWalletStore';
import { usePriceStore } from '@/stores/usePriceStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import type { BackendNotification } from '@/stores/useNotificationStore';
import { useCompositeScoreStore } from '@/stores/useCompositeScoreStore';
import { useProductiveStore } from '@/stores/useProductiveStore';
import { useInstitutionalStore } from '@/stores/useInstitutionalStore';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/v1/ws';

interface WsPriceData {
  asset: string;
  price: number;
  timestamp: number;
  change24h?: number | undefined;
}

interface WsIncomingMessage {
  type: string;
  channel?: string | undefined;
  payload?: Record<string, unknown> | undefined;
  data?: Record<string, unknown> | undefined;
}

interface WsCompositeScoreData {
  partyId: string;
  compositeScore: number;
  tier: string;
}

interface WsProductiveProjectStatusData {
  projectId: string;
  status: string;
  timestamp: string;
}

interface WsKybStatusData {
  institutionParty: string;
  newStatus: string;
}

interface WsCorporateActionData {
  dealId: string;
  actionType: string;
  valueUSD: string;
}

interface WsPrivacyAccessData {
  partyId: string;
  requesterParty: string;
  dataScope: string;
  granted: boolean;
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
  const addFromBackend = useNotificationStore((s) => s.addFromBackend);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const compositeScoreStore = useCompositeScoreStore();
  const productiveStore = useProductiveStore();
  const institutionalStore = useInstitutionalStore();

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
        // Subscribe to innovation event channels
        socket.send(JSON.stringify({ type: 'subscribe', channel: 'composite-score' }));
        socket.send(JSON.stringify({ type: 'subscribe', channel: 'corporate-actions' }));
        socket.send(JSON.stringify({ type: 'subscribe', channel: 'kyb-status' }));
        socket.send(JSON.stringify({ type: 'subscribe', channel: 'privacy-access' }));
      };

      socket.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(String(event.data)) as WsIncomingMessage;

          // Handle standard data channel messages
          if (msg.type === 'data' && msg.payload) {
            if (msg.channel?.startsWith('prices:')) {
              const payload = msg.payload as unknown as WsPriceData;
              updatePrice(payload.asset, payload.price, payload.timestamp, payload.change24h ?? 0);
            }
            if (msg.channel?.startsWith('notifications:')) {
              const payload = msg.payload as unknown as Record<string, unknown>;

              // MP20: Handle new structured notification from NotificationBus
              if (payload.type === 'notification' && payload.data) {
                addFromBackend(payload.data as unknown as BackendNotification);
                return;
              }

              // MP20: Handle unread count update
              if (payload.type === 'unread_count' && typeof (payload.data as Record<string, unknown>)?.count === 'number') {
                setUnreadCount((payload.data as Record<string, unknown>).count as number);
                return;
              }

              // MP20: Handle mark_read confirmation
              if (payload.type === 'mark_read' && typeof (payload.data as Record<string, unknown>)?.notificationId === 'string') {
                markAsRead((payload.data as Record<string, unknown>).notificationId as string);
                return;
              }

              // Legacy: handle old-style WS notifications (health_warning, liquidation_alert)
              const legacyPayload = payload as { severity?: string; title?: string; message?: string };
              if (legacyPayload.title && legacyPayload.message) {
                addNotification({
                  type: (legacyPayload.severity as 'warning' | 'success' | 'governance' | 'info') ?? 'info',
                  title: legacyPayload.title,
                  description: legacyPayload.message,
                  timestamp: new Date().toISOString(),
                });
              }
            }
          }

          // Handle innovation events
          if (msg.type === 'composite_score_updated' && msg.payload) {
            const payload = msg.payload as unknown as WsCompositeScoreData;
            compositeScoreStore.fetchCompositeScore();
            addNotification({
              type: 'info',
              title: 'Credit Score Updated',
              description: `Composite score updated to ${payload.compositeScore} (${payload.tier})`,
              timestamp: new Date().toISOString(),
            });
          }

          if (msg.type === 'productive_project_status' && msg.payload) {
            const payload = msg.payload as unknown as WsProductiveProjectStatusData;
            productiveStore.fetchProjects();
            addNotification({
              type: 'info',
              title: 'Project Status Updated',
              description: `Project ${payload.projectId} status changed to ${payload.status}`,
              timestamp: new Date().toISOString(),
            });
          }

          if (msg.type === 'corporate_action_pending' && msg.payload) {
            const payload = msg.payload as unknown as WsCorporateActionData;
            addNotification({
              type: 'warning',
              title: 'Corporate Action Pending',
              description: `${payload.actionType} action pending for deal ${payload.dealId} ($${payload.valueUSD})`,
              timestamp: new Date().toISOString(),
            });
          }

          if (msg.type === 'kyb_status_changed' && msg.payload) {
            const payload = msg.payload as unknown as WsKybStatusData;
            institutionalStore.fetchInstitutionStatus();
            addNotification({
              type: payload.newStatus === 'approved' ? 'success' : 'info',
              title: 'KYB Status Changed',
              description: `Institution KYB status changed to ${payload.newStatus}`,
              timestamp: new Date().toISOString(),
            });
          }

          if (msg.type === 'privacy_access_attempt' && msg.payload) {
            const payload = msg.payload as unknown as WsPrivacyAccessData;
            addNotification({
              type: payload.granted ? 'info' : 'warning',
              title: 'Privacy Access Attempt',
              description: `${payload.requesterParty} ${payload.granted ? 'accessed' : 'was denied access to'} ${payload.dataScope} data`,
              timestamp: new Date().toISOString(),
            });
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
  }, [isConnected, party, updatePrice, addNotification, addFromBackend, setUnreadCount, markAsRead, compositeScoreStore, productiveStore, institutionalStore]);

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
