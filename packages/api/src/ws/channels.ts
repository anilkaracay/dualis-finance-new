import type { WebSocket } from '@fastify/websocket';
import type { WsChannel } from '@dualis/shared';
import { createChildLogger } from '../config/logger.js';

const log = createChildLogger('channels');

/** Metadata tracked per connected WebSocket client */
interface SocketMeta {
  partyId: string | null;
  authenticated: boolean;
}

/**
 * Manages WebSocket channel subscriptions, authentication state, and message broadcasting.
 *
 * Channels follow the naming convention defined by {@link WsChannel}:
 * - `prices:<asset>` — public price feeds
 * - `pool:<poolId>` — public pool updates
 * - `position:<positionId>` — authenticated, position health
 * - `notifications:<partyId>` — authenticated, party-scoped notifications
 * - `liquidations` — public liquidation events
 * - `sec-lending:offers` — public sec-lending offers
 * - `sec-lending:deal:<dealId>` — authenticated deal updates
 * - `governance:votes` — public governance vote updates
 */
class ChannelManager {
  /** channel name -> set of subscribed sockets */
  private channels = new Map<string, Set<WebSocket>>();
  /** socket -> per-connection metadata */
  private socketMeta = new Map<WebSocket, SocketMeta>();

  // ---------------------------------------------------------------------------
  // Connection lifecycle
  // ---------------------------------------------------------------------------

  /** Register a newly connected socket with default (unauthenticated) metadata. */
  register(socket: WebSocket): void {
    this.socketMeta.set(socket, { partyId: null, authenticated: false });
  }

  /** Mark a socket as authenticated and associate it with a party. */
  authenticate(socket: WebSocket, partyId: string): void {
    const meta = this.socketMeta.get(socket);
    if (meta) {
      meta.partyId = partyId;
      meta.authenticated = true;
    }
  }

  /** Returns whether the given socket has been authenticated. */
  isAuthenticated(socket: WebSocket): boolean {
    return this.socketMeta.get(socket)?.authenticated ?? false;
  }

  /** Returns the party identifier for an authenticated socket, or `null`. */
  getPartyId(socket: WebSocket): string | null {
    return this.socketMeta.get(socket)?.partyId ?? null;
  }

  // ---------------------------------------------------------------------------
  // Subscriptions
  // ---------------------------------------------------------------------------

  /**
   * Subscribe a socket to a channel.
   *
   * Private channels require prior authentication and, where applicable, the
   * requesting party must own the resource.
   *
   * @returns `true` if the subscription succeeded, `false` if access was denied.
   */
  subscribe(channel: string, socket: WebSocket): boolean {
    if (this.isPrivateChannel(channel) && !this.canAccessChannel(socket, channel)) {
      return false;
    }

    let subscribers = this.channels.get(channel);
    if (!subscribers) {
      subscribers = new Set<WebSocket>();
      this.channels.set(channel, subscribers);
    }
    subscribers.add(socket);

    log.debug({ channel, subscribers: subscribers.size }, 'Socket subscribed');
    return true;
  }

  /** Unsubscribe a socket from a specific channel. */
  unsubscribe(channel: string, socket: WebSocket): void {
    const subscribers = this.channels.get(channel);
    if (subscribers) {
      subscribers.delete(socket);
      if (subscribers.size === 0) {
        this.channels.delete(channel);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Broadcasting
  // ---------------------------------------------------------------------------

  /** Send a JSON payload to every subscriber of the given channel. */
  broadcast(channel: string, payload: unknown): void {
    const subscribers = this.channels.get(channel);
    if (!subscribers || subscribers.size === 0) return;

    const message = JSON.stringify({ type: 'data', channel, payload });

    for (const socket of subscribers) {
      if (socket.readyState === 1) {
        // WebSocket.OPEN
        socket.send(message);
      }
    }
  }

  /** Convenience helper to send a payload to the party-scoped notification channel. */
  broadcastToParty(partyId: string, payload: unknown): void {
    const channel: WsChannel = `notifications:${partyId}`;
    this.broadcast(channel, payload);
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  /** Remove a socket from all channels and discard its metadata. */
  removeSocket(socket: WebSocket): void {
    for (const [channel, subscribers] of this.channels) {
      subscribers.delete(socket);
      if (subscribers.size === 0) {
        this.channels.delete(channel);
      }
    }
    this.socketMeta.delete(socket);
  }

  // ---------------------------------------------------------------------------
  // Introspection
  // ---------------------------------------------------------------------------

  /** Returns the number of subscribers currently listening to a channel. */
  getSubscriberCount(channel: string): number {
    return this.channels.get(channel)?.size ?? 0;
  }

  /** Returns the total number of connected sockets. */
  getConnectionCount(): number {
    return this.socketMeta.size;
  }

  // ---------------------------------------------------------------------------
  // Access control helpers
  // ---------------------------------------------------------------------------

  private isPrivateChannel(channel: string): boolean {
    return (
      channel.startsWith('position:') ||
      channel.startsWith('notifications:') ||
      channel.startsWith('sec-lending:deal:') ||
      channel === 'composite-score' ||
      channel.startsWith('productive:project:') ||
      channel === 'corporate-actions' ||
      channel === 'kyb-status' ||
      channel === 'privacy-access'
    );
  }

  private canAccessChannel(socket: WebSocket, channel: string): boolean {
    if (!this.isAuthenticated(socket)) return false;

    const partyId = this.getPartyId(socket);
    if (!partyId) return false;

    // Notification channels are strictly party-scoped
    if (channel.startsWith('notifications:')) {
      return channel === `notifications:${partyId}`;
    }

    // Position and deal channels: allow any authenticated user (simplified for mock mode).
    // In production this would verify ownership via the Canton ledger.
    return true;
  }
}

/** Singleton channel manager shared across the process. */
export const channelManager = new ChannelManager();
